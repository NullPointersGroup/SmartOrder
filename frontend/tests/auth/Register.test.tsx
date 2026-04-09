import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import Register from '../../src/auth/Register';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => vi.fn() };
});

vi.mock('../../src/auth/authStore', () => ({
  useAuthStore: () => ({ setAuth: vi.fn() }),
}));

vi.mock('../../src/hooks/usePageTitle', () => ({ usePageTitle: vi.fn() }));

vi.mock('../../src/auth/FormModel', () => ({
  FormModel: vi.fn().mockImplementation(() => ({
    login: vi.fn(),
    register: vi.fn(),
  })),
  login: vi.fn(),
  register: vi.fn(),
}));

function renderInRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('Register', () => {
  //TU-F_58
  it('mostra titolo e 4 campi', () => {
    renderInRouter(<Register onRegister={vi.fn()} />);
    expect(screen.getByText(/crea account/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getAllByRole('textbox').length + document.querySelectorAll('input[type="password"]').length).toBe(4);
  });

  //TU-F_59
  it('username < 4 char: mostra errore inline', async () => {
    renderInRouter(<Register onRegister={vi.fn()} />);
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'ab' } });
    fireEvent.blur(screen.getByLabelText(/username/i));
    await waitFor(() => expect(screen.getByText(/tra 4 e 24/i)).toBeInTheDocument());
  });

  //TU-F_60
  it('email non valida: mostra errore inline', async () => {
    renderInRouter(<Register onRegister={vi.fn()} />);
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'nonvalida' } });
    fireEvent.blur(screen.getByLabelText(/email/i));
    await waitFor(() => expect(screen.getByText(/email non valida/i)).toBeInTheDocument());
  });

  //TU-F_61
  it('password non conforme: mostra errore inline (RF-OB_11)', async () => {
    renderInRouter(<Register onRegister={vi.fn()} />);
    const [pwdField] = screen.getAllByLabelText(/password/i);
    fireEvent.change(pwdField, { target: { value: 'Password1' } });
    fireEvent.blur(pwdField);
    await waitFor(() =>
      expect(screen.getByText(/almeno.*maiuscola|criteri|speciale|8.*24/i)).toBeInTheDocument()
    );
  });

  //TU-F_62
  it('password non coincide: mostra errore (RF-OB_16)', async () => {
    renderInRouter(<Register onRegister={vi.fn()} />);
    const [pwdField, confirmField] = screen.getAllByLabelText(/password/i);
    fireEvent.change(pwdField, { target: { value: 'Password1!' } });
    fireEvent.change(confirmField, { target: { value: 'Diversa123!' } });
    fireEvent.click(screen.getByRole('button', { name: /registrati/i }));
    await waitFor(() => expect(screen.getByText(/non coincidono/i)).toBeInTheDocument());
  });

  //TU-F_63
  it('ok=true: chiama onRegister (RF-OB_22)', async () => {
    const onRegister = vi.fn();
    const { register: registerApi } = await import('../../src/auth/FormModel');
    vi.mocked(registerApi).mockResolvedValue({ ok: true, errors: [] });

    renderInRouter(<Register onRegister={onRegister} />);
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'mario123' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'mario@example.com' } });
    const [pwdField, confirmField] = screen.getAllByLabelText(/password/i);
    fireEvent.change(pwdField, { target: { value: 'Password1!' } });
    fireEvent.change(confirmField, { target: { value: 'Password1!' } });
    fireEvent.click(screen.getByRole('button', { name: /registrati/i }));

    await waitFor(() => expect(onRegister).toHaveBeenCalled());
  });

  //TU-F_64
  it('ok=false: mostra errore server (RF-OB_04)', async () => {
    const { register: registerApi } = await import('../../src/auth/FormModel');
    vi.mocked(registerApi).mockResolvedValue({ ok: false, errors: ['Username già esistente'] });

    renderInRouter(<Register onRegister={vi.fn()} />);
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'mario123' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'mario@example.com' } });
    const [pwdField, confirmField] = screen.getAllByLabelText(/password/i);
    fireEvent.change(pwdField, { target: { value: 'Password1!' } });
    fireEvent.change(confirmField, { target: { value: 'Password1!' } });
    fireEvent.click(screen.getByRole('button', { name: /registrati/i }));

    await waitFor(() => expect(screen.getByText(/username già esistente/i)).toBeInTheDocument());
  });
});
