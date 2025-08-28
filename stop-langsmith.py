from datetime import datetime
from langsmith import Client
from dotenv import load_dotenv
import os

load_dotenv()

LANGSMITH_API_KEY = os.getenv("LANGSMITH_API_KEY")
PROJECT_NAME = "Haider-PlayX"   # must match exactly your LangSmith project name

client = Client(api_key=LANGSMITH_API_KEY)

# List runs for that project
runs = client.list_runs(project_name=PROJECT_NAME, limit=100)

for run in runs:
    if not getattr(run, "end_time", None):
        print("Force-stopping run:", run.id, run.name)
        client.update_run(
            run.id,
            end_time=datetime.utcnow(),
            error="Manually stopped"
        )
