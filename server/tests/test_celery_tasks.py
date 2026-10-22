from unittest.mock import MagicMock, patch

from app.services.celery_tasks import dispatch_meeting_task, execute_meeting_pipeline


@patch("app.services.celery_tasks.process_meeting_celery_task.delay")
def test_dispatch_meeting_task_celery_enabled(mock_delay):
    """When Celery is enabled, dispatch_meeting_task should push to Celery delay()."""
    mock_delay.return_value = MagicMock(id="test-task-123")

    with patch("app.services.celery_tasks.ENABLE_CELERY", True):
        result = dispatch_meeting_task(meeting_id=42)

    assert result["status"] == "queued"
    assert result["mode"] == "celery"
    assert result["task_id"] == "test-task-123"
    mock_delay.assert_called_once_with(42)


@patch("app.services.celery_tasks.process_meeting_celery_task.delay")
def test_dispatch_meeting_task_falls_back_when_broker_unreachable(mock_delay):
    """A failed enqueue must degrade to BackgroundTasks, not lose the meeting."""
    mock_delay.side_effect = ConnectionError("redis unreachable")
    background_tasks = MagicMock()

    with patch("app.services.celery_tasks.ENABLE_CELERY", True):
        result = dispatch_meeting_task(meeting_id=7, background_tasks=background_tasks)

    assert result["status"] == "queued"
    assert result["mode"] == "fastapi_background"
    background_tasks.add_task.assert_called_once()


@patch("app.services.celery_tasks.execute_meeting_pipeline")
def test_dispatch_meeting_task_fastapi_fallback(mock_pipeline):
    """When Celery fails or is disabled, fallback to FastAPI BackgroundTasks."""
    background_tasks = MagicMock()

    with patch("app.services.celery_tasks.ENABLE_CELERY", False):
        result = dispatch_meeting_task(meeting_id=99, background_tasks=background_tasks)

    assert result["status"] == "queued"
    assert result["mode"] == "fastapi_background"
    background_tasks.add_task.assert_called_once_with(mock_pipeline, 99)


@patch("app.services.celery_tasks.execute_meeting_pipeline")
def test_dispatch_meeting_task_direct_mode_without_background_tasks(mock_pipeline):
    """With no BackgroundTasks available (CLI/test), run the pipeline inline."""
    with patch("app.services.celery_tasks.ENABLE_CELERY", False):
        result = dispatch_meeting_task(meeting_id=5)

    assert result["status"] == "queued"
    assert result["mode"] == "direct"
    mock_pipeline.assert_called_once_with(5)
