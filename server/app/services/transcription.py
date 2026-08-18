import json
from fastapi import HTTPException
from openai import OpenAI
from os import getenv
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = getenv("GROQ_API_KEY")

client = OpenAI(
    api_key=GROQ_API_KEY,
    base_url="https://api.groq.com/openai/v1",
)


def transcribe_audio(audio_bytes: bytes, filename: str) -> dict:
    try:
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
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")
