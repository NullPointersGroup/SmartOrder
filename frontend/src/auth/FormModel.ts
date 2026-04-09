export interface FieldConfig {
  key: string;
  label: string;
  type: 'text' | 'email' | 'password';
  placeholder?: string;
  autoComplete?: string;
}

export interface SubmitResult {
  ok: boolean;
  errors: string[];
  token?: string;
}

export abstract class FormModel {
  abstract readonly fields: FieldConfig[];
  abstract submit(values: Record<string, string>): Promise<SubmitResult>;

  protected static readonly USERNAME_REGEX: RegExp = /^\w{4,24}$/;
  protected static readonly PASSWORD_REGEX: RegExp = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=[\]{};:'",.<>/?\\|`~])[A-Za-z\d!@#$%^&*()_\-+=[\]{};:'",.<>/?\\|`~]{8,24}$/;

  validate(values: Record<string, string>): Record<string, string> {
    /**
     * @brief se un campo è vuoto chiede l'inserimento obbligatorio
     */
    const fieldErrors: Record<string, string> = {};
    for (const field of this.fields) {
      if (!values[field.key]?.trim()) {
        fieldErrors[field.key] = `Il campo ${field.label} è obbligatorio`;
      }
    }
    return fieldErrors;
  }

  validateField(key: string, value: string, currentValues: Record<string, string> = {}): string {
    const allValues = Object.fromEntries(this.fields.map(f => [f.key, '']));
    const errors = this.validate({ ...allValues, ...currentValues, [key]: value });
    return errors[key] ?? '';
  }
}

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