import importlib
import os
from unittest.mock import MagicMock, patch

import pytest
from sqlmodel import Session


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def mock_session():
    session = MagicMock(spec=Session)
    session.__enter__ = MagicMock(return_value=session)
    session.__exit__ = MagicMock(return_value=False)
    return session


# ---------------------------------------------------------------------------
# get_conn
# ---------------------------------------------------------------------------

class TestGetConn:
    def test_yields_session(self, mock_session):
        with patch("src.db.dbConnection.Session", return_value=mock_session):
            from src.db.dbConnection import get_conn
            gen = get_conn()
            session = next(gen)
            assert session is mock_session

    def test_closes_session_after_use(self, mock_session):
        with patch("src.db.dbConnection.Session", return_value=mock_session):
            from src.db.dbConnection import get_conn
            gen = get_conn()
            next(gen)
            with pytest.raises(StopIteration):
                next(gen)
            mock_session.__exit__.assert_called_once()


# ---------------------------------------------------------------------------
# DATABASE_URL mancante (il modulo viene ricaricato per simulare l'import)
# ---------------------------------------------------------------------------

class TestDatabaseUrlMissing:
    def test_raises_runtime_error_if_missing(self):
        with patch.dict(os.environ, {}, clear=True):
            os.environ.pop("DATABASE_URL", None)
            import src.db.dbConnection as db_module
            with pytest.raises(RuntimeError, match="DATABASE_URL non impostata"):
                importlib.reload(db_module)

    def test_no_error_if_present(self):
        with patch.dict(os.environ, {"DATABASE_URL": "sqlite://"}):
            with patch("src.db.dbConnection.create_engine"):
                import src.db.dbConnection as db_module
                importlib.reload(db_module)