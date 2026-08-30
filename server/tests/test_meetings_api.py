from unittest.mock import patch
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


@patch("app.api.meetings.run_automated_pipeline")
def test_process_meeting_task_endpoint_success(mock_pipeline):
    """Calling /meetings/tasks/process-meeting should run pipeline and return 200."""
    response = client.post(
        "/meetings/tasks/process-meeting",
        json={"meeting_id": 101},
        headers={"X-Task-Secret": "default-minute-ai-secret"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["meeting_id"] == 101
    mock_pipeline.assert_called_once_with(101)


def test_process_meeting_task_endpoint_unauthorized():
    """Calling /meetings/tasks/process-meeting with invalid secret should return 403 when custom secret configured."""
    with patch.dict("os.environ", {"INTERNAL_TASK_SECRET": "custom-secret-key-123"}):
        response = client.post(
            "/meetings/tasks/process-meeting",
            json={"meeting_id": 101},
            headers={"X-Task-Secret": "wrong-secret"},
        )
        assert response.status_code == 403
        assert "Unauthorized" in response.json()["detail"]
