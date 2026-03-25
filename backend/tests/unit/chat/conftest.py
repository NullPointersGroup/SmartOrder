import os

os.environ["DATABASE_URL"] = "sqlite://"
from unittest.mock import MagicMock

import pytest
from sqlmodel import Session
from src.db.models import Conversazione, Utente
from src.chat.adapters.ChatMessageRepository import ChatMessageRepository
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
def mock_conversazione(mock_utente: Utente) -> Conversazione:
    return Conversazione(id_conv=1, username=mock_utente.username)


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
def mock_messaggi(mock_conversazione: Conversazione) -> list[ChatMessageRepository]:
    return [
        ChatMessageRepository(
            id_conv=mock_conversazione.id_conv,
            id_messaggio=1,
            mittente=SenderEnum.Utente,
            contenuto="Primo messaggio da Utente",
        ),
        ChatMessageRepository(
            id_conv=mock_conversazione.id_conv,
            id_messaggio=2,
            mittente=SenderEnum.Chatbot,
            contenuto="Secondo messaggio da Chatbot",
        ),
        ChatMessageRepository(
            id_conv=mock_conversazione.id_conv,
            id_messaggio=3,
            mittente=SenderEnum.Utente,
            contenuto="Terzo messaggio da Utente",
        ),
    ]


@pytest.fixture
def mock_session_with_messages(
    mock_utente: Utente,
    mock_conversazione: Conversazione,
    mock_messaggi: list[ChatMessageRepository],
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
    mock_messaggi: list[ChatMessageRepository],
) -> Session:
    db_session.add(mock_utente)
    db_session.add(mock_conversazione)
    db_session.flush()
    for msg in mock_messaggi:
        db_session.add(msg)
    db_session.flush()
    return db_session
