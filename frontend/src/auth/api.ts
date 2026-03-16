const API_BASE = 'http://localhost:8000';

export interface User {
  username: string;
  password: string;
}

export interface AuthResponse {
  ok: boolean;
  errors: string[];
}

async function authFetch(endpoint: string, body: object): Promise<AuthResponse> {
  /**
   * @brief si collega agli endpoint di FastAPI
   * @param endpoint: il nome dell'endpoint
   * @param body: quello che ci si aspetta di ricevere
   * @return la risposta di autenticazione
   */
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  return response.json().catch(() => ({ ok: false, errors: [`Errore ${response.status}`] }));
}

export async function login(user: User): Promise<AuthResponse> {
  return authFetch('/auth/login', user);
}

export async function register(user: User & { email: string; confirmPwd: string }): Promise<AuthResponse> {
  return authFetch('/auth/register', user);
}