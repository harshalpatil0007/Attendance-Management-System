import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Headset, X } from 'lucide-react';
import { gsap } from 'gsap';
import axios from 'axios';
import { API_BASE_URL } from '../../config/apiConfig';
import ChatWindow from './ChatWindow';

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      text: "Hello! 👋 I’m your SSBTCOET assistant. Ask me anything about attendance, marks, timetable, or get help with the portal.", 
      sender: 'bot', 
      timestamp: new Date() 
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [quickReplies, setQuickReplies] = useState(["Mark Attendance", "View ISE Marks", "Timetable Help", "75% Rule"]);
  
  const fabRef = useRef(null);
  const windowRef = useRef(null);
  const user = JSON.parse(localStorage.getItem('attendease_user') || 'null');

  // GSAP Animations
  useEffect(() => {
    if (isOpen) {
      // Animation when opening
      gsap.fromTo(windowRef.current, 
        { scale: 0, opacity: 0, transformOrigin: 'bottom right' },
        { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.7)' }
      );
      gsap.to(fabRef.current, { scale: 0, opacity: 0, duration: 0.3 });
    } else {
      // Animation when closing
      if (windowRef.current) {
        gsap.to(windowRef.current, { scale: 0, opacity: 0, duration: 0.3, ease: 'power2.in' });
      }
      gsap.to(fabRef.current, { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.7)' });
    }
  }, [isOpen]);

  const handleSendMessage = async (text = inputValue) => {
    const messageText = typeof text === 'string' ? text : inputValue;
    if (!messageText.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: messageText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);
    setQuickReplies([]); // Hide replies while processing

    try {
      const token = localStorage.getItem('attendease_token');
      const response = await axios.post(`${API_BASE_URL}/chatbot/message`, 
        { message: messageText, context: user ? 'dashboard' : 'homepage' },
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
      }, 600); // Small delay for natural feel

    } catch (error) {
      console.error("Chatbot Error:", error);
      const errorMessage = {
        id: Date.now() + 1,
        text: "I'm having trouble connecting to my brain right now. Please try again later!",
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] font-sans">
      {/* Floating Action Button */}
      <button
        ref={fabRef}
        onClick={() => setIsOpen(true)}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all group relative active:scale-90 ${
          isOpen ? 'pointer-events-none opacity-0' : 'opacity-100'
        } bg-[#1a3a5c] dark:bg-[#d4a017] text-white dark:text-slate-900`}
        title="Need Help?"
      >
        <Headset size={28} className="transition-transform group-hover:scale-110" />
        {/* Pulsing Badge */}
        <span className="absolute top-0 right-0 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500 border-2 border-white dark:border-slate-900"></span>
        </span>
      </button>

      {/* Chat Window Container */}
      <div 
        ref={windowRef}
        className={`fixed bottom-6 right-6 w-[380px] h-[520px] max-h-[calc(100vh-100px)] max-w-[calc(100vw-48px)] transition-all ${
          isOpen ? 'pointer-events-auto' : 'pointer-events-none opacity-0 scale-0'
        }`}
      >
        <ChatWindow 
          messages={messages}
          onClose={() => setIsOpen(false)}
          isTyping={isTyping}
          inputValue={inputValue}
          setInputValue={setInputValue}
          onSendMessage={handleSendMessage}
          quickReplies={quickReplies}
        />
      </div>
    </div>
  );
};

export default ChatBot;
