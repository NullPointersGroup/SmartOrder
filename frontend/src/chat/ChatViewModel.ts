import { useState, useEffect, useCallback, useRef } from 'react';
import { ChatModel} from './ChatModel';
import type { Message, Conversation, CartProduct} from './ChatModel'

export function useChatViewModel() {
  // ── Stato ─────────────────────────────────────────────────────────────────
  const [username, setUsername]           = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId]   = useState<number | null>(null);
  const [messages, setMessages]           = useState<Message[]>([]);
  const [cartProducts, setCartProducts]   = useState<CartProduct[]>([]);
  const [inputText, setInputText]         = useState('');
  const [isLoadingMsgs, setIsLoadingMsgs] = useState(false);
  const [isSending, setIsSending]         = useState(false);
  const [error, setError]                 = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ── Scroll to bottom ──────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Bootstrap: carica utente e sue conversazioni ──────────────────────────
  useEffect(() => {
    ChatModel.getMe()
      .then(({ username }) => {
        setUsername(username);
        return Promise.all([
          ChatModel.getConversations(username),
          ChatModel.getCart(username),
        ]);
      })
      .then(([convs, cart]) => {
        setConversations(convs);
        setCartProducts(cart.products);
      })
      .catch(() => {
       globalThis.location.href = '/unauthorized';
      });
  }, []);

  // ── Carica messaggi al cambio conversazione ───────────────────────────────
  useEffect(() => {
    if (activeConvId == null) return;
    setIsLoadingMsgs(true);
    setMessages([]);
    ChatModel.getMessages(activeConvId)
      .then(({ messages }) => setMessages(messages))
      .catch(() => setError('Errore nel caricamento dei messaggi'))
      .finally(() => setIsLoadingMsgs(false));
  }, [activeConvId]);

  // ── Aggiorna carrello ─────────────────────────────────────────────────────
  const refreshCart = useCallback(async () => {
    if (!username) return;
    try {
      const cart = await ChatModel.getCart(username);
      setCartProducts(cart.products);
    } catch {
      // errori carrello non critici
    }
  }, [username]);

  // ── Seleziona conversazione ───────────────────────────────────────────────
  const selectConversation = useCallback((conv_id: number) => {
    setActiveConvId(conv_id);
  }, []);

  // ── Crea nuova conversazione ──────────────────────────────────────────────
  const createConversation = useCallback(async () => {
    if (!username) return;
    try {
      const conv = await ChatModel.createConversation(username, 'Nuova conversazione');
      setConversations(prev => [conv, ...prev]);
      setActiveConvId(conv.id_conv);
    } catch {
      setError('Errore nella creazione della conversazione');
    }
  }, [username]);

  // ── Rinomina conversazione ────────────────────────────────────────────────
  const renameConversation = useCallback(async (conv_id: number, titolo: string) => {
    const trimmed = titolo.trim();
    if (!trimmed) return;
    try {
      const updated = await ChatModel.renameConversation(conv_id, trimmed);
      setConversations(prev =>
        prev.map(c => (c.id_conv === conv_id ? updated : c)),
      );
    } catch {
      setError('Errore nel rinomina');
    }
  }, []);

  // ── Elimina conversazione ─────────────────────────────────────────────────
  const deleteConversation = useCallback(async (conv_id: number) => {
    try {
      await ChatModel.deleteConversation(conv_id);
      setConversations(prev => prev.filter(c => c.id_conv !== conv_id));
      if (activeConvId === conv_id) {
        setActiveConvId(null);
        setMessages([]);
      }
    } catch {
      setError("Errore nell'eliminazione");
    }
  }, [activeConvId]);

  // ── Invia messaggio ───────────────────────────────────────────────────────
  const sendMessage = useCallback(async () => {
    if (!activeConvId || !inputText.trim() || isSending) return;

    const content = inputText.trim();
    setInputText('');
    setIsSending(true);

    // Ottimistica: mostra subito il messaggio utente
    const tempId = -Date.now();
    const userMsg: Message = { id_messaggio: tempId, mittente: 'Utente', contenuto: content };
    setMessages(prev => [...prev, userMsg]);

    try {
      const { message: botMsg } = await ChatModel.sendMessage(activeConvId, content);
      setMessages(prev => [...prev, botMsg]);
      // Il bot potrebbe aver modificato il carrello
      await refreshCart();
    } catch {
      setError("Errore nell'invio del messaggio");
      setMessages(prev => prev.filter(m => m.id_messaggio !== tempId));
    } finally {
      setIsSending(false);
    }
  }, [activeConvId, inputText, isSending, refreshCart]);

  // ── Rimuovi dal carrello ──────────────────────────────────────────────────
  const removeFromCart = useCallback(async (cod_art: string) => {
    if (!username) return;
    try {
      await ChatModel.removeFromCart(username, cod_art);
      setCartProducts(prev => prev.filter(p => p.prod_id !== cod_art));
    } catch {
      setError('Errore nella rimozione dal carrello');
    }
  }, [username]);

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    await ChatModel.logout().catch(() => {});
    globalThis.location.href = '/';
  }, []);

  // ── Computed ──────────────────────────────────────────────────────────────
  const cartTotal = cartProducts.reduce(
    (sum, p) => sum + p.price * p.qty,
    0,
  );

  return {
    username,
    conversations,
    activeConvId,
    messages,
    cartProducts,
    cartTotal,
    inputText,
    setInputText,
    isLoadingMsgs,
    isSending,
    error,
    setError,
    messagesEndRef,
    // azioni
    selectConversation,
    createConversation,
    renameConversation,
    deleteConversation,
    sendMessage,
    removeFromCart,
    logout,
  };
}
