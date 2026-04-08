import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { OrdineRow } from '../../src/storico/OrdineRow';
import type { Ordine } from '../../src/storico/StoricoModel';

const originalToLocaleDateString = Date.prototype.toLocaleDateString;
beforeAll(() => {
  Date.prototype.toLocaleDateString = function (_locale?: string, _options?: Intl.DateTimeFormatOptions) {
    const d = this as Date;
    const months = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];
    const day = String(d.getDate()).padStart(2, '0');
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  };
});
afterAll(() => {
  Date.prototype.toLocaleDateString = originalToLocaleDateString;
});

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
  //TU-F_387
  it('mostra il codice ordine', () => {
    renderRow(ordineCliente);
    expect(screen.getByText('ORD-001')).toBeInTheDocument();
  });

  //TU-F_388
  it('mostra la data formattata in italiano', () => {
    renderRow(ordineCliente);
    const row = screen.getByRole('row');
    expect(row).toHaveTextContent(/mar/i);
    expect(row).toHaveTextContent(/2024/);
  });

  //TU-F_389
  it('mostra il badge con il numero di prodotti corretto (plurale)', () => {
    renderRow(ordineCliente);
    expect(screen.getByText('3 prodotti')).toBeInTheDocument();
  });

  //TU-F_390
  it('mostra il badge con "1 prodotto" al singolare', () => {
    renderRow(ordineConUnProdotto);
    expect(screen.getByText('1 prodotto')).toBeInTheDocument();
  });

  //TU-F_391
  it('ha il pulsante "Dettaglio →"', () => {
    renderRow(ordineCliente);
    expect(screen.getByRole('button', { name: /dettaglio/i })).toBeInTheDocument();
  });

  //TU-F_392
  it('il pulsante ha aria-label con il codice ordine', () => {
    renderRow(ordineCliente);
    expect(
      screen.getByRole('button', { name: /apri dettaglio ordine ORD-001/i })
    ).toBeInTheDocument();
  });
});

// ─── Vista admin ─────────────────────────────────────────────────────────────

describe('OrdineRow – vista admin', () => {
  //TU-F_393
  it('mostra la colonna username quando isAdmin=true', () => {
    renderRow(ordineAdmin, true);
    expect(screen.getByText('luigi')).toBeInTheDocument();
  });

  //TU-F_394
  it('mostra "—" se username è undefined in vista admin', () => {
    const ordineNoUsername: Ordine = { ...ordineCliente, username: undefined };
    renderRow(ordineNoUsername, true);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  //TU-F_395
  it('NON mostra la colonna username quando isAdmin=false', () => {
    renderRow(ordineAdmin, false);
    expect(screen.queryByText('luigi')).not.toBeInTheDocument();
  });
});

// ─── Click su dettaglio ───────────────────────────────────────────────────────

describe('OrdineRow – interazione', () => {
  //TU-F_396
  it('chiama onApriDettaglio con l\'ordine corretto al click sul pulsante', () => {
    const onApriDettaglio = vi.fn();
    renderRow(ordineCliente, false, onApriDettaglio);

    fireEvent.click(screen.getByRole('button', { name: /dettaglio/i }));
    expect(onApriDettaglio).toHaveBeenCalledTimes(1);
    expect(onApriDettaglio).toHaveBeenCalledWith(ordineCliente);
  });

  //TU-F_397
  it('chiama onApriDettaglio anche per un ordine admin', () => {
    const onApriDettaglio = vi.fn();
    renderRow(ordineAdmin, true, onApriDettaglio);

    fireEvent.click(screen.getByRole('button', { name: /dettaglio/i }));
    expect(onApriDettaglio).toHaveBeenCalledWith(ordineAdmin);
  });
});