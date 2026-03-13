from typing import Generator
from fastapi.testclient import TestClient
import pytest

from src.auth.UserService import UserService
from src.auth.schemas import User
from src.db.models import Utente
from unittest.mock import MagicMock
from src.main import app


@pytest.fixture
def mock_user() -> User:
    return User(username="testuser", password="testpassword")


@pytest.fixture
def mock_utente() -> Utente:
    return Utente(username="testuser", password="testpassword", descrizione="test")


@pytest.fixture
def mock_session(mock_utente: Utente) -> MagicMock:
    session = MagicMock()
    session.exec.return_value.all.return_value = [mock_utente]
    return session


@pytest.fixture
def mock_user_service() -> MagicMock:
    return MagicMock(spec=UserService)


@pytest.fixture
def client(mock_user_service: MagicMock) -> Generator[TestClient, None, None]:
    app.dependency_overrides[UserService] = lambda: mock_user_service
    yield TestClient(app)
    app.dependency_overrides.clear()
