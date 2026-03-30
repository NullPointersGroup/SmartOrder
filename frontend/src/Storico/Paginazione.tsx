import React from 'react'

interface PaginazioneProps {
  readonly pagina: number
  readonly totalePagine: number
  readonly onCambia: (n: number) => void
}

export const Paginazione: React.FC<PaginazioneProps> = ({
  pagina,
  totalePagine,
  onCambia,
}) => {
  if (totalePagine <= 1) return null

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-(--border) text-sm">
      <span className="text-(--text-4) text-xs font-mono">
        pag. {pagina} / {totalePagine}
      </span>
      <div className="flex gap-1">
        <button
          disabled={pagina === 1}
          onClick={() => onCambia(pagina - 1)}
          className="px-3 py-1 border border-(--border) text-(--text-3) disabled:opacity-30 hover:bg-(--bg-2) transition-colors rounded-sm text-xs"
        >
          ← Prec.
        </button>
        <button
          disabled={pagina === totalePagine}
          onClick={() => onCambia(pagina + 1)}
          className="px-3 py-1 border border-(--border) text-(--text-3) disabled:opacity-30 hover:bg-(--bg-2) transition-colors rounded-sm text-xs"
        >
          Succ. →
        </button>
      </div>
    </div>
  )
}