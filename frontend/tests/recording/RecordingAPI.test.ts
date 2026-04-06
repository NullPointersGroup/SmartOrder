import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { trascriviAudio } from '../../src/recording/RecordingAPI';

// ─── Mock fetch globale ───────────────────────────────────────────────────────

const mockFetch = vi.fn();
Object.defineProperty(globalThis, 'fetch', { value: mockFetch, writable: true });

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mockFetchOk(body: unknown) {
  mockFetch.mockResolvedValue({
    ok:   true,
    json: () => Promise.resolve(body),
  });
}

function mockFetchError(status: number, detail?: string) {
  mockFetch.mockResolvedValue({
    ok:     false,
    status,
    json:   () => Promise.resolve(detail ? { detail } : {}),
  });
}

function mockFetchErrorJsonFail(status: number) {
  mockFetch.mockResolvedValue({
    ok:     false,
    status,
    json:   () => Promise.reject(new Error('JSON parse error')),
  });
}

// ─── Fixture ──────────────────────────────────────────────────────────────────

const mockBlob = new Blob(['audio data'], { type: 'audio/webm' });

beforeEach(() => mockFetch.mockReset());
afterEach(() => vi.clearAllMocks());

// ─── trascriviAudio ───────────────────────────────────────────────────────────

describe('trascriviAudio', () => {
  //TU-F_356
  it('chiama POST /recording/trascrivi con credentials=include', async () => {
    mockFetchOk({ testo: 'ciao' });
    await trascriviAudio(mockBlob);

    const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/recording/trascrivi');
    expect(options.method).toBe('POST');
    expect(options.credentials).toBe('include');
  });

  //TU-F_357
  it('invia il blob come campo "file" nel FormData', async () => {
    mockFetchOk({ testo: 'ciao' });
    await trascriviAudio(mockBlob, 'test.webm');

    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(options.body).toBeInstanceOf(FormData);
    const formData = options.body as FormData;
    const file = formData.get('file') as File;
    expect(file).not.toBeNull();
    expect(file.name).toBe('test.webm');
  });

  //TU-F_358
  it('usa "audio.webm" come filename di default', async () => {
    mockFetchOk({ testo: 'ciao' });
    await trascriviAudio(mockBlob);

    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    const formData = options.body as FormData;
    const file = formData.get('file') as File;
    expect(file.name).toBe('audio.webm');
  });

  //TU-F_359
  it('restituisce il campo "testo" dalla risposta JSON in caso di successo', async () => {
    mockFetchOk({ testo: 'ordina due litri di latte' });
    const result = await trascriviAudio(mockBlob);
    expect(result).toBe('ordina due litri di latte');
  });

  //TU-F_360
  it('restituisce una stringa vuota se "testo" è una stringa vuota', async () => {
    mockFetchOk({ testo: '' });
    const result = await trascriviAudio(mockBlob);
    expect(result).toBe('');
  });

  //TU-F_361
  it('lancia errore con il messaggio "detail" dal server se la risposta non è ok', async () => {
    mockFetchError(422, 'Formato audio non supportato');
    await expect(trascriviAudio(mockBlob)).rejects.toThrow('Formato audio non supportato');
  });

  //TU-F_362
  it('lancia errore generico se il body non ha "detail"', async () => {
    mockFetchError(500);
    await expect(trascriviAudio(mockBlob)).rejects.toThrow('Errore nella trascrizione audio');
  });

  //TU-F_363
  it('lancia errore generico se il parsing del body fallisce', async () => {
    mockFetchErrorJsonFail(502);
    await expect(trascriviAudio(mockBlob)).rejects.toThrow('Errore nella trascrizione audio');
  });

  //TU-F_364
  it('lancia errore 401 con detail dal server', async () => {
    mockFetchError(401, 'Non autenticato');
    await expect(trascriviAudio(mockBlob)).rejects.toThrow('Non autenticato');
  });
});
