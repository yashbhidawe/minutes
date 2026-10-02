"""Gemini embeddings wrapper (no new API key needed)."""

from fastapi import HTTPException
from os import getenv
from dotenv import load_dotenv

load_dotenv()

_client = None


def get_client():
    """Lazy-init Gemini client so import never crashes boot (same pattern as summarization)."""
    global _client
    if _client is not None:
        return _client
    api_key = getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY is not configured")
    from google import genai

    _client = genai.Client(api_key=api_key)
    return _client


def _extract_vectors(response) -> list[list[float]]:
    # google-genai returns response.embeddings[i].values; be defensive across SDK shapes.
    raw = getattr(response, "embeddings", None) or getattr(response, "embedding", None) or []
    if isinstance(raw, dict):
        raw = [raw]
    vectors: list[list[float]] = []
    for item in raw:
        if isinstance(item, dict):
            values = item.get("values") or item.get("embedding") or []
        else:
            values = getattr(item, "values", None) or getattr(item, "embedding", None) or []
        vectors.append([float(v) for v in values])
    return vectors


def embed_texts(texts: list[str], batch_size: int = 100) -> list[list[float]]:
    """Embed a batch of texts. Raises HTTPException on misconfiguration/failure."""
    cleaned = [(t or "").strip() for t in texts]
    if not any(cleaned):
        raise HTTPException(status_code=400, detail="No text provided for embedding")
    # Gemini rejects empty strings — replace with a placeholder so indices stay aligned.
    cleaned = [t if t else "(empty)" for t in cleaned]

    try:
        client = get_client()
        model = getenv("EMBED_MODEL", "gemini-embedding-001")
        all_vectors: list[list[float]] = []
        for i in range(0, len(cleaned), batch_size):
            batch = cleaned[i : i + batch_size]
            response = client.models.embed_content(model=model, contents=batch)
            vectors = _extract_vectors(response)
            if len(vectors) != len(batch):
                raise RuntimeError(f"Embedding count mismatch: got {len(vectors)} for {len(batch)} texts")
            all_vectors.extend(vectors)
        return all_vectors
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Embedding failed: {str(e)}")
