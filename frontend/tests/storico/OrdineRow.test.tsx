import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { OrdineRow } from '../../src/storico/OrdineRow';
import type { Ordine } from '../../src/storico/StoricoModel';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const ordineCliente: Ordine = {
  codice_ordine: 'ORD-001',
  numero_ordine: 1,
  data:          '2024-03-15T10:30:00',
  prodotti: [
    { nome: 'Latte',  descrizione: 'Intero', quantita: 2 },
    { nome: 'Burro',  descrizione: '',       quantita: 1 },
    { nome: 'Yogurt', descrizione: 'Greco',  quantita: 4 },
  ],
};

const ordineAdmin: Ordine = {
  codice_ordine: 'ORD-002',
  numero_ordine: 2,
  data:          '2024-06-01T08:00:00',
  username:      'luigi',
  prodotti: [{ nome: 'Pane', descrizione: 'Integrale', quantita: 1 }],
};

const ordineConUnProdotto: Ordine = {
  codice_ordine: 'ORD-003',
  numero_ordine: 3,
  data:          '2024-07-10T12:00:00',
  prodotti: [{ nome: 'Olio', descrizione: '', quantita: 1 }],
};

function renderRow(
  ordine: Ordine,
  isAdmin = false,
  onApriDettaglio = vi.fn()
) {
  return render(
    <table>
      <tbody>
        <OrdineRow
          ordine={ordine}
          isAdmin={isAdmin}
          onApriDettaglio={onApriDettaglio}
        />
      </tbody>
    </table>
  );
}

beforeEach(() => vi.clearAllMocks());

// ─── Render base ──────────────────────────────────────────────────────────────

describe('OrdineRow – render base', () => {
  it('mostra il codice ordine', () => {
    renderRow(ordineCliente);
    expect(screen.getByText('ORD-001')).toBeInTheDocument();
  });

  it('mostra la data formattata in italiano', () => {
    renderRow(ordineCliente);
    // 15/03/2024 → "15 mar 2024" in it-IT con day:2-digit, month:short, year:numeric
    expect(screen.getByText(/mar/i)).toBeInTheDocument();
    expect(screen.getByText(/2024/)).toBeInTheDocument();
  });

  it('mostra il badge con il numero di prodotti corretto (plurale)', () => {
    renderRow(ordineCliente);
    expect(screen.getByText('3 prodotti')).toBeInTheDocument();
  });

  it('mostra il badge con "1 prodotto" al singolare', () => {
    renderRow(ordineConUnProdotto);
    expect(screen.getByText('1 prodotto')).toBeInTheDocument();
  });

  it('ha il pulsante "Dettaglio →"', () => {
    renderRow(ordineCliente);
    expect(screen.getByRole('button', { name: /dettaglio/i })).toBeInTheDocument();
  });

  it('il pulsante ha aria-label con il codice ordine', () => {
    renderRow(ordineCliente);
    expect(
      screen.getByRole('button', { name: /apri dettaglio ordine ORD-001/i })
    ).toBeInTheDocument();
  });
});

// ─── Vista admin ─────────────────────────────────────────────────────────────

describe('OrdineRow – vista admin', () => {
  it('mostra la colonna username quando isAdmin=true', () => {
    renderRow(ordineAdmin, true);
    expect(screen.getByText('luigi')).toBeInTheDocument();
  });

  it('mostra "—" se username è undefined in vista admin', () => {
    const ordineNoUsername: Ordine = { ...ordineCliente, username: undefined };
    renderRow(ordineNoUsername, true);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('NON mostra la colonna username quando isAdmin=false', () => {
    renderRow(ordineAdmin, false);
    expect(screen.queryByText('luigi')).not.toBeInTheDocument();
  });
});

// ─── Click su dettaglio ───────────────────────────────────────────────────────

describe('OrdineRow – interazione', () => {
  it('chiama onApriDettaglio con l\'ordine corretto al click sul pulsante', () => {
    const onApriDettaglio = vi.fn();
    renderRow(ordineCliente, false, onApriDettaglio);

    fireEvent.click(screen.getByRole('button', { name: /dettaglio/i }));
    expect(onApriDettaglio).toHaveBeenCalledTimes(1);
    expect(onApriDettaglio).toHaveBeenCalledWith(ordineCliente);
  });

  it('chiama onApriDettaglio anche per un ordine admin', () => {
    const onApriDettaglio = vi.fn();
    renderRow(ordineAdmin, true, onApriDettaglio);

    fireEvent.click(screen.getByRole('button', { name: /dettaglio/i }));
    expect(onApriDettaglio).toHaveBeenCalledWith(ordineAdmin);
  });
});
