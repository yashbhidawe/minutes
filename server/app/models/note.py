from datetime import UTC, datetime

from sqlalchemy import Column, ForeignKey, Integer, String

from app.core.db_connection import Base


class Note(Base):
    __tablename__ = 'notes'

    id = Column(Integer, primary_key=True)
    meeting_id = Column(Integer, ForeignKey('meetings.id'), nullable=False)
    section = Column(String(50), nullable=False)
    content = Column(String, nullable=False)
    created_at = Column(String(50), nullable=False, default=lambda: datetime.now(UTC).isoformat())
    updated_at = Column(String(50), nullable=False, default=lambda: datetime.now(UTC).isoformat())
