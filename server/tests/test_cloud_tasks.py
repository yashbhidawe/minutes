from unittest.mock import patch, MagicMock
from fastapi import BackgroundTasks
from app.services import cloud_tasks


def test_enqueue_local_fallback():
    """When GCP Cloud Tasks is disabled, should add task to local FastAPI BackgroundTasks."""
    bg_tasks = BackgroundTasks()
    fallback_mock = MagicMock()

    with patch.object(cloud_tasks, "ENABLE_GCP_CLOUD_TASKS", False):
        result = cloud_tasks.enqueue_meeting_processing_task(
            meeting_id=42,
            background_tasks=bg_tasks,
            fallback_handler=fallback_mock,
        )

    assert result["status"] == "processing"
    assert result["mode"] == "local_background_tasks"
    assert len(bg_tasks.tasks) == 1


def test_enqueue_gcp_cloud_tasks_enabled():
    """When GCP Cloud Tasks is enabled, should construct Cloud Tasks request with secret header."""
    bg_tasks = BackgroundTasks()
    mock_client = MagicMock()
    mock_client.queue_path.return_value = "projects/test-proj/locations/us-central1/queues/test-queue"
    mock_response = MagicMock()
    mock_response.name = "projects/test-proj/locations/us-central1/queues/test-queue/tasks/12345"
    mock_client.create_task.return_value = mock_response

    mock_tasks_module = MagicMock()
    mock_tasks_module.CloudTasksClient.return_value = mock_client
    mock_tasks_module.HttpMethod.POST = "POST"

    with patch.object(cloud_tasks, "ENABLE_GCP_CLOUD_TASKS", True), \
         patch.object(cloud_tasks, "GCP_PROJECT_ID", "test-proj"), \
         patch.dict("sys.modules", {"google.cloud.tasks_v2": mock_tasks_module}):

        result = cloud_tasks.enqueue_meeting_processing_task(
            meeting_id=99,
            background_tasks=bg_tasks,
        )

    assert result["status"] == "queued"
    assert "12345" in result["task_name"]
    mock_client.create_task.assert_called_once()
