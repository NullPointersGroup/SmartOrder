import pytest
from typing import Any, Generator
from sqlmodel import SQLModel, Session, create_engine, StaticPool
from src.db.models import Utente, Conversazione
from src.db.dbConnection import get_conn
from src.db.models import Utente, Conversazione
from src.main import app

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
def db(engine):
    with Session(engine) as session:
        yield session
        session.rollback()

@pytest.fixture
def seeded_db(db):
    utente = Utente(username="mario", email="mario@test.it", password="secret")
    conv = Conversazione(id_conv=1, username="mario")
    db.add(utente)
    db.add(conv)
    db.commit()
    yield db

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
    app.dependency_overrides.pop(get_conn, None)

