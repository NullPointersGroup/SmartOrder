from datetime import date
from typing import List, Tuple
from sqlmodel import Session, select, func, col
from src.db.models import Ordine, OrdCliDet, Anaart


class StoricoRepository:

    def __init__(self, db: Session):
        """
        @brief Inizializza il repository con la sessione di database.
        @param db Sessione SQLModel attiva.
        """
        self.db = db

    def get_ordini_by_username(self, username: str, pagina: int, per_pagina: int, data_inizio: date | None = None, data_fine: date | None = None
    ) -> Tuple[List[Ordine], int]:
        """
        @brief Recupera gli ordini di un cliente specifico con paginazione.
        @param username Username del cliente di cui recuperare gli ordini.
        @param pagina   Numero della pagina richiesta (base 1).
        @param per_pagina Numero di ordini per pagina.
        @return Tupla (lista di Ordine, totale ordini del cliente).
        """
        count_statement = select(func.count()).select_from(Ordine).where(Ordine.username == username)
        statement = select(Ordine).where(Ordine.username == username)

        if data_inizio:
            count_statement = count_statement.where(col(Ordine.data) >= data_inizio)
            statement = statement.where(col(Ordine.data) >= data_inizio)
        if data_fine:
            count_statement = count_statement.where(col(Ordine.data) <= data_fine)
            statement = statement.where(col(Ordine.data) <= data_fine)

        totale = self.db.exec(count_statement).one()
        ordini = list(self.db.exec(
            statement.order_by(col(Ordine.id_ord).desc())
            .offset((pagina - 1) * per_pagina)
            .limit(per_pagina)
        ).all())
        return ordini, totale

    def get_all_ordini(self, pagina: int, per_pagina: int, data_inizio: date | None = None, data_fine: date | None = None
    ) -> Tuple[List[Ordine], int]:
        """
        @brief Recupera tutti gli ordini di tutti i clienti con paginazione.
        @param pagina     Numero della pagina richiesta (base 1).
        @param per_pagina Numero di ordini per pagina.
        @return Tupla (lista di Ordine, totale ordini nel sistema).
        """
        statement = select(Ordine)
        if data_inizio:
            statement = statement.where(col(Ordine.data) >= data_inizio)
        if data_fine:
            statement = statement.where(col(Ordine.data) <= data_fine)

        totale = self.db.exec(select(func.count()).select_from(statement.subquery())).one()
        ordini = list(self.db.exec(
            statement.order_by(col(Ordine.id_ord).desc())
            .offset((pagina - 1) * per_pagina)
            .limit(per_pagina)
        ).all())
        return ordini, totale

    def get_prodotti_by_ordine_ids(self, ordine_ids: List[int]) -> List[Tuple[OrdCliDet, Anaart]]:
        """
        @brief Recupera i prodotti associati a una lista di ordini.
        @param ordine_ids Lista di id_ord di cui recuperare i prodotti.
        @return Lista di tuple (OrdCliDet, Anaart); lista vuota se ordine_ids è vuota.
        """
        if not ordine_ids:
            return []
        return list(self.db.exec(
            select(OrdCliDet, Anaart)
            .join(Anaart, col(OrdCliDet.cod_art) == col(Anaart.prod_id))
            .where(col(OrdCliDet.id_ord).in_(ordine_ids))
        ).all())

    def duplica_ordine(self, codice_ordine: str, username: str) -> Ordine:
        """
        @brief Duplica un ordine esistente assegnandolo all'utente indicato con la data odierna.
        @param codice_ordine Codice (id) dell'ordine da duplicare.
        @param username      Username del cliente a cui intestare il nuovo ordine.
        @raise ValueError    Se l'ordine con il codice indicato non esiste.
        @return Il nuovo Ordine creato e persistito.
        """
        id_ord = int(codice_ordine)
        originale = self.db.get(Ordine, id_ord)
        if originale is None:
            raise ValueError(f"Ordine '{codice_ordine}' non trovato")

        prodotti_originali = list(self.db.exec(
            select(OrdCliDet).where(OrdCliDet.id_ord == id_ord)
        ).all())

        max_id = self.db.exec(select(func.max(Ordine.id_ord))).one()
        nuovo_id = (max_id or 0) + 1

        nuovo_ordine = Ordine(id_ord=nuovo_id, username=username, data=date.today())
        self.db.add(nuovo_ordine)
        self.db.flush()

        for p in prodotti_originali:
            self.db.add(OrdCliDet(id_ord=nuovo_id, cod_art=p.cod_art, qta_ordinata=p.qta_ordinata))

        self.db.commit()
        self.db.refresh(nuovo_ordine)
        return nuovo_ordine

    def get_all_products_by_username(self, username: str) -> List[Tuple[str, str, int]]:
        result = self.db.exec(
            select(
                Anaart.prod_id,
                Anaart.prod_des,
                func.count(OrdCliDet.cod_art).label("freq"),
            )
            .join(OrdCliDet, col(OrdCliDet.cod_art) == col(Anaart.prod_id))
            .join(Ordine, col(OrdCliDet.id_ord) == col(Ordine.id_ord))
            .where(Ordine.username == username)
            .group_by(Anaart.prod_id, Anaart.prod_des)
            .order_by(func.count(OrdCliDet.cod_art).desc(), Anaart.prod_des.asc())
        ).all()
        return [(row[0], row[1], int(row[2])) for row in result]
