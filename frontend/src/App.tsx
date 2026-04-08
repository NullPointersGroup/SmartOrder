import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AuthPage from './auth/AuthPage';
import { ChatView } from './chat/ChatView';
import { StoricoView } from './storico/StoricoView';
import { ProtectedRoute } from './ProtectedRoute';
import { Unauthorized } from './HTTPError/401';
import { NotFound } from './HTTPError/404';
import { ServerError } from './HTTPError/500';
import { useAuthStore } from './auth/authStore';

export default function App() {
  const [appLoading, setAppLoading] = useState(true);
  const { initAuth } = useAuthStore();

  useEffect(() => {
    initAuth().finally(() => setAppLoading(false));
  }, [initAuth]);

  if (appLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="w-10 h-10 border-4 border-[#22477b] border-t-transparent rounded-full animate-spin"></div>
        <span className="mt-4 text-gray-500 font-medium">Verifica in corso...</span>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/servererror" element={<ServerError />} />

        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <ChatView />
            </ProtectedRoute>
          }
        />

        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <StoricoView />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}