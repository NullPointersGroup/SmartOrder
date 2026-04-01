import React, { useEffect, useState } from 'react';
import { useChatViewModel } from './ChatViewModel';
import { ConversationSidebar } from './ConversationSidebar';
import { CartSidebar } from './CartSidebar';
import { ChatArea } from './ChatArea';
import { NavBar } from './NavBar'
import { Profile } from './Profile'
import { usePageTitle } from '../hooks/usePageTitle';

export const ChatView: React.FC = () => {
  usePageTitle("Chat");
  const vm = useChatViewModel();
  const { error, setError } = vm;
  const [isLeftOpen, setIsLeftOpen] = useState(true);
  const [isRightOpen, setIsRightOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false)

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(null), 4000);
    return () => clearTimeout(t);
  }, [error, setError]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-(--bg-3) text-(--text-1)">
      {/* NAVBAR IN ALTO */}
      <div className="relative z-50 overflow-visible">
        <NavBar
          username={vm.username}
          onLogout={vm.logout}
          onProfile={() => setProfileOpen(true)}
        />
      </div>

      {/* PROFILE PANEL */}
      {profileOpen && (
        <Profile
          onClose={() => setProfileOpen(false)}
          username={vm.username}
          onLogout={vm.logout}
        />
      )}

      {/* CONTENUTO SOTTO */}
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar sinistra */}
        <div
          className={`relative h-full transition-all duration-500 ease-in-out shrink-0 flex border-r border-(--border) bg-(--bg-1)
            ${isLeftOpen ? 'w-72' : 'w-14'}`}
        >
          <div className={`flex-1 h-full overflow-hidden transition-opacity duration-300 ${isLeftOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <ConversationSidebar
              {...vm}
              onSelect={vm.selectConversation}
              onCreate={vm.createConversation}
              onRename={vm.renameConversation}
              onDelete={vm.deleteConversation}
              onToggleSelf={() => setIsLeftOpen(false)}
            />
          </div>

          {/* Sidebar chiusa: mostra solo l'icona chat per riaprire */}
          {!isLeftOpen && (
            <div className="flex flex-col items-center w-full pt-5 gap-3">
              <button
                onClick={() => setIsLeftOpen(true)}
                className="p-2 text-(--text-4) hover:text-(--color-2) hover:bg-(--color-1) rounded-xl transition-all"
                title="Apri conversazioni"
              >
                <svg width="18" height="18" viewBox="-1 -1 24 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="0" y="0" width="22" height="18" rx="3"/>
                  <line x1="7" y1="0" x2="7" y2="18"/>
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Lista chat */}
        <main className="relative flex-1 h-full min-w-0 flex flex-col overflow-hidden bg-(--bg-3)">
          <ChatArea
            messages={vm.messages}
            isLoading={vm.isLoadingMsgs}
            isSending={vm.isSending}
            inputText={vm.inputText}
            hasActiveConv={vm.activeConvId !== null}
            messagesEndRef={vm.messagesEndRef}
            onInputChange={vm.setInputText}
            onSend={vm.sendMessage}
          />
        </main>

        {/* Sidebar destra */}
        <div
          className={`relative h-full transition-all duration-500 ease-in-out shrink-0 flex border border-(--border) bg-(--bg-3)
            ${isRightOpen ? 'w-80' : 'w-14'}`}
        >
          {/* Sidebar aperta */}
          <div className={`flex-1 h-full overflow-hidden transition-opacity duration-300 ${isRightOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <CartSidebar
              products={vm.cartProducts}
              onToggleSelf={() => setIsRightOpen(false)}
            />
          </div>

          {/* Sidebar chiusa */}
          {!isRightOpen && (
            <div className="flex flex-col items-center w-full pt-5">
              <button
                onClick={() => setIsRightOpen(true)}
                className="p-2 text-(--text-4) hover:text-(--color-2) hover:bg-(--color-1) rounded-xl transition-all"
                title="Apri carrello"
              >
                <svg width="18" height="18" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M0 0.5 L1.5 0.5 L3.5 9.5 L11.5 9.5 L13 4 L3 4"/>
                  <circle cx="5" cy="12" r="1.2" fill="currentColor" stroke="none"/>
                  <circle cx="10.5" cy="12" r="1.2" fill="currentColor" stroke="none"/>
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Error toast */}
        {vm.error && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-(--oth-2) text-(--bg-3) rounded-lg shadow-xl z-100">
            {vm.error}
          </div>
        )}
      </div>
    </div>
  );
};