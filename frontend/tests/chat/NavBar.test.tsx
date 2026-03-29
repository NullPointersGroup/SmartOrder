import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import { NavBar } from '../../src/chat/NavBar';

const defaultProps = {
  username: 'mario',
  onLogout: vi.fn(),
  onDelete: vi.fn(),
  onProfile: vi.fn(),
};

function renderNavBar(overrides: Partial<typeof defaultProps> = {}) {
  return render(<NavBar {...defaultProps} {...overrides} />);
}

beforeEach(() => {
  defaultProps.onLogout  = vi.fn();
  defaultProps.onDelete  = vi.fn();
  defaultProps.onProfile = vi.fn();
});

describe('NavBar – render base', () => {
  it('mostra il brand "SmartOrder"', () => {
    renderNavBar();
    expect(screen.getByText(/smartorder/i)).toBeInTheDocument();
  });

  it('mostra lo username dell\'utente', () => {
    renderNavBar();
    expect(screen.getByText('mario')).toBeInTheDocument();
  });

  it('mostra l\'iniziale dell\'username come avatar', () => {
    renderNavBar();
    expect(screen.getByText('M')).toBeInTheDocument();
  });

  it('con username null mostra "?" come avatar e testo', () => {
    renderNavBar({ username: undefined });
    expect(screen.getAllByText('?').length).toBeGreaterThanOrEqual(1);
  });

  it('il dropdown è chiuso di default', () => {
    renderNavBar();
    expect(screen.queryByText('Profilo')).not.toBeInTheDocument();
    expect(screen.queryByText('Logout')).not.toBeInTheDocument();
  });
});

// Apertura dropdown
describe('NavBar – dropdown', () => {
  it('apre il dropdown al click sul bottone utente', async () => {
    renderNavBar();
    fireEvent.click(screen.getByText('mario'));
    await waitFor(() => {
      expect(screen.getByText('Profilo')).toBeInTheDocument();
      expect(screen.getByText('Logout')).toBeInTheDocument();
    });
  });

  it('chiude il dropdown al secondo click', async () => {
    renderNavBar();
    const btn = screen.getByText('mario');
    fireEvent.click(btn);
    await waitFor(() => expect(screen.getByText('Profilo')).toBeInTheDocument());
    fireEvent.click(btn);
    await waitFor(() => expect(screen.queryByText('Profilo')).not.toBeInTheDocument());
  });

  // Copre riga 17: handleClick con target fuori da ref.current → setOpen(false)
  it('chiude il dropdown cliccando fuori', async () => {
    renderNavBar();
    fireEvent.click(screen.getByText('mario'));
    await waitFor(() => expect(screen.getByText('Profilo')).toBeInTheDocument());
    fireEvent.mouseDown(document.body);
    await waitFor(() => expect(screen.queryByText('Profilo')).not.toBeInTheDocument());
  });

  // Copre riga 17 branch falso: mouseDown dentro il componente non chiude il dropdown
  it('NON chiude il dropdown cliccando dentro la navbar', async () => {
    renderNavBar();
    fireEvent.click(screen.getByText('mario'));
    await waitFor(() => expect(screen.getByText('Profilo')).toBeInTheDocument());
    // Click dentro il componente (sul brand) → il dropdown rimane aperto
    fireEvent.mouseDown(screen.getByText(/smartorder/i));
    await waitFor(() => expect(screen.getByText('Profilo')).toBeInTheDocument());
  });

  it('mostra la sezione "Account" con lo username nel dropdown', async () => {
    renderNavBar();
    fireEvent.click(screen.getByText('mario'));
    await waitFor(() => {
      expect(screen.getByText('Account')).toBeInTheDocument();
    });
  });

  // Copre riga 62: branch `username || '?'` nel dropdown con username null
  it('mostra "?" nell\'header del dropdown quando username è null', async () => {
    renderNavBar({ username: undefined });
    fireEvent.click(screen.getAllByText('?')[0]);
    await waitFor(() => expect(screen.getByText('Account')).toBeInTheDocument());
    // Nel dropdown ci sono due "?": avatar header + testo header
    const qMarks = screen.getAllByText('?');
    expect(qMarks.length).toBeGreaterThanOrEqual(2);
  });
});

// Azioni
describe('NavBar – azioni', () => {
  it('chiama onProfile e chiude il dropdown al click su "Profilo"', async () => {
    const onProfile = vi.fn();
    renderNavBar({ onProfile });
    fireEvent.click(screen.getByText('mario'));
    await waitFor(() => expect(screen.getByText('Profilo')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Profilo'));
    expect(onProfile).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByText('Profilo')).not.toBeInTheDocument());
  });

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

// Username edge case
describe('NavBar – edge case username', () => {
  it('mostra correttamente username con caratteri non ASCII', () => {
    renderNavBar({ username: 'àlex' });
    expect(screen.getAllByText('àlex').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('À')).toBeInTheDocument();
  });
});