import { usePageTitle } from "../hooks/usePageTitle";

export function ServerError() {

  usePageTitle("Errore server");

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <div className="mb-6 text-(--color-4)">
        <svg className="w-20 h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>

      <h1 className="text-3xl font-bold text-(--text-1)">
        Errore di Sistema
      </h1>

      <p className="text-(--text-2) mt-3 max-w-md mx-auto">
        Qualcosa è andato storto nei nostri server. I nostri tecnici sono già stati avvisati.
      </p>

      <button
        onClick={() => globalThis.location.reload()}
        className="mt-8 px-8 py-3 border-2 border-(--color-4) text-(--color-4) font-bold rounded-xl hover:bg-gray-50 transition-all active:scale-95"
      >
        Riprova a caricare
      </button>
    </div>
  );
}