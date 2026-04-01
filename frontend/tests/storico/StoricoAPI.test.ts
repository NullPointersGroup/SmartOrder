import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import {
  getStoricoCliente,
  getStoricoAdmin,
  duplicaOrdine,
} from '../../src/storico/StoricoAPI';

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

// ─── Fixture risposta ─────────────────────────────────────────────────────────

const mockPageResponse = {
  ordini: [
    {
      codice_ordine: 'ORD-001',
      data:          '2024-03-15T10:30:00',
      prodotti:      [{ nome: 'Latte', quantita: 2 }],
    },
  ],
  pagina_corrente: 1,
  totale_pagine:   4,
};

beforeEach(() => {
  mockFetch.mockReset();
});

afterEach(() => vi.clearAllMocks());

// ─── getStoricoCliente ────────────────────────────────────────────────────────

describe('getStoricoCliente', () => {
  it('chiama il corretto endpoint GET /storico/miei con i parametri di default', async () => {
    mockFetchOk(mockPageResponse);
    await getStoricoCliente();

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain('/storico/miei');
    expect(url).toContain('pagina=1');
    expect(url).toContain('per_pagina=10');
    expect(options.method).toBe('GET');
    expect(options.credentials).toBe('include');
  });

  it('passa pagina e perPagina personalizzati nella querystring', async () => {
    mockFetchOk(mockPageResponse);
    await getStoricoCliente(3, 5);

    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain('pagina=3');
    expect(url).toContain('per_pagina=5');
  });

  it('restituisce il corpo JSON in caso di successo', async () => {
    mockFetchOk(mockPageResponse);
    const result = await getStoricoCliente(1, 10);
    expect(result).toEqual(mockPageResponse);
  });

  it('lancia errore con il messaggio "detail" dal server se la risposta non è ok', async () => {
    mockFetchError(403, 'Non autorizzato');
    await expect(getStoricoCliente()).rejects.toThrow('Non autorizzato');
  });

  it('lancia errore generico "Errore <status>" se il body non ha "detail"', async () => {
    mockFetchError(500);
    await expect(getStoricoCliente()).rejects.toThrow('Errore 500');
  });

  it('lancia "Errore <status>" se il parsing del body fallisce', async () => {
    mockFetchErrorJsonFail(502);
    await expect(getStoricoCliente()).rejects.toThrow('Errore 502');
  });
});

// ─── getStoricoAdmin ──────────────────────────────────────────────────────────

describe('getStoricoAdmin', () => {
  it('chiama il corretto endpoint GET /storico/tutti con i parametri di default', async () => {
    mockFetchOk(mockPageResponse);
    await getStoricoAdmin();

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain('/storico/tutti');
    expect(url).toContain('pagina=1');
    expect(url).toContain('per_pagina=10');
    expect(options.method).toBe('GET');
    expect(options.credentials).toBe('include');
  });

  it('passa pagina e perPagina personalizzati nella querystring', async () => {
    mockFetchOk(mockPageResponse);
    await getStoricoAdmin(2, 20);

    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain('pagina=2');
    expect(url).toContain('per_pagina=20');
  });

  it('restituisce il corpo JSON in caso di successo', async () => {
    mockFetchOk(mockPageResponse);
    const result = await getStoricoAdmin(1, 10);
    expect(result).toEqual(mockPageResponse);
  });

  it('lancia errore con il messaggio "detail" dal server se la risposta non è ok', async () => {
    mockFetchError(401, 'Solo admin');
    await expect(getStoricoAdmin()).rejects.toThrow('Solo admin');
  });

  it('lancia errore generico "Errore <status>" se il body non ha "detail"', async () => {
    mockFetchError(503);
    await expect(getStoricoAdmin()).rejects.toThrow('Errore 503');
  });

  it('lancia "Errore <status>" se il parsing del body fallisce', async () => {
    mockFetchErrorJsonFail(500);
    await expect(getStoricoAdmin()).rejects.toThrow('Errore 500');
  });
});

// ─── duplicaOrdine ────────────────────────────────────────────────────────────

describe('duplicaOrdine', () => {
  it('chiama POST /storico/duplica/{codice} con credentials=include', async () => {
    mockFetchOk({});
    await duplicaOrdine('ORD-001');

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain('/storico/duplica/ORD-001');
    expect(options.method).toBe('POST');
    expect(options.credentials).toBe('include');
  });

  it('codifica correttamente caratteri speciali nel codice ordine', async () => {
    mockFetchOk({});
    await duplicaOrdine('ORD 001/speciale');

    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain(encodeURIComponent('ORD 001/speciale'));
  });

  it('non lancia eccezione se la risposta è ok', async () => {
    mockFetchOk({});
    await expect(duplicaOrdine('ORD-001')).resolves.toBeUndefined();
  });

  it('lancia errore con il messaggio "detail" se la risposta non è ok', async () => {
    mockFetchError(409, 'Ordine già duplicato');
    await expect(duplicaOrdine('ORD-001')).rejects.toThrow('Ordine già duplicato');
  });

  it('lancia "Errore <status>" se il body non ha "detail"', async () => {
    mockFetchError(404);
    await expect(duplicaOrdine('ORD-999')).rejects.toThrow('Errore 404');
  });

  it('lancia "Errore <status>" se il parsing del body fallisce', async () => {
    mockFetchErrorJsonFail(500);
    await expect(duplicaOrdine('ORD-001')).rejects.toThrow('Errore 500');
  });
});
