from dotenv import load_dotenv
load_dotenv()
from typing import Any, Generator
from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session
from src.db.dbConnection import get_conn
from src.db.models import Utente, Conversazione
from src.main import app

# @pytest.fixture
# def client(db):
#     app.dependency_overrides[get_conn] = lambda:db
#     utente = Utente(username="mario", email="mario@test.it", password="secret")
#     conv = Conversazione(id_conv=1, username="mario")
#     db.add(utente)
#     db.add(conv)
#     db.commit()
#     yield TestClient(app)
#     app.dependency_overrides.clear()

