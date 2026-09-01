import json
from os import getenv
from dotenv import load_dotenv
from fastapi import BackgroundTasks

load_dotenv()

ENABLE_GCP_CLOUD_TASKS = getenv("ENABLE_GCP_CLOUD_TASKS", "false").lower() in ("true", "1", "yes")
GCP_PROJECT_ID = getenv("GCP_PROJECT_ID")
GCP_LOCATION = getenv("GCP_LOCATION", "us-central1")
GCP_QUEUE_NAME = getenv("GCP_QUEUE_NAME", "meeting-processing-queue")
BACKEND_SERVICE_URL = getenv("BACKEND_SERVICE_URL", "http://localhost:8000")
INTERNAL_TASK_SECRET = getenv("INTERNAL_TASK_SECRET", "default-minute-ai-secret")


def enqueue_meeting_processing_task(
    meeting_id: int,
    background_tasks: BackgroundTasks,
    fallback_handler=None,
    request_base_url: str | None = None,
):
    """
    Enqueues meeting background processing task.
    In GCP Production: Pushes HTTP task to GCP Cloud Tasks.
    In Local Dev: Uses FastAPI BackgroundTasks directly.
    """
    if ENABLE_GCP_CLOUD_TASKS and GCP_PROJECT_ID:
        try:
            from google.cloud import tasks_v2

            client = tasks_v2.CloudTasksClient()
            parent = client.queue_path(GCP_PROJECT_ID, GCP_LOCATION, GCP_QUEUE_NAME)

            base_url = request_base_url or BACKEND_SERVICE_URL or "http://localhost:8000"
            target_url = f"{base_url.rstrip('/')}/meetings/tasks/process-meeting"
            payload = json.dumps({"meeting_id": meeting_id}).encode("utf-8")

            task = {
                "http_request": {
                    "http_method": tasks_v2.HttpMethod.POST,
                    "url": target_url,
                    "headers": {
                        "Content-Type": "application/json",
                        "X-Task-Secret": INTERNAL_TASK_SECRET,
                    },
                    "body": payload,
                }
            }

            response = client.create_task(request={"parent": parent, "task": task})
            print(f"[GCP Cloud Tasks] Task created successfully for meeting {meeting_id}: {response.name}")
            return {"status": "queued", "task_name": response.name}
        except Exception as e:
            print(f"[GCP Cloud Tasks] Failed to push task for meeting {meeting_id}: {e}. Falling back to local BackgroundTasks.")

    # Local Dev / Fallback mode
    if fallback_handler:
        background_tasks.add_task(fallback_handler, meeting_id)
        print(f"[Local Dev] Added meeting {meeting_id} to local FastAPI BackgroundTasks.")
        return {"status": "processing", "mode": "local_background_tasks"}

    return {"status": "queued", "mode": "unknown"}
