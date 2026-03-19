import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import FormErrors    from '../../src/auth/FormErrors';
import Form          from '../../src/auth/FormView';
import Login         from '../../src/auth/Login';
import Register      from '../../src/auth/Register';
import AuthPage      from '../../src/auth/AuthPage';
import type { FieldConfig } from '../../src/auth/FormModel';
import type { FormViewModel } from '../../src/auth/FormViewModel';


const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../../src/auth/authStore', () => ({
  useAuthStore: () => ({ setAuth: vi.fn() }),
}));

vi.mock('../../src/hooks/usePageTitle', () => ({
  usePageTitle: vi.fn(),
}));

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
  { key: 'username', label: 'Username', type: 'text',     placeholder: 'Es: Mario' },
  { key: 'password', label: 'Password', type: 'password', placeholder: 'Es: #Pw1!' },
];


describe('FormErrors', () => {
  it('non renderizza nulla se la lista errori è vuota', () => {
    const { container } = render(<FormErrors errors={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('mostra un paragrafo per ogni errore (RF-OB_04, RF-OB_21, RF-OB_28)', () => {
    render(<FormErrors errors={['Errore A', 'Errore B']} />);
    expect(screen.getByText('Errore A')).toBeInTheDocument();
    expect(screen.getByText('Errore B')).toBeInTheDocument();
  });

  it('mostra un singolo errore correttamente', () => {
    render(<FormErrors errors={['Username o password errati']} />);
    expect(screen.getByText('Username o password errati')).toBeInTheDocument();
  });

  it('i messaggi di errore hanno il colore rosso (classe CSS)', () => {
    render(<FormErrors errors={['Errore']} />);
    expect(screen.getByText('Errore').className).toMatch(/972020|red/);
  });
});


describe('FormView – rendering', () => {
  it('mostra il titolo passato come prop', () => {
    render(<Form title="Accedi" submitLabel="Accedi" fields={BASE_FIELDS} vm={makeVM()} />);
    expect(screen.getByText('Accedi')).toBeInTheDocument();
  });

  it('mostra il label di ogni campo (RF-OB_01, RF-OB_07)', () => {
    render(<Form title="T" submitLabel="S" fields={BASE_FIELDS} vm={makeVM()} />);
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('mostra il pulsante di submit con il label corretto', () => {
    render(<Form title="T" submitLabel="Invia" fields={BASE_FIELDS} vm={makeVM()} />);
    expect(screen.getByRole('button', { name: /invia/i })).toBeInTheDocument();
  });

  it('il pulsante mostra "Caricamento..." e risulta disabilitato durante loading', () => {
    render(<Form title="T" submitLabel="S" fields={BASE_FIELDS} vm={makeVM({ loading: true })} />);
    expect(screen.getByRole('button', { name: /caricamento/i })).toBeDisabled();
  });

  it('mostra il fieldError inline sotto il campo corretto', () => {
    const vm = makeVM({ fieldErrors: { username: 'Username obbligatorio' } });
    render(<Form title="T" submitLabel="S" fields={BASE_FIELDS} vm={vm} />);
    expect(screen.getByText('Username obbligatorio')).toBeInTheDocument();
  });

  it('mostra gli errori globali tramite FormErrors', () => {
    const vm = makeVM({ errors: ['Username o password errati'] });
    render(<Form title="T" submitLabel="S" fields={BASE_FIELDS} vm={vm} />);
    expect(screen.getByText('Username o password errati')).toBeInTheDocument();
  });
});

describe('FormView – interazioni', () => {
  it('chiama handleChange digitando in un campo', async () => {
    const vm = makeVM();
    render(<Form title="T" submitLabel="S" fields={BASE_FIELDS} vm={vm} />);
    await userEvent.type(screen.getByLabelText(/username/i), 'mario');
    expect(vm.handleChange).toHaveBeenCalled();
  });

  it('chiama handleBlur all\'uscita dal campo', async () => {
    const vm = makeVM();
    render(<Form title="T" submitLabel="S" fields={BASE_FIELDS} vm={vm} />);
    await userEvent.click(screen.getByLabelText(/username/i));
    await userEvent.tab();
    expect(vm.handleBlur).toHaveBeenCalledWith('username');
  });

  it('chiama handleSubmit al click sul pulsante', async () => {
    const vm = makeVM();
    render(<Form title="T" submitLabel="Invia" fields={BASE_FIELDS} vm={vm} />);
    await userEvent.click(screen.getByRole('button', { name: /invia/i }));
    expect(vm.handleSubmit).toHaveBeenCalled();
  });

  it('il toggle visibilità password cambia il tipo dell\'input da password a text', async () => {
    render(<Form title="T" submitLabel="S" fields={BASE_FIELDS} vm={makeVM()} />);
    const pwdInput = screen.getByLabelText(/password/i);
    expect(pwdInput).toHaveAttribute('type', 'password');

    const toggleBtn = screen.getAllByRole('button').find(b => b.getAttribute('type') === 'button');
    await userEvent.click(toggleBtn!);

    expect(pwdInput).toHaveAttribute('type', 'text');
  });

  it('il toggle visibilità rende di nuovo nascosta la password al secondo click', async () => {
    render(<Form title="T" submitLabel="S" fields={BASE_FIELDS} vm={makeVM()} />);
    const pwdInput  = screen.getByLabelText(/password/i);
    const toggleBtn = screen.getAllByRole('button').find(b => b.getAttribute('type') === 'button')!;

    await userEvent.click(toggleBtn);
    await userEvent.click(toggleBtn);

    expect(pwdInput).toHaveAttribute('type', 'password');
  });
});


describe('Login', () => {
  it('mostra il titolo "Accedi"', () => {
    renderInRouter(<Login onLogin={vi.fn()} />);
    expect(screen.getByText('Accedi')).toBeInTheDocument();
  });

  it('mostra il campo username (RF-OB_23)', () => {
    renderInRouter(<Login onLogin={vi.fn()} />);
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
  });

  it('mostra il campo password (RF-OB_25)', () => {
    renderInRouter(<Login onLogin={vi.fn()} />);
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('mostra il pulsante "Accedi"', () => {
    renderInRouter(<Login onLogin={vi.fn()} />);
    expect(screen.getByRole('button', { name: /accedi/i })).toBeInTheDocument();
  });

  it('chiama onLogin con il token dopo login corretto', async () => {
    const onLogin = vi.fn();
    const { login: loginApi } = await import('../../src/auth/AuthAPI');
    vi.mocked(loginApi).mockResolvedValue({ ok: true, errors: [], token: 'jwt-tok' });

    renderInRouter(<Login onLogin={onLogin} />);
    await userEvent.type(screen.getByLabelText(/username/i), 'mario');
    await userEvent.type(screen.getByLabelText(/password/i), 'Password1!');
    await userEvent.click(screen.getByRole('button', { name: /accedi/i }));

    await waitFor(() => expect(onLogin).toHaveBeenCalledWith('jwt-tok'));
  });

  it('mostra errore "Username o password errati" se autenticazione fallisce (RF-OB_28)', async () => {
    const { login: loginApi } = await import('../../src/auth/AuthAPI');
    vi.mocked(loginApi).mockResolvedValue({ ok: false, errors: ['Username o password errati'] });

    renderInRouter(<Login onLogin={vi.fn()} />);
    await userEvent.type(screen.getByLabelText(/username/i), 'sbagliato');
    await userEvent.type(screen.getByLabelText(/password/i), 'Sbagliata1!');
    await userEvent.click(screen.getByRole('button', { name: /accedi/i }));

    await waitFor(() => {
      expect(screen.getByText(/username o password errati/i)).toBeInTheDocument();
    });
  });

  it('non chiama onLogin se le credenziali sono errate', async () => {
    const onLogin = vi.fn();
    const { login: loginApi } = await import('../../src/auth/AuthAPI');
    vi.mocked(loginApi).mockResolvedValue({ ok: false, errors: ['Errore'] });

    renderInRouter(<Login onLogin={onLogin} />);
    await userEvent.type(screen.getByLabelText(/username/i), 'user');
    await userEvent.type(screen.getByLabelText(/password/i), 'Password1!');
    await userEvent.click(screen.getByRole('button', { name: /accedi/i }));

    await waitFor(() => expect(onLogin).not.toHaveBeenCalled());
  });
});


describe('Register', () => {
  it('mostra il titolo "Crea account"', () => {
    renderInRouter(<Register onRegister={vi.fn()} />);
    expect(screen.getByText(/crea account/i)).toBeInTheDocument();
  });

  it('mostra i 4 campi richiesti (RF-OB_01, RF-OB_07, RF-OB_17, RF-OB_14)', () => {
    renderInRouter(<Register onRegister={vi.fn()} />);
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    const pwdFields = screen.getAllByLabelText(/password/i);
    expect(pwdFields.length).toBeGreaterThanOrEqual(2);
  });

  it('mostra errore se username troppo corto (RF-OB_05)', async () => {
    renderInRouter(<Register onRegister={vi.fn()} />);
    await userEvent.type(screen.getByLabelText(/username/i), 'ab');
    await userEvent.tab();
    await waitFor(() => {
      expect(screen.getByText(/tra 4 e 24/i)).toBeInTheDocument();
    });
  });

  it('mostra errore se email non valida (RF-OB_20)', async () => {
    renderInRouter(<Register onRegister={vi.fn()} />);
    await userEvent.type(screen.getByLabelText(/email/i), 'nonvalida');
    await userEvent.tab();
    await waitFor(() => {
      expect(screen.getByText(/email non valida/i)).toBeInTheDocument();
    });
  });

  it('mostra errore se le password non coincidono (RF-OB_16)', async () => {
    renderInRouter(<Register onRegister={vi.fn()} />);
    const [pwdField, confirmField] = screen.getAllByLabelText(/password/i);
    await userEvent.type(pwdField, 'Password1!');
    await userEvent.type(confirmField, 'Diversa123!');
    await userEvent.click(screen.getByRole('button', { name: /registrati/i }));
    await waitFor(() => {
      expect(screen.getByText(/non coincidono/i)).toBeInTheDocument();
    });
  });

  it('chiama onRegister con il token dopo registrazione corretta (RF-OB_22)', async () => {
    const onRegister = vi.fn();
    const { register: registerApi } = await import('../../src/auth/AuthAPI');
    vi.mocked(registerApi).mockResolvedValue({ ok: true, errors: [], token: 'new-tok' });

    renderInRouter(<Register onRegister={onRegister} />);
    await userEvent.type(screen.getByLabelText(/username/i), 'mario123');
    await userEvent.type(screen.getByLabelText(/email/i), 'mario@example.com');
    const [pwdField, confirmField] = screen.getAllByLabelText(/password/i);
    await userEvent.type(pwdField, 'Password1!');
    await userEvent.type(confirmField, 'Password1!');
    await userEvent.click(screen.getByRole('button', { name: /registrati/i }));

    await waitFor(() => expect(onRegister).toHaveBeenCalledWith('new-tok'));
  });

  it('mostra errore se username già esistente (RF-OB_04)', async () => {
    const { register: registerApi } = await import('../../src/auth/AuthAPI');
    vi.mocked(registerApi).mockResolvedValue({ ok: false, errors: ['Username già esistente'] });

    renderInRouter(<Register onRegister={vi.fn()} />);
    await userEvent.type(screen.getByLabelText(/username/i), 'mario123');
    await userEvent.type(screen.getByLabelText(/email/i), 'mario@example.com');
    const [pwdField, confirmField] = screen.getAllByLabelText(/password/i);
    await userEvent.type(pwdField, 'Password1!');
    await userEvent.type(confirmField, 'Password1!');
    await userEvent.click(screen.getByRole('button', { name: /registrati/i }));

    await waitFor(() => {
      expect(screen.getByText(/username già esistente/i)).toBeInTheDocument();
    });
  });
});


describe('AuthPage', () => {
  beforeEach(() => mockNavigate.mockClear());

  it('mostra il brand "SmartOrder"', () => {
    renderInRouter(<AuthPage />);
    expect(screen.getByText(/smartorder/i)).toBeInTheDocument();
  });

  it('mostra i tab "Accedi" e "Registrati" (RF-OB_27)', () => {
    renderInRouter(<AuthPage />);
    expect(screen.getByRole('button', { name: /^accedi$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^registrati$/i })).toBeInTheDocument();
  });

  it('di default mostra il form di Login', () => {
    renderInRouter(<AuthPage />);
    expect(screen.getByText('Accedi')).toBeInTheDocument();
  });

  it('cliccando "Registrati" mostra il form di registrazione', async () => {
    renderInRouter(<AuthPage />);
    await userEvent.click(screen.getByRole('button', { name: /^registrati$/i }));
    expect(screen.getByText(/crea account/i)).toBeInTheDocument();
  });

  it('cliccando "Accedi" dopo "Registrati" torna al form di login', async () => {
    renderInRouter(<AuthPage />);
    await userEvent.click(screen.getByRole('button', { name: /^registrati$/i }));
    await userEvent.click(screen.getByRole('button', { name: /^accedi$/i }));
    expect(screen.getByText('Accedi')).toBeInTheDocument();
  });

  it('dopo login con successo naviga a /chat', async () => {
    const { login: loginApi } = await import('../../src/auth/AuthAPI');
    vi.mocked(loginApi).mockResolvedValue({ ok: true, errors: [], token: 'tok' });

    renderInRouter(<AuthPage />);
    await userEvent.type(screen.getByLabelText(/username/i), 'mario');
    await userEvent.type(screen.getByLabelText(/password/i), 'Password1!');
    await userEvent.click(screen.getByRole('button', { name: /accedi/i }));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/chat'));
  });

  it('dopo registrazione con successo naviga a /chat (RF-OB_22)', async () => {
    const { register: registerApi } = await import('../../src/auth/AuthAPI');
    vi.mocked(registerApi).mockResolvedValue({ ok: true, errors: [], token: 'tok' });

    renderInRouter(<AuthPage />);
    await userEvent.click(screen.getByRole('button', { name: /^registrati$/i }));
    await userEvent.type(screen.getByLabelText(/username/i), 'mario123');
    await userEvent.type(screen.getByLabelText(/email/i), 'mario@example.com');
    const [pwdField, confirmField] = screen.getAllByLabelText(/password/i);
    await userEvent.type(pwdField, 'Password1!');
    await userEvent.type(confirmField, 'Password1!');
    await userEvent.click(screen.getByRole('button', { name: /registrati/i }));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/chat'));
  });

  it('NON naviga se il login fallisce', async () => {
    const { login: loginApi } = await import('../../src/auth/AuthAPI');
    vi.mocked(loginApi).mockResolvedValue({ ok: false, errors: ['Errore'] });

    renderInRouter(<AuthPage />);
    await userEvent.type(screen.getByLabelText(/username/i), 'mario');
    await userEvent.type(screen.getByLabelText(/password/i), 'Password1!');
    await userEvent.click(screen.getByRole('button', { name: /accedi/i }));

    await waitFor(() => expect(mockNavigate).not.toHaveBeenCalled());
  });
});
