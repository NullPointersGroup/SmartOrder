import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import Login from '../../src/auth/Login';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => vi.fn() };
});

vi.mock('../../src/auth/authStore', () => ({
  useAuthStore: () => ({ setAuth: vi.fn() }),
}));

vi.mock('../../src/hooks/usePageTitle', () => ({ usePageTitle: vi.fn() }));

vi.mock('../../src/auth/AuthAPI', () => ({
  login:    vi.fn().mockResolvedValue({ ok: true, errors: [] }),
  register: vi.fn().mockResolvedValue({ ok: true, errors: [] }),
}));

function renderInRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('Login', () => {
  //TU-F_55
  it('mostra titolo, username e password', () => {
    renderInRouter(<Login onLogin={vi.fn()} />);
    expect(screen.getByRole('heading', { name: /accedi/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    fireEvent.change(screen.getAllByLabelText(/password/i)[0], { target: { value: 'Password1!' } });
  });

  //TU-F_56
  it('ok=true: chiama onLogin', async () => {
    const onLogin = vi.fn();
    const { login: loginApi } = await import('../../src/auth/AuthAPI');
    vi.mocked(loginApi).mockResolvedValue({ ok: true, errors: [] });

    renderInRouter(<Login onLogin={onLogin} />);
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'mario' } });
    fireEvent.change(screen.getAllByLabelText(/password/i)[0], { target: { value: 'Password1!' } });
    fireEvent.click(screen.getByRole('button', { name: /accedi/i }));

    await waitFor(() => expect(onLogin).toHaveBeenCalled());
  });

  //TU-F_57
  it('ok=false: mostra errore, NON chiama onLogin (RF-OB_28)', async () => {
    const onLogin = vi.fn();
    const { login: loginApi } = await import('../../src/auth/AuthAPI');
    vi.mocked(loginApi).mockResolvedValue({ ok: false, errors: ['Username o password errati'] });

    renderInRouter(<Login onLogin={onLogin} />);
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'x' } });
    fireEvent.change(screen.getAllByLabelText(/password/i)[0], { target: { value: 'Sbagliata1!' } });
    fireEvent.click(screen.getByRole('button', { name: /accedi/i }));

    await waitFor(() => {
      expect(screen.getByText(/username o password errati/i)).toBeInTheDocument();
      expect(onLogin).not.toHaveBeenCalled();
    });
  });
});
