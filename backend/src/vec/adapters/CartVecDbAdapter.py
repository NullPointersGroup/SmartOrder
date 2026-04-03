from typing import TYPE_CHECKING

import numpy as np

from src.vec.ports.VecDbPortOut import VecDbPortOut

if TYPE_CHECKING:
    from src.vec.adapters.FaissCartDb import FaissCartDb


class CartVecDbAdapter(VecDbPortOut):
    def __init__(self, faiss_db: "FaissCartDb", username: str) -> None:
        self.faiss_db = faiss_db
        self.username = username

    def reset(self) -> None:
        self.faiss_db.reset()

    def search(self, v: np.ndarray, n: int, threshold: float) -> list[str]:
        return self.faiss_db.search(v, n, threshold, self.username)

    def add(self, prod_id: str, vector: np.ndarray) -> None:
        self.faiss_db.add(prod_id, self.username, vector)
