import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AuthPage from './auth/AuthPage';
// import Chat from './chat/Chat';
// import Storico from './storico/Storico';

function App() {
  /**
  @brief genera la configurazione dell'app con i vari routing
  @bug da configurare chat e storico
  @return l'app nel complesso
   */
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"     element={<AuthPage />} />
        {/* <Route path="/chat" element={<Chat />} /> */}
        <Route path="/chat" element={<div className = "text-9xl">Ciao</div>} />
        {/* <Route path="/storico" element={<Storico />} /> */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;