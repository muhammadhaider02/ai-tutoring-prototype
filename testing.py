import asyncio
import concurrent.futures
import hmac
import hashlib
import json
import os
import random
import threading
import time
import uuid
from datetime import datetime, timedelta
from pathlib import Path
from typing import Annotated, Any, Dict, List, TypedDict, Union
from urllib.parse import quote

import chromadb
import requests
from requests.adapters import HTTPAdapter
import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.responses import Response
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from langchain_core.messages import HumanMessage
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langsmith import Client as LangSmithClient
from moviepy.video.io.VideoFileClip import VideoFileClip
from openai import RateLimitError
from pydantic import BaseModel
from pydub import AudioSegment

try:
    from playwright.sync_api import sync_playwright
    PDF_EXPORT_AVAILABLE = True
except Exception as e:
    PDF_EXPORT_AVAILABLE = False
    sync_playwright = None
    print(f"Playwright PDF disabled; falling back to HTML. Reason: {e}")

load_dotenv()

app = FastAPI()

# .env
GITHUB_API_KEY = os.getenv("GITHUB_API_KEY")
GITHUB_API_BASE = os.getenv("GITHUB_API_BASE")

DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY")
DEEPGRAM_API_URL = os.getenv("DEEPGRAM_API_URL")

CHROMA_API_KEY = os.getenv("CHROMA_API_KEY")
CHROMA_TENANT = os.getenv("CHROMA_TENANT")
CHROMA_DATABASE = os.getenv("CHROMA_DATABASE")

LANGSMITH_API_KEY = os.getenv("LANGSMITH_API_KEY")
LANGSMITH_PROJECT = os.getenv("LANGSMITH_PROJECT")

SHARE_TOKEN_SECRET = os.getenv("SHARE_TOKEN_SECRET")

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Models
metadata_llm = ChatOpenAI(
    model="gpt-4o-mini",
    api_key=OPENAI_API_KEY,
    temperature=0.1
)
general_llm = ChatOpenAI(
    model="gpt-4.1",
    api_key=OPENAI_API_KEY,
    temperature=0.2
)
embeddingModel = OpenAIEmbeddings(
    model="text-embedding-3-large",
    api_key=OPENAI_API_KEY,
)

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
            end_time=datetime.now()  # Changed from datetime.datetime.now()
        )
    except Exception as e:
        print(f"LangSmith end run error: {e}")

# Processor with long-audio chunking
class MediaProcessor:
    def __init__(self, api_url=None, api_key=None):
        # Use parameters if provided, otherwise fall back to environment variables
        self._dg_api_key = api_key or os.getenv("DEEPGRAM_API_KEY")
        self._dg_url = api_url or os.getenv("DEEPGRAM_API_URL")

        if not self._dg_api_key:
            raise ValueError("Missing DEEPGRAM_API_KEY. Add it to your .env file.")

        # how many parallel uploads you run
        self._dg_workers = 8

        # --- Reuse HTTP connections (keep-alive) ---
        self._dg_session = requests.Session()
        self._dg_session.headers.update({
            "Authorization": f"Token {self._dg_api_key}",
            "Content-Type": "audio/wav"
        })

        # widen the connection pool to match your parallel workers
        adapter = HTTPAdapter(pool_connections=self._dg_workers, pool_maxsize=self._dg_workers)
        self._dg_session.mount("https://", adapter)
    
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

    def _to_text(self, x) -> str:
        # Make ANY Gladia shape safe to join
        if x is None:
            return ""
        if isinstance(x, str):
            return x
        if isinstance(x, dict):
            # common keys first
            for k in ("prediction", "text", "transcription", "result"):
                if k in x:
                    return self._to_text(x[k])
            # fallback: join stringy leaves
            return " ".join(self._to_text(v) for v in x.values()).strip()
        if isinstance(x, list):
            return " ".join(self._to_text(i) for i in x).strip()
        return str(x)

    def _upload_one(self, audio_bytes: bytes, filename: str) -> str:
        """Upload one audio chunk to Deepgram Nova-2 (batch ASR) using a keep-alive session."""
        params = {
            "model": "nova-2",
            "smart_format": "true",
            "diarize": "true",
            "punctuate": "true"
        }

        last_err = None
        for attempt in range(3):
            try:
                r = self._dg_session.post(self._dg_url, params=params, data=audio_bytes, timeout=600)
                r.raise_for_status()
                j = r.json()
                # results.channels[0].alternatives[0].transcript
                res = j.get("results", {})
                ch = (res.get("channels") or [{}])[0]
                alt = (ch.get("alternatives") or [{}])[0]
                return (alt.get("transcript") or "").strip()
            except Exception as e:
                last_err = e
                time.sleep(1.5 * (attempt + 1))
        raise last_err

    def _upload_chunks_parallel(self, chunks: list[tuple[bytes, str]]) -> list[str]:
        """Upload multiple audio chunks in parallel"""
        with concurrent.futures.ThreadPoolExecutor(max_workers=self._dg_workers) as executor:
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
        """Handle long audio by splitting into ~11 minute chunks"""
        chunk_duration = 480  # 8 minutes
        chunks = []
        
        src = str(input_file)
        ext = Path(src).suffix.lower()
        filename_base = Path(src).stem
        
        if ext in {".mp4", ".mov", ".mkv", ".avi"}:
            # For video files: extract full audio once, then chunk with pydub
            video = VideoFileClip(src)
            try:
                temp_full_wav = f"{filename_base}_full.wav"
                # downsample keeps file smaller & upload faster; Gladia accepts 16k wav
                video.audio.write_audiofile(temp_full_wav, fps=16000, logger=None)

                audio = AudioSegment.from_wav(temp_full_wav)
                for i, start_ms in enumerate(range(0, len(audio), chunk_duration * 1000)):
                    end_ms = min(start_ms + chunk_duration * 1000, len(audio))
                    chunk = audio[start_ms:end_ms]
                    chunk_bytes = chunk.export(format="wav").read()
                    chunks.append((chunk_bytes, f"{filename_base}_chunk_{i}"))
            finally:
                try:
                    video.close()
                except Exception:
                    pass
                # cleanup the temp full wav
                if os.path.exists(temp_full_wav):
                    try:
                        os.remove(temp_full_wav)
                    except Exception:
                        pass
        else:
            # For audio files
            audio = AudioSegment.from_file(src)
            for i, start_ms in enumerate(range(0, len(audio), chunk_duration * 1000)):
                end_ms = min(start_ms + chunk_duration * 1000, len(audio))
                chunk = audio[start_ms:end_ms]
                chunk_bytes = chunk.export(format="wav").read()
                chunks.append((chunk_bytes, f"{filename_base}_chunk_{i}"))
        
        print(f"Splitting {duration:.1f}s audio into {len(chunks)} chunks")
        
        # Upload chunks in parallel
        transcripts = self._upload_chunks_parallel(chunks)

        # Normalize again (in case any worker returned non-str)
        clean = [t if isinstance(t, str) else self._to_text(t) for t in transcripts]
        combined = "\n\n".join(filter(None, clean))
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

# New more flexible retry helper
async def _retry_with_backoff_async(fn, *, tries=3, base=1.5, max_delay=8, exceptions=(Exception,)):
    """Retry an async callable with exponential backoff on transient errors."""
    last = None
    for i in range(tries):
        try:
            return await fn()
        except exceptions as e:
            last = e
            delay = min(max_delay, base * (2 ** i))
            print(f"[retry] attempt {i+1}/{tries} failed: {e!r}; sleeping {delay:.1f}s")
            await asyncio.sleep(delay)
    raise last

# Helper to truncate text to stay within Chroma's document size limits
def _truncate_utf8(text: str, max_bytes: int = 15000) -> str:
    if not text:
        return ""
    b = text.encode("utf-8")
    if len(b) <= max_bytes:
        return text
    return b[:max_bytes].decode("utf-8", errors="ignore") + " …[truncated]"

def _norm_topic(t: str) -> str:
    """Normalize topic string (basic cleanup, no collapsing Algebra/Geometry)"""
    if not t:
        return "Unknown"
    return t.strip().title()

def _unique_order(seq):
    """Remove duplicates while preserving order"""
    seen = set()
    out = []
    for x in seq:
        if x not in seen:
            seen.add(x)
            out.append(x)
    return out

# Metadata (batched)
async def get_metadata_batch(chunks: list[Document], file_name: str, start_ix: int) -> list[dict]:
    parts = []
    for i, d in enumerate(chunks):
        ix = start_ix + i
        parts.append(f"[{ix}]\n{d.page_content}\n")
    joined = "\n---\n".join(parts)
    prompt = f"""You are an assistant that labels transcript chunks with specific, meaningful topics.

Rules:
- For each chunk, provide a Topic that is **concise but informative** (max 6 words).
- Avoid generic labels like "General Discussion", "Conversation", "Chat".
- If the chunk is instructional/academic:
  - Focus on the **main concept** being taught or discussed
  - e.g. "Quadratic Functions – Vertex Form", "Punctuation – Colons vs M-dash"
- If the chunk is off-topic small talk:
  - Do NOT write "Small Talk".
  - Instead, capture the **actual subject of the chatter** (e.g., "Sports Talk", "Weekend Plans", "Weather", "Jokes").
- Also provide 2–5 Subtopics as comma-separated terms.
- Format your response EXACTLY as: <ix>|Topic=<topic>|Subtopics=<list>

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
        # Find previous session - handling both numeric and non-numeric session IDs
        if state["session_id"].isdigit() and int(state["session_id"]) > 1:
            # Numeric session ID: use previous number
            prev_session_id = str(int(state["session_id"]) - 1)
            print(f"Looking for previous session: {prev_session_id}")
            prev = chroma_client.get_or_create_collection("sessions").get(where={"$and": [
                {"teacher_id": state["teacher_id"]},
                {"student_id": state["student_id"]},
                {"course_id": state["course_id"]},
                {"session_id": prev_session_id}
            ]})
            if prev and prev.get("ids"):
                prev_topics = [m.get("topic") for m in prev.get("metadatas", [])]
        else:
            # Non-numeric session ID: try to find earlier session by date
            print(f"Non-numeric session ID ({state['session_id']}), looking for earlier sessions by date")
            current_date = state.get("session_date", "")
            if current_date:
                # Find sessions with earlier dates for same student/course
                all_sessions = chroma_client.get_or_create_collection("sessions").get(where={"$and": [
                    {"teacher_id": state["teacher_id"]},
                    {"student_id": state["student_id"]},
                    {"course_id": state["course_id"]},
                ]})
                
                if all_sessions and all_sessions.get("metadatas"):
                    # Find session with most recent date before current
                    session_dates = []
                    for i, meta in enumerate(all_sessions["metadatas"]):
                        if meta.get("session_id") != state["session_id"] and meta.get("session_date", "") < current_date:
                            session_dates.append((meta.get("session_date", ""), i))
                    
                    # Sort by date (descending) and get most recent
                    if session_dates:
                        session_dates.sort(reverse=True)
                        prev_idx = session_dates[0][1]
                        prev_session_id = all_sessions["metadatas"][prev_idx].get("session_id", "")
                        print(f"Found previous session {prev_session_id} from {session_dates[0][0]}")
                        
                        # Get all topics from the previous session
                        prev_session_docs = chroma_client.get_or_create_collection("sessions").get(where={"$and": [
                            {"teacher_id": state["teacher_id"]},
                            {"student_id": state["student_id"]},
                            {"course_id": state["course_id"]},
                            {"session_id": prev_session_id}
                        ]})
                        if prev_session_docs and prev_session_docs.get("metadatas"):
                            prev_topics = [m.get("topic") for m in prev_session_docs.get("metadatas", [])]
                        else:
                            prev_topics = []

        # Build raw topic lists (same as before)
        if state["duration_s"] > 1800:
            sampled_metas = metas[::5]
            print(f"Long session detected ({state['duration_s']:.1f}s), sampling {len(sampled_metas)} of {len(metas)} chunks for evaluation")
            curr_raw = [m.get("topic") for m in sampled_metas]
        else:
            curr_raw = [m.get("topic") for m in metas]

        # Normalize
        prev_norm = [_norm_topic(t) for t in prev_topics if t]
        curr_norm = [_norm_topic(t) for t in curr_raw if t]

        # De-duplicate while keeping order
        prev_unique = _unique_order(prev_norm)
        curr_unique = _unique_order(curr_norm)

        # (Optional) counts, so you can see distribution without repeats
        from collections import Counter
        prev_counts = dict(Counter(prev_norm))
        curr_counts = dict(Counter(curr_norm))

        transcript = state['transcript'] or ""
        if len(transcript) > 6000:
            transcript_for_eval = transcript[:3000] + "\n...\n" + transcript[-2500:]
        else:
            transcript_for_eval = transcript

        prompt = f"""
You are an evaluator for a tutoring session transcript.

Your goal: help the tutor understand **how the student is learning**.

Return STRICT JSON with exactly these keys:
- "complexity": integer 1–5 (difficulty of material)
- "concept_mastery": list of objects, each with:
    {{"concept": "…", "status": "understood | partial | not understood"}}
- "misconceptions": list of short recurring errors
- "progress": string summarizing how the student improved during the session
- "engagement": object with:
    {{"speaking_ratio": "teacher | student | balanced",
      "question_density": "low | medium | high",
      "turn_taking": "balanced | unbalanced"}}
- "next_focus": list of 2–3 things the tutor should address next session

Transcript:
{transcript_for_eval}
"""
        # Add retry with backoff for LLM call
        async def get_evaluation():
            async def call_llm():
                return await general_llm.ainvoke([HumanMessage(content=prompt)])
            resp = await retry_with_backoff(call_llm)
            return resp.content.strip()
            
        try:
            llm_result = asyncio.run(get_evaluation())
        except Exception as e:
            print(f"Evaluation LLM error: {e}")
            llm_result = '{"complexity": "N/A", "misconceptions": [], "engagement": {}}'

        # Use the cleaned versions in insights
        insights = {
            "topic_drift": {
                "previous": prev_unique,
                "current":  curr_unique,
                "counts": {
                    "previous": prev_counts,
                    "current":  curr_counts,
                }
            },
            "llm_eval": llm_result  # keep your existing eval result
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
                "duration_s": state["duration_s"],
                "version": 1,
                "is_edited": False
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
    run_id = ls_start_run("summary_quiz", {"session_id": state["session_id"]})
    error_msg, outputs = None, None
    
    try:
        session_doc_id = _doc_id(state["teacher_id"], state["student_id"], state["course_id"], state["session_id"])
        summaries_col = chroma_client.get_or_create_collection("session_summaries")
        quizzes_col = chroma_client.get_or_create_collection("session_quizzes")

        transcript = state['transcript'] or ""
        
        # Prepare truncated transcript for generation
        if len(transcript) > 8000:
            head = transcript[:4000]
            tail = transcript[-3000:]
            transcript_for_gen = head + "\n...\n" + tail
        else:
            transcript_for_gen = transcript

        # --- Summary generation with retries and fallback ---
        summary_prompt = f"""
You are creating a **tutor-facing session summary** from a tutoring session transcript.

Goals:
- Help the tutor quickly recall what was taught.
- Emphasize the **main concepts explained**, **skills practiced**, and any **student difficulties**.
- Provide insights the tutor can use to plan the **next session**.

Rules:
- Return a **bullet list** of 5–8 points.
- Each bullet should be **specific and actionable**, not generic.
- Highlight:
  • Key topics covered (e.g., "Quadratic Functions – Vertex Form")
  • Misconceptions or errors the student made
  • Strategies or examples the tutor used
  • Progress indicators (what the student did well, where they improved)
  • Suggested next steps or review needs
- Avoid filler like "general discussion" or "they talked".
- Write in **professional tutor notes style**.

Transcript:
{transcript_for_gen}
"""
        
        async def call_summary_primary():
            return await general_llm.ainvoke([HumanMessage(content=summary_prompt)])
            
        async def call_summary_fallback():
            fallback_llm = ChatOpenAI(model="gpt-4o-mini", api_key=OPENAI_API_KEY, temperature=0.1)
            return await fallback_llm.ainvoke([HumanMessage(content=summary_prompt)])
            
        async def get_summary():
            try:
                return await asyncio.wait_for(
                    _retry_with_backoff_async(call_summary_primary, tries=3),
                    timeout=60
                )
            except Exception as e:
                print(f"[summary] primary failed, trying fallback: {e!r}")
                return await asyncio.wait_for(
                    _retry_with_backoff_async(call_summary_fallback, tries=3),
                    timeout=60
                )
        
        # --- Quiz generation with retries and fallback ---
        quiz_prompt = f"""
You are a tutor assistant. You will generate a **quiz** from the session transcript below.

Your goal:
- Check whether the student understood the **concepts** (not just recall words).
- Create **application-based multiple-choice questions (MCQs)** that make the student think.
- Focus on main ideas, principles, methods, and reasoning steps.

Rules:
- Avoid trivial recall (names, tools, dates).
- Each question must have **4 answer options (A–D)**.
- Only **one option** should be correct.
- Provide exactly **5 questions**. 
- In the "correct_answer", include both the letter **and** the full answer text (e.g., "B) The axis of symmetry").
- Output must be STRICT JSON with this shape:
  {{
    "quiz": [
      {{
        "question": "…",
        "options": ["A) …", "B) …", "C) …", "D) …"],
        "correct_answer": "B) …"
      }}
    ]
  }}

Transcript:
{transcript_for_gen}
"""
        async def call_quiz_primary():
            return await general_llm.ainvoke([HumanMessage(content=quiz_prompt)])
            
        async def call_quiz_fallback():
            fallback_llm = ChatOpenAI(model="gpt-4o-mini", api_key=OPENAI_API_KEY, temperature=0.1)
            return await fallback_llm.ainvoke([HumanMessage(content=quiz_prompt)])
            
        async def get_quiz():
            try:
                return await asyncio.wait_for(
                    _retry_with_backoff_async(call_quiz_primary, tries=3),
                    timeout=90
                )
            except Exception as e:
                print(f"[quiz] primary failed, trying fallback: {e!r}")
                return await asyncio.wait_for(
                    _retry_with_backoff_async(call_quiz_fallback, tries=3),
                    timeout=90
                )
                
        # Process summary
        try:
            summary_resp = asyncio.run(get_summary())
            summary_raw = summary_resp.content.strip()
            summary_lines = summary_raw.strip().split("\n")
            summary_bullets = [line.strip("• ").strip() for line in summary_lines if line.strip()]
            summary_text = "\n".join(summary_bullets)
        except Exception as e:
            print(f"Summary generation error: {e}")
            summary_text = "Unable to generate summary due to a technical issue."
            
        # Process quiz
        try:
            quiz_resp = asyncio.run(get_quiz())
            quiz_raw = quiz_resp.content.strip()
            if quiz_raw.startswith("```"):
                quiz_raw = quiz_raw.strip("`")
                if quiz_raw.lower().startswith("json"):
                    quiz_raw = quiz_raw[4:].strip()
            
            quiz_data = json.loads(quiz_raw)
            quiz_str = json.dumps(quiz_data, ensure_ascii=False)
        except Exception as e:
            print(f"Quiz generation error: {e}")
            # Provide minimal valid quiz JSON on error
            quiz_str = json.dumps({"quiz": []}, ensure_ascii=False)

        # Store summary
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
                "duration_s": state["duration_s"],
                "version": 1,
                "is_edited": False
            }],
        )
        
        # Store quiz
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
                "duration_s": state["duration_s"],
                "version": 1,
                "is_edited": False
            }],
        )
        
        outputs = {"summary_generated": True, "quiz_generated": True}
        print(f"Summary and Quiz stored for session {state['session_id']}")
        
    except Exception as e:
        error_msg = str(e)
        print(f"Summary/Quiz processing error: {e}")
    finally:
        ls_end_run(run_id, outputs=outputs, error=error_msg)

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
                
            # Store a preview of the full transcript (keep under Chroma 16KB doc limit)
            preview_doc = _truncate_utf8(state["transcript"], 15000)

            session_docs_col.upsert(
                ids=[session_doc_id],
                documents=[preview_doc],
                metadatas=[{
                    "teacher_id": state["teacher_id"],
                    "student_id": state["student_id"],
                    "course_id": state["course_id"],
                    "session_id": state["session_id"],
                    "file_name": file_name,
                    "session_date": state["session_date"],
                    "duration_s": state["duration_s"],
                    "shared_with": json.dumps([]),
                    "paid": False,
                    "doc_truncated": True,
                    "doc_total_len": len(state["transcript"])
                }],
            )
            print(f"Stored {len(chunks)} chunks and 1 transcript.")

            # Launch background jobs with proper metadata list
            threading.Thread(target=_run_evaluators_background, args=(state, metadata_list), daemon=True).start()
            threading.Thread(target=_run_summary_quiz_background, args=(state,), daemon=True).start()
            threading.Thread(target=_run_concepts_background, args=(state, metadata_list), daemon=True).start()

        asyncio.run(process_and_store())
        ls_end_run(run_id, {"stored": True, "chunks_count": len(chunks)})
        return state
        
    except Exception as e:
        ls_end_run(run_id, error=str(e))
        raise

# Update token utility functions to use HMAC signing
def generate_share_token(doc_id: str, scope: List[str], ttl_minutes: int = 43200) -> Dict[str, Any]:
    """Generate a secure HMAC-signed token for sharing session data"""
    # Create a random token base
    token_base = str(uuid.uuid4())
    
    # Set expiration time if ttl_minutes is provided
    expire_at = None
    if ttl_minutes:
        expire_at = (datetime.now() + timedelta(minutes=ttl_minutes)).isoformat()
    
    # Create the payload to be signed
    payload = {
        "doc_id": doc_id,
        "scope": scope,
        "expire_at": expire_at,
        "token_base": token_base
    }
    
    # Create a signature using HMAC with environment variable
    secret_key = SHARE_TOKEN_SECRET
    payload_str = json.dumps(payload, sort_keys=True)
    signature = hmac.new(
        secret_key.encode(), 
        payload_str.encode(), 
        hashlib.sha256
    ).hexdigest()
    
    # Create token data to be stored
    token_data = {
        "token": token_base,
        "doc_id": doc_id,
        "scope": scope,
        "expire_at": expire_at,
        "signature": signature
    }
    
    return token_data

def validate_share_token(token: str) -> Dict[str, Any] | None:
    """Validate a share token's signature and return the associated data if valid"""
    shares_col = chroma_client.get_or_create_collection("session_shares")
    
    # Search for the token
    results = shares_col.get(
        where={"token": token}
    )
    
    if not results or not results.get("ids"):
        return None
    
    # Get token data
    doc_index = 0
    token_data = json.loads(results["documents"][doc_index])
    metadata = results["metadatas"][doc_index]
    doc_id = results["ids"][doc_index]
    
    # Check if token is revoked
    if metadata.get("revoked", False):
        return None
    
    # Check expiration
    if token_data.get("expire_at"):
        try:
            expire_dt = datetime.fromisoformat(token_data["expire_at"])
            if datetime.now() > expire_dt:
                return None  # Token expired
        except (ValueError, TypeError):
            pass  # If we can't parse the date, continue
    
    # Verify the signature using environment variable
    secret_key = SHARE_TOKEN_SECRET
    payload = {
        "doc_id": token_data["doc_id"],
        "scope": token_data["scope"],
        "expire_at": token_data["expire_at"],
        "token_base": token_data["token"]
    }
    payload_str = json.dumps(payload, sort_keys=True)
    expected_signature = hmac.new(
        secret_key.encode(), 
        payload_str.encode(), 
        hashlib.sha256
    ).hexdigest()
    
    if token_data.get("signature") != expected_signature:
        return None  # Invalid signature
    
    # Return combined data
    return {
        "doc_id": doc_id,
        "token_data": token_data,
        "metadata": metadata
    }

def _html_to_pdf_bytes(html: str) -> bytes:
    # Chromium prints the page; returns bytes if no path is given
    with sync_playwright() as p:
        browser = p.chromium.launch()  # headless by default
        page = browser.new_page()
        page.set_content(html, wait_until="load")
        pdf_bytes = page.pdf(
            format="A4",
            print_background=True,
            margin={"top": "16mm", "right": "14mm", "bottom": "16mm", "left": "14mm"},
        )
        browser.close()
        return pdf_bytes
    
# Add new Pydantic models for share operations
class CreateShareRequest(BaseModel):
    student_id: str
    course_id: str
    session_id: str
    scope: List[str] = ["summary", "quiz", "feedback"]
    ttl_minutes: int = 43200  # Default to 30 days

class RevokeShareRequest(BaseModel):
    student_id: str
    course_id: str
    session_id: str

# Add new endpoints for sharing
@app.post("/share")
def create_share(req: CreateShareRequest):
    """Create a shareable link for a session"""
    # Validate requested scope
    valid_scopes = ["summary", "quiz", "feedback"]
    scope = [s for s in req.scope if s in valid_scopes]
    
    if not scope:
        return {"error": "Invalid scope. Must include at least one of: summary, quiz, feedback"}
    
    # We need the teacher_id for proper document identification and metadata
    teacher_id = "default_teacher"  # Default value
    
    # Generate session doc_id
    session_doc_id = _doc_id(teacher_id, req.student_id, req.course_id, req.session_id)
    
    # Look up existing session to verify it exists
    shares_col = chroma_client.get_or_create_collection("session_shares")
    
    # Check if the resources being shared exist
    resources_exist = False
    
    if "summary" in scope:
        summaries_col = chroma_client.get_or_create_collection("session_summaries")
        summary_res = summaries_col.get(where={"$and": [
            {"student_id": req.student_id},
            {"course_id": req.course_id},
            {"session_id": req.session_id}
        ]})
        if summary_res and summary_res.get("ids"):
            resources_exist = True
            # Use the actual doc_id - without splitting incorrectly
            session_doc_id = summary_res["ids"][0]
            # Extract teacher_id from metadata
            if summary_res.get("metadatas") and summary_res["metadatas"][0].get("teacher_id"):
                teacher_id = summary_res["metadatas"][0]["teacher_id"]
    
    if not resources_exist and "quiz" in scope:
        quizzes_col = chroma_client.get_or_create_collection("session_quizzes")
        quiz_res = quizzes_col.get(where={"$and": [
            {"student_id": req.student_id},
            {"course_id": req.course_id},
            {"session_id": req.session_id}
        ]})
        if quiz_res and quiz_res.get("ids"):
            resources_exist = True
            session_doc_id = quiz_res["ids"][0]
            if quiz_res.get("metadatas") and quiz_res["metadatas"][0].get("teacher_id"):
                teacher_id = quiz_res["metadatas"][0]["teacher_id"]
    
    if not resources_exist and "feedback" in scope:
        insights_col = chroma_client.get_or_create_collection("session_insights")
        feedback_res = insights_col.get(where={"$and": [
            {"student_id": req.student_id},
            {"course_id": req.course_id},
            {"session_id": req.session_id}
        ]})
        if feedback_res and feedback_res.get("ids"):
            resources_exist = True
            session_doc_id = feedback_res["ids"][0]
            if feedback_res.get("metadatas") and feedback_res["metadatas"][0].get("teacher_id"):
                teacher_id = feedback_res["metadatas"][0]["teacher_id"]
    
    if not resources_exist:
        return {"error": "No resources found to share"}
    
    # Generate token data with HMAC signature
    token_data = generate_share_token(session_doc_id, scope, req.ttl_minutes)
    
    # Use token as part of the ID to avoid overwriting previous shares
    share_id = f"{session_doc_id}:{token_data['token']}"
    
    # Store token in session_shares collection with teacher_id in metadata
    shares_col.upsert(
        ids=[share_id],  # Fixed: Using combination of session_doc_id and token as ID
        documents=[json.dumps(token_data)],
        metadatas=[{
            "teacher_id": teacher_id,
            "student_id": req.student_id,
            "course_id": req.course_id,
            "session_id": req.session_id,
            "created_at": datetime.now().isoformat(),
            "revoked": False,
            "token": token_data["token"]  # Store token in metadata for queries
        }]
    )
    
    # Generate share URL
    base_url = "http://localhost:8000"  # In production, use your actual domain
    share_url = f"{base_url}/share/{token_data['token']}"
    
    return {"share_url": share_url}

@app.get("/share/{token}")
def get_shared_content(token: str):
    """Get shared content using a token"""
    # Validate the token
    token_info = validate_share_token(token)
    
    if not token_info:
        return {"error": "Invalid or expired token"}
    
    # Get the session data according to scope
    result = {}
    doc_id = token_info["doc_id"]
    scope = token_info["token_data"]["scope"]
    metadata = token_info["metadata"]
    
    # Get student, course, session IDs from metadata
    student_id = metadata["student_id"]
    course_id = metadata["course_id"] 
    session_id = metadata["session_id"]
    
    # Fetch requested content
    if "summary" in scope:
        summaries_col = chroma_client.get_or_create_collection("session_summaries")
        summary_res = summaries_col.get(where={"$and": [
            {"student_id": student_id},
            {"course_id": course_id},
            {"session_id": session_id}
        ]})
        if summary_res and summary_res.get("documents"):
            result["summary"] = summary_res["documents"][0]
    
    if "quiz" in scope:
        quizzes_col = chroma_client.get_or_create_collection("session_quizzes")
        quiz_res = quizzes_col.get(where={"$and": [
            {"student_id": student_id},
            {"course_id": course_id},
            {"session_id": session_id}
        ]})
        if quiz_res and quiz_res.get("documents"):
            try:
                result["quiz"] = json.loads(quiz_res["documents"][0])
            except json.JSONDecodeError:
                result["quiz"] = quiz_res["documents"][0]
    
    if "feedback" in scope:
        insights_col = chroma_client.get_or_create_collection("session_insights")
        feedback_res = insights_col.get(where={"$and": [
            {"student_id": student_id},
            {"course_id": course_id},
            {"session_id": session_id}
        ]})
        if feedback_res and feedback_res.get("documents"):
            try:
                result["feedback"] = json.loads(feedback_res["documents"][0])
            except json.JSONDecodeError:
                result["feedback"] = feedback_res["documents"][0]
    
    return result

@app.post("/share/revoke")
def revoke_share(req: RevokeShareRequest):
    """Revoke a shared token"""
    shares_col = chroma_client.get_or_create_collection("session_shares")
    
    # Find shares for this session
    shares = shares_col.get(where={"$and": [
        {"student_id": req.student_id},
        {"course_id": req.course_id},
        {"session_id": req.session_id},
        {"revoked": False}
    ]})
    
    if not shares or not shares.get("ids"):
        return {"error": "No active shares found"}
    
    # Update all shares to revoked
    for i, share_id in enumerate(shares["ids"]):
        metadata = shares["metadatas"][i]
        metadata["revoked"] = True
        
        shares_col.upsert(
            ids=[share_id],  # This is now unique per token
            documents=[shares["documents"][i]],
            metadatas=[metadata]
        )
    
    return {"ok": True, "revoked_count": len(shares["ids"])}

# Add export endpoint
@app.get("/export/pdf")
def export_as_pdf(student_id: str, course_id: str, session_id: str):
    """Export session summary, quiz, and feedback as PDF"""
    # Track export in analytics
    exports_col = chroma_client.get_or_create_collection("session_exports")
    
    # Generate a unique ID for the export
    export_id = f"{student_id}:{course_id}:{session_id}:{uuid.uuid4()}"
    
    # Fetch all required data
    summary = ""
    quiz_data = []
    feedback_data = {}
    
    # Get summary
    summaries_col = chroma_client.get_or_create_collection("session_summaries")
    summary_res = summaries_col.get(where={"$and": [
        {"student_id": student_id},
        {"course_id": course_id},
        {"session_id": session_id}
    ]})
    if summary_res and summary_res.get("documents"):
        summary = summary_res["documents"][0]
    
    # Get quiz
    quizzes_col = chroma_client.get_or_create_collection("session_quizzes")
    quiz_res = quizzes_col.get(where={"$and": [
        {"student_id": student_id},
        {"course_id": course_id},
        {"session_id": session_id}
    ]})
    if quiz_res and quiz_res.get("documents"):
        try:
            quiz_data = json.loads(quiz_res["documents"][0])
        except json.JSONDecodeError:
            quiz_data = []
    
    # Get feedback
    insights_col = chroma_client.get_or_create_collection("session_insights")
    feedback_res = insights_col.get(where={"$and": [
        {"student_id": student_id},
        {"course_id": course_id},
        {"session_id": session_id}
    ]})
    if feedback_res and feedback_res.get("documents"):
        try:
            feedback_data = json.loads(feedback_res["documents"][0])
        except json.JSONDecodeError:
            feedback_data = {}
    
    # Get session metadata for title
    teacher_name = "Instructor"
    session_date = datetime.now().strftime("%Y-%m-%d")
    
    if feedback_res and feedback_res.get("metadatas") and feedback_res["metadatas"][0]:
        metadata = feedback_res["metadatas"][0]
        teacher_name = metadata.get("teacher_id", "Instructor")
        if metadata.get("session_date"):
            try:
                session_date = datetime.fromisoformat(metadata["session_date"]).strftime("%Y-%m-%d")
            except (ValueError, TypeError):
                pass
    
    # Generate HTML
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Session Report: {course_id} - Session {session_id}</title>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }}
            h1, h2, h3 {{ color: #2c3e50; }}
            h1 {{ border-bottom: 2px solid #3498db; padding-bottom: 10px; }}
            h2 {{ border-bottom: 1px solid #bdc3c7; padding-bottom: 5px; margin-top: 30px; }}
            .summary {{ background-color: #f9f9f9; padding: 15px; border-radius: 5px; }}
            .quiz-item {{ background-color: #f5f5f5; padding: 15px; margin-bottom: 15px; border-radius: 5px; }}
            .quiz-question {{ font-weight: bold; }}
            .quiz-options {{ margin-left: 20px; }}
            .quiz-answer {{ color: #27ae60; font-weight: bold; }}
            .feedback-section {{ background-color: #f0f7ff; padding: 15px; border-radius: 5px; }}
            .topic-list {{ display: flex; flex-wrap: wrap; gap: 10px; }}
            .topic-tag {{ background-color: #e1f5fe; padding: 5px 10px; border-radius: 15px; font-size: 0.9em; }}
            .footer {{ margin-top: 50px; text-align: center; font-size: 0.8em; color: #7f8c8d; }}
        </style>
    </head>
    <body>
        <h1>Session Report: {course_id}</h1>
        <p>
            <strong>Student:</strong> {student_id}<br>
            <strong>Instructor:</strong> {teacher_name}<br>
            <strong>Session:</strong> {session_id}<br>
            <strong>Date:</strong> {session_date}
        </p>

        <h2>Session Summary</h2>
        <div class="summary">
            {summary.replace('\n', '<br>')}
        </div>

        <h2>Assessment Questions</h2>
    """
    
    # Add quiz items
    if quiz_data:
        # Extract questions from the quiz array if it exists in the JSON structure
        questions = quiz_data.get("quiz", [])
        if not questions and isinstance(quiz_data, list):
            # Handle case where quiz_data might already be a flat list
            questions = quiz_data
            
        for i, question in enumerate(questions):
            q_text = question.get("question", "")
            html_content += f"""
            <div class="quiz-item">
                <p class="quiz-question">Question {i+1}: {q_text}</p>
            """
            
            # Check if this is an MCQ with options
            options = question.get("options", [])
            if options:
                html_content += '<div class="quiz-options"><ol type="A">'
                for option in options:
                    html_content += f"<li>{option}</li>"
                html_content += '</ol></div>'
                
                # Get the correct answer
                correct_answer = question.get("correct_answer", "")
                html_content += f'<p class="quiz-answer">Answer: {correct_answer}</p>'
            else:  # short answer or other format
                answer = question.get("answer", "")
                html_content += f'<p class="quiz-answer">Suggested Answer: {answer}</p>'
        
            html_content += "</div>"
    else:
        html_content += "<p><em>No assessment questions available for this session.</em></p>"

    # Add feedback
    html_content += "<h2>Session Insights</h2>"
    
    # Add topic drift if available
    if feedback_data and "topic_drift" in feedback_data:
        topic_drift = feedback_data["topic_drift"]
        html_content += '<div class="feedback-section">'
        
        if "current" in topic_drift and topic_drift["current"]:
            current_topics = topic_drift["current"]
            html_content += '<h3>Topics Covered</h3><div class="topic-list">'
            
            # Remove duplicates while maintaining order
            seen = set()
            unique_topics = []
            for topic in current_topics:
                if topic and topic not in seen:
                    seen.add(topic)
                    unique_topics.append(topic)
            
            for topic in unique_topics[:10]:  # Limit to top 10 topics
                html_content += f'<span class="topic-tag">{topic}</span>'
            html_content += '</div>'
        
        html_content += '</div>'
    
    # Add LLM evaluation if available
    if feedback_data and "llm_eval" in feedback_data:
        try:
            eval_data = json.loads(feedback_data["llm_eval"])
            html_content += """
            <div class="feedback-section">
                <h3>Session Analytics</h3>
            """
            
            if "complexity" in eval_data:
                complexity = eval_data["complexity"]
                html_content += f"<p><strong>Complexity Level:</strong> {complexity}/5</p>"
            
            if "engagement" in eval_data and isinstance(eval_data["engagement"], dict):
                engagement = eval_data["engagement"]
                html_content += "<p><strong>Engagement Metrics:</strong></p><ul>"
                
                if "speaking_ratio" in engagement:
                    html_content += f"<li>Speaking balance: {engagement['speaking_ratio']}</li>"
                
                if "question_density" in engagement:
                    html_content += f"<li>Question frequency: {engagement['question_density']}</li>"
                
                if "turn_taking" in engagement:
                    html_content += f"<li>Conversational flow: {engagement['turn_taking']}</li>"
                
                html_content += "</ul>"
            
            if "misconceptions" in eval_data and eval_data["misconceptions"]:
                html_content += "<p><strong>Areas for Focus:</strong></p><ul>"
                for item in eval_data["misconceptions"]:
                    html_content += f"<li>{item}</li>"
                html_content += "</ul>"
            
            html_content += "</div>"
        except (json.JSONDecodeError, TypeError):
            # If LLM eval isn't valid JSON or has unexpected structure
            pass
    
    # Add footer and close HTML
    html_content += """
        <div class="footer">
            <p>Generated by PlayX Education Analytics</p>
        </div>
    </body>
    </html>
    """
    
    # Record the export event
    exports_col.upsert(
        ids=[export_id],
        documents=["Export event"],
        metadatas=[{
            "student_id": student_id,
            "course_id": course_id,
            "session_id": session_id,
            "exported_at": datetime.now().isoformat(),
            "export_type": "pdf"
        }]
    )
    
    # Try to convert to PDF if possible
    if PDF_EXPORT_AVAILABLE:
        try:
            pdf = _html_to_pdf_bytes(html_content)
            return Response(
                content=pdf,
                media_type="application/pdf",
                headers={"Content-Disposition": f"inline; filename=session_{student_id}_{session_id}.pdf"}
            )
        except Exception as e:
            print(f"Playwright PDF generation failed: {e}")

    # fallback
    return {"html": html_content}

# Add session metadata update endpoint and shared sessions endpoint
@app.patch("/sessions/meta")
def update_session_metadata(
    student_id: str, 
    course_id: str, 
    session_id: str, 
    shared_with: List[str] = None, 
    paid: bool = None
):
    """Update session metadata including sharing and payment status"""
    session_docs_col = chroma_client.get_or_create_collection("session_docs")
    
    # Look up the session
    session_res = session_docs_col.get(where={"$and": [
        {"student_id": student_id},
        {"course_id": course_id},
        {"session_id": session_id}
    ]})
    
    if not session_res or not session_res.get("ids"):
        return {"error": "Session not found", "ok": False}
    
    # Get existing metadata - store document ID in a separate variable
    doc_id = session_res["ids"][0]
    metadata = session_res["metadatas"][0].copy()
    
    # Update metadata fields if provided
    if shared_with is not None:
        metadata["shared_with"] = (
            json.dumps(shared_with) if isinstance(shared_with, list) else str(shared_with)
        )
    
    if paid is not None:
        metadata["paid"] = paid
    
    # Update the metadata
    session_docs_col.upsert(
        ids=[doc_id],
        documents=[session_res["documents"][0]],  # Keep the same document
        metadatas=[metadata]
    )
    
    # Also mirror essential metadata to other collections if they exist
    for collection_name in ["session_summaries", "session_quizzes", "session_insights"]:
        collection = chroma_client.get_or_create_collection(collection_name)
        collection_res = collection.get(where={"$and": [
            {"student_id": student_id},
            {"course_id": course_id},
            {"session_id": session_id}
        ]})
        
        if collection_res and collection_res.get("ids"):
            collection_id = collection_res["ids"][0]
            collection_metadata = collection_res["metadatas"][0].copy()
            
            # Update only the shared_with and paid fields
            if shared_with is not None:
                collection_metadata["shared_with"] = (
                    json.dumps(shared_with) if isinstance(shared_with, list) else str(shared_with)
                )
            
            if paid is not None:
                collection_metadata["paid"] = paid
            
            collection.upsert(
                ids=[collection_id],
                documents=[collection_res["documents"][0]],  # Keep the same document
                metadatas=[collection_metadata]
            )
    
    return {"ok": True}

@app.get("/sessions/shared")
def get_shared_sessions(student_id: str):
    """Get sessions shared with a specific student"""
    session_docs_col = chroma_client.get_or_create_collection("session_docs")
    
    # Find sessions shared with this student
    # Note: Chroma doesn't support array contains directly, so we'll filter after retrieval
    results = session_docs_col.get()
    
    if not results or not results.get("ids"):
        return []
    
    shared_sessions = []
    for i, metadata in enumerate(results["metadatas"]):
        # Check if shared_with contains the student_id
        shared_with = metadata.get("shared_with", "[]")
        
        # Normalize to list
        if isinstance(shared_with, str):
            try:
                shared_with_list = json.loads(shared_with)
                if not isinstance(shared_with_list, list):
                    shared_with_list = []
            except Exception:
                shared_with_list = []
        elif isinstance(shared_with, list):
            shared_with_list = shared_with
        else:
            shared_with_list = []
        
        is_shared = student_id in shared_with_list
        
        if is_shared:
            shared_sessions.append({
                "id": results["ids"][i],
                "metadata": metadata,
                "text_sample": results["documents"][i][:200] if results["documents"][i] else ""
            })
    
    return shared_sessions

# Add Pydantic models for tutor profile
class TutorProfileRequest(BaseModel):
    teacher_id: str
    calendly_url: str

# Add tutor profile endpoints
@app.put("/tutor/profile")
def update_tutor_profile(req: TutorProfileRequest):
    """Update a tutor's profile with Calendly URL"""
    tutor_profiles_col = chroma_client.get_or_create_collection("tutor_profiles")
    
    # Generate tutor ID
    tutor_id = f"tutor:{req.teacher_id}"
    
    # Create profile data
    profile_data = {
        "calendly_url": req.calendly_url
    }
    
    # Store in tutor_profiles collection
    tutor_profiles_col.upsert(
        ids=[tutor_id],
        documents=[json.dumps(profile_data, ensure_ascii=False)],
        metadatas=[{
            "teacher_id": req.teacher_id,
            "updated_at": datetime.now().isoformat()
        }]
    )
    
    return {"ok": True}

@app.get("/tutor/profile")
def get_tutor_profile(teacher_id: str):
    """Get a tutor's profile with Calendly URL"""
    tutor_profiles_col = chroma_client.get_or_create_collection("tutor_profiles")
    
    # Generate tutor ID
    tutor_id = f"tutor:{teacher_id}"
    
    # Try to get profile
    try:
        profile_res = tutor_profiles_col.get(ids=[tutor_id])
        
        if profile_res and profile_res.get("documents") and profile_res["documents"][0]:
            # Parse JSON document
            profile_data = json.loads(profile_res["documents"][0])
            return profile_data
        else:
            # Check if tutor exists but without a specific tutor_id format
            alt_res = tutor_profiles_col.get(where={"teacher_id": teacher_id})
            if alt_res and alt_res.get("documents") and alt_res["documents"][0]:
                profile_data = json.loads(alt_res["documents"][0])
                return profile_data
            
            # No profile found
            return {"calendly_url": None}
    except Exception as e:
        print(f"Error retrieving tutor profile: {e}")
        return {"calendly_url": None}

# Function to extract and normalize concepts from session chunks
def extract_normalized_concepts(chunks_metadata: list[dict], course_id: str) -> list[dict]:
    """Extract normalized concepts from chunk topics and count mentions/examples"""
    # Extract all topics from chunks
    raw_topics = [meta.get("topic", "") for meta in chunks_metadata if meta.get("topic")]
    
    if not raw_topics:
        return []
    
    # Use LLM to normalize topics to standard concept names
    prompt = f"""
You are analyzing programming tutoring sessions. Given these raw topics from a {course_id} course,
map them to normalized concept names. For each concept, count how many times it's mentioned
and estimate how many times concrete examples were given.

Raw topics:
{', '.join(raw_topics)}

Return ONLY a JSON array like:
[
  {{ "name": "Loops", "mentions": 7, "examples": 2 }},
  {{ "name": "Functions", "mentions": 5, "examples": 1 }}
]

Use standard concept names for {course_id} programming.
Count occurrences based on the raw topics list.
Estimate examples based on topics that suggest practical demonstrations.
"""
    
    try:
        # Add retry with backoff for concept normalization
        async def get_normalized_concepts():
            async def call_llm():
                return await general_llm.ainvoke([HumanMessage(content=prompt)])
            resp = await retry_with_backoff(call_llm)
            return resp.content.strip()
            
        raw = asyncio.run(get_normalized_concepts())
        
        # Extract JSON from potential markdown code block
        if raw.startswith("```"):
            raw = raw.strip("`")
            if raw.lower().startswith("json"):
                raw = raw[4:].strip()
        
        concepts = json.loads(raw)
        return concepts
    except Exception as e:
        print(f"Error normalizing concepts: {e}")
        return []

def process_session_concepts(state: ChatState, metas: list[dict]):
    """Process and store normalized concepts for a session"""
    try:
        # Extract normalized concepts
        concepts = extract_normalized_concepts(metas, state["course_id"])
        
        if not concepts:
            print(f"No concepts extracted for session {state['session_id']}")
            return
        
        # Store in session_concepts collection
        concepts_col = chroma_client.get_or_create_collection("session_concepts")
        session_doc_id = _doc_id(
            state["teacher_id"], state["student_id"], state["course_id"], state["session_id"]
        )
        
        concepts_data = {"concepts": concepts}
        
        concepts_col.upsert(
            ids=[session_doc_id],
            documents=[json.dumps(concepts_data, ensure_ascii=False)],
            metadatas=[{
                "teacher_id": state["teacher_id"],
                "student_id": state["student_id"], 
                "course_id": state["course_id"],
                "session_id": state["session_id"],
                "session_date": state["session_date"]
            }]
        )
        
        print(f"Stored {len(concepts)} concepts for session {state['session_id']}")
    except Exception as e:
        print(f"Error processing concepts: {e}")

def _run_concepts_background(state: ChatState, metas: list[dict]):
    """Background thread function to process and store session concepts"""
    try:
        process_session_concepts(state, metas)
    except Exception as e:
        print(f"Background concepts processing error: {e}")

# Add endpoint to compare concepts between sessions
@app.get("/progress/concepts")
def compare_session_concepts(
    student_id: str, 
    course_id: str, 
    session_id_1: str, 
    session_id_2: str
):
    """Compare concept coverage between two sessions"""
    concepts_col = chroma_client.get_or_create_collection("session_concepts")
    
    # Get concepts from first session
    first_session = concepts_col.get(where={"$and": [
        {"student_id": student_id},
        {"course_id": course_id},
        {"session_id": session_id_1}
    ]})
    
    # Get concepts from second session
    second_session = concepts_col.get(where={"$and": [
        {"student_id": student_id},
        {"course_id": course_id},
        {"session_id": session_id_2}
    ]})
    
    if not first_session or not first_session.get("documents") or not second_session or not second_session.get("documents"):
        return {"error": "One or both sessions not found"}
    
    # Parse concept data
    try:
        first_concepts_data = json.loads(first_session["documents"][0])
        second_concepts_data = json.loads(second_session["documents"][0])
        
        first_concepts = first_concepts_data.get("concepts", [])
        second_concepts = second_concepts_data.get("concepts", [])
    except (json.JSONDecodeError, IndexError):
        return {"error": "Invalid concept data"}
    
    # Calculate concept deltas
    concept_map = {}
    
    # Process first session concepts
    for concept in first_concepts:
        name = concept.get("name")
        if name:
            concept_map[name] = {
                "session_1": {
                    "name": name,
                    "mentions": concept.get("mentions", 0),
                    "examples": concept.get("examples", 0)
                },
                "session_2": {
                    "name": name,
                    "mentions": 0,
                    "examples": 0
                }
            }
    
    # Process second session concepts
    for concept in second_concepts:
        name = concept.get("name")
        if name:
            if name in concept_map:
                concept_map[name]["session_2"] = {
                    "name": name,
                    "mentions": concept.get("mentions", 0),
                    "examples": concept.get("examples", 0)
                }
            else:
                concept_map[name] = {
                    "session_1": {
                        "name": name,
                        "mentions": 0,
                        "examples": 0
                    },
                    "session_2": {
                        "name": name,
                        "mentions": concept.get("mentions", 0),
                        "examples": concept.get("examples", 0)
                    }
                }
    
    # Calculate deltas
    deltas = []
    for concept_name, data in concept_map.items():
        delta = {
            "name": concept_name,
            "delta_mentions": data["session_2"]["mentions"] - data["session_1"]["mentions"],
            "delta_examples": data["session_2"]["examples"] - data["session_1"]["examples"]
        }
        deltas.append(delta)
    
    # Sort by absolute delta_mentions
    deltas.sort(key=lambda x: abs(x["delta_mentions"]), reverse=True)
    
    # Prepare result
    result = {
        "session_1": [data["session_1"] for name, data in concept_map.items()],
        "session_2": [data["session_2"] for name, data in concept_map.items()],
        "delta": deltas
    }
    
    return result
    
# Add Pydantic models for the edit requests
class EditSummaryRequest(BaseModel):
    content: str

class EditQuizRequest(BaseModel):
    questions: List[Dict[str, Any]]

class EditFeedbackRequest(BaseModel):
    insights: Dict[str, Any]

# Add the three tutor edit endpoints
@app.put("/sessions/{student_id}/{course_id}/{session_id}/summary")
def edit_session_summary(
    student_id: str,
    course_id: str,
    session_id: str,
    req: EditSummaryRequest
):
    """Update AI-generated summary with tutor edits"""
    summaries_col = chroma_client.get_or_create_collection("session_summaries")
    
    # Look up the existing document ID instead of hardcoding teacher_id
    res = summaries_col.get(where={"$and": [
        {"student_id": student_id},
        {"course_id": course_id},
        {"session_id": session_id}
    ]})
    
    if not res or not res.get("ids"):
        return {"error": "Summary not found"}
    
    session_doc_id = res["ids"][0]
    metadata = res["metadatas"][0].copy()
    metadata["version"] = metadata.get("version", 1) + 1
    metadata["is_edited"] = True
    metadata["edited_at"] = datetime.now().isoformat()  # Changed from datetime.datetime.now()
    
    summaries_col.upsert(
        ids=[session_doc_id],
        documents=[req.content],
        metadatas=[metadata]
    )
    
    return {"ok": True, "version": metadata["version"]}

@app.put("/sessions/{student_id}/{course_id}/{session_id}/quiz")
def edit_session_quiz(
    student_id: str,
    course_id: str,
    session_id: str,
    req: EditQuizRequest
):
    """Update AI-generated quiz with tutor edits"""
    quizzes_col = chroma_client.get_or_create_collection("session_quizzes")
    
    # Look up the existing document ID instead of hardcoding teacher_id
    res = quizzes_col.get(where={"$and": [
        {"student_id": student_id},
        {"course_id": course_id},
        {"session_id": session_id}
    ]})
    
    if not res or not res.get("ids"):
        return {"error": "Quiz not found"}
    
    session_doc_id = res["ids"][0]
    metadata = res["metadatas"][0].copy()
    metadata["version"] = metadata.get("version", 1) + 1
    metadata["is_edited"] = True
    metadata["edited_at"] = datetime.now().isoformat()  # Changed from datetime.datetime.now()
    
    quiz_str = json.dumps(req.questions, ensure_ascii=False)
    quizzes_col.upsert(
        ids=[session_doc_id],
        documents=[quiz_str],
        metadatas=[metadata]
    )
    
    return {"ok": True, "version": metadata["version"]}

@app.put("/sessions/{student_id}/{course_id}/{session_id}/feedback")
def edit_session_feedback(
    student_id: str,
    course_id: str,
    session_id: str,
    req: EditFeedbackRequest
):
    """Update AI-generated feedback with tutor edits"""
    insights_col = chroma_client.get_or_create_collection("session_insights")
    
    # Look up the existing document ID instead of hardcoding teacher_id
    res = insights_col.get(where={"$and": [
        {"student_id": student_id},
        {"course_id": course_id},
        {"session_id": session_id}
    ]})
    
    if not res or not res.get("ids"):
        return {"error": "Feedback not found"}
    
    session_doc_id = res["ids"][0]
    metadata = res["metadatas"][0].copy()
    metadata["version"] = metadata.get("version", 1) + 1
    metadata["is_edited"] = True
    metadata["edited_at"] = datetime.now().isoformat()
    
    insights_str = json.dumps(req.insights, ensure_ascii=False)
    insights_col.upsert(
        ids=[session_doc_id],
        documents=[insights_str],
        metadatas=[metadata]
    )
    
    return {"ok": True, "version": metadata["version"]}
    
# Run
if __name__ == "__main__":
    file_path = "Recording 1.mp4"
    processor = MediaProcessor(api_url=DEEPGRAM_API_URL, api_key=DEEPGRAM_API_KEY)
    
    duration = processor._duration_seconds(file_path)
    
    transcript = processor.transcribe(file_path)
    state: ChatState = {
        "messages": [],
        "file_path": file_path,
        "transcript": transcript,
        "retrieved_context": None,
        "teacher_id": "Jaka",
        "student_id": "Amna",
        "course_id": "SAT Practice",
        "session_id": "1",
        "session_date": datetime.now().isoformat(),
        "duration_s": duration
    }
    state = store_in_chroma(state)

    uvicorn.run(app, host="0.0.0.0", port=8000)