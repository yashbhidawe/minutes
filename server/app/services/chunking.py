"""Split transcripts into retrievable chunks, preserving timestamps.

Prefers Whisper `segments` (already stitched with offsets in
`audio_chunker.py`) so each chunk carries `start_sec`/`end_sec` for
citation click-to-seek. Falls back to plain-text windowing when a meeting
has no segments (e.g. legacy transcripts).
"""

import json

TARGET_CHARS = 1000
OVERLAP_SEGMENTS = 1
TEXT_OVERLAP_CHARS = 150
MAX_CHUNKS = 500


def parse_segments(segments) -> list[dict]:
    if segments is None:
        return []
    if isinstance(segments, str):
        try:
            segments = json.loads(segments)
        except (json.JSONDecodeError, TypeError):
            return []
    if not isinstance(segments, list):
        return []
    out = []
    for seg in segments:
        if not isinstance(seg, dict):
            continue
        text = (seg.get("text") or "").strip()
        if not text:
            continue
        try:
            start = float(seg.get("start", 0) or 0)
            end = float(seg.get("end", 0) or 0)
        except (TypeError, ValueError):
            start, end = 0.0, 0.0
        out.append({"text": text, "start": start, "end": end})
    return out


def _split_text_fallback(raw_text: str) -> list[dict]:
    text = (raw_text or "").strip()
    if not text:
        return []
    chunks = []
    step = max(TARGET_CHARS - TEXT_OVERLAP_CHARS, 100)
    for i in range(0, len(text), step):
        window = text[i : i + TARGET_CHARS].strip()
        if window:
            chunks.append({"text": window, "start_sec": None, "end_sec": None})
        if len(chunks) >= MAX_CHUNKS:
            break
    return chunks


def build_chunks(segments, raw_text: str = "") -> list[dict]:
    """Group segments into ~TARGET_CHARS windows with segment overlap."""
    parsed = parse_segments(segments)
    if not parsed:
        return _split_text_fallback(raw_text)

    chunks: list[dict] = []
    buf: list[dict] = []
    buf_chars = 0

    def flush(buf_segs: list[dict]):
        texts = [s["text"] for s in buf_segs]
        chunks.append(
            {
                "text": " ".join(texts).strip(),
                "start_sec": float(buf_segs[0]["start"]),
                "end_sec": float(buf_segs[-1]["end"]),
            }
        )

    for seg in parsed:
        buf.append(seg)
        buf_chars += len(seg["text"]) + 1
        if buf_chars >= TARGET_CHARS:
            flush(buf)
            buf = list(buf[-OVERLAP_SEGMENTS:]) if OVERLAP_SEGMENTS > 0 else []
            buf_chars = sum(len(s["text"]) + 1 for s in buf)
            if len(chunks) >= MAX_CHUNKS:
                return chunks

    if buf and (not chunks or sum(len(s["text"]) for s in buf) > 0):
        # Avoid emitting a duplicate chunk that is fully contained in the last one.
        last_text = chunks[-1]["text"] if chunks else ""
        candidate = " ".join(s["text"] for s in buf).strip()
        if candidate and candidate != last_text:
            flush(buf)

    return chunks[:MAX_CHUNKS]
