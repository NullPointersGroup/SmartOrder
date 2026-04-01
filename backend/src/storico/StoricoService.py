import math
from collections import defaultdict
from typing import List

from src.storico.ports.StoricoRepoPort import StoricoRepoPort
from src.storico.StoricoModels import Ordine, OrdineProdotto
from src.storico.StoricoSchemas import OrdineSchema, ProdottoSchema, StoricoPageSchema
from src.storico.exceptions import OrdiniNotFoundException, OrdineNotFoundException

PER_PAGINA_DEFAULT = 10


class StoricoService:

    def __init__(self, repo: StoricoRepoPort):
        self.repo = repo
        

    def _build_page(
        self,
        ordini_orm: List[Ordine],
        totale: int,
        pagina: int,
        per_pagina: int,
        include_username: bool,
    ) -> StoricoPageSchema:
        ordine_ids = [o.id for o in ordini_orm if o.id is not None]
        prodotti_orm = self.repo.get_prodotti_by_ordine_ids(ordine_ids)

        # raggruppa i prodotti per ordine_id
        prodotti_per_ordine: dict[int, list[ProdottoSchema]] = defaultdict(list)
        for p in prodotti_orm:
            prodotti_per_ordine[p.ordine_id].append(
                ProdottoSchema(
                    nome=p.nome_prodotto,
                    descrizione=p.descrizione_prodotto,
                    quantita=p.quantita,
                )
            )

        ordini_schema = [
            OrdineSchema(
                codice_ordine=o.codice_ordine,
                numero_ordine=o.id,
                data=o.created_at.isoformat(),
                username=o.username if include_username else None,
                prodotti=prodotti_per_ordine.get(o.id, []),
            )
            for o in ordini_orm
        ]

        totale_pagine = max(1, math.ceil(totale / per_pagina))
        return StoricoPageSchema(
            ordini=ordini_schema,
            pagina_corrente=pagina,
            totale_pagine=totale_pagine,
        )


    def get_ordini_cliente(
        self, username: str, pagina: int = 1, per_pagina: int = PER_PAGINA_DEFAULT
    ) -> StoricoPageSchema:
        ordini_orm, totale = self.repo.get_ordini_by_username(username, pagina, per_pagina)
        if totale == 0:
            raise OrdiniNotFoundException(username)
        return self._build_page(ordini_orm, totale, pagina, per_pagina, include_username=False)

    def get_ordini_admin(
        self, pagina: int = 1, per_pagina: int = PER_PAGINA_DEFAULT
    ) -> StoricoPageSchema:
        ordini_orm, totale = self.repo.get_all_ordini(pagina, per_pagina)
        return self._build_page(ordini_orm, totale, pagina, per_pagina, include_username=True)

    def duplica_ordine(self, codice_ordine: str, username: str) -> None:
        try:
            self.repo.duplica_ordine(codice_ordine, username)
        except ValueError as e:
            raise OrdineNotFoundException(codice_ordine) from e