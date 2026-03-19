import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../../src/auth/authStore';


function resetStore(): void {
  useAuthStore.setState({
    token:           null,
    username:        null,
    isAuthenticated: false,
  });
}



describe('authStore – stato iniziale', () => {
  beforeEach(resetStore);

  it('token è null allo start', () => {
    expect(useAuthStore.getState().token).toBeNull();
  });

  it('username è null allo start', () => {
    expect(useAuthStore.getState().username).toBeNull();
  });

  it('isAuthenticated è false allo start', () => {
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});



describe('authStore – setAuth', () => {
  beforeEach(resetStore);

  it('imposta il token correttamente', () => {
    useAuthStore.getState().setAuth('my-jwt-token', 'mario');
    expect(useAuthStore.getState().token).toBe('my-jwt-token');
  });

  it('imposta lo username correttamente', () => {
    useAuthStore.getState().setAuth('tok', 'mario_rossi');
    expect(useAuthStore.getState().username).toBe('mario_rossi');
  });

  it('porta isAuthenticated a true', () => {
    useAuthStore.getState().setAuth('tok', 'mario');
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it('sovrascrive token e username se chiamato una seconda volta (re-login)', () => {
    useAuthStore.getState().setAuth('vecchio-token', 'mario');
    useAuthStore.getState().setAuth('nuovo-token', 'luigi');
    expect(useAuthStore.getState().token).toBe('nuovo-token');
    expect(useAuthStore.getState().username).toBe('luigi');
  });

  it('accetta username con caratteri speciali', () => {
    useAuthStore.getState().setAuth('tok', 'user@example.com');
    expect(useAuthStore.getState().username).toBe('user@example.com');
  });

  it('accetta token JWT lungo', () => {
    const longToken = 'a'.repeat(500);
    useAuthStore.getState().setAuth(longToken, 'user');
    expect(useAuthStore.getState().token).toBe(longToken);
  });
});



describe('authStore – clearAuth', () => {
  beforeEach(() => {
    resetStore();
    useAuthStore.getState().setAuth('tok', 'mario');
  });

  it('azzera il token (RF-OB_31)', () => {
    useAuthStore.getState().clearAuth();
    expect(useAuthStore.getState().token).toBeNull();
  });

  it('azzera lo username', () => {
    useAuthStore.getState().clearAuth();
    expect(useAuthStore.getState().username).toBeNull();
  });

  it('porta isAuthenticated a false (RF-OB_29, RF-OB_31)', () => {
    useAuthStore.getState().clearAuth();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('è idempotente: chiamare clearAuth più volte non causa errori', () => {
    useAuthStore.getState().clearAuth();
    useAuthStore.getState().clearAuth();
    expect(useAuthStore.getState().token).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('clearAuth su store già non autenticato non causa errori', () => {
    resetStore();
    expect(() => useAuthStore.getState().clearAuth()).not.toThrow();
  });
});



describe('authStore – ciclo completo autenticazione/logout', () => {
  beforeEach(resetStore);

  it('dopo setAuth + clearAuth lo stato torna come quello iniziale', () => {
    useAuthStore.getState().setAuth('tok', 'mario');
    useAuthStore.getState().clearAuth();

    const state = useAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.username).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('è possibile eseguire login dopo logout (setAuth dopo clearAuth)', () => {
    useAuthStore.getState().setAuth('tok1', 'mario');
    useAuthStore.getState().clearAuth();
    useAuthStore.getState().setAuth('tok2', 'luigi');

    expect(useAuthStore.getState().token).toBe('tok2');
    expect(useAuthStore.getState().username).toBe('luigi');
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });
});
