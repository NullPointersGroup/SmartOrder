from typing import Any, Generator
import sys
import types
import pytest
from sqlmodel import create_engine, Session, text
from fastapi.testclient import TestClient
from src.db.models import Utentiweb, Conversazioni

if "slowapi" not in sys.modules:
    slowapi_module = types.ModuleType("slowapi")
    slowapi_errors = types.ModuleType("slowapi.errors")
    slowapi_util = types.ModuleType("slowapi.util")

    class DummyLimiter:
        def __init__(self, *args, **kwargs):
            pass

        def limit(self, *args, **kwargs):
            def decorator(func):
                return func

            return decorator

    class RateLimitExceeded(Exception):
        pass

    slowapi_module.Limiter = DummyLimiter
    slowapi_module._rate_limit_exceeded_handler = lambda *args, **kwargs: None
    slowapi_errors.RateLimitExceeded = RateLimitExceeded
    slowapi_util.get_remote_address = lambda request: "test"

    sys.modules["slowapi"] = slowapi_module
    sys.modules["slowapi.errors"] = slowapi_errors
    sys.modules["slowapi.util"] = slowapi_util

from src.main import app
from src.db.dbConnection import get_conn
from src.chat.adapters.ChatRepository import ChatRepository


@pytest.fixture
def chat_repository(seeded_db):
    return ChatRepository(db=seeded_db)


@pytest.fixture
def seeded_db(db_session: Session) -> Generator[Session, Any, None]:
    utente = Utentiweb(
        username="mario", email="mario@test.it", password="secret" #NOSONAR
    )
    db_session.add(utente)
    db_session.commit()
    conv = Conversazioni(username="mario", titolo="test")
    db_session.add(conv)
    db_session.commit()
    yield db_session
    db_session.connection().execute(
        text("TRUNCATE TABLE messaggi, conversazioni, utentiweb RESTART IDENTITY CASCADE")
    )
    db_session.commit()


@pytest.fixture
def client(seeded_db: Session):
    app.dependency_overrides[get_conn] = lambda: seeded_db
    yield TestClient(app)
    app.dependency_overrides.pop(get_conn, None)
