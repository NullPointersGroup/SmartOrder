from sqlmodel import Session, col, delete, select, update
from src.cart.exceptions import (
    ProductNotFoundException,
    ProductNotInCartException,
)
from src.enums import CartUpdateOperation
from src.db.models import Anaart, Carrello
from src.enums import MeasureUnitEnum
from src.cart.adapters.CartProductRepository import CartProductRepository

class CartRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    ## TODO spostare Anaart in cartella condivisa tra Cart e Catalog, e rinominarlo in ProductRepository
    def get_products(self, username: str) -> list[CartProductRepository]:
        stmt = (
            select(Carrello, Anaart)
            .join(
                Anaart,
                col(Carrello.cod_art)
                == col(Anaart.prod_id),
            )
            .where(Carrello.username == username)
        )
        result = self.db.exec(stmt).all()
        return [
            CartProductRepository(
                id_prod=cart.cod_art,
                qty=cart.quantita,
                prod_descr=catalog.prod_des,
                price=catalog.price,
                measure_unit=MeasureUnitEnum(catalog.measure_unit_type),
            )
            for cart, catalog in result
        ]

    def add_product(
        self, prod_id: str, username: str, qty: int
    ) -> CartProductRepository:
        stmt = select(Anaart).where(
            Anaart.prod_id == prod_id
        )
        result = self.db.exec(stmt).first()
        if not result:
            raise ProductNotFoundException(prod_id)

        new_cart_item = Carrello(
            username=username, cod_art=prod_id, quantita=qty
        )
        self.db.add(new_cart_item)
        self.db.commit()
        self.db.refresh(new_cart_item)

        return CartProductRepository(
            id_prod=prod_id,
            qty=qty,
            prod_descr=result.prod_des,
            price=result.price,
            measure_unit=MeasureUnitEnum(result.measure_unit_type),
        )

    def remove_product(self, username: str, prod_id: str) -> CartProductRepository:
        stmt = (
            select(Carrello, Anaart)
            .join(
                Anaart,
                col(Carrello.cod_art)
                == col(Anaart.prod_id),
            )
            .where(col(Carrello.username) == username)
            .where(col(Carrello.cod_art) == prod_id)
        )
        result = self.db.exec(stmt).first()
        if not result:
            raise ProductNotInCartException(prod_id, username)
        cart, catalog = result
        delete_stmt = (
            delete(Carrello)
            .where(col(Carrello.username) == username)
            .where(col(Carrello.cod_art) == prod_id)
        )

        self.db.exec(delete_stmt)
        self.db.commit()

        return CartProductRepository(
            id_prod=cart.cod_art,
            qty=cart.quantita,
            prod_descr=catalog.prod_des,
            price=catalog.price,
            measure_unit=MeasureUnitEnum(catalog.measure_unit_type),
        )

    def update_quantity(
        self, username: str, prod_id: str, qty: int, operation: CartUpdateOperation
    ) -> CartProductRepository:
        stmt = (
            select(Carrello, Anaart)
            .join(
                Anaart,
                col(Carrello.cod_art)
                == col(Anaart.prod_id),
            )
            .where(col(Carrello.username) == username)
            .where(col(Carrello.cod_art) == prod_id)
        )
        result = self.db.exec(stmt).first()
        if not result:
            raise ProductNotInCartException(prod_id, username)
        assert result is not None
        cart, catalog = result
        if operation == CartUpdateOperation.Add:
            new_qty = col(Carrello.quantita) + qty
        else:
            new_qty = col(Carrello.quantita) - qty
        update_stmt = (
            update(Carrello)
            .where(col(Carrello.username) == username)
            .where(col(Carrello.cod_art) == prod_id)
            .values(quantita=new_qty)
        )
        self.db.exec(update_stmt)
        self.db.commit()

        return CartProductRepository(
            id_prod=prod_id,
            qty=(
                cart.quantita + qty
                if operation == CartUpdateOperation.Add
                else cart.quantita - qty
            ),
            prod_descr=catalog.prod_des,
            price=catalog.price,
            measure_unit=MeasureUnitEnum(catalog.measure_unit_type),
        )
