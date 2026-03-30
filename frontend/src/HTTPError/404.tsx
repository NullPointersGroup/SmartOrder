import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '../hooks/usePageTitle';

export function NotFound() {
  const navigate = useNavigate();
  
  usePageTitle("Non trovato");

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <h1 className="text-9xl font-extrabold text-[#22477b] tracking-tighter">
        404
      </h1>
      <div className="mt-8">
        <h2 className="text-3xl font-serif font-bold text-gray-800">Pagina non trovata</h2>
        <p className="text-black mt-2 max-w-sm mx-auto">
          La pagina che stai cercando sembra essere svanita nel nulla o l'indirizzo è errato.
        </p>
      </div>
      <div className="flex flex-row items-center justify-center gap-4 mt-8">
        {/* Bottone 1: Chat */}
        <button
          onClick={() => navigate('/home')}
          className="px-6 py-3 bg-[#22477b] text-white font-semibold rounded-lg shadow-md hover:bg-[#1a365d] transition-all active:scale-95 whitespace-nowrap"
        >
          Torna alla Chat
        </button>

        {/* Bottone 2: Login */}
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 border-2 border-[#22477b] text-[#22477b] font-semibold rounded-lg hover:bg-gray-50 transition-all active:scale-95 whitespace-nowrap"
        >
          Vai al Login
        </button>
      </div>
    </div>
  );
}