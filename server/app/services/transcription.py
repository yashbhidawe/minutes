import json
from fastapi import HTTPException
from openai import OpenAI
from os import getenv
from dotenv import load_dotenv

load_dotenv()

_client = None


def get_client():
    """Lazy-init Groq (OpenAI-compatible) client so import never crashes boot."""
    global _client
    if _client is not None:
        return _client
    api_key = getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY is not configured")
    _client = OpenAI(
        api_key=api_key,
        base_url="https://api.groq.com/openai/v1",
    )
    return _client


def transcribe_audio(audio_bytes: bytes, filename: str) -> dict:
    try:
        client = get_client()
        response = client.audio.transcriptions.create(
            file=(filename, audio_bytes),
            model="whisper-large-v3",
            response_format="verbose_json",
            timestamp_granularities=["segment"],
        )

        segments = []
        if hasattr(response, "segments") and response.segments:
            for seg in response.segments:
                segments.append({
                    "start": seg.start,
                    "end": seg.end,
                    "text": seg.text,
                })

        return {
            "text": response.text,
            "language": getattr(response, "language", "unknown"),
            "segments": json.dumps(segments) if segments else None,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")
