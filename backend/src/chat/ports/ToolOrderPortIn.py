from abc import ABC, abstractmethod
from datetime import date

from src.storico.StoricoSchemas import StoricoPageSchema


class ToolOrderPortIn(ABC):
    @abstractmethod
    def get_ordini(
        self,
        pagina: int = 1,
        data_inizio: date | None = None,
        data_fine: date | None = None,
    ) -> StoricoPageSchema:
        pass
