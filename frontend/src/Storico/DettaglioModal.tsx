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
    const handleClose = () => {
      onChiudi()
    }
    dialog?.addEventListener('close', handleClose)
    return () => {
      dialog?.removeEventListener('close', handleClose)
    }
  }, [onChiudi])

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 z-50 p-0 bg-transparent backdrop:bg-[rgba(0,0,0,0.45)]"
    >
      <div className="bg-(--bg-3) w-full max-w-2xl mx-4 rounded-sm shadow-2xl overflow-hidden">
        {/* Intestazione */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-(--border) bg-(--bg-2)">
          <div>
            <h2 id="modal-title" className="text-base font-semibold font-mono text-(--text-1) tracking-tight">
              {ordine.codice_ordine}
            </h2>
          </div>
          <button
            onClick={() => dialogRef.current?.close()}
            className="text-(--text-4) hover:text-(--text-1) text-xl leading-none transition-colors"
            aria-label="Chiudi"
          >
            ✕
          </button>
        </div>

        {/* Dettagli ordine */}
        <div className="px-6 py-3 flex gap-6 border-b border-(--border) text-sm">
          <div>
            <span className="text-(--text-4) text-xs uppercase tracking-wide">Data</span>
            <p className="text-(--text-1) font-medium mt-0.5">
              {new Date(ordine.data).toLocaleDateString('it-IT', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
          {isAdmin && ordine.username && (
            <div>
              <span className="text-(--text-4) text-xs uppercase tracking-wide">Cliente</span>
              <p className="text-(--text-1) font-medium mt-0.5">{ordine.username}</p>
            </div>
          )}
        </div>

        {/* Lista prodotti */}
        <div className="px-6 py-4 max-h-72 overflow-y-auto">
          <p className="text-xs uppercase tracking-widest text-(--text-4) mb-3">
            Prodotti
          </p>
          <div className="space-y-3">
            {ordine.prodotti.map((p, i) => (
              <div
                key={p.nome + i}
                className="flex items-start justify-between gap-4 pb-3 border-b border-(--border) last:border-0"
              >
                <div className="flex-1">
                  <p className="text-sm font-semibold text-(--text-1)">{p.nome}</p>
                  <p className="text-xs text-(--text-3) mt-0.5 leading-relaxed">
                    {p.descrizione}
                  </p>
                </div>
                <span className="text-xs font-mono bg-(--bg-2) text-(--text-3) px-2 py-1 rounded-sm whitespace-nowrap">
                  × {p.quantita}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Area duplicazione (solo per clienti) */}
        {!isAdmin && (
          <div className="px-6 py-4 border-t border-(--border) bg-(--bg-2)">
            {erroreDuplica && (
              <p className="text-xs text-(--error) mb-2">{erroreDuplica}</p>
            )}

            {confermaDuplica ? (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    onDuplica(ordine.codice_ordine)
                    setConfermaDuplica(false)
                  }}
                  className="flex-1 py-2 text-sm font-medium bg-(--text-1) text-(--bg-3) hover:bg-(--color-3) transition-colors rounded-sm"
                >
                  Conferma duplicazione
                </button>
                <button
                  onClick={() => setConfermaDuplica(false)}
                  className="flex-1 py-2 text-sm font-medium border border-(--border) text-(--text-3) hover:bg-(--bg-1) transition-colors rounded-sm"
                >
                  Annulla
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfermaDuplica(true)}
                className="w-full py-2 text-sm font-medium bg-(--text-1) text-(--bg-3) hover:bg-(--color-3) transition-colors rounded-sm"
              >
                Duplica ordine
              </button>
            )}
          </div>
        )}
      </div>
    </dialog>
  )
}