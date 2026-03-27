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
  username,
  onSelect,
  onCreate,
  onRename,
  onDelete,
  onLogout,
  onToggleSelf,
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
    onDelete(convId);
  }

  return (
    <aside
      className="flex flex-col w-72 min-w-[18rem] h-full bg-[#fcfcfc] border-r border-stone-200 shadow-[inset_-1px_0_0_0_rgba(0,0,0,0.05)]"
      aria-label="Conversazioni"
    >
      <div className="flex items-center justify-between px-5 py-6">
        <h2 className="text-[11px] font-bold tracking-[0.15em] text-stone-400 uppercase flex-1">
          Conversazioni
        </h2>
        <div className="flex items-center gap-1">
          {/* Nuova conversazione */}
          <button
            onClick={onCreate}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-600 text-white shadow-sm active:scale-95 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
            title="Nuova conversazione"
          >
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
              <path d="M8 3.5v9M3.5 8h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>

          {/* Bottone chiusura sidebar */}
          <button
            onClick={onToggleSelf}
            className="flex items-center justify-center w-8 h-8 rounded-xl text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all focus:outline-none"
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
                  <div className="absolute left-0 top-2 bottom-2 w-1 bg-emerald-500 rounded-r-full z-10" />
                )}

                <button
                  type="button"
                  className={`
                    relative flex items-center gap-3 w-full rounded-xl px-4 py-3
                    transition-all duration-200 text-sm text-left
                    ${isActive
                      ? 'bg-white shadow-sm ring-1 ring-stone-200 text-stone-900 font-semibold'
                      : 'text-stone-500 hover:bg-stone-100 hover:text-stone-700'}
                  `}
                  onClick={() => !isEditing && onSelect(conv.id_conv)}
                >
                  <svg
                    width="16" height="16" viewBox="0 0 24 24" fill="none"
                    className={`shrink-0 ${isActive ? 'text-emerald-500' : 'text-stone-300'}`}
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
                      className="flex-1 min-w-0 bg-stone-50 border-none rounded px-1 py-0 font-normal text-stone-800 focus:ring-0 outline-none"
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
                      text-stone-400 hover:text-stone-900 hover:bg-stone-100
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
                    className="absolute right-2 top-10 z-[100] w-44 bg-white border border-stone-200 rounded-xl shadow-xl py-1.5 animate-in fade-in zoom-in-95 duration-100"
                  >
                    <button
                      className="flex items-center gap-2 w-full px-4 py-2 text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition-colors"
                      onClick={() => startRename(conv)}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                      </svg>
                      Rinomina
                    </button>
                    <div className="h-px bg-stone-100 my-1 mx-2" />
                    <button
                      className="flex items-center gap-2 w-full px-4 py-2 text-red-500 hover:bg-red-50 transition-colors"
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

      {/* User Footer */}
      <div className="mt-auto border-t border-stone-200 bg-white/50 backdrop-blur-sm px-4 py-4">
        <div className="flex items-center gap-3 p-2 rounded-2xl bg-stone-50/50 border border-stone-100">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center shrink-0 shadow-sm shadow-emerald-200">
            <span className="text-sm font-bold text-white uppercase leading-none">
              {username?.[0] ?? '?'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-stone-900 truncate tracking-tight">{username}</p>
            <p className="text-[10px] text-stone-400 font-medium">Account Online</p>
          </div>
          <button
            onClick={onLogout}
            title="Esci dall'account"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-400 hover:bg-red-50 hover:text-red-500 transition-all focus:outline-none"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
};