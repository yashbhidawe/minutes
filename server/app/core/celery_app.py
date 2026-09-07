from os import getenv
from celery import Celery
from celery.signals import worker_process_init

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
    # Long transcription/summarization jobs: ack only on completion so a
    # crashed worker requeues instead of losing the meeting, and don't
    # prefetch extra jobs onto a busy worker.
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    worker_prefetch_multiplier=1,
    # Bound hung Groq/Gemini calls: soft limit lets the task fail cleanly
    # (and retry), hard limit kills a truly stuck worker process.
    task_soft_time_limit=1500,
    task_time_limit=1800,
)


@worker_process_init.connect
def _dispose_db_engine_on_fork(**kwargs):
    """Forked prefork children inherit the parent's DB connections — drop
    them so each child reconnects cleanly instead of sharing sockets."""
    from app.core.db_connection import engine

    engine.dispose()
