const API_BASE = 'http://localhost:8000';

export interface User {
  username: string;
  password: string;
}

export interface AuthResponse {
  ok: boolean;
  errors: string[];
}

export const login = async (user: User): Promise<AuthResponse> => {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(user),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({ errors: [`Errore ${response.status}`] }));
    return data;
  }

  return response.json();
};

export const register = async (user: User & { email: string; confirmPwd: string }): Promise<AuthResponse> => {
  const response = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(user),
  });
  return response.json();
};