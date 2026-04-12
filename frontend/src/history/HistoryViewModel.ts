import { useState, useCallback } from 'react'
import type { Order } from './HistoryModel'
import { useAuthStore } from '../auth/authStore'
import { getHistoryCustomer, getHistoryAdmin, duplicateOrder as apiduplicateOrder } from './HistoryModel'

export function useHistoryViewModel() {
  /**
   * @brief ViewModel per la gestione dello storico ordini.
   *   Espone stato e azioni per caricare, visualizzare e duplicare ordini,
   *   adattando il comportamento al ruolo dell'utente (cliente o admin).
   * @return Oggetto contenente:
   *   - ordini: lista degli ordini della pagina corrente
   *   - pagina: numero della pagina attualmente visualizzata
   *   - totalePagine: numero totale di pagine disponibili
   *   - ordineScelto: ordine selezionato per il dettaglio, null se nessuno
   *   - loading: true durante il caricamento degli ordini
   *   - errore: messaggio di errore del caricamento, null se assente
   *   - erroreDuplica: messaggio di errore della duplicazione, null se assente
   *   - isAdmin: true se l'utente autenticato ha ruolo admin
   *   - loadPage: funzione asincrona per caricare una pagina di ordini
   *   - openDetail: funzione per selezionare un ordine e aprirne il dettaglio
   *   - closeDetail: funzione per deselezionare l'ordine e chiudere il dettaglio
   *   - duplicateOrder: funzione asincrona per duplicare un ordine tramite codice
   */
  const [pagina, setPagina] = useState(1)
  const [ordini, setOrdini] = useState<Order[]>([])
  const [totalePagine, setTotalePagine] = useState(1)
  const [ordineScelto, setOrdineScelto] = useState<Order | null>(null)
  const [loading, setLoading] = useState(false)
  const [errore, setErrore] = useState<string | null>(null)
  const [erroreDuplica, setErroreDuplica] = useState<string | null>(null)
  const [startDate, setstartDate] = useState('');
  const [endDate, setendDate] = useState('');

  const isAdmin = !!useAuthStore((s) => s.admin)

  const loadPage = useCallback(async (n: number, di?: string, df?: string) => {
    const inizio = di ?? startDate;
    const fine = df ?? endDate;

    if (di !== undefined) setstartDate(di);
    if (df !== undefined) setendDate(df);

    setLoading(true);
    setErrore(null);
    try {
      const data = isAdmin
        ? await getHistoryAdmin(n, 10, inizio, fine)
        : await getHistoryCustomer(n, 10, inizio, fine);

      setOrdini(data.ordini as Order[]);
      setTotalePagine(data.totale_pagine);
      setPagina(n);
    } catch (e) {
      setErrore(e instanceof Error ? e.message : 'Errore nel caricamento dello storico');
    } finally {
      setLoading(false);
    }
  }, [isAdmin, startDate, endDate]);

  const openDetail = (order: Order) => setOrdineScelto(order)
  const closeDetail = () => setOrdineScelto(null)

  const duplicateOrder = async (codeOrder: string) => {
    setErroreDuplica(null)
    try {
      await apiduplicateOrder(codeOrder)
    } catch (e) {
      setErroreDuplica(e instanceof Error ? e.message : "Errore nella duplicazione dell'ordine") // RF-OB_106
    }
  }

  return {
    ordini,
    pagina,
    totalePagine,
    ordineScelto,
    loading,
    errore,
    erroreDuplica,
    isAdmin,
    loadPage,
    openDetail,
    closeDetail,
    duplicateOrder,
  }
}
