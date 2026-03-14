from typing import Generator
from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool
from sqlmodel import Session
from src.auth.schemas import User
from src.auth.UserService import UserService
from src.db.dbConnection import get_conn
from src.db.models import Utente
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


@pytest.fixture(scope="session")
def test_engine():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    return engine


@pytest.fixture
def db_session(test_engine):
    connection = test_engine.connect()
    transaction = connection.begin()

    session = Session(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def override_get_conn(db_session):

    def _get_conn_override():
        yield db_session

    app.dependency_overrides[get_conn] = _get_conn_override

    yield

    app.dependency_overrides.clear()
