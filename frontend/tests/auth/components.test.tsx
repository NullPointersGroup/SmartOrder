import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import FormErrors from '../../src/auth/FormErrors';
import Form from '../../src/auth/FormView';
import Login from '../../src/auth/Login';
import Register from '../../src/auth/Register';
import AuthPage from '../../src/auth/AuthPage';
import type { FieldConfig } from '../../src/auth/FormModel';
import type { FormViewModel } from '../../src/auth/FormViewModel';

const mockNavigate = vi.fn();
const mockSetAuth = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../../src/auth/authStore', () => ({
  useAuthStore: () => ({ setAuth: mockSetAuth }),
}));

vi.mock('../../src/hooks/usePageTitle', () => ({ usePageTitle: vi.fn() }));

vi.mock('../../src/auth/AuthAPI', () => ({
  login:                vi.fn().mockResolvedValue({ ok: true, errors: [], token: 'tok' }),
  register:             vi.fn().mockResolvedValue({ ok: true, errors: [], token: 'tok' }),
  getUsernameFromToken: vi.fn().mockReturnValue('mario'),
}));

function renderInRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

function makeVM(overrides: Partial<FormViewModel> = {}): FormViewModel {
  return {
    values:       { username: '', password: '' },
    fieldErrors:  {},
    errors:       [],
    loading:      false,
    handleChange: vi.fn(),
    handleBlur:   vi.fn(),
    handleSubmit: vi.fn(),
    ...overrides,
  };
}

const BASE_FIELDS: FieldConfig[] = [
  { key: 'username', label: 'Username', type: 'text' },
  { key: 'password', label: 'Password', type: 'password' },
];

const PASSWORD_FIELDS: FieldConfig[] = [
  { key: 'password', label: 'Password', type: 'password' },
];

describe('FormErrors', () => {
  it('errors vuoto: non renderizza nulla', () => {
    const { container } = render(<FormErrors errors={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('errors non vuoto: renderizza un paragrafo per errore', () => {
    render(<FormErrors errors={['Errore A', 'Errore B']} />);
    expect(screen.getByText('Errore A')).toBeInTheDocument();
    expect(screen.getByText('Errore B')).toBeInTheDocument();
  });
});

describe('FormView – rendering e interazioni', () => {
  it('mostra titolo, label campi e pulsante submit', () => {
    render(<Form title="Accedi" submitLabel="Invia" fields={BASE_FIELDS} vm={makeVM()} />);
    expect(screen.getByRole('heading', { name: /accedi/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /invia/i })).toBeInTheDocument();
  });

  it('loading=true: pulsante disabilitato con testo Caricamento', () => {
    render(<Form title="T" submitLabel="S" fields={BASE_FIELDS} vm={makeVM({ loading: true })} />);
    expect(screen.getByRole('button', { name: /caricamento/i })).toBeDisabled();
  });

  it('fieldErrors truthy: mostra errore inline', () => {
    render(<Form title="T" submitLabel="S" fields={BASE_FIELDS} vm={makeVM({ fieldErrors: { username: 'Errore' } })} />);
    expect(screen.getByText('Errore')).toBeInTheDocument();
  });

  it('fieldErrors falsy: nessun paragrafo errore', () => {
    render(<Form title="T" submitLabel="S" fields={BASE_FIELDS} vm={makeVM()} />);
    expect(document.querySelectorAll('p.text-sm')).toHaveLength(0);
  });

  it('handleChange chiamato al change', () => {
    const vm = makeVM();
    render(<Form title="T" submitLabel="S" fields={BASE_FIELDS} vm={vm} />);
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'mario' } });
    expect(vm.handleChange).toHaveBeenCalledWith('username', 'mario');
  });

  it('handleBlur chiamato al blur', () => {
    const vm = makeVM();
    render(<Form title="T" submitLabel="S" fields={BASE_FIELDS} vm={vm} />);
    fireEvent.blur(screen.getByLabelText(/username/i));
    expect(vm.handleBlur).toHaveBeenCalledWith('username');
  });

  it('handleSubmit chiamato al click submit', () => {
    const vm = makeVM();
    render(<Form title="T" submitLabel="Invia" fields={BASE_FIELDS} vm={vm} />);
    fireEvent.click(screen.getByRole('button', { name: /invia/i }));
    expect(vm.handleSubmit).toHaveBeenCalled();
  });

  it('toggle password: click cambia tipo da password a text e viceversa', () => {
    render(<Form title="T" submitLabel="S" fields={PASSWORD_FIELDS} vm={makeVM({ values: { password: '' } })} />);
    const input = screen.getByLabelText(/password/i);
    const toggle = screen.getAllByRole('button').find(b => b.getAttribute('type') === 'button')!;

    expect(input).toHaveAttribute('type', 'password');
    fireEvent.click(toggle);
    expect(input).toHaveAttribute('type', 'text');
    fireEvent.click(toggle);
    expect(input).toHaveAttribute('type', 'password');
  });
});

describe('Login', () => {
  it('mostra titolo, username e password', () => {
    renderInRouter(<Login onLogin={vi.fn()} />);
    expect(screen.getByRole('heading', { name: /accedi/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('ok=true: chiama onLogin con token', async () => {
    const onLogin = vi.fn();
    const { login: loginApi } = await import('../../src/auth/AuthAPI');
    vi.mocked(loginApi).mockResolvedValue({ ok: true, errors: [], token: 'jwt-tok' });

    renderInRouter(<Login onLogin={onLogin} />);
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'mario' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'Password1!' } });
    fireEvent.click(screen.getByRole('button', { name: /accedi/i }));

    await waitFor(() => expect(onLogin).toHaveBeenCalledWith('jwt-tok'));
  });

  it('ok=false: mostra errore, NON chiama onLogin (RF-OB_28)', async () => {
    const onLogin = vi.fn();
    const { login: loginApi } = await import('../../src/auth/AuthAPI');
    vi.mocked(loginApi).mockResolvedValue({ ok: false, errors: ['Username o password errati'] });

    renderInRouter(<Login onLogin={onLogin} />);
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'x' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'Sbagliata1!' } });
    fireEvent.click(screen.getByRole('button', { name: /accedi/i }));

    await waitFor(() => {
      expect(screen.getByText(/username o password errati/i)).toBeInTheDocument();
      expect(onLogin).not.toHaveBeenCalled();
    });
  });
});

describe('Register', () => {
  it('mostra titolo e 4 campi', () => {
    renderInRouter(<Register onRegister={vi.fn()} />);
    expect(screen.getByText(/crea account/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getAllByLabelText(/password/i)).toHaveLength(2);
  });

  it('username < 4 char: mostra errore inline', async () => {
    renderInRouter(<Register onRegister={vi.fn()} />);
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'ab' } });
    fireEvent.blur(screen.getByLabelText(/username/i));
    await waitFor(() => expect(screen.getByText(/tra 4 e 24/i)).toBeInTheDocument());
  });

  it('email non valida: mostra errore inline', async () => {
    renderInRouter(<Register onRegister={vi.fn()} />);
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'nonvalida' } });
    fireEvent.blur(screen.getByLabelText(/email/i));
    await waitFor(() => expect(screen.getByText(/email non valida/i)).toBeInTheDocument());
  });

  it('password non conforme: mostra errore inline (RF-OB_11)', async () => {
    renderInRouter(<Register onRegister={vi.fn()} />);
    const [pwdField] = screen.getAllByLabelText(/password/i);
    fireEvent.change(pwdField, { target: { value: 'Password1' } });
    fireEvent.blur(pwdField);
    await waitFor(() =>
      expect(screen.getByText(/almeno.*maiuscola|criteri|speciale|8.*24/i)).toBeInTheDocument()
    );
  });

  it('password non coincide: mostra errore (RF-OB_16)', async () => {
    renderInRouter(<Register onRegister={vi.fn()} />);
    const [pwdField, confirmField] = screen.getAllByLabelText(/password/i);
    fireEvent.change(pwdField, { target: { value: 'Password1!' } });
    fireEvent.change(confirmField, { target: { value: 'Diversa123!' } });
    fireEvent.click(screen.getByRole('button', { name: /registrati/i }));
    await waitFor(() => expect(screen.getByText(/non coincidono/i)).toBeInTheDocument());
  });

  it('ok=true: chiama onRegister con token (RF-OB_22)', async () => {
    const onRegister = vi.fn();
    const { register: registerApi } = await import('../../src/auth/AuthAPI');
    vi.mocked(registerApi).mockResolvedValue({ ok: true, errors: [], token: 'new-tok' });

    renderInRouter(<Register onRegister={onRegister} />);
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'mario123' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'mario@example.com' } });
    const [pwdField, confirmField] = screen.getAllByLabelText(/password/i);
    fireEvent.change(pwdField, { target: { value: 'Password1!' } });
    fireEvent.change(confirmField, { target: { value: 'Password1!' } });
    fireEvent.click(screen.getByRole('button', { name: /registrati/i }));

    await waitFor(() => expect(onRegister).toHaveBeenCalledWith('new-tok'));
  });

  it('ok=false: mostra errore server (RF-OB_04)', async () => {
    const { register: registerApi } = await import('../../src/auth/AuthAPI');
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

describe('AuthPage', () => {
  beforeEach(() => { mockNavigate.mockClear(); mockSetAuth.mockClear(); });

  it('mostra brand, tab Accedi/Registrati, form Login di default', () => {
    renderInRouter(<AuthPage />);
    expect(screen.getByText(/smartorder/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /accedi/i })).toBeInTheDocument();
  });

  it('click Registrati: mostra Register; click Accedi: torna a Login', () => {
    renderInRouter(<AuthPage />);
    fireEvent.click(screen.getByRole('button', { name: /^registrati$/i }));
    expect(screen.getByText(/crea account/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /^accedi$/i }));
    expect(screen.getByRole('heading', { name: /accedi/i })).toBeInTheDocument();
  });

  it('onLogin con token: chiama setAuth e naviga a /chat', async () => {
    const { login: loginApi, getUsernameFromToken } = await import('../../src/auth/AuthAPI');
    vi.mocked(loginApi).mockResolvedValue({ ok: true, errors: [], token: 'jwt-tok' });
    vi.mocked(getUsernameFromToken).mockReturnValue('mario');

    renderInRouter(<AuthPage />);
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'mario' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'Password1!' } });
    const accediButtons = screen.getAllByRole('button', { name: /accedi/i });
    fireEvent.click(accediButtons[accediButtons.length - 1]);

    await waitFor(() => {
      expect(mockSetAuth).toHaveBeenCalledWith('jwt-tok', 'mario');
      expect(mockNavigate).toHaveBeenCalledWith('/chat');
    });
  });

  it('onLogin senza token: NON chiama setAuth, naviga comunque', async () => {
    const { login: loginApi } = await import('../../src/auth/AuthAPI');
    vi.mocked(loginApi).mockResolvedValue({ ok: true, errors: [], token: undefined });

    renderInRouter(<AuthPage />);
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'mario' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'Password1!' } });
    const accediButtons = screen.getAllByRole('button', { name: /accedi/i });
    fireEvent.click(accediButtons[accediButtons.length - 1]);

    await waitFor(() => {
      expect(mockSetAuth).not.toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/chat');
    });
  });

  it('onLogin fallisce: NON naviga', async () => {
    const { login: loginApi } = await import('../../src/auth/AuthAPI');
    vi.mocked(loginApi).mockResolvedValue({ ok: false, errors: ['Errore'] });

    renderInRouter(<AuthPage />);
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'mario' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'Password1!' } });
    fireEvent.submit(document.querySelector('form')!);

    await waitFor(() => expect(mockNavigate).not.toHaveBeenCalled());
  });

  it('onRegister con token: chiama setAuth e naviga (RF-OB_22)', async () => {
    const { register: registerApi, getUsernameFromToken } = await import('../../src/auth/AuthAPI');
    vi.mocked(registerApi).mockResolvedValue({ ok: true, errors: [], token: 'reg-tok' });
    vi.mocked(getUsernameFromToken).mockReturnValue('mario');

    renderInRouter(<AuthPage />);
    fireEvent.click(screen.getByRole('button', { name: /^registrati$/i }));
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'mario123' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'mario@example.com' } });
    const [pwdField, confirmField] = screen.getAllByLabelText(/password/i);
    fireEvent.change(pwdField, { target: { value: 'Password1!' } });
    fireEvent.change(confirmField, { target: { value: 'Password1!' } });
    fireEvent.submit(document.querySelector('form')!);

    await waitFor(() => {
      expect(mockSetAuth).toHaveBeenCalledWith('reg-tok', 'mario');
      expect(mockNavigate).toHaveBeenCalledWith('/chat');
    });
  });

  it('onRegister senza token: NON chiama setAuth, naviga comunque', async () => {
    const { register: registerApi } = await import('../../src/auth/AuthAPI');
    vi.mocked(registerApi).mockResolvedValue({ ok: true, errors: [], token: undefined });

    renderInRouter(<AuthPage />);
    fireEvent.click(screen.getByRole('button', { name: /^registrati$/i }));
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'mario123' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'mario@example.com' } });
    const [pwdField, confirmField] = screen.getAllByLabelText(/password/i);
    fireEvent.change(pwdField, { target: { value: 'Password1!' } });
    fireEvent.change(confirmField, { target: { value: 'Password1!' } });
    fireEvent.submit(document.querySelector('form')!);

    await waitFor(() => {
      expect(mockSetAuth).not.toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/chat');
    });
  });
});
