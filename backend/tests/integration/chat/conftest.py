from typing import Any, Generator
import pytest
from sqlmodel import create_engine, SQLModel, Session, text
from fastapi.testclient import TestClient
from src.db.models import Utente
from src.main import app
from src.db.dbConnection import get_conn
from src.chat.adapters.ChatRepository import ChatRepository
from src.chat.adapters.ChatRepository import Conversazione


@pytest.fixture(scope="session")
def chat_engine():
    engine = create_engine("sqlite:///:memory:")
    SQLModel.metadata.create_all(engine)  # crea tabelle in memoria
    return engine


@pytest.fixture
def db_session(chat_engine):
    with Session(chat_engine) as session:
        yield session


@pytest.fixture
def chat_repository(seeded_db):
    return ChatRepository(db=seeded_db)


@pytest.fixture
def seeded_db(db_session: Session) -> Generator[Session, Any, None]:
    utente = Utente(
        username="mario", email="mario@test.it", password="secret"
    )  # NOSONAR
    db_session.add(utente)
    db_session.commit()
    conv = Conversazione(username="mario", titolo="test")
    db_session.add(conv)
    db_session.commit()
    yield db_session
    db_session.execute(
        text(
            "TRUNCATE TABLE messaggi, conversazioni, utentiweb RESTART IDENTITY CASCADE"
        )
    )
    db_session.commit()


@pytest.fixture
def client(seeded_db: Session):
    app.dependency_overrides[get_conn] = lambda: seeded_db
    yield TestClient(app)
    app.dependency_overrides.pop(get_conn, None)
