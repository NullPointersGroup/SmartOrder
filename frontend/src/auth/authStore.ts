import { create } from 'zustand';

interface AuthState {
  username:        string | null;
  isAuthenticated: boolean;
  admin:            string | null;
  setAuth:         (username: string, role: string) => void;
  clearAuth:       () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  username:        null,
  isAuthenticated: false,
  admin:            null,
  setAuth:         (username, admin) => set({ username, admin, isAuthenticated: true }),
  clearAuth:       ()         => set({ username: null, isAuthenticated: false }),
}));