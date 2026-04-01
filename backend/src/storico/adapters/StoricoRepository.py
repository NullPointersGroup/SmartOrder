import uuid
from datetime import datetime, timezone
from typing import List, Tuple
from sqlmodel import Session, select, col, func
from src.storico.StoricoModels import Ordine, OrdineProdotto


class StoricoRepository:

    def __init__(self, db: Session):
        self.db = db

    def get_ordini_by_username(
        self, username: str, pagina: int, per_pagina: int
    ) -> Tuple[List[Ordine], int]:
        totale = self.db.exec(
            select(func.count(Ordine.id)).where(Ordine.username == username)
        ).one()
        statement = (
            select(Ordine)
            .where(Ordine.username == username)
            .order_by(col(Ordine.created_at).desc())
            .offset((pagina - 1) * per_pagina)
            .limit(per_pagina)
        )
        return list(self.db.exec(statement).all()), totale

    def get_all_ordini(
        self, pagina: int, per_pagina: int
    ) -> Tuple[List[Ordine], int]:
        totale = self.db.exec(select(func.count(Ordine.id))).one()
        statement = (
            select(Ordine)
            .order_by(col(Ordine.created_at).desc())
            .offset((pagina - 1) * per_pagina)
            .limit(per_pagina)
        )
        return list(self.db.exec(statement).all()), totale

    def get_prodotti_by_ordine_ids(self, ordine_ids: List[int]) -> List[OrdineProdotto]:
        if not ordine_ids:
            return []
        statement = select(OrdineProdotto).where(
            col(OrdineProdotto.ordine_id).in_(ordine_ids)
        )
        return list(self.db.exec(statement).all())

    def duplica_ordine(self, codice_ordine: str, username: str) -> Ordine:
        # Recupera ordine originale
        originale = self.db.exec(
            select(Ordine).where(Ordine.codice_ordine == codice_ordine)
        ).first()
        if originale is None:
            raise ValueError(f"Ordine '{codice_ordine}' non trovato")

        # Recupera i prodotti
        prodotti_originali = self.db.exec(
            select(OrdineProdotto).where(OrdineProdotto.ordine_id == originale.id)
        ).all()

        # Crea nuovo ordine con codice univoco
        nuovo_codice = f"ORD-{uuid.uuid4().hex[:8].upper()}"
        nuovo_ordine = Ordine(
            codice_ordine=nuovo_codice,
            username=username,
            stato="in_attesa",
            totale=originale.totale,
            created_at=datetime.now(timezone.utc),
        )
        self.db.add(nuovo_ordine)
        self.db.flush()

        # Duplica i prodotti
        for p in prodotti_originali:
            nuovo_prodotto = OrdineProdotto(
                ordine_id=nuovo_ordine.id,
                prodotto_id=p.prodotto_id,
                nome_prodotto=p.nome_prodotto,
                descrizione_prodotto=p.descrizione_prodotto,
                quantita=p.quantita,
                prezzo_unitario=p.prezzo_unitario,
            )
            self.db.add(nuovo_prodotto)

        self.db.commit()
        self.db.refresh(nuovo_ordine)
        return nuovo_ordine