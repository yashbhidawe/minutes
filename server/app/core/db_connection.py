from os import getenv
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DEFAULT_SQLITE_URL = f"sqlite:///{BASE_DIR / 'app.db'}"

DATABASE_URL = getenv("DATABASE_URL", DEFAULT_SQLITE_URL)
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True if not DATABASE_URL.startswith("sqlite") else False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


