from src.cart.CartSchemas import CartProduct
from src.cart.adapters.CartRepository import CartRepository
from src.cart.ports.CartRepoPort import CartRepoPort
from src.enums import CartUpdateOperation


class CartRepoAdapter(CartRepoPort):
    def __init__(self, repo: CartRepository) -> None:
        self.repo = repo

    def get_products(self, username: str) -> list[CartProduct]:
        rows = self.repo.get_products(username)
        return [
            CartProduct(
                prod_id=r.id_prod,
                name=r.prod_descr,
                price=r.price,
                qty=r.qty,
                measure_unit=r.measure_unit,
            )
            for r in rows
        ]

    def add_product(self, prod_id: str, username: str, qty: int) -> CartProduct:
        row = self.repo.add_product(prod_id, username, qty)
        return CartProduct(
            prod_id=row.id_prod,
            name=row.prod_descr,
            price=row.price,
            measure_unit=row.measure_unit,
            qty=row.qty,
        )

    def remove_product(self, prod_id: str, username: str) -> CartProduct:
        row = self.repo.remove_product(username, prod_id)
        return CartProduct(
            prod_id=row.id_prod,
            name=row.prod_descr,
            price=row.price,
            measure_unit=row.measure_unit,
            qty=row.qty,
        )

    def update_quantity(
        self, prod_id: str, username: str, qty: int, operation: CartUpdateOperation
    ) -> CartProduct:
        row = self.repo.update_quantity(prod_id, username, qty, operation)
        return CartProduct(
            prod_id=row.id_prod,
            name=row.prod_descr,
            price=row.price,
            measure_unit=row.measure_unit,
            qty=row.qty,
        )
