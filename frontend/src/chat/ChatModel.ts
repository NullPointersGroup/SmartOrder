// ── Tipi di dominio (nomi italiani, usati nel resto dell'app) ─────────────────

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

// ── Tipi raw del backend (privati a questo file) ──────────────────────────────

interface RawMessage {
  id_message: number;
  sender: Mittente;
  content: string;
}

interface RawChatApiResponse {
  id_conv: number;
  messages: RawMessage[];
}

interface RawMessageApiResponse {
  id_conv: number;
  message: RawMessage;
}

// ── Mapper ────────────────────────────────────────────────────────────────────

function toMessage(m: RawMessage): Message {
  return {
    id_messaggio: m.id_message,
    mittente:     m.sender,
    contenuto:    m.content,
  };
}

// ── Costanti ──────────────────────────────────────────────────────────────────

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

// ── ChatModel — layer di accesso ai dati ──────────────────────────────────────

export const ChatModel = {
  // Auth
  async getMe(): Promise<{ username: string }> {
    const res = await fetch(`/auth/me`, { credentials: 'include' });
    return handleResponse(res);
  },

  async logout(): Promise<void> {
    const res = await fetch(`/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
    return handleResponse(res);
  },

  // Conversazioni
  async getConversations(username: string): Promise<Conversation[]> {
    const res = await fetch(`/conversations/${username}`, {
      credentials: 'include',
    });
    return handleResponse(res);
  },

  async createConversation(username: string, titolo: string): Promise<Conversation> {
    const res = await fetch(`/conversations/${username}`, {
      method: 'POST',
      credentials: 'include',
      ...json({ titolo }),
    });
    return handleResponse(res);
  },

  async renameConversation(conv_id: number, titolo: string): Promise<Conversation> {
    const res = await fetch(`/conversations/${conv_id}`, {
      method: 'PATCH',
      credentials: 'include',
      ...json({ titolo }),
    });
    return handleResponse(res);
  },

  async deleteConversation(conv_id: number): Promise<void> {
    const res = await fetch(`/conversations/${conv_id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    return handleResponse(res);
  },

  // Messaggi
  async getMessages(conv_id: number): Promise<ChatApiResponse> {
    const res = await fetch(`/chat/${conv_id}/all`, { credentials: 'include' });
    const data = await handleResponse<RawChatApiResponse>(res);

    return {
      id_conv:  data.id_conv,
      messages: data.messages.map(toMessage),
    };
  },

  async sendMessage(conv_id: number, content: string): Promise<MessageApiResponse> {
    const res = await fetch(`/chat/${conv_id}`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    const data = await handleResponse<RawMessageApiResponse>(res);

    return {
      id_conv: data.id_conv,
      message: toMessage(data.message),
    };
  },

  // Carrello
  async getCart(username: string): Promise<CartApiResponse> {
    const res = await fetch(`/cart/${username}`, { credentials: 'include' });
    return handleResponse(res);
  },

  async removeFromCart(username: string, prod_id: string): Promise<void> {
    const res = await fetch(`/cart/${username}`, {
      method: 'DELETE',
      credentials: 'include',
      ...json({ prod_id }),
    });
    return handleResponse(res);
  },
};