import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import PasswordResetForm from '../../src/chat/PasswordResetForm';

function renderForm(handleReset = vi.fn().mockResolvedValue(null)) {
  return render(<PasswordResetForm handleReset={handleReset} />);
}

function fillForm(old: string, newPwd: string, confirm: string) {
  fireEvent.change(screen.getByLabelText(/password attuale/i),  { target: { value: old } });
  fireEvent.change(screen.getByLabelText(/^nuova password$/i),  { target: { value: newPwd } });
  fireEvent.change(screen.getByLabelText(/conferma password/i), { target: { value: confirm } });
}

function submit() {
  fireEvent.click(screen.getByRole('button', { name: /reimposta password/i }));
}

function getEyeButtons() {
  return document.querySelectorAll('button[tabindex="-1"]');
}

const VALID_OLD = 'OldPass1!';
const VALID_NEW = 'NewPass2@';

// Render base
describe('PasswordResetForm – render base', () => {
  it('mostra il titolo "Reimposta password"', () => {
    renderForm();
    expect(screen.getByRole('heading', { name: /reimposta password/i })).toBeInTheDocument();
  });

  it('mostra i tre campi password', () => {
    renderForm();
    expect(screen.getByLabelText(/password attuale/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/nuova password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/conferma password/i)).toBeInTheDocument();
  });

  it('i campi sono di tipo password di default', () => {
    renderForm();
    const inputs = screen.getAllByDisplayValue('');
    inputs.forEach(i => expect(i).toHaveAttribute('type', 'password'));
  });

  it('mostra il bottone di submit', () => {
    renderForm();
    expect(screen.getByRole('button', { name: /reimposta password/i })).toBeInTheDocument();
  });
});

// Toggle visibilità
describe('PasswordResetForm – toggle visibilità', () => {
  it('mostra la password attuale al click sull\'occhio (campo 0)', () => {
    renderForm();
    fireEvent.click(getEyeButtons()[0]);
    expect(screen.getByLabelText(/password attuale/i)).toHaveAttribute('type', 'text');
  });

  it('nasconde di nuovo la password attuale al secondo click (campo 0)', () => {
    renderForm();
    fireEvent.click(getEyeButtons()[0]);
    fireEvent.click(getEyeButtons()[0]);
    expect(screen.getByLabelText(/password attuale/i)).toHaveAttribute('type', 'password');
  });

  it('mostra la nuova password al click sull\'occhio (campo 1)', () => {
    renderForm();
    fireEvent.click(getEyeButtons()[1]);
    expect(screen.getByLabelText(/^nuova password$/i)).toHaveAttribute('type', 'text');
  });

  it('nasconde di nuovo la nuova password al secondo click (campo 1)', () => {
    renderForm();
    fireEvent.click(getEyeButtons()[1]);
    fireEvent.click(getEyeButtons()[1]);
    expect(screen.getByLabelText(/^nuova password$/i)).toHaveAttribute('type', 'password');
  });

  it('mostra la conferma password al click sull\'occhio (campo 2)', () => {
    renderForm();
    fireEvent.click(getEyeButtons()[2]);
    expect(screen.getByLabelText(/conferma password/i)).toHaveAttribute('type', 'text');
  });

  it('nasconde di nuovo la conferma password al secondo click (campo 2)', () => {
    renderForm();
    fireEvent.click(getEyeButtons()[2]);
    fireEvent.click(getEyeButtons()[2]);
    expect(screen.getByLabelText(/conferma password/i)).toHaveAttribute('type', 'password');
  });
});

describe('PasswordResetForm – validazione campo vuoto', () => {
  it('mostra errore se la password attuale è vuota al submit', async () => {
    renderForm();
    submit();
    await waitFor(() => {
      expect(screen.getByText(/inserisci la password attuale/i)).toBeInTheDocument();
    });
  });

  it('non chiama handleReset se i campi sono vuoti', async () => {
    const handleReset = vi.fn().mockResolvedValue(null);
    renderForm(handleReset);
    submit();
    await waitFor(() => expect(handleReset).not.toHaveBeenCalled());
  });
});

describe('PasswordResetForm – validazione nuova password', () => {
  it('mostra errore se la nuova password non rispetta i requisiti', async () => {
    renderForm();
    fillForm(VALID_OLD, 'corta', 'corta');
    submit();
    await waitFor(() => {
      expect(screen.getByText(/almeno 8 caratteri/i)).toBeInTheDocument();
    });
  });

  it('mostra errore se la nuova password è uguale a quella vecchia', async () => {
    renderForm();
    fillForm(VALID_OLD, VALID_OLD, VALID_OLD);
    submit();
    await waitFor(() => {
      expect(screen.getByText(/diversa da quella attuale/i)).toBeInTheDocument();
    });
  });

  it('mostra errore se le password non coincidono', async () => {
    renderForm();
    fillForm(VALID_OLD, VALID_NEW, 'DiversaPass3#');
    submit();
    await waitFor(() => {
      expect(screen.getByText(/le password non coincidono/i)).toBeInTheDocument();
    });
  });
});

describe('PasswordResetForm – indicatore conferma', () => {
  it('mostra "Le password coincidono" quando confirm === new', async () => {
    renderForm();
    fireEvent.change(screen.getByLabelText(/^nuova password$/i),  { target: { value: VALID_NEW } });
    fireEvent.change(screen.getByLabelText(/conferma password/i), { target: { value: VALID_NEW } });
    await waitFor(() => {
      expect(screen.getByText('Le password coincidono')).toBeInTheDocument();
    });
  });

  it('mostra "Le password non coincidono" quando confirm !== new', async () => {
    renderForm();
    fireEvent.change(screen.getByLabelText(/^nuova password$/i),  { target: { value: VALID_NEW } });
    fireEvent.change(screen.getByLabelText(/conferma password/i), { target: { value: 'sbagliata' } });
    await waitFor(() => {
      expect(screen.getByText('Le password non coincidono')).toBeInTheDocument();
    });
  });

  it('non mostra l\'indicatore se il campo conferma è vuoto', () => {
    renderForm();
    expect(screen.queryByText(/le password/i)).not.toBeInTheDocument();
  });
});

// Submit valido
describe('PasswordResetForm – submit valido', () => {
  it('chiama handleReset con old e new password corrette', async () => {
    const handleReset = vi.fn().mockResolvedValue(null);
    renderForm(handleReset);
    fillForm(VALID_OLD, VALID_NEW, VALID_NEW);
    submit();
    await waitFor(() => {
      expect(handleReset).toHaveBeenCalledWith(VALID_OLD, VALID_NEW);
    });
  });

  it('non mostra errori dopo un submit valido', async () => {
    const handleReset = vi.fn().mockResolvedValue(null);
    renderForm(handleReset);
    fillForm(VALID_OLD, VALID_NEW, VALID_NEW);
    submit();
    await waitFor(() => expect(handleReset).toHaveBeenCalled());
    expect(screen.queryByText(/inserisci la password attuale/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/almeno 8 caratteri/i)).not.toBeInTheDocument();
  });
});

// Errore server
describe('PasswordResetForm – errore server', () => {
  it('mostra il messaggio di errore restituito dal server', async () => {
    const handleReset = vi.fn().mockResolvedValue('Password attuale errata');
    renderForm(handleReset);
    fillForm(VALID_OLD, VALID_NEW, VALID_NEW);
    submit();
    await waitFor(() => {
      expect(screen.getByText('Password attuale errata')).toBeInTheDocument();
    });
  });

  it('cancella l\'errore server quando si modifica un campo', async () => {
    const handleReset = vi.fn().mockResolvedValue('Password attuale errata');
    renderForm(handleReset);
    fillForm(VALID_OLD, VALID_NEW, VALID_NEW);
    submit();
    await waitFor(() => expect(screen.getByText('Password attuale errata')).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText(/password attuale/i), { target: { value: 'x' } });
    await waitFor(() => expect(screen.queryByText('Password attuale errata')).not.toBeInTheDocument());
  });
});