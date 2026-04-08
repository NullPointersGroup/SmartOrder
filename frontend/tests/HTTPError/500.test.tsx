import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ServerError } from '../../src/HTTPError/500';

vi.mock('../hooks/usePageTitle', () => ({
  usePageTitle: vi.fn(),
}));

describe('ServerError', () => {
  afterEach(() => vi.restoreAllMocks());

  //TU-F_352
  it('mostra il titolo di errore', () => {
    render(<ServerError />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/errore di sistema/i);
  });

  //TU-F_353
  it('mostra il messaggio descrittivo', () => {
    render(<ServerError />);
    expect(screen.getByText(/qualcosa è andato storto/i)).toBeInTheDocument();
  });

  //TU-F_354
  it('il bottone chiama location.reload', () => {
    const reloadMock = vi.fn();
    vi.spyOn(globalThis, 'location', 'get').mockReturnValue({
      ...globalThis.location,
      reload: reloadMock,
    });

    render(<ServerError />);
    fireEvent.click(screen.getByRole('button', { name: /riprova a caricare/i }));
    expect(reloadMock).toHaveBeenCalledOnce();
  });

  //TU-F_355
  it('mostra il bottone per riprovare', () => {
    render(<ServerError />);
    expect(screen.getByRole('button', { name: /riprova a caricare/i })).toBeInTheDocument();
  });
});