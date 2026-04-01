import pytest
from sqlalchemy.engine import result
from src.cart.adapters.CartProductRepository import CartProductRepository
from src.cart.exceptions import (
    ProductNotFoundException,
    ProductNotInCartException,
)
from src.cart.adapters.UserCartRepository import UserCartRepository
from src.catalog.adapters.CatalogProductRepository import CatalogProductRepository
from src.enums import CartUpdateOperation, MeasureUnitEnum


def make_catalog(prod_id="ABC2", prod_des="Prodotto 2", price=2.0):
    return CatalogProductRepository(
        prod_id=prod_id,
        prod_des=prod_des,
        price=price,
        measure_unit_type=MeasureUnitEnum.C,
    )


def make_cart(username="Tom", cod_art="ABC2", quantita=1):
    return UserCartRepository(username=username, cod_art=cod_art, quantita=quantita)


# TU-B_147
def test_get_products_calls_db(cart_repository, mock_db):
    mock_db.exec.return_value.all.return_value = []
    result = cart_repository.get_products(username="Tom")
    assert result == []
    mock_db.exec.assert_called_once()


# TU-B_148
def test_get_products_returns_list(cart_repository, mock_db):
    cart1 = UserCartRepository(username="Tom", cod_art="ABC1", quantita=1)
    catalog1 = CatalogProductRepository(
        prod_id="ABC1",
        prod_des="Prodotto 1",
        price=1.0,
        measure_unit_type=MeasureUnitEnum.C,
    )

    cart2 = UserCartRepository(username="Tom", cod_art="ABC2", quantita=1)
    catalog2 = CatalogProductRepository(
        prod_id="ABC2",
        prod_des="Prodotto 2",
        price=5.0,
        measure_unit_type=MeasureUnitEnum.C,
    )

    mock_db.exec.return_value.all.return_value = [
        (cart1, catalog1),
        (cart2, catalog2),
    ]

    result = cart_repository.get_products("Tom")

    assert len(result) == 2
    assert result[0].id_prod == "ABC1"
    assert result[1].id_prod == "ABC2"


# TU-B_149
def test_add_product_calls_and_commit_refresh(cart_repository, mock_db):
    mock_db.exec.return_value.first.return_value = make_catalog(
        prod_id="ABC3", prod_des="Prodotto 3", price=3.0
    )

    cart_repository.add_product(prod_id="ABC3", username="Tom", qty=2)

    mock_db.add.assert_called_once()
    mock_db.commit.assert_called_once()


# TU-B_150
def test_add_product_returns_product_repository(cart_repository, mock_db):
    mock_db.exec.return_value.first.return_value = make_catalog()

    result = cart_repository.add_product(prod_id="ABC2", username="Tom", qty=4)

    assert isinstance(result, CartProductRepository)


# TU-B_151
def test_add_product_correct_fields(cart_repository, mock_db):
    mock_db.exec.return_value.first.return_value = make_catalog(
        prod_id="ABC2", prod_des="Prodotto 2", price=2.0
    )

    result = cart_repository.add_product(prod_id="ABC2", username="Tom", qty=4)

    assert result.id_prod == "ABC2"
    assert result.qty == 4
    assert result.prod_descr == "Prodotto 2"
    assert result.price == 2


# TU-B_152
def test_add_product_not_existing(cart_repository, mock_db):
    mock_db.exec.return_value.first.return_value = None
    with pytest.raises(ProductNotFoundException):
        cart_repository.add_product(prod_id="ABC99", username="Tom", qty=2)


# TU-B_153
def test_remove_product_calls_and_commit(cart_repository, mock_db):
    mock_db.exec.return_value.first.return_value = (make_cart(), make_catalog())

    cart_repository.remove_product(username="Tom", prod_id="ABC2")

    mock_db.commit.assert_called_once()


# TU-B_154
def test_remove_product_returns_product_repository(cart_repository, mock_db):
    mock_db.exec.return_value.first.return_value = (make_cart(), make_catalog())

    result = cart_repository.remove_product(username="Tom", prod_id="ABC2")

    assert isinstance(result, CartProductRepository)


# TU-B_155
def test_remove_product_correct_fields(cart_repository, mock_db):
    mock_db.exec.return_value.first.return_value = (
        make_cart(cod_art="ABC2"),
        make_catalog(prod_id="ABC2"),
    )

    result = cart_repository.remove_product(username="Tom", prod_id="ABC2")

    assert result.id_prod == "ABC2"


# TU-B_156
def test_remove_product_not_in_cart(cart_repository, mock_db):
    mock_db.exec.return_value.first.return_value = None
    with pytest.raises(ProductNotInCartException):
        cart_repository.remove_product(username="Tom", prod_id="ABC50")


# TU-B_157
def test_update_quantity_calls_and_commit_refresh(cart_repository, mock_db):
    mock_db.exec.return_value.first.return_value = (make_cart(), make_catalog())

    cart_repository.update_quantity(
        username="Tom", prod_id="ABC2", qty=2, operation=CartUpdateOperation.Add
    )

    mock_db.commit.assert_called_once()


# TU-B_158
def test_update_quantit_returns_product_repository(cart_repository, mock_db):
    mock_db.exec.return_value.first.return_value = (make_cart(), make_catalog())

    result = cart_repository.update_quantity(
        username="Tom", prod_id="ABC2", qty=2, operation=CartUpdateOperation.Add
    )

    assert isinstance(result, CartProductRepository)


# TU-B_159
def test_update_quantity_correct_fields(cart_repository, mock_db):
    before_qty = 1
    mock_db.exec.return_value.first.return_value = (
        make_cart(cod_art="ABC1", quantita=before_qty),
        make_catalog(prod_id="ABC1", prod_des="Prodotto 1", price=1.0),
    )

    qty_to_add = 2
    result = cart_repository.update_quantity(
        username="Tom",
        prod_id="ABC1",
        qty=qty_to_add,
        operation=CartUpdateOperation.Add,
    )

    assert result.id_prod == "ABC1"
    assert result.qty == before_qty + qty_to_add


# TU-B_160
def test_update_quantity_product_not_in_cart(cart_repository, mock_db):
    mock_db.exec.return_value.first.return_value = None

    with pytest.raises(ProductNotInCartException):
        cart_repository.update_quantity(
            username="Tom", prod_id="ABC50", qty=5, operation=CartUpdateOperation.Add
        )
