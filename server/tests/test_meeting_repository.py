from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.db_connection import Base
from app.models.actionItem import ActionItem
from app.models.meeting import Meeting
from app.models.note import Note
from app.models.transcript import Transcript
from app.models.user import User
from app.repositories.meeting import MeetingRepository


def test_delete_removes_meeting_dependents():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    session_factory = sessionmaker(bind=engine)

    with session_factory() as session:
        user = User(email="owner@example.com", password_hash="hash")
        session.add(user)
        session.flush()

        meeting = Meeting(user_id=user.id, title="Planning", duration_sec=600, status="completed")
        session.add(meeting)
        session.flush()
        session.add_all(
            [
                Transcript(meeting_id=meeting.id, raw_text="Transcript", language="en"),
                Note(meeting_id=meeting.id, section="next_steps", content="Ship it"),
                ActionItem(meeting_id=meeting.id, description="Ship release"),
            ]
        )
        session.commit()

        repository = MeetingRepository(session)
        assert repository.delete(meeting.id) is True
        assert session.query(Meeting).filter_by(id=meeting.id).first() is None
        assert session.query(Transcript).filter_by(meeting_id=meeting.id).count() == 0
        assert session.query(Note).filter_by(meeting_id=meeting.id).count() == 0
        assert session.query(ActionItem).filter_by(meeting_id=meeting.id).count() == 0
