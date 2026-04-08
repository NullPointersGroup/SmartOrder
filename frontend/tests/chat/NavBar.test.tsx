import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { NavBar } from '../../src/chat/NavBar';
import { useAuthStore } from '../../src/auth/authStore';

// Mock dello store di autenticazione
vi.mock('../../src/auth/authStore', () => ({
  useAuthStore: vi.fn((selector) => {
    const state = { admin: null };
    return selector ? selector(state) : state;
  }),
}));

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const defaultProps = {
  username: 'mario',
  onLogout: vi.fn(),
  onProfile: vi.fn(),
};

function renderNavBar(overrides: Partial<typeof defaultProps> = {}) {
  return render(
    <MemoryRouter>
      <NavBar {...defaultProps} {...overrides} />
    </MemoryRouter>
  );
}

// variabile condivisa tra mock e test
let mockAdmin: string | null = null;

vi.mock('../../src/auth/authStore', () => ({
  useAuthStore: vi.fn((selector) => {
    const state = { admin: mockAdmin };
    return selector ? selector(state) : state;
  }),
}));

beforeEach(() => {
  mockNavigate.mockClear();
  mockAdmin = null; // reset prima di ogni test
  defaultProps.onLogout  = vi.fn();
  defaultProps.onProfile = vi.fn();
  vi.mocked(useAuthStore).mockClear();
});

describe('NavBar – render base', () => {
  //TU-F_285
  it('mostra il brand "SmartOrder"', () => {
    renderNavBar();
    expect(screen.getByText(/smartorder/i)).toBeInTheDocument();
  });

  //TU-F_286
  it('mostra lo username dell\'utente', () => {
    renderNavBar();
    expect(screen.getByText('mario')).toBeInTheDocument();
  });

  //TU-F_287
  it('mostra l\'iniziale dell\'username come avatar', () => {
    renderNavBar();
    expect(screen.getByText('M')).toBeInTheDocument();
  });

  //TU-F_288
  it('con username null mostra "?" come avatar e testo', () => {
    renderNavBar({ username: undefined });
    expect(screen.getAllByText('?').length).toBeGreaterThanOrEqual(1);
  });

  //TU-F_289
  it('il dropdown è chiuso di default', () => {
    renderNavBar();
    expect(screen.queryByText('Profilo')).not.toBeInTheDocument();
    expect(screen.queryByText('Logout')).not.toBeInTheDocument();
  });
});

describe('NavBar – dropdown', () => {
  //TU-F_290
  it('apre il dropdown al click sul bottone utente', async () => {
    renderNavBar();
    fireEvent.click(screen.getByText('mario'));
    await waitFor(() => {
      expect(screen.getByText('Profilo')).toBeInTheDocument();
      expect(screen.getByText('Logout')).toBeInTheDocument();
    });
  });

  //TU-F_291
  it('chiude il dropdown al secondo click', async () => {
    renderNavBar();
    const btn = screen.getByText('mario');
    fireEvent.click(btn);
    await waitFor(() => expect(screen.getByText('Profilo')).toBeInTheDocument());
    fireEvent.click(btn);
    await waitFor(() => expect(screen.queryByText('Profilo')).not.toBeInTheDocument());
  });

  //TU-F_292
  it('chiude il dropdown cliccando fuori', async () => {
    renderNavBar();
    fireEvent.click(screen.getByText('mario'));
    await waitFor(() => expect(screen.getByText('Profilo')).toBeInTheDocument());
    fireEvent.mouseDown(document.body);
    await waitFor(() => expect(screen.queryByText('Profilo')).not.toBeInTheDocument());
  });

  //TU-F_293
  it('NON chiude il dropdown cliccando dentro la navbar', async () => {
    renderNavBar();
    fireEvent.click(screen.getByText('mario'));
    await waitFor(() => expect(screen.getByText('Profilo')).toBeInTheDocument());
    fireEvent.mouseDown(screen.getByText(/smartorder/i));
    await waitFor(() => expect(screen.getByText('Profilo')).toBeInTheDocument());
  });

  //TU-F_294
  it('mostra la sezione "Account" con lo username nel dropdown', async () => {
    renderNavBar();
    fireEvent.click(screen.getByText('mario'));
    await waitFor(() => {
      expect(screen.getByText('Account')).toBeInTheDocument();
    });
  });

  //TU-F_295
  it('mostra "?" nell\'header del dropdown quando username è null', async () => {
    renderNavBar({ username: undefined });
    fireEvent.click(screen.getAllByText('?')[0]);
    await waitFor(() => expect(screen.getByText('Account')).toBeInTheDocument());
    const qMarks = screen.getAllByText('?');
    expect(qMarks.length).toBeGreaterThanOrEqual(2);
  });
});

describe('NavBar – azioni', () => {
  //TU-F_296
  it('chiama onProfile e chiude il dropdown al click su "Profilo"', async () => {
    const onProfile = vi.fn();
    renderNavBar({ onProfile });
    fireEvent.click(screen.getByText('mario'));
    await waitFor(() => expect(screen.getByText('Profilo')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Profilo'));
    expect(onProfile).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByText('Profilo')).not.toBeInTheDocument());
  });

  //TU-F_297
  it('chiama onLogout e chiude il dropdown al click su "Logout"', async () => {
    const onLogout = vi.fn();
    renderNavBar({ onLogout });
    fireEvent.click(screen.getByText('mario'));
    await waitFor(() => expect(screen.getByText('Logout')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Logout'));
    expect(onLogout).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByText('Logout')).not.toBeInTheDocument());
  });
});

describe('NavBar – edge case username', () => {
  //TU-F_298
  it('mostra correttamente username con caratteri non ASCII', () => {
    renderNavBar({ username: 'àlex' });
    expect(screen.getAllByText('àlex').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('À')).toBeInTheDocument();
  });
});

describe('NavBar – visibilità Storico per ruolo cliente', () => {
  //TU-F_299
  it('mostra il pulsante Storico se il ruolo è "cliente"', async () => {
  mockAdmin = 'cliente';
  renderNavBar();
  fireEvent.click(screen.getByText('mario'));
  await waitFor(() => expect(screen.getByText('Storico')).toBeInTheDocument());
});

//TU-F_300
it('NON mostra il pulsante Storico se il ruolo non è "cliente"', async () => {
  renderNavBar();
  fireEvent.click(screen.getByText('mario'));
  await waitFor(() => expect(screen.getByText('Logout')).toBeInTheDocument());
  expect(screen.queryByText('Storico')).not.toBeInTheDocument();
});

//TU-F_301
it('naviga verso /history al click su Storico', async () => {
  mockAdmin = 'cliente';
  renderNavBar();
  fireEvent.click(screen.getByText('mario'));
  await waitFor(() => expect(screen.getByText('Storico')).toBeInTheDocument());
  fireEvent.click(screen.getByText('Storico'));
  expect(mockNavigate).toHaveBeenCalledWith('/history');
});
});