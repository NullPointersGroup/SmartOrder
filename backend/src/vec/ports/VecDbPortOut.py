from abc import ABC, abstractmethod
from faiss import np


class VecDbPortOut(ABC):
    @abstractmethod
    def search(self, v: np.ndarray, n: int, threshold: float) -> list[str]:
        """Ritorna lista prodotti simili"""
        pass

    @abstractmethod
    def add(self, prod_id: str, vector: np.ndarray) -> None:
        """Aggiunge un prodotto al database vettoriale"""
        pass
