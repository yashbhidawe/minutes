from unittest.mock import patch, MagicMock
from app.services.celery_tasks import dispatch_meeting_task, execute_meeting_pipeline


@patch("app.services.celery_tasks.process_meeting_celery_task.delay")
def test_dispatch_meeting_task_celery_enabled(mock_delay):
    """When Celery is enabled, dispatch_meeting_task should push to Celery delay()."""
    mock_delay.return_value = MagicMock(id="test-task-123")

    result = dispatch_meeting_task(meeting_id=42)

    assert result["status"] == "queued"
    assert result["mode"] == "celery"
    assert result["task_id"] == "test-task-123"
    mock_delay.assert_called_once_with(42)


@patch("app.services.celery_tasks.execute_meeting_pipeline")
def test_dispatch_meeting_task_fastapi_fallback(mock_pipeline):
    """When Celery fails or is disabled, fallback to FastAPI BackgroundTasks."""
    background_tasks = MagicMock()

    with patch("app.services.celery_tasks.ENABLE_CELERY", False):
        result = dispatch_meeting_task(meeting_id=99, background_tasks=background_tasks)

    assert result["status"] == "queued"
    assert result["mode"] == "fastapi_background"
    background_tasks.add_task.assert_called_once_with(mock_pipeline, 99)
