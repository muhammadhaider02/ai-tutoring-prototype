import os
import requests
import asyncio
from pathlib import Path
from typing import Union, TypedDict, Annotated
from dotenv import load_dotenv
from pydub import AudioSegment
from moviepy.video.io.VideoFileClip import VideoFileClip

import chromadb
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from langchain_core.messages import HumanMessage

load_dotenv()

# .env
GITHUB_API_KEY = os.getenv("GITHUB_API_KEY")
GITHUB_API_BASE = os.getenv("GITHUB_API_BASE")

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

GLADIA_API_URL = os.getenv("GLADIA_API_URL")
GLADIA_API_KEY = os.getenv("GLADIA_API_KEY")

CHROMA_API_KEY = os.getenv("CHROMA_API_KEY")
CHROMA_TENANT = os.getenv("CHROMA_TENANT")
CHROMA_DATABASE = os.getenv("CHROMA_DATABASE")

# Chroma Client
chroma_client = chromadb.CloudClient(
    api_key=CHROMA_API_KEY,
    tenant=CHROMA_TENANT,
    database=CHROMA_DATABASE,
)

# Models
# For metadata generation (topics, subtopics, tags)
metadata_llm = ChatOpenAI(
    model="openai/gpt-4o-mini",
    api_key=GITHUB_API_KEY,
    base_url=GITHUB_API_BASE,
    temperature=0.0
)

# For main reasoning, summaries, Q&A
general_llm = ChatOpenAI(
    model="openai/gpt-4.1",
    api_key=GITHUB_API_KEY,
    base_url=GITHUB_API_BASE,
    temperature=0.2
)

embeddingModel = OpenAIEmbeddings(
    model="text-embedding-3-large",
    api_key=GITHUB_API_KEY,
    base_url=GITHUB_API_BASE
)

# # For metadata generation (topics, subtopics, tags)
# metadata_llm = ChatOpenAI(
#     model="gpt-4o-mini",
#     api_key=OPENAI_API_KEY,
#     temperature=0.0
# )

# # For main reasoning, summaries, Q&A
# general_llm = ChatOpenAI(
#     model="gpt-4.1",
#     api_key=OPENAI_API_KEY,
#     temperature=0.2
# )

# embeddingModel = OpenAIEmbeddings(
#     model="text-embedding-3-large",
#     api_key=OPENAI_API_KEY
# )

# State
class ChatState(TypedDict):
    messages: Annotated[list, "placeholder for chat messages"]
    file_path: str | None
    transcript: str | None
    retrieved_context: str | None

# Processor
class MediaProcessor:
    def __init__(self, gladia_url: str, gladia_key: str):
        if not gladia_key:
            raise ValueError("Missing GLADIA_API_KEY. Add it to your .env file.")
        self.gladia_url = gladia_url
        self.gladia_key = gladia_key

    def _to_wav_bytes(self, src: Union[str, Path]) -> tuple[bytes, str]:
        src = str(src)
        ext = Path(src).suffix.lower()
        filename_base = Path(src).stem

        if ext == ".wav":
            with open(src, "rb") as f:
                return f.read(), filename_base

        if ext == ".mp3":
            audio = AudioSegment.from_mp3(src)
            data = audio.export(format="wav").read()
        elif ext in {".mp4", ".mov", ".mkv", ".avi"}:
            video = VideoFileClip(src)
            try:
                temp_path = f"{filename_base}.wav"
                video.audio.write_audiofile(temp_path, logger=None)
                with open(temp_path, "rb") as f:
                    data = f.read()
                os.remove(temp_path)
            finally:
                video.close()
        else:
            audio = AudioSegment.from_file(src)
            data = audio.export(format="wav").read()

        return data, filename_base

    def transcribe(self, input_file: str) -> str:
        audio_bytes, filename_base = self._to_wav_bytes(input_file)

        headers = {"x-gladia-key": self.gladia_key}
        files = {
            "audio": (f"{filename_base}.wav", audio_bytes, "audio/wav"),
            "toggle_diarization": (None, "true"),
            "diarization_max_speakers": (None, "2"),
            "output_format": (None, "txt"),
        }

        resp = requests.post(self.gladia_url, headers=headers, files=files, timeout=120)

        if resp.status_code != 200:
            raise Exception(f"Error {resp.status_code}: {resp.text}")

        data = resp.json()
        transcript = data.get("prediction", "")

        # Path(input_file).with_suffix(".txt").write_text(transcript, encoding="utf-8")

        return transcript

# Metadata Generation (Parallel)
async def get_metadata(chunk_text: str, chunk_index: int, file_name: str):
    prompt = f"""
You are an assistant that labels text chunks for indexing.

Analyze the following text and return in this format only:

Topic: <main topic, ≤3 words>
Subtopics: <comma-separated short subtopics>

Text:
{chunk_text}
"""
    response = await metadata_llm.ainvoke([HumanMessage(content=prompt)])
    raw = response.content.strip()

    topic, subtopics = "Unknown", []
    for line in raw.splitlines():
        if line.startswith("Topic:"):
            topic = line.replace("Topic:", "").strip()
        elif line.startswith("Subtopics:"):
            subtopics = [s.strip() for s in line.replace("Subtopics:", "").split(",")]

    return {
        "file_name": file_name,
        "chunk_index": chunk_index,
        "topic": topic or "Unknown",
        "subtopics": subtopics or ["General"],
        # Placeholders for future expansion:
        "speaker": None,
        "timestamps": None,
    }

async def generate_metadata_parallel(chunks: list[Document], file_name: str):
    tasks = [get_metadata(doc.page_content, i, file_name) for i, doc in enumerate(chunks)]
    return await asyncio.gather(*tasks)

# Vector DB
def store_in_chroma(state: ChatState):
    """
    Split transcript into chunks, generate metadata in parallel,
    and store everything in Chroma Cloud.
    """
    import asyncio

    if not state["transcript"]:
        print("No transcript to store")
        return state

    file_name = Path(state["file_path"]).stem
    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    chunks = splitter.create_documents([state["transcript"]])

    async def process_and_store():
        # Generate metadata in parallel for all chunks
        metadata_list = await generate_metadata_parallel(chunks, file_name)

        # Create / get collection
        collection = chroma_client.get_or_create_collection("video_transcripts")

        for i, (doc, chunk_meta) in enumerate(zip(chunks, metadata_list)):
            emb = embeddingModel.embed_query(doc.page_content)

            metadata = {
                "file_name": file_name,
                "chunk_index": str(i),
                "topic": chunk_meta["topic"],
                "subtopics": ", ".join(chunk_meta["subtopics"]),
                "speaker": chunk_meta.get("speaker") or "Unknown",
                "timestamps": chunk_meta.get("timestamps") or "Unknown",
            }

            collection.add(
                ids=[f"{file_name}-chunk-{i}"],
                documents=[doc.page_content],
                embeddings=[emb],
                metadatas=[metadata],
            )

        print(f"Stored {len(chunks)} chunks into Chroma")

    asyncio.run(process_and_store())
    return state

# Main
if __name__ == "__main__":
    file_path = "t4.wav"
    processor = MediaProcessor(GLADIA_API_URL, GLADIA_API_KEY)

    transcript = processor.transcribe(file_path)

    state: ChatState = {
        "messages": [],
        "file_path": file_path,
        "transcript": transcript,
        "retrieved_context": None,
    }

    print("Transcript sample:\n", transcript[:500], "...")
    state = store_in_chroma(state)