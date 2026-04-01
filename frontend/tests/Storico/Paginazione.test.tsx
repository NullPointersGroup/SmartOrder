import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Paginazione } from '../../src/Storico/Paginazione';

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
    const counter = document.querySelector('span.font-mono');
    if (!counter) throw new Error('elemento contatore non trovato');
    expect(
    counter.textContent
        ?.replaceAll(/\s+/g, ' ')
        .trim()
    ).toMatch(/2\s*\/\s*5/);
  });

  it('mostra i pulsanti "Precedente" e "Successivo"', () => {
    renderPaginazione(2, 5);
    expect(screen.getByRole('button', { name: /precedente/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /successivo/i })).toBeInTheDocument();
  });
});

// ─── Stato pulsanti ───────────────────────────────────────────────────────────

describe('Paginazione – stato disabled dei pulsanti', () => {
  it('"Precedente" è disabilitato alla prima pagina', () => {
    renderPaginazione(1, 3);
    expect(screen.getByRole('button', { name: /precedente/i })).toBeDisabled();
  });

  it('"Precedente" è abilitato se pagina > 1', () => {
    renderPaginazione(2, 3);
    expect(screen.getByRole('button', { name: /precedente/i })).not.toBeDisabled();
  });

  it('"Successivo" è disabilitato all\'ultima pagina', () => {
    renderPaginazione(3, 3);
    expect(screen.getByRole('button', { name: /successivo/i })).toBeDisabled();
  });

  it('"Successivo" è abilitato se pagina < totalePagine', () => {
    renderPaginazione(2, 3);
    expect(screen.getByRole('button', { name: /successivo/i })).not.toBeDisabled();
  });

  it('entrambi i pulsanti abilitati quando si è in mezzo alle pagine', () => {
    renderPaginazione(3, 5);
    expect(screen.getByRole('button', { name: /precedente/i })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: /successivo/i })).not.toBeDisabled();
  });
});

// ─── Interazione ─────────────────────────────────────────────────────────────

describe('Paginazione – interazione', () => {
  it('chiama onCambia con pagina-1 al click su "Precedente"', () => {
    const onCambia = vi.fn();
    renderPaginazione(3, 5, onCambia);
    fireEvent.click(screen.getByRole('button', { name: /precedente/i }));
    expect(onCambia).toHaveBeenCalledWith(2);
  });

  it('chiama onCambia con pagina+1 al click su "Successivo"', () => {
    const onCambia = vi.fn();
    renderPaginazione(3, 5, onCambia);
    fireEvent.click(screen.getByRole('button', { name: /successivo/i }));
    expect(onCambia).toHaveBeenCalledWith(4);
  });

  it('non chiama onCambia se "Precedente" è disabilitato', async () => {
    const onCambia = vi.fn();
    renderPaginazione(1, 5, onCambia);
    // userEvent rispetta lo stato disabled del pulsante, fireEvent no
    await userEvent.click(screen.getByRole('button', { name: /precedente/i }));
    expect(onCambia).not.toHaveBeenCalled();
  });

  it('non chiama onCambia se "Successivo" è disabilitato', async () => {
    const onCambia = vi.fn();
    renderPaginazione(5, 5, onCambia);
    await userEvent.click(screen.getByRole('button', { name: /successivo/i }));
    expect(onCambia).not.toHaveBeenCalled();
  });

  it('chiama onCambia esattamente una volta per click', () => {
    const onCambia = vi.fn();
    renderPaginazione(2, 5, onCambia);
    fireEvent.click(screen.getByRole('button', { name: /successivo/i }));
    fireEvent.click(screen.getByRole('button', { name: /successivo/i }));
    // Nota: la seconda chiamata punta sempre a pagina+1 del valore nel prop (non aggiornato qui)
    expect(onCambia).toHaveBeenCalledTimes(2);
  });
});