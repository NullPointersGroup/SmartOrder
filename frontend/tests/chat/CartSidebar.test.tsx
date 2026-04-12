import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { CartSidebar } from '../../src/chat/CartSidebar';
import type { CartProduct } from '../../src/chat/ChatModel';

// jsdom spesso non ha i dati ICU completi per 'it-IT' + 'EUR',
// il che causa timeout su toLocaleString/toLocaleDateString.
// Mocchiamo Number.prototype.toLocaleString per restituire valori prevedibili.
const originalToLocaleString = Number.prototype.toLocaleString;
beforeAll(() => {
  Number.prototype.toLocaleString = function (_locale?: string, options?: Intl.NumberFormatOptions) {
    if (options?.style === 'currency' && options?.currency === 'EUR') {
      return `${this.toFixed(2).replace('.', ',')} €`;
    }
    return originalToLocaleString.call(this, _locale, options);
  };
});
afterAll(() => {
  Number.prototype.toLocaleString = originalToLocaleString;
});

const products: CartProduct[] = [
  { prod_id: 'P001', name: 'Latte Intero', price: 1.5,  measure_unit: 1, qty: 2 },
  { prod_id: 'P002', name: 'Pane Bianco',  price: 2,    measure_unit: 1, qty: 1 },
];

function renderCart(
  prods: CartProduct[] = products,
  onToggle = vi.fn(),
  onOrdine = vi.fn(),
) {
  return render(
    <CartSidebar products={prods} onToggleSelf={onToggle} onOrdine={onOrdine} />,
  );
}

describe('CartSidebar – render base', () => {
  //TU-F_65
  it('mostra il titolo "Carrello"', () => {
    renderCart();
    expect(screen.getByText(/carrello/i)).toBeInTheDocument();
  });

  //TU-F_66
  it('ha il ruolo di aside con aria-label "Carrello"', () => {
    renderCart();
    expect(screen.getByRole('complementary', { name: /carrello/i })).toBeInTheDocument();
  });
});

// Carrello vuoto
describe('CartSidebar – carrello vuoto', () => {
  //TU-F_67
  it('mostra il messaggio di carrello vuoto', () => {
    renderCart([]);
    expect(screen.getByText(/il carrello è vuoto/i)).toBeInTheDocument();
  });

  //TU-F_68
  it('non mostra il badge con il conteggio', () => {
    renderCart([]);
    expect(screen.queryByText(/^\d+$/)).not.toBeInTheDocument();
  });

  //TU-F_69
  it('non mostra il totale', () => {
    renderCart([]);
    expect(screen.queryByText(/totale/i)).not.toBeInTheDocument();
  });

  //TU-F_70
  it('suggerisce di usare il chatbot', () => {
    renderCart([]);
    expect(screen.getByText(/chiedi al chatbot/i)).toBeInTheDocument();
  });

  //TU-F_71
  it('non mostra il pulsante "Invia ordine" se il carrello è vuoto', () => {
    renderCart([]);
    expect(screen.queryByText(/invia ordine/i)).not.toBeInTheDocument();
  });
});

// Carrello con prodotti
describe('CartSidebar – con prodotti', () => {
  //TU-F_72
  it('mostra la lista dei prodotti con i nomi corretti', () => {
    renderCart();
    expect(screen.getByText('Latte Intero')).toBeInTheDocument();
    expect(screen.getByText('Pane Bianco')).toBeInTheDocument();
  });

  //TU-F_73
  it('mostra i prod_id dei prodotti', () => {
    renderCart();
    expect(screen.getByText('P001')).toBeInTheDocument();
    expect(screen.getByText('P002')).toBeInTheDocument();
  });

  //TU-F_74
  it('mostra il badge con il numero corretto di prodotti', () => {
    renderCart();
    expect(screen.getByTestId('cart-badge')).toHaveTextContent('2');
  });

  //TU-F_75
  it('mostra le quantità dei prodotti', () => {
    renderCart();
    const qtyElements = screen.getAllByText(/qtà/i);
    expect(qtyElements.length).toBeGreaterThan(0);
  });

  //TU-F_76
  it('mostra la sezione Totale', () => {
    renderCart();
    expect(screen.getByText(/totale/i)).toBeInTheDocument();
  });

  //TU-F_77
  it('calcola il totale correttamente (1.5*2 + 2.0*1 = 5.00 €)', () => {
    renderCart();
    expect(screen.getByText(/5,00/)).toBeInTheDocument();
  });

  //TU-F_78
  it('mostra la lista prodotti con aria-label corretto', () => {
    renderCart();
    expect(screen.getByRole('list', { name: /prodotti nel carrello/i })).toBeInTheDocument();
  });
});

// Formattazione prezzi
describe('CartSidebar – formattazione valuta', () => {
  //TU-F_79
  it('formatta i prezzi in formato italiano EUR', () => {
    renderCart([{ prod_id: 'X', name: 'Test', price: 10.5, measure_unit: 1, qty: 1 }]);
    expect(screen.getAllByText(/10,50/).length).toBeGreaterThan(0);
  });

  //TU-F_80
  it('gestisce prodotti con price zero senza crash', () => {
    const priceZero: CartProduct[] = [
      { prod_id: 'X', name: 'Free', price: 0, measure_unit: 1, qty: 1 },
    ];
    expect(() => renderCart(priceZero)).not.toThrow();
  });

  //TU-F_81
  it('gestisce price undefined senza crash — copre branch ?? 0 su price (righe 13, 70)', () => {
    const p: CartProduct[] = [
      { prod_id: 'X', name: 'NoPrezzzo', price: undefined as unknown as number, measure_unit: 1, qty: 2 },
    ];
    expect(() => renderCart(p)).not.toThrow();
    expect(screen.getByText(/totale/i)).toBeInTheDocument();
  });

  //TU-F_82
  it('gestisce qty undefined senza crash — copre branch ?? 0 su qty (righe 13, 70)', () => {
    const p: CartProduct[] = [
      { prod_id: 'X', name: 'NoQty', price: 3, measure_unit: 1, qty: undefined as unknown as number },
    ];
    expect(() => renderCart(p)).not.toThrow();
    expect(screen.getByText(/totale/i)).toBeInTheDocument();
  });
});

// Interazione – pulsante chiudi
describe('CartSidebar – interazione', () => {
  //TU-F_83
  it('chiama onToggleSelf al click del pulsante chiudi', () => {
    const onToggle = vi.fn();
    renderCart(products, onToggle);
    fireEvent.click(screen.getByTitle(/chiudi carrello/i));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  //TU-F_84
  it('il pulsante chiudi ha il title corretto', () => {
    renderCart();
    expect(screen.getByTitle(/chiudi carrello/i)).toBeInTheDocument();
  });
});

// Accessibilità
describe('CartSidebar – accessibilità', () => {
  //TU-F_85
  it('il pulsante chiudi ha aria-label o title leggibile', () => {
    renderCart();
    const btn = screen.getByTitle(/chiudi carrello/i);
    expect(btn).toBeInTheDocument();
  });

  //TU-F_86
  it('ogni prodotto è in un elemento li', () => {
    renderCart();
    const listItems = screen.getAllByRole('listitem');
    expect(listItems.length).toBeGreaterThanOrEqual(products.length);
  });
});

// ── Dialog di conferma ordine ─────────────────────────────────────────────────
describe('CartSidebar – dialog di conferma ordine', () => {

  //TU-F_87
  it('il click su "Invia ordine" apre il dialog di conferma (riga 140 – setShowConfirm(true))', () => {
    renderCart();
    expect(screen.queryByText(/conferma ordine/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByText(/invia ordine/i));
    expect(screen.getByText(/conferma ordine/i)).toBeInTheDocument();
  });

  //TU-F_88
  it('il dialog mostra numero prodotti e totale (righe 42-54 – jsx dialog)', () => {
    renderCart();
    fireEvent.click(screen.getByText(/invia ordine/i));
    expect(screen.getByText(/2 prodotti/i)).toBeInTheDocument();
    expect(screen.getAllByText(/5,00/).length).toBeGreaterThan(0);
  });

  //TU-F_89
  it('il dialog mostra "prodotto" al singolare se c\'è un solo articolo', () => {
    const one: CartProduct[] = [
      { prod_id: 'P001', name: 'Latte', price: 3, measure_unit: 1, qty: 1 },
    ];
    renderCart(one);
    fireEvent.click(screen.getByText(/invia ordine/i));
    expect(screen.getByText(/1 prodotto(?!i)/i)).toBeInTheDocument();
  });

  //TU-F_90
  it('"Annulla" chiude il dialog senza chiamare onOrdine (riga 31 – setShowConfirm(false))', () => {
    const onOrdine = vi.fn();
    renderCart(products, vi.fn(), onOrdine);
    fireEvent.click(screen.getByText(/invia ordine/i));
    expect(screen.getByText(/conferma ordine/i)).toBeInTheDocument();
    fireEvent.click(screen.getByText(/annulla/i));
    expect(screen.queryByText(/conferma ordine/i)).not.toBeInTheDocument();
    expect(onOrdine).not.toHaveBeenCalled();
  });

  //TU-F_91
  it('"Conferma" chiude il dialog e chiama onOrdine (riga 32 – handleConferma)', () => {
    const onOrdine = vi.fn();
    renderCart(products, vi.fn(), onOrdine);
    fireEvent.click(screen.getByText(/invia ordine/i));
    expect(screen.getByText(/conferma ordine/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /^conferma$/i }));
    expect(screen.queryByText(/conferma ordine/i)).not.toBeInTheDocument();
    expect(onOrdine).toHaveBeenCalledTimes(1);
  });

  //TU-F_92
  it('click sullo sfondo (backdrop) chiude il dialog senza chiamare onOrdine', () => {
    const onOrdine = vi.fn();
    renderCart(products, vi.fn(), onOrdine);
    fireEvent.click(screen.getByText(/invia ordine/i));
    expect(screen.getByText(/conferma ordine/i)).toBeInTheDocument();
    // Il backdrop è un <button> senza testo né aria-label esplicito
    const backdrop = screen.getByRole('button', { name: '' });
    fireEvent.click(backdrop);
    expect(screen.queryByText(/conferma ordine/i)).not.toBeInTheDocument();
    expect(onOrdine).not.toHaveBeenCalled();
  });
});