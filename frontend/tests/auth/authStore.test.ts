import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../../src/auth/authStore';

function reset(): void {
  useAuthStore.setState({ token: null, username: null, isAuthenticated: false });
}

describe('authStore – stato iniziale', () => {
  beforeEach(reset);

  it('token è null', () => expect(useAuthStore.getState().token).toBeNull());
  it('username è null', () => expect(useAuthStore.getState().username).toBeNull());
  it('isAuthenticated è false', () => expect(useAuthStore.getState().isAuthenticated).toBe(false));
});

describe('authStore – setAuth', () => {
  beforeEach(reset);

  it('imposta token, username e isAuthenticated=true', () => {
    useAuthStore.getState().setAuth('tok', 'mario');
    const { token, username, isAuthenticated } = useAuthStore.getState();
    expect(token).toBe('tok');
    expect(username).toBe('mario');
    expect(isAuthenticated).toBe(true);
  });

  it('sovrascrive un setAuth precedente', () => {
    useAuthStore.getState().setAuth('tok1', 'mario');
    useAuthStore.getState().setAuth('tok2', 'luigi');
    expect(useAuthStore.getState().token).toBe('tok2');
    expect(useAuthStore.getState().username).toBe('luigi');
  });
});

describe('authStore – clearAuth', () => {
  beforeEach(() => {
    reset();
    useAuthStore.getState().setAuth('tok', 'mario');
  });

  it('azzera token, username e isAuthenticated (RF-OB_29, RF-OB_31)', () => {
    useAuthStore.getState().clearAuth();
    const { token, username, isAuthenticated } = useAuthStore.getState();
    expect(token).toBeNull();
    expect(username).toBeNull();
    expect(isAuthenticated).toBe(false);
  });

  it('è idempotente', () => {
    useAuthStore.getState().clearAuth();
    expect(() => useAuthStore.getState().clearAuth()).not.toThrow();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});

describe('authStore – ciclo setAuth → clearAuth → setAuth', () => {
  beforeEach(reset);

  it('secondo login dopo logout funziona correttamente', () => {
    useAuthStore.getState().setAuth('tok1', 'mario');
    useAuthStore.getState().clearAuth();
    useAuthStore.getState().setAuth('tok2', 'luigi');
    expect(useAuthStore.getState().token).toBe('tok2');
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });
});