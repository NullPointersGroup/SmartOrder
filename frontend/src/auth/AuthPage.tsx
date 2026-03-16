import { useState } from 'react';
import Login from './Login';
import Register from './Register';
//import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '../hooks/usePageTitle';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  /*const navigate = useNavigate();*/

  usePageTitle(isLogin ? 'Autenticazione' : 'Registrazione');

  return (
    <div className="min-h-screen bg-[#fdfdfd] flex flex-col items-center justify-center px-4 py-16 font-sans">

      {/* Logo */}
      <div className="flex items-center gap-3 mb-8">
        <span className="auth-brand-icon">🛒</span>
        <span className="font-serif text-[34px] font-bold tracking-[0.05em]">SmartOrder</span>
      </div>

      <div className="w-full max-w-md bg-[#f4f5f7] border border-black/10 rounded-full mb-5 p-5">
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
          {/*
           {isLogin
            ? <Login    onLogin={()    => navigate('/chat')} />
            : <Register onRegister={() => navigate('/chat')} />
          } */}
          {isLogin
            ? <Login onLogin={() => alert('Autenticazione riuscita')} />
            : <Register onRegister={() => alert('Autenticazione riuscita')} />
          }
        </div>
      </div>

    </div>
  );
}