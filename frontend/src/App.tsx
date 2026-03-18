import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AuthPage from './auth/AuthPage';
import { useAuthStore } from './auth/authStore';
// import Chat from './chat/Chat';
// import Storico from './storico/Storico';

function App() {
  /**
  @brief genera la configurazione dell'app con i vari routing
  @bug da configurare chat e storico
  @return l'app nel complesso
   */
  const username = useAuthStore((state) => state.username);
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"     element={<AuthPage />} />
        {/* <Route path="/chat" element={<Chat />} /> */}
        <Route path="/chat" element={<div className="text-9xl">{username}</div>} />
        {/* <Route path="/storico" element={<Storico />} /> */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;