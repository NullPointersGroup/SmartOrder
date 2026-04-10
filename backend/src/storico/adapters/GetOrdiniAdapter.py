from typing import List, Tuple
from sqlmodel import Session
from src.storico.ports.StoricoAdapterPort import StoricoAdapterPort
from src.storico.StoricoRepository import StoricoRepository
from src.db.models import Ordine, OrdCliDet, Anaart
from datetime import date


class GetOrdiniAdapter(StoricoAdapterPort):
    
    """
    @brief classe che si occupa di delegare alla classe repository i compiti
    """

    def __init__(self, db: Session):
        """
        @brief Inizializza l'adapter con la sessione del database
        @param db Sessione SQLModel per le operazioni sul database
        """
        self.repository = StoricoRepository(db)

    def get_ordini_by_username(
        self, username: str, pagina: int, per_pagina: int, data_inizio: date | None = None, data_fine: date | None = None
    ) -> Tuple[List[Ordine], int]:
        """
        @brief Recupera gli ordini di un utente specifico con paginazione
        @param username Nome dell'utente
        @param pagina Numero della pagina richiesta
        @param per_pagina Numero di ordini per pagina
        @return Tuple con lista degli ordini e totale degli ordini dell'utente
        """
        return self.repository.get_ordini_by_username(username, pagina, per_pagina, data_inizio, data_fine)

    def get_all_ordini(
        self, pagina: int, per_pagina: int, data_inizio: date | None = None, data_fine: date | None = None
    ) -> Tuple[List[Ordine], int]:
        """
        @brief Recupera tutti gli ordini (vista admin) con paginazione
        @param pagina Numero della pagina richiesta
        @param per_pagina Numero di ordini per pagina
        @return Tuple con lista degli ordini e totale complessivo
        """
        return self.repository.get_all_ordini(pagina, per_pagina, data_inizio, data_fine)

    def get_prodotti_by_ordine_ids(self, ordine_ids: List[int]) -> List[Tuple[OrdCliDet, Anaart]]:
        """
        @brief Recupera i prodotti associati a una lista di ID ordini
        @param ordine_ids Lista di ID degli ordini
        @return Lista di tuple con dettaglio ordine e articolo
        """
        return self.repository.get_prodotti_by_ordine_ids(ordine_ids)

    def duplica_ordine(self, codice_ordine: str, username: str) -> Ordine:
        """
        @brief Duplica un ordine esistente per un utente
        @param codice_ordine Codice dell'ordine da duplicare
        @param username Nome dell'utente che duplica l'ordine
        @return Ordine duplicato
        """
        return self.repository.duplica_ordine(codice_ordine, username)

    def get_all_products_by_username(self, username: str) -> List[Tuple[str, str, int]]:
        """
        @brief Recupera i prodotti associati ad uno username
        @param username: il nome dello username
        @return Lista di tuple contenente id prodotto, descrizione prodotto e quantità
        """
        return self.repository.get_all_products_by_username(username)
