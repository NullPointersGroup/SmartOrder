import math
from collections import defaultdict
from typing import List

from src.storico.ports.StoricoRepoPort import StoricoRepoPort
from src.db.models import Ordine
from src.storico.StoricoSchemas import OrdineSchema, ProdottoSchema, StoricoPageSchema
from src.storico.exceptions import OrdiniNotFoundException, OrdineNotFoundException

PER_PAGINA_DEFAULT = 10


class StoricoService:

    def __init__(self, repo: StoricoRepoPort):
        """
        @brief Inizializza il servizio storico con il repository fornito
        @param repo Implementazione del porto repository per lo storico
        """
        self.repo = repo
        

    def _build_page(
        self,
        ordini_orm: List[Ordine],
        totale: int,
        pagina: int,
        per_pagina: int,
        include_username: bool
    ) -> StoricoPageSchema:
        """
        @brief Costruisce la pagina di storico con ordini e relativi prodotti
        @param ordini_orm Lista degli ordini dal database
        @param totale Numero totale di ordini
        @param pagina Numero della pagina corrente
        @param per_pagina Numero di ordini per pagina
        @param include_username Se True include il nome utente nell'output
        @return StoricoPageSchema con ordini, pagina corrente e totale pagine
        """
        ordine_ids = [o.id_ord for o in ordini_orm if o.id_ord is not None]
        prodotti_orm = self.repo.get_prodotti_by_ordine_ids(ordine_ids)

        prodotti_per_ordine: dict[int, list[ProdottoSchema]] = defaultdict(list)
        for det, art in prodotti_orm:
            if det.id_ord is not None:
                prodotti_per_ordine[det.id_ord].append(
                    ProdottoSchema(nome=art.prod_des, quantita=det.qta_ordinata)
                )

        ordini_schema = [
            OrdineSchema(
                codice_ordine=str(o.id_ord),
                data=o.data.isoformat() if o.data else None,
                username=o.username if include_username else None,
                prodotti=prodotti_per_ordine.get(o.id_ord, []) if o.id_ord is not None else [],
            )
            for o in ordini_orm
        ]

        totale_pagine = max(1, math.ceil(totale / per_pagina))
        return StoricoPageSchema(ordini=ordini_schema, pagina_corrente=pagina, totale_pagine=totale_pagine)


    def get_ordini_cliente(
        self, username: str, pagina: int = 1, per_pagina: int = PER_PAGINA_DEFAULT
    ) -> StoricoPageSchema:
        """
        @brief Recupera gli ordini di un cliente specifico con paginazione
        @param username Nome dell'utente cliente
        @param pagina Numero della pagina richiesta (default 1)
        @param per_pagina Ordini per pagina (default PER_PAGINA_DEFAULT)
        @return StoricoPageSchema con gli ordini del cliente
        @throws OrdiniNotFoundException se l'utente non ha ordini
        """
        ordini_orm, totale = self.repo.get_ordini_by_username(username, pagina, per_pagina)
        if totale == 0:
            raise OrdiniNotFoundException(username)
        return self._build_page(ordini_orm, totale, pagina, per_pagina, include_username=False)

    def get_ordini_admin(
        self, pagina: int = 1, per_pagina: int = PER_PAGINA_DEFAULT
    ) -> StoricoPageSchema:
        """
        @brief Recupera tutti gli ordini (vista admin) con paginazione
        @param pagina Numero della pagina richiesta (default 1)
        @param per_pagina Ordini per pagina (default PER_PAGINA_DEFAULT)
        @return StoricoPageSchema con tutti gli ordini inclusi gli username
        """
        ordini_orm, totale = self.repo.get_all_ordini(pagina, per_pagina)
        return self._build_page(ordini_orm, totale, pagina, per_pagina, include_username=True)

    def duplica_ordine(self, codice_ordine: str, username: str) -> None:
        """
        @brief Duplica un ordine esistente per un utente
        @param codice_ordine Codice dell'ordine da duplicare
        @param username Nome dell'utente che duplica l'ordine
        @throws OrdineNotFoundException se l'ordine con il codice specificato non esiste
        """
        try:
            self.repo.duplica_ordine(codice_ordine, username)
        except ValueError as e:
            raise OrdineNotFoundException(codice_ordine) from e