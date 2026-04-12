import pytest
from unittest.mock import MagicMock, patch
from sqlmodel import Session

from src.history.adapters.GetOrdersAdapter import GetOrdersAdapter
from src.db.models import Order, OrdCliDet, Anaart


# ─── Fixtures ─────────────────────────────────────────────────────────────────

@pytest.fixture
def mock_repo():
    return MagicMock()


@pytest.fixture
def adapter(mock_repo):
    with patch(
        "src.history.adapters.GetOrdersAdapter.HistoryRepository",
        return_value=mock_repo,
    ):
        return GetOrdersAdapter(MagicMock(spec=Session)), mock_repo


# ─── get_orders_by_username ───────────────────────────────────────────────────

class TestGetOrdersByUsername:
#TU-B_237
    def test_delega_al_repository(self, adapter):
        sut, repo = adapter
        ordine = MagicMock(spec=Order)
        repo.get_orders_by_username.return_value = ([ordine], 1)

        result = sut.get_orders_by_username("mario", 1, 10, None, None)

        repo.get_orders_by_username.assert_called_once_with("mario", 1, 10, None, None)
        assert result == ([ordine], 1)

#TU-B_238
    def test_propaga_paginazione(self, adapter):
        sut, repo = adapter
        repo.get_orders_by_username.return_value = ([], 0)

        sut.get_orders_by_username("mario", 3, 5)

        repo.get_orders_by_username.assert_called_once_with("mario", 3, 5, None, None)


# ─── get_all_orders ───────────────────────────────────────────────────────────

class TestGetAllOrdini:
#TU-B_239
    def test_delega_al_repository(self, adapter):
        sut, repo = adapter
        ordine = MagicMock(spec=Order)
        repo.get_all_orders.return_value = ([ordine], 1)

        result = sut.get_all_orders(1, 10, None, None)

        repo.get_all_orders.assert_called_once_with(1, 10, None, None)
        assert result == ([ordine], 1)
#TU-B_240
    def test_propaga_paginazione(self, adapter):
        sut, repo = adapter
        repo.get_all_orders.return_value = ([], 0)

        sut.get_all_orders(2, 20, None, None)

        repo.get_all_orders.assert_called_once_with(2, 20, None, None)


# ─── get_products_by_order_ids ───────────────────────────────────────────────

class TestGetProdottiByOrdineIds:
#TU-B_241
    def test_delega_al_repository(self, adapter):
        sut, repo = adapter
        coppia = (MagicMock(spec=OrdCliDet), MagicMock(spec=Anaart))
        repo.get_products_by_order_ids.return_value = [coppia]

        result = sut.get_products_by_order_ids([1, 2, 3])

        repo.get_products_by_order_ids.assert_called_once_with([1, 2, 3])
        assert result == [coppia]

#TU-B_242
    def test_lista_vuota(self, adapter):
        sut, repo = adapter
        repo.get_products_by_order_ids.return_value = []

        result = sut.get_products_by_order_ids([])

        repo.get_products_by_order_ids.assert_called_once_with([])
        assert result == []


# ─── duplicate_order ───────────────────────────────────────────────────────────

class TestduplicateOrder:
#TU-B_243
    def test_delega_al_repository(self, adapter):
        sut, repo = adapter
        nuovo = MagicMock(spec=Order)
        repo.duplicate_order.return_value = nuovo

        result = sut.duplicate_order("42", "mario")

        repo.duplicate_order.assert_called_once_with("42", "mario")
        assert result == nuovo

#TU-B_244
    def test_propaga_value_error(self, adapter):
        sut, repo = adapter
        repo.duplicate_order.side_effect = ValueError("non trovato")

        with pytest.raises(ValueError):
            sut.duplicate_order("99", "mario")
