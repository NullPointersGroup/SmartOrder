import { useState, useEffect, useCallback, useRef } from 'react';
import { ChatModel } from './ChatModel';
import type { Message, Conversation, CartProduct } from './ChatModel'
import { trascriviAudio } from '../recording/RecordingAPI'

export function useChatViewModel() {
  /**
   * @brief ViewModel per la chat, gestisce stato e logica di business
   * @return Oggetto con stato e funzioni per la vista chat
  */
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
  const [isTranscribing, setIsTranscribing] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ── Scroll to bottom ──────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Bootstrap: carica utente e sue conversazioni ──────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const { username } = await ChatModel.getMe();
        setUsername(username);

        const [convs, cart] = await Promise.all([
          ChatModel.getConversations(username),
          ChatModel.getCart(username),
        ]);

        setCartProducts(cart.products);
        setConversations(convs);

        const savedConvId = localStorage.getItem('activeConvId');
        const savedIdNum = savedConvId ? Number.parseInt(savedConvId, 10) : null;

        if (savedIdNum && convs.some(c => c.id_conv === savedIdNum)) {
          setActiveConvId(savedIdNum);
        } else if (convs.length > 0) {
          setActiveConvId(convs[0].id_conv);
        } else {
          const newConv = await ChatModel.createConversation(username, 'Nuova conversazione');
          setConversations([newConv]);
          setActiveConvId(newConv.id_conv);
        }
      } catch {
        globalThis.location.href = '/unauthorized';
      }
    })();
  }, []);

  // Salva l'ID nel localStorage ogni volta che cambia la chat attiva
  useEffect(() => {
    if (activeConvId !== null) {
      localStorage.setItem('activeConvId', activeConvId.toString());
    }
  }, [activeConvId]);

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
    /**
     * @brief Aggiorna i prodotti del carrello dall'API
     */
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
    /**
     * @brief Crea una nuova conversazione con titolo predefinito
     */
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
    /**
     * @brief Elimina una conversazione e gestisce la selezione della successiva
     * @param conv_id ID della conversazione da eliminare
     */
    try {
      await ChatModel.deleteConversation(conv_id);

      setConversations(prev => {
        const updatedConvs = prev.filter(c => c.id_conv !== conv_id);

        if (activeConvId === conv_id || updatedConvs.length === 0) {
          if (updatedConvs.length === 0 && username) {
            ChatModel.createConversation(username, 'Nuova conversazione')
              .then(newConv => {
                setConversations([newConv]);
                setActiveConvId(newConv.id_conv);
                setMessages([]);
              })
              .catch(() => setError('Errore nella creazione automatica'));
          } else if (updatedConvs.length > 0) {
            setActiveConvId(updatedConvs[0].id_conv);
          }
        }

        return updatedConvs;
      });
    } catch {
      setError("Errore nell'eliminazione");
    }
  }, [activeConvId, username]);

  // ── Core invio ────────────────────────────────────────────────────────────
  const _send = useCallback(async (content: string) => {
    /**
     * @brief Invia un messaggio con ottimistic update
     * @param content Contenuto del messaggio da inviare
     */
    if (!activeConvId || !content.trim() || isSending) return;
    const tempId = -Date.now();
    const optimisticMessage: Message = {
      id_messaggio: tempId,
      mittente: 'Utente',
      contenuto: content,
    };
    setMessages(prev => [...prev, optimisticMessage]);
    setIsSending(true);
    try {
      const { message: sentMessage } = await ChatModel.sendMessage(activeConvId, content);
      const { messages: latest } = await ChatModel.getMessages(activeConvId);
      setMessages(prev => {
        const withoutTemp = prev.filter(m => m.id_messaggio !== tempId);
        const existingIds = new Set(withoutTemp.map(m => m.id_messaggio));
        const realUserMsg: Message = { ...sentMessage, mittente: 'Utente', contenuto: content };
        if (!existingIds.has(realUserMsg.id_messaggio)) {
          existingIds.add(realUserMsg.id_messaggio);
        }
        const newFromServer = latest.filter(m => !existingIds.has(m.id_messaggio));
        return [...withoutTemp, realUserMsg, ...newFromServer];
      });
      refreshCart();
    } catch {
      setMessages(prev => prev.filter(m => m.id_messaggio !== tempId));
    } finally {
      setIsSending(false);
    }
  }, [activeConvId, isSending, refreshCart]);

  // ── Invia messaggio da input ──────────────────────────────────────────────
  const sendMessage = useCallback(async () => {
    /**
     * @brief Invia il messaggio dall'input text e lo svuota
     */
    await _send(inputText.trim());
    setInputText('');
  }, [_send, inputText]);

  // ── Trascrizione e invio audio ────────────────────────────────────────────
  const handleAudioAttach = useCallback(async (file: File) => {
    /**
     * @brief Trascrive un file audio allegato e lo inserisce nell'input
     * @param file File audio da trascrivere
     */
    try {
      setIsTranscribing(true)
      const testo = await trascriviAudio(file, file.name)
      setInputText(String(testo))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Errore nella trascrizione')
    } finally {
      setIsTranscribing(false)
    }
  }, [])

  const handleAudioRecord = useCallback(async (blob: Blob) => {
    /**
     * @brief Trascrive un audio registrato e lo inserisce nell'input
     * @param blob Blob audio registrato
     */
    try {
      setIsTranscribing(true)
      const testo = await trascriviAudio(blob)
      setInputText(String(testo))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Errore nella trascrizione')
    } finally {
      setIsTranscribing(false)
    }
  }, [])

  // ── Rimuovi dal carrello ──────────────────────────────────────────────────
  const removeFromCart = useCallback(async (cod_art: string) => {
    /**
     * @brief Rimuove un prodotto dal carrello
     * @param cod_art ID del prodotto da rimuovere
     */
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
    /**
     * @brief Effettua il logout e reindirizza alla home
     */
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
    selectConversation,
    createConversation,
    renameConversation,
    deleteConversation,
    sendMessage,
    removeFromCart,
    logout,
    handleAudioRecord,
    handleAudioAttach,
    isTranscribing
  };
}