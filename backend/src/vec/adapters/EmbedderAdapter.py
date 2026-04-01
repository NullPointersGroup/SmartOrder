# from langchain_openai import OpenAIEmbeddings
import numpy as np
from sentence_transformers import SentenceTransformer  # type: ignore
from src.vec.ports.EmbedderPort import EmbedderPort


class EmbedderAdapter(EmbedderPort):
    def __init__(self) -> None:
        self.embedder = SentenceTransformer("all-MiniLM-L6-v2")

    def embed(self, text: str) -> np.ndarray:
        return self.embedder.encode(
            text, convert_to_numpy=True, normalize_embeddings=True
        ).astype(np.float32)
