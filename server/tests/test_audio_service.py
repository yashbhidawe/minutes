import asyncio
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

import pytest
from fastapi import HTTPException

from app.services.audio import upload_audio


class FakeUpload:
    content_type = "audio/webm;codecs=opus"
    filename = "meeting.webm"

    async def read(self):
        return b"audio-data"


def test_upload_audio_stores_file_and_updates_meeting():
    meeting = SimpleNamespace(id=3, user_id=9)
    uploaded_meeting = SimpleNamespace(
        id=3,
        user_id=9,
        audio_key="9/3/audio.webm",
        status="uploaded",
    )
    repository = MagicMock()
    repository.get_by_id.return_value = meeting
    repository.update_status.return_value = uploaded_meeting

    with patch("app.services.audio.upload_file") as upload_file:
        result = asyncio.run(upload_audio(3, FakeUpload(), repository))

    assert result is uploaded_meeting
    upload_file.assert_called_once_with(b"audio-data", "9/3/audio.webm")
    repository.update_status.assert_called_once_with(3, "uploaded", "9/3/audio.webm")


def test_upload_audio_rejects_non_audio_file():
    upload = FakeUpload()
    upload.content_type = "text/plain"
    repository = MagicMock()
    repository.get_by_id.return_value = SimpleNamespace(id=3, user_id=9)

    with pytest.raises(HTTPException) as error:
        asyncio.run(upload_audio(3, upload, repository))

    assert error.value.status_code == 400
    assert "Invalid file type" in error.value.detail
    repository.get_by_id.assert_called_once_with(3)
    repository.update_status.assert_not_called()
