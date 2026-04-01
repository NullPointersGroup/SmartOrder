from sqlmodel import Session, col, delete, insert, select, update
from src.cart.adapters.CartProductRepository import CartProductRepository
from src.cart.adapters.UserCartRepository import UserCartRepository
from src.cart.exceptions import (
    ProductNotFoundException,
    ProductNotInCartException,
)
from src.catalog.adapters.CatalogProductRepository import CatalogProductRepository
from src.enums import CartUpdateOperation, MeasureUnitEnum


class CartRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    ## TODO spostare CatalogProductRepository in cartella condivisa tra Cart e Catalog, e rinominarlo in ProductRepository
    def get_products(self, username: str) -> list[CartProductRepository]:
        stmt = (
            select(UserCartRepository, CatalogProductRepository)
            .join(
                CatalogProductRepository,
                col(UserCartRepository.cod_art)
                == col(CatalogProductRepository.prod_id),
            )
            .where(UserCartRepository.username == username)
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

        # Verifica che il prodotto esista nel catalogo
        stmt = select(CatalogProductRepository).where(
            CatalogProductRepository.prod_id == prod_id
        )
        result = self.db.exec(stmt).first()
        if not result:
            raise ProductNotFoundException(prod_id)

        # Cerca se esiste già nel carrello
        stmt_cart = select(UserCartRepository).where(
            UserCartRepository.username == username,
            UserCartRepository.cod_art == prod_id,
        )
        existing_item = self.db.exec(stmt_cart).first()

        if existing_item:
            # UPDATE: aggiorna la quantità
            existing_item.quantita += qty
            self.db.add(existing_item)
        else:
            # INSERT: crea nuovo elemento
            existing_item = UserCartRepository(
                username=username, cod_art=prod_id, quantita=qty
            )
            self.db.add(existing_item)

        self.db.commit()
        self.db.refresh(existing_item)

        return CartProductRepository(
            id_prod=prod_id,
            qty=existing_item.quantita,
            prod_descr=result.prod_des,
            price=result.price,
            measure_unit=MeasureUnitEnum(result.measure_unit_type),
        )

    def remove_product(self, username: str, prod_id: str) -> CartProductRepository:
        stmt = (
            select(UserCartRepository, CatalogProductRepository)
            .join(
                CatalogProductRepository,
                col(UserCartRepository.cod_art)
                == col(CatalogProductRepository.prod_id),
            )
            .where(col(UserCartRepository.username) == username)
            .where(col(UserCartRepository.cod_art) == prod_id)
        )
        result = self.db.exec(stmt).first()
        if not result:
            raise ProductNotInCartException(prod_id, username)
        cart, catalog = result
        delete_stmt = (
            delete(UserCartRepository)
            .where(col(UserCartRepository.username) == username)
            .where(col(UserCartRepository.cod_art) == prod_id)
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
            select(UserCartRepository, CatalogProductRepository)
            .join(
                CatalogProductRepository,
                col(UserCartRepository.cod_art)
                == col(CatalogProductRepository.prod_id),
            )
            .where(col(UserCartRepository.username) == username)
            .where(col(UserCartRepository.cod_art) == prod_id)
        )
        result = self.db.exec(stmt).first()
        if not result:
            raise ProductNotInCartException(prod_id, username)
        assert result is not None
        cart, catalog = result
        if operation == CartUpdateOperation.Add:
            new_qty = col(UserCartRepository.quantita) + qty
        else:
            new_qty = col(UserCartRepository.quantita) - qty
        update_stmt = (
            update(UserCartRepository)
            .where(col(UserCartRepository.username) == username)
            .where(col(UserCartRepository.cod_art) == prod_id)
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
