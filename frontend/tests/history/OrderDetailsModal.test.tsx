import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import { OrderDetailsModal } from '../../src/history/OrderDetailsModal';
import type { Order } from '../../src/history/HistoryModel';

// ─── Mock <dialog> per jsdom ─────────────────────────────────────────────────

beforeEach(() => {
  HTMLDialogElement.prototype.showModal = vi.fn();
  HTMLDialogElement.prototype.close = vi.fn().mockImplementation(function (this: HTMLDialogElement) {
    this.dispatchEvent(new Event('close'));
  });
});

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const ordineBase: Order = {
  codice_ordine: 'ORD-001',
  numero_ordine: 1,
  data:          '2024-03-15T10:30:00',
  prodotti: [
    { nome: 'Latte',  descrizione: 'Intero',   quantita: 2 },
    { nome: 'Pane',   descrizione: '',          quantita: 1 },
    { nome: 'Yogurt', descrizione: 'Greco',     quantita: 4 },
  ],
};

const ordineAdmin: Order = {
  codice_ordine: 'ORD-002',
  numero_ordine: 2,
  data:          '2024-06-01T08:00:00',
  username:      'mario',
  prodotti: [{ nome: 'Olio', descrizione: 'EVO', quantita: 1 }],
};

const defaultProps = {
  ordine:         ordineBase,
  isAdmin:        false,
  onChiudi:       vi.fn(),
  onDuplica:      vi.fn(),
  erroreDuplica:  null as string | null,
};

function renderModal(overrides: Partial<typeof defaultProps> = {}) {
  return render(<OrderDetailsModal {...defaultProps} {...overrides} />);
}

beforeEach(() => {
  defaultProps.onChiudi      = vi.fn();
  defaultProps.onDuplica     = vi.fn();
  defaultProps.erroreDuplica = null;
});

// ─── Apertura dialog ──────────────────────────────────────────────────────────

describe('DettaglioModal – apertura', () => {
  //TU-F_365
  it('chiama showModal al mount', () => {
    renderModal();
    expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalledTimes(1);
  });
});

// ─── Render base ─────────────────────────────────────────────────────────────

describe('DettaglioModal – render base', () => {
  //TU-F_366
  it('mostra il codice ordine nell\'header', () => {
    renderModal();
    expect(screen.getByText('ORD-001')).toBeInTheDocument();
  });

  //TU-F_367
  it('mostra la data formattata in italiano (formato long)', () => {
    renderModal();
    expect(screen.getByText(/marzo/i)).toBeInTheDocument();
    expect(screen.getByText(/2024/)).toBeInTheDocument();
  });

  //TU-F_368
  it('mostra la lista dei prodotti', () => {
    renderModal();
    expect(screen.getByText('Latte')).toBeInTheDocument();
    expect(screen.getByText('Pane')).toBeInTheDocument();
    expect(screen.getByText('Yogurt')).toBeInTheDocument();
  });

  //TU-F_369
  it('mostra la descrizione del prodotto se presente', () => {
    renderModal();
    expect(screen.getByText('Intero')).toBeInTheDocument();
    expect(screen.getByText('Greco')).toBeInTheDocument();
  });

  //TU-F_370
  it('NON mostra la descrizione vuota', () => {
    renderModal();
    const paneNameEl = screen.getByText('Pane');
    const paneContainer = paneNameEl.closest('div');
    const paragraphs = paneContainer?.querySelectorAll('p') ?? [];
    expect(paragraphs).toHaveLength(1);

    expect(screen.getByText('Intero')).toBeInTheDocument();
    expect(screen.getByText('Greco')).toBeInTheDocument();
  });

  //TU-F_371
  it('mostra la quantità di ogni prodotto con "× N"', () => {
    renderModal();
    expect(screen.getByText('× 2')).toBeInTheDocument();
    expect(screen.getByText('× 1')).toBeInTheDocument();
    expect(screen.getByText('× 4')).toBeInTheDocument();
  });

  //TU-F_372
  it('ha il pulsante di chiusura con aria-label "Chiudi"', () => {
    renderModal();
    expect(screen.getByLabelText('Chiudi')).toBeInTheDocument();
  });
});

// ─── Vista admin ─────────────────────────────────────────────────────────────

describe('DettaglioModal – vista admin', () => {
  //TU-F_373
  it('mostra il campo "Cliente" con username se isAdmin=true e username presente', () => {
    renderModal({ ordine: ordineAdmin, isAdmin: true });
    expect(screen.getByText('mario')).toBeInTheDocument();
  });

  //TU-F_374
  it('NON mostra il campo "Cliente" se isAdmin=false', () => {
    renderModal({ ordine: ordineAdmin, isAdmin: false });
    expect(screen.queryByText('mario')).not.toBeInTheDocument();
  });

  //TU-F_375
  it('NON mostra il campo "Cliente" se username non è presente anche con isAdmin=true', () => {
    renderModal({ ordine: ordineBase, isAdmin: true });
    // ordineBase non ha username
    expect(screen.queryByText(/cliente/i)).not.toBeInTheDocument();
  });
});

// ─── Sezione duplicazione (solo cliente) ──────────────────────────────────────

describe('DettaglioModal – duplicazione (cliente, isAdmin=false)', () => {
  //TU-F_376
  it('mostra il pulsante "Duplica ordine" inizialmente', () => {
    renderModal({ isAdmin: false });
    expect(screen.getByText(/duplica ordine/i)).toBeInTheDocument();
  });

  //TU-F_377
  it('NON mostra la sezione duplicazione se isAdmin=true', () => {
    renderModal({ isAdmin: true });
    expect(screen.queryByText(/duplica ordine/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/conferma duplicazione/i)).not.toBeInTheDocument();
  });

  //TU-F_378
  it('al click su "Duplica ordine" mostra "Conferma duplicazione" e "Annulla"', () => {
    renderModal({ isAdmin: false });
    fireEvent.click(screen.getByText(/duplica ordine/i));
    expect(screen.getByText(/conferma duplicazione/i)).toBeInTheDocument();
    expect(screen.getByText(/annulla/i)).toBeInTheDocument();
  });

  //TU-F_379
  it('"Annulla" riporta al pulsante "Duplica ordine"', () => {
    renderModal({ isAdmin: false });
    fireEvent.click(screen.getByText(/duplica ordine/i));
    fireEvent.click(screen.getByText(/annulla/i));
    expect(screen.getByText(/duplica ordine/i)).toBeInTheDocument();
    expect(screen.queryByText(/conferma duplicazione/i)).not.toBeInTheDocument();
  });

  //TU-F_380
  it('"Conferma duplicazione" chiama onDuplica con il codice ordine', () => {
    const onDuplica = vi.fn();
    renderModal({ isAdmin: false, onDuplica });
    fireEvent.click(screen.getByText(/duplica ordine/i));
    fireEvent.click(screen.getByText(/conferma duplicazione/i));
    expect(onDuplica).toHaveBeenCalledWith('ORD-001');
  });

  //TU-F_381
  it('dopo "Conferma duplicazione" torna al pulsante iniziale (confermaDuplica reset)', () => {
    renderModal({ isAdmin: false });
    fireEvent.click(screen.getByText(/duplica ordine/i));
    fireEvent.click(screen.getByText(/conferma duplicazione/i));
    expect(screen.getByText(/duplica ordine/i)).toBeInTheDocument();
  });

  //TU-F_382
  it('mostra erroreDuplica se presente', () => {
    renderModal({ isAdmin: false, erroreDuplica: 'Prodotto non disponibile' });
    expect(screen.getByText('Prodotto non disponibile')).toBeInTheDocument();
  });

  //TU-F_383
  it('NON mostra sezione errore se erroreDuplica è null', () => {
    renderModal({ isAdmin: false, erroreDuplica: null });
    expect(screen.queryByText(/prodotto non disponibile/i)).not.toBeInTheDocument();
  });
});

// ─── Chiusura dialog ──────────────────────────────────────────────────────────

describe('DettaglioModal – chiusura', () => {
  //TU-F_384
  it('chiama onChiudi quando il dialog emette l\'evento "close"', async () => {
    const onChiudi = vi.fn();
    renderModal({ onChiudi });

    const dialog = document.querySelector('dialog');
    if (!dialog) throw new Error('dialog non trovato nel DOM');
    fireEvent(dialog, new Event('close'));

    await waitFor(() => expect(onChiudi).toHaveBeenCalledTimes(1));
  });

  //TU-F_385
  it('chiama dialog.close() al click sul pulsante X', () => {
    renderModal();
    const closeSpy = vi.spyOn(HTMLDialogElement.prototype, 'close');
    fireEvent.click(screen.getByLabelText('Chiudi'));
    expect(closeSpy).toHaveBeenCalled();
  });

  //TU-F_386
  it('rimuove il listener "close" quando il componente si smonta (cleanup)', () => {
    const onChiudi = vi.fn();
    const { unmount } = renderModal({ onChiudi });
    unmount();

    const dialog = document.querySelector('dialog');
    if (dialog) fireEvent(dialog, new Event('close'));
    expect(onChiudi).not.toHaveBeenCalled();
  });
});
