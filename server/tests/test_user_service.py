from types import SimpleNamespace
from unittest.mock import MagicMock, patch

import pytest
from fastapi import HTTPException

from app.schemas.user import LoginRequest
from app.services.user import UserService
from app.utils.verifyPassword import hash_password, verify_password


def test_password_hash_round_trip():
    password_hash = hash_password("StrongPassword1!")

    assert password_hash != "StrongPassword1!"
    assert verify_password("StrongPassword1!", password_hash)
    assert not verify_password("WrongPassword1!", password_hash)


def test_login_returns_token_for_valid_credentials():
    user = SimpleNamespace(id=7, email="person@example.com", password_hash="hash")
    repository = MagicMock()
    repository.get_by_email.return_value = user
    service = UserService(repository)

    with (
        patch("app.services.user.verify_email_format"),
        patch("app.services.user.verify_password", return_value=True),
        patch("app.services.user.create_access_token", return_value="access-token") as create_token,
    ):
        result = service.login_user(LoginRequest(email="PERSON@example.com", password="secret"))

    assert result == {"user": user, "access_token": "access-token"}
    repository.get_by_email.assert_called_once_with("person@example.com")
    create_token.assert_called_once_with(data={"sub": "person@example.com"})


def test_login_rejects_invalid_password():
    user = SimpleNamespace(id=7, email="person@example.com", password_hash="hash")
    repository = MagicMock()
    repository.get_by_email.return_value = user
    service = UserService(repository)

    with (
        patch("app.services.user.verify_email_format"),
        patch("app.services.user.verify_password", return_value=False),
        pytest.raises(HTTPException) as error,
    ):
        service.login_user(LoginRequest(email="person@example.com", password="wrong"))

    assert error.value.status_code == 400
    assert error.value.detail == "Invalid email or password"
