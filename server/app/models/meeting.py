from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Integer, Enum
import enum
from app.core.db_connection import Base
from datetime import datetime, timezone
class Meeting(Base):
    __tablename__ = 'meetings'

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, foreign_key='users.id', nullable=False) 
    title: Mapped[str] = mapped_column(String(100), nullable=False)
    duration_sec: Mapped[int] = mapped_column(Integer, nullable=False) 
    created_at: Mapped[str] = mapped_column(String(50), nullable=False, default=datetime.now(timezone.utc).isoformat())
    updated_at: Mapped[str] = mapped_column(String(50), nullable=False, default=datetime.now(timezone.utc).isoformat())
    



