from datetime import date
from src.chat.ports.ToolOrderPortIn import ToolOrderPortIn
from src.chat.tools.ToolOrderService import ToolOrderService
from src.storico.StoricoSchemas import StoricoPageSchema


class ToolOrderAdapter(ToolOrderPortIn):
    def __init__(self, tool_order_service: ToolOrderService) -> None:
        super().__init__()
        self.tool_order_service = tool_order_service

    def get_ordini(
        self,
        pagina: int = 1,
        data_inizio: date | None = None,
        data_fine: date | None = None,
    ) -> StoricoPageSchema:
        return self.tool_order_service.get_ordini(pagina, data_inizio, data_fine)
