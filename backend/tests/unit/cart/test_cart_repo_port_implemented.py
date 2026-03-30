from src.cart.ports.CartRepoPort import CartRepoPort
from src.cart.CartSchemas import CartProduct
from src.enums import MeasureUnitEnum, CartUpdateOperation


class ConcreteCartRepo(CartRepoPort):
    def get_products(self, username) -> list[CartProduct]:
        return []

    def add_product(self, prod_id, username, qty) -> CartProduct:
        return CartProduct(
            prod_id=prod_id,
            name="Test",
            price=1.0,
            qty=qty,
            measure_unit=MeasureUnitEnum.C,
        )

    def remove_product(self, prod_id, username) -> CartProduct:
        return CartProduct(
            prod_id=prod_id,
            name="Test",
            price=1.0,
            qty=1,
            measure_unit=MeasureUnitEnum.C,
        )

    def update_quantity(self, prod_id, username, qty, operation) -> CartProduct:
        return CartProduct(
            prod_id=prod_id,
            name="Test",
            price=1,
            qty=qty,
            measure_unit=MeasureUnitEnum.C,
        )


def test_get_products_can_be_implemented():
    cart_repo = ConcreteCartRepo()
    result = cart_repo.get_products("Tom")
    assert isinstance(result, list)


def test_add_products_can_be_implemented():
    cart_repo = ConcreteCartRepo()
    result = cart_repo.add_product("ABC1", "Tom", 2)
    assert isinstance(result, CartProduct)


def test_remove_product_can_be_implemented():
    cart_repo = ConcreteCartRepo()
    result = cart_repo.remove_product("ABC1", "Tom")
    assert isinstance(result, CartProduct)


def test_update_quantity_can_be_implemented():
    cart_repo = ConcreteCartRepo()
    result = cart_repo.update_quantity("ABC1", "Tom", 2, CartUpdateOperation.Add)
    assert isinstance(result, CartProduct)
