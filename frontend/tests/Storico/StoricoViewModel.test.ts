import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

import { useStoricoViewModel } from '../../src/Storico/StoricoViewModel';
import * as StoricoAPI from '../../src/Storico/StoricoAPI';
import { useAuthStore } from '../../src/auth/authStore';

// ─── Mock StoricoAPI ──────────────────────────────────────────────────────────

vi.mock('../../src/Storico/StoricoAPI', () => ({
  getStoricoCliente: vi.fn(),
  getStoricoAdmin:   vi.fn(),
  duplicaOrdine:     vi.fn(),
}));

// ─── Mock authStore ───────────────────────────────────────────────────────────

vi.mock('../../src/auth/authStore', () => ({
  useAuthStore: vi.fn(),
}));

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockOrdini = [
  {
    codice_ordine: 'ORD-001',
    numero_ordine: 1,
    data: '2024-03-15T10:30:00',
    prodotti: [
      { nome: 'Latte', descrizione: 'Intero', quantita: 2 },
      { nome: 'Pane',  descrizione: 'Bianco', quantita: 1 },
    ],
  },
  {
    codice_ordine: 'ORD-002',
    numero_ordine: 2,
    data: '2024-03-16T09:00:00',
    username: 'mario',
    prodotti: [{ nome: 'Burro', descrizione: '', quantita: 3 }],
  },
];

const mockPageCliente = {
  ordini:          mockOrdini,
  pagina_corrente: 1,
  totale_pagine:   3,
};

const mockPageAdmin = {
  ordini:          mockOrdini,
  pagina_corrente: 2,
  totale_pagine:   5,
};

function setupClienteRole() {
  vi.mocked(useAuthStore).mockReturnValue(null); // role != 'admin'
}

function setupAdminRole() {
  vi.mocked(useAuthStore).mockReturnValue('admin');
}

beforeEach(() => {
  setupClienteRole();
  vi.mocked(StoricoAPI.getStoricoCliente).mockResolvedValue(mockPageCliente);
  vi.mocked(StoricoAPI.getStoricoAdmin).mockResolvedValue(mockPageAdmin);
  vi.mocked(StoricoAPI.duplicaOrdine).mockResolvedValue(undefined);
});

afterEach(() => vi.clearAllMocks());

// ─── Stato iniziale ───────────────────────────────────────────────────────────

describe('useStoricoViewModel – stato iniziale', () => {
  it('ha pagina=1, ordini=[], totalePagine=1, ordineScelto=null, loading=false, errore=null, erroreDuplica=null', () => {
    const { result } = renderHook(() => useStoricoViewModel());
    expect(result.current.pagina).toBe(1);
    expect(result.current.ordini).toEqual([]);
    expect(result.current.totalePagine).toBe(1);
    expect(result.current.ordineScelto).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.errore).toBeNull();
    expect(result.current.erroreDuplica).toBeNull();
  });

  it('isAdmin=false quando il ruolo non è "admin"', () => {
    setupClienteRole();
    const { result } = renderHook(() => useStoricoViewModel());
    expect(result.current.isAdmin).toBe(false);
  });

  it('isAdmin=true quando il ruolo è "admin"', () => {
    setupAdminRole();
    const { result } = renderHook(() => useStoricoViewModel());
    expect(result.current.isAdmin).toBe(true);
  });
});

// ─── caricaPagina – cliente ───────────────────────────────────────────────────

describe('useStoricoViewModel – caricaPagina (cliente)', () => {
  it('chiama getStoricoCliente con pagina e perPagina=10', async () => {
    const { result } = renderHook(() => useStoricoViewModel());
    await act(async () => { await result.current.caricaPagina(1); });
    expect(StoricoAPI.getStoricoCliente).toHaveBeenCalledWith(1, 10, expect.anything(), expect.anything());
    expect(StoricoAPI.getStoricoAdmin).not.toHaveBeenCalled();
  });

  it('popola ordini, totalePagine e pagina dopo il caricamento', async () => {
    const { result } = renderHook(() => useStoricoViewModel());
    await act(async () => { await result.current.caricaPagina(1); });
    expect(result.current.ordini).toHaveLength(2);
    expect(result.current.totalePagine).toBe(3);
    expect(result.current.pagina).toBe(1);
  });

  it('imposta loading=true durante il caricamento, poi false alla fine', async () => {
    let resolve!: (v: typeof mockPageCliente) => void;
    vi.mocked(StoricoAPI.getStoricoCliente).mockReturnValue(
      new Promise<typeof mockPageCliente>(r => { resolve = r; })
    );
    const { result } = renderHook(() => useStoricoViewModel());

    act(() => { result.current.caricaPagina(1); });
    expect(result.current.loading).toBe(true);

    await act(async () => { resolve(mockPageCliente); });
    expect(result.current.loading).toBe(false);
  });

  it('azzera l\'errore prima di ogni caricamento', async () => {
    vi.mocked(StoricoAPI.getStoricoCliente).mockRejectedValueOnce(new Error('fail1'));
    const { result } = renderHook(() => useStoricoViewModel());
    await act(async () => { await result.current.caricaPagina(1); });
    expect(result.current.errore).not.toBeNull();

    vi.mocked(StoricoAPI.getStoricoCliente).mockResolvedValueOnce(mockPageCliente);
    await act(async () => { await result.current.caricaPagina(1); });
    expect(result.current.errore).toBeNull();
  });

  it('imposta errore se getStoricoCliente lancia un Error', async () => {
    vi.mocked(StoricoAPI.getStoricoCliente).mockRejectedValue(new Error('Connessione rifiutata'));
    const { result } = renderHook(() => useStoricoViewModel());
    await act(async () => { await result.current.caricaPagina(1); });
    expect(result.current.errore).toBe('Connessione rifiutata');
  });

  it('imposta messaggio generico se l\'errore non è un Error', async () => {
    vi.mocked(StoricoAPI.getStoricoCliente).mockRejectedValue('stringa-errore');
    const { result } = renderHook(() => useStoricoViewModel());
    await act(async () => { await result.current.caricaPagina(1); });
    expect(result.current.errore).toMatch(/errore nel caricamento/i);
  });

  it('carica pagine diverse passando il numero corretto', async () => {
    const { result } = renderHook(() => useStoricoViewModel());
    await act(async () => { await result.current.caricaPagina(3); });
    expect(StoricoAPI.getStoricoCliente).toHaveBeenCalledWith(3, 10, expect.anything(), expect.anything());
    expect(result.current.pagina).toBe(3);
  });
});

// ─── caricaPagina – admin ─────────────────────────────────────────────────────

describe('useStoricoViewModel – caricaPagina (admin)', () => {
  beforeEach(() => { setupAdminRole(); });

  it('chiama getStoricoAdmin invece di getStoricoCliente', async () => {
    const { result } = renderHook(() => useStoricoViewModel());
    await act(async () => { await result.current.caricaPagina(2); });
    expect(StoricoAPI.getStoricoAdmin).toHaveBeenCalledWith(2, 10, expect.anything(), expect.anything());
    expect(StoricoAPI.getStoricoCliente).not.toHaveBeenCalled();
  });

  it('popola ordini, totalePagine e pagina con i dati admin', async () => {
    const { result } = renderHook(() => useStoricoViewModel());
    await act(async () => { await result.current.caricaPagina(2); });
    expect(result.current.ordini).toHaveLength(2);
    expect(result.current.totalePagine).toBe(5);
    expect(result.current.pagina).toBe(2);
  });

  it('imposta errore se getStoricoAdmin fallisce', async () => {
    vi.mocked(StoricoAPI.getStoricoAdmin).mockRejectedValue(new Error('Permesso negato'));
    const { result } = renderHook(() => useStoricoViewModel());
    await act(async () => { await result.current.caricaPagina(1); });
    expect(result.current.errore).toBe('Permesso negato');
  });
});

// ─── apriDettaglio / chiudiDettaglio ─────────────────────────────────────────

describe('useStoricoViewModel – apriDettaglio / chiudiDettaglio', () => {
  it('apriDettaglio imposta ordineScelto', () => {
    const { result } = renderHook(() => useStoricoViewModel());
    const ordine = mockOrdini[0];
    act(() => { result.current.apriDettaglio(ordine); });
    expect(result.current.ordineScelto).toEqual(ordine);
  });

  it('chiudiDettaglio azzera ordineScelto', () => {
    const { result } = renderHook(() => useStoricoViewModel());
    act(() => { result.current.apriDettaglio(mockOrdini[0]); });
    act(() => { result.current.chiudiDettaglio(); });
    expect(result.current.ordineScelto).toBeNull();
  });

  it('apriDettaglio sostituisce un ordine precedentemente selezionato', () => {
    const { result } = renderHook(() => useStoricoViewModel());
    act(() => { result.current.apriDettaglio(mockOrdini[0]); });
    act(() => { result.current.apriDettaglio(mockOrdini[1]); });
    expect(result.current.ordineScelto?.codice_ordine).toBe('ORD-002');
  });
});

// ─── duplicaOrdine ────────────────────────────────────────────────────────────

describe('useStoricoViewModel – duplicaOrdine', () => {
  it('chiama apiDuplicaOrdine con il codice corretto', async () => {
    const { result } = renderHook(() => useStoricoViewModel());
    await act(async () => { await result.current.duplicaOrdine('ORD-001'); });
    expect(StoricoAPI.duplicaOrdine).toHaveBeenCalledWith('ORD-001');
  });

  it('azzera erroreDuplica prima della chiamata', async () => {
    vi.mocked(StoricoAPI.duplicaOrdine).mockRejectedValueOnce(new Error('fail1'));
    const { result } = renderHook(() => useStoricoViewModel());
    await act(async () => { await result.current.duplicaOrdine('ORD-001'); });
    expect(result.current.erroreDuplica).not.toBeNull();

    vi.mocked(StoricoAPI.duplicaOrdine).mockResolvedValueOnce(undefined);
    await act(async () => { await result.current.duplicaOrdine('ORD-001'); });
    expect(result.current.erroreDuplica).toBeNull();
  });

  it('non imposta erroreDuplica se duplicaOrdine ha successo', async () => {
    const { result } = renderHook(() => useStoricoViewModel());
    await act(async () => { await result.current.duplicaOrdine('ORD-001'); });
    expect(result.current.erroreDuplica).toBeNull();
  });

  it('imposta erroreDuplica se duplicaOrdine lancia un Error', async () => {
    vi.mocked(StoricoAPI.duplicaOrdine).mockRejectedValue(new Error('Ordine non trovato'));
    const { result } = renderHook(() => useStoricoViewModel());
    await act(async () => { await result.current.duplicaOrdine('ORD-999'); });
    expect(result.current.erroreDuplica).toBe('Ordine non trovato');
  });

  it('imposta messaggio generico se l\'errore non è un Error', async () => {
    vi.mocked(StoricoAPI.duplicaOrdine).mockRejectedValue('unknown');
    const { result } = renderHook(() => useStoricoViewModel());
    await act(async () => { await result.current.duplicaOrdine('ORD-001'); });
    expect(result.current.erroreDuplica).toMatch(/errore nella duplicazione/i);
  });
});

// ─── caricaPagina – loading=false nel finally ─────────────────────────────────

describe('useStoricoViewModel – loading sempre false dopo la chiamata', () => {
  it('loading=false anche in caso di errore (branch finally)', async () => {
    vi.mocked(StoricoAPI.getStoricoCliente).mockRejectedValue(new Error('fail'));
    const { result } = renderHook(() => useStoricoViewModel());
    await act(async () => { await result.current.caricaPagina(1); });
    expect(result.current.loading).toBe(false);
  });
});