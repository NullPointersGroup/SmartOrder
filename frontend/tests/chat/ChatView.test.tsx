import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';

import { ChatView } from '../../src/chat/ChatView';

// ─── Mock window.matchMedia (non esiste in jsdom) ─────────────────────────────

function mockMatchMedia(matches: boolean) {
  Object.defineProperty(globalThis, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

// ─── Mock useChatViewModel ────────────────────────────────────────────────────

const mockSetError = vi.fn();
const mockSetInputText = vi.fn();
const mockSendMessage = vi.fn();
const mockLogout = vi.fn();
const mockSelectConversation = vi.fn();
const mockCreateConversation = vi.fn();
const mockRenameConversation = vi.fn();
const mockDeleteConversation = vi.fn();
const messagesEndRef = { current: null };

const baseVm = {
  username: 'mario',
  error: null as string | null,
  setError: mockSetError,
  messages: [],
  isLoadingMsgs: false,
  isSending: false,
  inputText: '',
  activeConvId: null as number | null,
  cartProducts: [],
  messagesEndRef,
  setInputText: mockSetInputText,
  sendMessage: mockSendMessage,
  logout: mockLogout,
  selectConversation: mockSelectConversation,
  createConversation: mockCreateConversation,
  renameConversation: mockRenameConversation,
  deleteConversation: mockDeleteConversation,
  conversations: [],
};

let vmOverrides: Partial<typeof baseVm> = {};

vi.mock('../../src/chat/ChatViewModel', () => ({
  useChatViewModel: () => ({ ...baseVm, ...vmOverrides }),
}));

// ─── Mock componenti figli pesanti ────────────────────────────────────────────

vi.mock('../../src/chat/ConversationSidebar', () => ({
  ConversationSidebar: ({ onToggleSelf }: { onToggleSelf: () => void }) => (
    <div data-testid="conv-sidebar">
      <button onClick={onToggleSelf} title="Chiudi conversazioni">chiudi sx</button>
    </div>
  ),
}));

vi.mock('../../src/chat/CartSidebar', () => ({
  CartSidebar: ({ onToggleSelf }: { onToggleSelf: () => void }) => (
    <div data-testid="cart-sidebar">
      <button onClick={onToggleSelf} title="Chiudi carrello">chiudi dx</button>
    </div>
  ),
}));

vi.mock('../../src/chat/ChatArea', () => ({
  ChatArea: ({ hasActiveConv }: { hasActiveConv: boolean }) => (
    <div data-testid="chat-area" data-active={String(hasActiveConv)} />
  ),
}));

vi.mock('../../src/chat/NavBar', () => ({
  NavBar: ({ onProfile, onLogout }: { onProfile: () => void; onLogout: () => void }) => (
    <nav data-testid="navbar">
      <button onClick={onProfile} title="Apri profilo">profilo</button>
      <button onClick={onLogout} title="Logout">logout</button>
    </nav>
  ),
}));

vi.mock('../../src/chat/Profile', () => ({
  Profile: ({ onClose, onLogout }: { onClose: () => void; onLogout: () => void }) => (
    <div data-testid="profile-panel">
      <button onClick={onClose} title="Chiudi profilo">chiudi profilo</button>
      <button onClick={onLogout} title="Logout profilo">logout profilo</button>
    </div>
  ),
}));

vi.mock('../../src/chat/ConversationSidebar', () => ({
  ConversationSidebar: ({
    onToggleSelf,
    onSelect,
  }: {
    onToggleSelf: () => void;
    onSelect: (id: number) => void;
  }) => (
    <div data-testid="conv-sidebar">
      <button onClick={() => onSelect(1)}>select conv</button>
      <button onClick={onToggleSelf} title="Chiudi conversazioni">chiudi sx</button>
    </div>
  ),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function renderView() {
  return render(<ChatView />);
}

// ─── Setup / Teardown ─────────────────────────────────────────────────────────

beforeEach(() => {
  vmOverrides = {};
  vi.useFakeTimers();
  // Di default simula schermo largo (≥960px): matches=false → isNarrow=false
  mockMatchMedia(false);
});

afterEach(() => {
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
  vi.clearAllMocks();
});

// ─── Render base ──────────────────────────────────────────────────────────────

describe('ChatView – render base', () => {
  it('renderizza la navbar', () => {
    renderView();
    expect(screen.getByTestId('navbar')).toBeInTheDocument();
  });

  it('renderizza la sidebar sinistra', () => {
    renderView();
    expect(screen.getByTestId('conv-sidebar')).toBeInTheDocument();
  });

  it('renderizza la ChatArea', () => {
    renderView();
    expect(screen.getByTestId('chat-area')).toBeInTheDocument();
  });

  it('renderizza la sidebar destra (carrello)', () => {
    renderView();
    expect(screen.getByTestId('cart-sidebar')).toBeInTheDocument();
  });

  it('NON mostra il pannello profilo di default', () => {
    renderView();
    expect(screen.queryByTestId('profile-panel')).not.toBeInTheDocument();
  });

  it('NON mostra il toast di errore di default', () => {
    renderView();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});

// ─── Profile panel ────────────────────────────────────────────────────────────

describe('ChatView – profilo', () => {
  it('apre il pannello profilo al click su "Apri profilo"', () => {
    renderView();
    fireEvent.click(screen.getByTitle('Apri profilo'));
    expect(screen.getByTestId('profile-panel')).toBeInTheDocument();
  });

  it('chiude il pannello profilo al click su "Chiudi profilo"', () => {
    renderView();
    fireEvent.click(screen.getByTitle('Apri profilo'));
    fireEvent.click(screen.getByTitle('Chiudi profilo'));
    expect(screen.queryByTestId('profile-panel')).not.toBeInTheDocument();
  });
});

// ─── Sidebar sinistra ─────────────────────────────────────────────────────────

describe('ChatView – sidebar sinistra', () => {
  it('di default la sidebar sinistra è aperta (ConversationSidebar visibile)', () => {
    renderView();
    expect(screen.getByTestId('conv-sidebar')).toBeInTheDocument();
    // In wide mode il pulsante "Apri conversazioni" è nel collapsed slot, non visibile
    expect(screen.queryByTitle('Apri conversazioni')).not.toBeInTheDocument();
  });

  it('chiude la sidebar sinistra al click su "chiudi sx"', () => {
    renderView();
    fireEvent.click(screen.getByTitle('Chiudi conversazioni'));
    expect(screen.getByTitle('Apri conversazioni')).toBeInTheDocument();
  });

  it('riapre la sidebar sinistra al click su "Apri conversazioni"', () => {
    renderView();
    fireEvent.click(screen.getByTitle('Chiudi conversazioni'));
    fireEvent.click(screen.getByTitle('Apri conversazioni'));
    expect(screen.queryByTitle('Apri conversazioni')).not.toBeInTheDocument();
  });
});

// ─── Sidebar destra ───────────────────────────────────────────────────────────

describe('ChatView – sidebar destra (carrello)', () => {
  it('di default la sidebar destra è aperta (CartSidebar visibile)', () => {
    renderView();
    expect(screen.getByTestId('cart-sidebar')).toBeInTheDocument();
    expect(screen.queryByTitle('Apri carrello')).not.toBeInTheDocument();
  });

  it('chiude la sidebar destra al click su "chiudi dx"', () => {
    renderView();
    fireEvent.click(screen.getByTitle('Chiudi carrello'));
    expect(screen.getByTitle('Apri carrello')).toBeInTheDocument();
  });

  it('riapre la sidebar destra al click su "Apri carrello"', () => {
    renderView();
    fireEvent.click(screen.getByTitle('Chiudi carrello'));
    fireEvent.click(screen.getByTitle('Apri carrello'));
    expect(screen.queryByTitle('Apri carrello')).not.toBeInTheDocument();
  });
});

// ─── hasActiveConv passato a ChatArea ─────────────────────────────────────────

describe('ChatView – hasActiveConv', () => {
  it('passa hasActiveConv=false a ChatArea quando activeConvId è null', () => {
    vmOverrides = { activeConvId: null };
    renderView();
    expect(screen.getByTestId('chat-area').dataset.active).toBe('false');
  });

  it('passa hasActiveConv=true a ChatArea quando activeConvId è valorizzato', () => {
    vmOverrides = { activeConvId: 42 };
    renderView();
    expect(screen.getByTestId('chat-area').dataset.active).toBe('true');
  });
});

// ─── Error toast ──────────────────────────────────────────────────────────────

describe('ChatView – error toast', () => {
  it('mostra il toast quando vm.error è valorizzato', () => {
    vmOverrides = { error: 'Qualcosa è andato storto' };
    renderView();
    expect(screen.getByText('Qualcosa è andato storto')).toBeInTheDocument();
  });

  it('NON mostra il toast quando vm.error è null', () => {
    vmOverrides = { error: null };
    renderView();
    expect(screen.queryByText(/qualcosa/i)).not.toBeInTheDocument();
  });

  it('chiama setError(null) dopo 4000ms quando error è presente', () => {
    vmOverrides = { error: 'Errore temporaneo' };
    renderView();
    expect(mockSetError).not.toHaveBeenCalled();
    act(() => { vi.advanceTimersByTime(4000); });
    expect(mockSetError).toHaveBeenCalledWith(null);
  });

  it('il cleanup del useEffect cancella il timer se error cambia prima dei 4000ms', () => {
    vmOverrides = { error: 'Errore temporaneo' };
    const { rerender } = renderView();
    act(() => { vi.advanceTimersByTime(2000); });
    expect(mockSetError).not.toHaveBeenCalled();
    vmOverrides = { error: null };
    rerender(<ChatView />);
    act(() => { vi.advanceTimersByTime(4000); });
    expect(mockSetError).not.toHaveBeenCalled();
  });

  it('NON avvia il timer se error è null (branch !error → return)', () => {
    vmOverrides = { error: null };
    renderView();
    act(() => { vi.advanceTimersByTime(4000); });
    expect(mockSetError).not.toHaveBeenCalled();
  });
});

it('in modalità narrow chiude entrambe le sidebar all’avvio', () => {
  mockMatchMedia(true);
  renderView();

  expect(screen.getByTitle('Apri conversazioni')).toBeInTheDocument();
  expect(screen.getByTitle('Apri carrello')).toBeInTheDocument();
});

it('apre overlay sinistro in modalità narrow', () => {
  mockMatchMedia(true);
  renderView();

  fireEvent.click(screen.getByTitle('Apri conversazioni'));

  expect(screen.getByTestId('conv-sidebar')).toBeInTheDocument();
});

it('chiude overlay sinistro cliccando backdrop', () => {
  mockMatchMedia(true);
  renderView();

  fireEvent.click(screen.getByTitle('Apri conversazioni'));

  const backdrop = document.querySelector(String.raw`.bg-black\/30`);
  fireEvent.click(backdrop!);

  expect(screen.queryByTestId('conv-sidebar')).not.toBeInTheDocument();
});

it('in modalità narrow apre una sidebar e chiude l’altra', () => {
  mockMatchMedia(true);
  renderView();

  fireEvent.click(screen.getByTitle('Apri conversazioni'));
  expect(screen.getByTestId('conv-sidebar')).toBeInTheDocument();

  fireEvent.click(screen.getByTitle('Apri carrello'));

  expect(screen.getByTestId('cart-sidebar')).toBeInTheDocument();
  expect(screen.queryByTestId('conv-sidebar')).not.toBeInTheDocument();
});

it('apre overlay carrello in modalità narrow', () => {
  mockMatchMedia(true);
  renderView();

  fireEvent.click(screen.getByTitle('Apri carrello'));

  expect(screen.getByTestId('cart-sidebar')).toBeInTheDocument();
});

it('selectConversation chiude overlay e chiama VM', () => {
  mockMatchMedia(true);
  renderView();

  fireEvent.click(screen.getByTitle('Apri conversazioni'));
  fireEvent.click(screen.getByText('select conv'));

  expect(mockSelectConversation).toHaveBeenCalledWith(1);
  expect(screen.queryByTestId('conv-sidebar')).not.toBeInTheDocument();
});

it('onToggleSelf chiude overlay sinistro', () => {
  mockMatchMedia(true);
  renderView();

  fireEvent.click(screen.getByTitle('Apri conversazioni'));
  fireEvent.click(screen.getByTitle('Chiudi conversazioni'));

  expect(screen.queryByTestId('conv-sidebar')).not.toBeInTheDocument();
});

it('renderizza overlay carrello in modalità narrow quando aperto', () => {
  mockMatchMedia(true);
  renderView();

  fireEvent.click(screen.getByTitle('Apri carrello'));

  expect(screen.getByTestId('cart-sidebar')).toBeInTheDocument();
});

it('click sul backdrop chiude overlay carrello', () => {
  mockMatchMedia(true);
  renderView();

  fireEvent.click(screen.getByTitle('Apri carrello'));

  const backdrop = document.querySelector(String.raw`.bg-black\/30`);
  fireEvent.click(backdrop!);

  expect(screen.queryByTestId('cart-sidebar')).not.toBeInTheDocument();
});

it('onToggleSelf chiude overlay carrello', () => {
  mockMatchMedia(true);
  renderView();

  fireEvent.click(screen.getByTitle('Apri carrello'));
  fireEvent.click(screen.getByTitle('Chiudi carrello'));

  expect(screen.queryByTestId('cart-sidebar')).not.toBeInTheDocument();
});

it('apre carrello e chiude sidebar sinistra in modalità narrow', () => {
  mockMatchMedia(true);
  renderView();

  fireEvent.click(screen.getByTitle('Apri conversazioni'));
  expect(screen.getByTestId('conv-sidebar')).toBeInTheDocument();

  fireEvent.click(screen.getByTitle('Apri carrello'));

  expect(screen.getByTestId('cart-sidebar')).toBeInTheDocument();
  expect(screen.queryByTestId('conv-sidebar')).not.toBeInTheDocument();
});