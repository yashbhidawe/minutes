import json
from sqlalchemy.orm import Session
from app.models.meeting_chunk import MeetingChunk


class ChunkRepository:
    def __init__(self, session: Session):
        self.session = session

    def get_by_meeting(self, meeting_id: int) -> list[MeetingChunk]:
        return (
            self.session.query(MeetingChunk)
            .filter_by(meeting_id=meeting_id)
            .order_by(MeetingChunk.chunk_index.asc())
            .all()
        )

    def count_by_meeting(self, meeting_id: int) -> int:
        return self.session.query(MeetingChunk).filter_by(meeting_id=meeting_id).count()

    def delete_by_meeting(self, meeting_id: int) -> int:
        """Delete-before-insert: keeps pipeline idempotent on retry/reprocess."""
        count = (
            self.session.query(MeetingChunk)
            .filter_by(meeting_id=meeting_id)
            .delete(synchronize_session=False)
        )
        self.session.commit()
        return count

    def create_many(self, meeting_id: int, chunks: list[dict]) -> list[MeetingChunk]:
        rows = []
        for i, c in enumerate(chunks):
            embedding = c.get("embedding")
            if isinstance(embedding, list):
                embedding = json.dumps(embedding)
            rows.append(
                MeetingChunk(
                    meeting_id=meeting_id,
                    chunk_index=c.get("chunk_index", i),
                    text=c["text"],
                    start_sec=c.get("start_sec"),
                    end_sec=c.get("end_sec"),
                    embedding=embedding,
                )
            )
            self.session.add(rows[-1])
        self.session.commit()
        for r in rows:
            self.session.refresh(r)
        return rows
