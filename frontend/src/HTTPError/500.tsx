import { usePageTitle } from "../hooks/usePageTitle";

export function ServerError() {
  /**
  @brief restituisce la pagina 500 nel caso di errore server (ci si augura che non esca mai)
   */

  usePageTitle("Errore server");

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white p-4 text-center">
      <div className="mb-6 text-red-500">
        <svg className="w-20 h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h1 className="text-3xl font-serif font-bold text-gray-800">Errore di Sistema</h1>
      <p className="text-black mt-3 max-w-md mx-auto">
        Qualcosa è andato storto nei nostri server. I nostri tecnici sono già stati avvisati.
      </p>
      <button
        onClick={() => globalThis.location.reload()}
        className="mt-8 px-8 py-3 border-2 border-[#22477b] text-[#22477b] font-bold rounded-lg hover:bg-gray-50 transition-all"
      >
        Riprova a caricare
      </button>
    </div>
  );
}