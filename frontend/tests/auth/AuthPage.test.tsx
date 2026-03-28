import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import AuthPage from '../../src/auth/AuthPage';

const mockNavigate = vi.fn();
const mockSetAuth  = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../../src/auth/authStore', () => ({
  useAuthStore: () => ({ setAuth: mockSetAuth }),
}));

vi.mock('../../src/hooks/usePageTitle', () => ({ usePageTitle: vi.fn() }));

vi.mock('../../src/auth/AuthAPI', () => ({
  login:    vi.fn().mockResolvedValue({ ok: true, errors: [] }),
  register: vi.fn().mockResolvedValue({ ok: true, errors: [] }),
}));

vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
  ok:   true,
  json: () => Promise.resolve({ username: 'mario' }),
}));

function renderInRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('AuthPage', () => {
  beforeEach(() => { mockNavigate.mockClear(); mockSetAuth.mockClear(); });

  it('mostra brand, tab Accedi/Registrati, form Login di default', () => {
    renderInRouter(<AuthPage />);
    expect(screen.getByText(/smartorder/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /accedi/i })).toBeInTheDocument();
  });

  it('click Registrati: mostra Register; click Accedi: torna a Login', () => {
    renderInRouter(<AuthPage />);
    fireEvent.click(screen.getAllByRole('button', { name: /^registrati$/i })[0]);
    expect(screen.getByText(/crea account/i)).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: /^accedi$/i })[0]);
    expect(screen.getByRole('heading', { name: /accedi/i })).toBeInTheDocument();
  });

  it('onLogin ok: chiama /auth/me, setAuth con username e naviga a /home', async () => {
    const { login: loginApi } = await import('../../src/auth/AuthAPI');
    vi.mocked(loginApi).mockResolvedValue({ ok: true, errors: [] });

    renderInRouter(<AuthPage />);
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'mario' } });
    fireEvent.change(screen.getAllByLabelText(/password/i)[0], { target: { value: 'Password1!' } });
    fireEvent.click(screen.getByTestId('submit-btn'));

    await waitFor(() => {
      expect(mockSetAuth).toHaveBeenCalledWith('mario');
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
   });
   });
});
