class ProductNotFoundException(Exception):
    def __init__(self, prod_id: str) -> None:
        super().__init__(f"Prodotto {prod_id} non trovato nel catalogo")


class ProductNotInCartException(Exception):
    def __init__(self, prod_id: str, username: str) -> None:
        super().__init__(f"Prodotto {prod_id} non trovato nel carrello di {username}")

class CartEmptyException(Exception):
    def __init__(self, username: str) -> None:
        super().__init__(f"Il carrello di {username} è vuoto")