from sqlalchemy.orm import Session
from app.models.meeting import Meeting


class MeetingRepository:
    def __init__(self, session: Session):
        self.session = session

    def get_by_id(self, meeting_id: int) -> Meeting | None:
        return self.session.query(Meeting).filter_by(id=meeting_id).first()

    def create(self, user_id: int, title: str, duration_sec: int) -> Meeting:
        meeting = Meeting(
            user_id=user_id,
            title=title,
            duration_sec=duration_sec,
        )
        self.session.add(meeting)
        self.session.commit()
        self.session.refresh(meeting)
        return meeting

    def update_status(self, meeting_id: int, status: str, audio_key: str = None) -> Meeting | None:
        meeting = self.get_by_id(meeting_id)
        if not meeting:
            return None
        meeting.status = status
        if audio_key:
            meeting.audio_key = audio_key
        self.session.commit()
        self.session.refresh(meeting)
        return meeting
