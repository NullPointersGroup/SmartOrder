import os
os.environ.setdefault("SECRET_KEY", "test-secret-key")

from unittest.mock import MagicMock, patch
from typing import cast

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient

from src.auth.api import (
    get_check_user_service,
    get_register_user_service,
    get_reset_password_service,
    get_delete_user_service,
    get_current_user,
)

from src.auth.CheckUserService import CheckUserService
from src.auth.RegisterUserService import RegisterUserService
from src.auth.ResetPasswordService import ResetPasswordService
from src.auth.DeleteUserService import DeleteUserService
from src.auth.UserRepoAdapter import UserRepoAdapter

from src.auth.exceptions import (
    InvalidCredentialsError,
    UserDeletionError,
    UserNotFoundError,
)

from src.auth.schemas import UserRegistrationSchema
from src.main import app


VALID_USER = {
    "username": "testuser",
    "password": "Password1!",
    "email": "test@test.com",
    "confirmPwd": "Password1!",
}


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def mock_check_service():
    return MagicMock(spec=CheckUserService)


@pytest.fixture
def mock_register_service():
    return MagicMock(spec=RegisterUserService)


@pytest.fixture
def mock_reset_service():
    return MagicMock(spec=ResetPasswordService)


@pytest.fixture
def mock_delete_service():
    return MagicMock(spec=DeleteUserService)


@pytest.fixture
def client(
    mock_check_service,
    mock_register_service,
    mock_reset_service,
    mock_delete_service,
):
    app.dependency_overrides[get_check_user_service] = lambda: mock_check_service
    app.dependency_overrides[get_register_user_service] = lambda: mock_register_service
    app.dependency_overrides[get_reset_password_service] = lambda: mock_reset_service
    app.dependency_overrides[get_delete_user_service] = lambda: mock_delete_service
    app.dependency_overrides[get_current_user] = lambda: "testuser"

    with TestClient(app) as c:
        yield c

    app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# REGISTER
# ---------------------------------------------------------------------------

#TU-B_01
def test_registration_success(
    client, mock_register_service: MagicMock, mock_user_registration: UserRegistrationSchema
) -> None:
    mock_register_service.register_user.return_value = None

    response = client.post("/api/auth/register", json=VALID_USER)

    assert response.status_code == 201
    assert response.json()["ok"] is True
    mock_register_service.register_user.assert_called_once()


#TU-B_02
def test_register_user_twice(client, mock_register_service: MagicMock) -> None:
    from src.auth.exceptions import UsernameAlreadyExistsError

    mock_register_service.register_user.side_effect = [
        None,
        UsernameAlreadyExistsError(),
    ]

    client.post("/api/auth/register", json=VALID_USER)
    response2 = client.post("/api/auth/register", json=VALID_USER)

    assert response2.status_code == 400
    assert response2.json()["detail"]["ok"] is False


#TU-B_03
def test_registration_missing_fields(client) -> None:
    response = client.post("/api/auth/register", json={})
    assert response.status_code == 422


#TU-B_04
def test_register_invalid_email_domain(client, mock_register_service: MagicMock) -> None:
    from src.auth.exceptions import InvalidEmailFormatError

    mock_register_service.register_user.side_effect = InvalidEmailFormatError()

    response = client.post("/api/auth/register", json=VALID_USER)

    assert response.status_code == 400
    assert "email" in response.json()["detail"]["errors"][0].lower()


#TU-B_05
def test_register_email_already_exists(client, mock_register_service: MagicMock) -> None:
    from src.auth.exceptions import EmailAlreadyExistsError

    mock_register_service.register_user.side_effect = EmailAlreadyExistsError()

    response = client.post("/api/auth/register", json=VALID_USER)

    assert response.status_code == 400
    assert "Email" in response.json()["detail"]["errors"][0]


#TU-B_06
def test_register_user_creation_error(client, mock_register_service: MagicMock) -> None:
    from src.auth.exceptions import UserCreationError

    mock_register_service.register_user.side_effect = UserCreationError()

    response = client.post("/api/auth/register", json=VALID_USER)

    assert response.status_code == 500
    assert response.json()["detail"]["ok"] is False


# ---------------------------------------------------------------------------
# LOGIN
# ---------------------------------------------------------------------------

#TU-B_07
def test_login_success(client, mock_check_service: MagicMock) -> None:
    mock_check_service.check_user.return_value = "testuser"

    with patch("src.auth.api.create_token", return_value="fake-token"):
        response = client.post(
            "/api/auth/login",
            json={"username": "testuser", "password": "testpassword"},
        )

    assert response.status_code == 200
    assert response.json()["ok"] is True
    mock_check_service.check_user.assert_called_once()


#TU-B_08
def test_login_failed(client, mock_check_service: MagicMock) -> None:
    mock_check_service.check_user.side_effect = InvalidCredentialsError()

    response = client.post(
        "/api/auth/login", json={"username": "testuser", "password": "wrongpassword"}
    )

    assert response.status_code == 400
    mock_check_service.check_user.assert_called_once()


#TU-B_09
def test_login_missing_fields(client) -> None:
    response = client.post("/api/auth/login", json={})
    assert response.status_code == 422


# ---------------------------------------------------------------------------
# Dependency factories
# ---------------------------------------------------------------------------

class TestDependencies:
    #TU-B_10
    def test_returns_check_service(self):
        mock_db = MagicMock()
        result = get_check_user_service(mock_db)
        assert isinstance(result, CheckUserService)

    #TU-B_11
    def test_returns_register_service(self):
        mock_db = MagicMock()
        result = get_register_user_service(mock_db)
        assert isinstance(result, RegisterUserService)

    #TU-B_12
    def test_returns_delete_service(self):
        mock_db = MagicMock()
        result = get_delete_user_service(mock_db)
        assert isinstance(result, DeleteUserService)


# ---------------------------------------------------------------------------
# get_current_user
# ---------------------------------------------------------------------------

class TestGetCurrentUser:
    #TU-B_13
    def test_valid_token_returns_username(self):
        with patch("src.auth.api.decode_token", return_value="testuser"):
            result = get_current_user("valid.token")

        assert result == "testuser"

    #TU-B_14
    def test_invalid_token_raises_401(self):
        with patch("src.auth.api.decode_token", return_value=None):
            with pytest.raises(HTTPException) as exc:
                get_current_user("invalid.token")

        assert exc.value.status_code == 401

    #TU-B_15
    def test_invalid_token_detail_message(self):
        with patch("src.auth.api.decode_token", return_value=None):
            with pytest.raises(HTTPException) as exc:
                get_current_user("invalid.token")

        assert exc.value.detail == "Token non valido"


# ---------------------------------------------------------------------------
# DELETE
# ---------------------------------------------------------------------------

class TestDeleteAccount:
    #TU-B_16
    def test_delete_account_success(self, client: TestClient, mock_delete_service: MagicMock):
        mock_delete_service.delete_user.return_value = None

        response = client.delete("/api/auth/delete")
        resp_json = response.json()

        assert response.status_code == 200
        assert resp_json["ok"] is True
        assert resp_json["errors"] == []
        mock_delete_service.delete_user.assert_called_once_with("testuser")

    #TU-B_17
    def test_delete_account_user_not_found(self, client, mock_delete_service):
        mock_delete_service.delete_user.side_effect = UserNotFoundError()

        response = client.delete("/api/auth/delete")
        resp_json = response.json()["detail"]

        assert response.status_code == 404
        assert resp_json["ok"] is False
        assert "Utente non trovato" in resp_json["errors"]
        mock_delete_service.delete_user.assert_called_once_with("testuser")

    #TU-B_18
    def test_delete_account_deletion_error(self, client, mock_delete_service):
        mock_delete_service.delete_user.side_effect = UserDeletionError()

        response = client.delete("/api/auth/delete")
        resp_json = response.json()["detail"]

        assert response.status_code == 500
        assert resp_json["ok"] is False
        assert "Errore durante la cancellazione" in resp_json["errors"]
        mock_delete_service.delete_user.assert_called_once_with("testuser")