import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AuthPage from './auth/AuthPage';
// import Chat from './chat/Chat';
// import Storico from './storico/Storico';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"     element={<AuthPage />} />
        {/* <Route path="/chat" element={<Chat />} /> */}
        {/* <Route path="/storico" element={<Storico />} /> */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;