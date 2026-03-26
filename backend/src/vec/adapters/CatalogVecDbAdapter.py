import numpy as np
from src.vec.adapters.FaissCatalogDb import FaissCatalogDb
from src.vec.ports.VecDbPortOut import VecDbPortOut
from src.vec.ports.EmbedderPort import EmbedderPort


class CatalogVecDbAdapter(VecDbPortOut):
    def __init__(self, faiss_db: FaissCatalogDb) -> None:
        self.faiss_db = faiss_db

    def search(self, v: np.ndarray, n: int, threshold: float) -> list[int]:
        return self.faiss_db.search(v, n, threshold)
