import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '../hooks/usePageTitle';

export function Unauthorized() {
  const navigate = useNavigate();

  usePageTitle("Non autorizzato");

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      {/* Icona o Numero Gigante */}
      <h1 className="text-9xl font-extrabold text-[#22477b] tracking-tighter">
        401
      </h1>
      
      <div className="mt-4">
        <h2 className="text-3xl font-bold text-gray-800">Non Autorizzato</h2>
        <p className="text-black mt-2 max-w-md">
          Ops! Sembra che tu non sia autorizzato a vedere questa pagina o che la tua sessione sia terminata.
        </p>
      </div>

      <button
        onClick={() => navigate('/')}
        className="mt-8 px-10 py-4 bg-[#22477b] text-white font-bold rounded-xl shadow-lg hover:bg-[#1a365d] transition-all active:scale-95"
      >
        Torna al Login
      </button>
    </div>
  );
}