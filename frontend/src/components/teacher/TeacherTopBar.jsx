import { Bell, Search, User, LogOut, Clock, Calendar, X, AlertCircle, CheckCircle, Info, Sun, Moon } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { BASE_URL } from '../../config/apiConfig';
import { useTheme } from '../../context/ThemeContext';

const TeacherTopBar = ({ user, notifications = [], setActiveTab, onClearNotifications }) => {
  const { theme, toggleTheme } = useTheme();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const notificationRef = useRef(null);

  const displayNotifications = showAll ? notifications : notifications.slice(0, 2);

  const handleNotificationClick = (n) => {
    setShowNotifications(false);
    if (!n) {
      if (setActiveTab) setActiveTab('announcements');
      return;
    }

    if (n.tab && setActiveTab) {
      setActiveTab(n.tab);
    } else if (n.type === 'attendance') {
      setActiveTab('history');
    } else if (n.type === 'certificate') {
      setActiveTab('certificates');
    } else if (setActiveTab) {
      setActiveTab('announcements');
    }
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };


  return (
    <header className="h-20 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-white/10 flex items-center justify-between px-4 md:px-8 sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md transition-colors duration-300">
      <div className="flex items-center gap-6">
        <div className="flex flex-col">
            <h1 className="text-sm md:text-xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
                Welcome, <span className="text-brand-500 uppercase tracking-widest">{user?.name}</span>
            </h1>
            <div className="hidden sm:flex items-center gap-4 text-[10px] font-bold text-slate-400 dark:text-slate-200 uppercase tracking-[0.2em] transition-colors">
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(currentTime)}</span>
                <span className="flex items-center gap-1 text-brand-500"><Clock className="w-3 h-3" /> {formatTime(currentTime)}</span>
            </div>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        {/* Next Class Quick Info */}
        <div className="hidden lg:flex items-center gap-3 px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-white/5 mr-4 group hover:bg-white dark:hover:bg-slate-700 hover:shadow-md transition-all cursor-pointer">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest leading-none transition-colors">Next Class</span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">DSA - CSE-A (14:00)</span>
            </div>
        </div>

        {/* Theme Toggle Button */}
        <button 
          onClick={toggleTheme}
          className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-all border border-transparent dark:border-white/5"
          title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
        >
          {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5 text-yellow-400" />}
        </button>

        <div className="relative" ref={notificationRef}>
            <button 
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  if (!showNotifications) setShowAll(false);
                }}
                className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all relative group ${showNotifications ? 'bg-brand-50 dark:bg-brand-500/20 text-brand-500 shadow-inner' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400'}`}
            >
                <Bell className={`w-5 h-5 transition-transform ${showNotifications ? 'scale-110' : 'group-hover:rotate-12'}`} />
                {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-black rounded-full border-2 border-white flex items-center justify-center shadow-sm">
                        {notifications.length > 9 ? '9+' : notifications.length}
                    </span>
                )}
            </button>
 
            {showNotifications && (
                <div className="absolute right-0 mt-3 w-[calc(100vw-2rem)] sm:w-80 bg-white dark:bg-slate-800 border border-slate-100 dark:border-white/10 rounded-3xl shadow-2xl shadow-slate-200/50 z-[100] overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right transition-colors">
                    <div className="p-5 border-b border-slate-50 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50 backdrop-blur-sm transition-colors">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 transition-colors">Faculty Alerts</span>
                        <div className="flex items-center gap-3">
                            {notifications.length > 0 && (
                                <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onClearNotifications();
                                    }}
                                    className="text-[9px] font-black uppercase tracking-widest text-brand-500 hover:text-brand-600 px-2 py-1 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors"
                                >
                                    Clear All
                                </button>
                            )}
                            <span className="px-2 py-0.5 bg-brand-500 text-white text-[8px] font-black rounded-full uppercase tracking-tighter">New</span>
                        </div>
                    </div>
                    
                    <div className="max-h-[400px] overflow-y-auto p-2 space-y-1">
                        {displayNotifications.length > 0 ? displayNotifications.map(n => (
                            <div 
                                key={n.id} 
                                onClick={() => handleNotificationClick(n)}
                                className="p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer flex gap-4 group/item"
                            >
                                <div className={`w-12 h-12 ${n.bg || 'bg-brand-50'} rounded-2xl flex items-center justify-center group-hover/item:scale-110 transition-transform flex-shrink-0`}>
                                  {(() => {
                                      const dynamicIconString = typeof n.icon === 'string' ? n.icon : null;
                                      if (dynamicIconString === 'Coins') return <CheckCircle className={`w-5 h-5 ${n.color || 'text-brand-500'}`} />; // Use CheckCircle as proxy 
                                      if (dynamicIconString === 'BarChart3') return <AlertCircle className={`w-5 h-5 ${n.color || 'text-brand-500'}`} />; // Use AlertCircle as proxy
                                      if (dynamicIconString === 'Info') return <Info className={`w-5 h-5 ${n.color || 'text-brand-500'}`} />;
                                      // Render by function if type is funnction
                                      if (typeof n.icon === 'function') return <n.icon className={`w-5 h-5 ${n.color || 'text-brand-500'}`} />;
                                      return <Bell className={`w-5 h-5 ${n.color || 'text-brand-500'}`} />;
                                  })()}
                                </div>
                                <div className="space-y-1 overflow-hidden">
                                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200 leading-tight group-hover/item:text-brand-600 transition-colors line-clamp-2">{n.text || n.title}</p>
                                    <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1.5">
                                        <Clock className="w-3 h-3" /> {n.time || new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        )) : (
                          <div className="p-10 text-center text-slate-400">
                             <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                             <p className="text-[10px] font-black uppercase tracking-widest">No New Faculty Alerts</p>
                          </div>
                        )}
                    </div>
                    
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-white/10 transition-colors">
                        <button 
                            onClick={() => {
                              if (showAll) {
                                handleNotificationClick();
                              } else {
                                setShowAll(true);
                              }
                            }}
                            className="w-full py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-500 hover:text-white hover:border-brand-500 transition-all shadow-sm active:scale-[0.98]"
                        >
                            {showAll ? 'Go to Announcement Board' : 'View All Activity'}
                        </button>
                    </div>
                </div>
            )}
        </div>

        <div className="h-8 w-[1px] bg-slate-100 dark:bg-white/10 mx-2 transition-colors"></div>

        <div className="flex items-center gap-3 pl-2 group cursor-pointer">
            <div className="flex flex-col items-end hidden sm:flex">
                <span className="text-sm font-black text-slate-800 dark:text-white leading-none group-hover:text-brand-500 transition-colors">{user?.name}</span>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest">{user?.designation || 'Faculty Member'}</span>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 p-0.5 shadow-lg shadow-brand-500/20 group-hover:scale-110 transition-transform">
                <img
                  src={user?.profile_image ? (user.profile_image.startsWith('http') ? user.profile_image : `${BASE_URL}${user.profile_image}`) : `https://ui-avatars.com/api/?name=${user?.name}&background=6366f1&color=fff&bold=true`}
                  alt="Profile"
                  className="w-full h-full object-cover rounded-[14px] border-2 border-white"
                />
            </div>
        </div>
      </div>
    </header>
  );
};

export default TeacherTopBar;
