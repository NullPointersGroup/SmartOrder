import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent} from '@testing-library/react';

import { ChatArea } from '../../src/chat/ChatArea';
import type { Message } from '../../src/chat/ChatModel';

const messages: Message[] = [
  { id_messaggio: 1, mittente: 'Utente',  contenuto: 'Ciao chatbot!' },
  { id_messaggio: 2, mittente: 'Chatbot', contenuto: 'Come posso aiutarti?' },
];

type ChatAreaProps = React.ComponentProps<typeof ChatArea>;

const defaultProps: ChatAreaProps = {
  messages: [],
  isLoading: false,
  isSending: false,
  inputText: '',
  hasActiveConv: false,
  messagesEndRef: { current: null },
  onInputChange: vi.fn(),
  onSend: vi.fn(),
};

function renderChat(overrides: Partial<typeof defaultProps> = {}) {
  return render(<ChatArea {...defaultProps} {...overrides} />);
}

describe('ChatArea – render base', () => {
  it('ha il ruolo main con aria-label "Area chat"', () => {
    renderChat();
    expect(screen.getByRole('main', { name: /area chat/i })).toBeInTheDocument();
  });

  it('mostra il log dei messaggi', () => {
    renderChat();
    expect(screen.getByRole('log')).toBeInTheDocument();
  });
});

// Stato senza conversazione attiva
describe('ChatArea – senza conversazione attiva', () => {
  it('mostra il messaggio di invito a selezionare una conversazione', () => {
    renderChat({ hasActiveConv: false });
    expect(screen.getByText(/inizia una conversazione/i)).toBeInTheDocument();
  });

  it('la textarea è disabilitata', () => {
    renderChat({ hasActiveConv: false });
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('la textarea mostra il placeholder "Seleziona una conversazione"', () => {
    renderChat({ hasActiveConv: false });
    expect(screen.getByPlaceholderText(/seleziona una conversazione/i)).toBeInTheDocument();
  });

  it('il pulsante Invia è disabilitato', () => {
    renderChat({ hasActiveConv: false, inputText: 'testo' });
    expect(screen.getByRole('button', { name: /invia messaggio/i })).toBeDisabled();
  });
});

// Stato con conversazione attiva
describe('ChatArea – con conversazione attiva', () => {
  it('la textarea è abilitata', () => {
    renderChat({ hasActiveConv: true });
    expect(screen.getByRole('textbox')).not.toBeDisabled();
  });

  it('la textarea mostra il placeholder di scrittura', () => {
    renderChat({ hasActiveConv: true });
    expect(screen.getByPlaceholderText(/scrivi un messaggio/i)).toBeInTheDocument();
  });

  it('il pulsante Invia è disabilitato con inputText vuoto', () => {
    renderChat({ hasActiveConv: true, inputText: '' });
    expect(screen.getByRole('button', { name: /invia messaggio/i })).toBeDisabled();
  });

  it('il pulsante Invia è abilitato con inputText non vuoto', () => {
    renderChat({ hasActiveConv: true, inputText: 'Ciao' });
    expect(screen.getByRole('button', { name: /invia messaggio/i })).not.toBeDisabled();
  });
});

// Messaggi
describe('ChatArea – messaggi', () => {
  it('mostra tutti i messaggi', () => {
    renderChat({ hasActiveConv: true, messages });
    expect(screen.getByText('Ciao chatbot!')).toBeInTheDocument();
    expect(screen.getByText('Come posso aiutarti?')).toBeInTheDocument();
  });

  it('mostra il messaggio "Nessun messaggio" se la lista è vuota', () => {
    renderChat({ hasActiveConv: true, messages: [], isLoading: false });
    expect(screen.getByText(/nessun messaggio ancora/i)).toBeInTheDocument();
  });

  it('i messaggi dell\'utente hanno aria-label corretto', () => {
    renderChat({ hasActiveConv: true, messages });
    expect(screen.getByRole('article', { name: /messaggio di te/i })).toBeInTheDocument();
  });

  it('i messaggi del chatbot hanno aria-label corretto', () => {
    renderChat({ hasActiveConv: true, messages });
    expect(screen.getByRole('article', { name: /messaggio di chatbot/i })).toBeInTheDocument();
  });
});

// Loading
describe('ChatArea – stati di loading', () => {
  it('mostra lo spinner di caricamento messaggi con isLoading=true', () => {
    renderChat({ hasActiveConv: true, isLoading: true });
    expect(screen.getByLabelText(/caricamento messaggi/i)).toBeInTheDocument();
  });

  it('non mostra lo spinner con isLoading=false', () => {
    renderChat({ hasActiveConv: true, isLoading: false });
    expect(screen.queryByLabelText(/caricamento messaggi/i)).not.toBeInTheDocument();
  });

  it('mostra il typing indicator quando isSending=true', () => {
    renderChat({ hasActiveConv: true, isSending: true });
    expect(screen.getByLabelText(/il chatbot sta scrivendo/i)).toBeInTheDocument();
  });

  it('non mostra il typing indicator quando isSending=false', () => {
    renderChat({ hasActiveConv: true, isSending: false });
    expect(screen.queryByLabelText(/il chatbot sta scrivendo/i)).not.toBeInTheDocument();
  });

  it('disabilita textarea e pulsanti durante isSending', () => {
    renderChat({ hasActiveConv: true, isSending: true, inputText: 'testo' });
    expect(screen.getByRole('textbox')).toBeDisabled();
    expect(screen.getByRole('button', { name: /invia messaggio/i })).toBeDisabled();
  });
});

// Input e invio
describe('ChatArea – input e invio', () => {
  beforeEach(() => {
    defaultProps.onInputChange = vi.fn();
    defaultProps.onSend = vi.fn();
  });

  it('chiama onInputChange quando si scrive nella textarea', () => {
    const onInputChange = vi.fn();
    renderChat({ hasActiveConv: true, onInputChange });
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Ciao' } });
    expect(onInputChange).toHaveBeenCalledWith('Ciao');
  });

  it('chiama onSend al click del pulsante Invia', () => {
    const onSend = vi.fn();
    renderChat({ hasActiveConv: true, inputText: 'Ciao', onSend });
    fireEvent.click(screen.getByRole('button', { name: /invia messaggio/i }));
    expect(onSend).toHaveBeenCalledTimes(1);
  });

  it('chiama onSend premendo Invio nella textarea', () => {
    const onSend = vi.fn();
    renderChat({ hasActiveConv: true, inputText: 'Ciao', onSend });
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter', shiftKey: false });
    expect(onSend).toHaveBeenCalledTimes(1);
  });

  it('NON chiama onSend premendo Shift+Invio (va a capo)', () => {
    const onSend = vi.fn();
    renderChat({ hasActiveConv: true, inputText: 'Ciao', onSend });
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter', shiftKey: true });
    expect(onSend).not.toHaveBeenCalled();
  });
});

// Limite caratteri
describe('ChatArea – limite caratteri', () => {
  it('mostra il contatore dei caratteri', () => {
    renderChat({ hasActiveConv: true, inputText: 'Ciao' });
    expect(screen.getByText(/4\.096|4096/)).toBeInTheDocument();
  });

  it('disabilita il pulsante Invia se si supera il limite di 4096 caratteri', () => {
    const longText = 'a'.repeat(4097);
    renderChat({ hasActiveConv: true, inputText: longText });
    expect(screen.getByRole('button', { name: /invia messaggio/i })).toBeDisabled();
  });

  it('il pulsante Invia è abilitato esattamente a 4096 caratteri', () => {
    const maxText = 'a'.repeat(4096);
    renderChat({ hasActiveConv: true, inputText: maxText });
    expect(screen.getByRole('button', { name: /invia messaggio/i })).not.toBeDisabled();
  });
});

// Registrazione audio
describe('ChatArea – pulsanti audio', () => {
  it('mostra il pulsante microfono', () => {
    renderChat({ hasActiveConv: true });
    expect(screen.getByRole('button', { name: /registra messaggio vocale/i })).toBeInTheDocument();
  });

  it('il pulsante microfono è disabilitato senza conversazione attiva', () => {
    renderChat({ hasActiveConv: false });
    expect(screen.getByRole('button', { name: /registra messaggio vocale/i })).toBeDisabled();
  });

  it('mostra il pulsante allega file audio', () => {
    renderChat({ hasActiveConv: true });
    expect(screen.getByRole('button', { name: /allega file audio/i })).toBeInTheDocument();
  });

  it('il pulsante allega è disabilitato senza conversazione attiva', () => {
    renderChat({ hasActiveConv: false });
    expect(screen.getByRole('button', { name: /allega file audio/i })).toBeDisabled();
  });
});

// Accessibilità
describe('ChatArea – accessibilità', () => {
  it('la textarea ha aria-label corretto', () => {
    renderChat({ hasActiveConv: true });
    expect(screen.getByLabelText(/campo di testo per il messaggio/i)).toBeInTheDocument();
  });

  it('il pulsante Invia ha aria-label corretto', () => {
    renderChat({ hasActiveConv: true });
    expect(screen.getByRole('button', { name: /invia messaggio/i })).toBeInTheDocument();
  });

  it('mostra hint per la shortcut Shift+Invio', () => {
    renderChat({ hasActiveConv: true });
    expect(screen.getByText(/shift\+invio/i)).toBeInTheDocument();
  });
});
