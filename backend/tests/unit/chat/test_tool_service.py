from unittest.mock import MagicMock

from src.cart.CartSchemas import CartProduct
from src.catalog.CatalogSchemas import CatalogProduct
from src.chat.tools.ToolService import ToolService
from src.enums import CartUpdateOperation, MeasureUnitEnum


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


def test_get_cart_items_delegates_to_cart_service():
    cart_service = MagicMock()
    catalog_repo = MagicMock()
    vec_db = MagicMock()
    tool_service = ToolService(
        username="carlesso",
        cart_service=cart_service,
        catalog_repo=catalog_repo,
        vec_db=vec_db,
        storico_service=MagicMock(),
    )
    cart_service.get_cart_products.return_value = [make_cart_product("A1", "Acqua", 2)]

    result = tool_service.get_cart_items()

    cart_service.get_cart_products.assert_called_once_with("carlesso")
    assert [p.prod_id for p in result] == ["A1"]


def test_search_cart_maps_only_products_present_in_cart():
    cart_service = MagicMock()
    catalog_repo = MagicMock()
    vec_db = MagicMock()
    tool_service = ToolService(
        username="carlesso",
        cart_service=cart_service,
        catalog_repo=catalog_repo,
        vec_db=vec_db,
        storico_service=MagicMock(),
    )
    vec_db.search_cart.return_value = ["A1", "MISSING", "B2"]
    cart_service.get_cart_products.return_value = [
        make_cart_product("A1", "Acqua", 2),
        make_cart_product("B2", "Birra", 3),
    ]

    result = tool_service.search_cart("acqua e birra", 0.8)

    vec_db.search_cart.assert_called_once_with("carlesso", "acqua e birra", 0.8)
    assert [p.prod_id for p in result] == ["A1", "B2"]


def test_search_catalog_maps_only_existing_products():
    cart_service = MagicMock()
    catalog_repo = MagicMock()
    vec_db = MagicMock()
    tool_service = ToolService(
        username="carlesso",
        cart_service=cart_service,
        catalog_repo=catalog_repo,
        vec_db=vec_db,
        storico_service=MagicMock(),
    )
    vec_db.search_catalog.return_value = ["A1", "MISS", "B2"]
    catalog_repo.get_product.side_effect = [
        make_catalog_product("A1", "Acqua"),
        None,
        make_catalog_product("B2", "Birra"),
    ]

    result = tool_service.search_catalog("birra", 0.8)

    vec_db.search_catalog.assert_called_once_with("birra", 0.8)
    assert [p.prod_id for p in result] == ["A1", "B2"]


def test_update_cart_item_qty_delegates_with_username():
    cart_service = MagicMock()
    catalog_repo = MagicMock()
    vec_db = MagicMock()
    tool_service = ToolService(
        username="carlesso",
        cart_service=cart_service,
        catalog_repo=catalog_repo,
        vec_db=vec_db,
        storico_service=MagicMock(),
    )

    tool_service.update_cart_item_qty("A1", 4, CartUpdateOperation.Set)

    cart_service.update_cart_quantity.assert_called_once_with(
        "carlesso", "A1", 4, CartUpdateOperation.Set
    )