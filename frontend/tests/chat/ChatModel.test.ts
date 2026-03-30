import { describe, it, expect, vi, afterEach } from 'vitest';
import { ChatModel } from '../../src/chat/ChatModel';

function mockFetch(status: number, body: unknown): ReturnType<typeof vi.spyOn> {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })
  );
}

function mockFetchReject(error: unknown): ReturnType<typeof vi.spyOn> {
  return vi.spyOn(globalThis, 'fetch').mockRejectedValue(error);
}

function mock204(): ReturnType<typeof vi.spyOn> {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response(null, { status: 204 })
  );
}

afterEach(() => vi.restoreAllMocks());

describe('ChatModel.getMe', () => {
  it('ritorna username in caso di successo', async () => {
    mockFetch(200, { username: 'mario' });
    const result = await ChatModel.getMe();
    expect(result.username).toBe('mario');
  });

  it('chiama /auth/me con credentials include', async () => {
    const spy = mockFetch(200, { username: 'mario' });
    await ChatModel.getMe();
    const [url, options] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/auth/me');
    expect(options.credentials).toBe('include');
  });

  it('lancia un errore HTTP in caso di risposta non ok', async () => {
    mockFetch(401, { detail: 'Non autenticato' });
    await expect(ChatModel.getMe()).rejects.toThrow('Non autenticato');
  });

  it('lancia un errore generico se non c\'è detail', async () => {
    mockFetch(500, {});
    await expect(ChatModel.getMe()).rejects.toThrow('HTTP 500');
  });
});

// Logout
describe('ChatModel.logout', () => {
  it('chiama /auth/logout con POST e credentials include', async () => {
    const spy = mock204();
    await ChatModel.logout();
    const [url, options] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/auth/logout');
    expect(options.method).toBe('POST');
    expect(options.credentials).toBe('include');
  });

  it('non lancia con risposta 204', async () => {
    mock204();
    await expect(ChatModel.logout()).resolves.toBeUndefined();
  });

  it('lancia un errore in caso di risposta non ok', async () => {
    mockFetch(500, { detail: 'Errore interno' });
    await expect(ChatModel.logout()).rejects.toThrow('Errore interno');
  });
});

// getConversations
describe('ChatModel.getConversations', () => {
  const conversations = [
    { id_conv: 1, username: 'mario', titolo: 'Conv 1' },
    { id_conv: 2, username: 'mario', titolo: 'Conv 2' },
  ];

  it('ritorna le conversazioni dell\'utente', async () => {
    mockFetch(200, conversations);
    const result = await ChatModel.getConversations('mario');
    expect(result).toHaveLength(2);
    expect(result[0].titolo).toBe('Conv 1');
  });

  it('chiama /conversations/:username con credentials include', async () => {
    const spy = mockFetch(200, conversations);
    await ChatModel.getConversations('mario');
    const [url, options] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/conversations/mario');
    expect(options.credentials).toBe('include');
  });

  it('lancia errore in caso di risposta non ok', async () => {
    mockFetch(403, { detail: 'Vietato' });
    await expect(ChatModel.getConversations('mario')).rejects.toThrow('Vietato');
  });
});

// createConversation 
describe('ChatModel.createConversation', () => {
  const created = { id_conv: 10, username: 'mario', titolo: 'Nuova Conv' };

  it('ritorna la nuova conversazione creata', async () => {
    mockFetch(200, created);
    const result = await ChatModel.createConversation('mario', 'Nuova Conv');
    expect(result.id_conv).toBe(10);
    expect(result.titolo).toBe('Nuova Conv');
  });

  it('chiama /conversations/:username con POST e body corretto', async () => {
    const spy = mockFetch(200, created);
    await ChatModel.createConversation('mario', 'Nuova Conv');
    const [url, options] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/conversations/mario');
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body as string)).toMatchObject({ titolo: 'Nuova Conv' });
  });

  it('lancia errore in caso di risposta non ok', async () => {
    mockFetch(400, { detail: 'Titolo non valido' });
    await expect(ChatModel.createConversation('mario', '')).rejects.toThrow('Titolo non valido');
  });
});

// renameConversation 
describe('ChatModel.renameConversation', () => {
  const renamed = { id_conv: 5, username: 'mario', titolo: 'Nuovo Titolo' };

  it('ritorna la conversazione rinominata', async () => {
    mockFetch(200, renamed);
    const result = await ChatModel.renameConversation(5, 'Nuovo Titolo');
    expect(result.titolo).toBe('Nuovo Titolo');
  });

  it('chiama /conversations/:id con PATCH e body corretto', async () => {
    const spy = mockFetch(200, renamed);
    await ChatModel.renameConversation(5, 'Nuovo Titolo');
    const [url, options] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/conversations/5');
    expect(options.method).toBe('PATCH');
    expect(JSON.parse(options.body as string)).toMatchObject({ titolo: 'Nuovo Titolo' });
  });

  it('lancia errore se la conversazione non esiste', async () => {
    mockFetch(404, { detail: 'Conversazione non trovata' });
    await expect(ChatModel.renameConversation(999, 'x')).rejects.toThrow('Conversazione non trovata');
  });
});

// deleteConversation 
describe('ChatModel.deleteConversation', () => {
  it('non lancia con risposta 204', async () => {
    mock204();
    await expect(ChatModel.deleteConversation(5)).resolves.toBeUndefined();
  });

  it('chiama /conversations/:id con DELETE', async () => {
    const spy = mock204();
    await ChatModel.deleteConversation(5);
    const [url, options] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/conversations/5');
    expect(options.method).toBe('DELETE');
  });

  it('lancia errore in caso di risposta non ok', async () => {
    mockFetch(404, { detail: 'Non trovata' });
    await expect(ChatModel.deleteConversation(999)).rejects.toThrow('Non trovata');
  });
});

// getMessages
describe('ChatModel.getMessages', () => {
  const rawResponse = {
    id_conv: 3,
    messages: [
      { id_message: 1, sender: 'Utente',  content: 'Ciao' },
      { id_message: 2, sender: 'Chatbot', content: 'Come posso aiutarti?' },
    ],
  };

  it('mappa correttamente i campi raw nei campi di dominio', async () => {
    mockFetch(200, rawResponse);
    const result = await ChatModel.getMessages(3);
    expect(result.id_conv).toBe(3);
    expect(result.messages[0]).toMatchObject({
      id_messaggio: 1,
      mittente: 'Utente',
      contenuto: 'Ciao',
    });
    expect(result.messages[1]).toMatchObject({
      id_messaggio: 2,
      mittente: 'Chatbot',
      contenuto: 'Come posso aiutarti?',
    });
  });

  it('chiama /chat/:id/all con credentials include', async () => {
    const spy = mockFetch(200, rawResponse);
    await ChatModel.getMessages(3);
    const [url, options] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/chat/3/all');
    expect(options.credentials).toBe('include');
  });

  it('ritorna array vuoto di messaggi se la conversazione è nuova', async () => {
    mockFetch(200, { id_conv: 3, messages: [] });
    const result = await ChatModel.getMessages(3);
    expect(result.messages).toHaveLength(0);
  });

  it('lancia errore in caso di risposta non ok', async () => {
    mockFetch(404, { detail: 'Conversazione non trovata' });
    await expect(ChatModel.getMessages(999)).rejects.toThrow('Conversazione non trovata');
  });
});

// sendMessage
describe('ChatModel.sendMessage', () => {
  const rawResponse = {
    id_conv: 3,
    message: { id_message: 10, sender: 'Chatbot', content: 'Risposta del bot' },
  };

  it('mappa correttamente il messaggio di risposta', async () => {
    mockFetch(200, rawResponse);
    const result = await ChatModel.sendMessage(3, 'Ciao bot');
    expect(result.id_conv).toBe(3);
    expect(result.message).toMatchObject({
      id_messaggio: 10,
      mittente: 'Chatbot',
      contenuto: 'Risposta del bot',
    });
  });

  it('chiama /chat/:id con POST e body corretto', async () => {
    const spy = mockFetch(200, rawResponse);
    await ChatModel.sendMessage(3, 'Ciao bot');
    const [url, options] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/chat/3');
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body as string)).toMatchObject({ content: 'Ciao bot' });
  });

  it('lancia errore in caso di risposta non ok', async () => {
    mockFetch(500, { detail: 'Errore interno' });
    await expect(ChatModel.sendMessage(3, 'test')).rejects.toThrow('Errore interno');
  });

  it('lancia errore di rete se fetch fallisce', async () => {
    mockFetchReject(new TypeError('Failed to fetch'));
    await expect(ChatModel.sendMessage(3, 'test')).rejects.toThrow('Failed to fetch');
  });
});

// getCart
describe('ChatModel.getCart', () => {
  const cartResponse = {
    username: 'mario',
    products: [
      { prod_id: 'P001', name: 'Latte', price: 1.5, measure_unit: 1, qty: 2 },
    ],
  };

  it('ritorna il carrello dell\'utente', async () => {
    mockFetch(200, cartResponse);
    const result = await ChatModel.getCart('mario');
    expect(result.username).toBe('mario');
    expect(result.products).toHaveLength(1);
    expect(result.products[0].name).toBe('Latte');
  });

  it('chiama /cart/:username con credentials include', async () => {
    const spy = mockFetch(200, cartResponse);
    await ChatModel.getCart('mario');
    const [url, options] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/cart/mario');
    expect(options.credentials).toBe('include');
  });

  it('lancia errore in caso di risposta non ok', async () => {
    mockFetch(403, { detail: 'Non autorizzato' });
    await expect(ChatModel.getCart('mario')).rejects.toThrow('Non autorizzato');
  });
});

// removeFromCart
describe('ChatModel.removeFromCart', () => {
  it('non lancia con risposta 204', async () => {
    mock204();
    await expect(ChatModel.removeFromCart('mario', 'P001')).resolves.toBeUndefined();
  });

  it('chiama /cart/:username con DELETE e prod_id nel body', async () => {
    const spy = mock204();
    await ChatModel.removeFromCart('mario', 'P001');
    const [url, options] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/cart/mario');
    expect(options.method).toBe('DELETE');
    expect(JSON.parse(options.body as string)).toMatchObject({ prod_id: 'P001' });
  });

  it('lancia errore in caso di risposta non ok', async () => {
    mockFetch(404, { detail: 'Prodotto non trovato' });
    await expect(ChatModel.removeFromCart('mario', 'P999')).rejects.toThrow('Prodotto non trovato');
  });
});
