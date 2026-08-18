from sqlalchemy.orm import Session
from app.models.meeting import Meeting
from app.models.transcript import Transcript


class MeetingRepository:
    def __init__(self, session: Session):
        self.session = session

    def get_by_id(self, meeting_id: int) -> Meeting | None:
        return self.session.query(Meeting).filter_by(id=meeting_id).first()

    def get_by_user(self, user_id: int) -> list[Meeting]:
        return (
            self.session.query(Meeting)
            .filter_by(user_id=user_id)
            .order_by(Meeting.created_at.desc())
            .all()
        )

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

    def get_transcript(self, meeting_id: int) -> Transcript | None:
        return self.session.query(Transcript).filter_by(meeting_id=meeting_id).first()

    def save_transcript(self, meeting_id: int, raw_text: str, language: str, segments: str = None) -> Transcript:
        transcript = Transcript(
            meeting_id=meeting_id,
            raw_text=raw_text,
            language=language,
            segments=segments,
        )
        self.session.add(transcript)
        self.session.commit()
        self.session.refresh(transcript)
        return transcript
