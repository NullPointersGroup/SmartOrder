from unittest.mock import MagicMock

from src.auth.CheckUserCmd import CheckUserCmd
from src.auth.CreateUserCmd import CreateUserCmd
from src.auth.schemas import User
from src.auth.schemas import UserRegistration
from src.db.models import Utente
from src.db.queryExecutor import QueryExecutor


def test_query_executor_calls_exec(mock_user: User, mock_session: MagicMock) -> None:
    cmd = CheckUserCmd(mock_user)
    executor = QueryExecutor(mock_session)
    executor.execute(cmd)
    mock_session.exec.assert_called_once()


def test_query_executor_returns_list(
    mock_user: User, mock_session: MagicMock, mock_utente: Utente
) -> None:
    cmd = CheckUserCmd(mock_user)
    executor = QueryExecutor(mock_session)
    result = executor.execute(cmd)
    assert result == [mock_utente]


def test_query_executor_return_empty_list(mock_user: User) -> None:
    session = MagicMock()
    session.exec.return_value.all.return_value = []
    cmd = CheckUserCmd(mock_user)
    executor = QueryExecutor(session)
    result = executor.execute(cmd)
    assert result == []


def test_query_executor_create_user(mock_session: MagicMock, mock_user_registration: UserRegistration) -> None:
    cmd = CreateUserCmd(mock_user_registration)
    executor = QueryExecutor(mock_session)
    result = executor.mutate(cmd)
    assert result is not None
