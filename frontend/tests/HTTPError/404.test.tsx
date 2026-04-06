import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NotFound } from '../../src/HTTPError/404';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../hooks/usePageTitle', () => ({
  usePageTitle: vi.fn(),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router-dom')>()),
  useNavigate: () => mockNavigate,
}));

describe('NotFound', () => {
  afterEach(() => vi.restoreAllMocks());

  //TU-F_347
  it('mostra il titolo di errore', () => {
    render(<NotFound />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/404/i);
  });

  //TU-F_348  
  it('mostra il messaggio descrittivo', () => {
    render(<NotFound />);
    expect(screen.getByText(/la pagina che stai cercando/i)).toBeInTheDocument();
  });

  //TU-F_349
  it('il bottone vai al login naviga verso /', () => {
    render(<MemoryRouter><NotFound /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: /vai al login/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  //TU-F_350
  it('il bottone torna alla chat naviga verso /home', () => {
    render(<MemoryRouter><NotFound /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: /torna alla chat/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/home');
  });

  //TU-F_351
  it('mostra il bottone per riprovare', () => {
    render(<NotFound />);
    expect(screen.getByRole('button', { name: /vai al login/i })).toBeInTheDocument();
  });
});