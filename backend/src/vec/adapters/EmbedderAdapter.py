# EmbedderAdapter.py

from typing import cast
import numpy as np
from numpy.typing import NDArray
from src.vec.ports.EmbedderPort import EmbedderPort

_model = None

def _get_model():
    global _model
    if _model is None:
        from sentence_transformers import SentenceTransformer
        _model = SentenceTransformer("all-MiniLM-L6-v2")
    return _model


class EmbedderAdapter(EmbedderPort):
    def __init__(self) -> None:
        self.embedder = _get_model()

    def embed(self, text: str) -> NDArray[np.float32]:
        encoded = self.embedder.encode(
            text, convert_to_numpy=True, normalize_embeddings=True
        )
        return cast(NDArray[np.float32], np.asarray(encoded, dtype=np.float32))