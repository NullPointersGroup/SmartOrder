import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuthStore } from "./auth/authStore"; // Assicurati che il percorso sia corretto

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: Readonly<ProtectedRouteProps>) {
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const setAuth = useAuthStore((state) => state.setAuth);

  const [loading, setLoading] = useState(true);
  const [valid, setValid] = useState(false);

  useEffect(() => {
    fetch("http://localhost:8000/auth/me", {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Errore nell'autenticazione");
        return res.json();
      })
      .then((data) => {
        setAuth("", data.username);
        setValid(true);
      })
      .catch(() => {
        clearAuth();
        setValid(false);
      })
      .finally(() => setLoading(false));
  }, [setAuth, clearAuth]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="w-10 h-10 border-4 border-[#22477b] border-t-transparent rounded-full animate-spin"></div>
        <span className="mt-4 text-gray-500 font-medium">Verifica in corso...</span> 
      </div>
    );
  }

  if (!valid) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}