from fastapi import APIRouter, Depends, HTTPException, UploadFile
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core.db_connection import engine
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


def get_session():
    with Session(bind=engine) as session:
        yield session


@router.post("/", response_model=MeetingResponse)
def create_meeting(title: str, duration_sec: int, session: Session = Depends(get_session)):
    repo = MeetingRepository(session)
    meeting = repo.create(user_id=1, title=title, duration_sec=duration_sec)
    return meeting


@router.post("/{meeting_id}/upload-audio", response_model=MeetingUploadResponse)
async def upload_meeting_audio(meeting_id: int, file: UploadFile, session: Session = Depends(get_session)):
    repo = MeetingRepository(session)
    meeting = await upload_audio(meeting_id, file, repo)
    return MeetingUploadResponse(
        meeting_id=meeting.id,
        status=meeting.status,
        audio_key=meeting.audio_key,
    )


@router.post("/{meeting_id}/transcribe", response_model=TranscriptResponse)
def transcribe_meeting(meeting_id: int, session: Session = Depends(get_session)):
    repo = MeetingRepository(session)

    meeting = repo.get_by_id(meeting_id)
    if not meeting:
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
def summarize_meeting(meeting_id: int, session: Session = Depends(get_session)):
    meeting_repo = MeetingRepository(session)
    note_repo = NoteRepository(session)
    action_item_repo = ActionItemRepository(session)

    meeting = meeting_repo.get_by_id(meeting_id)
    if not meeting:
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
