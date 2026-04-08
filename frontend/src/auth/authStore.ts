import { create } from 'zustand';

interface AuthState {
  username:        string | null;
  isAuthenticated: boolean;
  admin:           boolean | null;
  loggedOut:       boolean;
  setAuth:         (username: string, admin: boolean) => void;
  clearAuth:       () => void;
  initAuth:        () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  username:        null,
  isAuthenticated: false,
  admin:           null,
  loggedOut:       false,
  setAuth:         (username, admin) => set({ username, admin, isAuthenticated: true }),
  clearAuth:       () => set({ username: null, admin: null, isAuthenticated: false, loggedOut: true }),
  initAuth:        async () => {
    try {
      const res = await fetch('/api/auth/saveInStore', { credentials: 'include' });
      if (!res.ok) throw new Error("Errore autenticazione");
      const data = await res.json();
      set({ username: data.username, admin: data.admin, isAuthenticated: true, loggedOut: false });
    } catch {
      set({ username: null, admin: null, isAuthenticated: false });
    }
  },
}));