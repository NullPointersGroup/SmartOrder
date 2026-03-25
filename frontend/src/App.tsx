import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AuthPage from './auth/AuthPage';
import { ChatView } from './chat/ChatView';
import { ProtectedRoute } from './ProtectedRoute';
import { Unauthorized } from './HTTPError/401';
import { NotFound } from './HTTPError/404';
import { ServerError } from './HTTPError/500';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/servererror" element={<ServerError />} />

        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <ChatView />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}