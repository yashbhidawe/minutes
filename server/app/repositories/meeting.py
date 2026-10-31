from datetime import UTC, datetime

from sqlalchemy import or_, update
from sqlalchemy.orm import Session

from app.models.actionItem import ActionItem
from app.models.meeting import Meeting
from app.models.meeting_chunk import MeetingChunk
from app.models.note import Note
from app.models.transcript import Transcript


def _now_iso() -> str:
    return datetime.now(UTC).isoformat()


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

    def update_status(self, meeting_id: int, status: str, audio_key: str | None = None) -> Meeting | None:
        meeting = self.get_by_id(meeting_id)
        if not meeting:
            return None
        meeting.status = status
        meeting.updated_at = _now_iso()  # doubles as the processing heartbeat
        if audio_key:
            meeting.audio_key = audio_key
        self.session.commit()
        self.session.refresh(meeting)
        return meeting

    def claim_for_processing(
        self, meeting_id: int, running_statuses: frozenset[str], stale_before: str
    ) -> bool:
        """Atomically move a meeting to "transcribing" unless a live job owns it.

        A job is live when the meeting is in a running status and its
        updated_at heartbeat is newer than `stale_before`. The single UPDATE
        means two workers racing on the same meeting cannot both win.
        """
        result = self.session.execute(
            update(Meeting)
            .where(
                Meeting.id == meeting_id,
                or_(Meeting.status.not_in(running_statuses), Meeting.updated_at < stale_before),
            )
            .values(status="transcribing", updated_at=_now_iso())
        )
        self.session.commit()
        return result.rowcount == 1

    def fail_stale(self, user_id: int, busy_statuses: frozenset[str], stale_before: str, message: str) -> int:
        """Marks a user's meetings stuck in a busy status as failed so they can be reprocessed."""
        result = self.session.execute(
            update(Meeting)
            .where(
                Meeting.user_id == user_id,
                Meeting.status.in_(busy_statuses),
                Meeting.updated_at < stale_before,
            )
            .values(status="failed", error_message=message, updated_at=_now_iso())
        )
        self.session.commit()
        return result.rowcount

    def update_title(self, meeting_id: int, title: str) -> Meeting | None:
        meeting = self.get_by_id(meeting_id)
        if not meeting:
            return None
        meeting.title = title
        self.session.commit()
        self.session.refresh(meeting)
        return meeting

    def update_duration(self, meeting_id: int, duration_sec: int) -> Meeting | None:
        meeting = self.get_by_id(meeting_id)
        if not meeting:
            return None
        meeting.duration_sec = duration_sec
        self.session.commit()
        self.session.refresh(meeting)
        return meeting

    def update_error(self, meeting_id: int, error_message: str) -> Meeting | None:
        meeting = self.get_by_id(meeting_id)
        if not meeting:
            return None
        meeting.error_message = error_message
        self.session.commit()
        self.session.refresh(meeting)
        return meeting

    def delete(self, meeting_id: int) -> bool:
        meeting = self.get_by_id(meeting_id)
        if not meeting:
            return False
        self.session.query(ActionItem).filter_by(meeting_id=meeting_id).delete(synchronize_session=False)
        self.session.query(Note).filter_by(meeting_id=meeting_id).delete(synchronize_session=False)
        self.session.query(Transcript).filter_by(meeting_id=meeting_id).delete(synchronize_session=False)
        self.session.query(MeetingChunk).filter_by(meeting_id=meeting_id).delete(synchronize_session=False)
        self.session.delete(meeting)
        self.session.commit()
        return True

    def get_transcript(self, meeting_id: int) -> Transcript | None:
        return self.session.query(Transcript).filter_by(meeting_id=meeting_id).first()

    def delete_transcript(self, meeting_id: int) -> int:
        """Deletes existing transcript(s) for a meeting. Makes the pipeline idempotent on retry/reprocess."""
        count = (
            self.session.query(Transcript)
            .filter_by(meeting_id=meeting_id)
            .delete(synchronize_session=False)
        )
        self.session.commit()
        return count

    def save_transcript(self, meeting_id: int, raw_text: str, language: str, segments: str | None = None) -> Transcript:
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
