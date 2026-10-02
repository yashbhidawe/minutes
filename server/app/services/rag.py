"""Phase-1 RAG: per-meeting indexing + retrieval + cited answering.

Storage: `meeting_chunks` rows with JSON embeddings (no vector-DB infra).
Retrieval: brute-force cosine similarity in Python — plenty fast for
per-meeting scope (tens to low-hundreds of chunks).
"""

import json
import math
from fastapi import HTTPException
from google.genai import types
from sqlalchemy.orm import Session

from app.repositories.chunks import ChunkRepository
from app.repositories.meeting import MeetingRepository
from app.services.chunking import build_chunks
from app.services.embeddings import embed_texts
from app.services.summarization import GENERATION_MODEL, get_client as get_gemini_client

DEFAULT_TOP_K = 5
MAX_TOP_K = 12

RAG_PROMPT = """You answer questions about a meeting using ONLY the provided transcript excerpts.

Question:
{question}

Excerpts (each has an index, start/end seconds, and text):
{excerpts}

Return a JSON object with exactly this structure (no markdown, no code fences, just raw JSON):
{{
  "answer": "Concise answer grounded in the excerpts. If the excerpts don't contain the answer, say so explicitly.",
  "citations": [0, 2]
}}

Rules:
- citations must be excerpt indices (integers) that directly support the answer, max 5.
- Use an empty array if nothing supports the answer.
- Never invent timestamps, names, or decisions not present in the excerpts.
- Return ONLY the JSON object, no other text."""


def _cosine(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a))
    nb = math.sqrt(sum(y * y for y in b))
    if na == 0 or nb == 0:
        return 0.0
    return dot / (na * nb)


def _decode_embedding(raw) -> list[float] | None:
    if not raw:
        return None
    try:
        vec = json.loads(raw) if isinstance(raw, str) else raw
        return [float(v) for v in vec] if isinstance(vec, list) else None
    except (ValueError, TypeError, json.JSONDecodeError):
        return None


def index_meeting(meeting_id: int, session: Session) -> int:
    """(Re)build the retrieval index for one meeting. Idempotent."""
    meeting_repo = MeetingRepository(session)
    transcript = meeting_repo.get_transcript(meeting_id)
    if not transcript or not (transcript.raw_text or "").strip():
        raise HTTPException(status_code=400, detail="No transcript available. Transcribe the meeting first.")

    chunks = build_chunks(transcript.segments, transcript.raw_text)
    if not chunks:
        raise HTTPException(status_code=400, detail="Transcript produced no indexable chunks.")

    vectors = embed_texts([c["text"] for c in chunks])
    payload = [
        {
            "chunk_index": i,
            "text": c["text"],
            "start_sec": c.get("start_sec"),
            "end_sec": c.get("end_sec"),
            "embedding": vec,
        }
        for i, (c, vec) in enumerate(zip(chunks, vectors))
    ]

    chunk_repo = ChunkRepository(session)
    chunk_repo.delete_by_meeting(meeting_id)
    chunk_repo.create_many(meeting_id, payload)
    return len(payload)


def retrieve_chunks(meeting_id: int, query: str, session: Session, top_k: int = DEFAULT_TOP_K) -> list[dict]:
    if not (query or "").strip():
        raise HTTPException(status_code=400, detail="Question must not be empty")
    top_k = max(1, min(top_k or DEFAULT_TOP_K, MAX_TOP_K))

    chunk_repo = ChunkRepository(session)
    rows = chunk_repo.get_by_meeting(meeting_id)
    if not rows:
        raise HTTPException(
            status_code=404,
            detail="No search index for this meeting. Call POST /meetings/{id}/index first.",
        )

    query_vec = embed_texts([query.strip()])[0]
    scored = []
    for row in rows:
        vec = _decode_embedding(row.embedding)
        if vec is None:
            continue
        scored.append(
            {
                "chunk_index": row.chunk_index,
                "text": row.text,
                "start_sec": row.start_sec,
                "end_sec": row.end_sec,
                "score": _cosine(query_vec, vec),
            }
        )
    scored.sort(key=lambda c: c["score"], reverse=True)
    return scored[:top_k]


def answer_question(meeting_id: int, question: str, session: Session, top_k: int = DEFAULT_TOP_K) -> dict:
    """Retrieve top-k chunks and ask Gemini for a grounded answer with citations."""
    hits = retrieve_chunks(meeting_id, question, session, top_k=top_k)

    excerpts = "\n".join(
        f"[{i}] ({h['start_sec']}-{h['end_sec']}s): {h['text']}"
        for i, h in enumerate(hits)
    )
    try:
        client = get_gemini_client()
        response = client.models.generate_content(
            model=GENERATION_MODEL,
            contents=RAG_PROMPT.format(question=question.strip(), excerpts=excerpts),
            config=types.GenerateContentConfig(response_mime_type="application/json"),
        )
        raw = response.text.strip()
        if raw.startswith("```"):
            raw = raw.split("\n", 1)[1]
            if raw.endswith("```"):
                raw = raw[: raw.rfind("```")]
            raw = raw.strip()
        result = json.loads(raw)
    except HTTPException:
        raise
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Failed to parse Gemini response as JSON")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"RAG answering failed: {str(e)}")

    # Sanitize citation indices back to real chunks (with timestamps).
    valid_indices = {i for i in range(len(hits))}
    citations = []
    for idx in result.get("citations", []) or []:
        try:
            idx = int(idx)
        except (TypeError, ValueError):
            continue
        if idx in valid_indices:
            h = hits[idx]
            citations.append(
                {
                    "chunk_index": h["chunk_index"],
                    "start_sec": h["start_sec"],
                    "end_sec": h["end_sec"],
                    "text": h["text"][:500],
                    "score": round(h["score"], 4),
                }
            )

    return {
        "answer": result.get("answer", ""),
        "citations": citations,
        "retrieved_chunks": [
            {
                "chunk_index": h["chunk_index"],
                "start_sec": h["start_sec"],
                "end_sec": h["end_sec"],
                "text": h["text"][:500],
                "score": round(h["score"], 4),
            }
            for h in hits
        ],
    }
