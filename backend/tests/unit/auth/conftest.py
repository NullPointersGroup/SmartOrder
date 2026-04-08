import os
os.environ.setdefault("SECRET_KEY", "test-secret-key")

from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient
from src.auth.api import (
    get_check_user_service,
    get_register_user_service,
    get_reset_password_service,
    get_delete_user_service,
    get_current_user
)
from src.auth.schemas import UserSchema, UserRegistrationSchema
from src.db.models import Utentiweb 
from src.main import app
from src.auth.CheckUserService import CheckUserService
from src.auth.RegisterUserService import RegisterUserService
from src.auth.DeleteUserService import DeleteUserService
from src.auth.ResetPasswordService import ResetPasswordService


@pytest.fixture
def mock_user() -> UserSchema:
    return UserSchema(username="testuser", password="testpassword")


@pytest.fixture
def mock_user_registration() -> UserRegistrationSchema:
    return UserRegistrationSchema(
        username="testuser",
        password="Password1!",
        email="test@test.com",
        confirmPwd="Password1!",
    )


@pytest.fixture
def mock_session(mock_utente: Utentiweb) -> MagicMock:
    session = MagicMock()
    session.exec.return_value.all.return_value = [mock_utente]
    return session


@pytest.fixture
def mock_check_service():
    return MagicMock(spec=CheckUserService)

@pytest.fixture
def mock_register_service():
    return MagicMock(spec=RegisterUserService)

@pytest.fixture
def mock_delete_service():
    return MagicMock(spec=DeleteUserService)

@pytest.fixture
def mock_reset_service():
    return MagicMock(spec=ResetPasswordService)


@pytest.fixture
def client(
    mock_check_service,
    mock_register_service,
    mock_delete_service,
    mock_reset_service,
):
    app.dependency_overrides[get_check_user_service] = lambda: mock_check_service
    app.dependency_overrides[get_register_user_service] = lambda: mock_register_service
    app.dependency_overrides[get_delete_user_service] = lambda: mock_delete_service
    app.dependency_overrides[get_reset_password_service] = lambda: mock_reset_service

    app.dependency_overrides[get_current_user] = lambda: "testuser"

    with TestClient(app) as c:
        yield c

    app.dependency_overrides.clear()
