import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProtectedRoute } from '../src/ProtectedRoute';
import { useAuthStore } from '../src/auth/authStore';

function mockFetch(status: number, body: unknown) {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })
  );
}

function mockFetchReject(error: unknown) {
  return vi.spyOn(globalThis, 'fetch').mockRejectedValue(error);
}

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
    useAuthStore.setState({ username: null, isAuthenticated: false });
  });

  //TU-F_03
  it('mostra il loading durante la verifica', () => {
    mockFetch(200, { username: 'mario' });
    renderProtectedRoute();
    expect(screen.getByText(/verifica in corso/i)).toBeInTheDocument();
  });

  //TU-F_04
  it('renderizza i children se /me risponde ok', async () => {
    mockFetch(200, { username: 'mario' });
    renderProtectedRoute(<div>Contenuto protetto</div>);
    await waitFor(() => {
      expect(screen.getByText('Contenuto protetto')).toBeInTheDocument();
    });
  });

  //TU-F_05
  it('reindirizza a /unauthorized se /me risponde con errore', async () => {
    mockFetch(401, {});
    renderProtectedRoute();
    await waitFor(() => {
      expect(screen.queryByText(/verifica in corso/i)).not.toBeInTheDocument();
    });
    // Navigate redirige — i children non devono essere presenti
    expect(screen.queryByText('Contenuto protetto')).not.toBeInTheDocument();
  });

  //TU-F_06
  it('reindirizza a /unauthorized se fetch lancia eccezione', async () => {
    mockFetchReject(new TypeError('Failed to fetch'));
    renderProtectedRoute();
    await waitFor(() => {
      expect(screen.queryByText(/verifica in corso/i)).not.toBeInTheDocument();
    });
    expect(screen.queryByText('Contenuto protetto')).not.toBeInTheDocument();
  });

  //TU-F_07
  it('chiama setAuth con lo username corretto', async () => {
    mockFetch(200, { username: 'mario' });
    renderProtectedRoute();
    await waitFor(() => {
      expect(useAuthStore.getState().username).toBe('mario');
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
    });
  });

  //TU-F_08
  it('chiama clearAuth in caso di errore', async () => {
    useAuthStore.setState({ username: 'mario', isAuthenticated: true });
    mockFetch(403, {});
    renderProtectedRoute();
    await waitFor(() => {
      expect(useAuthStore.getState().username).toBeNull();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });
  });

  //TU-F_09
  it('chiama /auth/me con credentials include', async () => {
    const spy = mockFetch(200, { username: 'mario' });
    renderProtectedRoute();
    await waitFor(() => screen.queryByText(/verifica in corso/i) === null);
    const [url, options] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/auth/me');
    expect(options.credentials).toBe('include');
  });
});