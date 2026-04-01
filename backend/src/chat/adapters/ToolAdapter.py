from src.cart.CartSchemas import CartProduct
from src.chat.ports.ToolPort import ToolPortIn
from src.chat.tools.ToolService import ToolService


class ToolAdapter(ToolPortIn):
    def __init__(self, tool_service: ToolService) -> None:
        super().__init__()
        self.tool_service = tool_service

    def add_to_cart(self, prod_id: str, qty: int) -> CartProduct:
        return self.tool_service.add_to_cart(prod_id, qty)

    def remove_from_cart(self, prod_id: str) -> CartProduct:
        return self.tool_service.remove_from_cart(prod_id)
