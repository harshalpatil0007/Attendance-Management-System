import React, { useRef, useEffect } from 'react';
import { X, Bot } from 'lucide-react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';

const ChatWindow = ({ 
  messages, 
  onClose, 
  isTyping, 
  inputValue, 
  setInputValue, 
  onSendMessage,
  quickReplies,
  hideHeader = false
}) => {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-800 shadow-2xl rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
      {/* Header */}
      {!hideHeader && (
        <div className="bg-[#1a3a5c] dark:bg-[#2a4a6c] p-4 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/20">
              <Bot size={24} className="text-[#d4a017]" />
            </div>
            <div>
              <h3 className="font-bold text-sm leading-tight">SSBTCOET Assistant 🤖</h3>
              <p className="text-[11px] opacity-80">How can I help you today?</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      )}

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-900/50 custom-scrollbar"
      >
        {messages.map((msg) => (
          <ChatMessage key={msg.id} msg={msg} />
        ))}
        
        {isTyping && (
          <div className="flex justify-start animate-in fade-in duration-300">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
                <Bot size={16} className="text-slate-400" />
              </div>
              <div className="bg-gray-100 dark:bg-slate-700 p-4 rounded-2xl rounded-tl-none">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <ChatInput 
        inputValue={inputValue}
        setInputValue={setInputValue}
        onSendMessage={onSendMessage}
        quickReplies={quickReplies}
      />
    </div>
  );
};

export default ChatWindow;
