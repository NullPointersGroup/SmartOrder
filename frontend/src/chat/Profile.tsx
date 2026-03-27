import { useEffect, useState } from 'react'

type Props = {
  onClose: () => void;
  username: string | null;
  onLogout: () => void;
}

type UserInfo = {
  username: string;
  description: string;
  email: string;
}

export const Profile: React.FC<Props> = ({ onClose, username, onLogout }) => {
  const [info, setInfo] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (!username) return
    fetch('/auth/retrieve', { credentials: 'include' })
      .then(r => r.text())
      .then(text => {
        const data = JSON.parse(text)
        setInfo(data)
      })
      .catch(() => setError('Errore nel caricamento del profilo'))
      .finally(() => setLoading(false))
  }, [username])

  const handleDelete = async () => {
    await fetch('/auth/delete', { method: 'DELETE', credentials: 'include' })
    onLogout()
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <button className="absolute inset-0 bg-black/30" onClick={onClose} />

      <div className="ml-auto w-80 h-full bg-white shadow-xl p-6 relative flex flex-col gap-4">
        <button onClick={onClose} className="absolute top-4 right-4 text-sm text-stone-400 hover:text-stone-700">
          ✕
        </button>

        <h2 className="text-lg font-semibold text-stone-800">Profilo</h2>

        {loading && <p className="text-sm text-stone-400">Caricamento...</p>}
        {error && <p className="text-sm text-red-500">{error}</p>}

        {info && (
          <>
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-xs text-stone-400 mb-1">Username</p>
                <p className="text-sm font-medium text-stone-800">{info.username}</p>
              </div>
              <div>
                <p className="text-xs text-stone-400 mb-1">Email</p>
                <p className="text-sm text-stone-700">{info.email}</p>
              </div>
            </div>

            <div className="mt-auto flex flex-col gap-2">
              <button
                onClick={() => setConfirmDelete(true)}
                className="w-full py-2 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-all"
              >
                Cancella account
              </button>
            </div>
          </>
        )}
      </div>

      {/* Dialog di conferma */}
      {confirmDelete && (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <button className="absolute inset-0 bg-black/20" onClick={() => setConfirmDelete(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl p-6 w-72 flex flex-col gap-4">
            <h3 className="text-base font-semibold text-stone-800">Cancella account</h3>
            <p className="text-sm text-stone-500">Sei sicuro? Questa azione è irreversibile.</p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 py-2 rounded-xl border border-stone-200 text-sm text-stone-600 hover:bg-stone-50 transition-all"
              >
                Annulla
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-all"
              >
                Conferma
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}