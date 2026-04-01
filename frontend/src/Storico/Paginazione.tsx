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
    <div className="flex items-center justify-between px-5 py-3.5 border-t border-(--border) bg-(--bg-2)">
      <span className="text-xs font-mono text-(--text-2)">
        {pagina} <span className="text-(--text-2) mx-0.5">/</span> {totalePagine}
      </span>
      <div className="flex gap-1.5">
        <button
          disabled={pagina === 1}
          onClick={() => onCambia(pagina - 1)}
          className="
            flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium
            border border-(--border) text-(--text-1) rounded-xl
            hover:bg-(--bg-3) hover:text-(--text-1)
            disabled:opacity-30 disabled:cursor-not-allowed
            transition-colors
          "
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
          Precedente
        </button>
        <button
          disabled={pagina === totalePagine}
          onClick={() => onCambia(pagina + 1)}
          className="
            flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium
            border border-(--border) text-(--text-1) rounded-xl
            hover:bg-(--bg-3) hover:text-(--text-1)
            disabled:opacity-30 disabled:cursor-not-allowed
            transition-colors
          "
        >
          Successivo
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </button>
      </div>
    </div>
  )
}