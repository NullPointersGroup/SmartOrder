import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

import { DettaglioModal } from '../../src/storico/DettaglioModal';
import type { Ordine } from '../../src/storico/StoricoModel';

// ─── Mock <dialog> per jsdom ─────────────────────────────────────────────────
// jsdom non implementa showModal() né close() nativamente.

beforeEach(() => {
  HTMLDialogElement.prototype.showModal = vi.fn();
  HTMLDialogElement.prototype.close = vi.fn().mockImplementation(function (this: HTMLDialogElement) {
    this.dispatchEvent(new Event('close'));
  });
});

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const ordineBase: Ordine = {
  codice_ordine: 'ORD-001',
  numero_ordine: 1,
  data:          '2024-03-15T10:30:00',
  prodotti: [
    { nome: 'Latte',  descrizione: 'Intero',   quantita: 2 },
    { nome: 'Pane',   descrizione: '',          quantita: 1 },
    { nome: 'Yogurt', descrizione: 'Greco',     quantita: 4 },
  ],
};

const ordineAdmin: Ordine = {
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
  return render(<DettaglioModal {...defaultProps} {...overrides} />);
}

beforeEach(() => {
  defaultProps.onChiudi      = vi.fn();
  defaultProps.onDuplica     = vi.fn();
  defaultProps.erroreDuplica = null;
});

// ─── Apertura dialog ──────────────────────────────────────────────────────────

describe('DettaglioModal – apertura', () => {
  it('chiama showModal al mount', () => {
    renderModal();
    expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalledTimes(1);
  });
});

// ─── Render base ─────────────────────────────────────────────────────────────

describe('DettaglioModal – render base', () => {
  it('mostra il codice ordine nell\'header', () => {
    renderModal();
    expect(screen.getByText('ORD-001')).toBeInTheDocument();
  });

  it('mostra la data formattata in italiano (formato long)', () => {
    renderModal();
    // 2024-03-15 → "15 marzo 2024" in it-IT con day:2-digit, month:long, year:numeric
    expect(screen.getByText(/marzo/i)).toBeInTheDocument();
    expect(screen.getByText(/2024/)).toBeInTheDocument();
  });

  it('mostra la lista dei prodotti', () => {
    renderModal();
    expect(screen.getByText('Latte')).toBeInTheDocument();
    expect(screen.getByText('Pane')).toBeInTheDocument();
    expect(screen.getByText('Yogurt')).toBeInTheDocument();
  });

  it('mostra la descrizione del prodotto se presente', () => {
    renderModal();
    expect(screen.getByText('Intero')).toBeInTheDocument();
    expect(screen.getByText('Greco')).toBeInTheDocument();
  });

  it('NON mostra la descrizione vuota', () => {
    renderModal();
    // "Pane" ha descrizione: '' — il branch {p.descrizione && ...} non deve renderizzare nulla
    // Verifichiamo che ci siano esattamente 2 elementi descrizione (Intero, Greco) e non 3
    const descriptions = document.querySelectorAll('.text-xs.text-\\(--text-4\\)');
    // Solo Latte e Yogurt hanno descrizione, Pane no
    const descTexts = Array.from(descriptions).map(el => el.textContent?.trim());
    expect(descTexts).not.toContain('');
    expect(descTexts.filter(Boolean)).toHaveLength(2);
  });

  it('mostra la quantità di ogni prodotto con "× N"', () => {
    renderModal();
    expect(screen.getByText('× 2')).toBeInTheDocument();
    expect(screen.getByText('× 1')).toBeInTheDocument();
    expect(screen.getByText('× 4')).toBeInTheDocument();
  });

  it('ha il pulsante di chiusura con aria-label "Chiudi"', () => {
    renderModal();
    // jsdom non imposta open sul dialog, quindi byRole richiede hidden:true
    expect(
      screen.getByRole('button', { name: /chiudi/i, hidden: true })
    ).toBeInTheDocument();
  });
});

// ─── Vista admin ─────────────────────────────────────────────────────────────

describe('DettaglioModal – vista admin', () => {
  it('mostra il campo "Cliente" con username se isAdmin=true e username presente', () => {
    renderModal({ ordine: ordineAdmin, isAdmin: true });
    expect(screen.getByText('mario')).toBeInTheDocument();
  });

  it('NON mostra il campo "Cliente" se isAdmin=false', () => {
    renderModal({ ordine: ordineAdmin, isAdmin: false });
    expect(screen.queryByText('mario')).not.toBeInTheDocument();
  });

  it('NON mostra il campo "Cliente" se username non è presente anche con isAdmin=true', () => {
    renderModal({ ordine: ordineBase, isAdmin: true });
    // ordineBase non ha username
    expect(screen.queryByText(/cliente/i)).not.toBeInTheDocument();
  });
});

// ─── Sezione duplicazione (solo cliente) ──────────────────────────────────────

describe('DettaglioModal – duplicazione (cliente, isAdmin=false)', () => {
  it('mostra il pulsante "Duplica ordine" inizialmente', () => {
    renderModal({ isAdmin: false });
    expect(screen.getByText(/duplica ordine/i)).toBeInTheDocument();
  });

  it('NON mostra la sezione duplicazione se isAdmin=true', () => {
    renderModal({ isAdmin: true });
    expect(screen.queryByText(/duplica ordine/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/conferma duplicazione/i)).not.toBeInTheDocument();
  });

  it('al click su "Duplica ordine" mostra "Conferma duplicazione" e "Annulla"', () => {
    renderModal({ isAdmin: false });
    fireEvent.click(screen.getByText(/duplica ordine/i));
    expect(screen.getByText(/conferma duplicazione/i)).toBeInTheDocument();
    expect(screen.getByText(/annulla/i)).toBeInTheDocument();
  });

  it('"Annulla" riporta al pulsante "Duplica ordine"', () => {
    renderModal({ isAdmin: false });
    fireEvent.click(screen.getByText(/duplica ordine/i));
    fireEvent.click(screen.getByText(/annulla/i));
    expect(screen.getByText(/duplica ordine/i)).toBeInTheDocument();
    expect(screen.queryByText(/conferma duplicazione/i)).not.toBeInTheDocument();
  });

  it('"Conferma duplicazione" chiama onDuplica con il codice ordine', () => {
    const onDuplica = vi.fn();
    renderModal({ isAdmin: false, onDuplica });
    fireEvent.click(screen.getByText(/duplica ordine/i));
    fireEvent.click(screen.getByText(/conferma duplicazione/i));
    expect(onDuplica).toHaveBeenCalledWith('ORD-001');
  });

  it('dopo "Conferma duplicazione" torna al pulsante iniziale (confermaDuplica reset)', () => {
    renderModal({ isAdmin: false });
    fireEvent.click(screen.getByText(/duplica ordine/i));
    fireEvent.click(screen.getByText(/conferma duplicazione/i));
    expect(screen.getByText(/duplica ordine/i)).toBeInTheDocument();
  });

  it('mostra erroreDuplica se presente', () => {
    renderModal({ isAdmin: false, erroreDuplica: 'Prodotto non disponibile' });
    expect(screen.getByText('Prodotto non disponibile')).toBeInTheDocument();
  });

  it('NON mostra sezione errore se erroreDuplica è null', () => {
    renderModal({ isAdmin: false, erroreDuplica: null });
    expect(screen.queryByText(/prodotto non disponibile/i)).not.toBeInTheDocument();
  });
});

// ─── Chiusura dialog ──────────────────────────────────────────────────────────

describe('DettaglioModal – chiusura', () => {
  it('chiama onChiudi quando il dialog emette l\'evento "close"', async () => {
    const onChiudi = vi.fn();
    renderModal({ onChiudi });

    const dialog = document.querySelector('dialog')!;
    fireEvent(dialog, new Event('close'));

    await waitFor(() => expect(onChiudi).toHaveBeenCalledTimes(1));
  });

  it('chiama dialog.close() al click sul pulsante X', () => {
    renderModal();
    const closeSpy = vi.spyOn(HTMLDialogElement.prototype, 'close');
    fireEvent.click(screen.getByRole('button', { name: /chiudi/i, hidden: true }));
    expect(closeSpy).toHaveBeenCalled();
  });

  it('rimuove il listener "close" quando il componente si smonta (cleanup)', () => {
    const onChiudi = vi.fn();
    const { unmount } = renderModal({ onChiudi });
    unmount();

    const dialog = document.querySelector('dialog');
    if (dialog) fireEvent(dialog, new Event('close'));
    // Dopo lo smontaggio il listener non deve essere più attivo
    expect(onChiudi).not.toHaveBeenCalled();
  });
});