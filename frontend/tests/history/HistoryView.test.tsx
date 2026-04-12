import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';

import { HistoryView } from '../../src/history/HistoryView';

// ─── Mock authStore ───────────────────────────────────────────────────────────

const mockClearAuth = vi.fn();
vi.mock('../../src/auth/authStore', () => ({
  useAuthStore: vi.fn((selector?: (s: AuthState) => unknown) => {
    const state = {
      username: 'mario',
      admin: null,
      clearAuth: mockClearAuth,
    };
    return selector ? selector(state) : state;  // ← gestisce con e senza selector
  }),
}));

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

// ─── Mock usePageTitle ────────────────────────────────────────────────────────

vi.mock('../../src/hooks/usePageTitle', () => ({
  usePageTitle: vi.fn(),
}));

// ─── Mock ViewModel ───────────────────────────────────────────────────────────

const mockloadPage   = vi.fn();
const mockopenDetail  = vi.fn();
const mockcloseDetail = vi.fn();
const mockduplicateOrder  = vi.fn();

type Ordine = {
  codice_ordine: string;
  numero_ordine: number;
  data: string;
  prodotti: unknown[];
};

type AuthState = {
  username: string;
  admin: boolean | null;
  clearAuth: () => void;
};

type StoricoVm = {
  ordini: Ordine[];
  pagina: number;
  totalePagine: number;
  ordineScelto: Ordine | null;
  loading: boolean;
  errore: string | null;
  erroreDuplica: string | null;
  isAdmin: boolean;
  loadPage: (pagina: number, startDate?: string, endDate?: string) => void;
  openDetail: (ordine: Ordine) => void;
  closeDetail: () => void;
  duplicateOrder: (codiceOrdine: string) => void;
};

const baseVm: StoricoVm = {
  ordini: [],
  pagina: 1,
  totalePagine: 1,
  ordineScelto: null,
  loading: false,
  errore: null,
  erroreDuplica: null,
  isAdmin: false,
  loadPage: mockloadPage,
  openDetail: mockopenDetail,
  closeDetail: mockcloseDetail,
  duplicateOrder: mockduplicateOrder,
};

let vmOverrides: Partial<StoricoVm> = {};

vi.mock('../../src/history/HistoryViewModel', () => ({
  useHistoryViewModel: (): StoricoVm => ({ ...baseVm, ...vmOverrides }),
}));

// ─── Mock componenti figli ────────────────────────────────────────────────────

vi.mock('../../src/chat/NavBar', () => ({
  NavBar: ({ onLogout, onProfile }: { onLogout: () => void; onProfile: () => void }) => (
    <nav data-testid="navbar">
      <button onClick={onProfile} title="Apri profilo">profilo</button>
      <button onClick={onLogout} title="Logout">logout</button>
    </nav>
  ),
}));

vi.mock('../../src/chat/Profile', () => ({
  Profile: ({ onClose, onLogout }: { onClose: () => void; onLogout: () => void }) => (
    <div data-testid="profile-panel">
      <button onClick={onClose}>chiudi profilo</button>
      <button onClick={onLogout}>logout profilo</button>
    </div>
  ),
}));

vi.mock('../../src/history/OrderRow', () => ({
  OrderRow: ({
    ordine,
    onopenDetail,
  }: {
    ordine: Ordine;
    onopenDetail: (o: Ordine) => void;
  }) => (
    <tr data-testid={`ordine-row-${ordine.codice_ordine}`}>
      <td>
        <button onClick={() => onopenDetail(ordine)}>
          Dettaglio {ordine.codice_ordine}
        </button>
      </td>
    </tr>
  ),
}));

vi.mock('../../src/history/Pagination', () => ({
  Pagination: ({
    pagina,
    totalePagine,
    onCambia,
  }: {
    pagina: number;
    totalePagine: number;
    onCambia: (pagina: number) => void;
  }) => (
    <div data-testid="paginazione">
      <button onClick={() => onCambia(pagina + 1)}>pagina successiva</button>
      <span>{pagina}/{totalePagine}</span>
    </div>
  ),
}));

vi.mock('../../src/history/OrderDetailsModal', () => ({
  OrderDetailsModal: ({
    ordine,
    onChiudi,
    onDuplica,
    erroreDuplica,
  }: {
    ordine: Ordine;
    onChiudi: () => void;
    onDuplica: (codiceOrdine: string) => void;
    erroreDuplica: string | null;
  }) => (
    <div data-testid="dettaglio-modal">
      <span>{ordine.codice_ordine}</span>
      <button onClick={onChiudi}>chiudi modal</button>
      <button onClick={() => onDuplica(ordine.codice_ordine)}>duplica</button>
      {erroreDuplica && <span data-testid="errore-duplica">{erroreDuplica}</span>}
    </div>
  ),
}));

vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({}),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function renderView() {
  return render(<HistoryView />);
}

// ─── Setup / Teardown ─────────────────────────────────────────────────────────

beforeEach(() => {
  vi.mocked(globalThis.fetch).mockClear();
  vmOverrides = {};
  mockloadPage.mockReset();
  mockopenDetail.mockReset();
  mockcloseDetail.mockReset();
  mockduplicateOrder.mockReset();
  mockClearAuth.mockReset();
  mockNavigate.mockClear();
});

afterEach(() => vi.clearAllMocks());

// ─── Render base ──────────────────────────────────────────────────────────────

describe('StoricoView – render base', () => {
  //TU-F_430
  it('renderizza la NavBar', () => {
    renderView();
    expect(screen.getByTestId('navbar')).toBeInTheDocument();
  });

  //TU-F_431
  it('chiama loadPage(1) all\'avvio (useEffect)', () => {
    renderView();
    expect(mockloadPage).toHaveBeenCalledWith(1);
  });

  //TU-F_432
  it('NON mostra il pannello profilo di default', () => {
    renderView();
    expect(screen.queryByTestId('profile-panel')).not.toBeInTheDocument();
  });

  //TU-F_433
  it('NON mostra il DettaglioModal se ordineScelto è null', () => {
    renderView();
    expect(screen.queryByTestId('dettaglio-modal')).not.toBeInTheDocument();
  });
});

// ─── Intestazione ─────────────────────────────────────────────────────────────

describe('StoricoView – intestazione', () => {
  //TU-F_434
  it('mostra "Storico Ordini" come titolo principale', () => {
    renderView();
    expect(screen.getByRole('heading', { name: /storico ordini/i })).toBeInTheDocument();
  });

  //TU-F_435
  it('mostra "Area Cliente" per utenti non admin', () => {
    renderView();
    expect(screen.getByText(/area cliente/i)).toBeInTheDocument();
  });

  //TU-F_436
  it('mostra "Pannello Admin" per admin', () => {
    vmOverrides = { isAdmin: true };
    renderView();
    expect(screen.getByText(/pannello admin/i)).toBeInTheDocument();
  });

  //TU-F_437
  it('mostra il testo "Visualizzazione completa" per admin', () => {
    vmOverrides = { isAdmin: true };
    renderView();
    expect(screen.getByText(/visualizzazione completa/i)).toBeInTheDocument();
  });

  //TU-F_438
  it('NON mostra "Visualizzazione completa" per cliente', () => {
    renderView();
    expect(screen.queryByText(/visualizzazione completa/i)).not.toBeInTheDocument();
  });

  //TU-F_439
  it('mostra il badge pag.X/Y solo quando ci sono ordini e loading=false', () => {
    vmOverrides = {
      ordini:       [{ codice_ordine: 'ORD-001', numero_ordine: 1, data: '2024-01-01', prodotti: [] }],
      pagina:       2,
      totalePagine: 5,
      loading:      false,
    };
    renderView();
    expect(screen.getByText(/pag\. 2 \/ 5/i)).toBeInTheDocument();
  });

  //TU-F_440
  it('NON mostra il badge pag. durante il caricamento', () => {
    vmOverrides = { loading: true };
    renderView();
    expect(screen.queryByText(/pag\./i)).not.toBeInTheDocument();
  });
});

// ─── Stato loading ────────────────────────────────────────────────────────────

describe('StoricoView – stato loading', () => {
  //TU-F_441
  it('mostra lo spinner di caricamento se loading=true', () => {
    vmOverrides = { loading: true };
    renderView();
    expect(screen.getByText(/caricamento/i)).toBeInTheDocument();
  });

  //TU-F_442
  it('NON mostra lo spinner se loading=false', () => {
    vmOverrides = { loading: false };
    renderView();
    expect(screen.queryByText(/caricamento/i)).not.toBeInTheDocument();
  });
});

// ─── Stato errore ─────────────────────────────────────────────────────────────

describe('StoricoView – stato errore', () => {
  //TU-F_443
  it('mostra il messaggio di errore se errore è valorizzato', () => {
    vmOverrides = { errore: 'Connessione fallita' };
    renderView();
    expect(screen.getByText('Connessione fallita')).toBeInTheDocument();
  });

  //TU-F_444
  it('NON mostra il messaggio di errore se errore è null', () => {
    vmOverrides = { errore: null };
    renderView();
    expect(screen.queryByText(/connessione fallita/i)).not.toBeInTheDocument();
  });
});

// ─── Lista vuota ──────────────────────────────────────────────────────────────

describe('StoricoView – lista vuota', () => {
  //TU-F_445
  it('mostra "Nessun ordine effettuato" se ordini=[] e loading=false e errore=null', () => {
    vmOverrides = { ordini: [], loading: false, errore: null };
    renderView();
    expect(screen.getByText(/nessun ordine effettuato/i)).toBeInTheDocument();
  });

  //TU-F_446
  it('NON mostra la tabella se ordini è vuoto', () => {
    vmOverrides = { ordini: [] };
    renderView();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});

// ─── Tabella con ordini ───────────────────────────────────────────────────────

describe('StoricoView – tabella con ordini', () => {
  const mockOrdini = [
    { codice_ordine: 'ORD-001', numero_ordine: 1, data: '2024-01-01', prodotti: [] },
    { codice_ordine: 'ORD-002', numero_ordine: 2, data: '2024-02-01', prodotti: [] },
  ];

  beforeEach(() => {
    vmOverrides = { ordini: mockOrdini, loading: false, errore: null };
  });

  //TU-F_447
  it('renderizza una OrdineRow per ogni ordine', () => {
    renderView();
    expect(screen.getByTestId('ordine-row-ORD-001')).toBeInTheDocument();
    expect(screen.getByTestId('ordine-row-ORD-002')).toBeInTheDocument();
  });

  //TU-F_448
  it('mostra la colonna "Cliente" nell\'header per admin', () => {
    vmOverrides = { ...vmOverrides, isAdmin: true };
    renderView();
    const ths = document.querySelectorAll('th');
    const clienteTh = Array.from(ths).find(th => /cliente/i.test(th.textContent ?? ''));
    expect(clienteTh).toBeTruthy();
  });

  //TU-F_449
  it('NON mostra la colonna "Cliente" per utente normale', () => {
    vmOverrides = { ...vmOverrides, isAdmin: false };
    renderView();
    const ths = document.querySelectorAll('th');
    const clienteTh = Array.from(ths).find(th => /cliente/i.test(th.textContent ?? ''));
    expect(clienteTh).toBeUndefined();
  });

  //TU-F_450
  it('mostra le intestazioni di colonna standard', () => {
    renderView();
    expect(screen.getByText(/codice/i)).toBeInTheDocument();
    expect(screen.getByText(/data/i)).toBeInTheDocument();
    expect(screen.getByText(/prodotti/i)).toBeInTheDocument();
  });

  //TU-F_451
  it('renderizza il componente Paginazione', () => {
    renderView();
    expect(screen.getByTestId('paginazione')).toBeInTheDocument();
  });

  //TU-F_452
  it('la paginazione chiama loadPage con il numero corretto', () => {
    renderView();
    fireEvent.click(screen.getByText('pagina successiva'));
    expect(mockloadPage).toHaveBeenCalledWith(2); // pagina(1) + 1
  });

  //TU-F_453
  it('click su "Dettaglio" chiama openDetail con l\'ordine', () => {
    renderView();
    fireEvent.click(screen.getByText('Dettaglio ORD-001'));
    expect(mockopenDetail).toHaveBeenCalledWith(mockOrdini[0]);
  });
});

// ─── DettaglioModal ───────────────────────────────────────────────────────────

describe('StoricoView – DettaglioModal', () => {
  const ordine = { codice_ordine: 'ORD-001', numero_ordine: 1, data: '2024-01-01', prodotti: [] };

  //TU-F_454
  it('mostra il DettaglioModal se ordineScelto è valorizzato', () => {
    vmOverrides = { ordineScelto: ordine };
    renderView();
    expect(screen.getByTestId('dettaglio-modal')).toBeInTheDocument();
    expect(screen.getByText('ORD-001')).toBeInTheDocument();
  });

  //TU-F_455
  it('chiama closeDetail al click su "chiudi modal"', () => {
    vmOverrides = { ordineScelto: ordine };
    renderView();
    fireEvent.click(screen.getByText('chiudi modal'));
    expect(mockcloseDetail).toHaveBeenCalledTimes(1);
  });

  //TU-F_456
  it('chiama duplicateOrder al click su "duplica"', () => {
    vmOverrides = { ordineScelto: ordine };
    renderView();
    fireEvent.click(screen.getByText('duplica'));
    expect(mockduplicateOrder).toHaveBeenCalledWith('ORD-001');
  });

  //TU-F_457
  it('passa erroreDuplica al DettaglioModal', () => {
    vmOverrides = { ordineScelto: ordine, erroreDuplica: 'Errore test' };
    renderView();
    expect(screen.getByTestId('errore-duplica')).toHaveTextContent('Errore test');
  });
});

// ─── Profilo ──────────────────────────────────────────────────────────────────

describe('StoricoView – profilo', () => {
  //TU-F_458
  it('apre il pannello profilo al click su "Apri profilo"', () => {
    renderView();
    fireEvent.click(screen.getByTitle('Apri profilo'));
    expect(screen.getByTestId('profile-panel')).toBeInTheDocument();
  });

  //TU-F_459
  it('chiude il pannello profilo al click su "chiudi profilo"', () => {
    renderView();
    fireEvent.click(screen.getByTitle('Apri profilo'));
    fireEvent.click(screen.getByText('chiudi profilo'));
    expect(screen.queryByTestId('profile-panel')).not.toBeInTheDocument();
  });
});

// ─── Logout ───────────────────────────────────────────────────────────────────

describe('StoricoView – logout', () => {

  //TU-F_460
  it('chiama clearAuth e reindirizza a "/" al click su logout nella NavBar', async () => {
    renderView();
    fireEvent.click(screen.getByTitle('Logout'));
    await waitFor(() => {
      expect(mockClearAuth).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  //TU-F_461
  it('logout funziona anche dal pannello profilo', async () => {
    renderView();
    fireEvent.click(screen.getByTitle('Apri profilo'));
    fireEvent.click(screen.getByText('logout profilo'));
    await waitFor(() => {
      expect(mockClearAuth).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });
});

// ─── Filtro data (righe 60-61, 80-82, 210-301) ───────────────────────────────

describe('StoricoView – filtro data', () => {
  const mockOrdini = [
    { codice_ordine: 'ORD-001', numero_ordine: 1, data: '2024-01-15T00:00:00Z', prodotti: [] },
    { codice_ordine: 'ORD-002', numero_ordine: 2, data: '2024-03-20T00:00:00Z', prodotti: [] },
    { codice_ordine: 'ORD-003', numero_ordine: 3, data: '2024-06-10T00:00:00Z', prodotti: [] },
  ];

  // ── apertura/chiusura pannello ────────────────────────────────────────────

  //TU-F_462
  it('il pannello filtro è chiuso di default', () => {
    vmOverrides = { ordini: mockOrdini };
    renderView();
    expect(screen.queryByText(/filtra per data/i)).not.toBeInTheDocument();
  });

  //TU-F_463
  it('apre il pannello filtro al click sull\'icona calendario', () => {
    renderView();
    fireEvent.click(screen.getByTitle('Filtra per data'));
    expect(screen.getByText(/filtra per data/i)).toBeInTheDocument();
  });

  //TU-F_464
  it('chiude il pannello filtro al secondo click sull\'icona (toggle)', () => {
    renderView();
    fireEvent.click(screen.getByTitle('Filtra per data'));
    fireEvent.click(screen.getByTitle('Filtra per data'));
    expect(screen.queryByText(/da/i)).not.toBeInTheDocument();
  });

  //TU-F_465
  it('chiude il pannello filtro cliccando fuori (useEffect clickOutside – riga 60-61)', async () => {
    renderView();
    fireEvent.click(screen.getByTitle('Filtra per data'));
    expect(screen.getByText(/filtra per data/i)).toBeInTheDocument();

    // Simula un click fuori dal pannello
    await act(async () => {
      fireEvent.mouseDown(document.body);
    });
    expect(screen.queryByText(/filtra per data/i)).not.toBeInTheDocument();
  });

  //TU-F_466
  it('il click dentro il pannello filtro NON lo chiude', async () => {
    renderView();
    fireEvent.click(screen.getByTitle('Filtra per data'));

    // Clicca dentro il pannello stesso: cerca l'input "Da"
    const inputDa = screen.getAllByDisplayValue('')[0];
    await act(async () => {
      fireEvent.mouseDown(inputDa);
    });
    expect(screen.getByText(/filtra per data/i)).toBeInTheDocument();
  });

  // ── campo "Da" ────────────────────────────────────────────────────────────

  //TU-F_467
  it('impostare la data "Da" chiama loadPage(1, startDate, "")', () => {
    renderView();
    fireEvent.click(screen.getByTitle('Filtra per data'));

    const inputs = screen.getAllByDisplayValue('');
    const inputDa = inputs[0];
    fireEvent.change(inputDa, { target: { value: '2024-02-01' } });

    expect(mockloadPage).toHaveBeenCalledWith(1, '2024-02-01', '');
  });

  // ── campo "A" ─────────────────────────────────────────────────────────────

  //TU-F_468
  it('impostare la data "A" chiama loadPage(1, "", endDate)', () => {
    renderView();
    fireEvent.click(screen.getByTitle('Filtra per data'));

    const inputs = screen.getAllByDisplayValue('');
    const inputA = inputs[1]; 
    fireEvent.change(inputA, { target: { value: '2024-05-01' } });

    expect(mockloadPage).toHaveBeenCalledWith(1, '', '2024-05-01');
  });

  // ── filtro attivo: indicatore visuale ─────────────────────────────────────

  //TU-F_469
  it('mostra il pallino indicatore quando il filtro è attivo', () => {
    renderView();
    fireEvent.click(screen.getByTitle('Filtra per data'));

    const inputs = screen.getAllByDisplayValue('');
    fireEvent.change(inputs[0], { target: { value: '2024-01-01' } });

    const btn = screen.getByTitle('Filtra per data');
    expect(btn.className).toMatch(/color-2/);
  });

  // ── filtraggio lato client ────────────────────────────────────────────────

  //TU-F_470
  it('filtra gli ordini per startDate: esclude ordini precedenti', () => {
    vmOverrides = { ordini: mockOrdini, loading: false, errore: null };
    renderView();
    fireEvent.click(screen.getByTitle('Filtra per data'));

    const inputs = screen.getAllByDisplayValue('');
    fireEvent.change(inputs[0], { target: { value: '2024-03-01' } });

    expect(screen.queryByTestId('ordine-row-ORD-001')).not.toBeInTheDocument();
    expect(screen.getByTestId('ordine-row-ORD-002')).toBeInTheDocument();
    expect(screen.getByTestId('ordine-row-ORD-003')).toBeInTheDocument();
  });

  //TU-F_471
  it('filtra gli ordini per endDate: esclude ordini successivi', () => {
    vmOverrides = { ordini: mockOrdini, loading: false, errore: null };
    renderView();
    fireEvent.click(screen.getByTitle('Filtra per data'));

    const inputs = screen.getAllByDisplayValue('');
    fireEvent.change(inputs[1], { target: { value: '2024-04-01' } });

    expect(screen.getByTestId('ordine-row-ORD-001')).toBeInTheDocument();
    expect(screen.getByTestId('ordine-row-ORD-002')).toBeInTheDocument();
    expect(screen.queryByTestId('ordine-row-ORD-003')).not.toBeInTheDocument();
  });

  //TU-F_472
  it('filtra con entrambe le date: mostra solo ordini nell\'intervallo', () => {
    vmOverrides = { ordini: mockOrdini, loading: false, errore: null };
    renderView();
    fireEvent.click(screen.getByTitle('Filtra per data'));

    const inputs = screen.getAllByDisplayValue('');
    fireEvent.change(inputs[0], { target: { value: '2024-02-01' } });
    fireEvent.change(inputs[1], { target: { value: '2024-04-01' } });

    expect(screen.queryByTestId('ordine-row-ORD-001')).not.toBeInTheDocument();
    expect(screen.getByTestId('ordine-row-ORD-002')).toBeInTheDocument();
    expect(screen.queryByTestId('ordine-row-ORD-003')).not.toBeInTheDocument();
  });

  //TU-F_473
  it('mostra "Nessun ordine corrisponde al filtro" quando filtroAttivo e lista filtrata è vuota', () => {
    vmOverrides = { ordini: mockOrdini, loading: false, errore: null };
    renderView();
    fireEvent.click(screen.getByTitle('Filtra per data'));

    const inputs = screen.getAllByDisplayValue('');
    fireEvent.change(inputs[0], { target: { value: '2099-01-01' } });

    expect(screen.getByText(/nessun ordine corrisponde al filtro/i)).toBeInTheDocument();
  });

  // ── reset filtro (righe 80-82) ────────────────────────────────────────────

  //TU-F_474
  it('il pulsante "Azzera" è nascosto quando il filtro non è attivo', () => {
    renderView();
    fireEvent.click(screen.getByTitle('Filtra per data'));
    expect(screen.queryByText('Azzera')).not.toBeInTheDocument();
  });

  //TU-F_475
  it('il pulsante "Azzera" compare quando il filtro è attivo (riga 80)', () => {
    renderView();
    fireEvent.click(screen.getByTitle('Filtra per data'));

    const inputs = screen.getAllByDisplayValue('');
    fireEvent.change(inputs[0], { target: { value: '2024-01-01' } });

    expect(screen.getByText('Azzera')).toBeInTheDocument();
  });

  //TU-F_476
  it('cliccando "Azzera" reimposta entrambe le date e chiama loadPage(1,"","") (riga 80-82)', () => {
    vmOverrides = { ordini: mockOrdini, loading: false, errore: null };
    renderView();
    fireEvent.click(screen.getByTitle('Filtra per data'));

    const inputs = screen.getAllByDisplayValue('');
    fireEvent.change(inputs[0], { target: { value: '2024-01-01' } });
    mockloadPage.mockReset();

    fireEvent.click(screen.getByText('Azzera'));

    expect(mockloadPage).toHaveBeenCalledWith(1, '', '');
    expect(screen.getByTestId('ordine-row-ORD-001')).toBeInTheDocument();
  });

  //TU-F_477
  it('dopo "Azzera" il pulsante indicatore torna allo stile inattivo', () => {
    renderView();
    fireEvent.click(screen.getByTitle('Filtra per data'));

    const inputs = screen.getAllByDisplayValue('');
    fireEvent.change(inputs[0], { target: { value: '2024-01-01' } });
    fireEvent.click(screen.getByText('Azzera'));

    const btn = screen.getByTitle('Filtra per data');
    expect(btn.className).not.toMatch(/bg-\(--color-2\)/);
  });

  // ── testo hint nel pannello ────────────────────────────────────────────────

  //TU-F_478
  it('mostra il testo di aiuto "Lascia A vuoto" nel pannello', () => {
    renderView();
    fireEvent.click(screen.getByTitle('Filtra per data'));
    expect(screen.getByText(/lascia .* vuoto/i)).toBeInTheDocument();
  });

  // ── constraint max/min sugli input ────────────────────────────────────────

  //TU-F_479
  it('l\'input "Da" riceve l\'attributo max quando endDate è impostata', () => {
    renderView();
    fireEvent.click(screen.getByTitle('Filtra per data'));

    const inputs = screen.getAllByDisplayValue('');
    fireEvent.change(inputs[1], { target: { value: '2024-12-31' } });
    const inputDa = screen.getAllByDisplayValue('')[0];
    expect(inputDa).toHaveAttribute('max', '2024-12-31');
  });

  //TU-F_480
  it('l\'input "A" riceve l\'attributo min quando startDate è impostata', () => {
    renderView();
    fireEvent.click(screen.getByTitle('Filtra per data'));

    const inputs = screen.getAllByDisplayValue('');
    fireEvent.change(inputs[0], { target: { value: '2024-01-01' } });

    const inputA = screen.getAllByDisplayValue('')[0]; 
    expect(inputA).toHaveAttribute('min', '2024-01-01');
  });
});
