from src.cart.CartSchemas import CartProduct
from src.catalog.CatalogSchemas import CatalogProduct
from src.chat.ports.ToolPort import ToolPortIn
from src.chat.tools.ToolService import ToolService
from src.enums import CartUpdateOperation


class ToolAdapter(ToolPortIn):
    def __init__(self, tool_service: ToolService) -> None:
        super().__init__()
        self.tool_service = tool_service

    def get_cart_items(self) -> list[CartProduct]:
        return self.tool_service.get_cart_items()

    def add_to_cart(self, prod_id: str, qty: int) -> CartProduct:
        return self.tool_service.add_to_cart(prod_id, qty)

    def remove_from_cart(self, prod_id: str) -> CartProduct:
        return self.tool_service.remove_from_cart(prod_id)

    def update_cart_item_qty(
        self, prod_id: str, qty: int, operation: CartUpdateOperation
    ) -> CartProduct:
        return self.tool_service.update_cart_item_qty(prod_id, qty, operation)

    def search_cart(self, query: str, threshold: float) -> list[CartProduct]:
        return self.tool_service.search_cart(query, threshold)

    def search_catalog(self, query: str, threshold: float) -> list[CatalogProduct]:
        return self.tool_service.search_catalog(query, threshold)
