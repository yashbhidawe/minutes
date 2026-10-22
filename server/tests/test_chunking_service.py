"""Tests for transcript chunking (`app.services.chunking`).

Chunking is what makes RAG citations point at the right moment in the audio,
so the timestamp handling and the legacy-transcript fallback both matter.
"""

from app.services.chunking import (
    MAX_CHUNKS,
    TARGET_CHARS,
    TEXT_OVERLAP_CHARS,
    build_chunks,
    parse_segments,
)


def _segments(count: int, chars: int = 200) -> list[dict]:
    return [
        {"start": i * 5.0, "end": i * 5.0 + 4.9, "text": f"segment {i} " + ("word " * (chars // 5))}
        for i in range(count)
    ]


def test_parse_segments_accepts_json_string():
    """Segments stored as a JSON string are decoded into dicts."""
    parsed = parse_segments('[{"start": 0.0, "end": 1.0, "text": "hello"}]')

    assert parsed == [{"start": 0.0, "end": 1.0, "text": "hello"}]


def test_parse_segments_rejects_malformed_input():
    """Malformed segment payloads yield an empty list rather than raising."""
    assert parse_segments(None) == []
    assert parse_segments("not json") == []
    assert parse_segments('{"not": "a list"}') == []
    assert parse_segments([{"missing": "fields"}]) == []


def test_build_chunks_groups_segments_with_timestamps():
    """Chunks carry the start/end seconds of the segments they contain."""
    chunks = build_chunks(_segments(4), "")

    assert chunks
    for chunk in chunks:
        assert chunk["start_sec"] is not None
        assert chunk["end_sec"] is not None
        assert chunk["start_sec"] <= chunk["end_sec"]


def test_build_chunks_respects_target_size():
    """A chunk is closed once it reaches the target character count."""
    chunks = build_chunks(_segments(6, chars=400), "")

    assert len(chunks) > 1
    # The first chunk may overshoot slightly, but not by a whole segment more.
    assert len(chunks[0]["text"]) < TARGET_CHARS * 2


def test_build_chunks_keeps_overlap_between_windows():
    """Consecutive chunks share a segment so context is not lost at boundaries."""
    segments = _segments(6, chars=400)

    chunks = build_chunks(segments, "")

    first_words = set(chunks[0]["text"].split())
    second_words = set(chunks[1]["text"].split())

    assert first_words & second_words, "expected overlapping content between chunks"


def test_build_chunks_falls_back_to_plain_text_without_segments():
    """A transcript with no segments is windowed on raw text with no timestamps."""
    raw = "word " * 600

    chunks = build_chunks(None, raw)

    assert chunks
    assert chunks[0]["start_sec"] is None
    assert chunks[0]["end_sec"] is None
    assert len(chunks[0]["text"]) <= TARGET_CHARS


def test_build_chunks_text_fallback_uses_overlap():
    """Consecutive plain-text windows overlap by the configured amount."""
    raw = "".join(f"token{i} " for i in range(800))

    chunks = build_chunks(None, raw)

    assert len(chunks) > 1
    assert len(chunks[1]["text"]) <= TARGET_CHARS
    # The step is TARGET_CHARS - overlap, so windows share trailing content.
    assert len(chunks[0]["text"]) - len(chunks[1]["text"]) <= TEXT_OVERLAP_CHARS + 1


def test_build_chunks_caps_chunk_count():
    """The number of chunks is bounded by MAX_CHUNKS."""
    chunks = build_chunks(_segments(1200, chars=200), "")

    assert len(chunks) <= MAX_CHUNKS


def test_build_chunks_returns_empty_for_empty_transcript():
    """An empty transcript produces no chunks instead of raising."""
    assert build_chunks(None, "") == []
    assert build_chunks([], "") == []


def test_build_chunks_does_not_emit_a_duplicate_final_chunk():
    """The trailing buffer is not emitted twice when it repeats the last chunk."""
    segments = _segments(3, chars=400)

    chunks = build_chunks(segments, "")

    texts = [chunk["text"] for chunk in chunks]
    assert len(texts) == len(set(texts)), "duplicate chunk emitted"
