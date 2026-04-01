import pytest
from unittest.mock import MagicMock, patch
from sqlmodel import Session

from src.storico.adapters.ConcreteGetOrdiniAdapter import ConcreteGetOrdiniAdapter
from src.db.models import Ordine, OrdCliDet, Anaart


# ─── Fixtures ─────────────────────────────────────────────────────────────────

@pytest.fixture
def mock_repo():
    return MagicMock()


@pytest.fixture
def adapter(mock_repo):
    with patch(
        "src.storico.adapters.ConcreteGetOrdiniAdapter.StoricoRepository",
        return_value=mock_repo,
    ):
        return ConcreteGetOrdiniAdapter(MagicMock(spec=Session)), mock_repo


# ─── get_ordini_by_username ───────────────────────────────────────────────────

class TestGetOrdiniByUsername:

    def test_delega_al_repository(self, adapter):
        sut, repo = adapter
        ordine = MagicMock(spec=Ordine)
        repo.get_ordini_by_username.return_value = ([ordine], 1)

        result = sut.get_ordini_by_username("mario", 1, 10)

        repo.get_ordini_by_username.assert_called_once_with("mario", 1, 10)
        assert result == ([ordine], 1)

    def test_propaga_paginazione(self, adapter):
        sut, repo = adapter
        repo.get_ordini_by_username.return_value = ([], 0)

        sut.get_ordini_by_username("mario", 3, 5)

        repo.get_ordini_by_username.assert_called_once_with("mario", 3, 5)


# ─── get_all_ordini ───────────────────────────────────────────────────────────

class TestGetAllOrdini:

    def test_delega_al_repository(self, adapter):
        sut, repo = adapter
        ordine = MagicMock(spec=Ordine)
        repo.get_all_ordini.return_value = ([ordine], 1)

        result = sut.get_all_ordini(1, 10)

        repo.get_all_ordini.assert_called_once_with(1, 10)
        assert result == ([ordine], 1)

    def test_propaga_paginazione(self, adapter):
        sut, repo = adapter
        repo.get_all_ordini.return_value = ([], 0)

        sut.get_all_ordini(2, 20)

        repo.get_all_ordini.assert_called_once_with(2, 20)


# ─── get_prodotti_by_ordine_ids ───────────────────────────────────────────────

class TestGetProdottiByOrdineIds:

    def test_delega_al_repository(self, adapter):
        sut, repo = adapter
        coppia = (MagicMock(spec=OrdCliDet), MagicMock(spec=Anaart))
        repo.get_prodotti_by_ordine_ids.return_value = [coppia]

        result = sut.get_prodotti_by_ordine_ids([1, 2, 3])

        repo.get_prodotti_by_ordine_ids.assert_called_once_with([1, 2, 3])
        assert result == [coppia]

    def test_lista_vuota(self, adapter):
        sut, repo = adapter
        repo.get_prodotti_by_ordine_ids.return_value = []

        result = sut.get_prodotti_by_ordine_ids([])

        repo.get_prodotti_by_ordine_ids.assert_called_once_with([])
        assert result == []


# ─── duplica_ordine ───────────────────────────────────────────────────────────

class TestDuplicaOrdine:

    def test_delega_al_repository(self, adapter):
        sut, repo = adapter
        nuovo = MagicMock(spec=Ordine)
        repo.duplica_ordine.return_value = nuovo

        result = sut.duplica_ordine("42", "mario")

        repo.duplica_ordine.assert_called_once_with("42", "mario")
        assert result == nuovo

    def test_propaga_value_error(self, adapter):
        sut, repo = adapter
        repo.duplica_ordine.side_effect = ValueError("non trovato")

        with pytest.raises(ValueError):
            sut.duplica_ordine("99", "mario")