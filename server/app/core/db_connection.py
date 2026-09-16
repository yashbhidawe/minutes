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


def ensure_schema():
    """Create tables + backfill columns added after a DB was first created.

    `Base.metadata.create_all` only creates missing *tables* — it never adds
    a column to an existing table. Without this, dev SQLite files (and any
    Postgres DB created before the column existed) crash with
    `no such column: meetings.error_message`.
    """
    from sqlalchemy import inspect, text

    Base.metadata.create_all(bind=engine)
    inspector = inspect(engine)
    # table -> {column_name: ddl_type}
    missing = {
        "meetings": {"error_message": "VARCHAR(500)"},
        "transcripts": {"segments": "TEXT"},
    }
    with engine.begin() as conn:
        for table, cols in missing.items():
            if table not in inspector.get_table_names():
                continue
            existing = {c["name"] for c in inspector.get_columns(table)}
            for col, ddl in cols.items():
                if col in existing:
                    continue
                if DATABASE_URL.startswith("sqlite"):
                    conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {col} {ddl}"))
                else:
                    conn.execute(text(f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS {col} {ddl}"))


