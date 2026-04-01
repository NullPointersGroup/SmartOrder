// NavBar.tsx
import { useRef, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../auth/authStore';

// ─── Configurazione dichiarativa ────────────────────────────────────────────
// Aggiungi qui nuove voci: basta una riga per ruolo.

type Role = 'cliente' | 'admin';

interface NavLink {
  path: string;
  label: string;
}

const NAV_LINKS: Record<Role, NavLink[]> = {
  cliente: [
    { path: '/home',    label: 'Chat'    },
    { path: '/history', label: 'Storico' },
  ],
  admin: [
    // NON C'È NULLA PERCHÉ PER ORA L'ADMIN HA SOLO LO STORICO E NON HA SENSO INSERIRLO
  ],
};

// ─── Props ───────────────────────────────────────────────────────────────────

interface Props {
  username: string | null;
  onLogout: () => void;
  onProfile: () => void;
}

// ─── Componente ──────────────────────────────────────────────────────────────

export const NavBar: React.FC<Props> = ({ username, onLogout, onProfile }) => {
  const [open, setOpen]   = useState(false);
  const ref               = useRef<HTMLDivElement>(null);
  const location          = useLocation();
  const navigate          = useNavigate();
  const role              = useAuthStore((s) => s.admin) as Role;

  const links = NAV_LINKS[role] ?? [];
  const initial = username ? username[0].toUpperCase() : '?';

  // Chiude cliccando fuori
  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, []);

  // Chiude con Escape
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleNav = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <div
      ref={ref}
      className="relative flex items-center justify-between px-5 py-2.5 bg-(--color-3)"
    >
      {/* Logo */}
      <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-(--bg-3) opacity-80 select-none">
        SmartOrder
      </span>

      {/* Trigger */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Menu account di ${username ?? 'utente'}`}
        className="flex items-center gap-2.5 px-10 py-1.5 rounded-xl bg-(--color-5) text-(--bg-3) transition-all
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-1)
                   focus-visible:ring-offset-2 focus-visible:ring-offset-(--color-4)"
      >
        <span
          aria-hidden="true"
          className="w-6 h-6 rounded-full bg-(--color-2) flex items-center justify-center text-[10px] font-bold text-(--bg-3) shrink-0"
        >
          {initial}
        </span>
        <span className="text-sm font-medium max-w-30 truncate">
          {username || '?'}
        </span>
        <svg
          width="12" height="12" viewBox="0 0 12 12" fill="none"
          aria-hidden="true"
          className={`shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        >
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          role="menu"
          className="absolute top-full right-4 mt-2 w-48 bg-(--bg-3) border border-(--border) rounded-xl shadow-xl z-50 overflow-hidden py-1"
        >
          {/* Header account */}
          <div className="px-4 py-2.5 border-b-3 border-(--color-4)/60 bg-(--bg--3)/40">
            <p className="text-[11px] text-(--text-2) uppercase tracking-wider font-semibold">
              Account
            </p>
            <p className="text-sm font-medium text-(--text-1) truncate mt-0.5">
              {username || '?'}
            </p>
          </div>

          {/* Profilo — sempre visibile */}
          <button
            role="menuitem"
            onClick={() => { setOpen(false); onProfile(); }}
            className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-(--text-2) hover:bg-(--bg-2) hover:text-(--text-1) transition-colors"
          >
            <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="4"/>
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
            </svg>
            Profilo
          </button>

          {/* Link di navigazione per ruolo */}
          {links.length > 0 && (
            <>
              <hr className="border-t border-[var(--border)] mx-3 my-1" />

              {links.map(({ path, label }, index) => {
                const isCurrent = location.pathname === path;

                // Icone moderne e coerenti
                const iconMap: Record<string, JSX.Element> = {
                Chat: (
                  <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                  </svg>
                ),
                Storico: (
                  <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 8v4l3 3" />
                    <path d="M3.05 11a9 9 0 1 1 .5 4m-.5 5v-5h5" />
                  </svg>
                ),
              };

                return (
                  <div key={path}>
                    <button
                      role="menuitem"
                      aria-current={isCurrent ? 'page' : undefined}
                      tabIndex={isCurrent ? -1 : 0}
                      onClick={() => !isCurrent && handleNav(path)}
                      className={`
                        flex items-center gap-2.5 w-full px-4 py-2.5 text-sm transition-colors
                        ${isCurrent
                          ? 'text-(--visited) font-semibold cursor-default pointer-events-none'
                          : 'text-(--text-2) hover:bg-(--bg-2) hover:text-(--text-1)'}
                      `}
                    >
                      {/* Icona moderna */}
                      <span className="shrink-0">{iconMap[label]}</span>
                      {label}
                    </button>

                    {/* Linea separatrice SOLO tra elementi */}
                    {index < links.length - 1 && (
                      <hr className="border-t border-[var(--border)] mx-3 my-1" />
                    )}
                  </div>
                );
              })}
            </>
          )}

          {/* Logout — sempre visibile */}
          <hr className="border-t border-[var(--border)] mx-3 my-1" />
          <button
            role="menuitem"
            onClick={() => { setOpen(false); onLogout(); }}
            className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-(--error) hover:bg-(--bg-2) transition-colors"
          >
            <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Logout
          </button>
        </div>
      )}
    </div>
  );
};