import { useState, useCallback } from 'react'
import type { Ordine } from './StoricoModel'
import { useAuthStore } from '../auth/authStore'
import { getStoricoCliente, getStoricoAdmin, duplicaOrdine as apiDuplicaOrdine } from './StoricoAPI'

export function useStoricoViewModel() {
  const [pagina, setPagina] = useState(1)
  const [ordini, setOrdini] = useState<Ordine[]>([])
  const [totalePagine, setTotalePagine] = useState(1)
  const [ordineScelto, setOrdineScelto] = useState<Ordine | null>(null)
  const [loading, setLoading] = useState(false)
  const [errore, setErrore] = useState<string | null>(null)
  const [erroreDuplica, setErroreDuplica] = useState<string | null>(null)
  const role = useAuthStore((s) => s.admin)

  const isAdmin = role === 'admin'

  // RF-OB_91 / RF-OB_92 — lazy loading, max 10 per pagina
  const caricaPagina = useCallback(async (n: number) => {
    setLoading(true)
    setErrore(null)
    try {
      // RF-OB_89 / RF-OB_90 — endpoint diverso per ruolo
      const data = isAdmin
        ? await getStoricoAdmin(n, 10)
        : await getStoricoCliente(n, 10)

      console.log(data)

      setOrdini(data.ordini as Ordine[])
      setTotalePagine(data.totale_pagine)
      setPagina(n)
    } catch (e) {
      setErrore(e instanceof Error ? e.message : 'Errore nel caricamento dello storico')
    } finally {
      setLoading(false)
    }
  }, [isAdmin])

  // RF-OB_93 / RF-OB_97
  const apriDettaglio = (ordine: Ordine) => setOrdineScelto(ordine)
  const chiudiDettaglio = () => setOrdineScelto(null)

  // RF-OB_103-106 — solo cliente
  const duplicaOrdine = async (codice: string) => {
    setErroreDuplica(null)
    try {
      await apiDuplicaOrdine(codice)
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
    caricaPagina,
    apriDettaglio,
    chiudiDettaglio,
    duplicaOrdine,
  }
}