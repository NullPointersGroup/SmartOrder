from datetime import datetime
from unittest.mock import MagicMock, patch

import pytest

from src.storico.adapters.ConcreteGetOrdiniAdapter import ConcreteGetOrdiniAdapter
from src.storico.StoricoModels import Ordine

def make_ordine(id: int, username: str) -> Ordine:
    return Ordine(
        id=id,
        username=username,
        stato="completato",
        totale=75.0,
        created_at=datetime(2024, 3, 15, 8, 0, 0),
    )


@pytest.fixture
def db():
    return MagicMock()


@pytest.fixture
def adapter(db):
    with patch(
        "src.storico.adapters.ConcreteGetOrdiniAdapter.StoricoRepository"
    ) as MockRepo:
        instance = MockRepo.return_value
        adp = ConcreteGetOrdiniAdapter(db)
        adp.repository = instance
        yield adp, instance

class TestConcreteAdapterGetOrdiniByUsername:

    def test_returns_list(self, adapter):
        adp, repo = adapter
        repo.get_ordini_by_username.return_value = [make_ordine(1, "mario")]
        result = adp.get_ordini_by_username("mario")
        assert isinstance(result, list)

    def test_delegates_to_repository(self, adapter):
        adp, repo = adapter
        repo.get_ordini_by_username.return_value = []
        adp.get_ordini_by_username("mario")
        repo.get_ordini_by_username.assert_called_once_with("mario")

    def test_returns_repository_result(self, adapter):
        adp, repo = adapter
        expected = [make_ordine(1, "mario"), make_ordine(2, "mario")]
        repo.get_ordini_by_username.return_value = expected
        result = adp.get_ordini_by_username("mario")
        assert result == expected

    def test_returns_empty_list_when_repository_returns_empty(self, adapter):
        adp, repo = adapter
        repo.get_ordini_by_username.return_value = []
        result = adp.get_ordini_by_username("sconosciuto")
        assert result == []

    def test_passes_correct_username(self, adapter):
        adp, repo = adapter
        repo.get_ordini_by_username.return_value = []
        adp.get_ordini_by_username("luigi")
        repo.get_ordini_by_username.assert_called_once_with("luigi")


class TestConcreteAdapterGetAllOrdini:
    # TU-S_44
    def test_returns_list(self, adapter):
        adp, repo = adapter
        repo.get_all_ordini.return_value = []
        result = adp.get_all_ordini()
        assert isinstance(result, list)

    def test_delegates_to_repository(self, adapter):
        adp, repo = adapter
        repo.get_all_ordini.return_value = []
        adp.get_all_ordini()
        repo.get_all_ordini.assert_called_once()

    def test_returns_repository_result(self, adapter):
        adp, repo = adapter
        expected = [make_ordine(1, "mario"), make_ordine(2, "luigi")]
        repo.get_all_ordini.return_value = expected
        result = adp.get_all_ordini()
        assert result == expected

    def test_returns_empty_list_when_repository_returns_empty(self, adapter):
        adp, repo = adapter
        repo.get_all_ordini.return_value = []
        result = adp.get_all_ordini()
        assert result == []

    def test_does_not_call_get_by_username(self, adapter):
        adp, repo = adapter
        repo.get_all_ordini.return_value = []
        adp.get_all_ordini()
        repo.get_ordini_by_username.assert_not_called()
