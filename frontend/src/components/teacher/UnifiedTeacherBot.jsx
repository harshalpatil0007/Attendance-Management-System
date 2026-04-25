import React, { useState, useEffect, useRef } from 'react';
import { Headset, Megaphone, X, MessageSquare, Bot } from 'lucide-react';
import { gsap } from 'gsap';
import axios from 'axios';
import { API_BASE_URL } from '../../config/apiConfig';
import ChatWindow from '../chatbot/ChatWindow';
import AnnouncementForm from './AnnouncementForm';

const UnifiedTeacherBot = ({ assignedClasses, setActiveTab }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeView, setActiveView] = useState('chat'); // 'chat' or 'update'
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      text: "Hello Professor! 👋 I'm your Faculty Assistant. I can help with attendance, marks, or you can send a Quick Update to students.", 
      sender: 'bot', 
      timestamp: new Date() 
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [quickReplies, setQuickReplies] = useState(["Mark Attendance", "View ISE Marks", "Send Announcement", "75% Rule"]);
  
  const fabRef = useRef(null);
  const windowRef = useRef(null);
  const user = JSON.parse(localStorage.getItem('attendease_user') || 'null');

  useEffect(() => {
    if (isOpen) {
      gsap.fromTo(windowRef.current, 
        { scale: 0, opacity: 0, transformOrigin: 'bottom right' },
        { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.7)' }
      );
      gsap.to(fabRef.current, { scale: 0, opacity: 0, duration: 0.3 });
    } else {
      if (windowRef.current) {
        gsap.to(windowRef.current, { scale: 0, opacity: 0, duration: 0.3, ease: 'power2.in' });
      }
      gsap.to(fabRef.current, { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.7)' });
    }
  }, [isOpen]);

  const handleSendMessage = async (text = inputValue) => {
    const messageText = typeof text === 'string' ? text : inputValue;
    if (!messageText.trim()) return;

    if (messageText === "Send Announcement") {
        setActiveView('update');
        return;
    }

    const userMessage = {
      id: Date.now(),
      text: messageText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);
    setQuickReplies([]);

    try {
      const token = localStorage.getItem('attendease_token');
      const response = await axios.post(`${API_BASE_URL}/chatbot/message`, 
        { message: messageText, context: 'dashboard' },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );

      const botMessage = {
        id: Date.now() + 1,
        text: response.data.reply,
        sender: 'bot',
        timestamp: new Date()
      };

      setTimeout(() => {
        setMessages(prev => [...prev, botMessage]);
        setQuickReplies(response.data.quickReplies || []);
        setIsTyping(false);
      }, 600);

    } catch (error) {
      console.error("Chatbot Error:", error);
      const errorMessage = {
        id: Date.now() + 1,
        text: "I'm having trouble connecting. Please try again!",
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-[9999] font-sans">
      {/* Floating Action Button */}
      <button
        ref={fabRef}
        onClick={() => setIsOpen(true)}
        className={`w-16 h-16 rounded-[24px] flex items-center justify-center shadow-2xl transition-all group relative active:scale-90 ${
          isOpen ? 'pointer-events-none opacity-0' : 'opacity-100'
        } bg-[#1a3a5c] text-white`}
      >
        <div className="absolute inset-0 bg-brand-500 rounded-[24px] scale-0 group-hover:scale-100 transition-transform duration-500 origin-center opacity-20"></div>
        <Headset size={32} className="relative z-10 transition-transform group-hover:scale-110" />
        <span className="absolute -top-1 -right-1 flex h-5 w-5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-5 w-5 bg-green-500 border-4 border-white dark:border-slate-900"></span>
        </span>
      </button>

      {/* Unified Window */}
      <div 
        ref={windowRef}
        className={`fixed bottom-8 right-8 w-[420px] h-[600px] max-h-[calc(100vh-100px)] max-w-[calc(100vw-48px)] transition-all ${
          isOpen ? 'pointer-events-auto' : 'pointer-events-none opacity-0 scale-0'
        } flex flex-col bg-white dark:bg-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-[32px] overflow-hidden border border-slate-100 dark:border-slate-700`}
      >
        {/* Header with Tabs */}
        <div className="bg-[#1a3a5c] p-6 shrink-0">
          <div className="flex items-center justify-between text-white mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md">
                {activeView === 'chat' ? <Bot className="text-brand-400" /> : <Megaphone className="text-brand-400" />}
              </div>
              <div>
                <h3 className="font-black text-sm uppercase tracking-widest leading-none">Faculty Hub</h3>
                <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest mt-1">
                  {activeView === 'chat' ? 'AI Assistant Online' : 'Quick Broadcast Mode'}
                </p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="flex bg-black/20 p-1 rounded-2xl">
            <button 
              onClick={() => setActiveView('chat')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeView === 'chat' ? 'bg-white text-slate-900 shadow-lg' : 'text-white/60 hover:text-white'}`}
            >
              <MessageSquare size={14} /> AI Chat
            </button>
            <button 
              onClick={() => setActiveView('update')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeView === 'update' ? 'bg-white text-slate-900 shadow-lg' : 'text-white/60 hover:text-white'}`}
            >
              <Megaphone size={14} /> Quick Update
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden flex flex-col bg-slate-50/50 dark:bg-slate-900/50">
          {activeView === 'chat' ? (
            <ChatWindow 
              messages={messages}
              onClose={() => setIsOpen(false)}
              isTyping={isTyping}
              inputValue={inputValue}
              setInputValue={setInputValue}
              onSendMessage={handleSendMessage}
              quickReplies={quickReplies}
              hideHeader={true}
            />
          ) : (
            <AnnouncementForm 
              assignedClasses={assignedClasses}
              onSuccess={() => {
                  // Optional: stay in update view or switch back
              }}
              onAdvancedClick={() => {
                setIsOpen(false);
                setActiveTab('announcements');
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default UnifiedTeacherBot;
