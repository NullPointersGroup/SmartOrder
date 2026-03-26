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
    <div
      className="flex h-screen w-screen overflow-hidden bg-stone-50"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
    {/* ── Toggle sinistra ── */}
    <button
      onClick={() => setIsLeftOpen(prev => !prev)}
      className="absolute top-4 left-0 z-50 w-6 h-6 bg-emerald-500 text-white rounded focus:outline-none"
    >
      {isLeftOpen ? '<' : '>'}
    </button>

    {/* ── Sidebar sinistra ── */}
    <div className={`transition-all duration-300 ${isLeftOpen ? 'w-80 min-w-[20rem] pl-8' : 'w-0 min-w-0 overflow-hidden'}`}>
      <ConversationSidebar
        conversations={vm.conversations}
        activeConvId={vm.activeConvId}
        username={vm.username}
        onSelect={vm.selectConversation}
        onCreate={vm.createConversation}
        onRename={vm.renameConversation}
        onDelete={vm.deleteConversation}
        onLogout={vm.logout}
      />
    </div>

      {/* ── Area chat centrale ── */}
      <div className="flex-1 transition-all duration-300">
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
      </div>

      {/* ── Toggle destra ── */}
      <button
        onClick={() => setIsRightOpen(prev => !prev)}
        className="absolute top-4 right-2 z-50 w-6 h-6 bg-emerald-500 text-white rounded focus:outline-none"
      >
        {isRightOpen ? '>' : '<'}
      </button>

      {/* ── Sidebar destra ── */}
      <div className={`transition-all duration-300 ${isRightOpen ? 'w-80 min-w-[20rem]' : 'w-0 min-w-0 overflow-hidden'}`}>
        <CartSidebar
          products={vm.cartProducts}
        />
      </div>

      {/* ── Toast errore ── */}
      {vm.error && (
        <div
          role="alert"
          aria-live="assertive"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-3 bg-red-600 text-white text-sm rounded-xl shadow-lg z-50 animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="7" stroke="white" strokeWidth="1.5" />
            <path d="M8 5v4M8 11v.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          {vm.error}
          <button
            onClick={() => vm.setError(null)}
            aria-label="Chiudi avviso"
            className="ml-1 hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white rounded"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M2 2l10 10M12 2L2 12" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};