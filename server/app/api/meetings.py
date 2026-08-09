from fastapi import APIRouter, Depends, HTTPException, UploadFile
from sqlalchemy.orm import Session
from app.core.db_connection import engine
from app.repositories.meeting import MeetingRepository
from app.services.audio import upload_audio
from app.services.transcription import transcribe_audio
from app.services.storage import download_file
from app.schemas.meeting import MeetingResponse, MeetingUploadResponse, TranscriptResponse

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

    transcript = repo.save_transcript(meeting_id, result["text"], result["language"])

    repo.update_status(meeting_id, "transcribed")

    return transcript
