import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../auth/authStore';
import { useStoricoViewModel } from './StoricoViewModel';
import { usePageTitle } from '../hooks/usePageTitle';
import { OrdineRow } from './OrdineRow';
import { DettaglioModal } from './DettaglioModal';
import { Paginazione } from './Paginazione';
import { NavBar } from '../chat/NavBar';
import { Profile } from '../chat/Profile';

export const StoricoView: React.FC = () => {
  const username = useAuthStore((state) => state.username);
  const admin = useAuthStore((state) => state.admin);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const [profileOpen, setProfileOpen] = useState(false);

  const title = admin === 'admin' ? 'Storico Ordini (Admin)' : 'Storico Ordini';
  usePageTitle(title);

  const {
    ordini,
    pagina,
    totalePagine,
    ordineScelto,
    loading,
    errore,
    erroreDuplica,
    isAdmin,
    caricaPagina,
    apriDettaglio,
    chiudiDettaglio,
    duplicaOrdine,
  } = useStoricoViewModel();

  useEffect(() => {
    caricaPagina(1);
  }, [caricaPagina]);

  const handleLogout = () => {
    clearAuth();
    globalThis.location.href = '/';
  };

  const handleProfile = () => {
    setProfileOpen(true);
  };

  let contenutoTabella: React.ReactNode;
  if (loading) {
    contenutoTabella = (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div className="w-5 h-5 border-2 border-(--border) border-t-(--color-2) rounded-full animate-spin" />
        <span className="text-xs text-(--text-4) font-mono tracking-widest uppercase">Caricamento</span>
      </div>
    );
  } else if (errore) {
    contenutoTabella = (
      <div className="flex flex-col items-center justify-center py-24 gap-2">
        <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center mb-1">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--error)" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <span className="text-sm text-(--error)">{errore}</span>
      </div>
    );
  } else if (ordini.length === 0) {
    contenutoTabella = (
      <div className="flex items-center justify-center py-24">
        <span className="text-sm text-(--text-1)">Nessun ordine effettuato</span>
      </div>
    );
  } else {
    contenutoTabella = (
      <>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-(--color-3) bg-(--color-3)">
                <th className="py-3 px-5 text-[10px] font-bold uppercase tracking-[0.15em] text-white">
                  Codice
                </th>
                <th className="py-3 px-5 text-[10px] font-bold uppercase tracking-[0.15em] text-white">
                  Data
                </th>
                {isAdmin && (
                  <th className="py-3 px-5 text-[10px] font-bold uppercase tracking-[0.15em] text-white">
                    Cliente
                  </th>
                )}
                <th className="py-3 px-5 text-[10px] font-bold uppercase tracking-[0.15em] text-white">
                  Prodotti
                </th>
                <th />
              </tr>
            </thead>
            <tbody>
              {ordini.map((ordine) => (
                <OrdineRow
                  key={ordine.codice_ordine}
                  ordine={ordine}
                  isAdmin={isAdmin}
                  onApriDettaglio={apriDettaglio}
                />
              ))}
            </tbody>
          </table>
        </div>

        <Paginazione
          pagina={pagina}
          totalePagine={totalePagine}
          onCambia={caricaPagina}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-(--bg-1)">
      <NavBar
        username={username ?? ''}
        onLogout={handleLogout}
        onProfile={handleProfile}
      />
      {profileOpen && (
        <Profile
          onClose={() => setProfileOpen(false)}
          username={username ?? ''}
          onLogout={handleLogout}
        />
      )}

      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="text-[10px] font-bold font-mono uppercase tracking-[0.15em] text-(--color-2) mb-1.5">
              {isAdmin ? 'Pannello Admin' : 'Area Cliente'}
            </p>
            <h1 className="text-2xl font-semibold text-(--text-1) tracking-tight">
              Storico Ordini
            </h1>
            {isAdmin && (
              <p className="text-sm text-(--text-4) mt-1">
                Visualizzazione completa — tutti i clienti
              </p>
            )}
          </div>

          {/* Badge totale pagine */}
          {!loading && ordini.length > 0 && (
            <span className="text-xs font-mono text-(--text-2) bg-(--bg-2) border border-(--border) px-3 py-1.5 rounded-full">
              pag. {pagina} / {totalePagine}
            </span>
          )}
        </div>

        {/* Tabella */}
        <div className="bg-(--bg-3) border border-(--border) rounded-xl shadow-sm overflow-hidden">
          {contenutoTabella}
        </div>
      </div>

      {ordineScelto && (
        <DettaglioModal
          ordine={ordineScelto}
          isAdmin={isAdmin}
          onChiudi={chiudiDettaglio}
          onDuplica={duplicaOrdine}
          erroreDuplica={erroreDuplica}
        />
      )}
    </div>
  );
};