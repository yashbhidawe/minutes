from datetime import UTC, datetime

from sqlalchemy import Column, Float, ForeignKey, Integer, String, Text

from app.core.db_connection import Base


class MeetingChunk(Base):
    """One retrievable chunk of a meeting transcript.

    Embeddings are stored as JSON-encoded float lists in `embedding`
    (TEXT) so Phase 1 needs no extra vector-DB infra — brute-force cosine
    search in Python is fast enough for per-meeting scope (< few hundred
    chunks). Migrating to pgvector later only changes the retrieval layer.
    """

    __tablename__ = "meeting_chunks"

    id = Column(Integer, primary_key=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id"), nullable=False, index=True)
    chunk_index = Column(Integer, nullable=False)
    text = Column(Text, nullable=False)
    start_sec = Column(Float, nullable=True)
    end_sec = Column(Float, nullable=True)
    embedding = Column(Text, nullable=True)
    created_at = Column(String(50), nullable=False, default=lambda: datetime.now(UTC).isoformat())
