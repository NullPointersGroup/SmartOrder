import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { CartSidebar } from '../../src/chat/CartSidebar';
import type { CartProduct } from '../../src/chat/ChatModel';

const products: CartProduct[] = [
  { prod_id: 'P001', name: 'Latte Intero', price: 1.5,  measure_unit: 1, qty: 2 },
  { prod_id: 'P002', name: 'Pane Bianco',  price: 2,    measure_unit: 1, qty: 1 },
];

function renderCart(prods: CartProduct[] = products, onToggle = vi.fn()) {
  return render(<CartSidebar products={prods} onToggleSelf={onToggle} />);
}

describe('CartSidebar – render base', () => {
  it('mostra il titolo "Carrello"', () => {
    renderCart();
    expect(screen.getByText(/carrello/i)).toBeInTheDocument();
  });

  it('ha il ruolo di aside con aria-label "Carrello"', () => {
    renderCart();
    expect(screen.getByRole('complementary', { name: /carrello/i })).toBeInTheDocument();
  });
});

// Carrello vuoto
describe('CartSidebar – carrello vuoto', () => {
  it('mostra il messaggio di carrello vuoto', () => {
    renderCart([]);
    expect(screen.getByText(/il carrello è vuoto/i)).toBeInTheDocument();
  });

  it('non mostra il badge con il conteggio', () => {
    renderCart([]);
    // Il badge mostra solo numeri, non dovrebbe esserci nessun numero nel documento
    expect(screen.queryByText(/^\d+$/)).not.toBeInTheDocument();
  });

  it('non mostra il totale', () => {
    renderCart([]);
    expect(screen.queryByText(/totale/i)).not.toBeInTheDocument();
  });

  it('suggerisce di usare il chatbot', () => {
    renderCart([]);
    expect(screen.getByText(/chiedi al chatbot/i)).toBeInTheDocument();
  });
});

// Carrello con prodotti
describe('CartSidebar – con prodotti', () => {
  it('mostra la lista dei prodotti con i nomi corretti', () => {
    renderCart();
    expect(screen.getByText('Latte Intero')).toBeInTheDocument();
    expect(screen.getByText('Pane Bianco')).toBeInTheDocument();
  });

  it('mostra i prod_id dei prodotti', () => {
    renderCart();
    expect(screen.getByText('P001')).toBeInTheDocument();
    expect(screen.getByText('P002')).toBeInTheDocument();
  });

  it('mostra il badge con il numero corretto di prodotti', () => {
    renderCart();
    expect(screen.getByTestId('cart-badge')).toHaveTextContent('2');
  });

  it('mostra le quantità dei prodotti', () => {
    renderCart();
    const qtyElements = screen.getAllByText(/qtà/i);
    expect(qtyElements.length).toBeGreaterThan(0);
  });

  it('mostra la sezione Totale', () => {
    renderCart();
    expect(screen.getByText(/totale/i)).toBeInTheDocument();
  });

  it('calcola il totale correttamente (1.5*2 + 2.0*1 = 5.00 €)', () => {
    renderCart();
    // 1.5 * 2 + 2.0 * 1 = 5.00
    expect(screen.getByText(/5,00/)).toBeInTheDocument();
  });

  it('mostra la lista prodotti con aria-label corretto', () => {
    renderCart();
    expect(screen.getByRole('list', { name: /prodotti nel carrello/i })).toBeInTheDocument();
  });
});

// Formattazione prezzi
describe('CartSidebar – formattazione valuta', () => {
  it('formatta i prezzi in formato italiano EUR', () => {
    renderCart([{ prod_id: 'X', name: 'Test', price: 10.5, measure_unit: 1, qty: 1 }]);
    expect(screen.getAllByText(/10,50/).length).toBeGreaterThan(0);
  });

  it('gestisce prodotti con price zero senza crash', () => {
    const priceZero: CartProduct[] = [
      { prod_id: 'X', name: 'Free', price: 0, measure_unit: 1, qty: 1 },
    ];
    expect(() => renderCart(priceZero)).not.toThrow();
  });

  // Copertura branch `?? 0` su price (riga 13 e 70): price=undefined attiva il ramo destro
  it('gestisce price undefined senza crash — copre branch ?? 0 su price (righe 13, 70)', () => {
    const p: CartProduct[] = [
      { prod_id: 'X', name: 'NoPrezzzo', price: undefined as unknown as number, measure_unit: 1, qty: 2 },
    ];
    expect(() => renderCart(p)).not.toThrow();
    // totale = 0 * 2 = 0 → "Totale" è visibile ma non crasha
    expect(screen.getByText(/totale/i)).toBeInTheDocument();
  });

  // Copertura branch `?? 0` su qty (riga 13 e 70): qty=undefined attiva il ramo destro
  it('gestisce qty undefined senza crash — copre branch ?? 0 su qty (righe 13, 70)', () => {
    const p: CartProduct[] = [
      { prod_id: 'X', name: 'NoQty', price: 3, measure_unit: 1, qty: undefined as unknown as number },
    ];
    expect(() => renderCart(p)).not.toThrow();
    expect(screen.getByText(/totale/i)).toBeInTheDocument();
  });
});

// Interazione
describe('CartSidebar – interazione', () => {
  it('chiama onToggleSelf al click del pulsante chiudi', () => {
    const onToggle = vi.fn();
    renderCart(products, onToggle);
    fireEvent.click(screen.getByTitle(/chiudi carrello/i));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('il pulsante chiudi ha il title corretto', () => {
    renderCart();
    expect(screen.getByTitle(/chiudi carrello/i)).toBeInTheDocument();
  });
});

describe('CartSidebar – accessibilità', () => {
  it('il pulsante chiudi ha aria-label o title leggibile', () => {
    renderCart();
    const btn = screen.getByTitle(/chiudi carrello/i);
    expect(btn).toBeInTheDocument();
  });

  it('ogni prodotto è in un elemento li', () => {
    renderCart();
    const listItems = screen.getAllByRole('listitem');
    expect(listItems.length).toBeGreaterThanOrEqual(products.length);
  });
});