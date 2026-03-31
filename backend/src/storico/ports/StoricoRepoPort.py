from abc import ABC, abstractmethod
from typing import List
from src.storico.StoricoModels import Ordine


class StoricoRepoPort(ABC):

    @abstractmethod
    def get_ordini_by_username(self, username: str) -> List[Ordine]:
        """Restituisce tutti gli ordini di uno specifico utente."""
        raise NotImplementedError

    @abstractmethod
    def get_all_ordini(self) -> List[Ordine]:
        """Restituisce tutti gli ordini (admin)."""
        raise NotImplementedError