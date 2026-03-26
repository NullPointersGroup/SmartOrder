from abc import ABC, abstractmethod
from faiss import np


class VecDbPortOut(ABC):
    @abstractmethod
    def search(self, v: np.ndarray, n: int, threshold: float) -> list[int]:
        """Ritorna lista prodotti simili"""
        pass
