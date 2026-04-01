from fastapi import HTTPException
import pytest
from unittest.mock import MagicMock
from sqlmodel import Session

from src.cart.CartApi import (
    add_product_to_cart,
    get_cart_service,
    get_user_cart,
    remove_product_from_cart,
    update_product_quantity,
)
from src.cart.CartSchemas import (
    AddProductRequest,
    CartProductResponse,
    CartResponse,
    RemoveProductRequest,
    UpdateProductRequest,
    CartProduct,
)
from src.cart.CartService import CartService
from src.cart.exceptions import ProductNotFoundException, ProductNotInCartException
from src.enums import CartUpdateOperation, MeasureUnitEnum


# TU-B_161
def test_get_cart_service_unit():
    mock_db = MagicMock(spec=Session)
    service = get_cart_service(db=mock_db)
    assert isinstance(service, CartService)


# TU-B_162
def test_get_user_cart():
    mock_service = MagicMock()
    mock_products = [
        CartProduct(
            prod_id="ABC",
            qty=2,
            name="Prodotto",
            price=10.0,
            measure_unit=MeasureUnitEnum.C,
        )
    ]
    mock_service.get_cart_products.return_value = mock_products

    result = get_user_cart(username="Tom", cart_service=mock_service)

    assert isinstance(result, CartResponse)
    assert result.username == "Tom"
    mock_service.get_cart_products.assert_called_once_with("Tom")


# TU-B_163
def test_add_product_to_cart():
    mock_service = MagicMock()
    mock_products = CartProduct(
        prod_id="ABC",
        qty=2,
        name="Prodotto",
        price=10.0,
        measure_unit=MeasureUnitEnum.C,
    )

    mock_service.add_product_to_cart.return_value = mock_products

    request = AddProductRequest(prod_id="ABC", qty=2)

    result = add_product_to_cart(
        username="Tom", request=request, cart_service=mock_service
    )

    assert isinstance(result, CartProductResponse)
    assert result.username == "Tom"
    mock_service.add_product_to_cart.assert_called_once_with("Tom", "ABC", 2)


# TU-B_164
def test_add_product_not_found():
    mock_service = MagicMock()
    mock_service.add_product_to_cart.side_effect = ProductNotFoundException("ABC")
    request = AddProductRequest(prod_id="ABC", qty=2)

    with pytest.raises(HTTPException) as exc:
        add_product_to_cart(
            username="Tom",
            request=request,
            cart_service=mock_service,
        )

    assert exc.value.status_code == 404
    assert "ABC" in exc.value.detail


# TU-B_165
def test_remove_product_from_cart():
    mock_service = MagicMock()
    mock_products = CartProduct(
        prod_id="ABC",
        qty=2,
        name="Prodotto",
        price=10.0,
        measure_unit=MeasureUnitEnum.C,
    )

    mock_service.remove_product_from_cart.return_value = mock_products

    request = RemoveProductRequest(prod_id="ABC")

    result = remove_product_from_cart(
        username="Tom",
        request=request,
        cart_service=mock_service,
    )

    assert isinstance(result, CartProductResponse)
    assert result.username == "Tom"
    mock_service.remove_product_from_cart.assert_called_once_with("Tom", "ABC")


# TU-B_166
def test_remove_product_not_in_cart():
    mock_service = MagicMock()
    mock_service.remove_product_from_cart.side_effect = ProductNotInCartException(
        prod_id="ABC", username="Tom"
    )

    request = RemoveProductRequest(prod_id="ABC")

    with pytest.raises(HTTPException) as exc:
        remove_product_from_cart(
            username="Tom",
            request=request,
            cart_service=mock_service,
        )

    assert exc.value.status_code == 404
    assert "ABC" in exc.value.detail


# TU-B_167
def test_update_product_quantity():
    mock_service = MagicMock()
    mock_products = CartProduct(
        prod_id="ABC",
        qty=2,
        name="Prodotto",
        price=10.0,
        measure_unit=MeasureUnitEnum.C,
    )

    mock_service.update_cart_quantity.return_value = mock_products

    request = UpdateProductRequest(
        prod_id="ABC",
        qty=2,
        operation=CartUpdateOperation.Add,
    )

    result = update_product_quantity(
        username="Tom",
        request=request,
        cart_service=mock_service,
    )

    assert isinstance(result, CartProductResponse)
    assert result.username == "Tom"
    mock_service.update_cart_quantity.assert_called_once_with(
        "Tom", "ABC", 2, CartUpdateOperation.Add
    )


# TU-B_168
def test_update_product_not_in_cart():
    mock_service = MagicMock()
    mock_service.update_cart_quantity.side_effect = ProductNotInCartException(
        "ABC", "Tom"
    )

    request = UpdateProductRequest(
        prod_id="ABC",
        qty=2,
        operation=CartUpdateOperation.Add,
    )

    with pytest.raises(HTTPException) as exc:
        update_product_quantity(
            username="Tom",
            request=request,
            cart_service=mock_service,
        )

    assert exc.value.status_code == 404
    assert "ABC" in exc.value.detail
