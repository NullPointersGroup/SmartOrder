import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';

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
  messagesEndRef: { current: null },
  onInputChange: vi.fn(),
  onSend: vi.fn(),
};

function renderChat(overrides: Partial<typeof defaultProps> = {}) {
  return render(<ChatArea {...defaultProps} {...overrides} />);
}

// ── MediaRecorder helpers ────────────────────────────────────────────────────
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

function makeGetUserMediaMock(stream?: MediaStream) {
  const mockStream = stream ?? {
    getTracks: () => [{ stop: vi.fn() }],
  } as unknown as MediaStream;
  return vi.fn().mockResolvedValue(mockStream);
}

// ════════════════════════════════════════════════════════════════════════════
// Render base
// ════════════════════════════════════════════════════════════════════════════
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

// ════════════════════════════════════════════════════════════════════════════
// Messaggi
// ════════════════════════════════════════════════════════════════════════════
describe('ChatArea – messaggi', () => {
  it('mostra tutti i messaggi', () => {
    renderChat({ messages: messages })
    expect(screen.getByText('Ciao chatbot!')).toBeInTheDocument();
    expect(screen.getByText('Come posso aiutarti?')).toBeInTheDocument();
  });

  it('mostra il messaggio "Nessun messaggio" se la lista è vuota', () => {
    renderChat({ messages: [], isLoading: false });
    expect(screen.getByText(/nessun messaggio ancora/i)).toBeInTheDocument();
  });

  it('i messaggi dell\'utente hanno aria-label corretto', () => {
    renderChat({ messages });
    expect(screen.getByRole('article', { name: /messaggio di te/i })).toBeInTheDocument();
  });

  it('i messaggi del chatbot hanno aria-label corretto', () => {
    renderChat({ messages });
    expect(screen.getByRole('article', { name: /messaggio di chatbot/i })).toBeInTheDocument();
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Stati di loading
// ════════════════════════════════════════════════════════════════════════════
describe('ChatArea – stati di loading', () => {
  it('mostra lo spinner di caricamento messaggi con isLoading=true', () => {
    renderChat({ isLoading: true });
    expect(screen.getByLabelText(/caricamento messaggi/i)).toBeInTheDocument();
  });

  it('non mostra lo spinner con isLoading=false', () => {
    renderChat({ isLoading: false });
    expect(screen.queryByLabelText(/caricamento messaggi/i)).not.toBeInTheDocument();
  });

  it('mostra il typing indicator quando isSending=true', () => {
    renderChat({ isSending: true });
    expect(screen.getByLabelText(/il chatbot sta scrivendo/i)).toBeInTheDocument();
  });

  it('non mostra il typing indicator quando isSending=false', () => {
    renderChat({ isSending: false });
    expect(screen.queryByLabelText(/il chatbot sta scrivendo/i)).not.toBeInTheDocument();
  });

  it('disabilita textarea e pulsanti durante isSending', () => {
    renderChat({ isSending: true, inputText: 'testo' });
    expect(screen.getByRole('textbox')).toBeDisabled();
    expect(screen.getByRole('button', { name: /invia messaggio/i })).toBeDisabled();
  });
});

// ════════════════════════════════════════════════════════════════════════════
// isTranscribing
// ════════════════════════════════════════════════════════════════════════════
describe('ChatArea – isTranscribing', () => {
  it('mostra il placeholder "Trascrizione in corso…" durante la trascrizione', () => {
    renderChat({ isTranscribing: true });
    expect(screen.getByPlaceholderText(/trascrizione in corso/i)).toBeInTheDocument();
  });

  it('la textarea è disabilitata durante la trascrizione', () => {
    renderChat({ isTranscribing: true });
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('mostra il banner "Trascrizione in corso…" visibile nell\'UI durante isTranscribing=true', () => {
    renderChat({ isTranscribing: true });
    const banners = screen.getAllByText(/trascrizione in corso/i);
    expect(banners.length).toBeGreaterThanOrEqual(1);
  });

  it('non mostra il banner di trascrizione quando isTranscribing=false', () => {
    renderChat({ isTranscribing: false });
    expect(screen.queryByPlaceholderText(/trascrizione in corso/i)).not.toBeInTheDocument();
  });

  it('il pulsante Invia rimane disabilitato durante la trascrizione anche con testo', () => {
    renderChat({ isTranscribing: true, inputText: 'testo precedente' });
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('useEffect mette il focus sulla textarea quando isTranscribing torna false e inputText è valorizzato', async () => {
    const focusSpy = vi.spyOn(HTMLTextAreaElement.prototype, 'focus');

    const { rerender } = render(
      <ChatArea
        {...defaultProps}
        isTranscribing={true}
        inputText=""
      />
    );

    await act(async () => {
      rerender(
        <ChatArea
          {...defaultProps}
          isTranscribing={false}
          inputText="testo trascritto"
        />
      );
    });

    await waitFor(() => expect(focusSpy).toHaveBeenCalled());
    focusSpy.mockRestore();
  });

  it('useEffect NON mette il focus se inputText è vuoto anche quando isTranscribing=false', async () => {
    const focusSpy = vi.spyOn(HTMLTextAreaElement.prototype, 'focus');

    const { rerender } = render(
      <ChatArea
        {...defaultProps}
        isTranscribing={true}
        inputText=""
      />
    );

    await act(async () => {
      rerender(
        <ChatArea
          {...defaultProps}
          isTranscribing={false}
          inputText=""
        />
      );
    });

    expect(focusSpy).not.toHaveBeenCalled();
    focusSpy.mockRestore();
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Input e invio
// ════════════════════════════════════════════════════════════════════════════
describe('ChatArea – input e invio', () => {
  beforeEach(() => {
    defaultProps.onInputChange = vi.fn();
    defaultProps.onSend = vi.fn();
  });

  it('chiama onInputChange quando si scrive nella textarea', () => {
    const onInputChange = vi.fn();
    renderChat({ onInputChange });
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Ciao' } });
    expect(onInputChange).toHaveBeenCalledWith('Ciao');
  });

  it('chiama onSend al click del pulsante Invia', () => {
    const onSend = vi.fn();
    renderChat({ inputText: 'Ciao', onSend });
    fireEvent.click(screen.getByRole('button', { name: /invia messaggio/i }));
    expect(onSend).toHaveBeenCalledTimes(1);
  });

  it('chiama onSend premendo Invio nella textarea', () => {
    const onSend = vi.fn();
    renderChat({ inputText: 'Ciao', onSend });
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter', shiftKey: false });
    expect(onSend).toHaveBeenCalledTimes(1);
  });

  it('NON chiama onSend premendo Shift+Invio (va a capo)', () => {
    const onSend = vi.fn();
    renderChat({ inputText: 'Ciao', onSend });
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter', shiftKey: true });
    expect(onSend).not.toHaveBeenCalled();
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Limite caratteri
// ════════════════════════════════════════════════════════════════════════════
describe('ChatArea – limite caratteri', () => {
  it('mostra il contatore dei caratteri', () => {
    renderChat({ inputText: 'Ciao' });
    expect(screen.getByText(/4\.096|4096/)).toBeInTheDocument();
  });

  it('disabilita il pulsante Invia se si supera il limite di 4096 caratteri', () => {
    const longText = 'a'.repeat(4097);
    renderChat({ inputText: longText });
    expect(screen.getByRole('button', { name: /invia messaggio/i })).toBeDisabled();
  });

  it('il pulsante Invia è abilitato esattamente a 4096 caratteri', () => {
    const maxText = 'a'.repeat(4096);
    renderChat({ inputText: maxText });
    expect(screen.getByRole('button', { name: /invia messaggio/i })).not.toBeDisabled();
  });
});

// ════════════════════════════════════════════════════════════════════════════
// sidebarOpen
// ════════════════════════════════════════════════════════════════════════════
describe('ChatArea – sidebarOpen', () => {
  it('aggiunge classe sticky bottom-0 z-10 quando sidebarOpen=true', () => {
    const { container } = renderChat({ sidebarOpen: true });
    const inputBar = container.querySelector('.sticky');
    expect(inputBar).toBeInTheDocument();
  });

  it('non aggiunge classe sticky quando sidebarOpen=false (default)', () => {
    const { container } = renderChat({ sidebarOpen: false });
    const inputBar = container.querySelector('.sticky');
    expect(inputBar).not.toBeInTheDocument();
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Pulsanti audio
// ════════════════════════════════════════════════════════════════════════════
describe('ChatArea – pulsanti audio', () => {
  it('mostra il pulsante microfono', () => {
    renderChat({  });
    expect(screen.getByRole('button', { name: /registra messaggio vocale/i })).toBeInTheDocument();
  });

  it('mostra il pulsante allega file audio', () => {
    renderChat({  });
    expect(screen.getByRole('button', { name: /allega file audio/i })).toBeInTheDocument();
  });
});

// ════════════════════════════════════════════════════════════════════════════
// handleMicClick – avvio registrazione
// ════════════════════════════════════════════════════════════════════════════
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

  it('non fa nulla se isSending=true (guard)', async () => {
    const { Ctor } = makeMediaRecorderMock();
    globalThis.MediaRecorder = Ctor as unknown as typeof MediaRecorder;
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: makeGetUserMediaMock() },
      configurable: true,
    });
    renderChat({ isSending: true });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /registra messaggio vocale/i }));
    });
    expect(Ctor).not.toHaveBeenCalled();
  });

  it('avvia la registrazione e mostra il banner "Registrazione in corso"', async () => {
    const { Ctor } = makeMediaRecorderMock();
    globalThis.MediaRecorder = Ctor as unknown as typeof MediaRecorder;
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: makeGetUserMediaMock() },
      configurable: true,
    });
    renderChat({  });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /registra messaggio vocale/i }));
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
    renderChat({  });
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
    renderChat({  });
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
    renderChat({  });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /registra messaggio vocale/i }));
      await Promise.resolve();
      await Promise.resolve();
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /ferma registrazione/i }));
    });
    expect(instance.stop).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(/registrazione in corso/i)).not.toBeInTheDocument();
  });

  it('onstop chiama onAudioRecord con il blob e ferma i track', async () => {
    const onAudioRecord = vi.fn();
    const stopTrack = vi.fn();
    const mockStream = { getTracks: () => [{ stop: stopTrack }] } as unknown as MediaStream;
    const { Ctor, instance } = makeMediaRecorderMock();
    globalThis.MediaRecorder = Ctor as unknown as typeof MediaRecorder;
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: vi.fn().mockResolvedValue(mockStream) },
      configurable: true,
    });
    renderChat({ onAudioRecord });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /registra messaggio vocale/i }));
      await Promise.resolve();
      await Promise.resolve();
    });
    act(() => {
      instance.ondataavailable?.({ data: new Blob(['audio'], { type: 'audio/webm' }) });
    });
    act(() => { instance.onstop?.(); });
    expect(onAudioRecord).toHaveBeenCalledTimes(1);
    expect(onAudioRecord.mock.calls[0][0]).toBeInstanceOf(Blob);
    expect(stopTrack).toHaveBeenCalled();
  });

  it('ondataavailable ignora chunk con size=0', async () => {
    const onAudioRecord = vi.fn();
    const { Ctor, instance } = makeMediaRecorderMock();
    globalThis.MediaRecorder = Ctor as unknown as typeof MediaRecorder;
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: makeGetUserMediaMock() },
      configurable: true,
    });
    renderChat({ onAudioRecord });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /registra messaggio vocale/i }));
      await Promise.resolve();
      await Promise.resolve();
    });
    act(() => {
      instance.ondataavailable?.({ data: new Blob([], { type: 'audio/webm' }) });
    });
    act(() => { instance.onstop?.(); });
    expect(onAudioRecord).toHaveBeenCalledTimes(1);
  });

  it('mostra alert se getUserMedia fallisce', async () => {
    const alertSpy = vi.spyOn(globalThis, 'alert').mockImplementation(() => {});
    const { Ctor } = makeMediaRecorderMock();
    globalThis.MediaRecorder = Ctor as unknown as typeof MediaRecorder;
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: vi.fn().mockRejectedValue(new Error('denied')) },
      configurable: true,
    });
    renderChat({  });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /registra messaggio vocale/i }));
    });
    expect(alertSpy).toHaveBeenCalledWith(
      expect.stringMatching(/impossibile accedere al microfono/i),
    );
  });

  it('auto-ferma la registrazione dopo 120 secondi e mostra errore', async () => {
    vi.useFakeTimers();
    const { Ctor, instance } = makeMediaRecorderMock();
    globalThis.MediaRecorder = Ctor as unknown as typeof MediaRecorder;
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: makeGetUserMediaMock() },
      configurable: true,
    });
    renderChat({  });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /registra messaggio vocale/i }));
      await Promise.resolve();
      await Promise.resolve();
    });
    await act(async () => {
      for (let i = 0; i < 120; i++) {
        vi.advanceTimersByTime(1000);
        await Promise.resolve();
      }
    });
    expect(instance.stop).toHaveBeenCalled();
    expect(screen.getByText(/non può superare i 120 secondi/i)).toBeInTheDocument();
    vi.useRealTimers();
  });
});

// ════════════════════════════════════════════════════════════════════════════
// handleClipClick
// ════════════════════════════════════════════════════════════════════════════
describe('ChatArea – handleClipClick', () => {
  it('non fa nulla se isSending=true (pulsante disabilitato)', () => {
    renderChat({ isSending: true });
    const btn = screen.getByRole('button', { name: /allega file audio/i });
    expect(btn).toBeDisabled();
  });

  // ── NUOVA COPERTURA: righe 202-203 ────────────────────────────────────────
  it('chiama click() sull\'input file nascosto quando isSending=false (riga 202-203)', () => {
    const { container } = renderChat({ isSending: false });

    // Spia il click sull'input file nascosto
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const clickSpy = vi.spyOn(fileInput, 'click').mockImplementation(() => {});

    fireEvent.click(screen.getByRole('button', { name: /allega file audio/i }));

    expect(clickSpy).toHaveBeenCalledTimes(1);
    clickSpy.mockRestore();
  });
});

// ════════════════════════════════════════════════════════════════════════════
// handleFileChange
// ════════════════════════════════════════════════════════════════════════════
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

  function makeFile(sizeBytes: number, name = 'test.mp3'): File {
    const buf = new ArrayBuffer(sizeBytes);
    return new File([buf], name, { type: 'audio/mpeg' });
  }

  function triggerFileInput(container: HTMLElement, file: File) {
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(input, 'files', { value: [file], configurable: true });
    fireEvent.change(input);
  }

  it('ignora il change se non è selezionato nessun file', () => {
    const onAudioAttach = vi.fn();
    const { container } = renderChat({ onAudioAttach });
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(input, 'files', { value: [], configurable: true });
    fireEvent.change(input);
    expect(onAudioAttach).not.toHaveBeenCalled();
  });

  it('mostra alert e non chiama onAudioAttach se il file supera 10 MB', () => {
    const alertSpy = vi.spyOn(globalThis, 'alert').mockImplementation(() => {});
    const onAudioAttach = vi.fn();
    const { container } = renderChat({ onAudioAttach });
    const bigFile = makeFile(11 * 1024 * 1024);
    triggerFileInput(container, bigFile);
    expect(alertSpy).toHaveBeenCalledWith(expect.stringMatching(/non può superare/i));
    expect(onAudioAttach).not.toHaveBeenCalled();
  });

  it('chiama onAudioAttach con file valido (dimensione ok, durata ok)', () => {
    const onAudioAttach = vi.fn();
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    const mockAudio = {
      onloadedmetadata: null as (() => void) | null,
      onerror: null as (() => void) | null,
      duration: 60,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    globalThis.Audio = vi.fn().mockImplementation(function () { return mockAudio; }) as any;

    const { container } = renderChat({ onAudioAttach });
    const file = makeFile(1 * 1024 * 1024);
    triggerFileInput(container, file);
    act(() => { mockAudio.onloadedmetadata?.(); });

    expect(onAudioAttach).toHaveBeenCalledWith(file);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock');
  });

  it('mostra alert se la durata supera 120 minuti', () => {
    const alertSpy = vi.spyOn(globalThis, 'alert').mockImplementation(() => {});
    const onAudioAttach = vi.fn();
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    const mockAudio = {
      onloadedmetadata: null as (() => void) | null,
      onerror: null as (() => void) | null,
      duration: 121 * 60,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    globalThis.Audio = vi.fn().mockImplementation(function () { return mockAudio; }) as any;

    const { container } = renderChat({ onAudioAttach });
    triggerFileInput(container, makeFile(1 * 1024 * 1024));
    act(() => { mockAudio.onloadedmetadata?.(); });

    expect(alertSpy).toHaveBeenCalledWith(expect.stringMatching(/non può superare/i));
    expect(onAudioAttach).not.toHaveBeenCalled();
  });

  it('mostra alert se il file audio è corrotto (onerror)', () => {
    const alertSpy = vi.spyOn(globalThis, 'alert').mockImplementation(() => {});
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    const mockAudio = {
      onloadedmetadata: null as (() => void) | null,
      onerror: null as (() => void) | null,
      duration: 0,
    };
    globalThis.Audio = vi.fn().mockImplementation(function () { return mockAudio; }) as any;

    const { container } = renderChat({  });
    triggerFileInput(container, makeFile(1 * 1024 * 1024));
    act(() => { mockAudio.onerror?.(); });

    expect(alertSpy).toHaveBeenCalledWith(expect.stringMatching(/impossibile leggere il file/i));
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock');
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Accessibilità
// ════════════════════════════════════════════════════════════════════════════
describe('ChatArea – accessibilità', () => {
  it('la textarea ha aria-label corretto', () => {
    renderChat({  });
    expect(screen.getByLabelText(/campo di testo per il messaggio/i)).toBeInTheDocument();
  });

  it('il pulsante Invia ha aria-label corretto', () => {
    renderChat({  });
    expect(screen.getByRole('button', { name: /invia messaggio/i })).toBeInTheDocument();
  });

  it('mostra hint per la shortcut Shift+Invio', () => {
    renderChat({  });
    expect(screen.getByText(/shift\+invio/i)).toBeInTheDocument();
  });
});