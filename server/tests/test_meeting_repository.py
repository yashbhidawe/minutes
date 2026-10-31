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


def _meeting_with_status(db_session, status, updated_at):
    user = User(email=f"{status}-{updated_at}@example.com", password_hash="hash")
    db_session.add(user)
    db_session.flush()
    meeting = Meeting(user_id=user.id, title="m", duration_sec=1, status=status, updated_at=updated_at)
    db_session.add(meeting)
    db_session.commit()
    return meeting


RUNNING = frozenset({"transcribing", "transcribed", "summarizing"})


def test_claim_succeeds_for_queued_meeting(db_session):
    meeting = _meeting_with_status(db_session, "queued", "2026-01-01T00:00:00+00:00")
    repo = MeetingRepository(db_session)

    assert repo.claim_for_processing(meeting.id, RUNNING, "2026-01-01T00:00:00+00:00")
    assert repo.get_by_id(meeting.id).status == "transcribing"


def test_claim_refused_while_live_job_owns_meeting(db_session):
    meeting = _meeting_with_status(db_session, "summarizing", "2026-06-01T00:00:00+00:00")
    repo = MeetingRepository(db_session)

    assert not repo.claim_for_processing(meeting.id, RUNNING, "2026-05-01T00:00:00+00:00")
    assert repo.get_by_id(meeting.id).status == "summarizing"


def test_claim_takes_over_stale_running_meeting(db_session):
    meeting = _meeting_with_status(db_session, "transcribing", "2026-01-01T00:00:00+00:00")
    repo = MeetingRepository(db_session)

    assert repo.claim_for_processing(meeting.id, RUNNING, "2026-05-01T00:00:00+00:00")


def test_second_claim_loses_race(db_session):
    meeting = _meeting_with_status(db_session, "queued", "2026-06-01T00:00:00+00:00")
    repo = MeetingRepository(db_session)
    cutoff = "2026-05-01T00:00:00+00:00"

    assert repo.claim_for_processing(meeting.id, RUNNING, cutoff)
    assert not repo.claim_for_processing(meeting.id, RUNNING, cutoff)


def test_fail_stale_only_fails_old_busy_meetings(db_session):
    busy = frozenset({"queued", "transcribing", "transcribed", "summarizing"})
    old = _meeting_with_status(db_session, "queued", "2026-01-01T00:00:00+00:00")
    fresh = _meeting_with_status(db_session, "transcribing", "2026-06-01T00:00:00+00:00")
    done = _meeting_with_status(db_session, "completed", "2026-01-01T00:00:00+00:00")
    repo = MeetingRepository(db_session)

    assert repo.fail_stale(old.user_id, busy, "2026-05-01T00:00:00+00:00", "timed out") == 1
    assert repo.get_by_id(old.id).status == "failed"
    assert repo.get_by_id(old.id).error_message == "timed out"
    assert repo.get_by_id(fresh.id).status == "transcribing"
    assert repo.fail_stale(done.user_id, busy, "2026-05-01T00:00:00+00:00", "x") == 0
