from datetime import date
from typing import List, Tuple
from sqlmodel import Session, select, func, col
from src.db.models import Ordine, OrdCliDet, Anaart


class StoricoRepository:

    def __init__(self, db: Session):
        self.db = db

    def get_ordini_by_username(self, username: str, pagina: int, per_pagina: int) -> Tuple[List[Ordine], int]:
        totale = self.db.exec(
            select(func.count()).select_from(Ordine).where(Ordine.username == username)
        ).one()
        ordini = list(self.db.exec(
            select(Ordine)
            .where(Ordine.username == username)
            .order_by(col(Ordine.id_ord).desc())
            .offset((pagina - 1) * per_pagina)
            .limit(per_pagina)
        ).all())
        return ordini, totale

    def get_all_ordini(self, pagina: int, per_pagina: int) -> Tuple[List[Ordine], int]:
        totale = self.db.exec(select(func.count()).select_from(Ordine)).one()
        ordini = list(self.db.exec(
            select(Ordine)
            .order_by(col(Ordine.id_ord).desc())
            .offset((pagina - 1) * per_pagina)
            .limit(per_pagina)
        ).all())
        return ordini, totale

    def get_prodotti_by_ordine_ids(self, ordine_ids: List[int]) -> List[Tuple[OrdCliDet, Anaart]]:
        if not ordine_ids:
            return []
        return list(self.db.exec(
            select(OrdCliDet, Anaart)
            .join(Anaart, col(OrdCliDet.cod_art) == col(Anaart.prod_id))
            .where(col(OrdCliDet.id_ord).in_(ordine_ids))
        ).all())

    def duplica_ordine(self, codice_ordine: str, username: str) -> Ordine:
        id_ord = int(codice_ordine)
        originale = self.db.get(Ordine, id_ord)
        if originale is None:
            raise ValueError(f"Ordine '{codice_ordine}' non trovato")

        prodotti_originali = list(self.db.exec(
            select(OrdCliDet).where(OrdCliDet.id_ord == id_ord)
        ).all())

        nuovo_id = self.db.exec(select(func.max(Ordine.id_ord))).one()

        nuovo_ordine = Ordine(id_ord=nuovo_id, username=username, data=date.today())
        self.db.add(nuovo_ordine)
        self.db.flush()

        for p in prodotti_originali:
            self.db.add(OrdCliDet(id_ord=nuovo_id, cod_art=p.cod_art, qta_ordinata=p.qta_ordinata))

        self.db.commit()
        self.db.refresh(nuovo_ordine)
        return nuovo_ordine