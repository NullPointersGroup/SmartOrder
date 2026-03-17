import os

os.environ["DATABASE_URL"] = "sqlite://"

import pytest
from src.db.models import Utente


@pytest.fixture
def mock_utente() -> Utente:
    return Utente(
        username="testuser",
        password="testpassword",
        email="test@test",
        descrizione="test",
    )
