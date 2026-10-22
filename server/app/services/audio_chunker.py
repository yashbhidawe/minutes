import io
import json

from pydub import AudioSegment

from app.services.transcription import transcribe_audio

MAX_CHUNK_DURATION_MS = 600 * 1000  # 10 minutes (600,000 ms)
MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024  # 20 MB threshold


def split_audio_into_chunks(audio_bytes: bytes, filename: str) -> list[tuple[bytes, str, float]]:
    """
    Splits audio bytes into <= 10-minute chunks if necessary.
    Returns a list of tuples: (chunk_bytes, chunk_filename, start_offset_seconds).
    """
    file_ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "webm"

    # If file size is under 20MB and short, return raw bytes directly
    if len(audio_bytes) <= MAX_FILE_SIZE_BYTES:
        try:
            audio = AudioSegment.from_file(io.BytesIO(audio_bytes))
            if len(audio) <= MAX_CHUNK_DURATION_MS:
                return [(audio_bytes, filename, 0.0)]
        except Exception as e:
            print(f"[audio_chunker] Could not parse audio with pydub: {e}. Falling back to unchunked raw bytes.")
            return [(audio_bytes, filename, 0.0)]
    else:
        try:
            audio = AudioSegment.from_file(io.BytesIO(audio_bytes))
        except Exception as e:
            print(f"[audio_chunker] Pydub loading error on large file: {e}")
            raise RuntimeError(f"Failed to process audio file format ({file_ext}): {e}") from e

    total_duration_ms = len(audio)
    chunks = []

    for start_ms in range(0, total_duration_ms, MAX_CHUNK_DURATION_MS):
        end_ms = min(start_ms + MAX_CHUNK_DURATION_MS, total_duration_ms)
        sub_segment = audio[start_ms:end_ms]

        chunk_io = io.BytesIO()
        # Export as compact 64kbps mono MP3 chunk
        sub_segment.export(chunk_io, format="mp3", bitrate="64k", parameters=["-ac", "1"])
        chunk_bytes = chunk_io.getvalue()

        start_offset_sec = start_ms / 1000.0
        chunk_index = len(chunks) + 1
        chunk_filename = f"chunk_{chunk_index:03d}.mp3"

        chunks.append((chunk_bytes, chunk_filename, start_offset_sec))

    print(f"[audio_chunker] Split {filename} ({total_duration_ms / 1000:.1f}s) into {len(chunks)} chunk(s).")
    return chunks


def process_and_transcribe_audio(audio_bytes: bytes, filename: str) -> dict:
    """
    Slices audio if necessary, transcribes each chunk via Groq Whisper API,
    re-stitches segment offsets, and returns combined transcript dict.
    """
    chunks = split_audio_into_chunks(audio_bytes, filename)

    combined_text_parts = []
    combined_segments = []
    detected_language = "unknown"

    for idx, (chunk_bytes, chunk_name, start_offset_sec) in enumerate(chunks):
        print(f"[audio_chunker] Transcribing chunk {idx + 1}/{len(chunks)} ({chunk_name}, offset: {start_offset_sec:.1f}s)...")
        result = transcribe_audio(chunk_bytes, chunk_name)

        if result.get("language") and result["language"] != "unknown":
            detected_language = result["language"]

        text = (result.get("text") or "").strip()
        if text:
            combined_text_parts.append(text)

        raw_segments_str = result.get("segments")
        if raw_segments_str:
            try:
                segments = json.loads(raw_segments_str)
                for seg in segments:
                    combined_segments.append({
                        "start": round(seg["start"] + start_offset_sec, 2),
                        "end": round(seg["end"] + start_offset_sec, 2),
                        "text": seg["text"],
                    })
            except Exception as e:
                print(f"[audio_chunker] Error parsing segments JSON for chunk {chunk_name}: {e}")

    full_transcript_text = " ".join(combined_text_parts)

    return {
        "text": full_transcript_text,
        "language": detected_language,
        "segments": json.dumps(combined_segments) if combined_segments else None,
    }
