import os
from openai import OpenAI
from dotenv import load_dotenv

def check_openai_key():
    load_dotenv()

    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    if not OPENAI_API_KEY:
        print("No API key found! Make sure it's in a .env file or environment variable.")
        return

    client = OpenAI(api_key=OPENAI_API_KEY)

    try:
        response = client.models.list()
        print("API key is valid! Available models:")
        for model in response.data[:5]:
            print(f" - {model.id}")
    except Exception as e:
        if "401" in str(e):
            print("Invalid API key! Please check your OPENAI_API_KEY.")
        else:
            print(f"API error: {e}")

if __name__ == "__main__":
    check_openai_key()

# API key is valid! Available models:
#  - gpt-4-0613
#  - gpt-4
#  - gpt-3.5-turbo
#  - gpt-5-nano
#  - gpt-5