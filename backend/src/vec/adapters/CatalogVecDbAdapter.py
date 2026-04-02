from typing import TYPE_CHECKING

import numpy as np
from src.vec.ports.VecDbPortOut import VecDbPortOut

if TYPE_CHECKING:
    from src.vec.adapters.FaissCatalogDb import FaissCatalogDb


class CatalogVecDbAdapter(VecDbPortOut):
    def __init__(self, faiss_db: "FaissCatalogDb") -> None:
        self.faiss_db = faiss_db

    def reset(self) -> None:
        self.faiss_db.reset()

    def search(self, v: np.ndarray, n: int, threshold: float) -> list[str]:
        return self.faiss_db.search(v, n, threshold)

    def add(self, prod_id: str, vector: np.ndarray) -> None:
        self.faiss_db.add(prod_id, vector)
