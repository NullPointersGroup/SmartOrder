import pytest
from unittest.mock import MagicMock
from fastapi import HTTPException
from sqlmodel import Session

from src.cart.CartApi import (
    get_cart_service,
    get_user_cart,
    get_current_user,
    send_order,
)
from src.cart.CartSchemas import CartResponse, CartProduct
from src.cart.CartService import CartService
from src.enums import MeasureUnitEnum


#TU-B_169
def test_get_cart_service_unit():
    mock_db = MagicMock(spec=Session)
    service = get_cart_service(db=mock_db)
    assert isinstance(service, CartService)


#TU-B_170
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


# =========================
# get_current_user
# =========================

#TU-B_171
def test_get_current_user_no_token():
    with pytest.raises(HTTPException) as exc:
        get_current_user(access_token=None)

    assert exc.value.status_code == 401
    assert "Non autenticato" in exc.value.detail


#TU-B_172
def test_get_current_user_invalid_token(monkeypatch):
    monkeypatch.setattr(
        "src.cart.CartApi.decode_token", lambda token: None
    )

    with pytest.raises(HTTPException) as exc:
        get_current_user(access_token="fake")

    assert exc.value.status_code == 401
    assert "Token non valido" in exc.value.detail


#TU-B_173
def test_get_current_user_valid_token(monkeypatch):
    monkeypatch.setattr(
        "src.cart.CartApi.decode_token", lambda token: "Tom"
    )

    result = get_current_user(access_token="valid")

    assert result == "Tom"


# =========================
# send_order
# =========================

#TU-B_174
def test_send_order_calls_service():
    mock_service = MagicMock()

    send_order(
        username="Tom",
        cart_service=mock_service,
        current_user="Tom",
    )

    mock_service.send_order.assert_called_once_with("Tom")


#TU-B_175
def test_send_order_unauthorized():
    mock_service = MagicMock()

    with pytest.raises(HTTPException) as exc:
        send_order(
            username="Tom",
            cart_service=mock_service,
            current_user="Luigi",
        )

    assert exc.value.status_code == 401
    assert "Non autorizzato" in exc.value.detail