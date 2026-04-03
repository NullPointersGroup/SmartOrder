from sqlmodel import Session, col, delete, select, update, func
from src.cart.exceptions import (
    ProductNotFoundException,
    ProductNotInCartException,
)
from src.enums import CartUpdateOperation
from src.db.models import Anaart, Carrello
from src.enums import MeasureUnitEnum
from src.cart.adapters.CartProductRepository import CartProductRepository
from datetime import date
from src.cart.exceptions import CartEmptyException
from src.db.models import Ordine, OrdCliDet

class CartRepository:
    def __init__(self, db: Session) -> None:
        """
        @brief Inizializza il repository del carrello con la sessione del database
        @param db Sessione SQLModel per le operazioni sul database
        """
        self.db = db

    ## TODO spostare Anaart in cartella condivisa tra Cart e Catalog, e rinominarlo in ProductRepository
    def get_products(self, username: str) -> list[CartProductRepository]:
        """
        @brief Recupera tutti i prodotti nel carrello di un utente
        @param username Nome dell'utente
        @return Lista di CartProductRepository con dati prodotto e quantità
        """
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
        """
        @brief Aggiunge un prodotto al carrello dell'utente
        @param prod_id ID del prodotto da aggiungere
        @param username Nome dell'utente
        @param qty Quantità del prodotto
        @return CartProductRepository con i dati del prodotto aggiunto
        @throws ProductNotFoundException se il prodotto non esiste nel catalogo
        """
        stmt = select(Anaart).where(
            Anaart.prod_id == prod_id
        )
        result = self.db.exec(stmt).first()
        if not result:
            raise ProductNotFoundException(prod_id)
        assert result is not None

        # Cerca se esiste già nel carrello
        stmt_cart = select(Carrello).where(
            Carrello.username == username,
            Carrello.cod_art == prod_id,
        )
        existing_item = self.db.exec(stmt_cart).first()

        if existing_item:
            # UPDATE: aggiorna la quantità
            existing_item.quantita += qty
            self.db.add(existing_item)
        else:
            # INSERT: crea nuovo elemento
            existing_item = Carrello(
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
        """
        @brief Rimuove un prodotto dal carrello dell'utente
        @param username Nome dell'utente
        @param prod_id ID del prodotto da rimuovere
        @return CartProductRepository con i dati del prodotto rimosso
        @throws ProductNotInCartException se il prodotto non è presente nel carrello
        """
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
        """
        @brief Aggiorna la quantità di un prodotto nel carrello
        @param username Nome dell'utente
        @param prod_id ID del prodotto da aggiornare
        @param qty Quantità da aggiungere o sottrarre
        @param operation Tipo di operazione (Add = incrementa, Subtract = decrementa)
        @return CartProductRepository con i dati del prodotto aggiornato
        @throws ProductNotInCartException se il prodotto non è presente nel carrello
        """
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
            new_qty: Any = col(Carrello.quantita) + qty
            result_qty = cart.quantita + qty
        elif operation == CartUpdateOperation.Remove:
            new_qty = col(Carrello.quantita) - qty
            result_qty = cart.quantita - qty
        else:
            new_qty = qty
            result_qty = qty
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
            qty=result_qty,
            prod_descr=catalog.prod_des,
            price=catalog.price,
            measure_unit=MeasureUnitEnum(catalog.measure_unit_type),
        )
        
    def send_order(self, username: str) -> None:
        """
        @brief Invia l'ordine creando Ordine e OrdCliDet, poi svuota il carrello
        @param username Nome dell'utente
        @throws CartEmptyException se il carrello è vuoto
        """
        items = list(self.db.exec(
            select(Carrello).where(col(Carrello.username) == username)
        ).all())

        if not items:
            raise CartEmptyException(username)

        max_id = self.db.exec(select(func.max(Ordine.id_ord))).one()
        nuovo_id = (max_id or 0) + 1

        ordine = Ordine(id_ord=nuovo_id, username=username, data=date.today())
        self.db.add(ordine)
        self.db.flush()

        for item in items:
            self.db.add(OrdCliDet(id_ord=nuovo_id, cod_art=item.cod_art, qta_ordinata=item.quantita))

        delete_stmt = delete(Carrello).where(col(Carrello.username) == username)
        self.db.exec(delete_stmt)
        self.db.commit()