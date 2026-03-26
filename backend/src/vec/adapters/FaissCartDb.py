import faiss
import numpy as np


class FaissCartDb:
    def __init__(self, dimension: int = 384) -> None:
        self.index = faiss.IndexFlatL2(dimension)
        self.prod_ids: list[str] = []

        self.user_map: dict[str, list[int]] = {}

    def add(self, prod_id: str, username: str, vector: np.ndarray):
        vector_f32 = np.ndarray(vector, dtype=np.float32).reshape(1, -1)
        self.index.add(1, vector_f32)
        pos = len(self.prod_ids)
        self.prod_ids.append(prod_id)
        self.user_map.setdefault(username, []).append(pos)

    def search(
        self, vector: np.ndarray, n: int, threshold: float, username: str
    ) -> list[int]:
        vector_f32 = np.array(vector, dtype=np.float32).reshape(1, -1)
        distances = np.empty((1, n), dtype=np.float32)
        labels = np.empty((1, n), dtype=np.int64)
        self.index.search(1, vector_f32, n, distances, labels)  # type: ignore
        user_positions = set(self.user_map.get(username, []))
        return [
            self.prod_ids[i]
            for i, d in zip(labels[0], distances[0])
            if d <= threshold and i != -1 and i in user_positions
        ]
