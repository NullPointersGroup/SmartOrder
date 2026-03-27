import faiss
import numpy as np


class FaissCatalogDb:
    def __init__(self, dimension: int = 384) -> None:
        self.index = faiss.IndexFlatL2(dimension)
        self.prod_ids: list[str] = []

    def add(self, prod_id: str, vector: np.ndarray) -> None:
        vector_f32 = np.array(vector, dtype=np.float32).reshape(1, -1)
        self.index.add(vector_f32)  # pyright: ignore
        self.prod_ids.append(prod_id)

    def search(self, vector: np.ndarray, n: int, threshold: float) -> list[str]:
        vector_f32 = np.array(vector, dtype=np.float32).reshape(1, -1)

        distances, labels = self.index.search(vector_f32, n)  # pyright: ignore
        return [
            self.prod_ids[i]
            for i, d in zip(labels[0], distances[0])
            if d <= threshold and i != -1
        ]
