# setup.py - Helps set up a virtual environment and install dependencies

import os
import platform
import subprocess
import sys
from pathlib import Path

def print_colored(message, color="green"):
    """Print colored messages in terminal"""
    colors = {
        "green": "\033[92m",
        "yellow": "\033[93m",
        "red": "\033[91m",
        "blue": "\033[94m",
        "end": "\033[0m"
    }
    
    print(f"{colors.get(color, '')}{message}{colors['end']}")

def create_venv():
    """Create a virtual environment"""
    print_colored("Creating virtual environment...", "blue")
    
    if os.path.exists("venv"):
        print_colored("Virtual environment already exists.", "yellow")
        return
    
    try:
        subprocess.check_call([sys.executable, "-m", "venv", "venv"])
        print_colored("Virtual environment created successfully.", "green")
    except subprocess.CalledProcessError:
        print_colored("Failed to create virtual environment.", "red")
        sys.exit(1)

def install_requirements():
    """Install required packages from requirements.txt"""
    print_colored("Installing required packages...", "blue")
    
    # Determine the Python executable in the virtual environment
    if platform.system() == "Windows":
        python_path = os.path.join("venv", "Scripts", "python.exe")
        pip_path = os.path.join("venv", "Scripts", "pip.exe")
    else:
        python_path = os.path.join("venv", "bin", "python")
        pip_path = os.path.join("venv", "bin", "pip")
    
    # Upgrade pip
    try:
        subprocess.check_call([python_path, "-m", "pip", "install", "--upgrade", "pip"])
    except subprocess.CalledProcessError:
        print_colored("Failed to upgrade pip. Continuing with installation...", "yellow")
    
    # Install requirements
    try:
        subprocess.check_call([pip_path, "install", "-r", "requirements.txt"])
        print_colored("All packages installed successfully.", "green")
    except subprocess.CalledProcessError:
        print_colored("Failed to install some packages.", "red")
        sys.exit(1)

def setup_playwright():
    """Install Playwright browsers if needed"""
    print_colored("Setting up Playwright browsers...", "blue")
    
    if platform.system() == "Windows":
        playwright_path = os.path.join("venv", "Scripts", "playwright")
    else:
        playwright_path = os.path.join("venv", "bin", "playwright")
    
    try:
        subprocess.check_call([playwright_path, "install"])
        print_colored("Playwright browsers installed successfully.", "green")
    except subprocess.CalledProcessError:
        print_colored("Failed to install Playwright browsers. You may need to run 'playwright install' manually.", "yellow")
    except FileNotFoundError:
        print_colored("Playwright command not found. You may need to run 'playwright install' manually.", "yellow")

def check_ffmpeg():
    """Check if FFmpeg is installed"""
    print_colored("Checking for FFmpeg...", "blue")
    
    try:
        subprocess.check_call(["ffmpeg", "-version"], 
                             stdout=subprocess.DEVNULL, 
                             stderr=subprocess.DEVNULL)
        print_colored("FFmpeg is installed.", "green")
    except (subprocess.CalledProcessError, FileNotFoundError):
        print_colored("FFmpeg is not installed or not in PATH.", "yellow")
        print_colored("Please install FFmpeg following the instructions in the README.md file.", "yellow")

def create_env_template():
    """Create a template .env file if it doesn't exist"""
    if not os.path.exists(".env"):
        print_colored("Creating template .env file...", "blue")
        with open(".env", "w") as f:
            f.write("""# API Keys
OPENAI_API_KEY=

# Deepgram for audio transcription
DEEPGRAM_API_KEY=
DEEPGRAM_API_URL=https://api.deepgram.com/v1/listen

# Chroma vector database
CHROMA_API_KEY=
CHROMA_TENANT=
CHROMA_DATABASE=

# LangSmith for observability
LANGSMITH_API_KEY=
LANGSMITH_PROJECT=

# Security for sharing links
SHARE_TOKEN_SECRET=some_random_string
""")
        print_colored(".env template created. Please update with your API keys.", "green")

def main():
    """Main function to set up the environment"""
    print_colored("Setting up AI Tutoring Prototype environment...", "blue")
    
    create_venv()
    install_requirements()
    setup_playwright()
    check_ffmpeg()
    create_env_template()
    
    print_colored("\n=== Setup Complete ===", "green")
    print_colored("To activate the virtual environment:", "blue")
    
    if platform.system() == "Windows":
        print_colored("    venv\\Scripts\\activate", "yellow")
    else:
        print_colored("    source venv/bin/activate", "yellow")
    
    print_colored("\nBefore running the application:", "blue")
    print_colored("1. Update the .env file with your API keys", "yellow")
    print_colored("2. Install FFmpeg if not already installed (see README.md)", "yellow")
    print_colored("\nTo start the application:", "blue")
    print_colored("1. Activate the virtual environment", "yellow")
    print_colored("2. Run 'uvicorn pipeline:app --reload' for the backend", "yellow")
    print_colored("3. Run 'npm start' for the frontend", "yellow")

if __name__ == "__main__":
    main()
