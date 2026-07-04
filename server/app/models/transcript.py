
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Integer, Enum
from app.core.db_connection import Base
from datetime import datetime, timezone

class Transcript(Base):

    __tablename__ = 'transcripts'

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    meeting_id: Mapped[int] = mapped_column(Integer, ForeignKey('meetings.id'), nullable=False) 
    raw_text: Mapped[str] = mapped_column(String, nullable=False)
    language: Mapped[str] = mapped_column(String(20), nullable=False)