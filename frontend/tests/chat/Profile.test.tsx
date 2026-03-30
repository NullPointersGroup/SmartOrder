import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

import { Profile } from '../../src/chat/Profile';

function mockFetchText(status: number, body: unknown) {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    text: () => Promise.resolve(JSON.stringify(body)),
    json: () => Promise.resolve(body),
  } as Response);
}

const userInfo = { username: 'mario', email: 'mario@example.com', description: '' };

const defaultProps = {
  onClose: vi.fn(),
  username: 'mario',
  onLogout: vi.fn(),
};

function renderProfile(overrides: Partial<typeof defaultProps> = {}) {
  return render(<Profile {...defaultProps} {...overrides} />);
}

beforeEach(() => {
  defaultProps.onClose = vi.fn();
  defaultProps.onLogout = vi.fn();
  vi.clearAllMocks();
});

afterEach(() => vi.restoreAllMocks());

describe('Profile – render base', () => {
  it('mostra il titolo "Profilo"', async () => {
    mockFetchText(200, userInfo);
    await act(async () => {
      renderProfile();
    });
    await waitFor(() => {
      expect(screen.getByText('Profilo')).toBeInTheDocument();
    });
  });

  it('mostra lo stato di caricamento iniziale', () => {
    mockFetchText(200, userInfo);
    renderProfile();
    expect(screen.getByText(/caricamento/i)).toBeInTheDocument();
  });

  it('ha il bottone di chiusura ✕', async () => {
    mockFetchText(200, userInfo);
    await act(async () => {
      renderProfile();
    });
    await waitFor(() => {
      expect(screen.getByText('✕')).toBeInTheDocument();
    });
  });
});

// Caricamento dati
describe('Profile – dati utente', () => {
  it('mostra username ed email dopo il caricamento', async () => {
    mockFetchText(200, userInfo);
    await act(async () => {
      renderProfile();
    });
    await waitFor(() => {
      expect(screen.getByText('mario')).toBeInTheDocument();
      expect(screen.getByText('mario@example.com')).toBeInTheDocument();
    });
  });

  it('mostra il pulsante "Reimposta password"', async () => {
    mockFetchText(200, userInfo);
    await act(async () => {
      renderProfile();
    });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /reimposta password/i })).toBeInTheDocument();
    });
  });

  it('mostra il pulsante "Cancella account"', async () => {
    mockFetchText(200, userInfo);
    await act(async () => {
      renderProfile();
    });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /cancella account/i })).toBeInTheDocument();
    });
  });

  it('mostra errore se il fetch fallisce', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'));
    await act(async () => {
      renderProfile();
    });
    await waitFor(() => {
      expect(screen.getByText(/errore nel caricamento del profilo/i)).toBeInTheDocument();
    });
  });

  it('non fa il fetch se username è null', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    renderProfile({ username: undefined });
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe('Profile – chiusura', () => {
  it('chiama onClose al click su ✕', async () => {
    mockFetchText(200, userInfo);
    const onClose = vi.fn();
    await act(async () => {
      renderProfile({ onClose });
    });
    await waitFor(() => expect(screen.getByText('✕')).toBeInTheDocument());
    fireEvent.click(screen.getByText('✕'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('chiama onClose al click sullo sfondo scuro', async () => {
    mockFetchText(200, userInfo);
    const onClose = vi.fn();
    await act(async () => {
      renderProfile({ onClose });
    });
    await waitFor(() => expect(screen.getByText('Profilo')).toBeInTheDocument());
    const overlayBtns = document.querySelectorAll('button.absolute');
    fireEvent.click(overlayBtns[0]);
    expect(onClose).toHaveBeenCalled();
  });
});

describe('Profile – reset password dialog', () => {
  it('apre il dialog di reset password al click sul bottone', async () => {
    mockFetchText(200, userInfo);
    await act(async () => {
      renderProfile();
    });
    await waitFor(() => expect(screen.getByRole('button', { name: /reimposta password/i })).toBeInTheDocument());
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /reimposta password/i }));
    });
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /reimposta password/i })).toBeInTheDocument();
    });
  });

  it('chiude il dialog reset cliccando lo sfondo del dialog', async () => {
    mockFetchText(200, userInfo);
    await act(async () => {
      renderProfile();
    });
    await waitFor(() => expect(screen.getByRole('button', { name: /reimposta password/i })).toBeInTheDocument());
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /reimposta password/i }));
    });
    await waitFor(() => expect(screen.getByRole('heading', { name: /reimposta password/i })).toBeInTheDocument());
    await act(async () => {
      fireEvent.click(screen.getByTestId('reset-overlay'));
    });
    await waitFor(() => {
      expect(screen.queryByLabelText(/password attuale/i)).not.toBeInTheDocument();
    });
  });

  it('mostra il dialog di successo dopo reset ok', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch');
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify(userInfo)),
      json: () => Promise.resolve(userInfo),
    } as Response);
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
    } as Response);

    await act(async () => {
      renderProfile();
    });
    
    await waitFor(() => expect(screen.getByRole('button', { name: /reimposta password/i })).toBeInTheDocument());
    
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /reimposta password/i }));
    });
    
    await waitFor(() => expect(screen.getByLabelText(/password attuale/i)).toBeInTheDocument());

    await act(async () => {
      fireEvent.change(screen.getByLabelText(/password attuale/i), { target: { value: 'OldPass1!' } });
      fireEvent.change(screen.getByLabelText(/nuova password/i), { target: { value: 'NewPass2@' } });
      fireEvent.change(screen.getByLabelText(/conferma password/i), { target: { value: 'NewPass2@' } });
    });
    
    const btn = screen.getAllByRole('button', { name: /reimposta password/i }).at(-1);
    if (!btn) throw new Error('Button non trovato');
    
    await act(async () => {
      fireEvent.click(btn);
    });

    await waitFor(() => {
      expect(screen.getByText(/password reimpostata/i)).toBeInTheDocument();
    });
  });

  it('mostra l\'errore del server se il reset fallisce (res.ok=false)', async () => {
    const errorBody = { detail: { errors: ['Password attuale errata'] } };
    const fetchMock = vi.spyOn(globalThis, 'fetch');
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify(userInfo)),
      json: () => Promise.resolve(userInfo),
    } as Response);
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve(errorBody),
    } as Response);

    await act(async () => {
      renderProfile();
    });
    
    await waitFor(() => expect(screen.getByRole('button', { name: /reimposta password/i })).toBeInTheDocument());
    
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /reimposta password/i }));
    });
    
    await waitFor(() => expect(screen.getByLabelText(/password attuale/i)).toBeInTheDocument());

    await act(async () => {
      fireEvent.change(screen.getByLabelText(/password attuale/i), { target: { value: 'OldPass1!' } });
      fireEvent.change(screen.getByLabelText(/nuova password/i), { target: { value: 'NewPass2@' } });
      fireEvent.change(screen.getByLabelText(/conferma password/i), { target: { value: 'NewPass2@' } });
    });
    
    const btn = screen.getAllByRole('button', { name: /reimposta password/i }).at(-1);
    if (!btn) throw new Error('Button non trovato');
    
    await act(async () => {
      fireEvent.click(btn);
    });

    await waitFor(() => {
      expect(screen.getByText('Password attuale errata')).toBeInTheDocument();
    });
    expect(screen.queryByText(/password reimpostata/i)).not.toBeInTheDocument();
  });

  it('chiude il dialog di successo cliccando lo sfondo', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch');
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify(userInfo)),
      json: () => Promise.resolve(userInfo),
    } as Response);
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
    } as Response);

    await act(async () => {
      renderProfile();
    });

    await waitFor(() => expect(screen.getByRole('button', { name: /reimposta password/i })).toBeInTheDocument());
    
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /reimposta password/i }));
    });

    await waitFor(() => expect(screen.getByLabelText(/password attuale/i)).toBeInTheDocument());

    await act(async () => {
      fireEvent.change(screen.getByLabelText(/password attuale/i), { target: { value: 'OldPass1!' } });
      fireEvent.change(screen.getByLabelText(/nuova password/i), { target: { value: 'NewPass2@' } });
      fireEvent.change(screen.getByLabelText(/conferma password/i), { target: { value: 'NewPass2@' } });
    });

    const submitBtn = screen.getAllByRole('button', { name: /reimposta password/i }).at(-1);
    if (!submitBtn) throw new Error('Button non trovato');
    
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    // Wait for success dialog to appear
    const successText = await waitFor(() => screen.getByText(/password reimpostata/i));
    expect(successText).toBeInTheDocument();

    // Find the backdrop inside the success dialog
    const successDialogDiv = successText.closest('div.absolute.inset-0');
    expect(successDialogDiv).not.toBeNull();
    
    const backdrop = successDialogDiv?.querySelector('button.absolute.inset-0');
    expect(backdrop).not.toBeNull();
    
    await act(async () => {
      if (backdrop) {
        fireEvent.click(backdrop);
      }
    });

    await waitFor(() =>
      expect(screen.queryByText(/password reimpostata/i)).not.toBeInTheDocument()
    );
  });

  it('chiude il dialog di successo cliccando OK', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch');
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify(userInfo)),
      json: () => Promise.resolve(userInfo),
    } as Response);
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
    } as Response);

    await act(async () => {
      renderProfile();
    });
    
    await waitFor(() => expect(screen.getByRole('button', { name: /reimposta password/i })).toBeInTheDocument());
    
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /reimposta password/i }));
    });
    
    await waitFor(() => expect(screen.getByLabelText(/password attuale/i)).toBeInTheDocument());

    await act(async () => {
      fireEvent.change(screen.getByLabelText(/password attuale/i), { target: { value: 'OldPass1!' } });
      fireEvent.change(screen.getByLabelText(/nuova password/i), { target: { value: 'NewPass2@' } });
      fireEvent.change(screen.getByLabelText(/conferma password/i), { target: { value: 'NewPass2@' } });
    });
    
    const submitBtn = screen.getAllByRole('button', { name: /reimposta password/i }).at(-1);
    if (!submitBtn) throw new Error('Button non trovato');
    
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    await waitFor(() => expect(screen.getByRole('button', { name: /^ok$/i })).toBeInTheDocument());
    
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /^ok$/i }));
    });

    await waitFor(() =>
      expect(screen.queryByText(/password reimpostata/i)).not.toBeInTheDocument()
    );
  });
});

// Cancella account
describe('Profile – cancella account', () => {
  it('apre il dialog di conferma cancellazione', async () => {
    mockFetchText(200, userInfo);
    await act(async () => {
      renderProfile();
    });
    await waitFor(() => expect(screen.getByRole('button', { name: /cancella account/i })).toBeInTheDocument());
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /cancella account/i }));
    });
    await waitFor(() => {
      expect(screen.getByText(/sei sicuro\? questa azione è irreversibile/i)).toBeInTheDocument();
    });
  });

  it('chiude il dialog al click su "Annulla"', async () => {
    mockFetchText(200, userInfo);
    await act(async () => {
      renderProfile();
    });
    await waitFor(() => expect(screen.getByRole('button', { name: /cancella account/i })).toBeInTheDocument());
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /cancella account/i }));
    });
    await waitFor(() => expect(screen.getByText('Annulla')).toBeInTheDocument());
    await act(async () => {
      fireEvent.click(screen.getByText('Annulla'));
    });
    await waitFor(() => expect(screen.queryByText(/sei sicuro/i)).not.toBeInTheDocument());
  });

  it('chiude il dialog di cancellazione cliccando lo sfondo (backdrop riga 139)', async () => {
    mockFetchText(200, userInfo);
    await act(async () => {
      renderProfile();
    });
    await waitFor(() => expect(screen.getByRole('button', { name: /cancella account/i })).toBeInTheDocument());
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /cancella account/i }));
    });
    await waitFor(() => expect(screen.getByText(/sei sicuro/i)).toBeInTheDocument());

    // Find the delete dialog container and its backdrop button
    const confirmText = screen.getByText(/sei sicuro/i);
    const deleteDialogDiv = confirmText.closest('div.absolute.inset-0');
    expect(deleteDialogDiv).not.toBeNull();
    
    const backdrop = deleteDialogDiv?.querySelector('button.absolute.inset-0');
    expect(backdrop).not.toBeNull();
    
    await act(async () => {
      if (backdrop) {
        fireEvent.click(backdrop);
      }
    });

    await waitFor(() =>
      expect(screen.queryByText(/sei sicuro/i)).not.toBeInTheDocument()
    );
  });

  it('chiama onLogout dopo la conferma di cancellazione', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch');
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify(userInfo)),
      json: () => Promise.resolve(userInfo),
    } as Response);
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
    } as Response);

    const onLogout = vi.fn();
    await act(async () => {
      renderProfile({ onLogout });
    });
    
    await waitFor(() => expect(screen.getByRole('button', { name: /cancella account/i })).toBeInTheDocument());
    
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /cancella account/i }));
    });
    
    await waitFor(() => expect(screen.getByText('Conferma')).toBeInTheDocument());
    
    await act(async () => {
      fireEvent.click(screen.getByText('Conferma'));
    });
    
    await waitFor(() => expect(onLogout).toHaveBeenCalledTimes(1));
  });
});