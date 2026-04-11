import pytest

from src.history.ports.HistoryAdapterPort import HistoryAdapterPort
from src.history.adapters.GetOrdersAdapter import GetOrdersAdapter

# TU-B_235
def test_adapter_implementa_port():
    assert issubclass(GetOrdersAdapter, HistoryAdapterPort)

# TU-B_236
def test_adapter_non_e_astratto():
    # se mancasse un metodo astratto, l'istanziazione lancerebbe TypeError
    from unittest.mock import MagicMock
    from sqlmodel import Session
    from unittest.mock import patch

    with patch("src.history.adapters.GetOrdersAdapter.HistoryRepository"):
        try:
            GetOrdersAdapter(MagicMock(spec=Session))
        except TypeError as e:
            pytest.fail(f"Adapter non implementa tutti i metodi del port: {e}")
