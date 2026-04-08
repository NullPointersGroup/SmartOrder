import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuthStore } from "./auth/authStore";

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: Readonly<ProtectedRouteProps>) {
  const { isAuthenticated, loggedOut } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to={loggedOut ? '/' : '/unauthorized'} replace />;
  }

  return <>{children}</>;
}