from typing import List, Tuple
from sqlmodel import Session
from src.history.ports.HistoryAdapterPort import HistoryAdapterPort
from src.history.HistoryRepository import HistoryRepository
from src.db.models import Order, OrdCliDet, Anaart
from datetime import date


class GetOrdersAdapter(HistoryAdapterPort):
    
    """
    @brief classe che si occupa di delegare alla classe repository i compiti
    """

    def __init__(self, db: Session):
        """
        @brief Inizializza l'adapter con la sessione del database
        @param db Sessione SQLModel per le operazioni sul database
        """
        self.repository = HistoryRepository(db)

    def get_orders_by_username(
        self, username: str, page: int, per_page: int, start_date: date | None = None, end_date: date | None = None
    ) -> Tuple[List[Order], int]:
        """
        @brief Recupera gli ordini di un utente specifico con paginazione
        @param username Nome dell'utente
        @param pagina Numero della pagina richiesta
        @param per_pagina Numero di ordini per pagina
        @return Tuple con lista degli ordini e totale degli ordini dell'utente
        """
        return self.repository.get_orders_by_username(username, page, per_page, start_date, end_date)

    def get_all_orders(
        self, page: int, per_page: int, start_date: date | None = None, end_date: date | None = None
    ) -> Tuple[List[Order], int]:
        """
        @brief Recupera tutti gli ordini (vista admin) con paginazione
        @param pagina Numero della pagina richiesta
        @param per_pagina Numero di ordini per pagina
        @return Tuple con lista degli ordini e totale complessivo
        """
        return self.repository.get_all_orders(page, per_page, start_date, end_date)

    def get_products_by_order_ids(self, order_ids: List[int]) -> List[Tuple[OrdCliDet, Anaart]]:
        """
        @brief Recupera i prodotti associati a una lista di ID ordini
        @param ordine_ids Lista di ID degli ordini
        @return Lista di tuple con dettaglio ordine e articolo
        """
        return self.repository.get_products_by_order_ids(order_ids)

    def duplicate_order(self, code_order: str, username: str) -> Order:
        """
        @brief Duplica un ordine esistente per un utente
        @param codice_ordine Codice dell'ordine da duplicare
        @param username Nome dell'utente che duplica l'ordine
        @return Ordine duplicato
        """
        return self.repository.duplicate_order(code_order, username)

    def get_all_products_by_username(self, username: str) -> List[Tuple[str, str, int]]:
        """
        @brief Recupera i prodotti associati ad uno username
        @param username: il nome dello username
        @return Lista di tuple contenente id prodotto, descrizione prodotto e quantità
        """
        return self.repository.get_all_products_by_username(username)
