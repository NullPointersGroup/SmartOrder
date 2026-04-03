// ─── Tipi ────────────────────────────────────────────────────────────────────

export interface ProdottoSchema {
  nome: string;
  quantita: number;
}

export interface OrdineSchema {
  codice_ordine: string;
  data: string;
  prodotti: ProdottoSchema[];
  cliente?: string;
}

export interface StoricoPageSchema {
  ordini: OrdineSchema[];
  pagina_corrente: number;
  totale_pagine: number;
}

// ─── API ─────────────────────────────────────────────────────────────────────

export async function getStoricoCliente(
  pagina: number = 1,
  perPagina: number = 10,
  dataInizio?: string,
  dataFine?: string,
): Promise<StoricoPageSchema> {
  /**
   * @brief Recupera lo storico ordini dell'utente autenticato (cliente).
   * @param pagina: il numero della pagina da visualizzare
   * @param perPagina: il numero di quanti ordini visualizzare ad ogni pagina, di default è 10
   * @raise ExceptionType Condition or description
   * @return StoricoPageSchema: lista degli ordini, pagina corrente e e totale pagine
   */
  const params = new URLSearchParams({
    pagina: String(pagina),
    per_pagina: String(perPagina)
  });

  if (dataInizio) params.append('data_inizio', dataInizio);
  if (dataFine) params.append('data_fine', dataFine);

  const res = await fetch(`/storico/miei?${params}`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? `Errore ${res.status}`);
  }

  return res.json() as Promise<StoricoPageSchema>;
}

export async function getStoricoAdmin(
  pagina: number = 1,
  perPagina: number = 10,
  dataInizio?: string,
  dataFine?: string,
): Promise<StoricoPageSchema> {
  /**
   * @brief Recupera lo storico ordini di tutti gli utenti
   * @param pagina: il numero della pagina da visualizzare
   * @param perPagina: il numero di quanti ordini visualizzare ad ogni pagina, di default è 10
   * @raise ExceptionType Condition or description
   * @return StoricoPageSchema: lista degli ordini, pagina corrente e e totale pagine
   */
  const params = new URLSearchParams({
    pagina: String(pagina),
    per_pagina: String(perPagina)
  });

  if (dataInizio) params.append('data_inizio', dataInizio);
  if (dataFine) params.append('data_fine', dataFine);

  const res = await fetch(`/storico/tutti?${params}`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? `Errore ${res.status}`);
  }

  return res.json() as Promise<StoricoPageSchema>;
}

export async function duplicaOrdine(codiceOrdine: string): Promise<void> {
  /**
   * @brief Duplica un ordine esistente
   * @param codiceOrdine: string il codice dell'Ordine
   */
  const res = await fetch(`/storico/duplica/${encodeURIComponent(codiceOrdine)}`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? `Errore ${res.status}`);
  }
}