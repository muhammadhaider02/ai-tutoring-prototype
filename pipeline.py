import os
import requests
import asyncio
import time
import random
from pathlib import Path
from typing import Union, TypedDict, Annotated
from dotenv import load_dotenv
from pydub import AudioSegment
from moviepy.video.io.VideoFileClip import VideoFileClip
import concurrent.futures
import uuid

import chromadb
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from langchain_core.messages import HumanMessage
from openai import RateLimitError

from fastapi import FastAPI, Query
from pydantic import BaseModel
import uvicorn
import datetime
import threading
import json

from langsmith import Client as LangSmithClient

load_dotenv()

# .env
GITHUB_API_KEY = os.getenv("GITHUB_API_KEY")
GITHUB_API_BASE = os.getenv("GITHUB_API_BASE")

GLADIA_API_URL = os.getenv("GLADIA_API_URL")
GLADIA_API_KEY = os.getenv("GLADIA_API_KEY")

CHROMA_API_KEY = os.getenv("CHROMA_API_KEY")
CHROMA_TENANT = os.getenv("CHROMA_TENANT")
CHROMA_DATABASE = os.getenv("CHROMA_DATABASE")

LANGSMITH_API_KEY = os.getenv("LANGSMITH_API_KEY")
LANGSMITH_PROJECT = os.getenv("LANGSMITH_PROJECT")

# Chroma Client
chroma_client = chromadb.CloudClient(
    api_key=CHROMA_API_KEY,
    tenant=CHROMA_TENANT,
    database=CHROMA_DATABASE,
)

# LangSmith Client
ls_client = None
if LANGSMITH_API_KEY:
    ls_client = LangSmithClient(api_key=LANGSMITH_API_KEY)

# Models
metadata_llm = ChatOpenAI(
    model="openai/gpt-4o-mini",
    api_key=GITHUB_API_KEY,
    base_url=GITHUB_API_BASE,
    temperature=0.0
)
general_llm = ChatOpenAI(
    model="openai/gpt-4o-mini",
    api_key=GITHUB_API_KEY,
    base_url=GITHUB_API_BASE,
    temperature=0.2
)
embeddingModel = OpenAIEmbeddings(
    model="text-embedding-3-large",
    api_key=GITHUB_API_KEY,
    base_url=GITHUB_API_BASE
)

# State
class ChatState(TypedDict):
    messages: Annotated[list, "placeholder for chat messages"]
    file_path: str | None
    transcript: str | None
    retrieved_context: str | None
    teacher_id: str
    student_id: str
    course_id: str
    session_id: str
    session_date: str
    duration_s: float

# LangSmith instrumentation helpers
def ls_start_run(name: str, inputs: dict = None, run_type: str = "chain"):
    """Start a LangSmith run if client is available"""
    if not ls_client:
        return None
    try:
        run = ls_client.create_run(
            name=name,
            run_type=run_type,
            inputs=inputs or {},
            project_name=LANGSMITH_PROJECT
        )
        # Fix: Check if run exists and has id attribute
        return run.id if run and hasattr(run, 'id') else None
    except Exception as e:
        print(f"LangSmith start run error: {e}")
        return None

def ls_end_run(run_id: str, outputs: dict = None, error: str = None):
    """End a LangSmith run if client is available"""
    if not ls_client or not run_id:
        return
    try:
        ls_client.update_run(
            run_id=run_id,
            outputs=outputs or {},
            error=error,
            end_time=datetime.datetime.now()
        )
    except Exception as e:
        print(f"LangSmith end run error: {e}")

# Processor with long-audio chunking
class MediaProcessor:
    def __init__(self, gladia_url: str, gladia_key: str):
        if not gladia_key:
            raise ValueError("Missing GLADIA_API_KEY. Add it to your .env file.")
        self.gladia_url = gladia_url
        self.gladia_key = gladia_key

    def _duration_seconds(self, src: Union[str, Path]) -> float:
        """Get duration of audio/video file in seconds"""
        src = str(src)
        ext = Path(src).suffix.lower()
        
        if ext in {".mp4", ".mov", ".mkv", ".avi"}:
            video = VideoFileClip(src)
            try:
                return video.duration or 0.0
            finally:
                video.close()
        else:
            audio = AudioSegment.from_file(src)
            return len(audio) / 1000.0

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

    def _upload_one(self, audio_bytes: bytes, filename: str) -> str:
        """Upload single audio chunk to Gladia"""
        headers = {"x-gladia-key": self.gladia_key}
        files = {
            "audio": (f"{filename}.wav", audio_bytes, "audio/wav"),
            "toggle_diarization": (None, "true"),
            "diarization_max_speakers": (None, "2"),
            "output_format": (None, "txt"),
        }
        resp = requests.post(self.gladia_url, headers=headers, files=files, timeout=600)
        if resp.status_code != 200:
            raise Exception(f"Error {resp.status_code}: {resp.text}")
        data = resp.json()
        return data.get("prediction", "")

    def _upload_chunks_parallel(self, chunks: list[tuple[bytes, str]], max_workers: int = 3) -> list[str]:
        """Upload multiple audio chunks in parallel"""
        with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
            future_to_chunk = {
                executor.submit(self._upload_one, audio_bytes, filename): i
                for i, (audio_bytes, filename) in enumerate(chunks)
            }
            
            results = [""] * len(chunks)
            for future in concurrent.futures.as_completed(future_to_chunk):
                chunk_idx = future_to_chunk[future]
                try:
                    transcript = future.result()
                    results[chunk_idx] = transcript
                except Exception as e:
                    print(f"Chunk {chunk_idx} failed: {e}")
                    results[chunk_idx] = ""
            
            return results

    def transcribe(self, input_file: str) -> str:
        duration = self._duration_seconds(input_file)
        
        # If duration > 10 minutes, split into chunks
        if duration > 600:  # 10 minutes
            return self._transcribe_long_audio(input_file, duration)
        else:
            audio_bytes, filename_base = self._to_wav_bytes(input_file)
            return self._upload_one(audio_bytes, filename_base)

    def _transcribe_long_audio(self, input_file: str, duration: float) -> str:
        """Handle long audio by splitting into ~10 minute chunks"""
        chunk_duration = 600  # 10 minutes
        chunks = []
        
        src = str(input_file)
        ext = Path(src).suffix.lower()
        filename_base = Path(src).stem
        
        if ext in {".mp4", ".mov", ".mkv", ".avi"}:
            # For video files, extract audio and split
            video = VideoFileClip(src)
            try:
                for i, start_time in enumerate(range(0, int(duration), chunk_duration)):
                    end_time = min(start_time + chunk_duration, duration)
                    chunk_audio = video.subclip(start_time, end_time).audio
                    
                    temp_path = f"{filename_base}_chunk_{i}.wav"
                    chunk_audio.write_audiofile(temp_path, logger=None)
                    
                    with open(temp_path, "rb") as f:
                        chunk_bytes = f.read()
                    
                    chunks.append((chunk_bytes, f"{filename_base}_chunk_{i}"))
                    os.remove(temp_path)
                    chunk_audio.close()
            finally:
                video.close()
        else:
            # For audio files
            audio = AudioSegment.from_file(src)
            for i, start_ms in enumerate(range(0, len(audio), chunk_duration * 1000)):
                end_ms = min(start_ms + chunk_duration * 1000, len(audio))
                chunk = audio[start_ms:end_ms]
                chunk_bytes = chunk.export(format="wav").read()
                chunks.append((chunk_bytes, f"{filename_base}_chunk_{i}"))
        
        print(f"Splitting {duration:.1f}s audio into {len(chunks)} chunks")
        
        # Upload chunks in parallel (3 at a time)
        transcripts = self._upload_chunks_parallel(chunks, max_workers=3)
        
        # Combine transcripts
        combined = "\n\n".join(filter(None, transcripts))
        return combined

# Retry helper
async def retry_with_backoff(coro, max_retries=5, base_delay=2, max_delay=30):
    for attempt in range(max_retries):
        try:
            return await coro()
        except RateLimitError:
            sleep_time = min(max_delay, base_delay * (2 ** attempt)) + random.random()
            print(f"RateLimitError: retrying in {sleep_time:.1f} seconds...")
            await asyncio.sleep(sleep_time)
    raise RuntimeError("Max retries exceeded.")

# Metadata (batched)
async def get_metadata_batch(chunks: list[Document], file_name: str, start_ix: int) -> list[dict]:
    parts = []
    for i, d in enumerate(chunks):
        ix = start_ix + i
        parts.append(f"[{ix}]\n{d.page_content}\n")
    joined = "\n---\n".join(parts)
    prompt = f"""You are labeling transcript chunks for indexing.

Rules:
- ALWAYS provide a Topic (1–3 words).
- If unsure, GUESS the most likely Topic from the text.
- NEVER leave Topic empty.
- Provide 2–5 Subtopics, comma-separated.
- Format: <ix>|Topic=<topic>|Subtopics=<list>

Chunks:
{joined}
"""
    async def call_llm():
        return await metadata_llm.ainvoke([HumanMessage(content=prompt)])
    resp = await retry_with_backoff(call_llm)
    raw = resp.content.strip().splitlines()

    out = []
    by_ix = {}
    for line in raw:
        try:
            left, topic_part, sub_part = line.split("|", 2)
            ix = int(left.strip().strip("[]")) if left.strip().startswith("[") else int(left.strip())
            topic = topic_part.replace("Topic=", "").strip() or "General Discussion"
            subtopics = sub_part.replace("Subtopics=", "").strip()
            subs = [s.strip() for s in subtopics.split(",")] if subtopics else ["General"]
            by_ix[ix] = {"topic": topic, "subtopics": subs}
        except Exception:
            try:
                ix = int(line.split("|", 1)[0])
            except Exception:
                continue
            by_ix[ix] = {"topic": "General Discussion", "subtopics": ["General"]}

    for i, _d in enumerate(chunks):
        ix = start_ix + i
        val = by_ix.get(ix, {"topic": "General Discussion", "subtopics": ["General"]})
        out.append({
            "file_name": file_name,
            "chunk_index": ix,
            "topic": val["topic"],
            "subtopics": val["subtopics"],
        })
    return out

async def generate_metadata_batched(chunks: list[Document], file_name: str, batch_size: int = 10) -> list[dict]:
    results = []
    for start in range(0, len(chunks), batch_size):
        batch = chunks[start:start+batch_size]
        data = await get_metadata_batch(batch, file_name, start_ix=start)
        results.extend(data)
    return results

def _doc_id(teacher_id, student_id, course_id, session_id):
    return f"{teacher_id}:{student_id}:{course_id}:{session_id}"

# --------- Step 5: Evaluators (with stricter prompt and optimization for long sessions) ---------
def run_evaluators(state: ChatState, metas: list[dict]):
    run_id = ls_start_run("evaluators", {"session_id": state["session_id"], "duration_s": state["duration_s"]})
    
    try:
        session_doc_id = _doc_id(
            state["teacher_id"], state["student_id"], state["course_id"], state["session_id"]
        )
        insights_col = chroma_client.get_or_create_collection("session_insights")

        prev_topics = []
        if state["session_id"].isdigit() and int(state["session_id"]) > 1:
            prev_session_id = str(int(state["session_id"]) - 1)
            # Fix: Use correct where clause structure
            prev = chroma_client.get_or_create_collection("sessions").get(where={"$and": [
                {"teacher_id": state["teacher_id"]},
                {"student_id": state["student_id"]},
                {"course_id": state["course_id"]},
                {"session_id": prev_session_id}
            ]})
            if prev and prev.get("ids"):
                prev_topics = [m.get("topic") for m in prev.get("metadatas", [])]

        # Optimization for long sessions: sample every 5th chunk for evaluators
        if state["duration_s"] > 1800:  # 30 minutes
            sampled_metas = metas[::5]  # Every 5th chunk
            print(f"Long session detected ({state['duration_s']:.1f}s), sampling {len(sampled_metas)} of {len(metas)} chunks for evaluation")
            curr_topics = [m.get("topic") for m in sampled_metas]
        else:
            curr_topics = [m.get("topic") for m in metas]

        transcript = state['transcript'] or ""
        if len(transcript) > 6000:
            transcript_for_eval = transcript[:3000] + "\n...\n" + transcript[-2500:]
        else:
            transcript_for_eval = transcript

        prompt = f"""
You are an evaluator for a tutoring session transcript.
Return STRICT JSON with exactly these keys:
- "complexity": integer 1–5
- "misconceptions": list of short recurring errors
- "engagement": object with keys:
    - "speaking_ratio": "teacher" | "student" | "balanced"
    - "question_density": "low" | "medium" | "high"
    - "turn_taking": "balanced" | "unbalanced"

Transcript:
{transcript_for_eval}
"""
        try:
            resp = general_llm.invoke([HumanMessage(content=prompt)])
            llm_result = resp.content.strip()
        except Exception:
            llm_result = '{"complexity": "N/A", "misconceptions": [], "engagement": {}}'

        insights = {
            "topic_drift": {"previous": prev_topics, "current": curr_topics},
            "llm_eval": llm_result
        }

        insights_col.upsert(
            ids=[session_doc_id],
            documents=[json.dumps(insights, ensure_ascii=False)],
            metadatas=[{
                "teacher_id": state["teacher_id"],
                "student_id": state["student_id"],
                "course_id": state["course_id"],
                "session_id": state["session_id"],
                "doc_id": session_doc_id,
                "session_date": state["session_date"],
                "duration_s": state["duration_s"]
            }],
        )
        
        ls_end_run(run_id, {"insights_generated": True})
        print(f"Successfully stored insights for session {state['session_id']}")
        
    except Exception as e:
        print(f"Evaluator error: {e}")
        ls_end_run(run_id, error=str(e))
        raise

def _run_evaluators_background(state: ChatState, metas: list[dict]):
    try:
        run_evaluators(state, metas)
    except Exception as e:
        print("Evaluator error:", e)

# --------- Step 6: Summary + Quiz ---------
def run_summary_and_quiz(state: ChatState):
    session_doc_id = _doc_id(state["teacher_id"], state["student_id"], state["course_id"], state["session_id"])
    summaries_col = chroma_client.get_or_create_collection("session_summaries")
    quizzes_col = chroma_client.get_or_create_collection("session_quizzes")

    transcript = state['transcript'] or ""
    if len(transcript) > 8000:
        head = transcript[:4000]
        tail = transcript[-3000:]
        transcript_for_gen = head + "\n...\n" + tail
    else:
        transcript_for_gen = transcript

    prompt = f"""
You are creating tutor-facing content from a tutoring session transcript.

Return VALID JSON with exactly these keys:
- "summary": a bullet list of 5–8 main points
- "quiz": a list of 5 items; each item is an object with:
    - "type": "mcq" or "short"
    - "question": string
    - if type == "mcq": include "options" (list of 4 strings) and "answer"
    - if type == "short": include "answer"

Transcript:
{transcript_for_gen}
"""
    try:
        resp = general_llm.invoke([HumanMessage(content=prompt)])
        raw = resp.content.strip()
        if raw.startswith("```"):
            raw = raw.strip("`")
            if raw.lower().startswith("json"):
                raw = raw[4:].strip()
        data = json.loads(raw)

        summary_bullets = data.get("summary", [])
        quiz_obj = data.get("quiz", [])

        summary_text = "\n".join(summary_bullets) if isinstance(summary_bullets, list) else str(summary_bullets)
        quiz_str = json.dumps(quiz_obj, ensure_ascii=False)

        summaries_col.upsert(
            ids=[session_doc_id],
            documents=[summary_text],
            metadatas=[{
                "teacher_id": state["teacher_id"],
                "student_id": state["student_id"],
                "course_id": state["course_id"],
                "session_id": state["session_id"],
                "doc_id": session_doc_id,
                "session_date": state["session_date"],
                "duration_s": state["duration_s"]
            }],
        )
        quizzes_col.upsert(
            ids=[session_doc_id],
            documents=[quiz_str],
            metadatas=[{
                "teacher_id": state["teacher_id"],
                "student_id": state["student_id"],
                "course_id": state["course_id"],
                "session_id": state["session_id"],
                "doc_id": session_doc_id,
                "session_date": state["session_date"],
                "duration_s": state["duration_s"]
            }],
        )
    except Exception as e:
        print("Summary/Quiz generation error:", e)

def _run_summary_quiz_background(state: ChatState):
    try:
        run_summary_and_quiz(state)
    except Exception as e:
        print("Background summary/quiz error:", e)

# --------- Store in Chroma (with LangSmith instrumentation and richer metadata) ---------
def store_in_chroma(state: ChatState):
    run_id = ls_start_run("store_in_chroma", {"file_path": state["file_path"], "duration_s": state["duration_s"]})
    
    try:
        if not state["transcript"]:
            print("No transcript to store")
            ls_end_run(run_id, {"stored": False, "reason": "no_transcript"})
            return state
            
        file_name = Path(state["file_path"]).stem if state["file_path"] else "unknown_file"
        splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        chunks = splitter.create_documents([state["transcript"]])
        session_doc_id = _doc_id(state["teacher_id"], state["student_id"], state["course_id"], state["session_id"])

        async def process_and_store():
            metadata_list = await generate_metadata_batched(chunks, file_name, batch_size=10)
            sessions_col = chroma_client.get_or_create_collection("sessions")
            session_docs_col = chroma_client.get_or_create_collection("session_docs")

            ids, docs, embs, metas = [], [], [], []
            for i, (doc, chunk_meta) in enumerate(zip(chunks, metadata_list)):
                row_id = f"{session_doc_id}:{i}"
                ids.append(row_id)
                docs.append(doc.page_content)
                embs.append(embeddingModel.embed_query(doc.page_content))
                metas.append({
                    "teacher_id": state["teacher_id"],
                    "student_id": state["student_id"],
                    "course_id": state["course_id"],
                    "session_id": state["session_id"],
                    "file_name": file_name,
                    "chunk_ix": i,
                    "topic": chunk_meta["topic"],
                    "subtopics": ", ".join(chunk_meta["subtopics"]),
                    "doc_id": session_doc_id,
                    "session_date": state["session_date"],
                    "duration_s": state["duration_s"]
                })
            if ids:
                sessions_col.upsert(ids=ids, documents=docs, embeddings=embs, metadatas=metas)
            session_docs_col.upsert(
                ids=[session_doc_id],
                documents=[state["transcript"]],
                metadatas=[{
                    "teacher_id": state["teacher_id"],
                    "student_id": state["student_id"],
                    "course_id": state["course_id"],
                    "session_id": state["session_id"],
                    "file_name": file_name,
                    "session_date": state["session_date"],
                    "duration_s": state["duration_s"]
                }],
            )
            print(f"Stored {len(chunks)} chunks and 1 transcript.")

            # Launch background jobs
            threading.Thread(target=_run_evaluators_background, args=(state, metas), daemon=True).start()
            threading.Thread(target=_run_summary_quiz_background, args=(state,), daemon=True).start()

        asyncio.run(process_and_store())
        ls_end_run(run_id, {"stored": True, "chunks_count": len(chunks)})
        return state
        
    except Exception as e:
        ls_end_run(run_id, error=str(e))
        raise

# --------- FastAPI Endpoints ---------
app = FastAPI()

class SemanticSearchRequest(BaseModel):
    query: str
    k: int = 5
    student_id: str | None = None
    course_id: str | None = None
    teacher_id: str | None = None
    session_id: str | None = None

@app.get("/sessions")
def list_sessions(
    student_id: str, 
    course_id: str | None = None,
    sort: str = Query(default="id", pattern="^(id|date)$")  # Fix: Changed regex to pattern
):
    session_docs = chroma_client.get_or_create_collection("session_docs")
    where = {"$and": [{"student_id": student_id}, {"course_id": course_id}]} if course_id else {"student_id": student_id}
    res = session_docs.get(where=where)
    rows = []
    for i in range(len(res.get("ids", []))):
        rows.append({
            "id": res["ids"][i],
            "metadata": res["metadatas"][i],
            "text_sample": res["documents"][i][:200],
        })
    
    # Sort by date if requested
    if sort == "date":
        rows.sort(key=lambda x: x["metadata"].get("session_date", ""), reverse=True)
    
    return rows

@app.get("/compare-sessions")
def compare_sessions(
    student_id: str,
    course_id: str,
    session_id_1: str,
    session_id_2: str
):
    """Compare top topic tags between two sessions"""
    sessions = chroma_client.get_or_create_collection("sessions")
    
    # Get topics for session 1
    res1 = sessions.get(where={"$and": [
        {"student_id": student_id},
        {"course_id": course_id},
        {"session_id": session_id_1}
    ]})
    
    # Get topics for session 2
    res2 = sessions.get(where={"$and": [
        {"student_id": student_id},
        {"course_id": course_id},
        {"session_id": session_id_2}
    ]})
    
    def extract_topics(res):
        topics = []
        if res and res.get("metadatas"):
            for meta in res["metadatas"]:
                if meta.get("topic"):
                    topics.append(meta["topic"])
        return topics
    
    topics1 = extract_topics(res1)
    topics2 = extract_topics(res2)
    
    # Count topic frequencies
    from collections import Counter
    counter1 = Counter(topics1)
    counter2 = Counter(topics2)
    
    return {
        "session_1": {
            "id": session_id_1,
            "top_topics": counter1.most_common(5)
        },
        "session_2": {
            "id": session_id_2,
            "top_topics": counter2.most_common(5)
        },
        "common_topics": list(set(topics1) & set(topics2)),
        "unique_to_session_1": list(set(topics1) - set(topics2)),
        "unique_to_session_2": list(set(topics2) - set(topics1))
    }

@app.post("/semantic-search")
def semantic_search(req: SemanticSearchRequest):
    sessions = chroma_client.get_or_create_collection("sessions")
    clauses = []
    if req.student_id: clauses.append({"student_id": req.student_id})
    if req.course_id: clauses.append({"course_id": req.course_id})
    if req.teacher_id: clauses.append({"teacher_id": req.teacher_id})
    if req.session_id: clauses.append({"session_id": req.session_id})
    where = clauses[0] if len(clauses) == 1 else ({"$and": clauses} if clauses else None)
    results = sessions.query(query_texts=[req.query], where=where, n_results=req.k)
    return results

@app.get("/summary")
def get_summary(student_id: str, course_id: str, session_id: str):
    summaries = chroma_client.get_or_create_collection("session_summaries")
    res = summaries.get(where={"$and": [
        {"student_id": student_id},
        {"course_id": course_id},
        {"session_id": session_id}
    ]})
    if res and res.get("documents"):
        return {"summary": res["documents"][0]}
    return {"error": "No summary found"}

@app.get("/quiz")
def get_quiz(student_id: str, course_id: str, session_id: str):
    quizzes = chroma_client.get_or_create_collection("session_quizzes")
    res = quizzes.get(where={"$and": [
        {"student_id": student_id},
        {"course_id": course_id},
        {"session_id": session_id}
    ]})
    if res and res.get("documents"):
        try:
            parsed = json.loads(res["documents"][0])
        except Exception:
            parsed = res["documents"][0]
        return {"quiz": parsed}
    return {"error": "No quiz found"}

@app.get("/feedback")
def get_feedback(student_id: str, course_id: str, session_id: str):
    insights = chroma_client.get_or_create_collection("session_insights")
    res = insights.get(where={"$and": [
        {"student_id": student_id},
        {"course_id": course_id},
        {"session_id": session_id}
    ]})
    if res and res.get("documents"):
        return {"feedback": res["documents"][0]}
    return {"error": "No feedback found"}

# Run
if __name__ == "__main__":
    file_path = "short2.mp4"
    processor = MediaProcessor(GLADIA_API_URL, GLADIA_API_KEY)
    
    # Get duration for the state
    duration = processor._duration_seconds(file_path)
    
    transcript = processor.transcribe(file_path)
    state: ChatState = {
        "messages": [],
        "file_path": file_path,
        "transcript": transcript,
        "retrieved_context": None,
        "teacher_id": "Adil Majeed",
        "student_id": "Jaka",
        "course_id": "Python",
        "session_id": "5",
        "session_date": datetime.datetime.now().isoformat(),
        "duration_s": duration
    }
    state = store_in_chroma(state)

    uvicorn.run(app, host="0.0.0.0", port=8000)