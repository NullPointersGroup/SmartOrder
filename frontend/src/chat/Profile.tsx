import { useEffect, useState } from 'react'
import PasswordResetForm from './PasswordResetForm'

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
  const [resetPassword, setResetPassword] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(false)

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

  const handleReset = async (oldPassword: string, newPassword: string): Promise<string | null> => {
    const res = await fetch('/auth/reset', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
    })

    if (res.ok) {
      setResetPassword(false)
      setResetSuccess(true)
      return null
    }

    const data = await res.json()
    return data.detail.errors[0]
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <button className="absolute inset-0 bg-black/30" onClick={onClose} />

      <div className="ml-auto w-80 h-full bg-(--bg-3) shadow-xl p-6 relative flex flex-col gap-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-sm text-(--text-4) hover:text-(--text-1) transition-colors"
        >
          ✕
        </button>

        <h2 className="text-lg font-semibold text-(--text-1)">Profilo</h2>

        {loading && <p className="text-sm text-(--text-4)">Caricamento...</p>}
        {error && <p className="text-sm text-(--error)">{error}</p>}

        {info && (
          <>
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-xs text-(--text-4) mb-1">Username</p>
                <p className="text-sm font-medium text-(--text-1)">{info.username}</p>
              </div>
              <div>
                <p className="text-xs text-(--text-4) mb-1">Email</p>
                <p className="text-sm text-(--text-2)">{info.email}</p>
              </div>
              <div>
              <button
                onClick={() => setResetPassword(true)}
                className="self-start mt-2 py-2 rounded-xl bg-(--color-3) hover:opacity-90 text-(--bg-3) text-sm font-medium transition-colors text-left px-3"
              >
                Reimposta password
              </button>
              </div>
            </div>

            <div className="mt-auto flex flex-col gap-2">
              <button
                onClick={() => setConfirmDelete(true)}
                className="w-full py-2 rounded-xl bg-(--error) hover:opacity-90 text-(--bg-3) text-sm font-medium transition-all"
              >
                Cancella account
              </button>
            </div>
          </>
        )}
      </div>

      {/* Reset password dialog */}
      {resetPassword && (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <button data-testid="reset-overlay" className="absolute inset-0 bg-black/20" onClick={() => setResetPassword(false)} />
          <div className="relative bg-(--bg-3) rounded-2xl shadow-xl p-6">
            <PasswordResetForm handleReset={handleReset} />
          </div>
        </div>
      )}

      {/* Reset success dialog */}
      {resetSuccess && (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <button className="absolute inset-0 bg-black/20" onClick={() => setResetSuccess(false)} />
          <div className="relative bg-(--bg-3) rounded-2xl shadow-xl p-6 w-72 flex flex-col gap-4">
            <h3 className="text-base font-semibold text-(--text-1)">Password reimpostata</h3>
            <p className="text-sm text-(--text-3)">La tua password è stata aggiornata con successo.</p>
            <button
              onClick={() => setResetSuccess(false)}
              className="w-full py-2 rounded-xl bg-(--color-2) hover:bg-(--color-3) text-(--bg-3) text-sm font-medium transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Confirm delete dialog */}
      {confirmDelete && (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <button className="absolute inset-0 bg-black/20" onClick={() => setConfirmDelete(false)} />
          <div className="relative bg-(--bg-3) rounded-2xl shadow-xl p-6 w-72 flex flex-col gap-4">
            <h3 className="text-base font-semibold text-(--text-1)">Cancella account</h3>
            <p className="text-sm text-(--text-3)">Sei sicuro? Questa azione è irreversibile.</p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 py-2 rounded-xl border border-(--border) text-sm text-(--text-2) hover:bg-(--bg-2) transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2 rounded-xl bg-(--error) hover:opacity-90 text-(--bg-3) text-sm font-medium transition-all"
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