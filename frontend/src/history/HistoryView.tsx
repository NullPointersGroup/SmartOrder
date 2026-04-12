import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../auth/authStore';
import { useHistoryViewModel } from './HistoryViewModel';
import { usePageTitle } from '../hooks/usePageTitle';
import { OrderRow } from './OrderRow';
import { OrderDetailsModal } from './OrderDetailsModal';
import { Pagination } from './Pagination';
import { NavBar } from '../chat/NavBar';
import { Profile } from '../chat/Profile';
import { useNavigate } from 'react-router-dom';

export const HistoryView: React.FC = () => {
  /**
  @brief mostra la pagina dello storico
  @req RF-OB_79
  @req RF-OB_80
  @req RF-DE_112
  @req RF-DE_113
  @req RF-DE_114
  @req RF-DE_115
  @req RF-DE_116
  @req RF-DE_117
   */
  const username = useAuthStore((state) => state.username);
  const admin = useAuthStore((state) => state.admin);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const [profileOpen, setProfileOpen] = useState(false);

  // ── Stato filtro data ──────────────────────────────────────────────────────
  const [filtroAperto, setFiltroAperto] = useState(false);
  const [dataInizio, setDataInizio] = useState('');
  const [dataFine, setDataFine] = useState('');
  const filtroRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const title = admin ? 'Storico Ordini (Admin)' : 'Storico Ordini';
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
  } = useHistoryViewModel();

  useEffect(() => {
    caricaPagina(1);
  }, [caricaPagina]);

  // Chiude il pannello filtro cliccando fuori
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filtroRef.current && !filtroRef.current.contains(e.target as Node)) {
        setFiltroAperto(false);
      }
    };
    if (filtroAperto) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [filtroAperto]);

  // ── Filtraggio ordini per data ─────────────────────────────────────────────
  const ordiniFiltrati = ordini.filter((ordine) => {
    // ordine.data atteso come stringa ISO, es. "2024-03-15"
    const dataOrdine = ordine.data.slice(0, 10); // prende solo YYYY-MM-DD
    if (dataInizio && dataOrdine < dataInizio) return false;
    if (dataFine && dataOrdine > dataFine) return false;
    return true;
  });

  const filtroAttivo = dataInizio !== '' || dataFine !== '';

  const resetFiltro = () => {
    setDataInizio('');
    setDataFine('');
    caricaPagina(1, '', '');
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    navigate('/');
    clearAuth();
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
  } else if (ordiniFiltrati.length === 0) {
    contenutoTabella = (
      <div className="flex items-center justify-center py-24">
        <span className="text-sm text-(--text-1)">
          {filtroAttivo ? 'Nessun ordine corrisponde al filtro' : 'Nessun ordine effettuato'}
        </span>
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
              {ordiniFiltrati.map((ordine) => (
                <OrderRow
                  key={ordine.codice_ordine}
                  ordine={ordine}
                  isAdmin={isAdmin}
                  onApriDettaglio={apriDettaglio}
                />
              ))}
            </tbody>
          </table>
        </div>

        <Pagination
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

          {/* Destra: badge pagina + icona filtro */}
          <div className="flex items-center gap-2">
            {!loading && ordini.length > 0 && (
              <span className="text-xs font-mono text-(--text-2) bg-(--bg-2) border border-(--border) px-3 py-1.5 rounded-full">
                pag. {pagina} / {totalePagine}
              </span>
            )}

            {/* ── Filtro data ─────────────────────────────────────── RF-DE_115/116 */}
            <div className="relative" ref={filtroRef}>
              <button
                onClick={() => setFiltroAperto((v) => !v)}
                title="Filtra per data"
                className={[
                  'relative flex items-center justify-center w-8 h-8 rounded-full border transition-colors',
                  filtroAttivo
                    ? 'bg-(--color-2) border-(--color-2) text-white'
                    : 'bg-(--bg-2) border-(--border) text-(--text-2) hover:border-(--color-2) hover:text-(--color-2)',
                ].join(' ')}
              >
                {/* Icona calendario — RF-DE_115 */}
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                {/* Pallino indicatore filtro attivo */}
                {filtroAttivo && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-white border border-(--color-2)" />
                )}
              </button>

              {/* ── Pannello filtro ───────────────────────── RF-DE_113/114/117/118 */}
              {filtroAperto && (
                <div className="absolute right-0 mt-2 w-64 bg-(--bg-3) border border-(--border) rounded-xl shadow-lg p-4 z-50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold font-mono uppercase tracking-[0.15em] text-(--text-4)">
                      Filtra per data
                    </span>
                    {filtroAttivo && (
                      <button
                        onClick={resetFiltro}
                        className="text-[10px] font-mono text-(--color-2) hover:underline"
                      >
                        Azzera
                      </button>
                    )}
                  </div>

                  {/* Da — RF-DE_117 */}
                  <div className="mb-3">
                    <p className="block text-xs text-(--text-4) mb-1">Da</p>
                    <input
                      type="date"
                      value={dataInizio}
                      max={dataFine || undefined}
                      onChange={(e) => {
                        setDataInizio(e.target.value);
                        caricaPagina(1, e.target.value, dataFine);
                      }}
                      className="w-full text-sm bg-(--bg-2) border border-(--border) rounded-lg px-3 py-1.5 text-(--text-1) focus:outline-none focus:border-(--color-2)"
                    />
                  </div>

                  {/* A — RF-DE_118 */}
                  <div>
                    <p className="block text-xs text-(--text-4) mb-1">A</p>
                    <input
                      type="date"
                      value={dataFine}
                      min={dataInizio || undefined}
                      onChange={(e) => {
                        setDataFine(e.target.value);
                        caricaPagina(1, dataInizio, e.target.value);
                      }}
                      className="w-full text-sm bg-(--bg-2) border border-(--border) rounded-lg px-3 py-1.5 text-(--text-1) focus:outline-none focus:border-(--color-2)"
                    />
                  </div>

                  <p className="text-[10px] text-(--text-4) mt-3 leading-relaxed">
                    Lascia "A" vuoto per vedere tutti gli ordini da una certa data in poi.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabella */}
        <div className="bg-(--bg-3) border border-(--border) rounded-xl shadow-sm overflow-hidden">
          {contenutoTabella}
        </div>
      </div>

      {ordineScelto && (
        <OrderDetailsModal
          ordine={ordineScelto}
          isAdmin={isAdmin}
          onChiudi={chiudiDettaglio}
          onDuplica={duplicaOrdine}
          erroreDuplica={erroreDuplica}
          onRefresh={() => caricaPagina(pagina)}
        />
      )}
    </div>
  );
};
