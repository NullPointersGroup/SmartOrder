import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';

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

// ---------------------------------------------------------------------------
// Helper: crea un mock di MediaRecorder controllabile
// Nota: vi.fn() deve usare una vera funzione costruttore (non arrow function)
// per poter essere usato con `new`. Usiamo mockImplementation con function.
// ---------------------------------------------------------------------------
function makeMediaRecorderMock() {
  const instance = {
    start: vi.fn(),
    stop: vi.fn(),
    ondataavailable: null as ((e: { data: Blob }) => void) | null,
    onstop: null as (() => void) | null,
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Ctor = vi.fn().mockImplementation(function () { return instance; }) as any;
  return { Ctor, instance };
}

// ---------------------------------------------------------------------------
// Helper: crea un mock di getUserMedia
// ---------------------------------------------------------------------------
function makeGetUserMediaMock(stream?: MediaStream) {
  const mockStream = stream ?? {
    getTracks: () => [{ stop: vi.fn() }],
  } as unknown as MediaStream;
  return vi.fn().mockResolvedValue(mockStream);
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

// ---------------------------------------------------------------------------
// Stato senza conversazione attiva
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Stato con conversazione attiva
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Messaggi
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Loading
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Input e invio
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Limite caratteri
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Registrazione audio – pulsanti (visibilità / stato disabilitato)
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// handleMicClick – avvio registrazione (righe 97-127)
// ---------------------------------------------------------------------------
describe('ChatArea – handleMicClick: avvio registrazione', () => {
  let originalMediaDevices: MediaDevices;
  let originalMediaRecorder: typeof MediaRecorder;

  beforeEach(() => {
    originalMediaDevices = navigator.mediaDevices;
    originalMediaRecorder = globalThis.MediaRecorder;
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'mediaDevices', {
      value: originalMediaDevices,
      configurable: true,
    });
    globalThis.MediaRecorder = originalMediaRecorder;
    vi.restoreAllMocks();
  });

  it('non fa nulla se isSending=true (guard riga 98)', async () => {
    const { Ctor } = makeMediaRecorderMock();
    globalThis.MediaRecorder = Ctor as unknown as typeof MediaRecorder;
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: makeGetUserMediaMock() },
      configurable: true,
    });
    renderChat({ hasActiveConv: true, isSending: true });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /registra messaggio vocale/i }));
    });
    // Il pulsante è disabled quando isSending=true, quindi getUserMedia non viene chiamato
    expect(Ctor).not.toHaveBeenCalled();
  });

  it('avvia la registrazione e mostra il banner "Registrazione in corso"', async () => {
    const { Ctor } = makeMediaRecorderMock();
    globalThis.MediaRecorder = Ctor as unknown as typeof MediaRecorder;
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: makeGetUserMediaMock() },
      configurable: true,
    });
    renderChat({ hasActiveConv: true });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /registra messaggio vocale/i }));
      // Flush microtask queue so the async getUserMedia promise resolves inside act
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(screen.getByText(/registrazione in corso/i)).toBeInTheDocument();
  });

  it('dopo l\'avvio il pulsante cambia aria-label a "Ferma registrazione"', async () => {
    const { Ctor } = makeMediaRecorderMock();
    globalThis.MediaRecorder = Ctor as unknown as typeof MediaRecorder;
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: makeGetUserMediaMock() },
      configurable: true,
    });
    renderChat({ hasActiveConv: true });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /registra messaggio vocale/i }));
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(screen.getByRole('button', { name: /ferma registrazione/i })).toBeInTheDocument();
  });

  it('chiama recorder.start() quando si avvia la registrazione', async () => {
    const { Ctor, instance } = makeMediaRecorderMock();
    globalThis.MediaRecorder = Ctor as unknown as typeof MediaRecorder;
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: makeGetUserMediaMock() },
      configurable: true,
    });
    renderChat({ hasActiveConv: true });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /registra messaggio vocale/i }));
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(instance.start).toHaveBeenCalledTimes(1);
  });

  it('ferma la registrazione al secondo click e chiama recorder.stop()', async () => {
    const { Ctor, instance } = makeMediaRecorderMock();
    globalThis.MediaRecorder = Ctor as unknown as typeof MediaRecorder;
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: makeGetUserMediaMock() },
      configurable: true,
    });
    renderChat({ hasActiveConv: true });
    // Primo click: avvia
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /registra messaggio vocale/i }));
      await Promise.resolve();
      await Promise.resolve();
    });
    // Secondo click: ferma (riga 100-103)
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /ferma registrazione/i }));
    });
    expect(instance.stop).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(/registrazione in corso/i)).not.toBeInTheDocument();
  });

  it('onstop chiama onAudioRecord con il blob e ferma i track (righe 115-119)', async () => {
    const onAudioRecord = vi.fn();
    const stopTrack = vi.fn();
    const mockStream = { getTracks: () => [{ stop: stopTrack }] } as unknown as MediaStream;
    const { Ctor, instance } = makeMediaRecorderMock();
    globalThis.MediaRecorder = Ctor as unknown as typeof MediaRecorder;
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: vi.fn().mockResolvedValue(mockStream) },
      configurable: true,
    });
    renderChat({ hasActiveConv: true, onAudioRecord });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /registra messaggio vocale/i }));
      await Promise.resolve();
      await Promise.resolve();
    });
    // Simula ondataavailable con un chunk audio
    act(() => {
      instance.ondataavailable?.({ data: new Blob(['audio'], { type: 'audio/webm' }) });
    });
    // Simula onstop
    act(() => {
      instance.onstop?.();
    });
    expect(onAudioRecord).toHaveBeenCalledTimes(1);
    expect(onAudioRecord.mock.calls[0][0]).toBeInstanceOf(Blob);
    expect(stopTrack).toHaveBeenCalled();
  });

  it('ondataavailable ignora chunk con size=0 (riga 112)', async () => {
    const onAudioRecord = vi.fn();
    const { Ctor, instance } = makeMediaRecorderMock();
    globalThis.MediaRecorder = Ctor as unknown as typeof MediaRecorder;
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: makeGetUserMediaMock() },
      configurable: true,
    });
    renderChat({ hasActiveConv: true, onAudioRecord });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /registra messaggio vocale/i }));
      await Promise.resolve();
      await Promise.resolve();
    });
    act(() => {
      // Chunk vuoto: size=0, non deve essere aggiunto
      instance.ondataavailable?.({ data: new Blob([], { type: 'audio/webm' }) });
    });
    act(() => { instance.onstop?.(); });
    // Il blob risultante non conterrà chunk, ma onAudioRecord viene comunque chiamato
    expect(onAudioRecord).toHaveBeenCalledTimes(1);
  });

  it('mostra alert se getUserMedia fallisce (riga 125)', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const { Ctor } = makeMediaRecorderMock();
    globalThis.MediaRecorder = Ctor as unknown as typeof MediaRecorder;
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: vi.fn().mockRejectedValue(new Error('denied')) },
      configurable: true,
    });
    renderChat({ hasActiveConv: true });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /registra messaggio vocale/i }));
    });
    expect(alertSpy).toHaveBeenCalledWith(
      expect.stringMatching(/impossibile accedere al microfono/i),
    );
  });
});

// ---------------------------------------------------------------------------
// handleClipClick – apertura file input (righe 129-132)
// ---------------------------------------------------------------------------
describe('ChatArea – handleClipClick', () => {
  it('non fa nulla se isSending=true (guard riga 130)', () => {
    renderChat({ hasActiveConv: true, isSending: true });
    // Il pulsante è disabled, il click non propaga
    const btn = screen.getByRole('button', { name: /allega file audio/i });
    expect(btn).toBeDisabled();
  });

  it('non fa nulla se hasActiveConv=false (guard riga 130)', () => {
    renderChat({ hasActiveConv: false });
    const btn = screen.getByRole('button', { name: /allega file audio/i });
    expect(btn).toBeDisabled();
  });

  it('al click con conversazione attiva tenta di aprire il file picker (riga 131)', () => {
    renderChat({ hasActiveConv: true });
    // Non è possibile verificare direttamente fileInputRef.current.click()
    // ma possiamo verificare che il click non lanci eccezioni
    expect(() => {
      fireEvent.click(screen.getByRole('button', { name: /allega file audio/i }));
    }).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// handleFileChange – allegato file audio (righe 134-164)
// ---------------------------------------------------------------------------
describe('ChatArea – handleFileChange', () => {
  let originalURL: typeof URL;
  let originalAudio: typeof Audio;

  beforeEach(() => {
    originalURL = globalThis.URL;
    originalAudio = globalThis.Audio;
  });

  afterEach(() => {
    globalThis.URL = originalURL;
    globalThis.Audio = originalAudio;
    vi.restoreAllMocks();
  });

  /** Crea un File di test con dimensione e nome configurabili */
  function makeFile(sizeBytes: number, name = 'test.mp3'): File {
    const buf = new ArrayBuffer(sizeBytes);
    return new File([buf], name, { type: 'audio/mpeg' });
  }

  /** Simula il change event sull'input file nascosto */
  function triggerFileInput(container: HTMLElement, file: File) {
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(input, 'files', { value: [file], configurable: true });
    fireEvent.change(input);
  }

  it('ignora il change se non è selezionato nessun file (riga 136)', () => {
    const onAudioAttach = vi.fn();
    const { container } = renderChat({ hasActiveConv: true, onAudioAttach });
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(input, 'files', { value: [], configurable: true });
    fireEvent.change(input);
    expect(onAudioAttach).not.toHaveBeenCalled();
  });

  it('mostra alert e non chiama onAudioAttach se il file supera 10 MB (righe 139-143)', () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const onAudioAttach = vi.fn();
    const { container } = renderChat({ hasActiveConv: true, onAudioAttach });
    const bigFile = makeFile(11 * 1024 * 1024); // 11 MB
    triggerFileInput(container, bigFile);
    expect(alertSpy).toHaveBeenCalledWith(expect.stringMatching(/non può superare/i));
    expect(onAudioAttach).not.toHaveBeenCalled();
  });

  it('chiama onAudioAttach con file valido (dimensione ok, durata ok) (riga 155)', () => {
    const onAudioAttach = vi.fn();
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    // Audio deve essere un costruttore valido: usiamo mockImplementation con function()
    const mockAudio = {
      onloadedmetadata: null as (() => void) | null,
      onerror: null as (() => void) | null,
      duration: 60,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    globalThis.Audio = vi.fn().mockImplementation(function () { return mockAudio; }) as any;

    const { container } = renderChat({ hasActiveConv: true, onAudioAttach });
    const file = makeFile(1 * 1024 * 1024); // 1 MB
    triggerFileInput(container, file);

    act(() => { mockAudio.onloadedmetadata?.(); });

    expect(onAudioAttach).toHaveBeenCalledWith(file);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock');
  });

  it('mostra alert se la durata supera 120 minuti (righe 151-153)', () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const onAudioAttach = vi.fn();
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    const mockAudio = {
      onloadedmetadata: null as (() => void) | null,
      onerror: null as (() => void) | null,
      duration: 121 * 60, // 121 minuti
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    globalThis.Audio = vi.fn().mockImplementation(function () { return mockAudio; }) as any;

    const { container } = renderChat({ hasActiveConv: true, onAudioAttach });
    triggerFileInput(container, makeFile(1 * 1024 * 1024));
    act(() => { mockAudio.onloadedmetadata?.(); });

    expect(alertSpy).toHaveBeenCalledWith(expect.stringMatching(/non può superare/i));
    expect(onAudioAttach).not.toHaveBeenCalled();
  });

  it('mostra alert se il file audio è corrotto (onerror) (righe 158-161)', () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    const mockAudio = {
      onloadedmetadata: null as (() => void) | null,
      onerror: null as (() => void) | null,
      duration: 0,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    globalThis.Audio = vi.fn().mockImplementation(function () { return mockAudio; }) as any;

    const { container } = renderChat({ hasActiveConv: true });
    triggerFileInput(container, makeFile(1 * 1024 * 1024));
    act(() => { mockAudio.onerror?.(); });

    expect(alertSpy).toHaveBeenCalledWith(expect.stringMatching(/impossibile leggere il file/i));
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock');
  });
});

// ---------------------------------------------------------------------------
// Accessibilità
// ---------------------------------------------------------------------------
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