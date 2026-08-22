from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import ForeignKey, String, Integer
from app.core.db_connection import Base
from datetime import datetime, timezone

from .user import User

class Meeting(Base):
    __tablename__ = 'meetings'

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey('users.id'), nullable=False)
    title: Mapped[str] = mapped_column(String(100), nullable=False)
    duration_sec: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending")
    audio_key: Mapped[str] = mapped_column(String(255), nullable=True)
    created_at: Mapped[str] = mapped_column(String(50), nullable=False, default=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: Mapped[str] = mapped_column(String(50), nullable=False, default=lambda: datetime.now(timezone.utc).isoformat())
    user: Mapped["User"] = relationship("User", back_populates="meetings")




