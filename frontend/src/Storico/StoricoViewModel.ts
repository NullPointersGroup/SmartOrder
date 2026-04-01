import { useState, useCallback } from 'react'
import type { Ordine, StoricoPage } from './StoricoModel'
import { useAuthStore } from '../auth/authStore'

export function useStoricoViewModel() {
  const [pagina, setPagina] = useState(1)
  const [ordini, setOrdini] = useState<Ordine[]>([])
  const [totalePagine, setTotalePagine] = useState(1)
  const [ordineScelto, setOrdineScelto] = useState<Ordine | null>(null)
  const [loading, setLoading] = useState(false)
  const [errore, setErrore] = useState<string | null>(null)
  const [erroreDuplica, setErroreDuplica] = useState<string | null>(null)
  const role = useAuthStore((s) => s.admin);

  // RF-OB_89 / RF-OB_90 — endpoint diverso per ruolo
  const endpoint = role === 'admin'
    ? '/storico/tutti'
    : '/storico/miei'

  // RF-OB_91 / RF-OB_92 — lazy loading, max 10 per pagina
  const caricaPagina = useCallback(async (n: number) => {
    setLoading(true)
    setErrore(null)
    try {
      const res = await fetch(`${endpoint}?pagina=${n}&per_pagina=10`)
      if (!res.ok) throw new Error()
      const data: StoricoPage = await res.json()
      setOrdini(data.ordini)
      setTotalePagine(data.totale_pagine)
      setPagina(n)
    } catch {
      setErrore('Errore nel caricamento dello storico')
    } finally {
      setLoading(false)
    }
  }, [endpoint])

  // RF-OB_93 / RF-OB_97
  const apriDettaglio = (ordine: Ordine) => setOrdineScelto(ordine)
  const chiudiDettaglio = () => setOrdineScelto(null)

  // RF-OB_103-106 — solo cliente
  const duplicaOrdine = async (codice: string) => {
    setErroreDuplica(null)
    try {
      const res = await fetch(`/storico/duplica/${codice}`, { method: 'POST' })
      if (!res.ok) throw new Error()
    } catch {
      setErroreDuplica('Errore nella duplicazione dell\'ordine') // RF-OB_106
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
    isAdmin: role === 'admin',
    caricaPagina,
    apriDettaglio,
    chiudiDettaglio,
    duplicaOrdine,
  }
}