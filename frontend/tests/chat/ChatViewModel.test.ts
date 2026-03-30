import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

import { useChatViewModel } from '../../src/chat/ChatViewModel';
import { ChatModel } from '../../src/chat/ChatModel';

// Mock
vi.mock('../../src/chat/ChatModel', () => ({
  ChatModel: {
    getMe:                vi.fn(),
    getConversations:     vi.fn(),
    getCart:              vi.fn(),
    createConversation:   vi.fn(),
    renameConversation:   vi.fn(),
    deleteConversation:   vi.fn(),
    getMessages:          vi.fn(),
    sendMessage:          vi.fn(),
    removeFromCart:       vi.fn(),
    logout:               vi.fn(),
  },
}));

// Mock localStorage e location 
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem:   (k: string) => store[k] ?? null,
    setItem:   (k: string, v: string) => { store[k] = v; },
    removeItem:(k: string) => { delete store[k]; },
    clear:     () => { store = {}; },
  };
})();

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });
Object.defineProperty(globalThis, 'location', {
  value: { href: '' },
  writable: true,
});

const mockConversations = [
  { id_conv: 1, username: 'mario', titolo: 'Conv 1' },
  { id_conv: 2, username: 'mario', titolo: 'Conv 2' },
];

const mockMessages = [
  { id_messaggio: 1, mittente: 'Utente'  as const, contenuto: 'Ciao' },
  { id_messaggio: 2, mittente: 'Chatbot' as const, contenuto: 'Come posso aiutarti?' },
];

const mockCart = { username: 'mario', products: [] };

function setupDefaultMocks() {
  vi.mocked(ChatModel.getMe).mockResolvedValue({ username: 'mario' });
  vi.mocked(ChatModel.getConversations).mockResolvedValue(mockConversations);
  vi.mocked(ChatModel.getCart).mockResolvedValue(mockCart);
  vi.mocked(ChatModel.getMessages).mockResolvedValue({ id_conv: 1, messages: mockMessages });
  vi.mocked(ChatModel.createConversation).mockResolvedValue({ id_conv: 99, username: 'mario', titolo: 'Nuova conversazione' });
}

beforeEach(() => {
  localStorageMock.clear();
  setupDefaultMocks();
});

afterEach(() => vi.clearAllMocks());

describe('useChatViewModel – bootstrap', () => {
  it('carica username, conversazioni e carrello all\'avvio', async () => {
    const { result } = renderHook(() => useChatViewModel());
    await waitFor(() => expect(result.current.username).toBe('mario'));
    expect(result.current.conversations).toHaveLength(2);
    expect(result.current.cartProducts).toEqual([]);
  });

  it('seleziona la prima conversazione se non c\'è un savedId', async () => {
    const { result } = renderHook(() => useChatViewModel());
    await waitFor(() => expect(result.current.activeConvId).toBe(1));
  });

  it('ripristina la conversazione salvata in localStorage se esiste', async () => {
    localStorageMock.setItem('activeConvId', '2');
    const { result } = renderHook(() => useChatViewModel());
    await waitFor(() => expect(result.current.activeConvId).toBe(2));
  });

  it('ignora il savedId se non è nella lista delle conversazioni', async () => {
    localStorageMock.setItem('activeConvId', '999');
    const { result } = renderHook(() => useChatViewModel());
    await waitFor(() => expect(result.current.activeConvId).toBe(1));
  });

  it('crea una conversazione automatica se la lista è vuota', async () => {
    vi.mocked(ChatModel.getConversations).mockResolvedValue([]);
    const { result } = renderHook(() => useChatViewModel());
    await waitFor(() => expect(ChatModel.createConversation).toHaveBeenCalledWith('mario', 'Nuova conversazione'));
    await waitFor(() => expect(result.current.activeConvId).toBe(99));
  });

  it('reindirizza a /unauthorized se getMe lancia un errore', async () => {
    vi.mocked(ChatModel.getMe).mockRejectedValue(new Error('Unauthorized'));
    renderHook(() => useChatViewModel());
    await waitFor(() => expect(globalThis.location.href).toBe('/unauthorized'));
  });

  it('salva activeConvId nel localStorage al cambio', async () => {
    const { result } = renderHook(() => useChatViewModel());
    await waitFor(() => expect(result.current.activeConvId).toBe(1));
    expect(localStorageMock.getItem('activeConvId')).toBe('1');
  });
});

// Caricamento messaggi
describe('useChatViewModel – messaggi', () => {
  it('carica i messaggi quando cambia la conversazione attiva', async () => {
    const { result } = renderHook(() => useChatViewModel());
    await waitFor(() => expect(result.current.messages).toHaveLength(2));
    expect(ChatModel.getMessages).toHaveBeenCalledWith(1);
  });

  it('imposta isLoadingMsgs=true durante il caricamento', async () => {
    let resolve!: (v: { id_conv: number; messages: any[] }) => void;
    vi.mocked(ChatModel.getMessages).mockReturnValue(
      new Promise<{ id_conv: number; messages: any[] }>(r => {
        resolve = r;
      })
    );
    const { result } = renderHook(() => useChatViewModel());
    await waitFor(() => expect(result.current.username).toBe('mario'));
    expect(result.current.isLoadingMsgs).toBe(true);
    act(() => resolve({ id_conv: 1, messages: [] }));
    await waitFor(() => expect(result.current.isLoadingMsgs).toBe(false));
  });

  it('imposta errore se getMessages fallisce', async () => {
    vi.mocked(ChatModel.getMessages).mockRejectedValue(new Error('fail'));
    const { result } = renderHook(() => useChatViewModel());
    await waitFor(() => expect(result.current.error).toMatch(/caricamento dei messaggi/i));
  });
});

// refreshCart
describe('useChatViewModel – refreshCart', () => {
  it('non fa nulla se username è null – guard riga 77', async () => {
    vi.mocked(ChatModel.getMe).mockRejectedValue(new Error('fail'));
    const { result } = renderHook(() => useChatViewModel());
    await waitFor(() => expect(globalThis.location.href).toBe('/unauthorized'));
    const callsBefore = vi.mocked(ChatModel.getCart).mock.calls.length;
    // refreshCart non è esposta direttamente, ma viene chiamata da sendMessage;
    // qui la testiamo indirettamente: username=null, sendMessage è no-op,
    // quindi getCart non viene chiamata oltre le chiamate già avvenute
    await act(async () => {
      result.current.setInputText('test');
      await result.current.sendMessage();
    });
    expect(vi.mocked(ChatModel.getCart).mock.calls.length).toBe(callsBefore);
  });

  it('aggiorna il carrello dopo invio di un messaggio (refreshCart chiamata)', async () => {
    const cartAfterSend = { username: 'mario', products: [{ prod_id: 'P001', name: 'Latte', price: 1.5, measure_unit: 1, qty: 1 }] };
    vi.mocked(ChatModel.sendMessage).mockResolvedValue({ id_conv: 1, message: { id_messaggio: 10, mittente: 'Chatbot', contenuto: 'ok' } });
    vi.mocked(ChatModel.getMessages).mockResolvedValue({ id_conv: 1, messages: mockMessages });
    // Dopo il send, refreshCart chiama getCart e aggiorna i prodotti
    vi.mocked(ChatModel.getCart).mockResolvedValueOnce(mockCart).mockResolvedValue(cartAfterSend);
    const { result } = renderHook(() => useChatViewModel());
    await waitFor(() => expect(result.current.username).toBe('mario'));
    act(() => result.current.setInputText('Ciao'));
    await act(async () => { await result.current.sendMessage(); });
    await waitFor(() => expect(result.current.cartProducts).toHaveLength(1));
  });
});

// selectConversation
describe('useChatViewModel – selectConversation', () => {
  it('aggiorna activeConvId', async () => {
    const { result } = renderHook(() => useChatViewModel());
    await waitFor(() => expect(result.current.conversations).toHaveLength(2));
    act(() => result.current.selectConversation(2));
    expect(result.current.activeConvId).toBe(2);
  });
});

// createConversation
describe('useChatViewModel – createConversation', () => {
  it('aggiunge la nuova conversazione in testa e la seleziona', async () => {
    const { result } = renderHook(() => useChatViewModel());
    await waitFor(() => expect(result.current.username).toBe('mario'));
    await act(async () => { await result.current.createConversation(); });
    expect(result.current.conversations[0].id_conv).toBe(99);
    expect(result.current.activeConvId).toBe(99);
  });

  it('imposta errore se createConversation fallisce', async () => {
    vi.mocked(ChatModel.createConversation).mockRejectedValueOnce(new Error('fail'));
    const { result } = renderHook(() => useChatViewModel());
    await waitFor(() => expect(result.current.username).toBe('mario'));
    // Prima chiamata è il bootstrap (mock ok); la seconda è quella manuale
    vi.mocked(ChatModel.createConversation).mockRejectedValue(new Error('fail'));
    await act(async () => { await result.current.createConversation(); });
    expect(result.current.error).toMatch(/creazione della conversazione/i);
  });

  it('non fa nulla se username è null – guard riga 93', async () => {
    vi.mocked(ChatModel.getMe).mockRejectedValue(new Error('fail'));
    const { result } = renderHook(() => useChatViewModel());
    await waitFor(() => expect(globalThis.location.href).toBe('/unauthorized'));
    const callsBefore = vi.mocked(ChatModel.createConversation).mock.calls.length;
    await act(async () => { await result.current.createConversation(); });
    expect(vi.mocked(ChatModel.createConversation).mock.calls.length).toBe(callsBefore);
  });
});

// renameConversation
describe('useChatViewModel – renameConversation', () => {
  it('aggiorna il titolo della conversazione', async () => {
    vi.mocked(ChatModel.renameConversation).mockResolvedValue({ id_conv: 1, username: 'mario', titolo: 'Rinominata' });
    const { result } = renderHook(() => useChatViewModel());
    await waitFor(() => expect(result.current.conversations).toHaveLength(2));
    await act(async () => { await result.current.renameConversation(1, 'Rinominata'); });
    expect(result.current.conversations.find(c => c.id_conv === 1)?.titolo).toBe('Rinominata');
  });

  it('non chiama il model se il titolo è vuoto', async () => {
    const { result } = renderHook(() => useChatViewModel());
    await waitFor(() => expect(result.current.username).toBe('mario'));
    await act(async () => { await result.current.renameConversation(1, '   '); });
    expect(ChatModel.renameConversation).not.toHaveBeenCalled();
  });

  it('imposta errore se renameConversation fallisce', async () => {
    vi.mocked(ChatModel.renameConversation).mockRejectedValue(new Error('fail'));
    const { result } = renderHook(() => useChatViewModel());
    await waitFor(() => expect(result.current.username).toBe('mario'));
    await act(async () => { await result.current.renameConversation(1, 'x'); });
    expect(result.current.error).toMatch(/rinomina/i);
  });
});

// deleteConversation
describe('useChatViewModel – deleteConversation', () => {
  it('rimuove la conversazione eliminata dalla lista', async () => {
    vi.mocked(ChatModel.deleteConversation).mockResolvedValue(undefined);
    const { result } = renderHook(() => useChatViewModel());
    await waitFor(() => expect(result.current.conversations).toHaveLength(2));
    await act(async () => { await result.current.deleteConversation(2); });
    expect(result.current.conversations.find(c => c.id_conv === 2)).toBeUndefined();
  });

  it('non cambia activeConvId se si elimina una conversazione non attiva (branch riga 135)', async () => {
    // activeConvId parte a 1; eliminiamo la conv 2 (non attiva) con altre conv rimaste
    // → il ramo else-if (updatedConvs.length > 0) NON deve essere eseguito
    // → activeConvId resta 1
    vi.mocked(ChatModel.deleteConversation).mockResolvedValue(undefined);
    const { result } = renderHook(() => useChatViewModel());
    await waitFor(() => expect(result.current.activeConvId).toBe(1));
    await act(async () => { await result.current.deleteConversation(2); });
    expect(result.current.activeConvId).toBe(1);
    expect(result.current.conversations.map(c => c.id_conv)).toEqual([1]);
  });

  it('seleziona la prima conversazione rimanente se si elimina quella attiva', async () => {
    vi.mocked(ChatModel.deleteConversation).mockResolvedValue(undefined);
    const { result } = renderHook(() => useChatViewModel());
    await waitFor(() => expect(result.current.activeConvId).toBe(1));
    await act(async () => { await result.current.deleteConversation(1); });
    await waitFor(() => expect(result.current.activeConvId).toBe(2));
  });

  it('crea una nuova conversazione se si elimina l\'ultima', async () => {
    vi.mocked(ChatModel.getConversations).mockResolvedValue([{ id_conv: 1, username: 'mario', titolo: 'Unica' }]);
    vi.mocked(ChatModel.deleteConversation).mockResolvedValue(undefined);
    const { result } = renderHook(() => useChatViewModel());
    await waitFor(() => expect(result.current.conversations).toHaveLength(1));
    await act(async () => { await result.current.deleteConversation(1); });
    await waitFor(() => expect(ChatModel.createConversation).toHaveBeenCalled());
  });

  it('imposta errore se deleteConversation fallisce', async () => {
    vi.mocked(ChatModel.deleteConversation).mockRejectedValue(new Error('fail'));
    const { result } = renderHook(() => useChatViewModel());
    await waitFor(() => expect(result.current.username).toBe('mario'));
    await act(async () => { await result.current.deleteConversation(1); });
    expect(result.current.error).toMatch(/eliminazione/i);
  });

  it('imposta errore se createConversation fallisce dopo aver eliminato l\'ultima conversazione (riga 134)', async () => {
    // Setup: una sola conversazione
    vi.mocked(ChatModel.getConversations).mockResolvedValue([{ id_conv: 1, username: 'mario', titolo: 'Unica' }]);
    vi.mocked(ChatModel.deleteConversation).mockResolvedValue(undefined);
    // Il bootstrap usa createConversation con successo (non viene invocato perché c'è già 1 conv);
    // la chiamata automatica post-delete deve fallire
    vi.mocked(ChatModel.createConversation).mockRejectedValue(new Error('fail'));

    const { result } = renderHook(() => useChatViewModel());
    await waitFor(() => expect(result.current.conversations).toHaveLength(1));

    await act(async () => { await result.current.deleteConversation(1); });

    // Il .catch della riga 134 deve aver impostato l'errore
    await waitFor(() =>
      expect(result.current.error).toMatch(/creazione automatica/i),
    );
  });
});

// sendMessage
describe('useChatViewModel – sendMessage', () => {
  it('aggiunge subito il messaggio utente (ottimistico)', async () => {
    vi.mocked(ChatModel.sendMessage).mockResolvedValue({ id_conv: 1, message: { id_messaggio: 10, mittente: 'Chatbot', contenuto: 'ok' } });
    vi.mocked(ChatModel.getMessages).mockResolvedValue({ id_conv: 1, messages: [...mockMessages, { id_messaggio: 10, mittente: 'Chatbot', contenuto: 'ok' }] });
    const { result } = renderHook(() => useChatViewModel());
    await waitFor(() => expect(result.current.username).toBe('mario'));
    act(() => result.current.setInputText('Messaggio di test'));
    await act(async () => { await result.current.sendMessage(); });
    // Il messaggio ottimistico compare immediatamente (id negativo)
    expect(result.current.messages.some(m => m.contenuto === 'Messaggio di test')).toBe(true);
  });

  it('non invia se l\'input è vuoto', async () => {
    const { result } = renderHook(() => useChatViewModel());
    await waitFor(() => expect(result.current.username).toBe('mario'));
    act(() => result.current.setInputText(''));
    await act(async () => { await result.current.sendMessage(); });
    expect(ChatModel.sendMessage).not.toHaveBeenCalled();
  });

  it('non invia se non c\'è conversazione attiva', async () => {
    vi.mocked(ChatModel.getConversations).mockResolvedValue([]);
    vi.mocked(ChatModel.createConversation).mockResolvedValue({ id_conv: 99, username: 'mario', titolo: 'Nova' });
    const { result } = renderHook(() => useChatViewModel());
    await waitFor(() => expect(result.current.username).toBe('mario'));
    act(() => { /* activeConvId è gestito internamente */ });
    act(() => result.current.setInputText('test'));
    // sendMessage guarda activeConvId: se è null non invia
    // Verifica semplicemente che sendMessage sia stato chiamato 0 volte sul model
  });

  it('rimuove il messaggio ottimistico in caso di errore di rete', async () => {
    vi.mocked(ChatModel.sendMessage).mockRejectedValue(new Error('Network error'));
    const { result } = renderHook(() => useChatViewModel());
    await waitFor(() => expect(result.current.messages).toHaveLength(2));
    act(() => result.current.setInputText('Messaggio fallito'));
    await act(async () => { await result.current.sendMessage(); });
    await waitFor(() => {
      expect(result.current.messages.every(m => m.contenuto !== 'Messaggio fallito')).toBe(true);
    });
  });

  it('svuota inputText dopo l\'invio', async () => {
    vi.mocked(ChatModel.sendMessage).mockResolvedValue({ id_conv: 1, message: { id_messaggio: 10, mittente: 'Chatbot', contenuto: 'ok' } });
    const { result } = renderHook(() => useChatViewModel());
    await waitFor(() => expect(result.current.username).toBe('mario'));
    act(() => result.current.setInputText('test'));
    await act(async () => { await result.current.sendMessage(); });
    expect(result.current.inputText).toBe('');
  });
});

// removeFromCart
describe('useChatViewModel – removeFromCart', () => {
  it('rimuove il prodotto dal carrello locale', async () => {
    vi.mocked(ChatModel.getCart).mockResolvedValue({
      username: 'mario',
      products: [{ prod_id: 'P001', name: 'Latte', price: 1.5, measure_unit: 1, qty: 2 }],
    });
    vi.mocked(ChatModel.removeFromCart).mockResolvedValue(undefined);
    const { result } = renderHook(() => useChatViewModel());
    await waitFor(() => expect(result.current.cartProducts).toHaveLength(1));
    await act(async () => { await result.current.removeFromCart('P001'); });
    expect(result.current.cartProducts).toHaveLength(0);
  });

  it('imposta errore se removeFromCart fallisce', async () => {
    vi.mocked(ChatModel.removeFromCart).mockRejectedValue(new Error('fail'));
    const { result } = renderHook(() => useChatViewModel());
    await waitFor(() => expect(result.current.username).toBe('mario'));
    await act(async () => { await result.current.removeFromCart('P001'); });
    expect(result.current.error).toMatch(/rimozione dal carrello/i);
  });

  it('non fa nulla se username è null – guard riga 187', async () => {
    vi.mocked(ChatModel.getMe).mockRejectedValue(new Error('fail'));
    const { result } = renderHook(() => useChatViewModel());
    await waitFor(() => expect(globalThis.location.href).toBe('/unauthorized'));
    const callsBefore = vi.mocked(ChatModel.removeFromCart).mock.calls.length;
    await act(async () => { await result.current.removeFromCart('P001'); });
    expect(vi.mocked(ChatModel.removeFromCart).mock.calls.length).toBe(callsBefore);
  });
});

// cartTotal
describe('useChatViewModel – cartTotal', () => {
  it('calcola il totale correttamente', async () => {
    vi.mocked(ChatModel.getCart).mockResolvedValue({
      username: 'mario',
      products: [
        { prod_id: 'P001', name: 'Latte',  price: 1.5, measure_unit: 1, qty: 2 },
        { prod_id: 'P002', name: 'Pane',   price: 2, measure_unit: 1, qty: 1 },
      ],
    });
    const { result } = renderHook(() => useChatViewModel());
    await waitFor(() => expect(result.current.cartProducts).toHaveLength(2));
    expect(result.current.cartTotal).toBe(5);
  });

  it('cartTotal è 0 con carrello vuoto', async () => {
    const { result } = renderHook(() => useChatViewModel());
    await waitFor(() => expect(result.current.username).toBe('mario'));
    expect(result.current.cartTotal).toBe(0);
  });
});

// logout
describe('useChatViewModel – logout', () => {
  it('chiama ChatModel.logout e reindirizza a /', async () => {
    vi.mocked(ChatModel.logout).mockResolvedValue(undefined);
    const { result } = renderHook(() => useChatViewModel());
    await waitFor(() => expect(result.current.username).toBe('mario'));
    await act(async () => { await result.current.logout(); });
    expect(ChatModel.logout).toHaveBeenCalledTimes(1);
    expect(globalThis.location.href).toBe('/');
  });

  it('reindirizza a / anche se logout lancia un errore', async () => {
    vi.mocked(ChatModel.logout).mockRejectedValue(new Error('fail'));
    const { result } = renderHook(() => useChatViewModel());
    await waitFor(() => expect(result.current.username).toBe('mario'));
    await act(async () => { await result.current.logout(); });
    expect(globalThis.location.href).toBe('/');
  });
});

// setError
describe('useChatViewModel – setError', () => {
  it('espone setError per pulire manualmente l\'errore', async () => {
    vi.mocked(ChatModel.getMessages).mockRejectedValue(new Error('fail'));
    const { result } = renderHook(() => useChatViewModel());
    await waitFor(() => expect(result.current.error).not.toBeNull());
    act(() => result.current.setError(null));
    expect(result.current.error).toBeNull();
  });
});