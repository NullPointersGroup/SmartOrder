from src.cart.CartSchemas import CartProduct
from src.enums import MeasureUnitEnum, CartUpdateOperation


def make_cart_product(prod_id="ABC1", name="Prodotto 1", price=1.0, qty=1):
    return CartProduct(
        prod_id=prod_id,
        name=name,
        price=price,
        qty=qty,
        measure_unit=MeasureUnitEnum.C,
    )


def test_get_products_returns_empty_list(cart_service, mock_repo):
    mock_repo.get_products.return_value = []
    result = cart_service.get_cart_products(username="Tom")

    assert result == []


def test_get_cart_products_returns_list(cart_service, mock_repo):
    mock_repo.get_products.return_value = [
        make_cart_product(prod_id="ABC1"),
        make_cart_product(prod_id="ABC2"),
    ]

    result = cart_service.get_cart_products(username="Tom")

    assert len(result) == 2
    assert result[0].prod_id == "ABC1"
    assert result[1].prod_id == "ABC2"


def test_add_product_returns_cart_product(cart_service, mock_repo):
    mock_repo.add_product.return_value = make_cart_product()

    result = cart_service.add_product_to_cart(username="Tom", prod_id="ABC1", qty=2)

    assert isinstance(result, CartProduct)


def test_add_product_returns_correct_product(cart_service, mock_repo):
    mock_repo.add_product.return_value = make_cart_product(
        prod_id="ABC1", name="Prodotto 1", price=3.0, qty=2
    )

    result = cart_service.add_product_to_cart(username="Tom", prod_id="ABC1", qty=2)

    assert result.prod_id == "ABC1"
    assert result.name == "Prodotto 1"
    assert result.price == 3
    assert result.qty == 2


def test_remove_product_returns_cart_product(cart_service, mock_repo):
    mock_repo.remove_product.return_value = make_cart_product()

    result = cart_service.remove_product_from_cart(username="Tom", prod_id="ABC1")

    assert isinstance(result, CartProduct)


def test_remove_product_returns_correct_product(cart_service, mock_repo):
    mock_repo.remove_product.return_value = make_cart_product(
        prod_id="ABC1", name="Prodotto 1", price=2.0, qty=1
    )

    result = cart_service.remove_product_from_cart(username="Tom", prod_id="ABC1")

    assert result.prod_id == "ABC1"
    assert result.name == "Prodotto 1"
    assert result.qty == 1


def test_update_quantity_calls_repo_with_add(cart_service, mock_repo):
    mock_repo.update_quantity.return_value = make_cart_product()

    cart_service.update_cart_quantity(
        username="Tom", prod_id="ABC1", qty=3, operation=CartUpdateOperation.Add
    )

    mock_repo.update_quantity.assert_called_once_with(
        "ABC1", "Tom", 3, CartUpdateOperation.Add
    )


def test_update_quantity_calls_repo_with_subtract(cart_service, mock_repo):
    mock_repo.update_quantity.return_value = make_cart_product()

    cart_service.update_cart_quantity(
        username="Tom", prod_id="ABC1", qty=1, operation=CartUpdateOperation.Remove
    )

    mock_repo.update_quantity.assert_called_once_with(
        "ABC1", "Tom", 1, CartUpdateOperation.Remove
    )


def test_update_quantity_returns_cart_product(cart_service, mock_repo):
    mock_repo.update_quantity.return_value = make_cart_product()

    result = cart_service.update_cart_quantity(
        username="Tom", prod_id="ABC1", qty=3, operation=CartUpdateOperation.Add
    )

    assert isinstance(result, CartProduct)


def test_update_quantity_returns_correct_product(cart_service, mock_repo):
    mock_repo.update_quantity.return_value = make_cart_product(prod_id="ABC1", qty=5)

    result = cart_service.update_cart_quantity(
        username="Tom", prod_id="ABC1", qty=3, operation=CartUpdateOperation.Add
    )

    assert result.prod_id == "ABC1"
    assert result.qty == 5
