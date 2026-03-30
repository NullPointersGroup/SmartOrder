// App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AuthPage from './auth/AuthPage';
import { ChatView } from './chat/ChatView';
import { StoricoView } from './Storico/StoricoView';
import { ProtectedRoute } from './ProtectedRoute';
import { Unauthorized } from './HTTPError/401';
import { NotFound } from './HTTPError/404';
import { ServerError } from './HTTPError/500';
import type { UserRole } from './Storico/StoricoModel';

// Esempio: ottieni ruolo dall'utente loggato o contesto
const currentUserRole: UserRole = 'cliente'; // oppure 'admin'

export default function App() {
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
              <StoricoView role={currentUserRole} />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}