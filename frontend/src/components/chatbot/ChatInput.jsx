import React from 'react';
import { Send, Sparkles } from 'lucide-react';

const ChatInput = ({ inputValue, setInputValue, onSendMessage, quickReplies }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSendMessage();
  };

  return (
    <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 space-y-3">
      {/* Quick Replies */}
      {quickReplies && quickReplies.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {quickReplies.map((chip, index) => (
            <button
              key={index}
              onClick={() => onSendMessage(chip)}
              className="text-[11px] font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-full hover:bg-[#1a3a5c] hover:text-white dark:hover:bg-[#d4a017] dark:hover:text-slate-900 transition-all border border-slate-200 dark:border-slate-600 active:scale-95"
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      {/* Input Field */}
      <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your question..."
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-4 pr-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]/20 dark:focus:ring-[#d4a017]/20 focus:border-[#1a3a5c] dark:focus:border-[#d4a017] transition-all text-slate-900 dark:text-slate-100"
          />
          <Sparkles className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600 pointer-events-none" size={16} />
        </div>
        <button
          type="submit"
          disabled={!inputValue.trim()}
          className="bg-[#1a3a5c] dark:bg-[#d4a017] text-white dark:text-slate-900 p-3 rounded-xl hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-[#1a3a5c]/20 dark:shadow-[#d4a017]/20 active:scale-95 shrink-0"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
};

export default ChatInput;
