import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AuthPage from '../../src/auth/AuthPage';

const mockNavigate = vi.fn();
const mockSetAuth = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../../src/auth/authStore', () => ({
  useAuthStore: vi.fn((selector) => {
    const state = { setAuth: mockSetAuth };
    return selector ? selector(state) : state;
  }),
}));

vi.mock('../../src/hooks/usePageTitle', () => ({ usePageTitle: vi.fn() }));

vi.mock('../../src/auth/AuthAPI', () => ({
  login: vi.fn(),
  register: vi.fn(),
}));

// Mock di fetch con admin false
vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({ username: 'mario', admin: false }),
}));

function renderInRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('AuthPage', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockSetAuth.mockClear();
    vi.mocked(globalThis.fetch).mockClear();
  });

  it('onLogin ok: chiama /auth/me, setAuth con username e naviga a /home', async () => {
    const { login: loginApi } = await import('../../src/auth/AuthAPI');
    vi.mocked(loginApi).mockResolvedValue({ ok: true, errors: [] });

    renderInRouter(<AuthPage />);
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'mario' } });
    fireEvent.change(screen.getAllByLabelText(/password/i)[0], { target: { value: 'Password1!' } });
    fireEvent.click(screen.getByTestId('submit-btn'));

    await waitFor(() => {
      // Verifica che la fetch a /auth/me sia stata chiamata
      expect(globalThis.fetch).toHaveBeenCalledWith('/auth/me', expect.anything());
    });

    await waitFor(() => {
      // Ora verifica che setAuth sia stato chiamato con username e admin false
      expect(mockSetAuth).toHaveBeenCalledWith('mario', false);
      expect(mockNavigate).toHaveBeenCalledWith('/home');
    });
  });

   it('onLogin fallisce: NON naviga', async () => {
   const { login: loginApi } = await import('../../src/auth/AuthAPI');
   vi.mocked(loginApi).mockResolvedValue({ ok: false, errors: ['Errore'] });

   renderInRouter(<AuthPage />);
   fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'mario' } });
   fireEvent.change(screen.getAllByLabelText(/password/i)[0], { target: { value: 'Password1!' } });
   fireEvent.click(screen.getByTestId('submit-btn'));

   await waitFor(() => expect(mockNavigate).not.toHaveBeenCalled());
   });

   it('onRegister ok: torna al tab login (RF-OB_22)', async () => {
    const { register: registerApi } = await import('../../src/auth/AuthAPI');
    vi.mocked(registerApi).mockResolvedValue({ ok: true, errors: [] });

    renderInRouter(<AuthPage />);
    fireEvent.click(screen.getAllByRole('button', { name: /^registrati$/i })[0]);
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'mario123' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'mario@example.com' } });
    const [pwdField, confirmField] = screen.getAllByLabelText(/password/i);
    fireEvent.change(pwdField,     { target: { value: 'Password1!' } });
    fireEvent.change(confirmField, { target: { value: 'Password1!' } });
    fireEvent.click(screen.getByTestId('submit-btn'));

    await waitFor(() => {
      expect(mockNavigate).not.toHaveBeenCalled();
      expect(screen.getByRole('heading', { name: /accedi/i })).toBeInTheDocument();
      expect(globalThis.fetch).not.toHaveBeenCalledWith('/auth/me', expect.anything());
    });
   });
});
