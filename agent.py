from langgraph.graph import StateGraph, START, END
from typing import TypedDict, Annotated
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langgraph.graph.message import add_messages
from dotenv import load_dotenv
import os
import requests

load_dotenv()

llm = ChatOpenAI(
    model="openai/gpt-4.1",
    api_key=os.environ["GITHUB_API_KEY"],
    base_url=os.environ["GITHUB_API_BASE"],
    temperature=0.7
)

embeddingModel = OpenAIEmbeddings(
    model="text-embedding-3-large",
    api_key=os.environ["GITHUB_API_KEY"],
    base_url=os.environ["GITHUB_API_BASE"]
)

# llm = ChatOpenAI(
#     model="gpt-4.1",
#     api_key=os.environ["OPENAI_API_KEY"],
#     temperature=0.7
# )

# embeddingModel = OpenAIEmbeddings(
#     model="text-embedding-3-large",
#     api_key=os.environ["OPENAI_API_KEY"]
# )

vectorStore = None

class ChatState(TypedDict):
    messages: Annotated[list[BaseMessage], add_messages]
    audio_path: str | None
    transcript: str | None
    retrieved_context: str | None

# External service keys
GLADIA_API_KEY = os.environ.get("GLADIA_API_KEY")
GLADIA_API_URL = os.environ.get("GLADIA_API_URL")

# LangSmith tracing config
os.environ["LANGSMITH_TRACING"] = os.getenv("LANGSMITH_TRACING")
os.environ["LANGSMITH_API_KEY"] = os.getenv("LANGSMITH_API_KEY")
os.environ["LANGSMITH_PROJECT"] = os.getenv("LANGSMITH_PROJECT")

# Functions
def transcribe_audio(filepath: str):
    headers = {"x-gladia-key": GLADIA_API_KEY}
    filename, ext = os.path.splitext(filepath)

    files = {
        "audio": (os.path.basename(filepath), open(filepath, "rb"), f"audio/{ext[1:]}"),
        "toggle_diarization": (None, "true"),
        "diarization_max_speakers": (None, "2"),
        "output_format": (None, "txt"),
    }

    resp = requests.post(GLADIA_API_URL, headers=headers, files=files, timeout=120)

    if resp.status_code != 200:
        raise Exception(f"Error {resp.status_code}: {resp.text}")

    return resp.json()

def format_docs(retrievedDocs):
    return "\n\n".join(doc.page_content for doc in retrievedDocs)

# Nodes
def extractTranscript(state: ChatState):
    audio_path = state['audio_path']
    if audio_path:
        try:
            print("Getting transcription...")
            result = transcribe_audio(audio_path)
            state['transcript'] = result.get("prediction", "")
        except Exception as e:
            print(f"Transcription failed: {e}")
            state['transcript'] = ""
    return state

def storeInVectorDb(state: ChatState):
    global vectorStore
    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    print("Splitting transcript into chunks...")
    chunks = splitter.create_documents([state['transcript']])

    if vectorStore is None:
        vectorStore = FAISS.from_documents(chunks, embeddingModel)
    else:
        vectorStore.add_documents(chunks)
    return state

def retrieveContext(state: ChatState):
    global vectorStore
    print("Retrieving relevant context...")
    if vectorStore is not None and state['messages']:
        query = state['messages'][-1].content
        docs = vectorStore.similarity_search(query, k=3)
        state['retrieved_context'] = format_docs(docs)
    else:
        state['retrieved_context'] = ""
    return state

def chat_node(state: ChatState):
    messages = state['messages']
    prompt = (
        "You are a helpful assistant. Answer ONLY using the following context:\n"
        f"{state.get('retrieved_context', '')}\n"
        "If the answer is not in the context, say 'I don't know.'"
    )
    full_messages = [SystemMessage(content=prompt)] + messages
    response = llm.invoke(full_messages)
    state['messages'].append(AIMessage(content=response.content))
    return state

# Graph
graph = StateGraph(ChatState)
graph.add_node("extract_transcript", extractTranscript)
graph.add_node("store_in_vector_db", storeInVectorDb)
graph.add_node("retrieve_context", retrieveContext)
graph.add_node("chat_node", chat_node)

def router(state: ChatState):
    if state.get("audio_path") and not state.get("transcript"):
        return "extract_transcript"
    elif state.get("transcript") and vectorStore is None:
        return "store_in_vector_db"
    elif state["messages"] and isinstance(state["messages"][-1], HumanMessage):
        return "retrieve_context"
    elif state["messages"] and isinstance(state["messages"][-1], AIMessage):
        return END
    else:
        return "chat_node"

graph.add_conditional_edges(START, router)
graph.add_edge("extract_transcript", "store_in_vector_db")
graph.add_edge("store_in_vector_db", "retrieve_context")
graph.add_edge("retrieve_context", "chat_node")
graph.add_conditional_edges("chat_node", router)
graph.add_edge("chat_node", END)
chatbot = graph.compile()

# Loop
state = {
    "messages": [],
    "audio_path": "input_files//t4.wav"
}
print("Type 'exit' to quit.\n")

while True:
    user_input = input("YOU: ")
    if user_input.strip().lower() == "exit":
        break

    state["messages"].append(HumanMessage(content=user_input))
    result = chatbot.invoke(state)
    state = result
    ai_reply = result["messages"][-1].content
    print(f"AI: {ai_reply}")

    state["audio_path"] = None