"""Tests for the JWT auth dependency (`app.utils.auth`).

These are the tests that guard the authentication boundary: a token that is
tampered with, expired, missing a subject, or pointing at a deleted user must
never resolve to a user.
"""

from datetime import UTC, datetime, timedelta

import pytest
from fastapi import HTTPException
from jose import jwt

from app.utils.auth import ALGORITHM, JWT_SECRET_KEY, create_access_token, get_current_user


class _Credentials:
    """Minimal stand-in for HTTPAuthorizationCredentials."""

    def __init__(self, token: str):
        self.credentials = token
        self.scheme = "Bearer"


def _token(payload: dict) -> str:
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=ALGORITHM)


def test_create_access_token_round_trip():
    """A generated token decodes back to the original subject."""
    token = create_access_token({"sub": "person@example.com"})

    payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[ALGORITHM])

    assert payload["sub"] == "person@example.com"
    assert "exp" in payload


def test_create_access_token_does_not_mutate_input():
    """The caller's dict must not be modified by adding the expiry."""
    data = {"sub": "person@example.com"}

    create_access_token(data)

    assert data == {"sub": "person@example.com"}


def test_get_current_user_returns_matching_user(db_session):
    """A valid token resolves to the user with the matching email."""
    from app.models.user import User

    db_session.add(User(email="person@example.com", password_hash="hash"))
    db_session.commit()

    token = create_access_token({"sub": "person@example.com"})
    user = get_current_user(_Credentials(token), db_session)

    assert user.email == "person@example.com"


def test_get_current_user_rejects_expired_token(db_session):
    """An expired token is rejected with 401."""
    expired = _token(
        {
            "sub": "person@example.com",
            "exp": datetime.now(UTC) - timedelta(minutes=1),
        }
    )

    with pytest.raises(HTTPException) as error:
        get_current_user(_Credentials(expired), db_session)

    assert error.value.status_code == 401
    assert error.value.detail == "Invalid or expired token"


def test_get_current_user_rejects_token_signed_with_other_key(db_session):
    """A token signed with a different secret must not authenticate."""
    forged = jwt.encode(
        {"sub": "person@example.com"}, "a-different-secret", algorithm=ALGORITHM
    )

    with pytest.raises(HTTPException) as error:
        get_current_user(_Credentials(forged), db_session)

    assert error.value.status_code == 401
    assert error.value.detail == "Invalid or expired token"


def test_get_current_user_rejects_token_without_subject(db_session):
    """A token with no `sub` claim is rejected."""
    token = _token({"role": "admin"})

    with pytest.raises(HTTPException) as error:
        get_current_user(_Credentials(token), db_session)

    assert error.value.status_code == 401
    assert error.value.detail == "Invalid token: missing subject"


def test_get_current_user_rejects_unknown_user(db_session):
    """A valid token for a user that no longer exists is rejected."""
    token = create_access_token({"sub": "ghost@example.com"})

    with pytest.raises(HTTPException) as error:
        get_current_user(_Credentials(token), db_session)

    assert error.value.status_code == 401
    assert error.value.detail == "User not found"


def test_protected_endpoint_requires_bearer_token(client):
    """A meeting request without an Authorization header is rejected."""
    response = client.get("/meetings/")

    assert response.status_code == 403


def test_protected_endpoint_rejects_invalid_token(client):
    """A garbage token is rejected by the auth dependency."""
    response = client.get("/meetings/", headers={"Authorization": "Bearer not-a-jwt"})

    assert response.status_code == 401
