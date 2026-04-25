import React from 'react';
import { Bot, User } from 'lucide-react';

const ChatMessage = ({ msg }) => {
  const isBot = msg.sender === 'bot';

  return (
    <div className={`flex ${isBot ? 'justify-start' : 'justify-end'} animate-in slide-in-from-bottom-2 fade-in duration-300`}>
      <div className={`flex gap-3 max-w-[85%] ${isBot ? 'flex-row' : 'flex-row-reverse'}`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
          isBot 
            ? 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300' 
            : 'bg-[#1a3a5c] dark:bg-[#d4a017] text-white dark:text-slate-900'
        }`}>
          {isBot ? <Bot size={16} /> : <User size={16} />}
        </div>
        
        <div className={`flex flex-col ${isBot ? 'items-start' : 'items-end'}`}>
          <div className={`p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
            isBot 
              ? 'bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-slate-100 rounded-tl-none' 
              : 'bg-[#1a3a5c] text-white dark:bg-[#d4a017] dark:text-slate-900 rounded-tr-none'
          }`}>
            {msg.text}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 px-1">
            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
