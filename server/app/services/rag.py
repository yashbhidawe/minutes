"""Phase-1 RAG: per-meeting indexing + retrieval + cited answering.

Storage: `meeting_chunks` rows with JSON embeddings (no vector-DB infra).
Retrieval: brute-force cosine similarity in Python — plenty fast for
per-meeting scope (tens to low-hundreds of chunks).
"""

import json
import math
from os import getenv

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.meeting import Meeting
from app.models.meeting_chunk import MeetingChunk
from app.repositories.chunks import ChunkRepository
from app.repositories.meeting import MeetingRepository
from app.services.chunking import build_chunks
from app.services.embeddings import embed_texts
from app.services.summarization import GENERATION_MODEL, generate_with_retry

DEFAULT_TOP_K = 5
MAX_TOP_K = 12
GLOBAL_DEFAULT_TOP_K = 8
GLOBAL_PER_MEETING_CAP = 3
# Answering over a handful of excerpts doesn't need the biggest model, and the
# lite model is several times faster. Override with RAG_MODEL.
RAG_MODEL = getenv("RAG_MODEL", "gemini-3.5-flash-lite")
RAG_TIMEOUT_SECONDS = 20.0

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
    # Dimension mismatch means the stored index was built with a different
    # embedding model than the current one. Truncating to the shorter vector
    # would silently produce a meaningless score, so treat it as no match.
    if len(a) != len(b):
        return 0.0
    dot = sum(x * y for x, y in zip(a, b, strict=True))
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


def _strip_markdown_fence(raw: str) -> str:
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1]
        if raw.endswith("```"):
            raw = raw[: raw.rfind("```")]
        raw = raw.strip()
    return raw


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
        for i, (c, vec) in enumerate(zip(chunks, vectors, strict=True))
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
        raw = generate_with_retry(
            RAG_PROMPT.format(question=question.strip(), excerpts=excerpts),
            response_mime_type="application/json",
            models=[RAG_MODEL, GENERATION_MODEL],
            timeout_seconds=RAG_TIMEOUT_SECONDS,
        )
        raw = _strip_markdown_fence(raw)
        result = json.loads(raw)
    except HTTPException:
        raise
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail="Failed to parse Gemini response as JSON") from e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"RAG answering failed: {e!s}") from e

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


GLOBAL_RAG_PROMPT = """You answer questions using ONLY the provided transcript excerpts, which come from DIFFERENT meetings. Each excerpt notes its meeting title.

Question:
{question}

Excerpts (index, meeting, time range, text):
{excerpts}

Return a JSON object with exactly this structure (no markdown, no code fences, just raw JSON):
{{
  "answer": "Concise answer grounded in the excerpts. Mention which meeting each fact comes from. If the excerpts don't contain the answer, say so explicitly.",
  "citations": [0, 2]
}}

Rules:
- citations must be excerpt indices (integers) that directly support the answer, max 5.
- Use an empty array if nothing supports the answer.
- Never invent meetings, timestamps, names, or decisions not present in the excerpts.
- Return ONLY the JSON object, no other text."""


def retrieve_global(
    user_id: int,
    query: str,
    session: Session,
    top_k: int = GLOBAL_DEFAULT_TOP_K,
    per_meeting_cap: int = GLOBAL_PER_MEETING_CAP,
) -> list[dict]:
    """Brute-force cosine search over ALL of a user's indexed chunks.

    Results are diversity-capped per meeting so one long meeting can't
    crowd out the rest.
    """
    if not (query or "").strip():
        raise HTTPException(status_code=400, detail="Question must not be empty")
    top_k = max(1, min(top_k or GLOBAL_DEFAULT_TOP_K, MAX_TOP_K))

    rows = (
        session.query(MeetingChunk, Meeting)
        .join(Meeting, Meeting.id == MeetingChunk.meeting_id)
        .filter(Meeting.user_id == user_id)
        .order_by(MeetingChunk.meeting_id.asc(), MeetingChunk.chunk_index.asc())
        .all()
    )
    if not rows:
        raise HTTPException(
            status_code=404,
            detail="No indexed meetings yet. Open a meeting and ask it something first, or wait for processing to finish.",
        )

    query_vec = embed_texts([query.strip()])[0]
    scored = []
    for chunk, meeting in rows:
        vec = _decode_embedding(chunk.embedding)
        if vec is None:
            continue
        scored.append(
            {
                "meeting_id": meeting.id,
                "meeting_title": meeting.title,
                "chunk_index": chunk.chunk_index,
                "text": chunk.text,
                "start_sec": chunk.start_sec,
                "end_sec": chunk.end_sec,
                "score": _cosine(query_vec, vec),
            }
        )
    scored.sort(key=lambda c: c["score"], reverse=True)

    # Diversity cap: at most `per_meeting_cap` chunks per meeting, then top_k overall.
    picked, per_meeting = [], {}
    for hit in scored:
        if per_meeting.get(hit["meeting_id"], 0) >= per_meeting_cap:
            continue
        per_meeting[hit["meeting_id"]] = per_meeting.get(hit["meeting_id"], 0) + 1
        picked.append(hit)
        if len(picked) >= top_k:
            break
    return picked


def answer_global(
    user_id: int,
    question: str,
    session: Session,
    top_k: int = GLOBAL_DEFAULT_TOP_K,
) -> dict:
    hits = retrieve_global(user_id, question, session, top_k=top_k)

    excerpts = "\n".join(
        f"[{i}] (Meeting: {h['meeting_title']!r}, {h['start_sec']}-{h['end_sec']}s): {h['text']}"
        for i, h in enumerate(hits)
    )
    try:
        raw = generate_with_retry(
            GLOBAL_RAG_PROMPT.format(question=question.strip(), excerpts=excerpts),
            response_mime_type="application/json",
            models=[RAG_MODEL, GENERATION_MODEL],
            timeout_seconds=RAG_TIMEOUT_SECONDS,
        )
        raw = _strip_markdown_fence(raw)
        result = json.loads(raw)
    except HTTPException:
        raise
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail="Failed to parse Gemini response as JSON") from e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"RAG answering failed: {e!s}") from e

    def _shape(h: dict) -> dict:
        return {
            "meeting_id": h["meeting_id"],
            "meeting_title": h["meeting_title"],
            "chunk_index": h["chunk_index"],
            "start_sec": h["start_sec"],
            "end_sec": h["end_sec"],
            "text": h["text"][:500],
            "score": round(h["score"], 4),
        }

    valid_indices = {i for i in range(len(hits))}
    citations = []
    for idx in result.get("citations", []) or []:
        try:
            idx = int(idx)
        except (TypeError, ValueError):
            continue
        if idx in valid_indices:
            citations.append(_shape(hits[idx]))

    return {
        "answer": result.get("answer", ""),
        "citations": citations,
        "retrieved_chunks": [_shape(h) for h in hits],
    }
