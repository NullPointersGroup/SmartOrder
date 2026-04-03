export interface Prodotto {
  nome: string
  descrizione: string
  quantita: number
}

export interface Ordine {
  codice_ordine: string
  numero_ordine: number
  data: string
  username?: string
  prodotti: Prodotto[]
}

export interface StoricoPage {
  ordini: Ordine[]
  pagina_corrente: number
  totale_pagine: number
}