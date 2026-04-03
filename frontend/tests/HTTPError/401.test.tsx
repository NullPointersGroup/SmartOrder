import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Unauthorized } from '../../src/HTTPError/401';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router-dom')>()),
  useNavigate: () => mockNavigate,
}));

describe('Unauthorized', () => {
  it('mostra il codice 401', () => {
    render(<MemoryRouter><Unauthorized /></MemoryRouter>);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('401');
  });

  it('mostra il titolo e il messaggio di errore', () => {
    render(<MemoryRouter><Unauthorized /></MemoryRouter>);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(/non autorizzato/i);
    expect(screen.getByText(/sessione sia terminata/i)).toBeInTheDocument();
  });

  it('il bottone naviga verso /', () => {
    render(<MemoryRouter><Unauthorized /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: /torna al login/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});