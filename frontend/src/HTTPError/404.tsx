import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '../hooks/usePageTitle';

export function NotFound() {
  /**
  @brief restituisce la pagina 404 che indica una pagina non trovata
   */
  const navigate = useNavigate();
  
  usePageTitle("Non trovato");

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <h1 className="text-9xl font-extrabold text-(--color-4) tracking-tighter">
        404
      </h1>

      <div className="mt-8">
        <h2 className="text-3xl font-bold text-(--text-1)">
          Pagina non trovata
        </h2>
        <p className="text-(--text-2) mt-2 max-w-sm mx-auto">
          La pagina che stai cercando sembra essere svanita nel nulla o l'indirizzo è errato.
        </p>
      </div>

      <div className="flex flex-row items-center justify-center gap-4 mt-8">
        {/* Bottone Chat */}
        <button
          onClick={() => navigate('/home')}
          className="px-6 py-3 bg-(--color-4) text-(--bg-3) font-bold rounded-xl shadow-lg hover:bg-[#1a365d] transition-all active:scale-95 whitespace-nowrap"
        >
          Torna alla Chat
        </button>

        {/* Bottone Login */}
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 border-2 border-(--color-4) text-(--color-4) font-bold rounded-xl hover:bg-gray-50 transition-all active:scale-95 whitespace-nowrap"
        >
          Vai al Login
        </button>
      </div>
    </div>
  );
}