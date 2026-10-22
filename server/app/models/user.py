from datetime import UTC, datetime
from typing import TYPE_CHECKING

from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db_connection import Base

if TYPE_CHECKING:
    # Type-checking only. The relationship target is resolved at runtime by
    # SQLAlchemy's class registry, so a runtime import here would be circular
    # (meeting.py imports user.py).
    from app.models.meeting import Meeting


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(128), nullable=False)
    created_at: Mapped[str] = mapped_column(String(50), nullable=False, default=lambda: datetime.now(UTC).isoformat())
    updated_at: Mapped[str] = mapped_column(String(50), nullable=False, default=lambda: datetime.now(UTC).isoformat())
    meetings: Mapped[list["Meeting"]] = relationship("Meeting", back_populates="user", cascade="all, delete-orphan")



