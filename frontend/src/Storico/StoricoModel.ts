export interface Prodotto {
  nome: string          // RF-OB_99
  descrizione: string   // RF-OB_100
  quantita: number      // RF-OB_101
}

export interface Ordine {
  codice_ordine: string  // RF-OB_94
  numero_ordine: number  // RF-OB_102
  data: string           // RF-OB_95
  username?: string      // RF-OB_96 solo admin
  prodotti: Prodotto[]   // RF-OB_98
}

export interface StoricoPage {
  ordini: Ordine[]
  pagina_corrente: number
  totale_pagine: number
}

export type UserRole = 'admin' | 'cliente'