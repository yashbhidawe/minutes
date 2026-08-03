from fastapi import APIRouter, Depends, HTTPException, UploadFile
from sqlalchemy.orm import Session
from app.core.db_connection import engine
from app.repositories.meeting import MeetingRepository
from app.services.audio import upload_audio
from app.schemas.meeting import MeetingResponse, MeetingUploadResponse

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
