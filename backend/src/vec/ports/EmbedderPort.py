from abc import ABC, abstractmethod
import numpy as np


class EmbedderPort(ABC):
    @abstractmethod
    def embed(self, text: str) -> np.ndarray:
        pass
