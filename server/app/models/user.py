from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Integer, Enum
import enum
from app.core.db_connection import Base
from datetime import datetime, timezone

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(128), nullable=False)
    created_at: Mapped[str] = mapped_column(String(50), nullable=False, default=datetime.now(timezone.utc).isoformat())
    updated_at: Mapped[str] = mapped_column(String(50), nullable=False, default=datetime.now(timezone.utc).isoformat())



