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
    <tr
      className="relative border-b border-(--border) hover:bg-(--bg-2) transition-colors"
    >
      <td className="py-3 px-4 font-mono text-sm text-(--text-4)">
        #{String(ordine.numero_ordine).padStart(4, '0')}
      </td>
      <td className="py-3 px-4 font-mono text-sm font-medium text-(--text-1)">
        {ordine.codice_ordine}
      </td>
      <td className="py-3 px-4 text-sm text-(--text-3)">
        {new Date(ordine.data).toLocaleDateString('it-IT', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })}
      </td>
      {isAdmin && (
        <td className="py-3 px-4 text-sm text-(--text-3)">
          {ordine.username ?? '—'}
        </td>
      )}
      <td className="py-3 px-4 text-sm text-(--text-4)">
        {ordine.prodotti.length} prodott{ordine.prodotti.length === 1 ? 'o' : 'i'}
      </td>
      <td className="py-3 px-4 text-right">
        <button
          type="button"
          onClick={() => onApriDettaglio(ordine)}
          aria-label={`Apri dettaglio ordine ${ordine.codice_ordine}`}
          className="
            text-xs text-(--text-4) hover:text-(--text-3) transition-colors
            focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-2)
            focus-visible:ring-inset focus-visible:rounded-sm
            after:absolute after:inset-0 after:content-['']
          "
        >
          <span aria-hidden="true">Dettaglio →</span>
        </button>
      </td>
    </tr>
  )
}