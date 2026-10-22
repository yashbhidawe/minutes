import json
from io import BytesIO
from unittest.mock import patch

from pydub.generators import Sine

from app.services.audio_chunker import process_and_transcribe_audio, split_audio_into_chunks


def test_split_short_audio():
    """Short audio should return as a single unchunked item."""
    tone = Sine(440).to_audio_segment(duration=1000)  # 1 second
    io_buf = BytesIO()
    tone.export(io_buf, format="mp3")
    raw_bytes = io_buf.getvalue()

    chunks = split_audio_into_chunks(raw_bytes, "short_call.mp3")
    assert len(chunks) == 1
    assert chunks[0][2] == 0.0  # offset 0.0s


def test_split_long_audio():
    """12-minute synthetic audio should split into 2 chunks with 600s offset."""
    tone = Sine(440).to_audio_segment(duration=5000)
    long_tone = tone * 144  # 720 seconds = 12 minutes
    io_buf = BytesIO()
    long_tone.export(io_buf, format="mp3")
    raw_bytes = io_buf.getvalue()

    chunks = split_audio_into_chunks(raw_bytes, "long_call.mp3")
    assert len(chunks) == 2
    assert chunks[0][1] == "chunk_001.mp3"
    assert chunks[0][2] == 0.0
    assert chunks[1][1] == "chunk_002.mp3"
    assert chunks[1][2] == 600.0


@patch("app.services.audio_chunker.transcribe_audio")
def test_process_and_transcribe_audio_stitching(mock_transcribe):
    """Mock transcribe_audio calls and verify segment timestamp offsets are shifted."""
    def mock_transcribe_side_effect(chunk_bytes, filename):
        if "chunk_001" in filename:
            return {
                "text": "Hello world from part 1.",
                "language": "en",
                "segments": json.dumps([{"start": 0.5, "end": 4.2, "text": "Hello world from part 1."}]),
            }
        else:
            return {
                "text": "Welcome to part 2.",
                "language": "en",
                "segments": json.dumps([{"start": 10.0, "end": 15.0, "text": "Welcome to part 2."}]),
            }

    mock_transcribe.side_effect = mock_transcribe_side_effect

    # Create 12 min audio to trigger 2 chunks
    tone = Sine(440).to_audio_segment(duration=5000)
    long_tone = tone * 144
    io_buf = BytesIO()
    long_tone.export(io_buf, format="mp3")
    raw_bytes = io_buf.getvalue()

    result = process_and_transcribe_audio(raw_bytes, "meeting_recording.mp3")

    assert "Hello world from part 1." in result["text"]
    assert "Welcome to part 2." in result["text"]
    assert result["language"] == "en"

    segments = json.loads(result["segments"])
    assert len(segments) == 2
    # Chunk 1 segment unshifted (start=0.5, end=4.2)
    assert segments[0]["start"] == 0.5
    assert segments[0]["end"] == 4.2
    # Chunk 2 segment shifted by +600.0s (start=610.0, end=615.0)
    assert segments[1]["start"] == 610.0
    assert segments[1]["end"] == 615.0
