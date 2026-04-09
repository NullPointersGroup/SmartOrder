from backend.src.chat.ports.ToolCartPortIn import ToolCartPortIn
from src.chat.tools.ToolCartService import ToolCartService
from src.cart.CartSchemas import CartProduct
from src.enums import CartUpdateOperation


class ToolCartAdapter(ToolCartPortIn):
    def __init__(self, tool_cart_service: ToolCartService) -> None:
        super().__init__()
        self.tool_cart_service = tool_cart_service

    def get_cart_items(self) -> list[CartProduct]:
        return self.tool_cart_service.get_cart_items()

    def add_to_cart(self, prod_id: str, qty: int) -> CartProduct:
        return self.tool_cart_service.add_to_cart(prod_id, qty)

    def remove_from_cart(self, prod_id: str) -> CartProduct:
        return self.tool_cart_service.remove_from_cart(prod_id)

    def update_cart_item_qty(
        self, prod_id: str, qty: int, operation: CartUpdateOperation
    ) -> CartProduct:
        return self.tool_cart_service.update_cart_item_qty(prod_id, qty, operation)

    def search_cart(self, query: str, threshold: float) -> list[CartProduct]:
        return self.tool_cart_service.search_cart(query, threshold)
