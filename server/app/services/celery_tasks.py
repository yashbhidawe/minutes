import os
from fastapi import BackgroundTasks
from app.core.celery_app import celery_app, ENABLE_CELERY
from app.core.db_connection import SessionLocal
from app.repositories.meeting import MeetingRepository
from app.repositories.note import NoteRepository
from app.repositories.action_item import ActionItemRepository
from app.services.storage import download_file
from app.services.audio_chunker import process_and_transcribe_audio
from app.services.summarization import summarize_transcript


def execute_meeting_pipeline(meeting_id: int):
    """
    Executes full audio pipeline:
    1. Downloads audio from Cloudflare R2
    2. Chunks audio (FFmpeg/Pydub <=10 min) & transcribes via Groq Whisper API
    3. Saves timestamped transcript segments
    4. Summarizes & extracts action items via Gemini 3.6 Flash
    5. Saves notes and updates meeting status to completed
    """
    with SessionLocal() as session:
        repo = MeetingRepository(session)
        try:
            meeting = repo.get_by_id(meeting_id)
            if not meeting or not meeting.audio_key:
                print(f"[Pipeline Warning] Meeting ID {meeting_id} not found or missing audio.")
                return False

            repo.update_status(meeting_id, "processing")
            print(f"[Pipeline] Processing audio for meeting ID: {meeting_id}")
            audio_bytes = download_file(meeting.audio_key)

            # Transcribe audio with automatic <=10 min chunking & timestamp stitching
            filename = meeting.audio_key.rsplit("/", 1)[-1]
            raw_transcript = process_and_transcribe_audio(audio_bytes, filename)

            if not raw_transcript:
                repo.update_status(meeting_id, "failed")
                print(f"[Pipeline Error] Empty transcript returned for meeting ID: {meeting_id}")
                return False

            saved_transcript = repo.save_transcript(meeting_id, raw_transcript)

            transcript_text = "\n".join(
                f"[{seg.get('start', 0.0):.1f}s - {seg.get('end', 0.0):.1f}s] {seg.get('speaker', 'Speaker')}: {seg.get('text', '')}"
                for seg in saved_transcript
            )

            summary_result = summarize_transcript(transcript_text)
            note_repo = NoteRepository(session)
            action_item_repo = ActionItemRepository(session)

            note_repo.save_notes(meeting_id, summary_result.get("summary", []))
            action_item_repo.save_action_items(meeting_id, summary_result.get("action_items", []))

            repo.update_status(meeting_id, "completed")
            print(f"[Pipeline] Successfully completed meeting ID: {meeting_id}")
            return True
        except Exception as e:
            print(f"[Pipeline Error] Exception during processing for meeting ID {meeting_id}: {e}")
            repo.update_status(meeting_id, "failed")
            raise e


@celery_app.task(name="app.services.celery_tasks.process_meeting_celery_task", bind=True, max_retries=3)
def process_meeting_celery_task(self, meeting_id: int):
    """
    Celery background worker task for asynchronous meeting processing.
    Auto-retries up to 3 times on transient failures.
    """
    try:
        return execute_meeting_pipeline(meeting_id)
    except Exception as exc:
        print(f"[Celery Worker] Retrying meeting {meeting_id} due to error: {exc}")
        raise self.retry(exc=exc, countdown=10)


def dispatch_meeting_task(meeting_id: int, background_tasks: BackgroundTasks | None = None):
    """
    Dispatches meeting background job.
    1. Tries Celery + Redis first if ENABLE_CELERY is True.
    2. Fallback to FastAPI BackgroundTasks if Redis is unavailable or disabled.
    """
    if ENABLE_CELERY:
        try:
            task = process_meeting_celery_task.delay(meeting_id)
            print(f"[Celery Queue] Enqueued task {task.id} for meeting ID: {meeting_id}")
            return {"status": "queued", "task_id": task.id, "mode": "celery"}
        except Exception as e:
            print(f"[Celery Dispatch Warning] Could not enqueue to Redis/Celery ({e}). Falling back to FastAPI BackgroundTasks.")

    if background_tasks:
        background_tasks.add_task(execute_meeting_pipeline, meeting_id)
        return {"status": "queued", "mode": "fastapi_background"}

    # Direct synchronous fallback for CLI / testing environment
    execute_meeting_pipeline(meeting_id)
    return {"status": "queued", "mode": "direct"}
