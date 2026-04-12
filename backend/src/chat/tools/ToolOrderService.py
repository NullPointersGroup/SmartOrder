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
        return self.storico_service.get_orders_customer(
            username=self.username,
            page=pagina,
            per_page=10,
            start_date=data_inizio,
            end_date=data_fine,
        )
