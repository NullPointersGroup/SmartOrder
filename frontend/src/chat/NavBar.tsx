import { useState, useRef, useEffect } from 'react'

interface Props {
  username: string | null;
  onLogout: () => void;
  onProfile: () => void;
}

export const NavBar: React.FC<Props> = ({ username, onLogout, onProfile }) => {
  const [open, setOpen] = useState<boolean>(false)
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const initial = username ? username[0].toUpperCase() : '?'

  return (
    <div
      ref={ref}
      className="relative flex items-center justify-between px-5 py-2.5 bg-(--color-3)"
    >
      {/* Logo / color */}
      <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-(--color-1) opacity-80 select-none">
        SmartOrder
      </span>

      {/* User button */}
      <button
        onClick={() => setOpen(prev => !prev)}
        className="flex items-center gap-2.5 px-10 py-1.5 rounded-xl bg-(--color-5) text-(--bg-3) transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-1) focus-visible:ring-offset-2 focus-visible:ring-offset-(--color-4)"
      >
        {/* Avatar */}
        <span className="w-6 h-6 rounded-full bg-(--color-2) flex items-center justify-center text-[10px] font-bold text-(--bg-3) shrink-0">
          {initial}
        </span>
        <span className="text-sm font-medium max-w-30px truncate">
          {username || '?'}
        </span>
        {/* Chevron */}
        <svg
          width="12" height="12" viewBox="0 0 12 12" fill="none"
          className={`shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        >
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full right-4 mt-2 w-48 bg-(--bg-3) border border-(--border) rounded-xl shadow-xl z-50 overflow-hidden py-1">
          {/* User info header */}
          <div className="px-4 py-2.5 border-b border-(--bg-2)">
            <p className="text-[11px] text-(--text-4) uppercase tracking-wider font-semibold">Account</p>
            <p className="text-sm font-medium text-(--text-1) truncate mt-0.5">{username || '?'}</p>
          </div>

          <button
            onClick={() => { setOpen(false); onProfile(); }}
            className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-(--text-2) hover:bg-(--bg-2) hover:text-(--text-1) transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="4"/>
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
            </svg>
            Profilo
          </button>

          <div className="h-px bg-(--bg-2) mx-3 my-1" />

          <button
            onClick={() => { setOpen(false); onLogout(); }}
            className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-(--error) hover:bg-(--bg-2) transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Logout
          </button>
        </div>
      )}
    </div>
  )
}