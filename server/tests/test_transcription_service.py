import json
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from app.services.transcription import transcribe_audio


def test_transcription_returns_text_language_and_segments():
    client = MagicMock()
    client.audio.transcriptions.create.return_value = SimpleNamespace(
        text="Hello world",
        language="en",
        segments=[
            SimpleNamespace(start=0.0, end=1.2, text="Hello world"),
        ],
    )

    with patch("app.services.transcription.get_client", return_value=client):
        result = transcribe_audio(b"audio-data", "meeting.webm")

    assert result["text"] == "Hello world"
    assert result["language"] == "en"
    assert json.loads(result["segments"]) == [
        {"start": 0.0, "end": 1.2, "text": "Hello world"},
    ]
    client.audio.transcriptions.create.assert_called_once_with(
        file=("meeting.webm", b"audio-data"),
        model="whisper-large-v3",
        response_format="verbose_json",
        timestamp_granularities=["segment"],
    )
