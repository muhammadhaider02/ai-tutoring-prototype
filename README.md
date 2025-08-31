# AI Tutoring Prototype

This project is a prototype web application that demonstrates the core flow of AI-enhanced tutoring sessions: Upload a tutoring session → AI generates smart content (summary, feedback, quiz) → Tutor and student access it in a simple dashboard.

## Project Setup

### Prerequisites

1. **Python 3.8+**
2. **Node.js and npm** (for the React frontend)
3. **FFmpeg** (for audio/video processing)

### Setting Up the Project Environment

#### Automated Setup

We've created a setup script to make the installation process easy:

1. Clone the repository
2. Navigate to the project directory
3. Run the setup script:

```bash
# On Windows
python setup.py

# On macOS/Linux
python3 setup.py
```

This will:
- Create a virtual environment
- Install all required Python packages
- Set up Playwright browsers (for PDF export)
- Create a template .env file
- Check for FFmpeg installation

4. Create a `.env` file in the project root with the necessary API keys.

## How to Install FFmpeg on Windows

### Download FFmpeg Windows build

- Go to: https://www.gyan.dev/ffmpeg/builds/
- Scroll down to "Release builds"
- Click "ffmpeg-git-full.7z" or "ffmpeg-release-full.7z" under Windows Builds by BtbN.

### Extract the downloaded archive

- Use 7-Zip or WinRAR to extract.
- You'll get a folder like ffmpeg-2025-08-26-git-full.

### Move and rename the folder

- Move that folder to C:\ffmpeg
- Rename it simply to ffmpeg.

### Add FFmpeg to PATH

- Press Win+R, type sysdm.cpl, hit Enter.
- Go to Advanced → Environment Variables.
- In System variables, find Path → Edit → New.
- Add:
  ```
  C:\ffmpeg\bin
  ```
- Click OK.

### Verify installation

- Open PowerShell or CMD and run:
  ```
  ffmpeg -version
  ```
- If you see version details, you're good.

## Installing FFmpeg on macOS

```bash
# Using Homebrew
brew install ffmpeg
```

## Installing FFmpeg on Linux

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install ffmpeg

# Fedora
sudo dnf install ffmpeg
```

## Running the Application

### Backend

1. Activate the virtual environment:
```bash
# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

2. Start the FastAPI server:
```bash
uvicorn pipeline:app --reload
```

### Frontend

In a separate terminal:

1. Install frontend dependencies:
```bash
npm install
```

2. Start the React development server:
```bash
npm start
```

The application should now be running at http://localhost:3000.

## Environment Variables

Create a `.env` file in the project root with the following variables:
```
# API Keys
OPENAI_API_KEY=your_openai_api_key

# Deepgram for audio transcription
DEEPGRAM_API_KEY=your_deepgram_api_key
DEEPGRAM_API_URL=deepgram_api_url

# Chroma vector database
CHROMA_API_KEY=your_chroma_api_key
CHROMA_TENANT=your_chroma_tenant (Team-UUID from settings)
CHROMA_DATABASE=your_chroma_database

# LangSmith for observability
LANGSMITH_API_KEY=your_langsmith_api_key
LANGSMITH_PROJECT=your_langsmith_project

# Security for sharing links
SHARE_TOKEN_SECRET=some_random_string
```