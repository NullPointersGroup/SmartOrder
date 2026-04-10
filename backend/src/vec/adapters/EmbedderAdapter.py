from typing import cast
import numpy as np
from numpy.typing import NDArray
from src.vec.SentenceTransformerEmbedder import SentenceTransformerEmbedder
from src.vec.ports.EmbedderPort import EmbedderPort
from sentence_transformers import SentenceTransformer  # pyright: ignore


class EmbedderAdapter(EmbedderPort):
    def __init__(
        self, sentence_transformer_embedder: SentenceTransformerEmbedder
    ) -> None:
        self.sentence_transformer_embedder = sentence_transformer_embedder

    def embed(self, text: str) -> NDArray[np.float32]:
        return self.sentence_transformer_embedder.embed(text)

