import React, { useState } from 'react';
import type { CartProduct } from './ChatModel';

interface Props {
  products: CartProduct[];
  onToggleSelf: () => void;
  onOrdine: () => Promise<void>;
}

export const CartSidebar: React.FC<Props> = ({ products, onToggleSelf, onOrdine }) => {
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
  @req RF-OB_68
  @req RF-OB_69
  @req RF-OB_70
   */

  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSendingOrder, setIsSendingOrder] = useState(false);

  const fmt = (n?: number) =>
    (n ?? 0).toLocaleString('it-IT', { style: 'currency', currency: 'EUR' });

  const total = products.reduce((sum, p) => sum + (p.price ?? 0) * (p.qty ?? 0), 0);

  const handleConferma = async () => {
    setShowConfirm(false);
    setIsSendingOrder(true);
    try {
      await onOrdine();
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 4000);
    } finally {
      setIsSendingOrder(false);
    }
  };

  return (
    <>
      {/* Dialog di conferma */}
      {showConfirm && (
        <div className="fixed inset-0 z-200 flex items-center justify-center">
          <button
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowConfirm(false)}
          />
          <div className="relative z-10 bg-(--bg-1) border border-(--border) rounded-2xl shadow-2xl p-6 w-80 flex flex-col gap-4">
            <h2 className="text-base font-semibold text-(--text-1)">Conferma ordine</h2>
            <p className="text-sm text-(--text-3)">
              Vuoi inviare l'ordine per{' '}
              <span className="font-semibold text-(--text-1)">{products.length} prodott{products.length === 1 ? 'o' : 'i'}</span>{' '}
              del valore di{' '}
              <span className="font-semibold text-(--text-1)">{fmt(total)}</span>?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 rounded-xl text-sm text-(--text-3) hover:bg-(--bg-2) transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={handleConferma}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-(--color-2) text-(--bg-1) hover:opacity-90 transition-opacity"
              >
                Conferma
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Popup di successo */}
      {showSuccess && (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-0 z-200 flex items-center justify-center"
        >
          <button
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowSuccess(false)}
            aria-label="Chiudi notifica"
          />
          <div className="relative z-10 bg-(--bg-1) border border-(--border) rounded-2xl shadow-2xl p-6 w-80 flex flex-col items-center gap-4">
            {/* Icona check */}
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-green-100">
              <svg
                width="28" height="28" viewBox="0 0 24 24"
                fill="none" stroke="var(--color-2)" strokeWidth="2.2"
                strokeLinecap="round" strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>

            <div className="text-center flex flex-col gap-1">
              <h2 className="text-base font-semibold text-(--text-1)">Ordine inviato!</h2>
              <p className="text-sm text-(--text-3)">
                Il tuo ordine è stato inviato con successo.
              </p>
            </div>

            <button
              onClick={() => setShowSuccess(false)}
              className="w-full py-2.5 rounded-xl text-sm font-semibold bg-(--color-2) text-(--bg-1) hover:opacity-90 transition-opacity"
            >
              Chiudi
            </button>
          </div>
        </div>
      )}

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

      {/* Footer */}
        {products.length > 0 && (
          <div className="border-t border-(--border) px-4 py-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-(--text-3)">Totale</span>
              <span className="text-base font-bold text-(--text-1)">{fmt(total)}</span>
            </div>
            <div className="px-0 pb-0 pt-2">
              <button
                onClick={() => setShowConfirm(true)}
                disabled={isSendingOrder}
                className="w-full py-3 rounded-xl bg-(--color-2) text-(--bg-1) text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSendingOrder ? 'Invio in corso…' : 'Invia ordine'}
              </button>
            </div>
          </div>
        )}
    </aside>
    </>
  );
};