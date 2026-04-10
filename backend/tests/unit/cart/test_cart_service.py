import pytest

from src.cart.CartSchemas import CartProduct
from src.cart.exceptions import CartEmptyException
from src.enums import MeasureUnitEnum, CartUpdateOperation


def make_cart_product(prod_id="ABC1", name="Prodotto 1", price=1.0, qty=1):
    return CartProduct(
        prod_id=prod_id,
        name=name,
        price=price,
        qty=qty,
        measure_unit=MeasureUnitEnum.C,
    )

#TU-B_169
def test_get_products_returns_empty_list(cart_service, mock_adapter):
    mock_adapter.get_products.return_value = []
    result = cart_service.get_cart_products(username="Tom")

    assert result == []


#TU-B_170
def test_get_cart_products_returns_list(cart_service, mock_adapter):
    mock_adapter.get_products.return_value = [
        make_cart_product(prod_id="ABC1"),
        make_cart_product(prod_id="ABC2"),
    ]

    result = cart_service.get_cart_products(username="Tom")

    assert len(result) == 2
    assert result[0].prod_id == "ABC1"
    assert result[1].prod_id == "ABC2"


# TU-B_171
def test_send_order_delegates_to_adapter(cart_service, mock_adapter):
    cart_service.send_order(username="Tom")

    mock_adapter.send_order.assert_called_once_with("Tom")


# TU-B_172
def test_send_order_propagates_success_without_return_value(cart_service, mock_adapter):
    mock_adapter.send_order.return_value = None

    result = cart_service.send_order(username="Tom")

    assert result is None


# TU-B_173
def test_send_order_raises_cart_empty_exception(cart_service, mock_adapter):
    mock_adapter.send_order.side_effect = CartEmptyException("empty")

    with pytest.raises(CartEmptyException) as exc:
        cart_service.send_order(username="Tom")

    assert "Tom" in str(exc.value)
