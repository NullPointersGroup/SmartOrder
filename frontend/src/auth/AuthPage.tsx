import { useState } from 'react';
import Login from './Login';
import Register from './Register';
import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '../hooks/usePageTitle';
import { useAuthStore } from './authStore';

export default function AuthPage() {
  /**
  @brief crea l'estetica del form
  @return ritorna tutta l'estetica
  @req RF-OB_01
  @req RF-OB_02
  @req RF-OB_06
  @req RF-OB_07
  @req RF-OB_08
  @req RF-OB_11
  @req RF-OB_12
  @req RF-OB_13
  @req RF-OB_14
  @req RF-OB_15
  @req RF-OB_17
  @req RF-OB_18
  @req RF-OB_22
  @req RF-OB_23
  @req RF-OB_24
  @req RF-OB_25
  @req RF-OB_26
  @req RF-OB_27
   */
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();
  const { initAuth } = useAuthStore();

  usePageTitle(isLogin ? 'Autenticazione' : 'Registrazione');

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16 font-sans" style={{ backgroundColor: 'var(--bg-3)' }}>

      {/* Logo */}
      <div className="flex items-center gap-3 mb-8">
        <span className="auth-brand-icon text-4xl">🛒</span>
        <span className="font-serif text-2xl font-bold tracking-[0.05em]" style={{ color: 'var(--text-1)' }}>SmartOrder</span>
      </div>

      <div className="w-full max-w-md rounded-full mb-3 p-3" style={{ backgroundColor: 'var(--bg-2)', border: '1px solid var(--border)' }}>
        <div className="relative flex">
          <div
            className="absolute rounded-full transition-all duration-200 top-0 bottom-0 w-[calc(50%-4px)] z-0"
            style={{
              backgroundColor: 'var(--color-3)',
              left: isLogin ? 3 : 'calc(50% + 1px)',
            }}
          />

          <button
            onClick={() => setIsLogin(true)}
            className="flex-1 py-3 text-sm font-medium rounded-full relative transition-all duration-150 z-10"
            style={{ color: isLogin ? 'var(--bg-3)' : 'var(--text-1)' }}
          >
            Accedi
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className="flex-1 py-3 text-sm font-medium rounded-full relative transition-all duration-150 z-10"
            style={{ color: isLogin ? 'var(--text-1)' : 'var(--bg-3)' }}
          >
            Registrati
          </button>

        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-md rounded-2xl shadow-sm" style={{ backgroundColor: 'var(--bg-2)', border: '1px solid var(--border)' }}>
        <div className="p-8 px-9">
          {isLogin ? (
            <Login onLogin={async () => {
              await initAuth();
              const { admin } = useAuthStore.getState();
              navigate(admin ? '/history' : '/home');
            }} />
          ) : (
            <Register onRegister={() => setIsLogin(true)} />
          )}
        </div>
      </div>

    </div>
  );
}