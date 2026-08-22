from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, ForeignKey
from app.core.db_connection import Base


class Transcript(Base):
    __tablename__ = 'transcripts'

    id = Column(Integer, primary_key=True)
    meeting_id = Column(Integer, ForeignKey('meetings.id'), nullable=False)
    raw_text = Column(Text, nullable=False)
    language = Column(String(20), nullable=False)
    segments = Column(Text, nullable=True)
    created_at = Column(String(50), nullable=False, default=lambda: datetime.now(timezone.utc).isoformat())
