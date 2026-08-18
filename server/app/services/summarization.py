import json
from fastapi import HTTPException
from os import getenv
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

GEMINI_API_KEY = getenv("GEMINI_API_KEY")

genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel("gemini-3.6-flash")

SUMMARY_PROMPT = """You are an expert meeting assistant. Analyze the following meeting transcript and produce a structured output.

Transcript:
{transcript}

Return a JSON object with exactly this structure (no markdown, no code fences, just raw JSON):
{{
  "summary": "A concise 2-4 sentence summary of the meeting covering the main topics discussed and any decisions made.",
  "action_items": [
    {{
      "description": "Clear description of the action item",
      "assigned_to": "Name of person assigned, or null if unassigned",
      "due_date": "Due date as ISO string, or null if not mentioned"
    }}
  ]
}}

Rules:
- The summary should be clear and useful for someone who missed the meeting.
- Extract all concrete action items with owners and deadlines when mentioned.
- If no action items are found, return an empty array for action_items.
- Return ONLY the JSON object, no other text."""


def summarize_transcript(transcript_text: str) -> dict:
    try:
        response = model.generate_content(
            SUMMARY_PROMPT.format(transcript=transcript_text)
        )
        raw = response.text.strip()

        if raw.startswith("```"):
            raw = raw.split("\n", 1)[1]
            if raw.endswith("```"):
                raw = raw[: raw.rfind("```")]
            raw = raw.strip()

        return json.loads(raw)
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=500, detail="Failed to parse Gemini response as JSON"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Summarization failed: {str(e)}"
        )
