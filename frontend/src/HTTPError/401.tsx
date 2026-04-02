import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '../hooks/usePageTitle';

export function Unauthorized() {
  /**
  @brief mostra la pagina 401 nel caso in cui un utente non autenticato provi ad accedere
   */
  const navigate = useNavigate();

  usePageTitle("Non autorizzato");

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      {/* Icona o Numero Gigante */}
      <h1 className="text-9xl font-extrabold text-(--color-4) tracking-tighter">
        401
      </h1>
      
      <div className="mt-4">
        <h2 className="text-3xl font-bold text-(--text-1)">Non Autorizzato</h2>
        <p className="text-(--text-2) mt-2 max-w-md">
          Ops! Sembra che tu non sia autorizzato a vedere questa pagina o che la tua sessione sia terminata.
        </p>
      </div>

      <button
        onClick={() => navigate('/')}
        className="mt-8 px-10 py-4 bg-(--color-4) text-(--bg-3) font-bold rounded-xl shadow-lg hover:bg-[#1a365d] transition-all active:scale-95"
      >
        Torna al Login
      </button>
    </div>
  );
}