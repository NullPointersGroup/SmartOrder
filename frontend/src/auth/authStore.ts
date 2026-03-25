import { create } from 'zustand';

interface AuthState {
  token: string;
  username: string;
  setAuth: (token: string, username: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: "",
  username: "",
  setAuth: (token, username) => set({ token, username }),
  clearAuth: () => set({ token: "", username: "" }),
}));