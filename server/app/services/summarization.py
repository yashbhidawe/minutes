import json
import time
from os import getenv

from dotenv import load_dotenv
from fastapi import HTTPException
from google import genai
from google.genai import types

load_dotenv()

GENERATION_MODEL = getenv("GEMINI_MODEL", "gemini-3.8-flash")
# Fallback models tried in order when the primary is rate-limited / overloaded.
# Only current (non-shut-down) models — verified against Google's model page.
FALLBACK_MODELS = ["gemini-3.5-flash-lite", "gemini-3.1-flash-lite"]
MAX_RETRIES = 3
BASE_BACKOFF_SECONDS = 2.0

_client = None


def get_client():
    """Lazy-init Gemini client so import never crashes boot."""
    global _client
    if _client is not None:
        return _client
    api_key = getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY is not configured")
    _client = genai.Client(api_key=api_key)
    return _client


def _is_overload_error(exc: Exception) -> bool:
    text = str(exc).lower()
    type_name = type(exc).__name__.lower()
    return (
        "503" in text
        or "unavailable" in text
        or "overloaded" in text
        or "high demand" in text
        or "serviceunavailable" in type_name
        or "googleapicallerror" in type_name
    )


def generate_with_retry(prompt: str, response_mime_type: str = "application/json") -> str:
    """Call Gemini with exponential-backoff retries and model fallbacks.

    Returns the raw response text. Raises HTTPException(503) if every model
    and retry attempt is exhausted.
    """
    client = get_client()
    models = [GENERATION_MODEL] + [m for m in FALLBACK_MODELS if m != GENERATION_MODEL]

    last_error = None
    for model in models:
        for attempt in range(1, MAX_RETRIES + 1):
            try:
                response = client.models.generate_content(
                    model=model,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type=response_mime_type,
                    ),
                )
                return response.text.strip()
            except HTTPException:
                raise
            except Exception as exc:
                last_error = exc
                if not _is_overload_error(exc):
                    raise
                if attempt < MAX_RETRIES:
                    sleep_for = BASE_BACKOFF_SECONDS * (2 ** (attempt - 1))
                    time.sleep(sleep_for)
                    continue
                break  # try next model

    detail = f"Gemini generation failed after {len(models)} model(s) x {MAX_RETRIES} attempt(s): {last_error}"
    raise HTTPException(status_code=503, detail=detail)


def _strip_markdown_fence(raw: str) -> str:
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1]
        if raw.endswith("```"):
            raw = raw[: raw.rfind("```")]
        raw = raw.strip()
    return raw


SUMMARY_PROMPT = """You are an expert meeting assistant. Analyze the following meeting transcript and produce a structured output.

Transcript:
{transcript}

Return a JSON object with exactly this structure (no markdown, no code fences, just raw JSON):
{{
  "title": "A concise, descriptive meeting title (3 to 7 words) summarizing the core topic discussed",
  "key_decisions": "Bullet-point list of all decisions made during the meeting. Each decision on its own line starting with '- '. Leave empty string if none.",
  "discussion_points": "Summary of the main topics discussed and key arguments or ideas shared. Use bullet points starting with '- '. Leave empty string if none.",
  "blockers": "Any blockers, risks, or concerns raised. Each on its own line starting with '- '. Leave empty string if none.",
  "next_steps": "Concrete next steps, follow-ups, or tasks mentioned. Each on its own line starting with '- '. Leave empty string if none.",
  "action_items": [
    {{
      "description": "Clear description of the action item",
      "assigned_to": "Name of person assigned, or null if unassigned",
      "due_date": "Due date as ISO string, or null if not mentioned",
      "priority": "high, medium, or low based on urgency and importance"
    }}
  ]
}}

Rules:
- Key decisions should capture any conclusions, agreements, or choices made.
- Discussion points should cover the substance of what was talked about.
- Blockers should capture anything that's preventing progress.
- Next steps should be forward-looking actions or follow-ups.
- Extract all concrete action items with owners, deadlines, and priority.
- If a section has nothing relevant, use an empty string "".
- If no action items are found, return an empty array for action_items.
- Return ONLY the JSON object, no other text."""


def summarize_transcript(transcript_text: str) -> dict:
    try:
        raw = generate_with_retry(
            SUMMARY_PROMPT.format(transcript=transcript_text),
            response_mime_type="application/json",
        )
        raw = _strip_markdown_fence(raw)
        return json.loads(raw)
    except HTTPException:
        raise
    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=500, detail="Failed to parse Gemini response as JSON"
        ) from e
