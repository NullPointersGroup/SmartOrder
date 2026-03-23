import os

os.environ["DATABASE_URL"] = "sqlite://"
from typing import Any, Generator
from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel
from src.auth.schemas import UserSchema, UserRegistrationSchema
from src.auth.UserService import UserService
from src.db.dbConnection import get_conn
from src.db.models import Utente 
from src.main import app


@pytest.fixture
def mock_user() -> UserSchema:
    return UserSchema(username="testuser", password="testpassword")


@pytest.fixture
def mock_user_registration() -> UserRegistrationSchema:
    return UserRegistrationSchema(
        username="testuser",
        password="testpassword",
        email="test@test",
        confirmPwd="testpassword",
    )


@pytest.fixture
def mock_session(mock_utente: Utente) -> MagicMock:
    session = MagicMock()
    session.exec.return_value.all.return_value = [mock_utente]
    return session


@pytest.fixture
def mock_user_service() -> MagicMock:
    return MagicMock(spec=UserService)


@pytest.fixture
def client(mock_user_service: MagicMock):
    app.dependency_overrides[UserService] = lambda: mock_user_service
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture(scope="session")
def test_engine():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)

    yield engine

    engine.dispose()


@pytest.fixture
def db_session(test_engine) -> Generator[Session, Any, None]:
    connection = test_engine.connect()
    transaction = connection.begin()

    session = Session(bind=connection)

    yield session

    if session.is_active:
        session.close()

    if transaction.is_active:
        transaction.rollback()

    connection.close()


@pytest.fixture(autouse=True)
def override_get_conn(db_session):
    def _get_conn_override():
        yield db_session

    app.dependency_overrides[get_conn] = _get_conn_override
    yield
    app.dependency_overrides.clear()
