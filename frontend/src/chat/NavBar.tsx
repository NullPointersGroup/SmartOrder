import { useState, useRef, useEffect } from 'react'

interface Props{
   username: string | null;
   onLogout: () => void;
   onDelete: () => void;
   onProfile: () => void;
}

export const NavBar: React.FC<Props> = ({
  username,
  onLogout,
  onProfile
}) => {
  const [open, setOpen] = useState<boolean>(false)
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
  <div ref={ref} className="relative flex justify-end px-4 py-2">
    
    <button
      onClick={() => setOpen(prev => !prev)}
      className="w-48 flex items-center justify-center bg-emerald-600 border border-stone-200 rounded-xl transition-all py-2 text-black"
    >
      {username || '?'}
    </button>

    {open && (
      <div className="absolute top-full right-4 mt-2 w-48 bg-white border border-stone-200 rounded-xl shadow-lg z-50">
        <button
          onClick={() => { setOpen(false); onProfile(); }}
          className="w-full text-left px-4 py-2 text-sm hover:bg-stone-100"
        >
          Profilo
        </button>
        <button
          onClick={onLogout}
          className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50"
        >
          Logout
        </button>
      </div>
    )}
  </div>
)
}