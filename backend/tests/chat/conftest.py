import os

os.environ["DATABASE_URL"] = "sqlite://"
from unittest.mock import MagicMock

import pytest
from sqlmodel import Session
from src.db.models import Conversazione, Messaggio, Utente, MittenteEnum


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
