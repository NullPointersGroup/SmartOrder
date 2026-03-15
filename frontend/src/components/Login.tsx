import { useState } from 'react';
import { login } from '../api';

interface LoginProps { onLogin: () => void; }

export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors]     = useState<string[]>([]);
  const [loading, setLoading]   = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newFieldErrors: { [key: string]: string } = {};
    if (!username.trim()) newFieldErrors.username = 'Username è obbligatorio';
    if (!password) newFieldErrors.password = 'Password è obbligatoria';
    setFieldErrors(newFieldErrors);
    if (Object.keys(newFieldErrors).length > 0) return;
    setLoading(true); setErrors([]);
    try {
      const res = await login({ username, password });
      if (res.ok) onLogin(); else setErrors(res.errors);
    } catch { setErrors(['Errore di connessione']); }
    setLoading(false);
  };

  return (
    <>
      <h2 className="font-serif text-[28px] font-normal text-center mb-7">Accedi</h2>
      <form onSubmit={handleSubmit} noValidate>

        <div className="mb-4">
          <label htmlFor="l-user" className="block text-xs font-semibold uppercase tracking-widest text-black/50 mb-2">Username</label>
          <input id="l-user" type="text" value={username} onChange={e => { setUsername(e.target.value); setFieldErrors(prev => ({ ...prev, username: '' })); }}
            placeholder="il_tuo_username" required autoComplete="username"
            className="w-full bg-[#fdfdfd] border border-black/20 rounded-lg px-4 text-base text-black outline-none focus:border-black/40 transition-colors h-12" />
          {fieldErrors.username && <p className="text-sm text-[#972020] mt-1">{fieldErrors.username}</p>}
        </div>

        <div className="mb-4">
          <label htmlFor="l-pwd" className="block text-xs font-semibold uppercase tracking-widest text-black/50 mb-2">Password</label>
          <input id="l-pwd" type="password" value={password} onChange={e => { setPassword(e.target.value); setFieldErrors(prev => ({ ...prev, password: '' })); }}
            required autoComplete="current-password"
            className="w-full bg-[#fdfdfd] border border-black/20 rounded-lg px-4 text-base text-black outline-none focus:border-black/40 transition-colors h-12" />
          {fieldErrors.password && <p className="text-sm text-[#972020] mt-1">{fieldErrors.password}</p>}
        </div>

        {errors.length > 0 && (
          <div className="mb-4 pl-3 py-1">
            {errors.map((err, i) => <p key={i} className="text-sm text-[#972020] m-0">{err}</p>)}
          </div>
        )}

        <button type="submit" disabled={loading}
          className="w-full font-semibold text-base rounded-lg bg-[#22477b] text-white hover:bg-[#8da3c3] hover:text-black hover:border hover:border-[#22477b] transition-all duration-150 disabled:opacity-50 mt-2 h-12">
          {loading ? 'Caricamento...' : 'Accedi'}
        </button>
      </form>
    </>
  );
}