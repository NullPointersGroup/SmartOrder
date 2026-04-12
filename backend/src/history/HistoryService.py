import math
from collections import defaultdict
from typing import List
from datetime import date

from src.history.ports.HistoryAdapterPort import HistoryAdapterPort
from src.db.models import Order
from src.history.HistorySchemas import OrderSchema, ProductSchema, HistoryPageSchema
from src.history.exceptions import OrdersNotFoundException, OrderNotFoundException, UserOrdersNotFoundException

PER_PAGE_DEFAULT = 10


class HistoryService:

    def __init__(self, adapter: HistoryAdapterPort):
        """
        @brief Inizializza il servizio storico con il repository fornito
        @param repo Implementazione del porto repository per lo storico
        """
        self.adapter = adapter
        

    def _build_page(
        self,
        orders: List[Order],
        total: int,
        page: int,
        per_page: int,
        include_username: bool
    ) -> HistoryPageSchema:
        """
        @brief Costruisce la pagina di storico con ordini e relativi prodotti
        @param ordini_orm Lista degli ordini dal database
        @param totale Numero totale di ordini
        @param pagina Numero della pagina corrente
        @param per_pagina Numero di ordini per pagina
        @param include_username Se True include il nome utente nell'output
        @return HistoryPageSchema con ordini, pagina corrente e totale pagine
        """
        ordine_ids = [o.id_ord for o in orders if o.id_ord is not None]
        prodotti_orm = self.adapter.get_products_by_order_ids(ordine_ids)

        prodotti_per_ordine: dict[int, list[ProductSchema]] = defaultdict(list)
        for det, art in prodotti_orm:
            if det.id_ord is not None:
                prodotti_per_ordine[det.id_ord].append(
                    ProductSchema(nome=art.prod_des, quantita=det.qta_ordinata)
                )

        ordini_schema = [
            OrderSchema(
                codice_ordine=str(o.id_ord),
                data=o.data.isoformat() if o.data else None,
                username=o.username if include_username else None,
                prodotti=prodotti_per_ordine.get(o.id_ord, []) if o.id_ord is not None else [],
            )
            for o in orders
        ]

        totale_pagine = max(1, math.ceil(total / per_page))
        return HistoryPageSchema(ordini=ordini_schema, pagina_corrente=page, totale_pagine=totale_pagine)


    def get_orders_customer(
        self,
        username: str,
        page: int = 1,
        per_page: int = PER_PAGE_DEFAULT,
        start_date: date | None = None,
        end_date: date | None = None
    ) -> HistoryPageSchema:
        """
        @brief Recupera gli ordini di un cliente specifico con paginazione
        @param username Nome dell'utente cliente
        @param pagina Numero della pagina richiesta (default 1)
        @param per_pagina Ordini per pagina (default PER_PAGINA_DEFAULT)
        @return HistoryPageSchema con gli ordini del cliente
        @throws OrdiniNotFoundException se l'utente non ha ordini
        """
        orders, total = self.adapter.get_orders_by_username(username, page, per_page, start_date, end_date)

        _, totale_senza_filtri = self.adapter.get_orders_by_username(username, 1, 1)
        if totale_senza_filtri == 0:
            raise UserOrdersNotFoundException(username)

        return self._build_page(orders, total, page, per_page, include_username=False)

    def get_orders_admin(
        self,
        page: int = 1,
        per_page: int = PER_PAGE_DEFAULT,
        start_date: date | None = None,
        end_date: date | None = None
    ) -> HistoryPageSchema:
        """
        @brief Recupera tutti gli ordini (vista admin) con paginazione
        @param pagina Numero della pagina richiesta (default 1)
        @param per_pagina Ordini per pagina (default PER_PAGINA_DEFAULT)
        @return HistoryPageSchema con tutti gli ordini inclusi gli username
        """
        ordini_orm, totale = self.adapter.get_all_orders(page, per_page, start_date, end_date)
        
        _, totale_senza_filtri = self.adapter.get_all_orders(1, 1)
        if totale_senza_filtri == 0:
            raise OrdersNotFoundException()
        
        return self._build_page(ordini_orm, totale, page, per_page, include_username=True)

    def duplicate_order(self, code_order: str, username: str) -> None:
        """
        @brief Duplica un ordine esistente per un utente
        @param codice_ordine Codice dell'ordine da duplicare
        @param username Nome dell'utente che duplica l'ordine
        @throws OrdineNotFoundException se l'ordine con il codice specificato non esiste
        """
        try:
            self.adapter.duplicate_order(code_order, username)
        except ValueError as e:
            raise OrderNotFoundException(code_order) from e

    def get_user_product_preferences(self, username: str) -> List[tuple[str, str, int]]:
        return self.adapter.get_all_products_by_username(username)
