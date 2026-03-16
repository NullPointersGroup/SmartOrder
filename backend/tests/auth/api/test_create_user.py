from unittest.mock import MagicMock

from fastapi.testclient import TestClient
from src.auth.schemas import UserRegistration


def test_registration_success(
    client: TestClient, mock_user_service: MagicMock, mock_user_registration: UserRegistration
) -> None:
    # mock_user_service.check_user.return_value = True

    response = client.post(
        "/auth/register",
        json={"username": mock_user_registration.username, "password": mock_user_registration.password, "email": mock_user_registration.email, "confirmPwd": mock_user_registration.confirmPwd},
    )
    assert response.status_code == 200
    assert response.json()["ok"] is True
    mock_user_service.create_user.assert_called_once()


# Il test fallisce, da sistemare
def test_register_user_twice(client, mock_user_service: MagicMock):
    # Configuriamo il mock per restituire True la prima volta e False la seconda
    mock_user_service.create_user.side_effect = [True, False]

    user_data = {"username": "testuser", "password": "secret", "email":"teset@test", "confirmPwd": "secret"}
    client.post("/auth/register", json=user_data)
    response2 = client.post("/auth/register", json=user_data)

    assert response2.json()["ok"] is False


def test_registration_missing_fields(client: TestClient) -> None:
    response = client.post("/auth/register", json={})
    assert response.status_code == 422  # Unprocessable Entity
