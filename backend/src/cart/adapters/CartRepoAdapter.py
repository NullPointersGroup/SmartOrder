from src.cart.CartSchemas import CartProduct
from src.cart.adapters.CartRepository import CartRepository
from src.cart.ports.CartRepoPort import CartRepoPort
from src.enums import CartUpdateOperation


class CartRepoAdapter(CartRepoPort):
    def __init__(self, repo: CartRepository) -> None:
        """
        @brief Inizializza l'adapter con il repository concreto
        @param repo Istanza di CartRepository per l'accesso al database
        """
        self.repo = repo

    def get_products(self, username: str) -> list[CartProduct]:
        """
        @brief Recupera tutti i prodotti del carrello per un utente
        @param username Nome dell'utente
        @return Lista di CartProduct convertiti dal formato del repository
        """
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
        """
        @brief Aggiunge un prodotto al carrello tramite il repository
        @param prod_id ID del prodotto da aggiungere
        @param username Nome dell'utente
        @param qty Quantità del prodotto
        @return CartProduct convertito dal risultato del repository
        """
        row = self.repo.add_product(prod_id, username, qty)
        return CartProduct(
            prod_id=row.id_prod,
            name=row.prod_descr,
            price=row.price,
            measure_unit=row.measure_unit,
            qty=row.qty,
        )

    def remove_product(self, prod_id: str, username: str) -> CartProduct:
        """
        @brief Rimuove un prodotto dal carrello tramite il repository
        @param prod_id ID del prodotto da rimuovere
        @param username Nome dell'utente
        @return CartProduct del prodotto rimosso convertito dal risultato
        """
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
        """
        @brief Aggiorna la quantità di un prodotto nel carrello
        @param prod_id ID del prodotto da aggiornare
        @param username Nome dell'utente
        @param qty Quantità da applicare in base all'operazione
        @param operation Tipo di operazione (increase, decrease, set)
        @return CartProduct aggiornato convertito dal risultato del repository
        """
        row = self.repo.update_quantity(username, prod_id, qty, operation)
        return CartProduct(
            prod_id=row.id_prod,
            name=row.prod_descr,
            price=row.price,
            measure_unit=row.measure_unit,
            qty=row.qty,
        )
        
    def send_order(self, username: str) -> None:
        self.repo.send_order(username)
