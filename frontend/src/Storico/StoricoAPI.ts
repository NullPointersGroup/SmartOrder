// ─── Tipi ────────────────────────────────────────────────────────────────────

export interface ProdottoSchema {
  nome: string;
  quantita: number;
}

export interface OrdineSchema {
  codice_ordine: string;
  data: string;           // ISO 8601, es. "2024-03-15T10:30:00"
  prodotti: ProdottoSchema[];
  cliente?: string;       // presente solo nella vista admin
}

export interface StoricoPageSchema {
  ordini: OrdineSchema[];
  pagina_corrente: number;
  totale_pagine: number;
}

// ─── API ─────────────────────────────────────────────────────────────────────

/**
 * Recupera lo storico ordini dell'utente autenticato (cliente).
 * Endpoint: GET /storico/miei
 */
export async function getStoricoCliente(
  pagina: number = 1,
  perPagina: number = 10,
): Promise<StoricoPageSchema> {
  console.log("CHIAMATO")
  const params = new URLSearchParams({
    pagina: String(pagina),
    per_pagina: String(perPagina),
  });

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

/**
 * Recupera lo storico ordini di tutti i clienti (solo admin).
 * Endpoint: GET /storico/tutti
 */
export async function getStoricoAdmin(
  pagina: number = 1,
  perPagina: number = 10,
): Promise<StoricoPageSchema> {
  const params = new URLSearchParams({
    pagina: String(pagina),
    per_pagina: String(perPagina),
  });

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

/**
 * Duplica un ordine esistente.
 * Endpoint: POST /storico/duplica/{codice_ordine}
 */
export async function duplicaOrdine(codiceOrdine: string): Promise<void> {
  const res = await fetch(`/storico/duplica/${encodeURIComponent(codiceOrdine)}`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? `Errore ${res.status}`);
  }
}