import os
from pathlib import Path
from typing import Union
from dotenv import load_dotenv
import requests
from pydub import AudioSegment
from moviepy.video.io.VideoFileClip import VideoFileClip

load_dotenv()
GLADIA_API_URL = "https://api.gladia.io/audio/text/audio-transcription/"
GLADIA_API_KEY = os.getenv("GLADIA_API_KEY")

def to_wav(src: Union[str, Path], dst: Union[str, Path] = None) -> str:
    """
    Convert MP3, MP4, MOV, MKV, AVI, or other audio/video files to WAV.
    If already WAV, just return the same path.
    """
    src = str(src)
    ext = Path(src).suffix.lower()

    if ext == ".wav":
        print(f"File is already WAV: {src}")
        return src

    if dst is None:
        dst = str(Path(src).with_suffix(".wav"))

    if ext == ".mp3":
        audio = AudioSegment.from_mp3(src)
        audio.export(dst, format="wav")
    elif ext in {".mp4", ".mov", ".mkv", ".avi"}:
        video = VideoFileClip(src)
        try:
            video.audio.write_audiofile(dst)
        finally:
            video.close()
    else:
        audio = AudioSegment.from_file(src)
        audio.export(dst, format="wav")

    print(f"Converted {src} → {dst}")
    return dst

def transcribe_audio(filepath: str) -> str:
    """
    Send audio to Gladia API and return only transcript text.
    """
    if not GLADIA_API_KEY:
        raise ValueError("Missing GLADIA_API_KEY. Add it to your .env file.")

    headers = {"x-gladia-key": GLADIA_API_KEY}
    filename, ext = os.path.splitext(filepath)

    with open(filepath, "rb") as audio_file:
        files = {
            "audio": (os.path.basename(filepath), audio_file, f"audio/{ext[1:]}"),
            "toggle_diarization": (None, "true"),
            "diarization_max_speakers": (None, "2"),
            "output_format": (None, "txt"),
        }
        resp = requests.post(GLADIA_API_URL, headers=headers, files=files, timeout=120)

    if resp.status_code != 200:
        raise Exception(f"Error {resp.status_code}: {resp.text}")

    data = resp.json()
    transcript = data.get("prediction", "")
    return transcript

def convert_and_transcribe(input_file: str) -> str:
    """
    Full pipeline: Convert input file to WAV, then get transcript.
    Saves transcript to a .txt file with the same base name.
    """
    wav_file = to_wav(input_file)
    transcript = transcribe_audio(wav_file)

    txt_file = Path(input_file).with_suffix(".txt")

    with open(txt_file, "w", encoding="utf-8") as f:
        f.write(transcript)

    print(f"Transcript saved to {txt_file}")
    return transcript

if __name__ == "__main__":
    file_path = "t4.wav"
    transcript = convert_and_transcribe(file_path)
    print(transcript)