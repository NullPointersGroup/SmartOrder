// ── Tipi di dominio ──────────────────────────────────────────────────────────

export type Mittente = 'Utente' | 'Chatbot';

export interface Message {
  id_messaggio: number;
  mittente: Mittente;
  contenuto: string;
}

export interface Conversation {
  id_conv: number;
  username: string;
  titolo: string;
}

/** Un prodotto nel carrello.
 *  I nomi dei campi rispecchiano la risposta di CartApi.
 *  Se il backend restituisce `des_art` invece di `name`, aggiusta qui.
 */
export interface CartProduct {
  prod_id: string;
  name: string;
  price: number;
  measure_unit: number;
  qty: number;
}

export interface CartApiResponse {
  username: string;
  products: CartProduct[];
}

export interface ChatApiResponse {
  messages: Message[];
  id_conv: number;
}

export interface MessageApiResponse {
  id_conv: number;
  message: Message;
}

// ── Costanti ─────────────────────────────────────────────────────────────────

const BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

const json = (body: unknown) => ({
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail ?? `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ── ChatModel — layer di accesso ai dati ─────────────────────────────────────

export const ChatModel = {
  // Auth
  async getMe(): Promise<{ username: string }> {
    const res = await fetch(`${BASE}/auth/me`, { credentials: 'include' });
    return handleResponse(res);
  },

  async logout(): Promise<void> {
    const res = await fetch(`${BASE}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
    return handleResponse(res);
  },

  // Conversazioni
  async getConversations(username: string): Promise<Conversation[]> {
    const res = await fetch(`${BASE}/conversations/${username}`, {
      credentials: 'include',
    });
    return handleResponse(res);
  },

  async createConversation(username: string, titolo: string): Promise<Conversation> {
    const res = await fetch(`${BASE}/conversations/${username}`, {
      method: 'POST',
      credentials: 'include',
      ...json({ titolo }),
    });
    return handleResponse(res);
  },

  async renameConversation(conv_id: number, titolo: string): Promise<Conversation> {
    const res = await fetch(`${BASE}/conversations/${conv_id}`, {
      method: 'PATCH',
      credentials: 'include',
      ...json({ titolo }),
    });
    return handleResponse(res);
  },

  async deleteConversation(conv_id: number): Promise<void> {
    const res = await fetch(`${BASE}/conversations/${conv_id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    return handleResponse(res);
  },

  // Messaggi
  async getMessages(conv_id: number): Promise<ChatApiResponse> {
    const res = await fetch(`${BASE}/chat/${conv_id}/all`, {
      credentials: 'include',
    });
    return handleResponse(res);
  },

  /**
   * Invia un messaggio e riceve la risposta del chatbot.
   * Il backend salva anche il messaggio utente: non occorre inviarlo separatamente.
   */
  async sendMessage(conv_id: number, content: string): Promise<MessageApiResponse> {
    const res = await fetch(`${BASE}/chat/${conv_id}`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }), // solo content
    });
    return handleResponse(res);
  },

  // Carrello
  async getCart(username: string): Promise<CartApiResponse> {
    const res = await fetch(`${BASE}/cart/${username}`, {
      credentials: 'include',
    });
    return handleResponse(res);
  },

  async removeFromCart(username: string, prod_id: string): Promise<void> {
    const res = await fetch(`${BASE}/cart/${username}`, {
      method: 'DELETE',
      credentials: 'include',
      ...json({ prod_id }),
    });
    return handleResponse(res);
  },
};
