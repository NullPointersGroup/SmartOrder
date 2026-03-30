import React from 'react'
import { useStoricoViewModel } from './StoricoViewModel'
import type { UserRole } from './StoricoModel'
import { usePageTitle } from '../hooks/usePageTitle'
import { OrdineRow } from './OrdineRow'
import { DettaglioModal } from './DettaglioModal'
import { Paginazione } from './Paginazione'

interface StoricoViewProps {
  readonly role: UserRole
}

export const StoricoView: React.FC<StoricoViewProps> = ({ role }) => {
  usePageTitle("Storico")
  const {
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
  } = useStoricoViewModel(role)

  let contenutoTabella: React.ReactNode
  if (loading) {
    contenutoTabella = (
      <div className="flex items-center justify-center py-20 text-(--text-4) text-sm">
        Caricamento…
      </div>
    )
  } else if (errore) {
    contenutoTabella = (
      <div className="flex items-center justify-center py-20 text-(--error) text-sm">
        {errore}
      </div>
    )
  } else if (ordini.length === 0) {
    contenutoTabella = (
      <div className="flex items-center justify-center py-20 text-(--text-4) text-sm">
        Nessun ordine trovato.
      </div>
    )
  } else {
    contenutoTabella = (
      <>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-(--border) bg-(--bg-2)">
                <th className="py-2.5 px-4 text-xs font-semibold uppercase tracking-widest text-(--text-4)">
                  N°
                </th>
                <th className="py-2.5 px-4 text-xs font-semibold uppercase tracking-widest text-(--text-4)">
                  Codice
                </th>
                <th className="py-2.5 px-4 text-xs font-semibold uppercase tracking-widest text-(--text-4)">
                  Data
                </th>
                {isAdmin && (
                  <th className="py-2.5 px-4 text-xs font-semibold uppercase tracking-widest text-(--text-4)">
                    Cliente
                  </th>
                )}
                <th className="py-2.5 px-4 text-xs font-semibold uppercase tracking-widest text-(--text-4)">
                  Prodotti
                </th>
                <th />
              </tr>
            </thead>
            <tbody>
              {ordini.map((ordine) => (
                <OrdineRow
                  key={ordine.codice_ordine}
                  ordine={ordine}
                  isAdmin={isAdmin}
                  onApriDettaglio={apriDettaglio}
                />
              ))}
            </tbody>
          </table>
        </div>

        <Paginazione
          pagina={pagina}
          totalePagine={totalePagine}
          onCambia={caricaPagina}
        />
      </>
    )
  }

  return (
    <div className="min-h-screen bg-(--bg-1)">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="mb-8">
          <p className="text-xs font-mono uppercase tracking-widest text-(--text-4) mb-1">
            {isAdmin ? 'Pannello Admin' : 'Area Cliente'}
          </p>
          <h1 className="text-2xl font-semibold text-(--text-1) tracking-tight">
            Storico Ordini
          </h1>
          {isAdmin && (
            <p className="text-sm text-(--text-4) mt-1">
              Visualizzazione completa — tutti i clienti
            </p>
          )}
        </div>

        <div className="bg-(--bg-3) border border-(--border) rounded-sm shadow-sm overflow-hidden">
          {contenutoTabella}
        </div>
      </div>

      {ordineScelto && (
        <DettaglioModal
          ordine={ordineScelto}
          isAdmin={isAdmin}
          onChiudi={chiudiDettaglio}
          onDuplica={duplicaOrdine}
          erroreDuplica={erroreDuplica}
        />
      )}
    </div>
  )
}