import React, { useEffect, useState } from 'react';
import { useChatViewModel } from './ChatViewModel';
import { ConversationSidebar } from './ConversationSidebar';
import { CartSidebar } from './CartSidebar';
import { ChatArea } from './ChatArea';

export const ChatView: React.FC = () => {
  const vm = useChatViewModel();
  const { error, setError } = vm;
  const [isLeftOpen, setIsLeftOpen] = useState(true);
  const [isRightOpen, setIsRightOpen] = useState(true);

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(null), 4000);
    return () => clearTimeout(t);
  }, [error, setError]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white text-stone-900">
      
      {/* sidebar sinistra */}
      <div 
        className={`relative h-full transition-all duration-500 ease-in-out flex-shrink-0 flex border-r border-stone-200 bg-[#fcfcfc]
          ${isLeftOpen ? 'w-72' : 'w-14'}`}
      >
        <div className="absolute top-6 right-3 z-50">
          <button
            onClick={() => setIsLeftOpen(!isLeftOpen)}
            className="p-2 text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
          >
            {isLeftOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            )}
          </button>
        </div>

        <div className={`flex-1 h-full overflow-hidden transition-opacity duration-300 ${isLeftOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <ConversationSidebar
            {...vm}
            onSelect={vm.selectConversation}
            onCreate={vm.createConversation}
            onRename={vm.renameConversation}
            onDelete={vm.deleteConversation}
            onLogout={vm.logout}
          />
        </div>
      </div>

      {/* ── AREA CHAT CENTRALE ── */}
      <main className="relative flex-1 h-full min-w-0 flex flex-col overflow-hidden bg-white">
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

      {/* sidebar destra */}
      <div 
        className={`relative h-full transition-all duration-500 ease-in-out flex-shrink-0 flex border-l border-stone-200 bg-white
          ${isRightOpen ? 'w-80' : 'w-14'}`}
      >
        {/* Pulsante Toggle Unificato (Sempre a sinistra della sidebar) */}
        <div className="absolute top-6 left-3 z-50">
          <button
            onClick={() => setIsRightOpen(!isRightOpen)}
            className="p-2 text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
          >
            {isRightOpen ? (
              /* Icona Freccia per CHIUDERE */
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            ) : (
              /* Icona CARRELLO per APRIRE */
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>
              </svg>
            )}
          </button>
        </div>

        <div className={`flex-1 h-full overflow-hidden transition-opacity duration-300 ${isRightOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <CartSidebar products={vm.cartProducts} />
        </div>
      </div>

      {/* error */}
      {vm.error && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-red-600 text-white rounded-lg shadow-xl z-[100]">
          {vm.error}
        </div>
      )}
    </div>
  );
};