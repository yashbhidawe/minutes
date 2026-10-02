import json
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


# Statuses that mean a background job is already running for a meeting.
# The API layer uses this to reject duplicate reprocess requests with 409.
BUSY_STATUSES = frozenset({"queued", "transcribing", "transcribed", "summarizing"})


def execute_meeting_pipeline(meeting_id: int, is_final_attempt: bool = True):
    """
    Executes full audio pipeline:
    1. Downloads audio from Cloudflare R2
    2. Chunks audio (FFmpeg/Pydub <=10 min) & transcribes via Groq Whisper API
    3. Saves timestamped transcript segments
    4. Summarizes & extracts action items via Gemini 3.6 Flash
    5. Saves notes and updates meeting status to completed

    Idempotent: existing transcript/notes/action items are deleted just
    before the new ones are written, so retries and reprocesses never
    create duplicates.

    is_final_attempt: False when a Celery retry will follow. Transient
    failures then leave the meeting "queued" instead of flashing "failed".
    Direct/BackgroundTasks callers have no retries, so the default True
    preserves their fail-fast behavior.
    """
    with SessionLocal() as session:
        repo = MeetingRepository(session)
        try:
            meeting = repo.get_by_id(meeting_id)
            if not meeting or not meeting.audio_key:
                print(f"[Pipeline Warning] Meeting ID {meeting_id} not found or missing audio.")
                return False

            repo.update_status(meeting_id, "transcribing")
            print(f"[Pipeline] Processing audio for meeting ID: {meeting_id}")
            audio_bytes = download_file(meeting.audio_key)

            if len(audio_bytes) < 5000:
                repo.update_error(meeting_id, "Recording too short or empty — no audio was captured.")
                repo.update_status(meeting_id, "failed")
                return False

            # Transcribe audio with automatic <=10 min chunking & timestamp stitching
            filename = meeting.audio_key.rsplit("/", 1)[-1]
            transcribe_result = process_and_transcribe_audio(audio_bytes, filename)

            if not transcribe_result or not transcribe_result.get("text", "").strip():
                repo.update_error(meeting_id, "Transcription produced no speech — the recording may contain only background noise.")
                repo.update_status(meeting_id, "failed")
                return False

            raw_text = transcribe_result["text"]
            language = transcribe_result.get("language", "english")
            segments = transcribe_result.get("segments", [])
            segments_json = json.dumps(segments) if isinstance(segments, list) else segments

            # Delete-before-insert: a retry/reprocess replaces results instead of duplicating them.
            repo.delete_transcript(meeting_id)
            repo.save_transcript(
                meeting_id=meeting_id,
                raw_text=raw_text,
                language=language,
                segments=segments_json,
            )
            repo.update_status(meeting_id, "transcribed")

            # Index transcript chunks for RAG search (best-effort: never fail
            # the pipeline if embeddings are down — /ask auto-indexes later).
            try:
                from app.services.rag import index_meeting as _index_meeting

                _index_meeting(meeting_id, session)
            except Exception as e:
                print(f"[Pipeline Warning] RAG indexing skipped for meeting {meeting_id}: {e}")

            # Summarize via Gemini
            repo.update_status(meeting_id, "summarizing")
            summary = summarize_transcript(raw_text)

            if summary.get("title"):
                repo.update_title(meeting_id, summary["title"])

            note_repo = NoteRepository(session)
            action_item_repo = ActionItemRepository(session)
            # Delete-before-insert (only after summarization succeeded,
            # so a summarize failure keeps the previous good notes/items).
            note_repo.delete_by_meeting(meeting_id)
            action_item_repo.delete_by_meeting(meeting_id)
            note_repo.create_many(
                meeting_id,
                {
                    "key_decisions": summary.get("key_decisions", ""),
                    "discussion_points": summary.get("discussion_points", ""),
                    "blockers": summary.get("blockers", ""),
                    "next_steps": summary.get("next_steps", ""),
                },
            )

            if summary.get("action_items"):
                action_item_repo.create_many(meeting_id, summary["action_items"])

            repo.update_error(meeting_id, None)
            repo.update_status(meeting_id, "completed")
            print(f"[Pipeline] Successfully completed meeting ID: {meeting_id}")
            return True
        except Exception as e:
            session.rollback()
            if is_final_attempt:
                print(f"[Pipeline Error] Exception during processing for meeting ID {meeting_id}: {e}")
                repo.update_error(meeting_id, str(e))
                repo.update_status(meeting_id, "failed")
            else:
                # A Celery retry is coming — stay queued instead of flashing "failed".
                print(f"[Pipeline] Transient failure for meeting ID {meeting_id}, awaiting retry: {e}")
                repo.update_status(meeting_id, "queued")
            raise


@celery_app.task(name="app.services.celery_tasks.process_meeting_celery_task", bind=True, max_retries=3)
def process_meeting_celery_task(self, meeting_id: int):
    """
    Celery background worker task for asynchronous meeting processing.
    Auto-retries up to 3 times on transient failures. Only the final
    attempt marks the meeting as failed; earlier attempts re-queue it.
    """
    is_final_attempt = self.request.retries >= self.max_retries
    try:
        return execute_meeting_pipeline(meeting_id, is_final_attempt=is_final_attempt)
    except Exception as exc:
        if self.request.retries >= self.max_retries:
            # Already marked failed inside execute_meeting_pipeline — stop retrying.
            raise
        print(f"[Celery Worker] Retrying meeting {meeting_id} (attempt {self.request.retries + 1}/3) due to error: {exc}")
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
