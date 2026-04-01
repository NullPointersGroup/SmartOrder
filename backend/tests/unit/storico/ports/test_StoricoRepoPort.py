import pytest

from src.storico.ports.StoricoRepoPort import StoricoRepoPort
from src.storico.adapters.ConcreteGetOrdiniAdapter import ConcreteGetOrdiniAdapter

def test_adapter_implementa_port():
    assert issubclass(ConcreteGetOrdiniAdapter, StoricoRepoPort)

def test_adapter_non_e_astratto():
    # se mancasse un metodo astratto, l'istanziazione lancerebbe TypeError
    from unittest.mock import MagicMock
    from sqlmodel import Session
    from unittest.mock import patch

    with patch("src.storico.adapters.ConcreteGetOrdiniAdapter.StoricoRepository"):
        try:
            ConcreteGetOrdiniAdapter(MagicMock(spec=Session))
        except TypeError as e:
            pytest.fail(f"Adapter non implementa tutti i metodi del port: {e}")