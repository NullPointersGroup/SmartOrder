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
  //TU-F_324
  it('mostra il titolo "Profilo"', async () => {
    mockFetchText(200, userInfo);
    await act(async () => {
      renderProfile();
    });
    await waitFor(() => {
      expect(screen.getByText('Profilo')).toBeInTheDocument();
    });
  });

  //TU-F_325
  it('mostra lo stato di caricamento iniziale', () => {
    mockFetchText(200, userInfo);
    renderProfile();
    expect(screen.getByText(/caricamento/i)).toBeInTheDocument();
  });

  //TU-F_326
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
  //TU-F_327
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

  //TU-F_328
  it('mostra il pulsante "Reimposta password"', async () => {
    mockFetchText(200, userInfo);
    await act(async () => {
      renderProfile();
    });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /reimposta password/i })).toBeInTheDocument();
    });
  });

  //TU-F_329
  it('mostra il pulsante "Cancella account"', async () => {
    mockFetchText(200, userInfo);
    await act(async () => {
      renderProfile();
    });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /cancella account/i })).toBeInTheDocument();
    });
  });

  //TU-F_330
  it('mostra errore se il fetch fallisce', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'));
    await act(async () => {
      renderProfile();
    });
    await waitFor(() => {
      expect(screen.getByText(/errore nel caricamento del profilo/i)).toBeInTheDocument();
    });
  });

  //TU-F_331
  it('non fa il fetch se username è null', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    renderProfile({ username: undefined });
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe('Profile – chiusura', () => {
  //TU-F_332
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

  //TU-F_333
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
  //TU-F_334
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

  //TU-F_335
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

  //TU-F_336
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

  //TU-F_337
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

  //TU-F_338
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

    const successText = await waitFor(() => screen.getByText(/password reimpostata/i));
    expect(successText).toBeInTheDocument();

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

  //TU-F_339
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
  //TU-F_340
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

  //TU-F_341
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

  //TU-F_342
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

  //TU-F_343
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