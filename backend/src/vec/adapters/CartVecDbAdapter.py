import numpy as np

from src.vec.ports.VecDbPortOut import VecDbPortOut
from src.vec.adapters.FaissCartDb import FaissCartDb


class CartVecDbAdapter(VecDbPortOut):
    def __init__(self, faiss_db: FaissCartDb, username: str) -> None:
        self.faiss_db = faiss_db
        self.username = username

    def search(self, v: np.ndarray, n: int, threshold: float) -> list[int]:
        return self.faiss_db.search(v, n, threshold, self.username)
