from fastapi import APIRouter, Depends, HTTPException, UploadFile, BackgroundTasks, Header
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core.db_connection import engine, SessionLocal
from app.models.user import User
from app.utils.auth import get_current_user
from app.repositories.meeting import MeetingRepository
from app.repositories.note import NoteRepository
from app.repositories.action_item import ActionItemRepository
from app.services.audio import upload_audio
from app.services.transcription import transcribe_audio
from app.services.summarization import summarize_transcript
from app.services.storage import download_file
from app.schemas.meeting import MeetingResponse, MeetingUploadResponse, TranscriptResponse, TranscriptSegment
from app.schemas.note import NoteResponse
from app.schemas.action_item import ActionItemResponse

router = APIRouter(prefix="/meetings", tags=["meetings"])


def run_automated_pipeline(meeting_id: int):
    with SessionLocal() as session:
        repo = MeetingRepository(session)
        try:
            meeting = repo.get_by_id(meeting_id)
            if not meeting or not meeting.audio_key:
                return

            # Step 1: Download and validate audio
            repo.update_status(meeting_id, "transcribing")
            audio_bytes = download_file(meeting.audio_key)

            if len(audio_bytes) < 5000:  # < 5KB = empty/silent recording
                repo.update_error(meeting_id, "Recording too short or empty — no audio was captured.")
                repo.update_status(meeting_id, "failed")
                return

            # Step 2: Transcribe via Groq Whisper
            filename = meeting.audio_key.split("/")[-1]
            transcribe_result = transcribe_audio(audio_bytes, filename)

            if not transcribe_result["text"].strip():
                repo.update_error(meeting_id, "Transcription produced no speech — the recording may contain only background noise.")
                repo.update_status(meeting_id, "failed")
                return

            repo.save_transcript(
                meeting_id,
                transcribe_result["text"],
                transcribe_result["language"],
                segments=transcribe_result["segments"],
            )
            repo.update_status(meeting_id, "transcribed")

            # Step 3: Summarize via Gemini
            repo.update_status(meeting_id, "summarizing")
            summary = summarize_transcript(transcribe_result["text"])

            if summary.get("title"):
                repo.update_title(meeting_id, summary["title"])

            note_repo = NoteRepository(session)
            note_repo.create_many(
                meeting_id,
                {
                    "key_decisions": summary.get("key_decisions", ""),
                    "discussion_points": summary.get("discussion_points", ""),
                    "blockers": summary.get("blockers", ""),
                    "next_steps": summary.get("next_steps", ""),
                },
            )

            action_item_repo = ActionItemRepository(session)
            if summary.get("action_items"):
                action_item_repo.create_many(meeting_id, summary["action_items"])

            # Clear any previous error and mark done
            repo.update_error(meeting_id, None)
            repo.update_status(meeting_id, "completed")

        except Exception as e:
            error_msg = str(e)
            print(f"[pipeline] Error for meeting {meeting_id}: {error_msg}")
            try:
                repo.update_error(meeting_id, error_msg)
                repo.update_status(meeting_id, "failed")
            except Exception:
                pass


def get_session():
    with Session(bind=engine) as session:
        yield session


@router.get("/", response_model=list[MeetingResponse])
def list_meetings(
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    repo = MeetingRepository(session)
    return repo.get_by_user(user.id)


@router.get("/{meeting_id}", response_model=MeetingResponse)
def get_meeting(
    meeting_id: int,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    repo = MeetingRepository(session)
    meeting = repo.get_by_id(meeting_id)
    if not meeting or meeting.user_id != user.id:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return meeting


@router.get("/{meeting_id}/notes", response_model=list[NoteResponse])
def get_meeting_notes(
    meeting_id: int,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    meeting_repo = MeetingRepository(session)
    meeting = meeting_repo.get_by_id(meeting_id)
    if not meeting or meeting.user_id != user.id:
        raise HTTPException(status_code=404, detail="Meeting not found")

    note_repo = NoteRepository(session)
    return note_repo.get_by_meeting(meeting_id)


@router.get("/{meeting_id}/action-items", response_model=list[ActionItemResponse])
def get_meeting_action_items(
    meeting_id: int,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    meeting_repo = MeetingRepository(session)
    meeting = meeting_repo.get_by_id(meeting_id)
    if not meeting or meeting.user_id != user.id:
        raise HTTPException(status_code=404, detail="Meeting not found")

    action_item_repo = ActionItemRepository(session)
    return action_item_repo.get_by_meeting(meeting_id)


@router.delete("/{meeting_id}")
def delete_meeting(
    meeting_id: int,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    repo = MeetingRepository(session)
    meeting = repo.get_by_id(meeting_id)
    if not meeting or meeting.user_id != user.id:
        raise HTTPException(status_code=404, detail="Meeting not found")
    repo.delete(meeting_id)
    return {"detail": "Meeting deleted"}


class UpdateActionItemStatusRequest(BaseModel):
    status: str


@router.patch("/{meeting_id}/action-items/{item_id}", response_model=ActionItemResponse)
def update_action_item_status(
    meeting_id: int,
    item_id: int,
    body: UpdateActionItemStatusRequest,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    meeting_repo = MeetingRepository(session)
    meeting = meeting_repo.get_by_id(meeting_id)
    if not meeting or meeting.user_id != user.id:
        raise HTTPException(status_code=404, detail="Meeting not found")

    action_item_repo = ActionItemRepository(session)
    item = action_item_repo.update_status(item_id, body.status)
    if not item:
        raise HTTPException(status_code=404, detail="Action item not found")
    return item


class CreateMeetingRequest(BaseModel):
    title: str
    duration_sec: int


@router.post("/", response_model=MeetingResponse)
def create_meeting(
    body: CreateMeetingRequest,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    repo = MeetingRepository(session)
    meeting = repo.create(user_id=user.id, title=body.title, duration_sec=body.duration_sec)
    return meeting


@router.post("/{meeting_id}/upload-audio", response_model=MeetingUploadResponse)
async def upload_meeting_audio(
    meeting_id: int,
    file: UploadFile,
    background_tasks: BackgroundTasks,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
    x_recording_duration: int | None = Header(default=None, alias="X-Recording-Duration"),
):
    repo = MeetingRepository(session)
    meeting = repo.get_by_id(meeting_id)
    if not meeting or meeting.user_id != user.id:
        raise HTTPException(status_code=404, detail="Meeting not found")

    meeting = await upload_audio(meeting_id, file, repo)

    # Update actual recorded duration if sent from extension
    if x_recording_duration and x_recording_duration > 0:
        repo.update_duration(meeting_id, x_recording_duration)

    repo.update_status(meeting_id, "processing")
    background_tasks.add_task(run_automated_pipeline, meeting_id)

    return MeetingUploadResponse(
        meeting_id=meeting.id,
        status="processing",
        audio_key=meeting.audio_key,
    )


@router.post("/{meeting_id}/reprocess", response_model=MeetingUploadResponse)
def reprocess_meeting(
    meeting_id: int,
    background_tasks: BackgroundTasks,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    repo = MeetingRepository(session)
    meeting = repo.get_by_id(meeting_id)
    if not meeting or meeting.user_id != user.id:
        raise HTTPException(status_code=404, detail="Meeting not found")
    if not meeting.audio_key:
        raise HTTPException(status_code=400, detail="No audio file found for this meeting")

    repo.update_status(meeting_id, "processing")
    background_tasks.add_task(run_automated_pipeline, meeting_id)

    return MeetingUploadResponse(
        meeting_id=meeting.id,
        status="processing",
        audio_key=meeting.audio_key,
    )


@router.get("/{meeting_id}/transcript", response_model=TranscriptResponse)
def get_meeting_transcript(
    meeting_id: int,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    repo = MeetingRepository(session)
    meeting = repo.get_by_id(meeting_id)
    if not meeting or meeting.user_id != user.id:
        raise HTTPException(status_code=404, detail="Meeting not found")

    transcript = repo.get_transcript(meeting_id)
    if not transcript:
        raise HTTPException(status_code=404, detail="Transcript not found")
    return transcript


@router.post("/{meeting_id}/transcribe", response_model=TranscriptResponse)
def transcribe_meeting(
    meeting_id: int,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    repo = MeetingRepository(session)

    meeting = repo.get_by_id(meeting_id)
    if not meeting or meeting.user_id != user.id:
        raise HTTPException(status_code=404, detail="Meeting not found")

    if not meeting.audio_key:
        raise HTTPException(status_code=400, detail="No audio uploaded for this meeting")

    existing = repo.get_transcript(meeting_id)
    if existing:
        return existing

    audio_bytes = download_file(meeting.audio_key)

    filename = meeting.audio_key.split("/")[-1]
    result = transcribe_audio(audio_bytes, filename)

    transcript = repo.save_transcript(
        meeting_id,
        result["text"],
        result["language"],
        segments=result["segments"],
    )

    repo.update_status(meeting_id, "transcribed")

    return transcript


class SummarizeResponse(BaseModel):
    meeting_id: int
    key_decisions: str
    discussion_points: str
    blockers: str
    next_steps: str
    notes: list[NoteResponse]
    action_items: list[ActionItemResponse]


@router.post("/{meeting_id}/summarize", response_model=SummarizeResponse)
def summarize_meeting(
    meeting_id: int,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    meeting_repo = MeetingRepository(session)
    note_repo = NoteRepository(session)
    action_item_repo = ActionItemRepository(session)

    meeting = meeting_repo.get_by_id(meeting_id)
    if not meeting or meeting.user_id != user.id:
        raise HTTPException(status_code=404, detail="Meeting not found")

    transcript = meeting_repo.get_transcript(meeting_id)
    if not transcript:
        raise HTTPException(status_code=400, detail="No transcript available. Transcribe the meeting first.")

    existing_notes = note_repo.get_by_meeting(meeting_id)
    if existing_notes:
        existing_items = action_item_repo.get_by_meeting(meeting_id)
        notes_by_section = {n.section: n.content for n in existing_notes}
        return SummarizeResponse(
            meeting_id=meeting_id,
            key_decisions=notes_by_section.get("key_decisions", ""),
            discussion_points=notes_by_section.get("discussion_points", ""),
            blockers=notes_by_section.get("blockers", ""),
            next_steps=notes_by_section.get("next_steps", ""),
            notes=[NoteResponse.model_validate(n) for n in existing_notes],
            action_items=[ActionItemResponse.model_validate(i) for i in existing_items],
        )

    result = summarize_transcript(transcript.raw_text)

    sections = {
        "key_decisions": result.get("key_decisions", ""),
        "discussion_points": result.get("discussion_points", ""),
        "blockers": result.get("blockers", ""),
        "next_steps": result.get("next_steps", ""),
    }
    action_items_data = result.get("action_items", [])

    notes = note_repo.create_many(meeting_id=meeting_id, sections=sections)
    items = action_item_repo.create_many(meeting_id=meeting_id, items=action_items_data)

    meeting_repo.update_status(meeting_id, "summarized")

    return SummarizeResponse(
        meeting_id=meeting_id,
        key_decisions=sections["key_decisions"],
        discussion_points=sections["discussion_points"],
        blockers=sections["blockers"],
        next_steps=sections["next_steps"],
        notes=[NoteResponse.model_validate(n) for n in notes],
        action_items=[ActionItemResponse.model_validate(i) for i in items],
    )
