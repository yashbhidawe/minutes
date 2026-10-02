from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.db_connection import SessionLocal
from app.models.user import User
from app.repositories.chunks import ChunkRepository
from app.repositories.meeting import MeetingRepository
from app.schemas.chat import AskRequest, AskResponse, IndexResponse
from app.services.rag import answer_question, index_meeting
from app.utils.auth import get_current_user

router = APIRouter(prefix="/meetings", tags=["chat"])


def get_session():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


def _owned_meeting(meeting_id: int, user: User, session: Session):
    repo = MeetingRepository(session)
    meeting = repo.get_by_id(meeting_id)
    if not meeting or meeting.user_id != user.id:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return meeting


@router.post("/{meeting_id}/index", response_model=IndexResponse)
def index_meeting_for_search(
    meeting_id: int,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    _owned_meeting(meeting_id, user, session)
    count = index_meeting(meeting_id, session)
    return IndexResponse(meeting_id=meeting_id, chunks_indexed=count)


@router.post("/{meeting_id}/ask", response_model=AskResponse)
def ask_meeting(
    meeting_id: int,
    body: AskRequest,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    _owned_meeting(meeting_id, user, session)

    # Auto-index on first ask so pre-RAG meetings work without a manual step.
    if ChunkRepository(session).count_by_meeting(meeting_id) == 0:
        index_meeting(meeting_id, session)

    result = answer_question(meeting_id, body.question, session, top_k=body.top_k)
    return AskResponse(
        meeting_id=meeting_id,
        question=body.question,
        answer=result["answer"],
        citations=result["citations"],
        retrieved_chunks=result["retrieved_chunks"],
    )
