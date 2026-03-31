from datetime import datetime
from unittest.mock import MagicMock, patch

import pytest

from src.storico.adapters.StoricoRepository import StoricoRepository
from src.storico.StoricoModels import Ordine


def make_ordine(id: int, username: str, created_at: datetime = None) -> Ordine:
    return Ordine(
        id=id,
        username=username,
        stato="completato",
        totale=50.0,
        created_at=created_at or datetime(2024, 6, 1, 10, 0, 0),
    )


@pytest.fixture
def db():
    return MagicMock()


@pytest.fixture
def repository(db):
    return StoricoRepository(db)


class TestGetOrdiniByUsername:
    def test_returns_list(self, repository, db):
        db.exec.return_value.all.return_value = [make_ordine(1, "mario")]
        result = repository.get_ordini_by_username("mario")
        assert isinstance(result, list)

    def test_returns_correct_ordini(self, repository, db):
        expected = [make_ordine(1, "mario"), make_ordine(2, "mario")]
        db.exec.return_value.all.return_value = expected
        result = repository.get_ordini_by_username("mario")
        assert result == expected

    def test_returns_empty_list_when_no_ordini(self, repository, db):
        db.exec.return_value.all.return_value = []
        result = repository.get_ordini_by_username("sconosciuto")
        assert result == []

    def test_calls_db_exec(self, repository, db):
        db.exec.return_value.all.return_value = []
        repository.get_ordini_by_username("mario")
        db.exec.assert_called_once()

    def test_calls_all_on_result(self, repository, db):
        db.exec.return_value.all.return_value = []
        repository.get_ordini_by_username("mario")
        db.exec.return_value.all.assert_called_once()

    def test_does_not_return_other_users_ordini(self, repository, db):
        mario_ordini = [make_ordine(1, "mario")]
        db.exec.return_value.all.return_value = mario_ordini
        result = repository.get_ordini_by_username("mario")
        assert all(o.username == "mario" for o in result)


class TestGetAllOrdini:
    # TU-S_33
    def test_returns_list(self, repository, db):
        db.exec.return_value.all.return_value = []
        result = repository.get_all_ordini()
        assert isinstance(result, list)


    def test_returns_all_ordini(self, repository, db):
        expected = [
            make_ordine(1, "mario"),
            make_ordine(2, "luigi"),
            make_ordine(3, "peach"),
        ]
        db.exec.return_value.all.return_value = expected
        result = repository.get_all_ordini()
        assert result == expected

    def test_returns_empty_list_when_no_ordini(self, repository, db):
        db.exec.return_value.all.return_value = []
        result = repository.get_all_ordini()
        assert result == []

    def test_calls_db_exec(self, repository, db):
        db.exec.return_value.all.return_value = []
        repository.get_all_ordini()
        db.exec.assert_called_once()

    def test_calls_all_on_result(self, repository, db):
        db.exec.return_value.all.return_value = []
        repository.get_all_ordini()
        db.exec.return_value.all.assert_called_once()

    def test_returns_ordini_from_multiple_users(self, repository, db):
        mixed = [make_ordine(1, "mario"), make_ordine(2, "luigi")]
        db.exec.return_value.all.return_value = mixed
        result = repository.get_all_ordini()
        usernames = {o.username for o in result}
        assert "mario" in usernames and "luigi" in usernames
