import json
from fastapi import HTTPException
from os import getenv
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

GENERATION_MODEL = getenv("GEMINI_MODEL", "gemini-3.6-flash")

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
        client = get_client()
        response = client.models.generate_content(
            model=GENERATION_MODEL,
            contents=SUMMARY_PROMPT.format(transcript=transcript_text),
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
            ),
        )
        raw = response.text.strip()

        if raw.startswith("```"):
            raw = raw.split("\n", 1)[1]
            if raw.endswith("```"):
                raw = raw[: raw.rfind("```")]
            raw = raw.strip()

        return json.loads(raw)
    except HTTPException:
        raise
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=500, detail="Failed to parse Gemini response as JSON"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Summarization failed: {str(e)}"
        )
