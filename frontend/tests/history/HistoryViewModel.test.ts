import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

import { useHistoryViewModel } from '../../src/history/HistoryViewModel';
import * as StoricoAPI from '../../src/history/HistoryModel';
import { useAuthStore } from '../../src/auth/authStore';

// ─── Mock StoricoAPI ──────────────────────────────────────────────────────────

vi.mock('../../src/history/HistoryModel', () => ({
  getHistoryCustomer: vi.fn(),
  getHistoryAdmin:   vi.fn(),
  duplicateOrder:     vi.fn(),
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
  vi.mocked(StoricoAPI.getHistoryCustomer).mockResolvedValue(mockPageCliente);
  vi.mocked(StoricoAPI.getHistoryAdmin).mockResolvedValue(mockPageAdmin);
  vi.mocked(StoricoAPI.duplicateOrder).mockResolvedValue(undefined);
});

afterEach(() => vi.clearAllMocks());

// ─── Stato iniziale ───────────────────────────────────────────────────────────

describe('useStoricoViewModel – stato iniziale', () => {
  //TU-F_481
  it('ha pagina=1, ordini=[], totalePagine=1, ordineScelto=null, loading=false, errore=null, erroreDuplica=null', () => {
    const { result } = renderHook(() => useHistoryViewModel());
    expect(result.current.pagina).toBe(1);
    expect(result.current.ordini).toEqual([]);
    expect(result.current.totalePagine).toBe(1);
    expect(result.current.ordineScelto).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.errore).toBeNull();
    expect(result.current.erroreDuplica).toBeNull();
  });

  //TU-F_482
  it('isAdmin=false quando il ruolo non è "admin"', () => {
    setupClienteRole();
    const { result } = renderHook(() => useHistoryViewModel());
    expect(result.current.isAdmin).toBe(false);
  });

  //TU-F_483
  it('isAdmin=true quando il ruolo è "admin"', () => {
    setupAdminRole();
    const { result } = renderHook(() => useHistoryViewModel());
    expect(result.current.isAdmin).toBe(true);
  });
});

// ─── loadPage – cliente ───────────────────────────────────────────────────

describe('useStoricoViewModel – loadPage (cliente)', () => {
  //TU-F_484
  it('chiama getHistoryCustomer con pagina e perPagina=10', async () => {
    const { result } = renderHook(() => useHistoryViewModel());
    await act(async () => { await result.current.loadPage(1); });
    expect(StoricoAPI.getHistoryCustomer).toHaveBeenCalledWith(1, 10, expect.anything(), expect.anything());
    expect(StoricoAPI.getHistoryAdmin).not.toHaveBeenCalled();
  });

  //TU-F_485
  it('popola ordini, totalePagine e pagina dopo il caricamento', async () => {
    const { result } = renderHook(() => useHistoryViewModel());
    await act(async () => { await result.current.loadPage(1); });
    expect(result.current.ordini).toHaveLength(2);
    expect(result.current.totalePagine).toBe(3);
    expect(result.current.pagina).toBe(1);
  });

  //TU-F_486
  it('imposta loading=true durante il caricamento, poi false alla fine', async () => {
    let resolve!: (v: typeof mockPageCliente) => void;
    vi.mocked(StoricoAPI.getHistoryCustomer).mockReturnValue(
      new Promise<typeof mockPageCliente>(r => { resolve = r; })
    );
    const { result } = renderHook(() => useHistoryViewModel());

    act(() => { result.current.loadPage(1); });
    expect(result.current.loading).toBe(true);

    await act(async () => { resolve(mockPageCliente); });
    expect(result.current.loading).toBe(false);
  });

  //TU-F_487
  it('azzera l\'errore prima di ogni caricamento', async () => {
    vi.mocked(StoricoAPI.getHistoryCustomer).mockRejectedValueOnce(new Error('fail1'));
    const { result } = renderHook(() => useHistoryViewModel());
    await act(async () => { await result.current.loadPage(1); });
    expect(result.current.errore).not.toBeNull();

    vi.mocked(StoricoAPI.getHistoryCustomer).mockResolvedValueOnce(mockPageCliente);
    await act(async () => { await result.current.loadPage(1); });
    expect(result.current.errore).toBeNull();
  });

  //TU-F_488
  it('imposta errore se getHistoryCustomer lancia un Error', async () => {
    vi.mocked(StoricoAPI.getHistoryCustomer).mockRejectedValue(new Error('Connessione rifiutata'));
    const { result } = renderHook(() => useHistoryViewModel());
    await act(async () => { await result.current.loadPage(1); });
    expect(result.current.errore).toBe('Connessione rifiutata');
  });

  //TU-F_489
  it('imposta messaggio generico se l\'errore non è un Error', async () => {
    vi.mocked(StoricoAPI.getHistoryCustomer).mockRejectedValue('stringa-errore');
    const { result } = renderHook(() => useHistoryViewModel());
    await act(async () => { await result.current.loadPage(1); });
    expect(result.current.errore).toMatch(/errore nel caricamento/i);
  });

  //TU-F_490
  it('carica pagine diverse passando il numero corretto', async () => {
    const { result } = renderHook(() => useHistoryViewModel());
    await act(async () => { await result.current.loadPage(3); });
    expect(StoricoAPI.getHistoryCustomer).toHaveBeenCalledWith(3, 10, expect.anything(), expect.anything());
    expect(result.current.pagina).toBe(3);
  });
});

// ─── loadPage – admin ─────────────────────────────────────────────────────

describe('useStoricoViewModel – loadPage (admin)', () => {
  beforeEach(() => { setupAdminRole(); });

  //TU-F_491
  it('chiama getHistoryAdmin invece di getHistoryCustomer', async () => {
    const { result } = renderHook(() => useHistoryViewModel());
    await act(async () => { await result.current.loadPage(2); });
    expect(StoricoAPI.getHistoryAdmin).toHaveBeenCalledWith(2, 10, expect.anything(), expect.anything());
    expect(StoricoAPI.getHistoryCustomer).not.toHaveBeenCalled();
  });

  //TU-F_492
  it('popola ordini, totalePagine e pagina con i dati admin', async () => {
    const { result } = renderHook(() => useHistoryViewModel());
    await act(async () => { await result.current.loadPage(2); });
    expect(result.current.ordini).toHaveLength(2);
    expect(result.current.totalePagine).toBe(5);
    expect(result.current.pagina).toBe(2);
  });

  //TU-F_493
  it('imposta errore se getHistoryAdmin fallisce', async () => {
    vi.mocked(StoricoAPI.getHistoryAdmin).mockRejectedValue(new Error('Permesso negato'));
    const { result } = renderHook(() => useHistoryViewModel());
    await act(async () => { await result.current.loadPage(1); });
    expect(result.current.errore).toBe('Permesso negato');
  });
});

// ─── openDetail / closeDetail ─────────────────────────────────────────

describe('useStoricoViewModel – openDetail / closeDetail', () => {
  //TU-F_494
  it('openDetail imposta ordineScelto', () => {
    const { result } = renderHook(() => useHistoryViewModel());
    const ordine = mockOrdini[0];
    act(() => { result.current.openDetail(ordine); });
    expect(result.current.ordineScelto).toEqual(ordine);
  });

  //TU-F_495
  it('closeDetail azzera ordineScelto', () => {
    const { result } = renderHook(() => useHistoryViewModel());
    act(() => { result.current.openDetail(mockOrdini[0]); });
    act(() => { result.current.closeDetail(); });
    expect(result.current.ordineScelto).toBeNull();
  });

  //TU-F_496
  it('openDetail sostituisce un ordine precedentemente selezionato', () => {
    const { result } = renderHook(() => useHistoryViewModel());
    act(() => { result.current.openDetail(mockOrdini[0]); });
    act(() => { result.current.openDetail(mockOrdini[1]); });
    expect(result.current.ordineScelto?.codice_ordine).toBe('ORD-002');
  });
});

// ─── duplicateOrder ────────────────────────────────────────────────────────────

describe('useStoricoViewModel – duplicateOrder', () => {
  //TU-F_497
  it('chiama apiduplicateOrder con il codice corretto', async () => {
    const { result } = renderHook(() => useHistoryViewModel());
    await act(async () => { await result.current.duplicateOrder('ORD-001'); });
    expect(StoricoAPI.duplicateOrder).toHaveBeenCalledWith('ORD-001');
  });

  //TU-F_498
  it('azzera erroreDuplica prima della chiamata', async () => {
    vi.mocked(StoricoAPI.duplicateOrder).mockRejectedValueOnce(new Error('fail1'));
    const { result } = renderHook(() => useHistoryViewModel());
    await act(async () => { await result.current.duplicateOrder('ORD-001'); });
    expect(result.current.erroreDuplica).not.toBeNull();

    vi.mocked(StoricoAPI.duplicateOrder).mockResolvedValueOnce(undefined);
    await act(async () => { await result.current.duplicateOrder('ORD-001'); });
    expect(result.current.erroreDuplica).toBeNull();
  });

  //TU-F_499
  it('non imposta erroreDuplica se duplicateOrder ha successo', async () => {
    const { result } = renderHook(() => useHistoryViewModel());
    await act(async () => { await result.current.duplicateOrder('ORD-001'); });
    expect(result.current.erroreDuplica).toBeNull();
  });

  //TU-F_500
  it('imposta erroreDuplica se duplicateOrder lancia un Error', async () => {
    vi.mocked(StoricoAPI.duplicateOrder).mockRejectedValue(new Error('Ordine non trovato'));
    const { result } = renderHook(() => useHistoryViewModel());
    await act(async () => { await result.current.duplicateOrder('ORD-999'); });
    expect(result.current.erroreDuplica).toBe('Ordine non trovato');
  });

  //TU-F_501
  it('imposta messaggio generico se l\'errore non è un Error', async () => {
    vi.mocked(StoricoAPI.duplicateOrder).mockRejectedValue('unknown');
    const { result } = renderHook(() => useHistoryViewModel());
    await act(async () => { await result.current.duplicateOrder('ORD-001'); });
    expect(result.current.erroreDuplica).toMatch(/errore nella duplicazione/i);
  });
});

// ─── loadPage – loading=false nel finally ─────────────────────────────────

describe('useStoricoViewModel – loading sempre false dopo la chiamata', () => {
  //TU-F_502
  it('loading=false anche in caso di errore (branch finally)', async () => {
    vi.mocked(StoricoAPI.getHistoryCustomer).mockRejectedValue(new Error('fail'));
    const { result } = renderHook(() => useHistoryViewModel());
    await act(async () => { await result.current.loadPage(1); });
    expect(result.current.loading).toBe(false);
  });
});
