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
  it('estrae il campo "sub" dal payload del JWT', () => {
    const token = makeJwt({ sub: 'mario_rossi', exp: 9999999999 });
    expect(getUsernameFromToken(token)).toBe('mario_rossi');
  });

  it('restituisce la stringa corretta con username contenente caratteri speciali', () => {
    const token = makeJwt({ sub: 'user@example.com' });
    expect(getUsernameFromToken(token)).toBe('user@example.com');
  });

  it('lancia un errore se il token non ha tre parti', () => {
    expect(() => getUsernameFromToken('tokenInvalido')).toThrow();
  });

  it('lancia un errore se il payload non è base64 valido', () => {
    expect(() => getUsernameFromToken('a.!!!.c')).toThrow();
  });
});


describe('login', () => {
  afterEach(() => vi.restoreAllMocks());

  const validDto: LoginDto = { username: 'mario_rossi', password: 'Password1!' };

  it('restituisce ok:true e token in caso di login corretto', async () => {
    const token = makeJwt({ sub: 'mario_rossi' });
    mockFetch(200, { ok: true, errors: [], token });

    const result = await login(validDto);

    expect(result.ok).toBe(true);
    expect(result.token).toBe(token);
    expect(result.errors).toHaveLength(0);
  });

  it('chiama fetch con metodo POST e Content-Type JSON', async () => {
    const token = makeJwt({ sub: 'mario_rossi' });
    const spy = mockFetch(200, { ok: true, errors: [], token });

    await login(validDto);

    const [url, options] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/auth/login');
    expect(options.method).toBe('POST');
    expect(options.headers).toMatchObject({ 'Content-Type': 'application/json' });
  });

  it('invia username e password nel body', async () => {
    const spy = mockFetch(200, { ok: true, errors: [], token: 'tok' });

    await login(validDto);

    const [, options] = spy.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(options.body as string);
    expect(body.username).toBe('mario_rossi');
    expect(body.password).toBe('Password1!');
  });

  it('restituisce ok:false con lista errori se il server risponde 401', async () => {
    mockFetch(401, { detail: { ok: false, errors: ['Username o password errati'] } });

    const result = await login(validDto);

    expect(result.ok).toBe(false);
    expect(result.errors).toContain('Username o password errati');
  });

  it('restituisce ok:false con errore generico se il server risponde 500 senza detail', async () => {
    mockFetch(500, {});

    const result = await login(validDto);

    expect(result.ok).toBe(false);
    expect(result.errors[0]).toMatch(/errore 500/i);
  });

  it('restituisce ok:false con "Errore di rete" se fetch lancia eccezione', async () => {
    mockFetchReject(new Error('Network error'));

    const result = await login(validDto);

    expect(result.ok).toBe(false);
    expect(result.errors).toContain('Errore di rete');
  });

  it('restituisce ok:false se username è stringa vuota', async () => {
    mockFetch(401, { detail: { ok: false, errors: ['Username o password errati'] } });

    const result = await login({ username: '', password: 'Password1!' });

    expect(result.ok).toBe(false);
  });

  it('restituisce ok:false se password è stringa vuota', async () => {
    mockFetch(401, { detail: { ok: false, errors: ['Username o password errati'] } });

    const result = await login({ username: 'mario', password: '' });

    expect(result.ok).toBe(false);
  });
});

describe('register', () => {
  afterEach(() => vi.restoreAllMocks());

  const validDto: RegisterDto = {
    username:   'mario_rossi',
    email:      'mario@example.com',
    password:   'Password1!',
    confirmPwd: 'Password1!',
  };

  it('restituisce ok:true e token in caso di registrazione corretta', async () => {
    const token = makeJwt({ sub: 'mario_rossi' });
    mockFetch(200, { ok: true, errors: [], token });

    const result = await register(validDto);

    expect(result.ok).toBe(true);
    expect(result.token).toBe(token);
  });

  it('chiama /auth/register con il payload completo', async () => {
    const spy = mockFetch(200, { ok: true, errors: [], token: 'tok' });

    await register(validDto);

    const [url, options] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/auth/register');
    const body = JSON.parse(options.body as string);
    expect(body).toMatchObject(validDto);
  });

  it('restituisce ok:false se lo username è già presente (409)', async () => {
    mockFetch(409, { detail: { ok: false, errors: ['Username già esistente'] } });

    const result = await register(validDto);

    expect(result.ok).toBe(false);
    expect(result.errors).toContain('Username già esistente');
  });

  it('restituisce ok:false se la email è già presente (409)', async () => {
    mockFetch(409, { detail: { ok: false, errors: ['Email già presente'] } });

    const result = await register({ ...validDto, username: 'nuovo_user' });

    expect(result.ok).toBe(false);
    expect(result.errors).toContain('Email già presente');
  });

  it('gestisce correttamente timeout / errori di rete', async () => {
    mockFetchReject(new TypeError('Failed to fetch'));

    const result = await register(validDto);

    expect(result.ok).toBe(false);
    expect(result.errors).toContain('Errore di rete');
  });

  it('non include il token nella risposta in caso di errore', async () => {
    mockFetch(400, { detail: { ok: false, errors: ['Dati non validi'] } });

    const result = await register(validDto);

    expect(result.token).toBeUndefined();
  });
});