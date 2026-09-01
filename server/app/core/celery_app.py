from os import getenv
from celery import Celery

REDIS_URL = getenv("REDIS_URL", "redis://localhost:6379/0")
ENABLE_CELERY = getenv("ENABLE_CELERY", "true").lower() in ("true", "1", "yes")

celery_app = Celery(
    "minuteai_tasks",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=["app.services.celery_tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    broker_connection_retry_on_startup=True,
)
