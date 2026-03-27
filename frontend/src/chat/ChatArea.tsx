import React from 'react';
import type { KeyboardEvent } from 'react';
import type { Message } from './ChatModel';

interface Props {
  messages: Message[];
  isLoading: boolean;
  isSending: boolean;
  inputText: string;
  hasActiveConv: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  onInputChange: (val: string) => void;
  onSend: () => void;
}

function TypingIndicator() {
  return (
    <output
      className="flex items-end gap-2 mb-4"
      aria-label="Il chatbot sta scrivendo"
    >
      <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <circle cx="7" cy="7" r="6" stroke="#059669" strokeWidth="1.5" />
          <path d="M4 7h6M7 4v6" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
      <div className="flex items-center gap-1 bg-white border border-stone-200 rounded-2xl rounded-bl-sm px-4 py-3">
        {[0, 1, 2].map(i => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-stone-400 animate-bounce"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    </output>
  );
}

function MessageBubble({ msg }: { readonly msg: Message }) {
  const isUser = msg.mittente.toLowerCase() === 'utente';
  return (
    <div className={`flex items-end gap-2 mb-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold ${
          isUser ? 'bg-emerald-700 text-white' : 'bg-emerald-100 text-emerald-700'
        }`}
        aria-hidden="true"
      >
        {isUser ? 'Tu' : 'AI'}
      </div>

      <article
        className={`
          max-w-[65%] px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap
          ${isUser
            ? 'bg-emerald-700 text-white rounded-2xl rounded-br-sm'
            : 'bg-white border border-stone-200 text-stone-800 rounded-2xl rounded-bl-sm shadow-sm'}
        `}
        aria-label={`Messaggio di ${isUser ? 'te' : 'chatbot'}`}
      >
        {msg.contenuto}
      </article>
    </div>
  );
}

export const ChatArea: React.FC<Props> = ({
  messages,
  isLoading,
  isSending,
  inputText,
  hasActiveConv,
  messagesEndRef,
  onInputChange,
  onSend,
}) => {
  const MAX_CHARS = 4096;
  const isOverLimit = inputText.length > MAX_CHARS;

  const getCounterColorClass = () => {
      if (isOverLimit) return 'text-red-500 font-semibold';
      return 'text-stone-700';
    };

  const counterColorClass = getCounterColorClass();
  const formattedCharCount = `${inputText.length.toLocaleString('it-IT')} / 4096`;

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  }

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
    onInputChange(el.value);
  }

  return (
    <main className="flex flex-col flex-1 min-w-0 h-full bg-stone-50" aria-label="Area chat">
      {/* Messaggi */}
      <div
        className="flex-1 overflow-y-auto px-6 py-6"
        role="log"
        aria-live="polite"
        aria-label="Messaggi della conversazione"
      >
        {!hasActiveConv && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                <path
                  d="M4 4h24v18H18l-6 6V22H4V4z"
                  stroke="#059669" strokeWidth="2" strokeLinejoin="round"
                />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-stone-700 mb-1">Inizia una conversazione</h2>
            <p className="text-sm text-stone-400 max-w-xs">
              Seleziona una conversazione dalla sidebar o creane una nuova.
            </p>
          </div>
        )}

        {hasActiveConv && isLoading && (
          <output className="flex justify-center py-12" aria-label="Caricamento messaggi">
            <div className="w-6 h-6 border-2 border-stone-200 border-t-emerald-600 rounded-full animate-spin" />
          </output>
        )}

        {hasActiveConv && !isLoading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-sm text-stone-400">Nessun messaggio ancora. Scrivi qualcosa!</p>
          </div>
        )}

        {messages.map(msg => (
          <MessageBubble key={msg.id_messaggio} msg={msg} />
        ))}

        {isSending && <TypingIndicator />}
        <div ref={messagesEndRef} aria-hidden="true" />
      </div>

      {/* Input bar */}
      <div className="border-t border-stone-200 bg-white px-4 py-3">
        <div
          className={`flex items-end gap-3 rounded-xl border transition-colors ${
            hasActiveConv
              ? 'border-stone-200 focus-within:border-emerald-400 bg-white'
              : 'border-stone-100 bg-stone-50'
          } px-4 py-2`}
        >
          <textarea
            className="flex-1 resize-none bg-transparent text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none min-h-9 max-h-40 leading-relaxed disabled:cursor-not-allowed"
            placeholder={hasActiveConv ? 'Scrivi un messaggio… (Invio per inviare)' : 'Seleziona una conversazione'}
            value={inputText}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            disabled={!hasActiveConv || isSending}
            rows={1}
            aria-label="Campo di testo per il messaggio"
            aria-multiline="true"
          />
          <button
            onClick={onSend}
            disabled={!hasActiveConv || !inputText.trim() || isSending || isOverLimit}
            aria-label="Invia messaggio"
            className="
              w-9 h-9 shrink-0 flex items-center justify-center rounded-lg
              bg-emerald-700 text-white
              hover:bg-emerald-800 active:bg-emerald-900
              disabled:opacity-40 disabled:cursor-not-allowed
              transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2
            "
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M2 8l12-6-6 12V8H2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        <div className="flex items-center justify-between mt-1.5 px-1">
          <p className="text-xs text-stone-400">Invio per inviare · Shift+Invio per andare a capo</p>
          <p className={`text-xs tabular-nums transition-colors ${counterColorClass}`}>
            {formattedCharCount}
          </p>
        </div>
      </div>
    </main>
  );
};