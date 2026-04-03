import os

os.environ["DATABASE_URL"] = "sqlite://"
from unittest.mock import MagicMock

import pytest
from sqlmodel import Session
from src.db.models import Conversazioni, Utentiweb, Messaggi
from src.chat.adapters.ChatRepoAdapter import ChatRepoAdapter
from src.chat.adapters.ChatRepository import ChatRepository
from src.chat.ChatService import ChatService
from src.enums import SenderEnum


@pytest.fixture
def mock_repo():
    return MagicMock()


@pytest.fixture
def mock_llm():
    return MagicMock()


@pytest.fixture
def chat_service(mock_repo, mock_llm):
    return ChatService(repo=mock_repo, llm=mock_llm)


@pytest.fixture
def mock_conversazione(mock_utente: Utentiweb) -> Conversazioni:
    return Conversazioni(
        id_conv=1,
        username=mock_utente.username or "",
        titolo="Example"
    )


@pytest.fixture
def adapter(mock_repo):
    return ChatRepoAdapter(repo=mock_repo)


@pytest.fixture
def mock_db():
    return MagicMock()


@pytest.fixture
def chat_repository(mock_db):
    return ChatRepository(db=mock_db)


@pytest.fixture
def mock_messaggi(mock_conversazione: Conversazioni) -> list[Messaggi]:
    return [
        Messaggi(
            id_conv=mock_conversazione.id_conv,
            id_messaggio=1,
            mittente=SenderEnum.Utente,
            contenuto="Primo messaggio da Utentiweb",
        ),
        Messaggi(
            id_conv=mock_conversazione.id_conv,
            id_messaggio=2,
            mittente=SenderEnum.Chatbot,
            contenuto="Secondo messaggio da Chatbot",
        ),
        Messaggi(
            id_conv=mock_conversazione.id_conv,
            id_messaggio=3,
            mittente=SenderEnum.Utente,
            contenuto="Terzo messaggio da Utentiweb",
        ),
    ]


@pytest.fixture
def mock_session_with_messages(
    mock_utente: Utentiweb,
    mock_conversazione: Conversazioni,
    mock_messaggi: list[Messaggi],
) -> MagicMock:
    session = MagicMock()
    session.exec.return_value.all.return_value = mock_messaggi
    session.exec.return_value.first.return_value = mock_conversazione
    return session


@pytest.fixture
def db_session_with_messages(
    db_session: Session,
    mock_utente: Utentiweb,
    mock_conversazione: Conversazioni,
    mock_messaggi: list[Messaggi],
) -> Session:
    db_session.add(mock_utente)
    db_session.add(mock_conversazione)
    db_session.flush()
    for msg in mock_messaggi:
        db_session.add(msg)
    db_session.flush()
    return db_session
