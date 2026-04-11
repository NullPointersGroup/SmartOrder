from datetime import date
from src.history.HistorySchemas import HistoryPageSchema
from src.history.HistoryService import HistoryService


class ToolOrderService:

    def __init__(
        self,
        username: str,
        storico_service: HistoryService,
    ) -> None:
        self.username = username
        self.storico_service = storico_service

    def get_ordini(
        self,
        pagina: int = 1,
        data_inizio: date | None = None,
        data_fine: date | None = None,
    ) -> HistoryPageSchema:
        return self.storico_service.get_ordini_cliente(
            username=self.username,
            pagina=pagina,
            per_pagina=10,
            data_inizio=data_inizio,
            data_fine=data_fine,
        )
