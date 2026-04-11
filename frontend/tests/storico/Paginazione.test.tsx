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
  //TU-F_398
  it('non monta nulla se totalePagine=1', () => {
    const { container } = renderPaginazione(1, 1);
    expect(container.firstChild).toBeNull();
  });

  //TU-F_399
  it('non monta nulla se totalePagine=0', () => {
    const { container } = renderPaginazione(1, 0);
    expect(container.firstChild).toBeNull();
  });
});

// ─── Render base ─────────────────────────────────────────────────────────────

describe('Paginazione – render base', () => {
  //TU-F_400
  it('mostra il numero di pagina corrente e il totale', () => {
    renderPaginazione(2, 5);
    const counter = document.querySelector('span.font-mono');
    if (!counter) throw new Error('elemento contatore non trovato');
    expect(
    counter.textContent
        ?.replaceAll(/\s+/g, ' ')
        .trim()
    ).toMatch(/2\s*\/\s*5/);
  });

  //TU-F_401
  it('mostra i pulsanti "Precedente" e "Successivo"', () => {
    renderPaginazione(2, 5);
    expect(screen.getByRole('button', { name: /precedente/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /successivo/i })).toBeInTheDocument();
  });
});

// ─── Stato pulsanti ───────────────────────────────────────────────────────────

describe('Paginazione – stato disabled dei pulsanti', () => {
  //TU-F_402
  it('"Precedente" è disabilitato alla prima pagina', () => {
    renderPaginazione(1, 3);
    expect(screen.getByRole('button', { name: /precedente/i })).toBeDisabled();
  });

  //TU-F_403
  it('"Precedente" è abilitato se pagina > 1', () => {
    renderPaginazione(2, 3);
    expect(screen.getByRole('button', { name: /precedente/i })).not.toBeDisabled();
  });

  //TU-F_404
  it('"Successivo" è disabilitato all\'ultima pagina', () => {
    renderPaginazione(3, 3);
    expect(screen.getByRole('button', { name: /successivo/i })).toBeDisabled();
  });

  //TU-F_405
  it('"Successivo" è abilitato se pagina < totalePagine', () => {
    renderPaginazione(2, 3);
    expect(screen.getByRole('button', { name: /successivo/i })).not.toBeDisabled();
  });

  //TU-F_406
  it('entrambi i pulsanti abilitati quando si è in mezzo alle pagine', () => {
    renderPaginazione(3, 5);
    expect(screen.getByRole('button', { name: /precedente/i })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: /successivo/i })).not.toBeDisabled();
  });
});

// ─── Interazione ─────────────────────────────────────────────────────────────

describe('Paginazione – interazione', () => {
  //TU-F_407
  it('chiama onCambia con pagina-1 al click su "Precedente"', () => {
    const onCambia = vi.fn();
    renderPaginazione(3, 5, onCambia);
    fireEvent.click(screen.getByRole('button', { name: /precedente/i }));
    expect(onCambia).toHaveBeenCalledWith(2);
  });

  //TU-F_408
  it('chiama onCambia con pagina+1 al click su "Successivo"', () => {
    const onCambia = vi.fn();
    renderPaginazione(3, 5, onCambia);
    fireEvent.click(screen.getByRole('button', { name: /successivo/i }));
    expect(onCambia).toHaveBeenCalledWith(4);
  });

  //TU-F_409
  it('non chiama onCambia se "Precedente" è disabilitato', async () => {
    const onCambia = vi.fn();
    renderPaginazione(1, 5, onCambia);
    fireEvent.click(screen.getByRole('button', { name: /precedente/i }));
    expect(onCambia).not.toHaveBeenCalled();
  });

  //TU-F_410
  it('non chiama onCambia se "Successivo" è disabilitato', async () => {
    const onCambia = vi.fn();
    renderPaginazione(5, 5, onCambia);
    fireEvent.click(screen.getByRole('button', { name: /successivo/i }));
    expect(onCambia).not.toHaveBeenCalled();
  });

  //TU-F_411
  it('chiama onCambia esattamente una volta per click', () => {
    const onCambia = vi.fn();
    renderPaginazione(2, 5, onCambia);
    fireEvent.click(screen.getByRole('button', { name: /successivo/i }));
    fireEvent.click(screen.getByRole('button', { name: /successivo/i }));
    expect(onCambia).toHaveBeenCalledTimes(2);
  });
});