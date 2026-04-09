import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AuthPage from '../../src/auth/AuthPage';

const { mockNavigate, mockSetAuth, mockInitAuth, mockUseAuthStore } = vi.hoisted(() => {
  const mockNavigate = vi.fn();
  const mockSetAuth = vi.fn();
  const mockInitAuth = vi.fn().mockResolvedValue(undefined);

  const mockUseAuthStore = Object.assign(
    vi.fn((selector?: (s: unknown) => unknown) => {
      const state = { setAuth: mockSetAuth, initAuth: mockInitAuth };
      return selector ? selector(state) : state;
    }),
    { getState: () => ({ admin: false }) }
  );

  return { mockNavigate, mockSetAuth, mockInitAuth, mockUseAuthStore };
});

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../../src/auth/authStore', () => ({
  useAuthStore: mockUseAuthStore,
}));

vi.mock('../../src/hooks/usePageTitle', () => ({ usePageTitle: vi.fn() }));

vi.mock('../../src/auth/FormModel', () => {
  class FormModel {
    constructor() {}

    validate() {
      return {};
    }
  }

  const login = vi.fn();
  const register = vi.fn();

  return {
    FormModel,
    login,
    register,
  };
});

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
    mockInitAuth.mockClear();
    vi.mocked(globalThis.fetch).mockClear();
  });

  //TU-F_22
  it('onLogin ok: chiama initAuth e naviga a /home', async () => {
    const { login: loginApi } = await import('../../src/auth/FormModel');
    vi.mocked(loginApi).mockResolvedValue({ ok: true, errors: [] });

    renderInRouter(<AuthPage />);
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'mario' } });
    fireEvent.change(screen.getAllByLabelText(/password/i)[0], { target: { value: 'Password1!' } });
    fireEvent.click(screen.getByTestId('submit-btn'));

    await waitFor(() => {
      expect(mockInitAuth).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith('/home');
    });
  });

  //TU-F_23
  it('onLogin fallisce: NON naviga', async () => {
    const { login: loginApi } = await import('../../src/auth/FormModel');
    vi.mocked(loginApi).mockResolvedValue({ ok: false, errors: ['Errore'] });

    renderInRouter(<AuthPage />);
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'mario' } });
    fireEvent.change(screen.getAllByLabelText(/password/i)[0], { target: { value: 'Password1!' } });
    fireEvent.click(screen.getByTestId('submit-btn'));

    await waitFor(() => expect(mockNavigate).not.toHaveBeenCalled());
  });

  //TU-F_24
  it('onRegister ok: torna al tab login (RF-OB_22)', async () => {
    const { register: registerApi } = await import('../../src/auth/FormModel');
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
