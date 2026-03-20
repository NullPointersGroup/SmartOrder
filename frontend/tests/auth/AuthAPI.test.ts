import { describe, it, expect, vi, afterEach } from 'vitest';
import { login, register, getUsernameFromToken } from '../../src/auth/AuthAPI';
import type { LoginDto, RegisterDto } from '../../src/auth/AuthAPI';

function makeJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body   = btoa(JSON.stringify(payload));
  return `${header}.${body}.fakesignature`;
}

function mockFetch(status: number, body: unknown): ReturnType<typeof vi.spyOn> {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })
  );
}

function mockFetchReject(error: Error): ReturnType<typeof vi.spyOn> {
  return vi.spyOn(globalThis, 'fetch').mockRejectedValue(error);
}

describe('getUsernameFromToken', () => {
  it('estrae sub dal payload JWT', () => {
    expect(getUsernameFromToken(makeJwt({ sub: 'mario' }))).toBe('mario');
  });

  it('lancia errore con token malformato', () => {
    expect(() => getUsernameFromToken('tokenInvalido')).toThrow();
  });
});

describe('login', () => {
  afterEach(() => vi.restoreAllMocks());

  const dto: LoginDto = { username: 'mario', password: 'Password1!' };

  it('response.ok=true: restituisce dati con token', async () => {
    const token = makeJwt({ sub: 'mario' });
    mockFetch(200, { ok: true, errors: [], token });
    const result = await login(dto);
    expect(result.ok).toBe(true);
    expect(result.token).toBe(token);
  });

  it('chiama fetch con POST su /auth/login e body corretto', async () => {
    const spy = mockFetch(200, { ok: true, errors: [], token: 'tok' });
    await login(dto);
    const [url, options] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/auth/login');
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body as string)).toMatchObject(dto);
  });

  it('response.ok=false con detail: restituisce detail', async () => {
    mockFetch(401, { detail: { ok: false, errors: ['Username o password errati'] } });
    const result = await login(dto);
    expect(result.ok).toBe(false);
    expect(result.errors).toContain('Username o password errati');
  });

  it('response.ok=false senza detail: restituisce errore generico con status', async () => {
    mockFetch(500, {});
    const result = await login(dto);
    expect(result.ok).toBe(false);
    expect(result.errors[0]).toMatch(/errore 500/i);
  });

  it('response.ok=false con detail null: restituisce errore generico', async () => {
    mockFetch(503, { detail: null });
    const result = await login(dto);
    expect(result.ok).toBe(false);
    expect(result.errors[0]).toMatch(/errore 503/i);
  });

  it('fetch lancia eccezione: restituisce Errore di rete', async () => {
    mockFetchReject(new TypeError('Failed to fetch'));
    const result = await login(dto);
    expect(result.ok).toBe(false);
    expect(result.errors).toContain('Errore di rete');
  });
});

describe('register', () => {
  afterEach(() => vi.restoreAllMocks());

  const dto: RegisterDto = {
    username: 'mario', email: 'mario@example.com',
    password: 'Password1!', confirmPwd: 'Password1!',
  };

  it('response.ok=true: restituisce token', async () => {
    const token = makeJwt({ sub: 'mario' });
    mockFetch(200, { ok: true, errors: [], token });
    const result = await register(dto);
    expect(result.ok).toBe(true);
    expect(result.token).toBe(token);
  });

  it('chiama /auth/register con payload completo', async () => {
    const spy = mockFetch(200, { ok: true, errors: [], token: 'tok' });
    await register(dto);
    const [url, options] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/auth/register');
    expect(JSON.parse(options.body as string)).toMatchObject(dto);
  });

  it('409 con detail: restituisce errore dal server', async () => {
    mockFetch(409, { detail: { ok: false, errors: ['Username già esistente'] } });
    const result = await register(dto);
    expect(result.ok).toBe(false);
    expect(result.errors).toContain('Username già esistente');
  });

  it('500 senza detail: restituisce errore generico', async () => {
    mockFetch(500, {});
    const result = await register(dto);
    expect(result.ok).toBe(false);
    expect(result.errors[0]).toMatch(/errore 500/i);
  });

  it('fetch lancia eccezione: restituisce Errore di rete', async () => {
    mockFetchReject(new TypeError('Failed to fetch'));
    const result = await register(dto);
    expect(result.ok).toBe(false);
    expect(result.errors).toContain('Errore di rete');
  });

  it('nessun token in caso di errore', async () => {
    mockFetch(400, { detail: { ok: false, errors: ['Errore'] } });
    const result = await register(dto);
    expect(result.token).toBeUndefined();
  });
});