<div align="center">

# AI Tutoring Assistant

**Session Transcription and AI-Powered Learning Insights for Tutors and Students**

[![Python](https://img.shields.io/badge/Python-3.8-3776AB?logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.116.1-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.2.0-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![LangChain](https://img.shields.io/badge/LangChain-0.3.27-1C3C3C)](https://langchain.com)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4.1-412991?logo=openai&logoColor=white)](https://openai.com)
[![ChromaDB](https://img.shields.io/badge/ChromaDB-1.0.20-FF6D00)](https://trychroma.com)

Upload a tutoring session recording and get a full analytics suite for tutors and students.

</div>

---

## Table of Contents

- [Overview](#overview)
- [Pipeline](#pipeline)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)

---

## Overview

Tutors upload an audio or video recording of a session. The backend transcribes it via Deepgram Nova-2 (with parallel chunking for sessions over 10 minutes), tags each chunk with a topic using GPT-4o-mini then runs GPT-4.1 to generate a session summary and a quiz. A separate evaluator scores concept mastery, detects misconceptions, tracks topic drift against the previous session and rates student engagement.

Transcripts, summaries, quizzes and evaluation insights are stored in Chroma Cloud and served to the React frontend. Tutors see session history and evaluations. Students see their own transcript, feedback and quiz. Sessions can be exported to PDF via Playwright or shared via a signed link.

All LLM calls are traced in LangSmith for observability.

---

## Pipeline

```
┌─────────────────────────────────────────────────────────┐
│  Upload (audio or video file)                           │
│  Formats: MP3, WAV, MP4, MOV, MKV, AVI                  │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│  Transcription (Deepgram Nova-2)                        │
│  Sessions > 10 min split into 8-min chunks              │
│  Chunks uploaded in parallel (8 workers)                │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│  Chunking + Topic Tagging (GPT-4o-mini)                 │
│  Transcript split into chunks via RecursiveCharacter    │
│  Each chunk tagged with topic and subtopics in batch    │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│  Vector Storage (Chroma Cloud)                          │
│  Chunks embedded via text-embedding-3-large             │
│  Stored in sessions collection with metadata            │
└──────────────────────────┬──────────────────────────────┘
                           │
             ┌─────────────┴─────────────┐
             ▼                           ▼
┌────────────────────────┐  ┌─────────────────────────────┐
│  Summary + Quiz        │  │  Evaluator (background)     │
│  (GPT-4.1)             │  │  (GPT-4.1)                  │
│  Structured Markdown   │  │  Concept mastery scores     │
│  summary + MCQ quiz    │  │  Misconceptions detected    │
└────────────┬───────────┘  │  Topic drift vs prev session│
             │              │  Engagement analysis        │
             │              └─────────────────────────────┘
             ▼
┌─────────────────────────────────────────────────────────┐
│  React Frontend                                         │
│  Teacher dashboard: sessions, evaluations, exports      │
│  Student dashboard: transcript, feedback, quiz          │
└─────────────────────────────────────────────────────────┘
```

---

## Features

| Feature | Description |
|:---|:---|
| **Audio/Video Transcription** | Deepgram Nova-2 with speaker diarization and punctuation |
| **Long Audio Support** | Sessions over 10 minutes chunked into 8-min segments and uploaded in parallel |
| **Session Summary** | Structured Markdown with topics covered, student performance and key takeaways |
| **Quiz Generation** | MCQs with 4 options and answer keys |
| **Concept Mastery Evaluation** | Per-concept status: understood, partial or not understood |
| **Topic Drift Tracking** | Compares current session topics against the previous session |
| **Engagement Analysis** | Speaking ratio, question density and turn-taking balance |
| **Student View** | Separate dashboard with transcript, personalized feedback and quiz |
| **PDF Export** | Playwright-based PDF export of session summaries |
| **Share Links** | HMAC-signed shareable session links |
| **LangSmith Tracing** | Full observability on all LLM calls |

---

## Tech Stack

| Layer | Technology |
|:---|:---|
| Backend | FastAPI 0.116.1, Python 3.8 |
| Frontend | React 18.2.0, React Router 6.20.0 |
| Transcription | Deepgram Nova-2 (diarization + smart format) |
| LLM (primary) | GPT-4.1 via LangChain OpenAI |
| LLM (metadata/fallback) | GPT-4o-mini |
| Embeddings | text-embedding-3-large |
| Vector Store | ChromaDB 1.0.20 (Cloud) |
| Observability | LangSmith 0.4.17 |
| PDF Export | Playwright 1.55.0 |
| Audio Processing | Deepgram SDK, pydub, moviepy, FFmpeg |

---

## Prerequisites

- Python 3.8+
- Node.js and npm
- FFmpeg
- Deepgram account (Nova-2 API access)
- OpenAI API key (GPT-4.1 access)
- Chroma Cloud account
- LangSmith account (optional)

**FFmpeg install:**
```bash
# Windows
winget install Gyan.FFmpeg

# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt install ffmpeg
```

---

## Getting Started

```bash
git clone https://github.com/muhammadhaider02/ai-tutoring-assistant.git
cd ai-tutoring-assistant
python setup.py
```

`setup.py` creates a virtual environment, installs all Python dependencies, sets up Playwright and generates a template `.env`. Fill in the generated `.env` before starting the servers.

**Start the backend:**
```bash
# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

uvicorn pipeline:app --reload
```

**Start the frontend:**
```bash
npm install
npm start
```

Frontend at `http://localhost:3000`. Backend at `http://localhost:8000`.

---

## Environment Variables

```env
# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Deepgram (audio transcription)
DEEPGRAM_API_KEY=your_deepgram_api_key
DEEPGRAM_API_URL=your_deepgram_api_url

# Chroma Cloud (vector store)
CHROMA_API_KEY=your_chroma_api_key
CHROMA_TENANT=your_team_uuid_from_settings
CHROMA_DATABASE=your_chroma_database

# LangSmith (observability)
LANGSMITH_API_KEY=your_langsmith_api_key
LANGSMITH_PROJECT=your_langsmith_project

# Signed share links
SHARE_TOKEN_SECRET=any_random_string
```

---

## Project Structure

```
ai-tutoring-assistant/
├── pipeline.py          <- FastAPI backend: transcription, LLM chains, API routes
├── setup.py             <- automated setup script (venv, deps, Playwright, .env)
├── requirements.txt     <- Python dependencies
├── package.json         <- React frontend dependencies
├── src/
│   ├── App.js           <- routing
│   ├── pages/
│   │   ├── TeacherDashboardPage.js    <- session list, evaluations
│   │   ├── TeacherCourseVideoPage.js  <- upload and session detail
│   │   ├── AISummaryPage.js           <- summary, export, share
│   │   ├── QuizPage.js                <- quiz view for tutors
│   │   ├── StudentDashboardPage.js    <- student session list
│   │   ├── StudentTranscriptPage.js   <- student transcript view
│   │   ├── StudentFeedbackPage.js     <- student feedback view
│   │   └── StudentQuizPage.js         <- student quiz view
│   └── components/
│       ├── ExportButton.js            <- PDF export
│       └── ShareControls.js          <- signed share links
├── SwaggerDocumentation.txt  <- full API reference
└── uploads/                  <- uploaded session files
```
