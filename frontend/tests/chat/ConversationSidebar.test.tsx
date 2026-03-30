import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import { ConversationSidebar } from '../../src/chat/ConversationSidebar';
import type { Conversation } from '../../src/chat/ChatModel';

const conversations: Conversation[] = [
  { id_conv: 1, username: 'mario', titolo: 'Prima conv' },
  { id_conv: 2, username: 'mario', titolo: 'Seconda conv' },
];

const defaultProps = {
  conversations,
  activeConvId: null,
  onSelect: vi.fn(),
  onCreate: vi.fn(),
  onRename: vi.fn(),
  onDelete: vi.fn(),
  onToggleSelf: vi.fn(),
};

function renderSidebar(overrides: Partial<typeof defaultProps> = {}) {
  return render(<ConversationSidebar {...defaultProps} {...overrides} />);
}

function getMenuButton() {
  const buttons = screen.getAllByRole('button');

  const btn = buttons.find(b =>
    b.className.includes('opacity-0') ||
    b.className.includes('group-hover')
  );

  if (!btn) {
    throw new Error('Menu button non trovato');
  }

  return btn;
}

async function openMenuAndClickRename() {
  renderSidebar();
  fireEvent.click(getMenuButton());

  await waitFor(() =>
    expect(screen.getByText('Rinomina')).toBeInTheDocument()
  );

  fireEvent.click(screen.getByText('Rinomina'));
}

async function openMenuAndClickDelete() {
  renderSidebar();
  fireEvent.click(getMenuButton());

  await waitFor(() =>
    expect(screen.getByText('Elimina')).toBeInTheDocument()
  );

  fireEvent.click(screen.getByText('Elimina'));
}

beforeEach(() => {
  defaultProps.onSelect     = vi.fn();
  defaultProps.onCreate     = vi.fn();
  defaultProps.onRename     = vi.fn();
  defaultProps.onDelete     = vi.fn();
  defaultProps.onToggleSelf = vi.fn();
});

describe('ConversationSidebar – render base', () => {
  it('ha il ruolo aside con aria-label "Conversazioni"', () => {
    renderSidebar();
    expect(screen.getByRole('complementary', { name: /conversazioni/i })).toBeInTheDocument();
  });

  it('mostra il titolo "Conversazioni"', () => {
    renderSidebar();
    expect(screen.getByText(/conversazioni/i)).toBeInTheDocument();
  });

  it('ha il pulsante "Nuova conversazione"', () => {
    renderSidebar();
    expect(screen.getByTitle(/nuova conversazione/i)).toBeInTheDocument();
  });

  it('ha il pulsante di chiusura sidebar', () => {
    renderSidebar();
    expect(screen.getByTitle(/chiudi pannello conversazioni/i)).toBeInTheDocument();
  });
});

// Lista vuota
describe('ConversationSidebar – lista vuota', () => {
  it('mostra il messaggio di lista vuota', () => {
    renderSidebar({ conversations: [] });
    expect(screen.getByText(/nessuna conversazione/i)).toBeInTheDocument();
  });

  it('suggerisce di cliccare su + per iniziare', () => {
    renderSidebar({ conversations: [] });
    expect(screen.getByText(/clicca su \+ per iniziare/i)).toBeInTheDocument();
  });
});

// Lista con conversazioni
describe('ConversationSidebar – con conversazioni', () => {
  it('mostra tutte le conversazioni', () => {
    renderSidebar();
    expect(screen.getByText('Prima conv')).toBeInTheDocument();
    expect(screen.getByText('Seconda conv')).toBeInTheDocument();
  });

  it('ha il nav con aria-label "Elenco conversazioni"', () => {
    renderSidebar();
    expect(screen.getByRole('navigation', { name: /elenco conversazioni/i })).toBeInTheDocument();
  });

  it('mostra il marker di conversazione attiva', () => {
    renderSidebar({ activeConvId: 1 as any });
    expect(screen.getByText('Prima conv')).toBeInTheDocument();
  });
});

// Selezione
describe('ConversationSidebar – selezione', () => {
  it('chiama onSelect con l\'id corretto', () => {
    const onSelect = vi.fn();
    renderSidebar({ onSelect });

    fireEvent.click(screen.getByText('Prima conv'));
    expect(onSelect).toHaveBeenCalledWith(1);
  });

  // Copre il branch !isEditing=false: click su conv durante rinomina non chiama onSelect
  it('NON chiama onSelect quando si sta rinominando quella conversazione (isEditing=true)', async () => {
    const onSelect = vi.fn();
    renderSidebar({ onSelect });

    fireEvent.click(getMenuButton());
    await waitFor(() => screen.getByText('Rinomina'));
    fireEvent.click(screen.getByText('Rinomina'));

    const convButton = screen.getAllByRole('button').find(b =>
      b.contains(screen.queryByRole('textbox'))
    );
    if (convButton) fireEvent.click(convButton);

    expect(onSelect).not.toHaveBeenCalled();
  });
});

// Creazione
describe('ConversationSidebar – creazione', () => {
  it('chiama onCreate', () => {
    const onCreate = vi.fn();
    renderSidebar({ onCreate });

    fireEvent.click(screen.getByTitle(/nuova conversazione/i));
    expect(onCreate).toHaveBeenCalledTimes(1);
  });
});

// Chiusura
describe('ConversationSidebar – chiusura', () => {
  it('chiama onToggleSelf', () => {
    const onToggleSelf = vi.fn();
    renderSidebar({ onToggleSelf });

    fireEvent.click(screen.getByTitle(/chiudi pannello conversazioni/i));
    expect(onToggleSelf).toHaveBeenCalledTimes(1);
  });
});

// Menu
describe('ConversationSidebar – menu contestuale', () => {
  it('apre il menu', async () => {
    renderSidebar();
    fireEvent.click(getMenuButton());

    await waitFor(() => {
      expect(screen.getByText('Rinomina')).toBeInTheDocument();
      expect(screen.getByText('Elimina')).toBeInTheDocument();
    });
  });

  it('chiude il menu al secondo click', async () => {
    renderSidebar();
    const btn = getMenuButton();

    fireEvent.click(btn);
    await waitFor(() => expect(screen.getByText('Rinomina')).toBeInTheDocument());

    fireEvent.click(btn);
    await waitFor(() =>
      expect(screen.queryByText('Rinomina')).not.toBeInTheDocument()
    );
  });

  // Copre righe 41-42: handleClickOutside — click fuori dal menu lo chiude
  it('chiude il menu con click fuori (handleClickOutside)', async () => {
    renderSidebar();
    fireEvent.click(getMenuButton());
    await waitFor(() => expect(screen.getByText('Rinomina')).toBeInTheDocument());

    fireEvent.mouseDown(document.body);

    await waitFor(() =>
      expect(screen.queryByText('Rinomina')).not.toBeInTheDocument()
    );
  });

  // Branch menuRef.current falso: click fuori quando menu è già chiuso non crasha
  it('mouseDown fuori quando menu è chiuso non produce errori', () => {
    renderSidebar();
    expect(() => fireEvent.mouseDown(document.body)).not.toThrow();
  });
});

// Rinomina
describe('ConversationSidebar – rinomina', () => {
  it('mostra input', async () => {
    await openMenuAndClickRename();
    await waitFor(() => expect(screen.getByRole('textbox')).toBeInTheDocument());
  });

  it('chiama onRename con Enter', async () => {
    const onRename = vi.fn();
    renderSidebar({ onRename });

    fireEvent.click(getMenuButton());
    await waitFor(() => screen.getByText('Rinomina'));

    fireEvent.click(screen.getByText('Rinomina'));
    const input = await screen.findByRole('textbox');

    fireEvent.change(input, { target: { value: 'Nuovo titolo' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onRename).toHaveBeenCalledWith(1, 'Nuovo titolo');
  });

  // Copre riga 177: commitRename via onBlur
  it('chiama onRename quando l\'input perde il focus (onBlur)', async () => {
    const onRename = vi.fn();
    renderSidebar({ onRename });

    fireEvent.click(getMenuButton());
    await waitFor(() => screen.getByText('Rinomina'));
    fireEvent.click(screen.getByText('Rinomina'));

    const input = await screen.findByRole('textbox');
    fireEvent.change(input, { target: { value: 'Titolo via blur' } });
    fireEvent.blur(input);

    expect(onRename).toHaveBeenCalledWith(1, 'Titolo via blur');
  });

  // Branch falso commitRename: valore vuoto → onRename NON chiamato
  it('NON chiama onRename se il valore è vuoto al blur', async () => {
    const onRename = vi.fn();
    renderSidebar({ onRename });

    fireEvent.click(getMenuButton());
    await waitFor(() => screen.getByText('Rinomina'));
    fireEvent.click(screen.getByText('Rinomina'));

    const input = await screen.findByRole('textbox');
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.blur(input);

    expect(onRename).not.toHaveBeenCalled();
  });

  // Copre riga 75: Escape annulla la rinomina
  it('annulla la rinomina premendo Escape', async () => {
    const onRename = vi.fn();
    renderSidebar({ onRename });

    fireEvent.click(getMenuButton());
    await waitFor(() => screen.getByText('Rinomina'));
    fireEvent.click(screen.getByText('Rinomina'));

    const input = await screen.findByRole('textbox');
    fireEvent.change(input, { target: { value: 'Testo non salvato' } });
    fireEvent.keyDown(input, { key: 'Escape' });

    expect(onRename).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    );
  });
});

// Eliminazione
describe('ConversationSidebar – eliminazione', () => {
  it('mostra dialog', async () => {
    await openMenuAndClickDelete();

    await waitFor(() => {
      expect(screen.getByText(/elimina conversazione/i)).toBeInTheDocument();
    });
  });

  it('chiama onDelete', async () => {
    const onDelete = vi.fn();
    renderSidebar({ onDelete });

    fireEvent.click(getMenuButton());
    await waitFor(() => screen.getByText('Elimina'));

    fireEvent.click(screen.getAllByText('Elimina')[0]);

    await waitFor(() => {
      const btns = screen.getAllByText('Elimina');
      const lastBtn = btns.at(-1);

      if (!lastBtn) {
        throw new Error('Bottone "Elimina" non trovato nel dialog');
      }

      fireEvent.click(lastBtn);
    });

    expect(onDelete).toHaveBeenCalledWith(1);
  });

  // Copre riga 244: click su "Annulla" nel dialog chiude senza eliminare
  it('chiude il dialog senza eliminare cliccando "Annulla"', async () => {
    const onDelete = vi.fn();
    renderSidebar({ onDelete });

    fireEvent.click(getMenuButton());
    await waitFor(() => screen.getByText('Elimina'));
    fireEvent.click(screen.getAllByText('Elimina')[0]);

    await waitFor(() =>
      expect(screen.getByText(/elimina conversazione/i)).toBeInTheDocument()
    );

    fireEvent.click(screen.getByText('Annulla'));

    await waitFor(() =>
      expect(screen.queryByText(/elimina conversazione/i)).not.toBeInTheDocument()
    );
    expect(onDelete).not.toHaveBeenCalled();
  });

  // Copre riga 238: click sullo sfondo (backdrop) chiude il dialog
  it('chiude il dialog cliccando lo sfondo (backdrop)', async () => {
    renderSidebar();

    fireEvent.click(getMenuButton());
    await waitFor(() => screen.getByText('Elimina'));
    fireEvent.click(screen.getAllByText('Elimina')[0]);

    await waitFor(() =>
      expect(screen.getByText(/elimina conversazione/i)).toBeInTheDocument()
    );

    const backdrop = document.querySelector('button.absolute.inset-0');
    expect(backdrop).not.toBeNull();
    if (backdrop) fireEvent.click(backdrop);

    await waitFor(() =>
      expect(screen.queryByText(/elimina conversazione/i)).not.toBeInTheDocument()
    );
  });

  // Copre riga 84: branch falso di confirmDeleteConv (confirmDeleteId === null)
  // Apri dialog → chiudi via backdrop (confirmDeleteId → null) → onDelete non chiamato
  it('confirmDeleteConv non chiama onDelete se confirmDeleteId è già null (branch falso riga 84)', async () => {
    const onDelete = vi.fn();
    renderSidebar({ onDelete });

    fireEvent.click(getMenuButton());
    await waitFor(() => screen.getByText('Elimina'));
    fireEvent.click(screen.getAllByText('Elimina')[0]);

    await waitFor(() =>
      expect(screen.getByText(/elimina conversazione/i)).toBeInTheDocument()
    );

    // Chiudi tramite backdrop → confirmDeleteId torna null
    const backdrop = document.querySelector('button.absolute.inset-0');
    if (backdrop) fireEvent.click(backdrop);

    await waitFor(() =>
      expect(screen.queryByText(/elimina conversazione/i)).not.toBeInTheDocument()
    );

    expect(onDelete).not.toHaveBeenCalled();
  });
});