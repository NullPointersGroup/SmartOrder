from src.cart.CartSchemas import CartProduct
from src.cart.exceptions import CartEmptyException
from src.enums import CartUpdateOperation

from src.cart.ports.CartRepoPort import CartRepoPort


class CartService:
    def __init__(self, adapter: CartRepoPort) -> None:
        """
        @brief Inizializza il servizio carrello con il repository fornito
        @param repo Implementazione della porta repository per il carrello
        """
        self.adapter = adapter

    def get_cart_products(self, username: str) -> list[CartProduct]:
        """
        @brief Recupera tutti i prodotti presenti nel carrello di un utente
        @param username Nome dell'utente
        @return Lista di prodotti nel carrello
        """
        cart_products = self.adapter.get_products(username)
        return cart_products

    def add_product_to_cart(self, username: str, prod_id: str, qty: int) -> CartProduct:
        """
        @brief Aggiunge un prodotto al carrello dell'utente
        @param username Nome dell'utente
        @param prod_id ID del prodotto da aggiungere
        @param qty Quantità del prodotto da aggiungere
        @return Prodotto aggiunto con quantità aggiornata
        """
        print("CALLED")
        product = self.adapter.add_product(prod_id, username, qty)
        return product

    def update_cart_quantity(
        self, username: str, prod_id: str, qty: int, operation: CartUpdateOperation
    ) -> CartProduct:
        """
        @brief Aggiorna la quantità di un prodotto nel carrello
        @param username Nome dell'utente
        @param prod_id ID del prodotto da aggiornare
        @param qty Quantità da applicare in base all'operazione
        @param operation Tipo di operazione (increase, decrease, set)
        @return Prodotto aggiornato con nuova quantità
        """
        product = self.adapter.update_quantity(prod_id, username, qty, operation)
        return product

    def remove_product_from_cart(self, username: str, prod_id: str) -> CartProduct:
        """
        @brief Rimuove un prodotto dal carrello dell'utente
        @param username Nome dell'utente
        @param prod_id ID del prodotto da rimuovere
        @return Prodotto rimosso con quantità precedente
        """
        product = self.adapter.remove_product(prod_id, username)
        return product

    def send_order(self, username: str) -> None:
        """
        @brief invia l'ordine
        @param username: il cliente che sta inviando l'ordine
        @raise CartEmptyException se il carrello è vuoto
        @return None
        @req TODO
        """
        try:
            self.adapter.send_order(username)
        except CartEmptyException as e:
            raise CartEmptyException(
                f"Impossibile inviare l'ordine: il carrello di '{username}' è vuoto"
            ) from e
