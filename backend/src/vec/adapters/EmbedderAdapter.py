from typing import cast
import numpy as np
from numpy.typing import NDArray
from src.vec.ports.EmbedderPort import EmbedderPort


class EmbedderAdapter(EmbedderPort):
    def __init__(self) -> None:
        from sentence_transformers import SentenceTransformer

        self.embedder = SentenceTransformer("all-MiniLM-L6-v2")

    def embed(self, text: str) -> NDArray[np.float32]:
        encoded = self.embedder.encode(
            text, convert_to_numpy=True, normalize_embeddings=True
        )
        return cast(NDArray[np.float32], np.asarray(encoded, dtype=np.float32))