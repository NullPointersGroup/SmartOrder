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
    #TU-B_338
    def test_yields_session(self, mock_session):
        with patch("src.db.dbConnection.Session", return_value=mock_session), patch(
            "src.db.dbConnection.get_engine", return_value=object()
        ):
            from src.db.dbConnection import get_conn
            gen = get_conn()
            session = next(gen)
            assert session is mock_session

    #TU-B_339
    def test_closes_session_after_use(self, mock_session):
        with patch("src.db.dbConnection.Session", return_value=mock_session), patch(
            "src.db.dbConnection.get_engine", return_value=object()
        ):
            from src.db.dbConnection import get_conn
            gen = get_conn()
            next(gen)
            with pytest.raises(StopIteration):
                next(gen)
            mock_session.__exit__.assert_called_once()


# ---------------------------------------------------------------------------
# get_engine
# ---------------------------------------------------------------------------

class TestGetEngine:
    #TU-B_340
    def test_raises_runtime_error_if_missing(self):
        import src.db.dbConnection as db_module
        importlib.reload(db_module)
        db_module.get_engine.cache_clear()

        with patch.dict(os.environ, {}, clear=True):
            with pytest.raises(RuntimeError, match="DATABASE_URL non impostata"):
                db_module.get_engine()

    #TU-B_341
    def test_returns_engine_if_present(self):
        import src.db.dbConnection as db_module
        importlib.reload(db_module)
        db_module.get_engine.cache_clear()

        with patch.dict(os.environ, {"DATABASE_URL": "sqlite://"}), patch(
            "src.db.dbConnection.create_engine", return_value="engine"
        ) as create_engine_mock:
            engine = db_module.get_engine()

        assert engine == "engine"
        create_engine_mock.assert_called_once_with("sqlite://", echo=True)
