"""Tests for the Gemini embedding wrapper (`app.services.embeddings`).

The provider is always mocked — these tests assert the request shape and the
error handling, never the remote model.
"""

from unittest.mock import MagicMock, patch

import pytest
from fastapi import HTTPException

from app.services.embeddings import embed_texts


def _response_with_vectors(count: int, dims: int = 3) -> MagicMock:
    """A fake google-genai embed_content response."""
    response = MagicMock()
    response.embeddings = []
    for _ in range(count):
        embedding = MagicMock()
        embedding.values = [0.1] * dims
        response.embeddings.append(embedding)
    return response


def test_embed_texts_returns_one_vector_per_input():
    """Each input text produces exactly one embedding vector."""
    client = MagicMock()
    client.models.embed_content.return_value = _response_with_vectors(2)

    with patch("app.services.embeddings.get_client", return_value=client):
        vectors = embed_texts(["first", "second"])

    assert len(vectors) == 2
    assert all(len(vector) == 3 for vector in vectors)


def test_embed_texts_batches_requests():
    """More than 100 texts are sent in batches of 100."""
    client = MagicMock()
    client.models.embed_content.side_effect = [
        _response_with_vectors(100),
        _response_with_vectors(50),
    ]

    with patch("app.services.embeddings.get_client", return_value=client):
        vectors = embed_texts([f"text {i}" for i in range(150)])

    assert len(vectors) == 150
    assert client.models.embed_content.call_count == 2


def test_embed_texts_substitutes_empty_strings():
    """Empty inputs are replaced with a placeholder so indices stay aligned."""
    client = MagicMock()
    client.models.embed_content.return_value = _response_with_vectors(2)

    with patch("app.services.embeddings.get_client", return_value=client):
        embed_texts(["", "real text"])

    contents = client.models.embed_content.call_args.kwargs["contents"]
    assert contents == ["(empty)", "real text"]


def test_embed_texts_rejects_all_empty_input():
    """A request with no usable text is a client error, not a provider call."""
    client = MagicMock()

    with patch("app.services.embeddings.get_client", return_value=client), pytest.raises(HTTPException) as error:
        embed_texts(["", "   "])

    assert error.value.status_code == 400
    client.models.embed_content.assert_not_called()


def test_embed_texts_raises_on_count_mismatch():
    """A provider response with the wrong number of vectors is an error."""
    client = MagicMock()
    client.models.embed_content.return_value = _response_with_vectors(1)

    with patch("app.services.embeddings.get_client", return_value=client), pytest.raises(HTTPException) as error:
        embed_texts(["one", "two"])

    assert error.value.status_code == 500
    assert "Embedding failed" in error.value.detail


def test_embed_texts_surfaces_provider_failure_as_500():
    """A provider exception becomes a 500 with the original message included."""
    client = MagicMock()
    client.models.embed_content.side_effect = RuntimeError("provider exploded")

    with patch("app.services.embeddings.get_client", return_value=client), pytest.raises(HTTPException) as error:
        embed_texts(["text"])

    assert error.value.status_code == 500
    assert "provider exploded" in error.value.detail


def test_embed_texts_requires_api_key():
    """A missing API key is a clear 500 rather than an opaque client error."""
    with (
        patch(
            "app.services.embeddings.get_client",
            side_effect=HTTPException(500, "GEMINI_API_KEY is not configured"),
        ),
        pytest.raises(HTTPException) as error,
    ):
        embed_texts(["text"])

    assert error.value.status_code == 500
    assert "GEMINI_API_KEY" in error.value.detail
