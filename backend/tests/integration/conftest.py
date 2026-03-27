# tests/integration/conftest.py
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(override=False)

from typing import Any, Generator
import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, create_engine
from sqlalchemy import text
from src.db.models import Utente, Conversazione
from src.db.dbConnection import get_conn
from src.main import app

TEST_DATABASE_URL = (
    "postgresql://postgres:postgres@localhost:5433/smartorder_test"  # NOSONAR
)


@pytest.fixture(scope="session")
def test_engine():
    engine = create_engine(TEST_DATABASE_URL)
    schema_path = Path(__file__).resolve().parents[3] / "DB/schema.sql"
    with open(schema_path) as f:
        schema = f.read()
    with engine.connect() as conn:
        conn.execute(text(schema))
        conn.commit()
    yield engine
    # pulizia finale
    with engine.connect() as conn:
        conn.execute(text("DROP SCHEMA public CASCADE; CREATE SCHEMA public;"))
        conn.commit()
    engine.dispose()


@pytest.fixture
def db_session(test_engine) -> Generator[Session, Any, None]:
    with Session(test_engine) as session:
        yield session
        session.rollback()


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

