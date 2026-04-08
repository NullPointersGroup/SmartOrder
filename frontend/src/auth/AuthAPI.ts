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
    const response = await fetch(`${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      credentials: "include"
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

/* Fanno una chiamata agli endpoint */

export async function login(dto: LoginDto): Promise<AuthResponse> {
  return authFetch('/api/auth/login', dto);
}

export async function register(dto: RegisterDto): Promise<AuthResponse> {
  return authFetch('/api/auth/register', dto);
}