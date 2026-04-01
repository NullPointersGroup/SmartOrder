import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import React from 'react';

import { StoricoView } from '../../src/storico/StoricoView';

// ─── Mock authStore ───────────────────────────────────────────────────────────

const mockClearAuth = vi.fn();
vi.mock('../../src/auth/authStore', () => ({
  useAuthStore: vi.fn((selector: (s: any) => any) =>
    selector({
      username:  'mario',
      admin:     null,
      clearAuth: mockClearAuth,
    })
  ),
}));

// ─── Mock usePageTitle ────────────────────────────────────────────────────────

vi.mock('../../src/hooks/usePageTitle', () => ({
  usePageTitle: vi.fn(),
}));

// ─── Mock ViewModel ───────────────────────────────────────────────────────────

const mockCapricaPagina  = vi.fn();
const mockApriDettaglio  = vi.fn();
const mockChiudiDettaglio = vi.fn();
const mockDuplicaOrdine  = vi.fn();

const baseVm = {
  ordini:         [] as any[],
  pagina:         1,
  totalePagine:   1,
  ordineScelto:   null as any,
  loading:        false,
  errore:         null as string | null,
  erroreDuplica:  null as string | null,
  isAdmin:        false,
  caricaPagina:   mockCapricaPagina,
  apriDettaglio:  mockApriDettaglio,
  chiudiDettaglio: mockChiudiDettaglio,
  duplicaOrdine:  mockDuplicaOrdine,
};

let vmOverrides: Partial<typeof baseVm> = {};

vi.mock('../../src/storico/StoricoViewModel', () => ({
  useStoricoViewModel: () => ({ ...baseVm, ...vmOverrides }),
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

vi.mock('../../src/storico/OrdineRow', () => ({
  OrdineRow: ({ ordine, onApriDettaglio }: { ordine: any; onApriDettaglio: (o: any) => void }) => (
    <tr data-testid={`ordine-row-${ordine.codice_ordine}`}>
      <td>
        <button onClick={() => onApriDettaglio(ordine)}>
          Dettaglio {ordine.codice_ordine}
        </button>
      </td>
    </tr>
  ),
}));

vi.mock('../../src/storico/Paginazione', () => ({
  Paginazione: ({ pagina, totalePagine, onCambia }: any) => (
    <div data-testid="paginazione">
      <button onClick={() => onCambia(pagina + 1)}>pagina successiva</button>
      <span>{pagina}/{totalePagine}</span>
    </div>
  ),
}));

vi.mock('../../src/storico/DettaglioModal', () => ({
  DettaglioModal: ({ ordine, onChiudi, onDuplica, erroreDuplica }: any) => (
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
  mockCapricaPagina.mockReset();
  mockApriDettaglio.mockReset();
  mockChiudiDettaglio.mockReset();
  mockDuplicaOrdine.mockReset();
  mockClearAuth.mockReset();
  vi.clearAllMocks();
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
    expect(mockCapricaPagina).toHaveBeenCalledWith(1);
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
    // Cerca specificamente l'intestazione th con testo "Cliente"
    const ths = document.querySelectorAll('th');
    const clienteTh = Array.from(ths).find(th => /cliente/i.test(th.textContent ?? ''));
    expect(clienteTh).toBeTruthy();
  });

  it('NON mostra la colonna "Cliente" per utente normale', () => {
    vmOverrides = { ...vmOverrides, isAdmin: false };
    renderView();
    // Verifica che nessun <th> contenga "Cliente"
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
    expect(mockCapricaPagina).toHaveBeenCalledWith(2); // pagina(1) + 1
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