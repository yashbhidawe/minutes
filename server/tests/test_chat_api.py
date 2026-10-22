"""Tests for the chat / RAG API (`app.api.chat`).

These cover the HTTP contract: ownership enforcement (404, never 403),
auto-indexing on first ask, citation sanitisation, and the global
cross-meeting query. The Gemini provider is always mocked.
"""

import json
from unittest.mock import MagicMock, patch

import pytest

from app.models.meeting import Meeting
from app.models.meeting_chunk import MeetingChunk
from app.models.transcript import Transcript
from app.models.user import User
from app.utils.auth import create_access_token

EMAIL = "person@example.com"


@pytest.fixture()
def owner(db_session):
    """An authenticated user owning one transcript-ready meeting."""
    user = User(email=EMAIL, password_hash="hash")
    db_session.add(user)
    db_session.flush()

    meeting = Meeting(user_id=user.id, title="Weekly sync", duration_sec=600, status="completed")
    db_session.add(meeting)
    db_session.flush()

    db_session.add(
        Transcript(
            meeting_id=meeting.id,
            raw_text="We agreed to ship the release on Friday.",
            language="en",
            segments=json.dumps(
                [
                    {"start": 0.0, "end": 4.0, "text": "We agreed to ship the release on Friday."}
                ]
            ),
        )
    )
    db_session.commit()
    return user


def _auth_header() -> dict[str, str]:
    token = create_access_token({"sub": EMAIL})
    return {"Authorization": f"Bearer {token}"}


def _fake_embedding_response(vectors: list[list[float]]) -> MagicMock:
    response = MagicMock()
    response.embeddings = []
    for vector in vectors:
        embedding = MagicMock()
        embedding.values = vector
        response.embeddings.append(embedding)
    return response


def test_index_endpoint_reports_chunk_count(client, owner, db_session):
    """Indexing a meeting returns the number of chunks written."""
    with (
        patch("app.services.rag.embed_texts", return_value=[[0.1, 0.2, 0.3]]),
    ):
        response = client.post(f"/meetings/{owner.meetings[0].id}/index", headers=_auth_header())

    assert response.status_code == 200
    body = response.json()
    assert body["meeting_id"] == owner.meetings[0].id
    assert body["chunks_indexed"] >= 1
    assert body["status"] == "indexed"


def test_index_endpoint_rejects_meeting_owned_by_another_user(client, owner, db_session):
    """Another user's meeting is invisible — 404, not 403."""
    other = User(email="other@example.com", password_hash="hash")
    db_session.add(other)
    db_session.flush()
    other_meeting = Meeting(user_id=other.id, title="Not yours", duration_sec=60, status="completed")
    db_session.add(other_meeting)
    db_session.commit()

    response = client.post(f"/meetings/{other_meeting.id}/index", headers=_auth_header())

    assert response.status_code == 404
    assert response.json()["detail"] == "Meeting not found"


def test_ask_auto_indexes_when_no_index_exists(client, owner):
    """Asking a meeting that was never indexed indexes it first."""
    meeting_id = owner.meetings[0].id

    with (
        patch("app.services.rag.embed_texts", return_value=[[0.1, 0.2, 0.3]]),
        patch(
            "app.services.rag.generate_with_retry",
            return_value=json.dumps({"answer": "Friday.", "citations": [0]}),
        ),
    ):
        response = client.post(
            f"/meetings/{meeting_id}/ask",
            json={"question": "When do we ship?"},
            headers=_auth_header(),
        )

    assert response.status_code == 200
    body = response.json()
    assert body["answer"] == "Friday."
    assert body["citations"][0]["start_sec"] == 0.0
    assert body["citations"][0]["end_sec"] == 4.0


def test_ask_drops_citations_that_do_not_map_to_a_chunk(client, owner):
    """A hallucinated citation index is discarded rather than returned."""
    meeting_id = owner.meetings[0].id

    with (
        patch("app.services.rag.embed_texts", return_value=[[0.1, 0.2, 0.3]]),
        patch(
            "app.services.rag.generate_with_retry",
            return_value=json.dumps({"answer": "ok", "citations": [0, 99]}),
        ),
    ):
        response = client.post(
            f"/meetings/{meeting_id}/ask",
            json={"question": "When do we ship?"},
            headers=_auth_header(),
        )

    assert response.status_code == 200
    citations = response.json()["citations"]
    assert len(citations) == 1
    assert citations[0]["chunk_index"] == 0


def test_ask_rejects_empty_question(client, owner):
    """An empty question is a client error."""
    response = client.post(
        f"/meetings/{owner.meetings[0].id}/ask",
        json={"question": ""},
        headers=_auth_header(),
    )

    assert response.status_code == 422


def test_ask_rejects_top_k_above_limit(client, owner):
    """top_k is bounded by the schema, so an oversized value is rejected."""
    response = client.post(
        f"/meetings/{owner.meetings[0].id}/ask",
        json={"question": "When?", "top_k": 99},
        headers=_auth_header(),
    )

    assert response.status_code == 422


def test_ask_requires_authentication(client, owner):
    """Asking without a token is rejected."""
    response = client.post(f"/meetings/{owner.meetings[0].id}/ask", json={"question": "When?"})

    assert response.status_code == 403


def test_global_ask_returns_citations_across_meetings(client, owner, db_session):
    """The global endpoint answers across every meeting the user owns."""
    second = Meeting(user_id=owner.id, title="Retro", duration_sec=120, status="completed")
    db_session.add(second)
    db_session.flush()
    db_session.add(
        MeetingChunk(
            meeting_id=second.id,
            chunk_index=0,
            text="The retro happened on Monday.",
            start_sec=1.0,
            end_sec=3.0,
            embedding=json.dumps([0.1, 0.2, 0.3]),
        )
    )
    db_session.commit()

    with (
        patch("app.services.rag.embed_texts", return_value=[[0.1, 0.2, 0.3]]),
        patch(
            "app.services.rag.generate_with_retry",
            return_value=json.dumps({"answer": "Monday.", "citations": [0]}),
        ),
    ):
        response = client.post("/chat/ask", json={"question": "When was the retro?"}, headers=_auth_header())

    assert response.status_code == 200
    body = response.json()
    assert body["answer"] == "Monday."
    assert body["citations"][0]["meeting_id"] == second.id
    assert body["citations"][0]["meeting_title"] == "Retro"


def test_global_ask_excludes_other_users_meetings(client, owner, db_session):
    """A global search never leaks another user's meeting content."""
    # The owner has one indexed chunk of their own.
    db_session.add(
        MeetingChunk(
            meeting_id=owner.meetings[0].id,
            chunk_index=0,
            text="Owner's own notes about the sprint.",
            start_sec=0.0,
            end_sec=2.0,
            embedding=json.dumps([0.1, 0.2, 0.3]),
        )
    )

    other = User(email="other@example.com", password_hash="hash")
    db_session.add(other)
    db_session.flush()
    other_meeting = Meeting(user_id=other.id, title="Secret", duration_sec=60, status="completed")
    db_session.add(other_meeting)
    db_session.flush()
    db_session.add(
        MeetingChunk(
            meeting_id=other_meeting.id,
            chunk_index=0,
            text="Confidential content",
            start_sec=0.0,
            end_sec=1.0,
            embedding=json.dumps([0.9, 0.9, 0.9]),
        )
    )
    db_session.commit()

    with (
        patch("app.services.rag.embed_texts", return_value=[[0.1, 0.2, 0.3]]),
        patch(
            "app.services.rag.generate_with_retry",
            return_value=json.dumps({"answer": "Sprint notes.", "citations": [0]}),
        ),
    ):
        response = client.post("/chat/ask", json={"question": "secret?"}, headers=_auth_header())

    assert response.status_code == 200
    body = response.json()
    assert "Confidential content" not in json.dumps(body)
    assert all(citation["meeting_id"] != other_meeting.id for citation in body["citations"])
    assert all(citation["meeting_id"] == owner.meetings[0].id for citation in body["citations"])


def test_global_ask_without_any_index_returns_404(client, owner):
    """A global search with nothing indexed reports that clearly."""
    with patch("app.services.rag.embed_texts", return_value=[[0.1, 0.2, 0.3]]):
        response = client.post("/chat/ask", json={"question": "anything?"}, headers=_auth_header())

    assert response.status_code == 404
    assert "No indexed meetings" in response.json()["detail"]
