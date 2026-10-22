from datetime import UTC, datetime

from sqlalchemy import Column, ForeignKey, Integer, String, Text

from app.core.db_connection import Base


class Transcript(Base):
    __tablename__ = 'transcripts'

    id = Column(Integer, primary_key=True)
    meeting_id = Column(Integer, ForeignKey('meetings.id'), nullable=False)
    raw_text = Column(Text, nullable=False)
    language = Column(String(20), nullable=False)
    segments = Column(Text, nullable=True)
    created_at = Column(String(50), nullable=False, default=lambda: datetime.now(UTC).isoformat())
