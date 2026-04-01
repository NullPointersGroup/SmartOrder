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
  onAudioAttach?: (file: File) => void;
  onAudioRecord?: (blob: Blob) => void;
  /** When true (narrow screen + sidebar open) the input bar stays fixed at the bottom */
  sidebarOpen?: boolean;
}

function TypingIndicator() {
  return (
    <output className="flex items-end gap-2 mb-4" aria-label="Il chatbot sta scrivendo">
      <div className="w-7 h-7 rounded-full bg-(--color-1) flex items-center justify-center shrink-0">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <circle cx="7" cy="7" r="6" stroke="var(--color-2)" strokeWidth="1.5" />
          <path d="M4 7h6M7 4v6" stroke="var(--color-2)" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
      <div className="flex items-center gap-1 bg-(--bg-3) border border-(--border) rounded-2xl rounded-bl-sm px-4 py-3">
        {[0, 1, 2].map(i => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-(--text-3) animate-bounce"
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
          isUser
            ? 'bg-(--color-3) text-(--bg-3)'
            : 'bg-(--color-1) text-(--color-3)'
        }`}
        aria-hidden="true"
      >
        {isUser ? 'Tu' : 'AI'}
      </div>
      <article
        className={`
          max-w-[65%] px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap
          ${isUser
            ? 'bg-(--color-3) text-(--bg-3) rounded-2xl rounded-br-sm'
            : 'bg-(--bg-3) border border-(--border) text-(--text-1) rounded-2xl rounded-bl-sm shadow-sm'}
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
  onAudioAttach,
  onAudioRecord,
  sidebarOpen = false,
}) => {
  const MAX_CHARS = 4096;
  const MAX_FILE_MB = 10;
  const MAX_DURATION_MIN = 120;
  const isOverLimit = inputText.length > MAX_CHARS;

  const [isRecording, setIsRecording] = React.useState(false);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const counterColorClass = isOverLimit
    ? 'text-(--oth-1) font-semibold'
    : 'text-(--text-2)';

  const formattedCharCount = `${inputText.length.toLocaleString('it-IT')} / 4096`;

  async function handleMicClick() {
    if (!hasActiveConv || isSending) return;

    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      recorder.ondataavailable = e => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        onAudioRecord?.(blob);
        stream.getTracks().forEach(t => t.stop());
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch {
      alert('Impossibile accedere al microfono. Controlla i permessi del browser.');
    }
  }

  function handleClipClick() {
    if (!hasActiveConv || isSending) return;
    fileInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Controllo dimensione: max 10 MB ----------------------->da vedere se mettere solo in backend o anche qui
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      alert(`Il file non può superare i ${MAX_FILE_MB} MB.`);
      e.target.value = '';
      return;
    }

    // Controllo durata: max 120 minuti----------------------->da vedere se mettere solo in backend o anche qui
    const url = URL.createObjectURL(file);
    const audio = new Audio(url);

    audio.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      if (audio.duration > MAX_DURATION_MIN * 60) {
        alert(`Il file audio non può superare i ${MAX_DURATION_MIN} minuti.`);
        return;
      }
      onAudioAttach?.(file);
    };

    audio.onerror = () => {
      URL.revokeObjectURL(url);
      alert('Impossibile leggere il file audio. Verifica che il formato sia supportato.');
    };

    e.target.value = '';
  }

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

  const iconBtnBase = `
    w-8 h-8 shrink-0 flex items-center justify-center rounded-lg
    transition-colors focus-visible:outline-none
    focus-visible:ring-2 focus-visible:ring-(--color-2) focus-visible:ring-offset-2
    disabled:opacity-40 disabled:cursor-not-allowed
  `;

  return (
    <main className="flex flex-col flex-1 min-w-0 h-full bg-(--bg-1)" aria-label="Area chat">
      {/* Messaggi */}
      <div
        className="flex-1 overflow-y-auto px-6 py-6"
        role="log"
        aria-live="polite"
        aria-label="Messaggi della conversazione"
      >
        {!hasActiveConv && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-2xl bg-(--color-1) flex items-center justify-center mb-4">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                <path
                  d="M4 4h24v18H18l-6 6V22H4V4z"
                  stroke="var(--color-2)" strokeWidth="2" strokeLinejoin="round"
                />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-(--text-2) mb-1">Inizia una conversazione</h2>
            <p className="text-sm text-(--text-4) max-w-xs">
              Seleziona una conversazione dalla sidebar o creane una nuova.
            </p>
          </div>
        )}

        {hasActiveConv && isLoading && (
          <output className="flex justify-center py-12" aria-label="Caricamento messaggi">
            <div className="w-6 h-6 border-2 border-(--border) border-t-(--color-2) rounded-full animate-spin" />
          </output>
        )}

        {hasActiveConv && !isLoading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-sm text-(--text-4)">Nessun messaggio ancora. Scrivi qualcosa!</p>
          </div>
        )}

        {messages.map(msg => (
          <MessageBubble key={msg.id_messaggio} msg={msg} />
        ))}

        {isSending && <TypingIndicator />}
        <div ref={messagesEndRef} aria-hidden="true" />
      </div>

      {/* Input bar */}
      <div className={`border-t border-(--border) bg-(--bg-3) px-4 py-3 ${sidebarOpen ? 'sticky bottom-0 z-10' : ''}`}>
        {/* Indicatore registrazione attiva */}
        {isRecording && (
          <output className="flex items-center gap-2 mb-2 px-1" aria-live="assertive">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" aria-hidden="true" />
            <span className="text-xs text-(--error) font-medium">
              Registrazione in corso…
            </span>
          </output>
        )}

        <div
          className={`flex items-end gap-2 rounded-xl border transition-colors px-3 py-2 ${
            hasActiveConv
              ? 'border-(--border) focus-within:border-(--color-2) bg-(--bg-3)'
              : 'border-(--border) bg-(--bg-1)'
          }`}
        >
          {/* Clip */}
          <button
            type="button"
            onClick={handleClipClick}
            disabled={!hasActiveConv || isSending}
            aria-label="Allega file audio (mp3, m4a, m4p, wav — max 10 MB, 120 min)"
            title="Allega file audio"
            className={`${iconBtnBase} text-(--text-3) hover:text-(--text-1) hover:bg-(--bg-2)`}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M13.5 7.5l-5.5 5.5a3.5 3.5 0 01-4.95-4.95l5.5-5.5a2 2 0 012.83 2.83L6.38 10.38a.5.5 0 01-.71-.71L10.5 5"
                stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"
              />
            </svg>
          </button>
          
          {/* Textarea */}
          <textarea
            className="flex-1 resize-none bg-transparent text-sm text-(--text-1) placeholder:text-(--text-4) focus:outline-none min-h-9 max-h-40 leading-relaxed disabled:cursor-not-allowed"
            placeholder={hasActiveConv ? 'Scrivi un messaggio… (Invio per inviare)' : 'Seleziona una conversazione'}
            value={inputText}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            disabled={!hasActiveConv || isSending}
            rows={1}
            aria-label="Campo di testo per il messaggio"
            aria-multiline="true"
          />

          {/* Microfono */}
          <button
            type="button"
            onClick={handleMicClick}
            disabled={!hasActiveConv || isSending}
            aria-label={isRecording ? 'Ferma registrazione' : 'Registra messaggio vocale'}
            title={isRecording ? 'Ferma registrazione' : 'Registra messaggio vocale'}
            className={`${iconBtnBase} ${
              isRecording
                ? 'text-red-500 hover:text-red-600 hover:bg-red-50'
                : 'text-(--text-3) hover:text-(--text-1) hover:bg-(--bg-2)'
            }`}
          >
            {isRecording ? (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <rect x="4" y="4" width="8" height="8" rx="1.5" fill="currentColor" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <rect x="5.5" y="1" width="5" height="8" rx="2.5" stroke="currentColor" strokeWidth="1.4" />
                <path
                  d="M3 7.5A5 5 0 008 12.5M8 12.5A5 5 0 0013 7.5M8 12.5V15M6 15h4"
                  stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"
                />
              </svg>
            )}
          </button>

          {/* Invia */}
          <button
            onClick={onSend}
            disabled={!hasActiveConv || !inputText.trim() || isSending || isOverLimit}
            aria-label="Invia messaggio"
            className="
              w-9 h-9 shrink-0 flex items-center justify-center rounded-lg
              bg-(--color-3) text-(--bg-3)
              hover:bg-(--color-4) active:bg-(--color-5)
              disabled:opacity-40 disabled:cursor-not-allowed
              transition-colors focus-visible:outline-none
              focus-visible:ring-2 focus-visible:ring-(--color-2) focus-visible:ring-offset-2
            "
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M2 8l12-6-6 12V8H2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Per apertura di selezione file, normale che non abbia il focus */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".mp3,.m4a,.m4p,.wav,audio/mpeg,audio/mp4,audio/wav"
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="flex items-center justify-between mt-1.5 px-1">
          <p className="text-xs text-(--text-4)">Invio per inviare · Shift+Invio per andare a capo</p>
          <p className={`text-xs tabular-nums transition-colors ${counterColorClass}`}>
            {formattedCharCount}
          </p>
        </div>
      </div>
    </main>
  );
};