import React from 'react'
import type { Ordine } from './StoricoModel'

interface OrdineRowProps {
  readonly ordine: Ordine
  readonly isAdmin: boolean
  readonly onApriDettaglio: (o: Ordine) => void
}

export const OrdineRow: React.FC<OrdineRowProps> = ({
  ordine,
  isAdmin,
  onApriDettaglio,
}) => {
  return (
    <tr className="relative border-b border-(--border) hover:bg-(--bg-2) transition-colors group">
      {/* Accent bar on hover */}
      <td className="py-3.5 px-5 font-mono text-sm font-semibold text-(--text-1) relative">
        <span className="absolute left-0 top-1/4 bottom-1/4 w-0.5 bg-(--color-2) rounded-r opacity-0 group-hover:opacity-100 transition-opacity" />
        {ordine.codice_ordine}
      </td>
      <td className="py-3.5 px-5 text-sm text-(--text-3)">
        {new Date(ordine.data).toLocaleDateString('it-IT', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })}
      </td>
      {isAdmin && (
        <td className="py-3.5 px-5 text-sm text-(--text-3)">
          {ordine.username ?? '—'}
        </td>
      )}
      <td className="py-3.5 px-5">
        <span className="inline-flex items-center text-xs font-medium text-(--color-3) bg-(--color-1) border border-(--color-2) px-2.5 py-1 rounded-full">
          {ordine.prodotti.length} prodott{ordine.prodotti.length === 1 ? 'o' : 'i'}
        </span>
      </td>
      <td className="py-3.5 px-5 text-right">
        <button
          type="button"
          onClick={() => onApriDettaglio(ordine)}
          aria-label={`Apri dettaglio ordine ${ordine.codice_ordine}`}
          className="
            text-xs font-medium text-(--text-3) hover:text-(--color-2)
            transition-colors
            focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-2)
            focus-visible:ring-inset focus-visible:rounded-sm
            after:absolute after:inset-0 after:content-['']
          "
        >
          Dettaglio →
        </button>
      </td>
    </tr>
  )
}