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
  /**
   * @brief Converte un messaggio dal formato raw del backend al formato di dominio
   * @param m Messaggio raw proveniente dall'API
   * @return Message convertito nel formato dell'applicazione
   */
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
  /**
   * @brief Gestisce la risposta HTTP, estrae JSON o lancia errore
   * @param res Risposta HTTP dal fetch
   * @return Promise con il body parsato come JSON
   * @throws Error se la risposta non è ok (status 4xx/5xx)
   */
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
    /**
     * @brief Ottiene le informazioni dell'utente autenticato
     * @return Promise con username dell'utente
     * @throws Error in caso di fallimento autenticazione
     * @req RF-OB_1
     */
    const res = await fetch(`/auth/me`, { credentials: 'include' });
    return handleResponse(res);
  },

  async logout(): Promise<void> {
    /**
     * @brief Effettua il logout dell'utente corrente
     * @throws Error in caso di errore nella richiesta di logout
     * @req RF-OB_2
     */
    const res = await fetch(`/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
    return handleResponse(res);
  },

  // Conversazioni

  async getConversations(username: string): Promise<Conversation[]> {
    /**
     * @brief Recupera tutte le conversazioni di un utente
     * @param username Nome dell'utente
     * @return Promise con array di conversazioni
     * @throws Error se la richiesta fallisce
     * @req RF-OB_3
     */
    const res = await fetch(`/conversations/${username}`, {
      credentials: 'include',
    });
    return handleResponse(res);
  },

  async createConversation(username: string, titolo: string): Promise<Conversation> {
    /**
     * @brief Crea una nuova conversazione per un utente
     * @param username Nome dell'utente
     * @param titolo Titolo della nuova conversazione
     * @return Promise con la conversazione creata
     * @throws Error se la richiesta fallisce
     * @req RF-OB_4
     */
    const res = await fetch(`/conversations/${username}`, {
      method: 'POST',
      credentials: 'include',
      ...json({ titolo }),
    });
    return handleResponse(res);
  },

  async renameConversation(conv_id: number, titolo: string): Promise<Conversation> {
    /**
     * @brief Rinomina una conversazione esistente
     * @param conv_id ID della conversazione
     * @param titolo Nuovo titolo
     * @return Promise con la conversazione aggiornata
     * @throws Error se la richiesta fallisce
     * @req RF-OB_5
     */
    const res = await fetch(`/conversations/${conv_id}`, {
      method: 'PATCH',
      credentials: 'include',
      ...json({ titolo }),
    });
    return handleResponse(res);
  },

  async deleteConversation(conv_id: number): Promise<void> {
    /**
     * @brief Elimina una conversazione
     * @param conv_id ID della conversazione da eliminare
     * @throws Error se la richiesta fallisce
     * @req RF-OB_6
     */
    const res = await fetch(`/conversations/${conv_id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    return handleResponse(res);
  },

  // Messaggi

  async getMessages(conv_id: number): Promise<ChatApiResponse> {
    /**
     * @brief Recupera tutti i messaggi di una conversazione
     * @param conv_id ID della conversazione
     * @return Promise con id conversazione e array di messaggi
     * @throws Error se la richiesta fallisce
     * @req RF-OB_7
     */
    const res = await fetch(`/chat/${conv_id}/all`, { credentials: 'include' });
    const data = await handleResponse<RawChatApiResponse>(res);

    return {
      id_conv:  data.id_conv,
      messages: data.messages.map(toMessage),
    };
  },

  async sendMessage(conv_id: number, content: string): Promise<MessageApiResponse> {
    /**
     * @brief Invia un nuovo messaggio in una conversazione
     * @param conv_id ID della conversazione
     * @param content Contenuto del messaggio
     * @return Promise con id conversazione e messaggio inviato
     * @throws Error se la richiesta fallisce
     * @req RF-OB_8
     */
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
    /**
     * @brief Recupera il carrello di un utente
     * @param username Nome dell'utente
     * @return Promise con username e lista prodotti nel carrello
     * @throws Error se la richiesta fallisce
     * @req RF-OB_9
     */
    const res = await fetch(`/cart/${username}`, { credentials: 'include' });
    return handleResponse(res);
  },

  async removeFromCart(username: string, prod_id: string): Promise<void> {
    /**
     * @brief Rimuove un prodotto dal carrello dell'utente
     * @param username Nome dell'utente
     * @param prod_id ID del prodotto da rimuovere
     * @throws Error se la richiesta fallisce
     * @req RF-OB_10
     */
    const res = await fetch(`/cart/${username}`, {
      method: 'DELETE',
      credentials: 'include',
      ...json({ prod_id }),
    });
    return handleResponse(res);
  },
};