import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useAuthStore } from '../../src/auth/authStore';

function reset(): void {
  useAuthStore.setState({
    username:        null,
    isAuthenticated: false,
    admin:           null,
    loggedOut:       false,
  });
}

describe('authStore – stato iniziale', () => {
  beforeEach(reset);

  //TU-F_25
  it('username è null', () => expect(useAuthStore.getState().username).toBeNull());
  //TU-F_26
  it('isAuthenticated è false', () => expect(useAuthStore.getState().isAuthenticated).toBe(false));
  it('admin è null', () => expect(useAuthStore.getState().admin).toBeNull());
  it('loggedOut è false', () => expect(useAuthStore.getState().loggedOut).toBe(false));
});

describe('authStore – setAuth', () => {
  beforeEach(reset);

  //TU-F_27
  it('imposta username, admin e isAuthenticated=true', () => {
    useAuthStore.getState().setAuth('mario', false);
    const { username, admin, isAuthenticated } = useAuthStore.getState();
    expect(username).toBe('mario');
    expect(admin).toBe(false);
    expect(isAuthenticated).toBe(true);
  });

  //TU-F_503
  it('imposta admin=true per un amministratore', () => {
    useAuthStore.getState().setAuth('admin', true);
    expect(useAuthStore.getState().admin).toBe(true);
  });

  //TU-F_28
  it('sovrascrive un setAuth precedente', () => {
    useAuthStore.getState().setAuth('mario', false);
    useAuthStore.getState().setAuth('luigi', true);
    const { username, admin } = useAuthStore.getState();
    expect(username).toBe('luigi');
    expect(admin).toBe(true);
  });
});

describe('authStore – clearAuth', () => {
  beforeEach(() => {
    reset();
    useAuthStore.getState().setAuth('mario', false);
  });

  //TU-F_29
  it('azzera username, admin e isAuthenticated; imposta loggedOut=true (RF-OB_29, RF-OB_31)', () => {
    useAuthStore.getState().clearAuth();
    const { username, admin, isAuthenticated, loggedOut } = useAuthStore.getState();
    expect(username).toBeNull();
    expect(admin).toBeNull();
    expect(isAuthenticated).toBe(false);
    expect(loggedOut).toBe(true);
  });

  //TU-F_30
  it('è idempotente', () => {
    useAuthStore.getState().clearAuth();
    expect(() => useAuthStore.getState().clearAuth()).not.toThrow();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});

describe('authStore – ciclo setAuth → clearAuth → setAuth', () => {
  beforeEach(reset);

  //TU-F_31
  it('secondo login dopo logout funziona correttamente', () => {
    useAuthStore.getState().setAuth('mario', false);
    useAuthStore.getState().clearAuth();
    useAuthStore.getState().setAuth('luigi', false);
    const { username, isAuthenticated, loggedOut } = useAuthStore.getState();
    expect(username).toBe('luigi');
    expect(isAuthenticated).toBe(true);
    expect(loggedOut).toBe(false);
  });
});

describe('authStore – initAuth', () => {
  beforeEach(reset);
  afterEach(() => vi.restoreAllMocks());

  it('fetch ok: imposta username, admin, isAuthenticated=true, loggedOut=false', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ username: 'mario', admin: false }),
    }));

    await useAuthStore.getState().initAuth();
    const { username, admin, isAuthenticated, loggedOut } = useAuthStore.getState();
    expect(username).toBe('mario');
    expect(admin).toBe(false);
    expect(isAuthenticated).toBe(true);
    expect(loggedOut).toBe(false);
  });

  it('fetch non ok: azzera lo stato', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));

    await useAuthStore.getState().initAuth();
    const { username, admin, isAuthenticated } = useAuthStore.getState();
    expect(username).toBeNull();
    expect(admin).toBeNull();
    expect(isAuthenticated).toBe(false);
  });

  it('fetch lancia eccezione: azzera lo stato', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')));

    await useAuthStore.getState().initAuth();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});