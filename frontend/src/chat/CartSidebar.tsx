import React from 'react';
import type { CartProduct } from './ChatModel';

interface Props {
  products: CartProduct[];
  onToggleSelf: () => void;
}

export const CartSidebar: React.FC<Props> = ({ products, onToggleSelf }) => {
  /**
  @brief costruisce la sidebar di destra del carrello
  @param l'interfaccia Props
  @return l'estetica
  @req RF-OB_62
  @req RF-OB_63
  @req RF-OB_64
  @req RF-OB_65
  @req RF-OB_66
  @req RF-OB_67
   */
  const fmt = (n?: number) =>
  (n ?? 0).toLocaleString('it-IT', { style: 'currency', currency: 'EUR' });

  const total = products.reduce((sum, p) => sum + (p.price ?? 0) * (p.qty ?? 0), 0);

  return (
    <aside className="flex flex-col w-80 min-w-[20rem] h-full bg-(--bg-3) border-l border-(--border)" aria-label="Carrello">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-6 border border-(--border)">
        <button
          onClick={onToggleSelf}
          className="flex items-center justify-center w-8 h-8 rounded-xl text-(--text-4) hover:text-(--color-2) hover:bg-(--color-1) transition-all focus:outline-none"
          title="Chiudi carrello"
        >
          <svg width="18" height="18" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M0 0.5 L1.5 0.5 L3.5 9.5 L11.5 9.5 L13 4 L3 4"/>
            <circle cx="5" cy="12" r="1.2" fill="currentColor" stroke="none"/>
            <circle cx="10.5" cy="12" r="1.2" fill="currentColor" stroke="none"/>
          </svg>
        </button>

        <span className="text-[11px] font-bold tracking-[0.15em] text-(--text-4) uppercase flex-1">
          Carrello
        </span>

        {products.length > 0 && (
          <span
            data-testid="cart-badge"
            className="flex items-center justify-center w-5 h-5 rounded-full bg-(--color-1) text-(--color-3) text-xs font-semibold"
          >
            {products.length}
          </span>
        )}
      </div>

      {/* Lista prodotti */}
      <ul className="flex-1 overflow-y-auto py-2" aria-label="Prodotti nel carrello">
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-4 py-12 text-center">
            <p className="text-sm text-(--text-4)">
              Il carrello è vuoto.<br/>
              <span className="text-(--text-4) opacity-60">Chiedi al chatbot di aggiungere prodotti.</span>
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-(--bg-2)">
            {products.map((product) => (
              <li key={product.prod_id} className="flex items-start gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-(--text-1) truncate" title={product.name}>{product.name}</p>
                  <p className="text-xs text-(--text-4) mt-0.5 font-mono">{product.prod_id}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-(--text-3)">
                      Qtà <strong className="text-(--text-2)">{product.qty}</strong>
                    </span>
                    <span className="text-(--text-4)">·</span>
                    <span className="text-xs text-(--text-3)">{fmt(product.price)} / u.</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-sm font-semibold text-(--text-1)">{fmt((product.price ?? 0) * (product.qty ?? 0))}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </ul>

      {/* Footer con totale */}
      {products.length > 0 && (
        <div className="border-t border-(--border) px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-(--text-3)">Totale</span>
            <span className="text-base font-bold text-(--text-1)">{fmt(total)}</span>
          </div>
        </div>
      )}
    </aside>
  );
};