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

export async function getStoricoCliente(
  pagina: number = 1,
  perPagina: number = 10,
  dataInizio?: string,
  dataFine?: string,
): Promise<HistoryPageSchema> {
  /**
   * @brief Recupera lo storico ordini dell'utente autenticato (cliente).
   * @param pagina: il numero della pagina da visualizzare
   * @param perPagina: il numero di quanti ordini visualizzare ad ogni pagina, di default è 10
   * @raise ExceptionType Condition or description
   * @return HistoryPageSchema: lista degli ordini, pagina corrente e e totale pagine
   */
  const params = new URLSearchParams({
    pagina: String(pagina),
    per_pagina: String(perPagina)
  });

  if (dataInizio) params.append('data_inizio', dataInizio);
  if (dataFine) params.append('data_fine', dataFine);

  const res = await fetch(`/api/storico/miei?${params}`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? `Errore ${res.status}`);
  }

  return res.json() as Promise<HistoryPageSchema>;
}

export async function getStoricoAdmin(
  pagina: number = 1,
  perPagina: number = 10,
  dataInizio?: string,
  dataFine?: string,
): Promise<HistoryPageSchema> {
  /**
   * @brief Recupera lo storico ordini di tutti gli utenti
   * @param pagina: il numero della pagina da visualizzare
   * @param perPagina: il numero di quanti ordini visualizzare ad ogni pagina, di default è 10
   * @raise ExceptionType Condition or description
   * @return HistoryPageSchema: lista degli ordini, pagina corrente e e totale pagine
   */
  const params = new URLSearchParams({
    pagina: String(pagina),
    per_pagina: String(perPagina)
  });

  if (dataInizio) params.append('data_inizio', dataInizio);
  if (dataFine) params.append('data_fine', dataFine);

  const res = await fetch(`/api/storico/tutti?${params}`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? `Errore ${res.status}`);
  }

  return res.json() as Promise<HistoryPageSchema>;
}

export async function duplicaOrdine(codiceOrdine: string): Promise<void> {
  /**
   * @brief Duplica un ordine esistente
   * @param codiceOrdine: string il codice dell'Ordine
   */
  const res = await fetch(`/api/storico/duplica/${encodeURIComponent(codiceOrdine)}`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? `Errore ${res.status}`);
  }
}
