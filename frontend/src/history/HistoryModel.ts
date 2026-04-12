export interface Product {
  nome: string
  descrizione: string
  quantita: number
}

export interface Order {
  codice_ordine: string
  numero_ordine: number
  data: string
  username?: string
  prodotti: Product[]
}

export interface HistoryPage {
  ordini: Order[]
  pagina_corrente: number
  totale_pagine: number
}

// ─── Tipi ────────────────────────────────────────────────────────────────────

export interface ProductSchema {
  nome: string;
  quantita: number;
}

export interface OrderSchema {
  codice_ordine: string;
  data: string;
  prodotti: ProductSchema[];
  cliente?: string;
}

export interface HistoryPageSchema {
  ordini: OrderSchema[];
  pagina_corrente: number;
  totale_pagine: number;
}

// ─── API ─────────────────────────────────────────────────────────────────────

export async function getHistoryCustomer(
  page: number = 1,
  perPage: number = 10,
  startDate?: string,
  endDate?: string,
): Promise<HistoryPageSchema> {
  /**
   * @brief Recupera lo storico ordini dell'utente autenticato (cliente).
   * @param pagina: il numero della pagina da visualizzare
   * @param perPagina: il numero di quanti ordini visualizzare ad ogni pagina, di default è 10
   * @raise ExceptionType Condition or description
   * @return HistoryPageSchema: lista degli ordini, pagina corrente e e totale pagine
   */
  const params = new URLSearchParams({
    page: String(page),
    per_pagina: String(perPage)
  });

  if (startDate) params.append('data_inizio', startDate);
  if (endDate) params.append('data_fine', endDate);

  const res = await fetch(`/api/history/miei?${params}`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? `Errore ${res.status}`);
  }

  return res.json() as Promise<HistoryPageSchema>;
}

export async function getHistoryAdmin(
  page: number = 1,
  perPage: number = 10,
  startDate?: string,
  endDate?: string,
): Promise<HistoryPageSchema> {
  /**
   * @brief Recupera lo storico ordini di tutti gli utenti
   * @param pagina: il numero della pagina da visualizzare
   * @param perPagina: il numero di quanti ordini visualizzare ad ogni pagina, di default è 10
   * @raise ExceptionType Condition or description
   * @return HistoryPageSchema: lista degli ordini, pagina corrente e e totale pagine
   */
  const params = new URLSearchParams({
    page: String(page),
    per_pagina: String(perPage)
  });

  if (startDate) params.append('data_inizio', startDate);
  if (endDate) params.append('data_fine', endDate);

  const res = await fetch(`/api/history/tutti?${params}`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? `Errore ${res.status}`);
  }

  return res.json() as Promise<HistoryPageSchema>;
}

export async function duplicateOrder(codeOrder: string): Promise<void> {
  /**
   * @brief Duplica un ordine esistente
   * @param codiceOrdine: string il codice dell'Ordine
   */
  const res = await fetch(`/api/history/duplicate_order/${encodeURIComponent(codeOrder)}`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? `Errore ${res.status}`);
  }
}
