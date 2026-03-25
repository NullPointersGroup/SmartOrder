from unittest.mock import MagicMock, patch
import pytest
from sqlalchemy.exc import IntegrityError

from src.db.queryExecutor import Query, Mutation, QueryExecutor


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def db():
    return MagicMock()

@pytest.fixture
def executor(db):
    return QueryExecutor(db)


def make_query(result_all=None, result_first=None):
    """Helper: crea un Query mock con execute() già configurato."""
    q = MagicMock(spec=Query)
    stmt = MagicMock()
    q.execute.return_value = stmt
    return q, stmt


def make_mutation():
    """Helper: crea un Mutation mock con execute() già configurato."""
    m = MagicMock(spec=Mutation)
    stmt = MagicMock()
    m.execute.return_value = stmt
    return m, stmt


# ---------------------------------------------------------------------------
# Query.execute
# ---------------------------------------------------------------------------

class TestExecute:
    def test_returns_all_results(self, executor, db):
        q, _ = make_query()
        db.exec.return_value.all.return_value = ["a", "b", "c"]

        result = executor.execute(q)

        assert result == ["a", "b", "c"]

    def test_calls_exec_with_stmt(self, executor, db):
        q, stmt = make_query()
        db.exec.return_value.all.return_value = []

        executor.execute(q)

        db.exec.assert_called_once_with(stmt)

    def test_returns_empty_sequence(self, executor, db):
        q, _ = make_query()
        db.exec.return_value.all.return_value = []

        result = executor.execute(q)

        assert result == []


# ---------------------------------------------------------------------------
# Query.execute_one
# ---------------------------------------------------------------------------

class TestExecuteOne:
    def test_returns_single_result(self, executor, db):
        q, _ = make_query()
        db.exec.return_value.first.return_value = "item"

        result = executor.execute_one(q)

        assert result == "item"

    def test_returns_none_when_not_found(self, executor, db):
        q, _ = make_query()
        db.exec.return_value.first.return_value = None

        result = executor.execute_one(q)

        assert result is None

    def test_calls_exec_with_stmt(self, executor, db):
        q, stmt = make_query()
        db.exec.return_value.first.return_value = None

        executor.execute_one(q)

        db.exec.assert_called_once_with(stmt)


# ---------------------------------------------------------------------------
# Mutation.mutate
# ---------------------------------------------------------------------------

class TestMutate:
    def test_returns_true_on_success(self, executor, db):
        m, _ = make_mutation()

        result = executor.mutate(m)

        assert result is True

    def test_commits_on_success(self, executor, db):
        m, _ = make_mutation()

        executor.mutate(m)

        db.commit.assert_called_once()

    def test_returns_false_on_integrity_error(self, executor, db):
        m, _ = make_mutation()
        db.exec.side_effect = IntegrityError(None, None, Exception())

        result = executor.mutate(m)

        assert result is False

    def test_rollback_on_integrity_error(self, executor, db):
        m, _ = make_mutation()
        db.exec.side_effect = IntegrityError(None, None, Exception())

        executor.mutate(m)

        db.rollback.assert_called_once()
        db.commit.assert_not_called()

    def test_returns_false_on_generic_exception(self, executor, db):
        m, _ = make_mutation()
        db.exec.side_effect = Exception("errore generico")

        result = executor.mutate(m)

        assert result is False

    def test_rollback_on_generic_exception(self, executor, db):
        m, _ = make_mutation()
        db.exec.side_effect = Exception("errore generico")

        executor.mutate(m)

        db.rollback.assert_called_once()
        db.commit.assert_not_called()

    def test_no_commit_on_failure(self, executor, db):
        m, _ = make_mutation()
        db.exec.side_effect = IntegrityError(None, None, Exception())

        executor.mutate(m)

        db.commit.assert_not_called()
        
    def test_returns_false_on_integrity_error_raw(self, executor, db):
        db.exec.side_effect = IntegrityError(None, None, Exception())
        stmt = MagicMock()
        result = executor.mutate_raw(stmt)
        assert result is False

    def test_rollback_on_integrity_error_raw(self, executor, db):
        db.exec.side_effect = IntegrityError(None, None, Exception())
        stmt = MagicMock()
        executor.mutate_raw(stmt)
        db.rollback.assert_called_once()
        db.commit.assert_not_called()
        
class TestQueryBase:
    def test_execute_raises_not_implemented(self):
        q = Query()
        with pytest.raises(NotImplementedError):
            q.execute()


class TestMutationBase:
    def test_execute_raises_not_implemented(self):
        m = Mutation()
        with pytest.raises(NotImplementedError):
            m.execute()