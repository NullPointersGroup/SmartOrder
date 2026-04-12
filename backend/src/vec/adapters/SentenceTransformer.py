from typing import cast
import numpy as np
from numpy.typing import NDArray
from src.vec.ports.EmbedderPort import EmbedderPort
from sentence_transformers import SentenceTransformer


class SentenceTransformerEmbedder(EmbedderPort):
    def __init__(self) -> None:
        self.embedder = SentenceTransformer("all-MiniLM-L6-v2")

    def embed(self, text: str) -> NDArray[np.float32]:
        encoded = self.embedder.encode(
            text, convert_to_numpy=True, normalize_embeddings=True
        )
        return cast(NDArray[np.float32], np.asarray(encoded, dtype=np.float32))
