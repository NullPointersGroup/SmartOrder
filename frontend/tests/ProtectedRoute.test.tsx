import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProtectedRoute } from '../src/ProtectedRoute';
import { useAuthStore } from '../src/auth/authStore';

function renderProtectedRoute(children: React.ReactNode = <div>Contenuto protetto</div>) {
  return render(
    <MemoryRouter>
      <ProtectedRoute>{children}</ProtectedRoute>
    </MemoryRouter>
  );
}

describe('ProtectedRoute', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    useAuthStore.setState({ username: null, isAuthenticated: false, admin: null, loggedOut: false });
  });

  //TU-F_03
  it('renderizza i children se isAuthenticated=true', () => {
    useAuthStore.setState({ isAuthenticated: true });
    renderProtectedRoute();
    expect(screen.getByText('Contenuto protetto')).toBeInTheDocument();
  });

  //TU-F_04
  it('reindirizza a /unauthorized se non autenticato e loggedOut=false', () => {
    useAuthStore.setState({ isAuthenticated: false, loggedOut: false });
    renderProtectedRoute();
    expect(screen.queryByText('Contenuto protetto')).not.toBeInTheDocument();
  });

  //TU-F_05
  it('reindirizza a / se non autenticato e loggedOut=true', () => {
    useAuthStore.setState({ isAuthenticated: false, loggedOut: true });
    renderProtectedRoute();
    expect(screen.queryByText('Contenuto protetto')).not.toBeInTheDocument();
  });

  //TU-F_06
  it('non mostra i children se isAuthenticated=false', () => {
    useAuthStore.setState({ isAuthenticated: false });
    renderProtectedRoute(<div>Segreto</div>);
    expect(screen.queryByText('Segreto')).not.toBeInTheDocument();
  });

  //TU-F_07
  it('renderizza children diversi se autenticato', () => {
    useAuthStore.setState({ isAuthenticated: true });
    renderProtectedRoute(<span>Dashboard</span>);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  //TU-F_08
  it('reindirizza effettivamente a /unauthorized', () => {
    useAuthStore.setState({ isAuthenticated: false, loggedOut: false });

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <ProtectedRoute>
          <div>Protetto</div>
        </ProtectedRoute>
        <div>Pagina Unauthorized</div>
      </MemoryRouter>
    );

    expect(screen.queryByText('Protetto')).not.toBeInTheDocument();
    expect(screen.getByText('Pagina Unauthorized')).toBeInTheDocument();
  });

  //TU-F_09
  it('reindirizza effettivamente a / quando loggedOut=true', () => {
    useAuthStore.setState({ isAuthenticated: false, loggedOut: true });

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <ProtectedRoute>
          <div>Protetto</div>
        </ProtectedRoute>
        <div>Home</div>
      </MemoryRouter>
    );

    expect(screen.queryByText('Protetto')).not.toBeInTheDocument();
    expect(screen.getByText('Home')).toBeInTheDocument();
  });
});