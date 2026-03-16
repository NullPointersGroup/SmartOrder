from unittest.mock import MagicMock

from fastapi.testclient import TestClient


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

    assert response.status_code == 200
    mock_user_service.check_user.assert_called_once()


def test_login_missing_fields(client: TestClient) -> None:
    response = client.post("/auth/login", json={})
    assert response.status_code == 422  # Unprocessable Entity
