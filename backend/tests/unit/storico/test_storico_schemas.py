from datetime import datetime

import pytest
from pydantic import ValidationError

from src.storico.StoricoSchemas import (
    OrdineSchema,
    OrdineProdottoSchema,
    StoricoResponseSchema,
)


VALID_CREATED_AT = datetime(2024, 6, 15, 10, 30, 0)


class TestOrdineProdottoSchema:
    def test_valid(self):
        p = OrdineProdottoSchema(
            prodotto_id=1,
            nome_prodotto="Mela",
            quantita=3,
            prezzo_unitario=0.5,
        )
        assert p.prodotto_id == 1
        assert p.nome_prodotto == "Mela"

    def test_missing_prodotto_id_raises(self):
        with pytest.raises(ValidationError):
            OrdineProdottoSchema(nome_prodotto="Mela", quantita=1, prezzo_unitario=0.5)

    def test_missing_nome_prodotto_raises(self):
        with pytest.raises(ValidationError):
            OrdineProdottoSchema(prodotto_id=1, quantita=1, prezzo_unitario=0.5)

    def test_missing_quantita_raises(self):
        with pytest.raises(ValidationError):
            OrdineProdottoSchema(prodotto_id=1, nome_prodotto="Mela", prezzo_unitario=0.5)

    def test_missing_prezzo_unitario_raises(self):
        with pytest.raises(ValidationError):
            OrdineProdottoSchema(prodotto_id=1, nome_prodotto="Mela", quantita=2)

    def test_from_attributes_config(self):
        assert OrdineProdottoSchema.model_config.get("from_attributes") is True


class TestOrdineSchema:
    def test_valid_without_prodotti(self):
        o = OrdineSchema(
            id=1,
            username="mario",
            stato="completato",
            totale=150.0,
            created_at=VALID_CREATED_AT,
        )
        assert o.id == 1
        assert o.prodotti == []

    def test_valid_with_prodotti(self):
        prodotto = OrdineProdottoSchema(
            prodotto_id=10,
            nome_prodotto="Pane",
            quantita=2,
            prezzo_unitario=1.5,
        )
        o = OrdineSchema(
            id=1,
            username="mario",
            stato="completato",
            totale=3.0,
            created_at=VALID_CREATED_AT,
            prodotti=[prodotto],
        )
        assert len(o.prodotti) == 1
        assert o.prodotti[0].nome_prodotto == "Pane"

    def test_missing_id_raises(self):
        with pytest.raises(ValidationError):
            OrdineSchema(
                username="mario",
                stato="completato",
                totale=10.0,
                created_at=VALID_CREATED_AT,
            )

    def test_missing_username_raises(self):
        with pytest.raises(ValidationError):
            OrdineSchema(
                id=1,
                stato="completato",
                totale=10.0,
                created_at=VALID_CREATED_AT,
            )

    def test_missing_totale_raises(self):
        with pytest.raises(ValidationError):
            OrdineSchema(
                id=1,
                username="mario",
                stato="completato",
                created_at=VALID_CREATED_AT,
            )

    def test_missing_created_at_raises(self):
        with pytest.raises(ValidationError):
            OrdineSchema(
                id=1,
                username="mario",
                stato="completato",
                totale=10.0,
            )

    def test_prodotti_defaults_to_empty_list(self):
        o = OrdineSchema(
            id=1,
            username="mario",
            stato="completato",
            totale=10.0,
            created_at=VALID_CREATED_AT,
        )
        assert o.prodotti == []

    def test_from_attributes_config(self):
        assert OrdineSchema.model_config.get("from_attributes") is True


class TestStoricoResponseSchema:
    def test_valid_with_ordini(self):
        o = OrdineSchema(
            id=1,
            username="mario",
            stato="completato",
            totale=10.0,
            created_at=VALID_CREATED_AT,
        )
        s = StoricoResponseSchema(ordini=[o], totale_ordini=1)
        assert s.totale_ordini == 1
        assert len(s.ordini) == 1

    def test_valid_empty_ordini(self):
        s = StoricoResponseSchema(ordini=[], totale_ordini=0)
        assert s.ordini == []
        assert s.totale_ordini == 0

    def test_missing_ordini_raises(self):
        with pytest.raises(ValidationError):
            StoricoResponseSchema(totale_ordini=0)

    def test_missing_totale_ordini_raises(self):
        with pytest.raises(ValidationError):
            StoricoResponseSchema(ordini=[])

    def test_totale_ordini_is_int(self):
        s = StoricoResponseSchema(ordini=[], totale_ordini=0)
        assert isinstance(s.totale_ordini, int)
