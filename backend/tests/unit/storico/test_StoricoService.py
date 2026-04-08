import pytest
from datetime import date
from unittest.mock import MagicMock

from typing import Optional
from src.storico.StoricoService import StoricoService
from src.db.models import Ordine, OrdCliDet
from src.storico.exceptions import OrdiniUsernameNotFoundException, OrdineNotFoundException, OrdiniNotFoundException


# ─── Helpers ─────────────────────────────────────────────────────────────────

def make_ordine(id_ord: int, username: str = "mario", data: date = date(2024, 1, 1)) -> Ordine:
    o = Ordine()
    o.id_ord = id_ord
    o.username = username
    o.data = data
    return o


def make_det_art(id_ord: int, cod_art: str = "ART01", qta: float = 2.0):
    det = MagicMock(spec=OrdCliDet)
    det.id_ord = id_ord
    det.cod_art = cod_art
    det.qta_ordinata = qta

    art = MagicMock()
    art.prod_des = f"Prodotto {cod_art}"

    return det, art

def make_repo(
    ordini: Optional[list] = None,
    totale: Optional[int] = None,
    prodotti: Optional[list] = None,
) -> MagicMock:
    repo = MagicMock()
    ordini = ordini or []
    totale = totale if totale is not None else len(ordini)
    prodotti = prodotti or []

    repo.get_ordini_by_username.return_value = (ordini, totale)
    repo.get_all_ordini.return_value = (ordini, totale)
    repo.get_prodotti_by_ordine_ids.return_value = prodotti
    repo.duplica_ordine.return_value = make_ordine(99)
    return repo


# ─── _build_page (via get_ordini_cliente) ────────────────────────────────────

class TestBuildPage:

    #TU-B_261
    def test_mappa_campi_ordine(self):
        ordine = make_ordine(1)
        det, art = make_det_art(1)
        repo = make_repo(ordini=[ordine], prodotti=[(det, art)])
        service = StoricoService(repo)

        result = service.get_ordini_cliente("mario", 1, 10)

        o = result.ordini[0]
        assert o.codice_ordine == "1"
        assert o.data == "2024-01-01"
        assert o.username is None

    #TU-B_262
    def test_mappa_prodotti(self):
        ordine = make_ordine(1)
        det, art = make_det_art(1, qta=3.0)
        art.prod_des = "Farina"
        repo = make_repo(ordini=[ordine], prodotti=[(det, art)])
        service = StoricoService(repo)

        result = service.get_ordini_cliente("mario", 1, 10)

        p = result.ordini[0].prodotti[0]
        assert p.nome == "Farina"
        assert p.quantita == 3

    #TU-B_263
    def test_prodotti_raggruppati_per_ordine(self):
        o1 = make_ordine(1)
        o2 = make_ordine(2)
        det1a, art1a = make_det_art(1, "ART01")
        det1b, art1b = make_det_art(1, "ART02")
        det2,  art2  = make_det_art(2, "ART03")
        repo = make_repo(ordini=[o1, o2], totale=2, prodotti=[(det1a, art1a), (det1b, art1b), (det2, art2)])
        service = StoricoService(repo)

        result = service.get_ordini_admin(1, 10)

        ordini = {o.codice_ordine: o for o in result.ordini}
        assert len(ordini["1"].prodotti) == 2
        assert len(ordini["2"].prodotti) == 1

    #TU-B_264
    def test_ordine_senza_data(self):
        ordine = make_ordine(1)
        ordine.data = None
        repo = make_repo(ordini=[ordine])
        service = StoricoService(repo)

        result = service.get_ordini_cliente("mario", 1, 10)

        assert result.ordini[0].data is None

    #TU-B_265
    def test_ordine_senza_prodotti(self):
        ordine = make_ordine(1)
        repo = make_repo(ordini=[ordine], prodotti=[])
        service = StoricoService(repo)

        result = service.get_ordini_cliente("mario", 1, 10)

        assert result.ordini[0].prodotti == []

    #TU-B_266
    def test_calcolo_totale_pagine(self):
        ordini = [make_ordine(i) for i in range(1, 6)]
        repo = make_repo(ordini=ordini, totale=25)
        service = StoricoService(repo)

        result = service.get_ordini_cliente("mario", 1, 5)

        assert result.totale_pagine == 5  # ceil(25/5)

    #TU-B_267
    def test_totale_pagine_minimo_1(self):
        repo = make_repo(ordini=[make_ordine(1)], totale=1)
        service = StoricoService(repo)

        result = service.get_ordini_cliente("mario", 1, 10)

        assert result.totale_pagine == 1

    #TU-B_268
    def test_pagina_corrente_propagata(self):
        ordini = [make_ordine(i) for i in range(1, 4)]
        repo = make_repo(ordini=ordini, totale=30)
        service = StoricoService(repo)

        result = service.get_ordini_cliente("mario", 3, 10)

        assert result.pagina_corrente == 3


# ─── get_ordini_cliente ───────────────────────────────────────────────────────

class TestGetOrdiniCliente:

    #TU-B_269
    def test_chiama_repo_con_parametri_corretti(self):
        repo = make_repo(ordini=[make_ordine(1)])
        service = StoricoService(repo)

        service.get_ordini_cliente("mario", 2, 5, None, None)

        assert repo.get_ordini_by_username.call_count == 2
        repo.get_ordini_by_username.assert_any_call("mario", 2, 5, None, None)
        repo.get_ordini_by_username.assert_any_call("mario", 1, 1)

    #TU-B_270
    def test_lancia_eccezione_se_totale_zero(self):
        repo = make_repo(ordini=[], totale=0)
        service = StoricoService(repo)

        with pytest.raises(OrdiniUsernameNotFoundException):
            service.get_ordini_cliente("mario", 1, 10, None, None)

    #TU-B_271
    def test_username_non_incluso(self):
        repo = make_repo(ordini=[make_ordine(1, username="mario")])
        service = StoricoService(repo)

        result = service.get_ordini_cliente("mario", 1, 10, None, None)

        assert result.ordini[0].username is None


# ─── get_ordini_admin ─────────────────────────────────────────────────────────

class TestGetOrdiniAdmin:

    #TU-B_272
    def test_chiama_repo_con_parametri_corretti(self):
        repo = make_repo(ordini=[make_ordine(1)])
        service = StoricoService(repo)

        service.get_ordini_admin(2, 20, None, None)

        assert repo.get_all_ordini.call_count == 2
        repo.get_all_ordini.assert_any_call(2, 20, None, None)
        repo.get_all_ordini.assert_any_call(1, 1)

    #TU-B_273
    def test_username_incluso(self):
        repo = make_repo(ordini=[make_ordine(1, username="luigi")])
        service = StoricoService(repo)

        result = service.get_ordini_admin(1, 10, None, None)

        assert result.ordini[0].username == "luigi"

    #TU-B_274
    def test_lista_vuota_lancia_eccezione(self):
        repo = make_repo(ordini=[], totale=0)
        service = StoricoService(repo)

        with pytest.raises(OrdiniNotFoundException):
            service.get_ordini_admin(1, 10, None, None)


# ─── duplica_ordine ───────────────────────────────────────────────────────────

class TestDuplicaOrdine:
    #TU-B_275
    def test_chiama_repo_con_parametri_corretti(self):
        repo = make_repo()
        service = StoricoService(repo)

        service.duplica_ordine("42", "mario")

        repo.duplica_ordine.assert_called_once_with("42", "mario")

    #TU-B_276
    def test_lancia_eccezione_se_ordine_non_trovato(self):
        repo = make_repo()
        repo.duplica_ordine.side_effect = ValueError("non trovato")
        service = StoricoService(repo)

        with pytest.raises(OrdineNotFoundException):
            service.duplica_ordine("99", "mario")

    #TU-B_277
    def test_non_rilancia_value_error_direttamente(self):
        repo = make_repo()
        repo.duplica_ordine.side_effect = ValueError("non trovato")
        service = StoricoService(repo)

        with pytest.raises(OrdineNotFoundException):
            service.duplica_ordine("99", "mario")

        # verifica che sia OrdineNotFoundException e non ValueError
        try:
            service.duplica_ordine("99", "mario")
        except OrdineNotFoundException as e:
            assert isinstance(e.__cause__, ValueError)