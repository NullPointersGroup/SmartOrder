import os

os.environ["DATABASE_URL"] = "sqlite://"
from typing import Any, Generator
from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel
from src.auth.schemas import User, UserRegistration
from src.auth.UserService import UserService
from src.db.dbConnection import get_conn
from src.db.models import Conversazione, Messaggio, Utente, MittenteEnum
from src.main import app


@pytest.fixture
def mock_user() -> User:
    return User(username="testuser", password="testpassword")


@pytest.fixture
def mock_user_registration() -> UserRegistration:
    return UserRegistration(
        username="testuser",
        password="testpassword",
        email="test@test",
        confirmPwd="testpassword",
    )


@pytest.fixture
def mock_utente() -> Utente:
    return Utente(
        username="testuser",
        password="testpassword",
        email="test@test",
        descrizione="test",
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


@pytest.fixture
def mock_conversazione(mock_utente: Utente) -> Conversazione:
    return Conversazione(id_conv=1, username=mock_utente.username)


@pytest.fixture
def mock_messaggi(mock_conversazione: Conversazione) -> list[Messaggio]:
    return [
        Messaggio(
            id_conv=mock_conversazione.id_conv,
            id_messaggio=1,
            mittente=MittenteEnum.utente,
            contenuto="Primo messaggio da Utente",
        ),
        Messaggio(
            id_conv=mock_conversazione.id_conv,
            id_messaggio=2,
            mittente=MittenteEnum.chatbot,
            contenuto="Secondo messaggio da Chatbot",
        ),
        Messaggio(
            id_conv=mock_conversazione.id_conv,
            id_messaggio=3,
            mittente=MittenteEnum.utente,
            contenuto="Terzo messaggio da Utente",
        ),
    ]


@pytest.fixture
def mock_session_with_messages(
    mock_utente: Utente,
    mock_conversazione: Conversazione,
    mock_messaggi: list[Messaggio],
) -> MagicMock:
    session = MagicMock()
    session.exec.return_value.all.return_value = mock_messaggi
    session.exec.return_value.first.return_value = mock_conversazione
    return session


@pytest.fixture
def db_session_with_messages(
    db_session: Session,
    mock_utente: Utente,
    mock_conversazione: Conversazione,
    mock_messaggi: list[Messaggio],
) -> Session:
    db_session.add(mock_utente)
    db_session.add(mock_conversazione)
    db_session.flush()
    for msg in mock_messaggi:
        db_session.add(msg)
    db_session.flush()
    return db_session
