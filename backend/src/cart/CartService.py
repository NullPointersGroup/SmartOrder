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

    def send_order(self, username: str) -> None:
        """
        @brief invia l'ordine
        @param username: il cliente che sta inviando l'ordine
        @raise CartEmptyException se il carrello è vuoto
        @return None
        """
        try:
            self.adapter.send_order(username)
        except CartEmptyException as e:
            raise CartEmptyException(
                f"Impossibile inviare l'ordine: il carrello di '{username}' è vuoto"
            ) from e
