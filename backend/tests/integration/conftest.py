import os
from pathlib import Path
from dotenv import load_dotenv
load_dotenv(override=False)

from typing import Any, Generator
import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, create_engine
from sqlalchemy import text
from pytest_postgresql import factories
from pytest_postgresql.janitor import DatabaseJanitor
from src.db.models import Utente, Conversazione
from src.db.dbConnection import get_conn
from src.main import app

postgresql_proc = factories.postgresql_proc()
postgresql = factories.postgresql("postgresql_proc")

@pytest.fixture(scope="session")
def test_engine(postgresql_proc):
    janitor = DatabaseJanitor(
        user=postgresql_proc.user,
        host=postgresql_proc.host,
        port=postgresql_proc.port,
        dbname="smartorder_test",
        version=postgresql_proc.version,
        password=None,
    )
    janitor.init()

    db_url = f"postgresql://{postgresql_proc.user}@{postgresql_proc.host}:{postgresql_proc.port}/smartorder_test" #NOSONAR

    engine = create_engine(db_url)

    schema_path = (Path(__file__).resolve().parents[3] / "DB/schema.sql")

    with open(schema_path) as f:
        schema = f.read()
    with engine.connect() as conn:
        conn.execute(text(schema))
        conn.commit()

    yield engine

    engine.dispose()
    janitor.drop()

@pytest.fixture
def db_session(test_engine) -> Generator[Session, Any, None]:
    with Session(test_engine) as session:
        yield session
        session.rollback()

@pytest.fixture
def seeded_db(db_session: Session) -> Generator[Session, Any, None]:
    db_session.rollback()

    utente = Utente(username="mario", email="mario@test.it", password="secret") #NOSONAR
    db_session.add(utente)
    db_session.commit()

    conv = Conversazione(username="mario", titolo="test")
    db_session.add(conv)
    db_session.commit()

    yield db_session

    db_session.rollback()
    db_session.execute(text(
        "TRUNCATE TABLE messaggi, conversazioni, utentiweb RESTART IDENTITY CASCADE"
    ))
    db_session.commit()

@pytest.fixture
def client(seeded_db: Session):
    app.dependency_overrides[get_conn] = lambda: seeded_db
    yield TestClient(app)
    app.dependency_overrides.pop(get_conn, None)