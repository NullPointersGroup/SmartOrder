import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { Paginazione } from '../../src/storico/Paginazione';

function renderPaginazione(
  pagina: number,
  totalePagine: number,
  onCambia = vi.fn()
) {
  return render(
    <Paginazione
      pagina={pagina}
      totalePagine={totalePagine}
      onCambia={onCambia}
    />
  );
}

beforeEach(() => vi.clearAllMocks());

// ─── Nessun render con una sola pagina ───────────────────────────────────────

describe('Paginazione – non renderizzata se totalePagine <= 1', () => {
  it('non monta nulla se totalePagine=1', () => {
    const { container } = renderPaginazione(1, 1);
    expect(container.firstChild).toBeNull();
  });

  it('non monta nulla se totalePagine=0', () => {
    const { container } = renderPaginazione(1, 0);
    expect(container.firstChild).toBeNull();
  });
});

// ─── Render base ─────────────────────────────────────────────────────────────

describe('Paginazione – render base', () => {
  it('mostra il numero di pagina corrente e il totale', () => {
    renderPaginazione(2, 5);
    // Il testo "2 / 5" è spezzato da un <span> interno: cerchiamo il contenitore
    const counter = document.querySelector('span.font-mono')!;
    expect(counter.textContent?.replace(/\s+/g, ' ').trim()).toMatch(/2\s*\/\s*5/);
  });

  it('mostra i pulsanti "Precedente" e "Successivo"', () => {
    renderPaginazione(2, 5);
    expect(screen.getByText(/precedente/i)).toBeInTheDocument();
    expect(screen.getByText(/successivo/i)).toBeInTheDocument();
  });
});

// ─── Stato pulsanti ───────────────────────────────────────────────────────────

describe('Paginazione – stato disabled dei pulsanti', () => {
  it('"Precedente" è disabilitato alla prima pagina', () => {
    renderPaginazione(1, 3);
    const btn = screen.getByText(/precedente/i).closest('button')!;
    expect(btn).toBeDisabled();
  });

  it('"Precedente" è abilitato se pagina > 1', () => {
    renderPaginazione(2, 3);
    const btn = screen.getByText(/precedente/i).closest('button')!;
    expect(btn).not.toBeDisabled();
  });

  it('"Successivo" è disabilitato all\'ultima pagina', () => {
    renderPaginazione(3, 3);
    const btn = screen.getByText(/successivo/i).closest('button')!;
    expect(btn).toBeDisabled();
  });

  it('"Successivo" è abilitato se pagina < totalePagine', () => {
    renderPaginazione(2, 3);
    const btn = screen.getByText(/successivo/i).closest('button')!;
    expect(btn).not.toBeDisabled();
  });

  it('entrambi i pulsanti abilitati quando si è in mezzo alle pagine', () => {
    renderPaginazione(3, 5);
    expect(screen.getByText(/precedente/i).closest('button')).not.toBeDisabled();
    expect(screen.getByText(/successivo/i).closest('button')).not.toBeDisabled();
  });
});

// ─── Interazione ─────────────────────────────────────────────────────────────

describe('Paginazione – interazione', () => {
  it('chiama onCambia con pagina-1 al click su "Precedente"', () => {
    const onCambia = vi.fn();
    renderPaginazione(3, 5, onCambia);
    fireEvent.click(screen.getByText(/precedente/i));
    expect(onCambia).toHaveBeenCalledWith(2);
  });

  it('chiama onCambia con pagina+1 al click su "Successivo"', () => {
    const onCambia = vi.fn();
    renderPaginazione(3, 5, onCambia);
    fireEvent.click(screen.getByText(/successivo/i));
    expect(onCambia).toHaveBeenCalledWith(4);
  });

  it('non chiama onCambia se "Precedente" è disabilitato', () => {
    const onCambia = vi.fn();
    renderPaginazione(1, 5, onCambia);
    fireEvent.click(screen.getByText(/precedente/i));
    expect(onCambia).not.toHaveBeenCalled();
  });

  it('non chiama onCambia se "Successivo" è disabilitato', () => {
    const onCambia = vi.fn();
    renderPaginazione(5, 5, onCambia);
    fireEvent.click(screen.getByText(/successivo/i));
    expect(onCambia).not.toHaveBeenCalled();
  });

  it('chiama onCambia esattamente una volta per click', () => {
    const onCambia = vi.fn();
    renderPaginazione(2, 5, onCambia);
    fireEvent.click(screen.getByText(/successivo/i));
    fireEvent.click(screen.getByText(/successivo/i));
    // Nota: la seconda chiamata punta sempre a pagina+1 del valore nel prop (non aggiornato qui)
    expect(onCambia).toHaveBeenCalledTimes(2);
  });
});