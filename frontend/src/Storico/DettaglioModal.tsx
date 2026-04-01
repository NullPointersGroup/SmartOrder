import React, { useEffect, useRef } from 'react'
import type { Ordine } from './StoricoModel'

interface DettaglioModalProps {
  readonly ordine: Ordine
  readonly isAdmin: boolean
  readonly onChiudi: () => void
  readonly onDuplica: (codice: string) => void
  readonly erroreDuplica: string | null
}

export const DettaglioModal: React.FC<DettaglioModalProps> = ({
  ordine,
  isAdmin,
  onChiudi,
  onDuplica,
  erroreDuplica,
}) => {
  const [confermaDuplica, setConfermaDuplica] = React.useState(false)
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

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 z-50 p-0 m-0 w-screen h-screen bg-transparent flex items-center justify-center backdrop:bg-black/40 backdrop:backdrop-blur-[2px]"
    >
      <div className="bg-(--bg-3) w-full max-w-lg mx-4 rounded-2xl shadow-2xl overflow-hidden border border-(--border)">

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

        {/* Duplicazione (solo per cliente) */}
        {!isAdmin && (
          <div className="px-6 py-4 border-t border-(--border) bg-(--bg-2)">
            {erroreDuplica && (
              <p className="text-xs text-(--error) mb-3 flex items-center gap-1.5">
                {erroreDuplica}
              </p>
            )}

            {confermaDuplica ? (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    onDuplica(ordine.codice_ordine)
                    setConfermaDuplica(false)
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
            ) : (
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
            )}
          </div>
        )}
      </div>
    </dialog>
  )
}