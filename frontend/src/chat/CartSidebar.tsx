import React from 'react';
import type { CartProduct } from './ChatModel';

interface Props {
  products: CartProduct[];
  onToggleSelf: () => void;
}

export const CartSidebar: React.FC<Props> = ({ products, onToggleSelf }) => {
  const fmt = (n: number) =>
    n.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' });

  const total = products.reduce((sum, p) => sum + (p.price ?? 0) * (p.qty ?? 0), 0);

  return (
    <aside className="flex flex-col w-80 min-w-[20rem] h-full bg-white border-l border-stone-200" aria-label="Carrello">
      {/* Header: [ > chiudi ] [ icona carrello ] [ CARRELLO ] [ badge ] */}
      <div className="flex items-center gap-2 px-4 py-6 border-b border-stone-100">
        {/* Chiudi sidebar destra */}
        <button
          onClick={onToggleSelf}
          className="flex items-center justify-center w-8 h-8 rounded-xl text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all focus:outline-none"
          title="Chiudi carrello"
        >
          <svg width="18" height="18" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M0 0.5 L1.5 0.5 L3.5 9.5 L11.5 9.5 L13 4 L3 4"/>
            <circle cx="5" cy="12" r="1.2" fill="currentColor" stroke="none"/>
            <circle cx="10.5" cy="12" r="1.2" fill="currentColor" stroke="none"/>
          </svg>
        </button>

        <span className="text-[11px] font-bold tracking-[0.15em] text-stone-400 uppercase flex-1">
          Carrello
        </span>

        {products.length > 0 && (
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
            {products.length}
          </span>
        )}
      </div>

      {/* Lista prodotti */}
      <ul className="flex-1 overflow-y-auto py-2" aria-label="Prodotti nel carrello">
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-4 py-12 text-center">
            <p className="text-sm text-stone-400">
              Il carrello è vuoto.<br/>
              <span className="text-stone-300">Chiedi al chatbot di aggiungere prodotti.</span>
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-stone-50">
            {products.map(product => (
              <li key={product.prod_id} className="flex items-start gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-800 truncate" title={product.name}>{product.name}</p>
                  <p className="text-xs text-stone-400 mt-0.5 font-mono">{product.prod_id}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-stone-500">
                      Qtà <strong className="text-stone-700">{product.qty}</strong>
                    </span>
                    <span className="text-stone-200">·</span>
                    <span className="text-xs text-stone-500">{fmt(product.price)} / u.</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-sm font-semibold text-stone-800">{fmt((product.price ?? 0) * (product.qty ?? 0))}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </ul>

      {/* Footer con totale */}
      {products.length > 0 && (
        <div className="border-t border-stone-100 px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-stone-500">Totale</span>
            <span className="text-base font-bold text-stone-900">{fmt(total)}</span>
          </div>
        </div>
      )}
    </aside>
  );
};