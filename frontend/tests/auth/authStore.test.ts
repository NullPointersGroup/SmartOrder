import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../../src/auth/authStore';

function reset(): void {
  useAuthStore.setState({ username: null, isAuthenticated: false });
}

describe('authStore – stato iniziale', () => {
  beforeEach(reset);

  it('username è null', () => expect(useAuthStore.getState().username).toBeNull());
  it('isAuthenticated è false', () => expect(useAuthStore.getState().isAuthenticated).toBe(false));
});

describe('authStore – setAuth', () => {
  beforeEach(reset);

  it('imposta token, username e isAuthenticated=true', () => {
    useAuthStore.getState().setAuth('mario');
    const { username, isAuthenticated } = useAuthStore.getState();
    expect(username).toBe('mario');
    expect(isAuthenticated).toBe(true);
  });

  it('sovrascrive un setAuth precedente', () => {
    useAuthStore.getState().setAuth('mario');
    useAuthStore.getState().setAuth('luigi');
    expect(useAuthStore.getState().username).toBe('luigi');
  });
});

describe('authStore – clearAuth', () => {
  beforeEach(() => {
    reset();
    useAuthStore.getState().setAuth('mario');
  });

  it('azzera token, username e isAuthenticated (RF-OB_29, RF-OB_31)', () => {
    useAuthStore.getState().clearAuth();
    const { username, isAuthenticated } = useAuthStore.getState();
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
    useAuthStore.getState().setAuth('mario');
    useAuthStore.getState().clearAuth();
    useAuthStore.getState().setAuth('luigi');
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });
});