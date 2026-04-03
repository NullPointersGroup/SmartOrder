import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';

import { StoricoView } from '../../src/Storico/StoricoView';

// ─── Mock authStore ───────────────────────────────────────────────────────────

const mockClearAuth = vi.fn();
vi.mock('../../src/auth/authStore', () => ({
  useAuthStore: vi.fn((selector: (s: AuthState) => unknown) =>
    selector({
      username: 'mario',
      admin: null,
      clearAuth: mockClearAuth,
    })
  ),
}));

// ─── Mock usePageTitle ────────────────────────────────────────────────────────

vi.mock('../../src/hooks/usePageTitle', () => ({
  usePageTitle: vi.fn(),
}));

// ─── Mock ViewModel ───────────────────────────────────────────────────────────

const mockCaricaPagina   = vi.fn();
const mockApriDettaglio  = vi.fn();
const mockChiudiDettaglio = vi.fn();
const mockDuplicaOrdine  = vi.fn();

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
  caricaPagina: (pagina: number, dataInizio?: string, dataFine?: string) => void;
  apriDettaglio: (ordine: Ordine) => void;
  chiudiDettaglio: () => void;
  duplicaOrdine: (codiceOrdine: string) => void;
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
  caricaPagina: mockCaricaPagina,
  apriDettaglio: mockApriDettaglio,
  chiudiDettaglio: mockChiudiDettaglio,
  duplicaOrdine: mockDuplicaOrdine,
};

let vmOverrides: Partial<StoricoVm> = {};

vi.mock('../../src/Storico/StoricoViewModel', () => ({
  useStoricoViewModel: (): StoricoVm => ({ ...baseVm, ...vmOverrides }),
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

vi.mock('../../src/Storico/OrdineRow', () => ({
  OrdineRow: ({
    ordine,
    onApriDettaglio,
  }: {
    ordine: Ordine;
    onApriDettaglio: (o: Ordine) => void;
  }) => (
    <tr data-testid={`ordine-row-${ordine.codice_ordine}`}>
      <td>
        <button onClick={() => onApriDettaglio(ordine)}>
          Dettaglio {ordine.codice_ordine}
        </button>
      </td>
    </tr>
  ),
}));

vi.mock('../../src/Storico/Paginazione', () => ({
  Paginazione: ({
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

vi.mock('../../src/Storico/DettaglioModal', () => ({
  DettaglioModal: ({
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function renderView() {
  return render(<StoricoView />);
}

// ─── Setup / Teardown ─────────────────────────────────────────────────────────

beforeEach(() => {
  vmOverrides = {};
  mockCaricaPagina.mockReset();
  mockApriDettaglio.mockReset();
  mockChiudiDettaglio.mockReset();
  mockDuplicaOrdine.mockReset();
  mockClearAuth.mockReset();
});

afterEach(() => vi.clearAllMocks());

// ─── Render base ──────────────────────────────────────────────────────────────

describe('StoricoView – render base', () => {
  it('renderizza la NavBar', () => {
    renderView();
    expect(screen.getByTestId('navbar')).toBeInTheDocument();
  });

  it('chiama caricaPagina(1) all\'avvio (useEffect)', () => {
    renderView();
    expect(mockCaricaPagina).toHaveBeenCalledWith(1);
  });

  it('NON mostra il pannello profilo di default', () => {
    renderView();
    expect(screen.queryByTestId('profile-panel')).not.toBeInTheDocument();
  });

  it('NON mostra il DettaglioModal se ordineScelto è null', () => {
    renderView();
    expect(screen.queryByTestId('dettaglio-modal')).not.toBeInTheDocument();
  });
});

// ─── Intestazione ─────────────────────────────────────────────────────────────

describe('StoricoView – intestazione', () => {
  it('mostra "Storico Ordini" come titolo principale', () => {
    renderView();
    expect(screen.getByRole('heading', { name: /storico ordini/i })).toBeInTheDocument();
  });

  it('mostra "Area Cliente" per utenti non admin', () => {
    renderView();
    expect(screen.getByText(/area cliente/i)).toBeInTheDocument();
  });

  it('mostra "Pannello Admin" per admin', () => {
    vmOverrides = { isAdmin: true };
    renderView();
    expect(screen.getByText(/pannello admin/i)).toBeInTheDocument();
  });

  it('mostra il testo "Visualizzazione completa" per admin', () => {
    vmOverrides = { isAdmin: true };
    renderView();
    expect(screen.getByText(/visualizzazione completa/i)).toBeInTheDocument();
  });

  it('NON mostra "Visualizzazione completa" per cliente', () => {
    renderView();
    expect(screen.queryByText(/visualizzazione completa/i)).not.toBeInTheDocument();
  });

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

  it('NON mostra il badge pag. durante il caricamento', () => {
    vmOverrides = { loading: true };
    renderView();
    expect(screen.queryByText(/pag\./i)).not.toBeInTheDocument();
  });
});

// ─── Stato loading ────────────────────────────────────────────────────────────

describe('StoricoView – stato loading', () => {
  it('mostra lo spinner di caricamento se loading=true', () => {
    vmOverrides = { loading: true };
    renderView();
    expect(screen.getByText(/caricamento/i)).toBeInTheDocument();
  });

  it('NON mostra lo spinner se loading=false', () => {
    vmOverrides = { loading: false };
    renderView();
    expect(screen.queryByText(/caricamento/i)).not.toBeInTheDocument();
  });
});

// ─── Stato errore ─────────────────────────────────────────────────────────────

describe('StoricoView – stato errore', () => {
  it('mostra il messaggio di errore se errore è valorizzato', () => {
    vmOverrides = { errore: 'Connessione fallita' };
    renderView();
    expect(screen.getByText('Connessione fallita')).toBeInTheDocument();
  });

  it('NON mostra il messaggio di errore se errore è null', () => {
    vmOverrides = { errore: null };
    renderView();
    expect(screen.queryByText(/connessione fallita/i)).not.toBeInTheDocument();
  });
});

// ─── Lista vuota ──────────────────────────────────────────────────────────────

describe('StoricoView – lista vuota', () => {
  it('mostra "Nessun ordine effettuato" se ordini=[] e loading=false e errore=null', () => {
    vmOverrides = { ordini: [], loading: false, errore: null };
    renderView();
    expect(screen.getByText(/nessun ordine effettuato/i)).toBeInTheDocument();
  });

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

  it('renderizza una OrdineRow per ogni ordine', () => {
    renderView();
    expect(screen.getByTestId('ordine-row-ORD-001')).toBeInTheDocument();
    expect(screen.getByTestId('ordine-row-ORD-002')).toBeInTheDocument();
  });

  it('mostra la colonna "Cliente" nell\'header per admin', () => {
    vmOverrides = { ...vmOverrides, isAdmin: true };
    renderView();
    const ths = document.querySelectorAll('th');
    const clienteTh = Array.from(ths).find(th => /cliente/i.test(th.textContent ?? ''));
    expect(clienteTh).toBeTruthy();
  });

  it('NON mostra la colonna "Cliente" per utente normale', () => {
    vmOverrides = { ...vmOverrides, isAdmin: false };
    renderView();
    const ths = document.querySelectorAll('th');
    const clienteTh = Array.from(ths).find(th => /cliente/i.test(th.textContent ?? ''));
    expect(clienteTh).toBeUndefined();
  });

  it('mostra le intestazioni di colonna standard', () => {
    renderView();
    expect(screen.getByText(/codice/i)).toBeInTheDocument();
    expect(screen.getByText(/data/i)).toBeInTheDocument();
    expect(screen.getByText(/prodotti/i)).toBeInTheDocument();
  });

  it('renderizza il componente Paginazione', () => {
    renderView();
    expect(screen.getByTestId('paginazione')).toBeInTheDocument();
  });

  it('la paginazione chiama caricaPagina con il numero corretto', () => {
    renderView();
    fireEvent.click(screen.getByText('pagina successiva'));
    expect(mockCaricaPagina).toHaveBeenCalledWith(2); // pagina(1) + 1
  });

  it('click su "Dettaglio" chiama apriDettaglio con l\'ordine', () => {
    renderView();
    fireEvent.click(screen.getByText('Dettaglio ORD-001'));
    expect(mockApriDettaglio).toHaveBeenCalledWith(mockOrdini[0]);
  });
});

// ─── DettaglioModal ───────────────────────────────────────────────────────────

describe('StoricoView – DettaglioModal', () => {
  const ordine = { codice_ordine: 'ORD-001', numero_ordine: 1, data: '2024-01-01', prodotti: [] };

  it('mostra il DettaglioModal se ordineScelto è valorizzato', () => {
    vmOverrides = { ordineScelto: ordine };
    renderView();
    expect(screen.getByTestId('dettaglio-modal')).toBeInTheDocument();
    expect(screen.getByText('ORD-001')).toBeInTheDocument();
  });

  it('chiama chiudiDettaglio al click su "chiudi modal"', () => {
    vmOverrides = { ordineScelto: ordine };
    renderView();
    fireEvent.click(screen.getByText('chiudi modal'));
    expect(mockChiudiDettaglio).toHaveBeenCalledTimes(1);
  });

  it('chiama duplicaOrdine al click su "duplica"', () => {
    vmOverrides = { ordineScelto: ordine };
    renderView();
    fireEvent.click(screen.getByText('duplica'));
    expect(mockDuplicaOrdine).toHaveBeenCalledWith('ORD-001');
  });

  it('passa erroreDuplica al DettaglioModal', () => {
    vmOverrides = { ordineScelto: ordine, erroreDuplica: 'Errore test' };
    renderView();
    expect(screen.getByTestId('errore-duplica')).toHaveTextContent('Errore test');
  });
});

// ─── Profilo ──────────────────────────────────────────────────────────────────

describe('StoricoView – profilo', () => {
  it('apre il pannello profilo al click su "Apri profilo"', () => {
    renderView();
    fireEvent.click(screen.getByTitle('Apri profilo'));
    expect(screen.getByTestId('profile-panel')).toBeInTheDocument();
  });

  it('chiude il pannello profilo al click su "chiudi profilo"', () => {
    renderView();
    fireEvent.click(screen.getByTitle('Apri profilo'));
    fireEvent.click(screen.getByText('chiudi profilo'));
    expect(screen.queryByTestId('profile-panel')).not.toBeInTheDocument();
  });
});

// ─── Logout ───────────────────────────────────────────────────────────────────

describe('StoricoView – logout', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'location', {
      value:    { href: '' },
      writable: true,
    });
  });

  it('chiama clearAuth e reindirizza a "/" al click su logout nella NavBar', () => {
    renderView();
    fireEvent.click(screen.getByTitle('Logout'));
    expect(mockClearAuth).toHaveBeenCalledTimes(1);
    expect(globalThis.location.href).toBe('/');
  });

  it('logout funziona anche dal pannello profilo', () => {
    renderView();
    fireEvent.click(screen.getByTitle('Apri profilo'));
    fireEvent.click(screen.getByText('logout profilo'));
    expect(mockClearAuth).toHaveBeenCalledTimes(1);
    expect(globalThis.location.href).toBe('/');
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

  it('il pannello filtro è chiuso di default', () => {
    vmOverrides = { ordini: mockOrdini };
    renderView();
    expect(screen.queryByText(/filtra per data/i)).not.toBeInTheDocument();
  });

  it('apre il pannello filtro al click sull\'icona calendario', () => {
    renderView();
    fireEvent.click(screen.getByTitle('Filtra per data'));
    expect(screen.getByText(/filtra per data/i)).toBeInTheDocument();
  });

  it('chiude il pannello filtro al secondo click sull\'icona (toggle)', () => {
    renderView();
    fireEvent.click(screen.getByTitle('Filtra per data'));
    fireEvent.click(screen.getByTitle('Filtra per data'));
    expect(screen.queryByText(/da/i)).not.toBeInTheDocument();
  });

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

  it('impostare la data "Da" chiama caricaPagina(1, dataInizio, "")', () => {
    renderView();
    fireEvent.click(screen.getByTitle('Filtra per data'));

    const inputs = screen.getAllByDisplayValue('');
    const inputDa = inputs[0];
    fireEvent.change(inputDa, { target: { value: '2024-02-01' } });

    expect(mockCaricaPagina).toHaveBeenCalledWith(1, '2024-02-01', '');
  });

  // ── campo "A" ─────────────────────────────────────────────────────────────

  it('impostare la data "A" chiama caricaPagina(1, "", dataFine)', () => {
    renderView();
    fireEvent.click(screen.getByTitle('Filtra per data'));

    const inputs = screen.getAllByDisplayValue('');
    const inputA = inputs[1]; 
    fireEvent.change(inputA, { target: { value: '2024-05-01' } });

    expect(mockCaricaPagina).toHaveBeenCalledWith(1, '', '2024-05-01');
  });

  // ── filtro attivo: indicatore visuale ─────────────────────────────────────

  it('mostra il pallino indicatore quando il filtro è attivo', () => {
    renderView();
    fireEvent.click(screen.getByTitle('Filtra per data'));

    const inputs = screen.getAllByDisplayValue('');
    fireEvent.change(inputs[0], { target: { value: '2024-01-01' } });

    const btn = screen.getByTitle('Filtra per data');
    expect(btn.className).toMatch(/color-2/);
  });

  // ── filtraggio lato client ────────────────────────────────────────────────

  it('filtra gli ordini per dataInizio: esclude ordini precedenti', () => {
    vmOverrides = { ordini: mockOrdini, loading: false, errore: null };
    renderView();
    fireEvent.click(screen.getByTitle('Filtra per data'));

    const inputs = screen.getAllByDisplayValue('');
    fireEvent.change(inputs[0], { target: { value: '2024-03-01' } });

    expect(screen.queryByTestId('ordine-row-ORD-001')).not.toBeInTheDocument();
    expect(screen.getByTestId('ordine-row-ORD-002')).toBeInTheDocument();
    expect(screen.getByTestId('ordine-row-ORD-003')).toBeInTheDocument();
  });

  it('filtra gli ordini per dataFine: esclude ordini successivi', () => {
    vmOverrides = { ordini: mockOrdini, loading: false, errore: null };
    renderView();
    fireEvent.click(screen.getByTitle('Filtra per data'));

    const inputs = screen.getAllByDisplayValue('');
    fireEvent.change(inputs[1], { target: { value: '2024-04-01' } });

    expect(screen.getByTestId('ordine-row-ORD-001')).toBeInTheDocument();
    expect(screen.getByTestId('ordine-row-ORD-002')).toBeInTheDocument();
    expect(screen.queryByTestId('ordine-row-ORD-003')).not.toBeInTheDocument();
  });

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

  it('mostra "Nessun ordine corrisponde al filtro" quando filtroAttivo e lista filtrata è vuota', () => {
    vmOverrides = { ordini: mockOrdini, loading: false, errore: null };
    renderView();
    fireEvent.click(screen.getByTitle('Filtra per data'));

    const inputs = screen.getAllByDisplayValue('');
    fireEvent.change(inputs[0], { target: { value: '2099-01-01' } });

    expect(screen.getByText(/nessun ordine corrisponde al filtro/i)).toBeInTheDocument();
  });

  // ── reset filtro (righe 80-82) ────────────────────────────────────────────

  it('il pulsante "Azzera" è nascosto quando il filtro non è attivo', () => {
    renderView();
    fireEvent.click(screen.getByTitle('Filtra per data'));
    expect(screen.queryByText('Azzera')).not.toBeInTheDocument();
  });

  it('il pulsante "Azzera" compare quando il filtro è attivo (riga 80)', () => {
    renderView();
    fireEvent.click(screen.getByTitle('Filtra per data'));

    const inputs = screen.getAllByDisplayValue('');
    fireEvent.change(inputs[0], { target: { value: '2024-01-01' } });

    expect(screen.getByText('Azzera')).toBeInTheDocument();
  });

  it('cliccando "Azzera" reimposta entrambe le date e chiama caricaPagina(1,"","") (riga 80-82)', () => {
    vmOverrides = { ordini: mockOrdini, loading: false, errore: null };
    renderView();
    fireEvent.click(screen.getByTitle('Filtra per data'));

    const inputs = screen.getAllByDisplayValue('');
    fireEvent.change(inputs[0], { target: { value: '2024-01-01' } });
    mockCaricaPagina.mockReset();

    fireEvent.click(screen.getByText('Azzera'));

    expect(mockCaricaPagina).toHaveBeenCalledWith(1, '', '');
    expect(screen.getByTestId('ordine-row-ORD-001')).toBeInTheDocument();
  });

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

  it('mostra il testo di aiuto "Lascia A vuoto" nel pannello', () => {
    renderView();
    fireEvent.click(screen.getByTitle('Filtra per data'));
    expect(screen.getByText(/lascia .* vuoto/i)).toBeInTheDocument();
  });

  // ── constraint max/min sugli input ────────────────────────────────────────

  it('l\'input "Da" riceve l\'attributo max quando dataFine è impostata', () => {
    renderView();
    fireEvent.click(screen.getByTitle('Filtra per data'));

    const inputs = screen.getAllByDisplayValue('');
    fireEvent.change(inputs[1], { target: { value: '2024-12-31' } });
    const inputDa = screen.getAllByDisplayValue('')[0];
    expect(inputDa).toHaveAttribute('max', '2024-12-31');
  });

  it('l\'input "A" riceve l\'attributo min quando dataInizio è impostata', () => {
    renderView();
    fireEvent.click(screen.getByTitle('Filtra per data'));

    const inputs = screen.getAllByDisplayValue('');
    fireEvent.change(inputs[0], { target: { value: '2024-01-01' } });

    const inputA = screen.getAllByDisplayValue('')[0]; 
    expect(inputA).toHaveAttribute('min', '2024-01-01');
  });
});