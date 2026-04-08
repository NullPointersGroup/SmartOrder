from unittest.mock import MagicMock, patch
from typing import cast

import pytest
from fastapi import HTTPException

from fastapi.testclient import TestClient

from src.auth.UserService import UserService
from src.auth.UserRepoAdapter import UserRepoAdapter
from src.auth.api import get_user_service, get_current_user

from src.auth.exceptions import InvalidCredentialsError, UserDeletionError, UserNotFoundError

from src.auth.schemas import UserRegistrationSchema

VALID_USER = {
    "username": "testuser",
    "password": "Password1!",
    "email":    "test@test.com",
    "confirmPwd": "Password1!",
}

#TU-B_01
def test_registration_success(
    client, mock_user_service: MagicMock, mock_user_registration: UserRegistrationSchema
) -> None:
    mock_user_service.register_user = MagicMock(return_value=True)

    response = client.post(
        "/api/auth/register",
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

#TU-B_02
def test_register_user_twice(client, mock_user_service: MagicMock) -> None:
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
    client.post("/api/auth/register", json=user_data)
    response2 = client.post("/api/auth/register", json=user_data)

    assert response2.status_code == 400
    assert response2.json()["detail"]["ok"] is False

#TU-B_03
def test_registration_missing_fields(client) -> None:
    response = client.post("/api/auth/register", json={})
    assert response.status_code == 422

#TU-B_04
def test_register_invalid_email_domain(client, mock_user_service: MagicMock) -> None:
    from src.auth.exceptions import InvalidEmailFormatError
    mock_user_service.register_user = MagicMock(side_effect=InvalidEmailFormatError())

    response = client.post("/api/auth/register", json=VALID_USER)

    assert response.status_code == 400
    assert "email" in response.json()["detail"]["errors"][0].lower()

#TU-B_05
def test_register_email_already_exists(client, mock_user_service: MagicMock) -> None:
    from src.auth.exceptions import EmailAlreadyExistsError
    mock_user_service.register_user = MagicMock(side_effect=EmailAlreadyExistsError())

    response = client.post("/api/auth/register", json=VALID_USER)

    assert response.status_code == 400
    assert "Email" in response.json()["detail"]["errors"][0]

#TU-B_06
def test_register_user_creation_error(client, mock_user_service: MagicMock) -> None:
    from src.auth.exceptions import UserCreationError
    mock_user_service.register_user = MagicMock(side_effect=UserCreationError())

    response = client.post("/api/auth/register", json=VALID_USER)

    assert response.status_code == 500
    assert response.json()["detail"]["ok"] is False

#TU-B_07
def test_login_success(client, mock_user_service: MagicMock) -> None:
    mock_user_service.check_user.return_value = "testuser"

    with patch("src.auth.api.TokenUtility.create_token", return_value="fake-token"):
        response = client.post(
            "/api/auth/login",
            json={"username": "testuser", "password": "testpassword"},
        )

    assert response.status_code == 200
    assert response.json()["ok"] is True
    mock_user_service.check_user.assert_called_once()

#TU-B_08
def test_login_failed(client, mock_user_service: MagicMock) -> None:
    mock_user_service.check_user.side_effect = InvalidCredentialsError()

    response = client.post(
        "/api/auth/login", json={"username": "testuser", "password": "wrongpassword"}
    )

    assert response.status_code == 400
    mock_user_service.check_user.assert_called_once()

#TU-B_09
def test_login_missing_fields(client) -> None:
    response = client.post("/api/auth/login", json={})
    assert response.status_code == 422

# ---------------------------------------------------------------------------
# get_user_service
# ---------------------------------------------------------------------------

class TestGetUserService:
    #TU-B_10
    def test_returns_user_service_instance(self):
        mock_db = MagicMock()
        result = get_user_service(mock_db)
        assert isinstance(result, UserService)

    #TU-B_11
    def test_user_service_wraps_user_repo_adapter(self):
        mock_db = MagicMock()
        result = get_user_service(mock_db)
        assert isinstance(result.repo, UserRepoAdapter)

    #TU-B_12
    def test_adapter_receives_db_session(self):
        mock_db = MagicMock()
        result = get_user_service(mock_db)
        assert isinstance(result.repo, UserRepoAdapter)
        assert cast(UserRepoAdapter, result.repo).repo.executor.db is mock_db


# ---------------------------------------------------------------------------
# get_current_user
# ---------------------------------------------------------------------------

class TestGetCurrentUser:
    #TU-B_13
    def test_valid_token_returns_username(self):
        from unittest.mock import MagicMock

        mock_request = MagicMock()
        mock_request.cookies.get.return_value = "valid.token.here"

        with patch("src.auth.api.TokenUtility.decode_token", return_value="testuser"):
            result = get_current_user(mock_request)

        assert result == "testuser"

    #TU-B_14
    def test_invalid_token_raises_401(self):
        from unittest.mock import MagicMock

        mock_request = MagicMock()
        mock_request.cookies.get.return_value = "token.non.valido"

        with patch("src.auth.api.TokenUtility.decode_token", return_value=None):
            with pytest.raises(HTTPException) as exc:
                get_current_user(mock_request)

        assert exc.value.status_code == 401

    #TU-B_15
    def test_invalid_token_detail_message(self):
        from unittest.mock import MagicMock

        mock_request = MagicMock()
        mock_request.cookies.get.return_value = "token.non.valido"

        with patch("src.auth.api.TokenUtility.decode_token", return_value=None):
            with pytest.raises(HTTPException) as exc:
                get_current_user(mock_request)

        assert exc.value.detail == "Token non valido"

# ---------------------------------------------------------------------------
# delete_account
# ---------------------------------------------------------------------------

class TestDeleteAccount:
    #TU-B_16
    def test_delete_account_success(self, client: TestClient, mock_user_service: MagicMock):
        # Configura il mock per la cancellazione riuscita
        mock_user_service.delete_user.return_value = None  # delete_user non deve restituire nulla

        response = client.delete("/api/auth/delete")
        resp_json = response.json()

        # Verifica risposta e chiamata del mock
        print(response.status_code, response.text)
        assert response.status_code == 200
        assert resp_json["ok"] is True
        assert resp_json["errors"] == []
        mock_user_service.delete_user.assert_called_once_with("testuser")

    #TU-B_17
    def test_delete_account_user_not_found(self, client, mock_user_service):
        mock_user_service.delete_user.side_effect = UserNotFoundError()

        response = client.delete("/api/auth/delete")
        resp_json = response.json()["detail"]

        assert response.status_code == 404
        assert resp_json["ok"] is False
        assert "Utente non trovato" in resp_json["errors"]
        mock_user_service.delete_user.assert_called_once_with("testuser")

    #TU-B_18
    def test_delete_account_deletion_error(self, client, mock_user_service):
        mock_user_service.delete_user.side_effect = UserDeletionError()

        response = client.delete("/api/auth/delete")
        resp_json = response.json()["detail"]

        assert response.status_code == 500
        assert resp_json["ok"] is False
        assert "Errore durante la cancellazione" in resp_json["errors"]
        mock_user_service.delete_user.assert_called_once_with("testuser")