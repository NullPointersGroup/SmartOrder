import React, { useEffect, useRef, useState } from 'react'
import type { Order } from './HistoryModel'

interface OrderDetailsModalProps {
  readonly ordine: Order
  readonly isAdmin: boolean
  readonly onChiudi: () => void
  readonly onDuplica: (codice: string) => void
  readonly erroreDuplica: string | null
  readonly onRefresh: () => void
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  ordine,
  isAdmin,
  onChiudi,
  onDuplica,
  erroreDuplica,
  onRefresh
}) => {
  /**
  @brief crea il dettaglio di un ordine
  @param l'interfaccia DettaglioModalProps, utilizzati in modalità solo lettura
  @return Type Description
  @req RF-OB_76
  @req RF-OB_87
  @req RF-OB_88
  @req RF-OB_89
  @req RF-OB_90
  @req RF-OB_91
  @req RF-OB_92
  @req RF-OB_93
  @req RF-OB_94
  @req RF-OB_95
  @req RF-OB_96
   */
  const [confermaDuplica, setConfermaDuplica] = useState(false)
  const [duplicatoOk, setDuplicatoOk] = useState(false)
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    if (dialogRef.current) {
      dialogRef.current.showModal()
    }
  }, [])

  useEffect(() => {
    const dialog = dialogRef.current
    const handleClose = () => onChiudi()
    dialog?.addEventListener('close', handleClose)
    return () => dialog?.removeEventListener('close', handleClose)
  }, [onChiudi])

  // Chiude cliccando sul backdrop (il click arriva sul <dialog> stesso, non sui figli)
  const handleBackdropClick = () => {
    dialogRef.current?.close();
  };

  const duplicateContent = () => {
    if (confermaDuplica) {
      return (
        <div className="flex gap-2">
          <button
            onClick={() => {
              onDuplica(ordine.codice_ordine)
              setConfermaDuplica(false)
              setDuplicatoOk(false)
              setTimeout(() => onRefresh?.(), 300)
            }}
            className="flex-1 py-2.5 text-sm font-semibold bg-(--color-3) text-white hover:bg-(--color-4) transition-colors rounded-xl"
          >
            Conferma duplicazione
          </button>
          <button
            onClick={() => setConfermaDuplica(false)}
            className="flex-1 py-2.5 text-sm font-medium border border-(--border) text-(--text-3) hover:bg-(--bg-1) transition-colors rounded-xl"
          >
            Annulla
          </button>
        </div>
      )
    }

    if (duplicatoOk) {
      return (
        <p className="text-xs text-(--color-3) flex items-center gap-1.5 font-medium">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          Ordine duplicato con successo
        </p>
      )
    }

    return (
      <button
        onClick={() => setConfermaDuplica(true)}
        className="w-full py-2.5 text-sm font-semibold bg-(--color-2) text-white hover:bg-(--color-3) transition-colors rounded-xl flex items-center justify-center gap-2"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <rect x="9" y="9" width="13" height="13" rx="2"/>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
        </svg>
        Duplica ordine
      </button>
    )
  }

  return (
  <dialog
    ref={dialogRef}
    className="fixed inset-0 z-50 p-0 m-0 w-screen h-screen bg-transparent flex items-center justify-center backdrop:bg-black/40 backdrop:backdrop-blur-2"
  >
    {/* Overlay backdrop cliccabile */}
    <button
      className="absolute inset-0 w-full h-full cursor-default bg-transparent border-0 p-0"
      aria-label="Chiudi finestra"
      onClick={handleBackdropClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') dialogRef.current?.close();
      }}
      tabIndex={0}
    />

    <div className="relative z-10 bg-(--bg-3) w-full max-w-lg mx-4 rounded-2xl shadow-2xl overflow-hidden border border-(--border)">

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-(--border) bg-(--bg-2)">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-(--text-4) leading-none mb-0.5">Ordine</p>
            <h2 className="text-sm font-semibold font-mono text-(--text-1) tracking-tight">
              {ordine.codice_ordine}
            </h2>
          </div>
        </div>
        <button
          onClick={() => dialogRef.current?.close()}
          className="w-8 h-8 flex items-center justify-center rounded-xl text-(--text-4) hover:text-(--text-1) hover:bg-(--bg-1) transition-colors"
          aria-label="Chiudi"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <div className="px-6 py-3.5 flex gap-6 border-b border-(--border) text-sm bg-(--bg-3)">
        <div>
          <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-(--text-4)">Data</span>
          <p className="text-(--text-1) font-medium mt-0.5 text-sm">
            {new Date(ordine.data).toLocaleDateString('it-IT', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
        {isAdmin && ordine.username && (
          <div>
            <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-(--text-4)">Cliente</span>
            <p className="text-(--text-1) font-medium mt-0.5 text-sm">{ordine.username}</p>
          </div>
        )}
      </div>

      {/* Lista prodotti */}
      <div className="px-6 py-4 max-h-72 overflow-y-auto">
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-(--text-4) mb-3">
          Prodotti
        </p>
        <div className="space-y-2.5">
          {ordine.prodotti.map((p, i) => (
            <div
              key={p.nome + i}
              className="flex items-start justify-between gap-4 pb-2.5 border-b border-(--border) last:border-0 last:pb-0"
            >
              <div className="flex items-start gap-3 flex-1">
                <div>
                  <p className="text-sm font-semibold text-(--text-1)">{p.nome}</p>
                  {p.descrizione?.trim() && (
                    <p className="text-xs text-(--text-4) mt-0.5 leading-relaxed">
                      {p.descrizione}
                    </p>
                  )}
                </div>
              </div>
              <span className="text-xs font-mono font-semibold bg-(--color-1) text-(--color-3) px-2.5 py-1 rounded-full whitespace-nowrap shrink-0">
                × {p.quantita}
              </span>
            </div>
          ))}
        </div>
      </div>

      {!isAdmin && (
        <div className="px-6 py-4 border-t border-(--border) bg-(--bg-2)">
          {erroreDuplica && (
            <p className="text-xs text-(--error) mb-3 flex items-center gap-1.5">
              {erroreDuplica}
            </p>
          )}
          {duplicateContent()}
        </div>
      )}
    </div>
  </dialog>
)
}
