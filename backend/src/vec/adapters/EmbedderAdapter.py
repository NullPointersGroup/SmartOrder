from langchain_openai import OpenAIEmbeddings
import numpy as np

from src.vec.ports.EmbedderPort import EmbedderPort


class EmbedderAdapter(EmbedderPort):
    def __init__(self) -> None:
        self.embedder = OpenAIEmbeddings()

    def embed(self, text: str) -> np.ndarray:
        vector = self.embedder.embed_query(text)
        return np.array(vector, dtype=np.float32)
