from src.cart.adapters.CartProductRepository import CartProductRepository
from src.enums import MeasureUnitEnum, CartUpdateOperation
from src.cart.CartSchemas import CartProduct


def make_db_row(prod_id="ABC1", prod_descr="Prodotto 1", price=1.0, qty=1):
    return CartProductRepository(
        id_prod=prod_id,
        qty=qty,
        prod_descr=prod_descr,
        price=price,
        measure_unit=MeasureUnitEnum.C,
    )


def test_get_products_calls_repo(adapter, mock_repo):
    mock_repo.get_products.return_value = []

    adapter.get_products(username="Tom")

    mock_repo.get_products.assert_called_once_with("Tom")


def test_get_products_returns_mapped_products(adapter, mock_repo):
    mock_repo.get_products.return_value = [
        make_db_row(prod_id="ABC1", prod_descr="Prodotto 1", price=1.0, qty=2),
        make_db_row(prod_id="ABC2", prod_descr="Prodotto 2", price=5.0, qty=3),
    ]

    result = adapter.get_products(username="Tom")

    assert len(result) == 2
    assert isinstance(result[0], CartProduct)
    assert result[0].prod_id == "ABC1"
    assert result[0].name == "Prodotto 1"
    assert result[0].price == 1
    assert result[0].qty == 2
    assert result[1].prod_id == "ABC2"


def test_get_products_returns_empty_list(adapter, mock_repo):
    mock_repo.get_products.return_value = []

    result = adapter.get_products(username="Tom")

    assert result == []


def test_add_product_returns_cart_product(adapter, mock_repo):
    mock_repo.add_product.return_value = make_db_row()
    result = adapter.add_product(prod_id="ABC1", username="Tom", qty=2)

    assert isinstance(result, CartProduct)


def test_add_product_returns_mapped_product(adapter, mock_repo):
    mock_repo.add_product.return_value = make_db_row(
        prod_id="ABC1", prod_descr="Prodotto 1", price=3.0, qty=2
    )

    result = adapter.add_product(prod_id="ABC1", username="Tom", qty=2)

    assert result.prod_id == "ABC1"
    assert result.name == "Prodotto 1"
    assert result.price == 3
    assert result.qty == 2
    assert result.measure_unit == MeasureUnitEnum.C


def test_remove_product_returns_cart_product(adapter, mock_repo):
    mock_repo.remove_product.return_value = make_db_row()

    result = adapter.remove_product(prod_id="ABC1", username="Tom")

    assert isinstance(result, CartProduct)


def test_remove_product_returnrs_mapped_product(adapter, mock_repo):
    mock_repo.remove_product.return_value = make_db_row(
        prod_id="ABC1", prod_descr="Prodotto 1", price=2.0, qty=1
    )

    result = adapter.remove_product(prod_id="ABC1", username="Tom")

    assert result.prod_id == "ABC1"
    assert result.name == "Prodotto 1"
    assert result.price == 2
    assert result.qty == 1


def test_update_quantity_returns_product(adapter, mock_repo):
    mock_repo.update_quantity.return_value = make_db_row()

    result = adapter.update_quantity(
        prod_id="ABC1", username="Tom", qty=3, operation=CartUpdateOperation.Add
    )

    assert isinstance(result, CartProduct)


def test_update_quantity_returns_mapped_products(adapter, mock_repo):
    mock_repo.update_quantity.return_value = make_db_row(
        prod_id="ABC1", prod_descr="Prodotto 1", price=1.0, qty=5
    )

    result = adapter.update_quantity(
        prod_id="ABC1", username="Tom", qty=3, operation=CartUpdateOperation.Add
    )

    assert result.prod_id == "ABC1"
    assert result.name == "Prodotto 1"
    assert result.qty == 5
    assert result.measure_unit == MeasureUnitEnum.C


def test_update_quantity_subtract_calls_repo(adapter, mock_repo):
    mock_repo.update_quantity.return_value = make_db_row(qty=2)

    result = adapter.update_quantity(
        prod_id="ABC1", username="Tom", qty=1, operation=CartUpdateOperation.Remove
    )

    mock_repo.update_quantity.assert_called_once_with(
        "Tom", "ABC1", 1, CartUpdateOperation.Remove
    )
    assert result.qty == 2


def test_update_quantity_set_calls_repo(adapter, mock_repo):
    mock_repo.update_quantity.return_value = make_db_row(qty=7)

    result = adapter.update_quantity(
        prod_id="ABC1", username="Tom", qty=7, operation=CartUpdateOperation.Set
    )

    mock_repo.update_quantity.assert_called_once_with(
        "Tom", "ABC1", 7, CartUpdateOperation.Set
    )
    assert result.qty == 7
