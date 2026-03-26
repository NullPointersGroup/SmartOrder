from abc import ABC, abstractmethod


class VecDbPortIn(ABC):
    @abstractmethod
    def get_cart(self, username: str) -> None:
        """Ritorna tutti i prod_id nel carrello dell'utente"""
        pass

    @abstractmethod
    def get_catalog(self) -> None:
        """Ricarica/aggiorna l'indice FAISS del catalogo dal database di prodotti"""
        pass
