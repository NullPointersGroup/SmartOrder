import PasswordResetForm from './PasswordResetForm'
import { useState } from 'react'

type Props = {
  onClose: () => void
  handleReset: (oldPassword: string, newPassword: string) => Promise<string | null>
}

export const PasswordResetDialog: React.FC<Props> = ({ onClose, handleReset }) => {
  const [resetSuccess, setResetSuccess] = useState(false)

  const handleResetInternal = async (oldPassword: string, newPassword: string): Promise<string | null> => {
    const error = await handleReset(oldPassword, newPassword)
    if (!error) setResetSuccess(true)
    return error
  }

  if (resetSuccess) {
    return (
      <div className="absolute inset-0 z-10 flex items-center justify-center">
        <button className="absolute inset-0 bg-black/20" onClick={onClose} />
        <div className="relative bg-(--bg-3) rounded-2xl shadow-xl p-6 w-72 flex flex-col gap-4">
          <h3 className="text-base font-semibold text-(--text-1)">Password reimpostata</h3>
          <p className="text-sm text-(--text-3)">La tua password è stata aggiornata con successo.</p>
          <button
            onClick={onClose}
            className="w-full py-2 rounded-xl bg-(--color-2) hover:bg-(--color-3) text-(--bg-3) text-sm font-medium transition-colors"
          >
            OK
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center">
      <button data-testid="reset-overlay" className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative bg-(--bg-3) rounded-2xl shadow-xl p-6">
        <PasswordResetForm handleReset={handleResetInternal} />
      </div>
    </div>
  )
}