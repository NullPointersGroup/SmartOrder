from unittest.mock import MagicMock

from src.cart.CartSchemas import CartProduct
from src.catalog.CatalogSchemas import CatalogProduct
from src.chat.tools.ToolCartService import ToolCartService
from src.chat.tools.ToolCatalogService import ToolCatalogService
from src.chat.tools.ToolOrderService import ToolOrderService
from src.enums import CartUpdateOperation, MeasureUnitEnum
from src.history.HistorySchemas import HistoryPageSchema


def make_cart_product(prod_id: str, name: str, qty: int) -> CartProduct:
    return CartProduct(
        prod_id=prod_id,
        name=name,
        price=1.0,
        qty=qty,
        measure_unit=MeasureUnitEnum.C,
    )

def make_catalog_product(prod_id: str, name: str) -> CatalogProduct:
    return CatalogProduct(
        prod_id=prod_id,
        name=name,
        price=1.0,
        measure_unit=MeasureUnitEnum.C,
    )


#TU-B_230
def test_get_cart_items_delegates_to_cart_service():
    cart_repo = MagicMock()
    embedded_cart = MagicMock()
    tool_service = ToolCartService(
        username="carlesso",
        cart_repo=cart_repo,
        embedded_cart=embedded_cart,
    )
    cart_repo.get_products.return_value = [make_cart_product("A1", "Acqua", 2)]

    result = tool_service.get_cart_items()

    cart_repo.get_products.assert_called_once_with("carlesso")
    assert [p.prod_id for p in result] == ["A1"]


#TU-B_231
def test_search_cart_maps_only_products_present_in_cart():
    cart_repo = MagicMock()
    embedded_cart = MagicMock()
    tool_service = ToolCartService(
        username="carlesso",
        cart_repo=cart_repo,
        embedded_cart=embedded_cart,
    )
    embedded_cart.search_cart.return_value = ["A1", "MISSING", "B2"]
    cart_repo.get_products.return_value = [
        make_cart_product("A1", "Acqua", 2),
        make_cart_product("B2", "Birra", 3),
    ]

    result = tool_service.search_cart("acqua e birra", 0.8)

    embedded_cart.search_cart.assert_called_once_with("carlesso", "acqua e birra", 0.8)
    cart_repo.get_products.assert_called_once_with("carlesso")
    assert [p.prod_id for p in result] == ["A1", "B2"]


#TU-B_232
def test_search_catalog_maps_only_existing_products():
    catalog_repo = MagicMock()
    embedded_catalog = MagicMock()
    tool_service = ToolCatalogService(
        embedded_catalog=embedded_catalog,
        catalog_repo=catalog_repo,
    )
    embedded_catalog.search_catalog.return_value = ["A1", "MISS", "B2"]
    catalog_repo.get_product.side_effect = [
        make_catalog_product("A1", "Acqua"),
        None,
        make_catalog_product("B2", "Birra"),
    ]

    result = tool_service.search_catalog("birra", 0.8)

    embedded_catalog.search_catalog.assert_called_once_with("birra", 0.8)
    assert [p.prod_id for p in result] == ["A1", "B2"]


#TU-B_233
def test_update_cart_item_qty_delegates_with_username():
    cart_repo = MagicMock()
    embedded_cart = MagicMock()
    tool_service = ToolCartService(
        username="carlesso",
        cart_repo=cart_repo,
        embedded_cart=embedded_cart,
    )

    tool_service.update_cart_item_qty("A1", 4, CartUpdateOperation.Set)

    cart_repo.update_quantity.assert_called_once_with(
        "A1", "carlesso", 4, CartUpdateOperation.Set
    )

#TU-B_234
def test_get_ordini_delegates_to_storico_service_with_default_page_size():
    storico_service = MagicMock()
    page = HistoryPageSchema(ordini=[], pagina_corrente=2, totale_pagine=5)
    storico_service.get_orders_customer.return_value = page
    tool_service = ToolOrderService(
        username="carlesso",
        storico_service=storico_service,
    )

    result = tool_service.get_ordini(pagina=2)

    storico_service.get_orders_customer.assert_called_once_with(
        username="carlesso",
        page=2,
        per_page=10,
        start_date=None,
        end_date=None,
    )
    assert result == page
