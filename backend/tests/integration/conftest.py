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

TEST_DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql://postgres:postgres@localhost:5433/smartorder_test"
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
