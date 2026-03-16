import { useState } from 'react';
import { register } from '../api';

interface RegisterProps { onRegister: () => void; }

export default function Register({ onRegister }: RegisterProps) {
  const [username, setUsername]     = useState('');
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [errors, setErrors]         = useState<string[]>([]);
  const [loading, setLoading]       = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newFieldErrors: { [key: string]: string } = {};
    if (!username.trim()) newFieldErrors.username = 'Username è obbligatorio';
    if (!email.trim()) newFieldErrors.email = 'Email è obbligatoria';
    if (!password) newFieldErrors.password = 'Password è obbligatoria';
    if (!confirmPwd) newFieldErrors.confirmPwd = 'Conferma password è obbligatoria';
    setFieldErrors(newFieldErrors);
    if (Object.keys(newFieldErrors).length > 0) return;
    setLoading(true); setErrors([]);
    try {
      const res = await register({ username, password, email, confirmPwd });
      if (res.ok) onRegister(); else setErrors(res.errors);
    } catch { setErrors(['Errore di connessione']); }
    setLoading(false);
  };

  const fields = [
    { id: 'r-user',    label: 'Username',           type: 'text',     value: username,   setter: setUsername,   ph: 'il_tuo_username', ac: 'username', key: 'username' },
    { id: 'r-email',   label: 'Email',               type: 'email',    value: email,      setter: setEmail,      ph: 'nome@esempio.it', ac: 'email', key: 'email' },
    { id: 'r-pwd',     label: 'Password',            type: 'password', value: password,   setter: setPassword,   ph: '',                ac: 'new-password', key: 'password' },
    { id: 'r-confirm', label: 'Conferma Password',   type: 'password', value: confirmPwd, setter: setConfirmPwd, ph: '',                ac: 'new-password', key: 'confirmPwd' },
  ];

  return (
    <>
      <h2 className="font-serif text-[28px] font-normal text-center mb-7">Crea account</h2>
      <form onSubmit={handleSubmit} noValidate>
        {fields.map(({ id, label, type, value, setter, ph, ac, key }) => (
          <div key={id} className="mb-4">
            <label htmlFor={id} className="block text-xs font-semibold uppercase tracking-widest text-black/50 mb-2">{label}</label>
            <input id={id} type={type} value={value} onChange={e => { setter(e.target.value); setFieldErrors(prev => ({ ...prev, [key]: '' })); }}
              placeholder={ph} required autoComplete={ac}
              className="w-full bg-[#fdfdfd] border border-black/20 rounded-lg px-4 text-base text-black outline-none focus:border-black/40 transition-colors h-12" />
            {fieldErrors[key] && <p className="text-sm text-[#972020] mt-1">{fieldErrors[key]}</p>}
          </div>
        ))}

        {errors.length > 0 && (
          <div className="mb-4 pl-3 py-1">
            {errors.map((err, i) => <p key={i} className="text-sm text-[#972020] m-0">{err}</p>)}
          </div>
        )}

        <button type="submit" disabled={loading}
          className="w-full font-semibold text-base rounded-lg bg-[#22477b] text-white hover:bg-[#8da3c3] hover:text-black hover:border hover:border-[#22477b] transition-all duration-150 disabled:opacity-50 mt-2 h-12">
          {loading ? 'Caricamento...' : 'Registrati'}
        </button>
      </form>
    </>
  );
}