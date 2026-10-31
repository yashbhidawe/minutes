from unittest.mock import patch

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_root_endpoint():
    """Root endpoint should return Hello World."""
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"Hello": "World"}


def test_update_action_item_rejects_item_from_another_meeting(db_session):
    from app.api.meetings import get_session
    from app.models.actionItem import ActionItem
    from app.models.meeting import Meeting
    from app.models.user import User
    from app.utils.auth import get_current_user

    mine = User(email="mine@example.com", password_hash="x")
    theirs = User(email="theirs@example.com", password_hash="x")
    db_session.add_all([mine, theirs])
    db_session.commit()
    my_meeting = Meeting(user_id=mine.id, title="mine", duration_sec=0)
    their_meeting = Meeting(user_id=theirs.id, title="theirs", duration_sec=0)
    db_session.add_all([my_meeting, their_meeting])
    db_session.commit()
    item = ActionItem(meeting_id=their_meeting.id, description="secret", status="pending")
    db_session.add(item)
    db_session.commit()

    app.dependency_overrides[get_current_user] = lambda: mine
    app.dependency_overrides[get_session] = lambda: db_session
    try:
        response = client.patch(
            f"/meetings/{my_meeting.id}/action-items/{item.id}", json={"status": "done"}
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 404
    db_session.refresh(item)
    assert item.status == "pending"


def test_upload_audio_rejected_while_meeting_is_processing(db_session):
    from app.api.meetings import get_session
    from app.models.meeting import Meeting
    from app.models.user import User
    from app.repositories.meeting import _now_iso
    from app.utils.auth import get_current_user

    owner = User(email="owner@example.com", password_hash="x")
    db_session.add(owner)
    db_session.commit()
    meeting = Meeting(user_id=owner.id, title="m", duration_sec=0, status="transcribing", updated_at=_now_iso())
    db_session.add(meeting)
    db_session.commit()

    app.dependency_overrides[get_current_user] = lambda: owner
    app.dependency_overrides[get_session] = lambda: db_session
    try:
        response = client.post(
            f"/meetings/{meeting.id}/upload-audio",
            files={"file": ("a.webm", b"x" * 10, "audio/webm")},
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 409
