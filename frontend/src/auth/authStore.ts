import { create } from 'zustand';

interface AuthState {
  username:        string | null;
  isAuthenticated: boolean;
  setAuth:         (username: string) => void;
  clearAuth:       () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  username:        null,
  isAuthenticated: false,
  setAuth:         (username) => set({ username, isAuthenticated: true }),
  clearAuth:       ()         => set({ username: null, isAuthenticated: false }),
}));