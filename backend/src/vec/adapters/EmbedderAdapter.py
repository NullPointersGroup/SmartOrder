from typing import cast
import numpy as np
from numpy.typing import NDArray
from src.vec.ports.EmbedderPort import EmbedderPort
from sentence_transformers import SentenceTransformer # Importalo fuori

# Carica il modello a livello di modulo (avviene solo all'import del file)
_SHARED_MODEL = SentenceTransformer("all-MiniLM-L6-v2")

class EmbedderAdapter(EmbedderPort):
    def __init__(self) -> None:
        # Ora usa il modello già caricato, non ne crea uno nuovo
        self.embedder = _SHARED_MODEL

    def embed(self, text: str) -> NDArray[np.float32]:
        encoded = self.embedder.encode(
            text, convert_to_numpy=True, normalize_embeddings=True
        )
        return cast(NDArray[np.float32], np.asarray(encoded, dtype=np.float32))
