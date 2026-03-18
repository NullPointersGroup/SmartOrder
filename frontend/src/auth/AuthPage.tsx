import { useState } from 'react';
import Login from './Login';
import Register from './Register';
import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '../hooks/usePageTitle';
import { me } from './api';
import { useAuthStore } from './authStore';

export default function AuthPage() {
  /**
  @brief crea l'estetica del form
  @return ritorna tutta l'estetica
  @req RF-OB_13
  @req RF-OB_22
  @req RF-OB_27
   */
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  usePageTitle(isLogin ? 'Autenticazione' : 'Registrazione');

  return (
    <div className="min-h-screen bg-[#fdfdfd] flex flex-col items-center justify-center px-4 py-16 font-sans">

      {/* Logo */}
      <div className="flex items-center gap-3 mb-8">
        <span className="auth-brand-icon text-4xl">🛒</span>
        <span className="font-serif text-2xl font-bold tracking-[0.05em]">SmartOrder</span>
      </div>

      <div className="w-full max-w-md bg-[#f4f5f7] border border-black/10 rounded-full mb-3 p-3">
        <div className="relative flex">
          <div
            className="absolute bg-[#22477b] rounded-full transition-all duration-200 top-1 bottom-1 w-[calc(50%-4px)] z-0"
            style={{ left: isLogin ? 3 : 'calc(50% + 1px)' }}
          />

          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-3 text-sm font-medium rounded-full relative transition-all duration-150 z-10 ${isLogin ? 'text-white' : 'text-black'}`}
          >
            Accedi
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-3 text-sm font-medium rounded-full relative transition-all duration-150 z-10 ${!isLogin ? 'text-white' : 'text-black'}`} //NOSONAR
          >
            Registrati
          </button>

        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-[#f4f5f7] border border-black/10 rounded-2xl shadow-sm">
        <div className="p-8 px-9">
          {isLogin
            ? <Login onLogin={async (token) => {
            if (token) {
              const user = await me(token);
              setAuth(token, user.username);
            }
            navigate('/chat');
          }} />
                      : <Register onRegister={async (token) => {
            if (token) {
              const user = await me(token);
              setAuth(token, user.username);
            }
            navigate('/chat');
          }} />
          }
        </div>
      </div>

    </div>
  );
}