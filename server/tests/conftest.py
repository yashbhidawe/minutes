"""Shared pytest fixtures for the server test suite.

Two things this file exists to guarantee:

1. **Tests never touch a real database.** `app.core.db_connection` reads
   `DATABASE_URL` at import time and falls back to `.env`. In this repo
   `server/.env` points at the production Neon Postgres instance, and
   `app.main` calls `ensure_schema()` at import time — which issues DDL.
   Without this guard, running the suite locally would create/alter tables on
   the production database. `DATABASE_URL` is therefore redirected to a
   throwaway SQLite file *before* any `app.*` module is imported, and the
   environment is also scrubbed of provider credentials so no test can
   accidentally call a live API.

2. **Each test gets a clean schema.** The database is created once per
   session and the tables are dropped/recreated per test, so tests stay
   independent without paying for a fresh database every time.
"""

import os
import tempfile
from pathlib import Path

import pytest

# ---------------------------------------------------------------------------
# Environment must be set BEFORE importing anything from `app.*`.
# `app.core.db_connection` calls `load_dotenv()` and reads DATABASE_URL at
# import time, and `app.main` runs `ensure_schema()` on import.
# ---------------------------------------------------------------------------

_TEST_DB_PATH = Path(tempfile.gettempdir()) / "minutes_pytest.db"

os.environ["DATABASE_URL"] = f"sqlite:///{_TEST_DB_PATH}"

# Point dotenv at a file that does not exist so `load_dotenv()` cannot pull
# in the real credentials from `server/.env`.
os.environ["DOTENV_PATH"] = str(_TEST_DB_PATH.with_suffix(".env"))

# Provider credentials must be absent: a test that accidentally reaches a real
# API would then fail loudly instead of silently costing money.
#
# These are set to the empty string rather than removed: `load_dotenv()` does
# not override a variable that is already present in the environment, but it
# *does* re-add a variable that was deleted. An empty value is falsy, so the
# application code that checks `if not api_key` still behaves correctly.
for _secret in (
    "GEMINI_API_KEY",
    "GROQ_API_KEY",
    "CLOUDFLARE_API_KEY",
    "CLOUDFLARE_ACCOUNT_ID",
    "CLOUDFLARE_ACCESS_KEY_ID",
    "CLOUDFLARE_SECRET_ACCESS_KEY",
    "R2_BUCKET_NAME",
    "R2_ACCOUNT_ID",
    "R2_ACCESS_KEY_ID",
    "R2_SECRET_ACCESS_KEY",
):
    os.environ[_secret] = ""

# A fixed secret keeps token generation deterministic across test runs.
os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key-not-for-production")

# Celery is off in tests; the pipeline's synchronous fallback is exercised
# directly instead.
os.environ["ENABLE_CELERY"] = "false"

# Import after the environment is fixed.
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402

from app.core.db_connection import Base  # noqa: E402
from app.models.actionItem import ActionItem  # noqa: E402
from app.models.meeting import Meeting  # noqa: E402
from app.models.meeting_chunk import MeetingChunk  # noqa: E402
from app.models.note import Note  # noqa: E402
from app.models.transcript import Transcript  # noqa: E402
from app.models.user import User  # noqa: E402

# Import every model so `Base.metadata` is complete before `create_all`.
__all__ = [
    "ActionItem",
    "Meeting",
    "MeetingChunk",
    "Note",
    "Transcript",
    "User",
]


@pytest.fixture(scope="session")
def engine():
    """Session-wide in-memory engine with all tables created."""
    test_engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=test_engine)
    yield test_engine
    Base.metadata.drop_all(bind=test_engine)
    test_engine.dispose()


@pytest.fixture()
def db_session(engine):
    """A session bound to a freshly created schema."""
    Base.metadata.create_all(bind=engine)
    session_factory = sessionmaker(bind=engine)
    session = session_factory()
    try:
        yield session
    finally:
        session.rollback()
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def client(db_session):
    """TestClient with every database session dependency redirected to the test DB.

    The app defines several `get_session` generators (one per router module),
    so each one is overridden explicitly.

    The original function objects must be captured *before* anything is
    rebound: `Depends(get_session)` binds the function object at import time,
    so the override key has to be that original object.
    """
    from app.api import chat as chat_api
    from app.api import meetings as meetings_api
    from app.utils import auth as auth_utils

    original_get_sessions = [
        chat_api.get_session,
        meetings_api.get_session,
        auth_utils.get_session,
    ]

    def override_get_session():
        yield db_session

    from app.main import app

    for original in original_get_sessions:
        app.dependency_overrides[original] = override_get_session

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()
