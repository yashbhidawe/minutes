
from fastapi import APIRouter, BackgroundTasks, Depends, Header, HTTPException, Response, UploadFile
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.db_connection import SessionLocal
from app.models.user import User
from app.repositories.action_item import ActionItemRepository
from app.repositories.meeting import MeetingRepository
from app.repositories.note import NoteRepository
from app.schemas.action_item import ActionItemResponse
from app.schemas.meeting import MeetingResponse, MeetingUploadResponse, TranscriptResponse
from app.schemas.note import NoteResponse
from app.services.audio import upload_audio
from app.services.celery_tasks import BUSY_STATUSES, dispatch_meeting_task, execute_meeting_pipeline
from app.services.storage import delete_file, download_file
from app.services.summarization import summarize_transcript
from app.services.transcription import transcribe_audio
from app.utils.auth import get_current_user

router = APIRouter(prefix="/meetings", tags=["meetings"])


def run_automated_pipeline(meeting_id: int):
    return execute_meeting_pipeline(meeting_id)


def get_session():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


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
    if meeting.audio_key:
        try:
            delete_file(meeting.audio_key)
        except Exception as exc:
            raise HTTPException(status_code=502, detail="Meeting audio could not be deleted") from exc
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


@router.get("/{meeting_id}/audio")
def get_meeting_audio(
    meeting_id: int,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    repo = MeetingRepository(session)
    meeting = repo.get_by_id(meeting_id)
    if not meeting or meeting.user_id != user.id:
        raise HTTPException(status_code=404, detail="Meeting not found")
    if not meeting.audio_key:
        raise HTTPException(status_code=404, detail="No audio file found for this meeting")
    audio_bytes = download_file(meeting.audio_key)
    return Response(content=audio_bytes, media_type="audio/webm")


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

    repo.update_status(meeting_id, "queued")
    dispatch_result = dispatch_meeting_task(meeting_id, background_tasks)

    return MeetingUploadResponse(
        meeting_id=meeting.id,
        status=dispatch_result.get("status", "queued"),
        audio_key=meeting.audio_key,
        task_id=dispatch_result.get("task_id"),
        mode=dispatch_result.get("mode"),
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

    if meeting.status in BUSY_STATUSES:
        raise HTTPException(
            status_code=409,
            detail=f"Meeting is already being processed (status: {meeting.status}). Please wait for it to finish.",
        )

    repo.update_status(meeting_id, "queued")
    dispatch_result = dispatch_meeting_task(meeting_id, background_tasks)

    return MeetingUploadResponse(
        meeting_id=meeting.id,
        status=dispatch_result.get("status", "queued"),
        audio_key=meeting.audio_key,
        task_id=dispatch_result.get("task_id"),
        mode=dispatch_result.get("mode"),
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
