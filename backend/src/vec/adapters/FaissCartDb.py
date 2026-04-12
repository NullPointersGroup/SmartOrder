import faiss
import numpy as np


class FaissCartDb:
    def __init__(self, dimension: int = 384) -> None:
        self.dimension = dimension
        self.index = faiss.IndexFlatL2(dimension)
        self.prod_ids: list[str] = []

        self.user_map: dict[str, list[int]] = {}

    def reset(self) -> None:
        self.index = faiss.IndexFlatL2(self.dimension)
        self.prod_ids = []
        self.user_map = {}

    def add(self, prod_id: str, username: str, vector: np.ndarray) -> None:
        vector_f32 = np.array(vector, dtype=np.float32).reshape(1, -1)
        self.index.add(vector_f32)  # pyright: ignore
        pos = len(self.prod_ids)
        self.prod_ids.append(prod_id)
        self.user_map.setdefault(username, []).append(pos)

    def search(
        self, vector: np.ndarray, n: int, threshold: float, username: str
    ) -> list[str]:
        msg = f"[DEBUG] FAISSDB: L'AI usa il threshold: {threshold} per cercare il prodotto nel carrello"
        print(f"\033[30;43m  {msg}  \033[0m")
        vector_f32 = np.array(vector, dtype=np.float32).reshape(1, -1)
        user_positions = set(self.user_map.get(username, []))
        distances, labels = self.index.search(vector_f32, n)  # pyright: ignore
        return [
            self.prod_ids[i]
            for i, d in zip(labels[0], distances[0])
            if d <= threshold and i != -1 and i in user_positions
        ]
