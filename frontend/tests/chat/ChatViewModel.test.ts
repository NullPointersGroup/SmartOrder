import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

import { useChatViewModel } from '../../src/chat/ChatViewModel';
import { ChatModel } from '../../src/chat/ChatModel';
import { trascriviAudio } from '../../src/recording/RecordingAPI';

// ── Mock ChatModel ──────────────────────────────────────────────────────────
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
    sendOrder:            vi.fn(),   // ← necessario per invioOrdine
  },
}));

// ── Mock RecordingAPI ───────────────────────────────────────────────────────
vi.mock('../../src/recording/RecordingAPI', () => ({
  trascriviAudio: vi.fn(),
}));

// ── Mock localStorage e location ────────────────────────────────────────────
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

// ── Fixtures ────────────────────────────────────────────────────────────────
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
  globalThis.location.href = '';
  setupDefaultMocks();
});

afterEach(() => vi.clearAllMocks());

// ════════════════════════════════════════════════════════════════════════════
// Bootstrap
// ════════════════════════════════════════════════════════════════════════════
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

// ════════════════════════════════════════════════════════════════════════════
// Messaggi
// ════════════════════════════════════════════════════════════════════════════
describe('useChatViewModel – messaggi', () => {
  it('carica i messaggi quando cambia la conversazione attiva', async () => {
    const { result } = renderHook(() => useChatViewModel());
    await waitFor(() => expect(result.current.messages).toHaveLength(2));
    expect(ChatModel.getMessages).toHaveBeenCalledWith(1);
  });

  it('imposta isLoadingMsgs=true durante il caricamento', async () => {
    let resolve!: (v: { id_conv: number; messages: any[] }) => void;
    vi.mocked(ChatModel.getMessages).mockReturnValue(
      new Promise<{ id_conv: number; messages: any[] }>(r => { resolve = r; })
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

// ════════════════════════════════════════════════════════════════════════════
// refreshCart
// ════════════════════════════════════════════════════════════════════════════
describe('useChatViewModel – refreshCart', () => {
  it('non fa nulla se username è null – guard', async () => {
    vi.mocked(ChatModel.getMe).mockRejectedValue(new Error('fail'));
    const { result } = renderHook(() => useChatViewModel());
    await waitFor(() => expect(globalThis.location.href).toBe('/unauthorized'));
    const callsBefore = vi.mocked(ChatModel.getCart).mock.calls.length;
    await act(async () => {
      result.current.setInputText('test');
      await result.current.sendMessage();
    });
    expect(vi.mocked(ChatModel.getCart).mock.calls.length).toBe(callsBefore);
  });

  it('aggiorna il carrello dopo invio di un messaggio', async () => {
    const cartAfterSend = { username: 'mario', products: [{ prod_id: 'P001', name: 'Latte', price: 1.5, measure_unit: 1, qty: 1 }] };
    vi.mocked(ChatModel.sendMessage).mockResolvedValue({ id_conv: 1, message: { id_messaggio: 10, mittente: 'Chatbot', contenuto: 'ok' } });
    vi.mocked(ChatModel.getMessages).mockResolvedValue({ id_conv: 1, messages: mockMessages });
    vi.mocked(ChatModel.getCart).mockResolvedValueOnce(mockCart).mockResolvedValue(cartAfterSend);
    const { result } = renderHook(() => useChatViewModel());
    await waitFor(() => expect(result.current.username).toBe('mario'));
    act(() => result.current.setInputText('Ciao'));
    await act(async () => { await result.current.sendMessage(); });
    await waitFor(() => expect(result.current.cartProducts).toHaveLength(1));
  });
});

// ════════════════════════════════════════════════════════════════════════════
// selectConversation
// ════════════════════════════════════════════════════════════════════════════
describe('useChatViewModel – selectConversation', () => {
  it('aggiorna activeConvId', async () => {
    const { result } = renderHook(() => useChatViewModel());
    await waitFor(() => expect(result.current.conversations).toHaveLength(2));
    act(() => result.current.selectConversation(2));
    expect(result.current.activeConvId).toBe(2);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// createConversation
// ════════════════════════════════════════════════════════════════════════════
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
    vi.mocked(ChatModel.createConversation).mockRejectedValue(new Error('fail'));
    await act(async () => { await result.current.createConversation(); });
    expect(result.current.error).toMatch(/creazione della conversazione/i);
  });

  it('non fa nulla se username è null', async () => {
    vi.mocked(ChatModel.getMe).mockRejectedValue(new Error('fail'));
    const { result } = renderHook(() => useChatViewModel());
    await waitFor(() => expect(globalThis.location.href).toBe('/unauthorized'));
    const callsBefore = vi.mocked(ChatModel.createConversation).mock.calls.length;
    await act(async () => { await result.current.createConversation(); });
    expect(vi.mocked(ChatModel.createConversation).mock.calls.length).toBe(callsBefore);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// renameConversation
// ════════════════════════════════════════════════════════════════════════════
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

// ════════════════════════════════════════════════════════════════════════════
// deleteConversation
// ════════════════════════════════════════════════════════════════════════════
describe('useChatViewModel – deleteConversation', () => {
  it('rimuove la conversazione eliminata dalla lista', async () => {
    vi.mocked(ChatModel.deleteConversation).mockResolvedValue(undefined);
    const { result } = renderHook(() => useChatViewModel());
    await waitFor(() => expect(result.current.conversations).toHaveLength(2));
    await act(async () => { await result.current.deleteConversation(2); });
    expect(result.current.conversations.find(c => c.id_conv === 2)).toBeUndefined();
  });

  it('non cambia activeConvId se si elimina una conversazione non attiva', async () => {
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

  it('imposta errore se createConversation fallisce dopo aver eliminato l\'ultima conversazione', async () => {
    vi.mocked(ChatModel.getConversations).mockResolvedValue([{ id_conv: 1, username: 'mario', titolo: 'Unica' }]);
    vi.mocked(ChatModel.deleteConversation).mockResolvedValue(undefined);
    vi.mocked(ChatModel.createConversation).mockRejectedValue(new Error('fail'));
    const { result } = renderHook(() => useChatViewModel());
    await waitFor(() => expect(result.current.conversations).toHaveLength(1));
    await act(async () => { await result.current.deleteConversation(1); });
    await waitFor(() => expect(result.current.error).toMatch(/creazione automatica/i));
  });
});

// ════════════════════════════════════════════════════════════════════════════
// sendMessage
// ════════════════════════════════════════════════════════════════════════════
describe('useChatViewModel – sendMessage', () => {
  it('aggiunge subito il messaggio utente (ottimistico)', async () => {
    vi.mocked(ChatModel.sendMessage).mockResolvedValue({ id_conv: 1, message: { id_messaggio: 10, mittente: 'Chatbot', contenuto: 'ok' } });
    vi.mocked(ChatModel.getMessages).mockResolvedValue({ id_conv: 1, messages: [...mockMessages, { id_messaggio: 10, mittente: 'Chatbot', contenuto: 'ok' }] });
    const { result } = renderHook(() => useChatViewModel());
    await waitFor(() => expect(result.current.username).toBe('mario'));
    act(() => result.current.setInputText('Messaggio di test'));
    await act(async () => { await result.current.sendMessage(); });
    expect(result.current.messages.some(m => m.contenuto === 'Messaggio di test')).toBe(true);
  });

  it('non invia se l\'input è vuoto', async () => {
    const { result } = renderHook(() => useChatViewModel());
    await waitFor(() => expect(result.current.username).toBe('mario'));
    act(() => result.current.setInputText(''));
    await act(async () => { await result.current.sendMessage(); });
    expect(ChatModel.sendMessage).not.toHaveBeenCalled();
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

// ════════════════════════════════════════════════════════════════════════════
// handleAudioAttach
// ════════════════════════════════════════════════════════════════════════════
describe('useChatViewModel – handleAudioAttach', () => {
  it('imposta inputText con la trascrizione del file audio', async () => {
    vi.mocked(trascriviAudio).mockResolvedValue('testo trascritto da file');
    const { result } = renderHook(() => useChatViewModel());
    await waitFor(() => expect(result.current.username).toBe('mario'));

    const file = new File(['audio'], 'test.mp3', { type: 'audio/mpeg' });
    await act(async () => { await result.current.handleAudioAttach(file); });

    expect(trascriviAudio).toHaveBeenCalledWith(file, file.name);
    expect(result.current.inputText).toBe('testo trascritto da file');
    expect(result.current.isTranscribing).toBe(false);
  });

  it('imposta isTranscribing=true durante la trascrizione del file', async () => {
    let resolveTranscription!: (v: string) => void;
    vi.mocked(trascriviAudio).mockReturnValue(
      new Promise<string>(r => { resolveTranscription = r; })
    );
    const { result } = renderHook(() => useChatViewModel());
    await waitFor(() => expect(result.current.username).toBe('mario'));

    const file = new File(['audio'], 'test.mp3', { type: 'audio/mpeg' });
    act(() => { result.current.handleAudioAttach(file); });
    await waitFor(() => expect(result.current.isTranscribing).toBe(true));

    await act(async () => { resolveTranscription('risultato'); });
    await waitFor(() => expect(result.current.isTranscribing).toBe(false));
  });

  it('imposta errore se la trascrizione del file fallisce (istanza Error)', async () => {
    vi.mocked(trascriviAudio).mockRejectedValue(new Error('Errore microfono'));
    const { result } = renderHook(() => useChatViewModel());
    await waitFor(() => expect(result.current.username).toBe('mario'));

    const file = new File(['audio'], 'test.mp3', { type: 'audio/mpeg' });
    await act(async () => { await result.current.handleAudioAttach(file); });

    expect(result.current.error).toBe('Errore microfono');
    expect(result.current.isTranscribing).toBe(false);
  });

  it('imposta errore generico se la trascrizione del file lancia un non-Error', async () => {
    vi.mocked(trascriviAudio).mockRejectedValue('errore stringa');
    const { result } = renderHook(() => useChatViewModel());
    await waitFor(() => expect(result.current.username).toBe('mario'));

    const file = new File(['audio'], 'test.mp3', { type: 'audio/mpeg' });
    await act(async () => { await result.current.handleAudioAttach(file); });

    expect(result.current.error).toMatch(/errore nella trascrizione/i);
    expect(result.current.isTranscribing).toBe(false);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// handleAudioRecord
// ════════════════════════════════════════════════════════════════════════════
describe('useChatViewModel – handleAudioRecord', () => {
  it('imposta inputText con la trascrizione del blob audio', async () => {
    vi.mocked(trascriviAudio).mockResolvedValue('testo trascritto da blob');
    const { result } = renderHook(() => useChatViewModel());
    await waitFor(() => expect(result.current.username).toBe('mario'));

    const blob = new Blob(['audio'], { type: 'audio/webm' });
    await act(async () => { await result.current.handleAudioRecord(blob); });

    expect(trascriviAudio).toHaveBeenCalledWith(blob);
    expect(result.current.inputText).toBe('testo trascritto da blob');
    expect(result.current.isTranscribing).toBe(false);
  });

  it('imposta isTranscribing=true durante la trascrizione del blob', async () => {
    let resolveTranscription!: (v: string) => void;
    vi.mocked(trascriviAudio).mockReturnValue(
      new Promise<string>(r => { resolveTranscription = r; })
    );
    const { result } = renderHook(() => useChatViewModel());
    await waitFor(() => expect(result.current.username).toBe('mario'));

    const blob = new Blob(['audio'], { type: 'audio/webm' });
    act(() => { result.current.handleAudioRecord(blob); });
    await waitFor(() => expect(result.current.isTranscribing).toBe(true));

    await act(async () => { resolveTranscription('risultato'); });
    await waitFor(() => expect(result.current.isTranscribing).toBe(false));
  });

  it('imposta errore se la trascrizione del blob fallisce (istanza Error)', async () => {
    vi.mocked(trascriviAudio).mockRejectedValue(new Error('Rete non disponibile'));
    const { result } = renderHook(() => useChatViewModel());
    await waitFor(() => expect(result.current.username).toBe('mario'));

    const blob = new Blob(['audio'], { type: 'audio/webm' });
    await act(async () => { await result.current.handleAudioRecord(blob); });

    expect(result.current.error).toBe('Rete non disponibile');
    expect(result.current.isTranscribing).toBe(false);
  });

  it('imposta errore generico se la trascrizione del blob lancia un non-Error', async () => {
    vi.mocked(trascriviAudio).mockRejectedValue(42);
    const { result } = renderHook(() => useChatViewModel());
    await waitFor(() => expect(result.current.username).toBe('mario'));

    const blob = new Blob(['audio'], { type: 'audio/webm' });
    await act(async () => { await result.current.handleAudioRecord(blob); });

    expect(result.current.error).toMatch(/errore nella trascrizione/i);
    expect(result.current.isTranscribing).toBe(false);
  });

  it('converte la risposta di trascriviAudio in stringa tramite String()', async () => {
    vi.mocked(trascriviAudio).mockResolvedValue(12345 as unknown as string);
    const { result } = renderHook(() => useChatViewModel());
    await waitFor(() => expect(result.current.username).toBe('mario'));

    const blob = new Blob(['audio'], { type: 'audio/webm' });
    await act(async () => { await result.current.handleAudioRecord(blob); });

    expect(result.current.inputText).toBe('12345');
  });
});

// ════════════════════════════════════════════════════════════════════════════
// removeFromCart
// ════════════════════════════════════════════════════════════════════════════
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

  it('non fa nulla se username è null', async () => {
    vi.mocked(ChatModel.getMe).mockRejectedValue(new Error('fail'));
    const { result } = renderHook(() => useChatViewModel());
    await waitFor(() => expect(globalThis.location.href).toBe('/unauthorized'));
    const callsBefore = vi.mocked(ChatModel.removeFromCart).mock.calls.length;
    await act(async () => { await result.current.removeFromCart('P001'); });
    expect(vi.mocked(ChatModel.removeFromCart).mock.calls.length).toBe(callsBefore);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// cartTotal
// ════════════════════════════════════════════════════════════════════════════
describe('useChatViewModel – cartTotal', () => {
  it('calcola il totale correttamente', async () => {
    vi.mocked(ChatModel.getCart).mockResolvedValue({
      username: 'mario',
      products: [
        { prod_id: 'P001', name: 'Latte',  price: 1.5, measure_unit: 1, qty: 2 },
        { prod_id: 'P002', name: 'Pane',   price: 2,   measure_unit: 1, qty: 1 },
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

// ════════════════════════════════════════════════════════════════════════════
// logout
// ════════════════════════════════════════════════════════════════════════════
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

// ════════════════════════════════════════════════════════════════════════════
// setError
// ════════════════════════════════════════════════════════════════════════════
describe('useChatViewModel – setError', () => {
  it('espone setError per pulire manualmente l\'errore', async () => {
    vi.mocked(ChatModel.getMessages).mockRejectedValue(new Error('fail'));
    const { result } = renderHook(() => useChatViewModel());
    await waitFor(() => expect(result.current.error).not.toBeNull());
    act(() => result.current.setError(null));
    expect(result.current.error).toBeNull();
  });
});

describe('useChatViewModel – invioOrdine', () => {

  it('happy path: chiama sendOrder e svuota cartProducts (righe 270-272)', async () => {
    vi.mocked(ChatModel.getCart).mockResolvedValue({
      username: 'mario',
      products: [{ prod_id: 'P001', name: 'Latte', price: 1.5, measure_unit: 1, qty: 2 }],
    });
    vi.mocked(ChatModel.sendOrder).mockResolvedValue(undefined);

    const { result } = renderHook(() => useChatViewModel());
    await waitFor(() => expect(result.current.cartProducts).toHaveLength(1));

    await act(async () => { await result.current.invioOrdine(); });

    expect(ChatModel.sendOrder).toHaveBeenCalledWith('mario');
    expect(result.current.cartProducts).toHaveLength(0);
  });

  it('error path: imposta errore se sendOrder lancia (righe 273-274)', async () => {
    vi.mocked(ChatModel.sendOrder).mockRejectedValue(new Error('fail'));

    const { result } = renderHook(() => useChatViewModel());
    await waitFor(() => expect(result.current.username).toBe('mario'));

    await act(async () => { await result.current.invioOrdine(); });

    expect(result.current.error).toMatch(/errore nell'invio dell'ordine/i);
  });

  it('guard username null: non chiama sendOrder (riga 269 – branch falso)', async () => {
    vi.mocked(ChatModel.getMe).mockRejectedValue(new Error('unauth'));

    const { result } = renderHook(() => useChatViewModel());
    await waitFor(() => expect(globalThis.location.href).toBe('/unauthorized'));

    const callsBefore = vi.mocked(ChatModel.sendOrder).mock.calls.length;
    await act(async () => { await result.current.invioOrdine(); });

    expect(vi.mocked(ChatModel.sendOrder).mock.calls.length).toBe(callsBefore);
  });
});