import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../auth/authStore';

export function ChatView() {
  const username = useAuthStore((state) => state.username);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await fetch("http://localhost:8000/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Errore logout:", err);
    } finally {
      clearAuth();
      navigate("/");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 bg-gray-50">
      <div className="text-9xl font-bold text-[#22477b] uppercase tracking-tighter text-center px-4">
        {username || "Utente"}
      </div>
      
      <button
        onClick={handleLogout}
        className="px-8 py-4 text-xl bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-lg transition-all active:scale-95"
      >
        Logout
      </button>
    </div>
  );
}