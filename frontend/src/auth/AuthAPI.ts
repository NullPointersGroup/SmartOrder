const API_BASE = import.meta.env.VITE_API_BASE_URL;

export interface User {
  username: string;
  email: string;
}

export interface LoginDto {
  username: string;
  password: string;
}

export interface RegisterDto {
  username: string;
  email: string;
  password: string;
  confirmPwd: string;
}

export interface AuthResponse {
  ok: boolean;
  errors: string[];
  token?: string;
}

async function authFetch(endpoint: string, body: object): Promise<AuthResponse> {
  /**
   * @brief Si collega agli endpoint di FastAPI
   * @param endpoint string Il nome dell'endpoint
   * @param body object Il payload della richiesta
   * @return Promise~AuthResponse~ La risposta di autenticazione
   */
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return data.detail ?? { ok: false, errors: [`Errore ${response.status}`] };
    }

    return data;
  } catch {
    return { ok: false, errors: ['Errore di rete'] };
  }
}

export function getUsernameFromToken(token: string): string {
  /**
   * @brief restituisce lo username dal token di autenticazione
   * @return lo username
   */
  const payload = JSON.parse(atob(token.split('.')[1]));
  return payload.sub;
}

/* Fanno una chiamata agli endpoint */

export async function login(dto: LoginDto): Promise<AuthResponse> {
  return authFetch('/auth/login', dto);
}

export async function register(dto: RegisterDto): Promise<AuthResponse> {
  return authFetch('/auth/register', dto);
}