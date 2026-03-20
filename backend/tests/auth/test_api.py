from unittest.mock import MagicMock, patch
from typing import cast

import pytest
from fastapi import HTTPException

from src.auth.UserService import UserService
from src.auth.UserRepoAdapter import UserRepoAdapter
from src.auth.api import get_user_service, get_current_user

from fastapi.testclient import TestClient
from src.auth.schemas import UserRegistrationSchema

VALID_USER = {
    "username": "testuser",
    "password": "Password1!",
    "email":    "test@test.com",
    "confirmPwd": "Password1!",
}


def test_registration_success(
    client: TestClient, mock_user_service: MagicMock, mock_user_registration: UserRegistrationSchema
) -> None:
    mock_user_service.register_user = MagicMock(return_value=True)

    response = client.post(
        "/auth/register",
        json={
            "username": mock_user_registration.username,
            "password": mock_user_registration.password,
            "email": mock_user_registration.email,
            "confirmPwd": mock_user_registration.confirmPwd,
        },
    )

    assert response.status_code == 201
    assert response.json()["ok"] is True
    mock_user_service.register_user.assert_called_once()


def test_register_user_twice(client: TestClient, mock_user_service: MagicMock) -> None:
    from src.auth.exceptions import UsernameAlreadyExistsError
    mock_user_service.register_user = MagicMock(
        side_effect=[True, UsernameAlreadyExistsError()]
    )

    user_data = {
        "username": "testuser",
        "password": "Password1!",
        "email": "test@test.com",
        "confirmPwd": "Password1!",
    }
    client.post("/auth/register", json=user_data)
    response2 = client.post("/auth/register", json=user_data)

    assert response2.status_code == 400
    assert response2.json()["detail"]["ok"] is False


def test_registration_missing_fields(client: TestClient) -> None:
    response = client.post("/auth/register", json={})
    assert response.status_code == 422


def test_login_success(client: TestClient, mock_user_service: MagicMock) -> None:
    mock_user_service.check_user.return_value = True

    response = client.post(
        "/auth/login", json={"username": "testuser", "password": "testpassword"}
    )

    assert response.status_code == 200
    mock_user_service.check_user.assert_called_once()


def test_login_failed(client: TestClient, mock_user_service: MagicMock) -> None:
    mock_user_service.check_user.return_value = False

    response = client.post(
        "/auth/login", json={"username": "testuser", "password": "wrongpassword"}
    )

    assert response.status_code == 400
    mock_user_service.check_user.assert_called_once()


def test_login_missing_fields(client: TestClient) -> None:
    response = client.post("/auth/login", json={})
    assert response.status_code == 422


def test_register_invalid_email_domain(client: TestClient, mock_user_service: MagicMock) -> None:
    from src.auth.exceptions import InvalidEmailFormatError
    mock_user_service.register_user = MagicMock(side_effect=InvalidEmailFormatError())

    response = client.post("/auth/register", json=VALID_USER)

    assert response.status_code == 400
    assert "email" in response.json()["detail"]["errors"][0].lower()


def test_register_email_already_exists(client: TestClient, mock_user_service: MagicMock) -> None:
    from src.auth.exceptions import EmailAlreadyExistsError
    mock_user_service.register_user = MagicMock(side_effect=EmailAlreadyExistsError())

    response = client.post("/auth/register", json=VALID_USER)

    assert response.status_code == 400
    assert "Email" in response.json()["detail"]["errors"][0]


def test_register_user_creation_error(client: TestClient, mock_user_service: MagicMock) -> None:
    from src.auth.exceptions import UserCreationError
    mock_user_service.register_user = MagicMock(side_effect=UserCreationError())

    response = client.post("/auth/register", json=VALID_USER)

    assert response.status_code == 500
    assert response.json()["detail"]["ok"] is False


# ---------------------------------------------------------------------------
# get_user_service
# ---------------------------------------------------------------------------

class TestGetUserService:
    def test_returns_user_service_instance(self):
        mock_db = MagicMock()
        result = get_user_service(mock_db)
        assert isinstance(result, UserService)

    def test_user_service_wraps_user_repo_adapter(self):
        mock_db = MagicMock()
        result = get_user_service(mock_db)
        assert isinstance(result.repo, UserRepoAdapter)

    def test_adapter_receives_db_session(self):
        mock_db = MagicMock()
        result = get_user_service(mock_db)
        assert isinstance(result.repo, UserRepoAdapter)
        assert cast(UserRepoAdapter, result.repo).repo.executor.db is mock_db


# ---------------------------------------------------------------------------
# get_current_user
# ---------------------------------------------------------------------------

class TestGetCurrentUser:
    def test_valid_token_returns_username(self):
        with patch("src.auth.api.TokenService.decode_token", return_value="testuser"):
            result = get_current_user("valid.token.here")
        assert result == "testuser"

    def test_invalid_token_raises_401(self):
        with patch("src.auth.api.TokenService.decode_token", return_value=None):
            with pytest.raises(HTTPException) as exc:
                get_current_user("token.non.valido")
        assert exc.value.status_code == 401

    def test_invalid_token_detail_message(self):
        with patch("src.auth.api.TokenService.decode_token", return_value=None):
            with pytest.raises(HTTPException) as exc:
                get_current_user("token.non.valido")
        assert exc.value.detail == "Token non valido"