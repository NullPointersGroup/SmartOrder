import React, { useState, useRef, useEffect } from 'react';
import type { KeyboardEvent } from 'react';
import type { Conversation } from './ChatModel';

interface Props {
  conversations: Conversation[];
  activeConvId: number | null;
  onSelect: (id: number) => void;
  onCreate: () => void;
  onRename: (id: number, titolo: string) => void;
  onDelete: (id: number) => void;
  onToggleSelf: () => void;
}

interface MenuState {
  convId: number | null;
}

interface RenameState {
  convId: number | null;
  value: string;
}

export const ConversationSidebar: React.FC<Props> = ({
  conversations,
  activeConvId,
  onSelect,
  onCreate,
  onRename,
  onDelete,
  onToggleSelf,
}) => {
  /**
  @brief costruisce la sidebar di sinistra delle conversazioni
  @param l'interfaccia Props
  @req RF-OB_81
  @req RF-OB_82
  @req RF-DE_128
  @req RF-DE_134
  @req RF-DE_135
  @req RF-DE_136
  @req RF-DE_137
  @req RF-DE_138
   */
  const [menu, setMenu] = useState<MenuState>({ convId: null });
  const [rename, setRename] = useState<RenameState>({ convId: null, value: '' });
  const menuRef = useRef<HTMLDivElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenu({ convId: null });
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (rename.convId !== null) {
      renameInputRef.current?.focus();
      renameInputRef.current?.select();
    }
  }, [rename.convId]);

  function openMenu(e: React.MouseEvent, convId: number) {
    e.stopPropagation();
    setMenu(prev => ({ convId: prev.convId === convId ? null : convId }));
  }

  function startRename(conv: Conversation) {
    setMenu({ convId: null });
    setRename({ convId: conv.id_conv, value: conv.titolo });
  }

  function commitRename(convId: number) {
    if (rename.value.trim()) {
      onRename(convId, rename.value.trim());
    }
    setRename({ convId: null, value: '' });
  }

  function handleRenameKey(e: KeyboardEvent<HTMLInputElement>, convId: number) {
    if (e.key === 'Enter') commitRename(convId);
    if (e.key === 'Escape') setRename({ convId: null, value: '' });
  }

  function handleDelete(convId: number) {
    setMenu({ convId: null });
    setConfirmDeleteId(convId);
  }

  function confirmDeleteConv() {
    if (confirmDeleteId !== null) {
      onDelete(confirmDeleteId);
      setConfirmDeleteId(null);
    }
  }

  return (
    <aside
      className="flex flex-col w-72 min-w-[18rem] h-full bg-(--bg-1) border-r border-(--border) shadow-[inset_-1px_0_0_0_rgba(0,0,0,0.05)]"
      aria-label="Conversazioni"
    >
      <div className="flex items-center justify-between px-5 py-6">
        <h2 className="text-[11px] font-bold tracking-[0.15em] text-(--text-4) uppercase flex-1">
          Conversazioni
        </h2>
        <div className="flex items-center gap-1">
          {/* Nuova conversazione */}
          <button
            onClick={onCreate}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-(--color-2) text-(--bg-3) shadow-sm active:scale-95 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-2) focus-visible:ring-offset-2"
            title="Nuova conversazione"
          >
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
              <path d="M8 3.5v9M3.5 8h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>

          {/* Bottone chiusura sidebar */}
          <button
            onClick={onToggleSelf}
            className="flex items-center justify-center w-8 h-8 rounded-xl text-(--text-4) hover:text-(--color-2) hover:bg-(--color-1) transition-all focus:outline-none"
            title="Chiudi pannello conversazioni"
          >
            <svg width="18" height="18" viewBox="-1 -1 24 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <rect x="0" y="0" width="22" height="18" rx="3"/>
              <line x1="7" y1="0" x2="7" y2="18"/>
            </svg>
          </button>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 space-y-0.5" aria-label="Elenco conversazioni">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 opacity-40">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <p className="text-xs text-center leading-relaxed">
              Nessuna conversazione.<br />Clicca su + per iniziare.
            </p>
          </div>
        ) : (
          conversations.map(conv => {
            const isActive = conv.id_conv === activeConvId;
            const isEditing = rename.convId === conv.id_conv;
            const menuOpen = menu.convId === conv.id_conv;

            return (
              <div key={conv.id_conv} className="relative group">
                {isActive && (
                  <div className="absolute left-0 top-2 bottom-2 w-1 bg-(--color-2) rounded-r-full z-10" />
                )}

                <button
                  type="button"
                  className={`
                    relative flex items-center gap-3 w-full rounded-xl px-4 py-3
                    transition-all duration-200 text-sm text-left
                    ${isActive
                      ? 'bg-(--bg-3) shadow-sm ring-1 ring-(--border) text-(--text-1) font-semibold'
                      : 'text-(--text-3) hover:bg-(--bg-2) hover:text-(--text-2)'}
                  `}
                  onClick={() => !isEditing && onSelect(conv.id_conv)}
                >
                  <svg
                    width="16" height="16" viewBox="0 0 24 24" fill="none"
                    className={`shrink-0 ${isActive ? 'text-(--color-2)' : 'text-(--text-4)'}`}
                  >
                    <path
                      d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinejoin="round"
                    />
                  </svg>

                  {isEditing ? (
                    <input
                      ref={renameInputRef}
                      className="flex-1 min-w-0 bg-(--bg-2) border-none rounded px-1 py-0 font-normal text-(--text-1) focus:ring-0 outline-none"
                      value={rename.value}
                      onChange={e => setRename(r => ({ ...r, value: e.target.value }))}
                      onKeyDown={e => handleRenameKey(e, conv.id_conv)}
                      onBlur={() => commitRename(conv.id_conv)}
                      maxLength={24}
                    />
                  ) : (
                    <span className="flex-1 min-w-0 truncate pr-4">{conv.titolo}</span>
                  )}
                </button>

                {!isEditing && (
                  <button
                    className={`
                      absolute right-3 top-1/2 -translate-y-1/2
                      w-7 h-7 flex items-center justify-center rounded-lg
                      text-(--text-4) hover:text-(--text-1) hover:bg-(--bg-2)
                      transition-all z-20
                      ${menuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
                    `}
                    onClick={e => openMenu(e, conv.id_conv)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="1" />
                      <circle cx="12" cy="5" r="1" />
                      <circle cx="12" cy="19" r="1" />
                    </svg>
                  </button>
                )}

                {menuOpen && (
                  <div
                    ref={menuRef}
                    className="absolute right-2 top-10 z-100 w-44 bg-(--bg-3) border border-(--border) rounded-xl shadow-xl py-1.5 animate-in fade-in zoom-in-95 duration-100"
                  >
                    <button
                      className="flex items-center gap-2 w-full px-4 py-2 text-(--text-2) hover:bg-(--bg-2) hover:text-(--text-1) transition-colors"
                      onClick={() => startRename(conv)}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                      </svg>
                      Rinomina
                    </button>
                    <div className="h-px bg-(--bg-2) my-1 mx-2" />
                    <button
                      className="flex items-center gap-2 w-full px-4 py-2 text-(--error) hover:bg-(--bg-2) transition-colors"
                      onClick={() => handleDelete(conv.id_conv)}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      </svg>
                      Elimina
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </nav>

      {confirmDeleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <button className="absolute inset-0 bg-black/30" onClick={() => setConfirmDeleteId(null)} />
          <div className="relative bg-(--bg-3) rounded-2xl shadow-xl p-6 w-72 flex flex-col gap-4">
            <h3 className="text-base font-semibold text-(--text-1)">Elimina conversazione</h3>
            <p className="text-sm text-(--text-3)">Sei sicuro? Tutti i messaggi verranno eliminati.</p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 py-2 rounded-xl border border-(--border) text-sm text-(--text-2) hover:bg-(--bg-2) transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={confirmDeleteConv}
                className="flex-1 py-2 rounded-xl bg-(--error) hover:opacity-90 text-(--bg-3) text-sm font-medium transition-all"
              >
                Elimina
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};