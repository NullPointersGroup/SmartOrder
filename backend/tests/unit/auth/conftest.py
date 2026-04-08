import os
os.environ.setdefault("SECRET_KEY", "test-secret-key")

from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient
from src.auth.api import get_user_service, get_current_user
from src.auth.schemas import UserSchema, UserRegistrationSchema
from src.auth.UserService import UserService
from src.db.models import Utentiweb 
from src.main import app


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
def mock_user_service() -> MagicMock:
    return MagicMock(spec=UserService)


@pytest.fixture
def client(mock_user_service: MagicMock):
    app.dependency_overrides[get_user_service] = lambda: mock_user_service
    app.dependency_overrides[get_current_user] = lambda: "testuser"
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
