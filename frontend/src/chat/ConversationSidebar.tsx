import React, { useState, useRef, useEffect } from 'react';
import type { KeyboardEvent } from 'react';
import type { Conversation } from './ChatModel';

interface Props {
  conversations: Conversation[];
  activeConvId: number | null;
  username: string | null;
  onSelect: (id: number) => void;
  onCreate: () => void;
  onRename: (id: number, titolo: string) => void;
  onDelete: (id: number) => void;
  onLogout: () => void;
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
  username,
  onSelect,
  onCreate,
  onRename,
  onDelete,
  onLogout,
}) => {
  const [menu, setMenu] = useState<MenuState>({ convId: null });
  const [rename, setRename] = useState<RenameState>({ convId: null, value: '' });
  const menuRef = useRef<HTMLDivElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

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
    onRename(convId, rename.value);
    setRename({ convId: null, value: '' });
  }

  function handleRenameKey(e: KeyboardEvent<HTMLInputElement>, convId: number) {
    if (e.key === 'Enter') commitRename(convId);
    if (e.key === 'Escape') setRename({ convId: null, value: '' });
  }

  function handleDelete(convId: number) {
    setMenu({ convId: null });
    onDelete(convId);
  }

  return (
    <aside
      className="flex flex-col w-64 min-w-[16rem] h-full bg-white border-r border-stone-200"
      aria-label="Conversazioni"
    >
      <div className="flex items-center justify-between px-4 py-4 border-b border-stone-100">
        <span className="text-xs font-semibold tracking-widest text-stone-400 uppercase">
          Conversazioni
        </span>
        <button
          onClick={onCreate}
          aria-label="Nuova conversazione"
          className="flex items-center justify-center w-7 h-7 rounded-lg text-stone-500 hover:bg-emerald-50 hover:text-emerald-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-2" aria-label="Elenco conversazioni">
        {conversations.length === 0 && (
          <p className="px-4 py-6 text-sm text-stone-400 text-center">
            Nessuna conversazione.<br />Inizia con +
          </p>
        )}

        {conversations.map(conv => {
          const isActive = conv.id_conv === activeConvId;
          const isEditing = rename.convId === conv.id_conv;
          const menuOpen = menu.convId === conv.id_conv;

          return (
            <div key={conv.id_conv} className="relative px-2 group">
              <button
                type="button"
                className={`
                  flex items-center gap-2 w-full rounded-lg px-3 py-2
                  transition-colors text-sm text-left
                  ${isActive
                    ? 'bg-emerald-50 text-emerald-800 font-medium'
                    : 'text-stone-700 hover:bg-stone-50'}
                `}
                onClick={() => !isEditing && onSelect(conv.id_conv)}
                aria-current={isActive ? 'page' : undefined}
              >
                <svg
                  width="14" height="14" viewBox="0 0 14 14" fill="none"
                  className="shrink-0 text-stone-400"
                  aria-hidden="true"
                >
                  <path
                    d="M1 1h12v9H8l-3 3V10H1V1z"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinejoin="round"
                  />
                </svg>

                {isEditing ? (
                  <input
                    ref={renameInputRef}
                    className="flex-1 min-w-0 bg-white border border-emerald-400 rounded px-1 py-0.5 text-sm text-stone-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    value={rename.value}
                    onChange={e => setRename(r => ({ ...r, value: e.target.value }))}
                    onKeyDown={e => handleRenameKey(e, conv.id_conv)}
                    onBlur={() => commitRename(conv.id_conv)}
                    maxLength={24}
                  />
                ) : (
                  <span className="flex-1 min-w-0 truncate">{conv.titolo}</span>
                )}
              </button>

              {/* ── Menu a tre puntini sempre disponibile ── */}
              <button
                className={`
                  absolute right-3 top-1/2 -translate-y-1/2
                  w-6 h-6 flex items-center justify-center rounded
                  text-stone-400 hover:text-stone-700 hover:bg-stone-200
                  transition-opacity
                  ${menuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
                `}
                onClick={e => openMenu(e, conv.id_conv)}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                  <circle cx="2" cy="7" r="1.3" />
                  <circle cx="7" cy="7" r="1.3" />
                  <circle cx="12" cy="7" r="1.3" />
                </svg>
              </button>

              {menuOpen && (
                <div
                  ref={menuRef}
                  className="absolute right-2 top-full mt-1 z-50 w-40 bg-white border border-stone-200 rounded-lg shadow-lg py-1 text-sm"
                >
                  <button
                    className="flex items-center gap-2 w-full px-3 py-2 text-stone-700 hover:bg-stone-50"
                    onClick={() => startRename(conv)}
                  >
                    Rinomina
                  </button>
                  <button
                    className="flex items-center gap-2 w-full px-3 py-2 text-red-600 hover:bg-red-50"
                    onClick={() => handleDelete(conv.id_conv)}
                  >
                    Elimina
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="border-t border-stone-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
            <span className="text-xs font-semibold text-emerald-700 uppercase">
              {username?.[0] ?? '?'}
            </span>
          </div>
          <span className="text-sm text-stone-600 truncate">{username}</span>
        </div>
        <button
          onClick={onLogout}
          aria-label="Esci"
          title="Esci"
          className="w-7 h-7 flex items-center justify-center rounded-lg text-stone-400 hover:bg-red-50 hover:text-red-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
        >
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
            <path d="M6 2H2v11h4M10 5l3 2.5L10 10M13 7.5H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </aside>
  );
};