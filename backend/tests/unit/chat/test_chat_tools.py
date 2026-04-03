from unittest.mock import MagicMock

import pytest

pytest.importorskip("langchain")

from src.cart.CartSchemas import CartProduct
from src.cart.exceptions import ProductNotFoundException, ProductNotInCartException
from src.chat.ports.ToolPort import ToolPortIn
from src.chat.tools.AddToCart import AddToCartTool
from src.chat.tools.GetCartItems import GetCartItemsTool
from src.chat.tools.RemoveFromCart import RemoveFromCartTool
from src.chat.tools.UpdateCartItemQty import UpdateCartItemQty
from src.enums import CartUpdateOperation, MeasureUnitEnum


class DummyToolPort(ToolPortIn):
    def __init__(self) -> None:
        self.get_cart_items_mock = MagicMock()
        self.add_to_cart_mock = MagicMock()
        self.remove_from_cart_mock = MagicMock()
        self.search_cart_mock = MagicMock()
        self.search_catalog_mock = MagicMock()
        self.update_cart_item_qty_mock = MagicMock()

    def get_cart_items(self):
        return self.get_cart_items_mock()

    def search_catalog(self, query: str, threshold: float):
        return self.search_catalog_mock(query, threshold)

    def search_cart(self, query: str, threshold: float):
        return self.search_cart_mock(query, threshold)

    def add_to_cart(self, prod_id: str, qty: int):
        return self.add_to_cart_mock(prod_id, qty)

    def remove_from_cart(self, prod_id: str):
        return self.remove_from_cart_mock(prod_id)

    def update_cart_item_qty(
        self, prod_id: str, qty: int, operation: CartUpdateOperation
    ):
        return self.update_cart_item_qty_mock(prod_id, qty, operation)


def make_cart_product(prod_id: str, name: str, qty: int) -> CartProduct:
    return CartProduct(
        prod_id=prod_id,
        name=name,
        price=1.0,
        qty=qty,
        measure_unit=MeasureUnitEnum.C,
    )


def test_get_cart_items_tool_returns_empty_message():
    tool_service = DummyToolPort()
    tool_service.get_cart_items_mock.return_value = []
    tool = GetCartItemsTool(tool_service=tool_service)

    result = tool._run()

    assert result == "Il carrello è vuoto."


def test_get_cart_items_tool_formats_products():
    tool_service = DummyToolPort()
    tool_service.get_cart_items_mock.return_value = [
        make_cart_product("A1", "Acqua", 2),
        make_cart_product("B2", "Birra", 3),
    ]
    tool = GetCartItemsTool(tool_service=tool_service)

    result = tool._run()

    assert "- id: A1, nome: Acqua, quantità: 2" in result
    assert "- id: B2, nome: Birra, quantità: 3" in result


def test_add_to_cart_tool_handles_product_not_found():
    tool_service = DummyToolPort()
    tool_service.add_to_cart_mock.side_effect = ProductNotFoundException("A1")
    tool = AddToCartTool(tool_service=tool_service)

    result = tool._run("A1", 2)

    assert result == "Prodotto non trovato nel catalogo."


def test_remove_from_cart_tool_handles_missing_product():
    tool_service = DummyToolPort()
    tool_service.remove_from_cart_mock.side_effect = ProductNotInCartException("A1", "u")
    tool = RemoveFromCartTool(tool_service=tool_service)

    result = tool._run("A1")

    assert result == "Il prodotto non è presente nel carrello."


def test_update_cart_item_qty_tool_handles_set_operation():
    tool_service = DummyToolPort()
    tool_service.update_cart_item_qty_mock.return_value = make_cart_product("A1", "Acqua", 7)
    tool = UpdateCartItemQty(tool_service=tool_service)

    result = tool._run("A1", 7, CartUpdateOperation.Set)

    tool_service.update_cart_item_qty_mock.assert_called_once_with(
        "A1", 7, CartUpdateOperation.Set
    )
    assert "Quantità del prodotto 'Acqua' aggiornata" in result
    assert "operazione: Set" in result


def test_update_cart_item_qty_tool_handles_missing_product():
    tool_service = DummyToolPort()
    tool_service.update_cart_item_qty_mock.side_effect = ProductNotInCartException("A1", "u")
    tool = UpdateCartItemQty(tool_service=tool_service)

    result = tool._run("A1", 2, CartUpdateOperation.Remove)

    assert result == "Il prodotto non è presente nel carrello."
