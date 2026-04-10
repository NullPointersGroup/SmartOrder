import pytest

from src.storico.ports.StoricoAdapterPort import StoricoAdapterPort
from src.storico.adapters.GetOrdiniAdapter import GetOrdiniAdapter

# TU-B_235
def test_adapter_implementa_port():
    assert issubclass(GetOrdiniAdapter, StoricoAdapterPort)

# TU-B_236
def test_adapter_non_e_astratto():
    # se mancasse un metodo astratto, l'istanziazione lancerebbe TypeError
    from unittest.mock import MagicMock
    from sqlmodel import Session
    from unittest.mock import patch

    with patch("src.storico.adapters.GetOrdiniAdapter.StoricoRepository"):
        try:
            GetOrdiniAdapter(MagicMock(spec=Session))
        except TypeError as e:
            pytest.fail(f"Adapter non implementa tutti i metodi del port: {e}")