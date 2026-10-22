from datetime import UTC, datetime

from sqlalchemy import Column, ForeignKey, Integer, String

from app.core.db_connection import Base


class ActionItem(Base):
    __tablename__ = 'action_items'

    id = Column(Integer, primary_key=True)
    meeting_id = Column(Integer, ForeignKey('meetings.id'), nullable=False)
    description = Column(String, nullable=False)
    assigned_to = Column(String(100), nullable=True)
    due_date = Column(String(50), nullable=True)
    priority = Column(String(10), nullable=False, default="medium")
    status = Column(String(20), nullable=False, default="pending")
    created_at = Column(String(50), nullable=False, default=lambda: datetime.now(UTC).isoformat())
    updated_at = Column(String(50), nullable=False, default=lambda: datetime.now(UTC).isoformat())
