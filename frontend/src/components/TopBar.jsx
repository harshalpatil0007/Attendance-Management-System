import React, { useState } from 'react';
import { Bell, Search, Calendar, MapPin, X, Clock, CheckCircle, AlertCircle, Coins, Info, HelpCircle, Sun, Moon } from 'lucide-react';
import { BASE_URL } from '../config/apiConfig';
import { useTheme } from '../context/ThemeContext';

const TopBar = ({ user, notifications = [], setActiveTab, onClearNotifications }) => {
  const { theme, toggleTheme } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [showCoinInfo, setShowCoinInfo] = useState(false);

  // Show minimum 2 unless expanded
  const displayNotifications = showAll ? notifications : notifications.slice(0, 2);

  const handleNotificationClick = (n) => {
    setShowNotifications(false);
    if (!n) {
      if (setActiveTab) setActiveTab('notifications');
      return;
    }
    
    // Smart redirection
    if (n.tab && setActiveTab) {
      setActiveTab(n.tab);
    } else if (n.type === 'attendance') {
      setActiveTab('attendance');
    } else if (n.type === 'marks') {
      setActiveTab('marks');
    } else if (n.type === 'certificate') {
      setActiveTab('certificates');
    } else if (setActiveTab) {
      setActiveTab('notifications');
    }
  };

  return (
    <header className="h-16 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-white/10 px-4 md:px-8 flex items-center justify-between sticky top-0 z-40 transition-colors duration-300">
      <div className="flex items-center gap-4">
        <div className="text-slate-400">
           <Search className="w-5 h-5" />
        </div>
        <input 
          type="text" 
          placeholder="Search subjects, marks, or records..." 
          className="bg-transparent border-none outline-none text-sm w-40 md:w-64 text-slate-600 focus:ring-0"
        />
      </div>

      <div className="flex items-center gap-3 md:gap-6">
        <div className="hidden sm:flex flex-col items-end">
          <span className="text-sm font-bold text-slate-800 dark:text-white">{user?.name}</span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">{user?.role} • {user?.department}</span>
        </div>
        
        <div className="h-10 w-10 rounded-full bg-slate-100 border-2 border-slate-200 overflow-hidden shadow-sm flex-shrink-0">
          {user?.profile_image ? (
            <img src={user.profile_image.startsWith('http') ? user.profile_image : `${BASE_URL}${user.profile_image}`} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-brand-500 text-white font-bold">
              {user?.name?.charAt(0)}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 md:gap-3 pl-3 md:pl-6 border-l border-slate-100 relative">
          <div className="relative">
            <button 
              onClick={() => {
                setShowNotifications(!showNotifications);
                if (!showNotifications) setShowAll(false);
              }}
              className={`p-2 rounded-xl transition-all relative ${showNotifications ? 'bg-brand-50 text-brand-500' : 'text-slate-400 hover:text-brand-500 hover:bg-slate-50'}`}
            >
              <Bell className="w-5 h-5" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-black rounded-full border-2 border-white flex items-center justify-center shadow-sm">
                  {notifications.length > 9 ? '9+' : notifications.length}
                </span>
              )}
            </button>

            {showNotifications && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowNotifications(false)}
                ></div>
                <div className="absolute right-0 mt-3 w-[calc(100vw-2rem)] sm:w-80 bg-white dark:bg-slate-500 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl shadow-2xl z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right transition-colors">
                  <div className="p-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-white/5">
                    <span className="font-black text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400">Notifications</span>
                    <div className="flex items-center gap-2">
                       {notifications.length > 0 && (
                         <button 
                           onClick={(e) => {
                             e.stopPropagation();
                             onClearNotifications();
                           }}
                           className="text-[9px] font-black uppercase tracking-widest text-brand-500 hover:text-brand-600 px-2 py-1 rounded-lg hover:bg-brand-50 transition-colors"
                         >
                           Clear All
                         </button>
                       )}
                       <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-slate-600">
                         <X className="w-4 h-4" />
                       </button>
                    </div>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {displayNotifications.length > 0 ? displayNotifications.map(n => (
                      <div 
                        key={n.id} 
                        onClick={() => handleNotificationClick(n)}
                        className="p-4 border-b border-slate-50 hover:bg-slate-50/50 cursor-pointer transition-colors flex gap-3 group px-4"
                      >
                        <div className={`w-10 h-10 rounded-xl bg-white dark:bg-slate-500 border border-slate-100 dark:border-white/10 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform flex-shrink-0 transition-colors`}>
                          {(() => {
                              const dynamicIconString = typeof n.icon === 'string' ? n.icon : null;
                              if (dynamicIconString === 'Coins') return <Coins className={`w-5 h-5 ${n.color || 'text-brand-500'}`} />;
                              if (dynamicIconString === 'BarChart3') return <AlertCircle className={`w-5 h-5 ${n.color || 'text-brand-500'}`} />; // Use AlertCircle as BarChart3 substitution
                              if (dynamicIconString === 'Info') return <Info className={`w-5 h-5 ${n.color || 'text-brand-500'}`} />;
                              // Render by function if type is funnction
                              if (typeof n.icon === 'function') return <n.icon className={`w-5 h-5 ${n.color || 'text-brand-500'}`} />;
                              return <Bell className={`w-5 h-5 ${n.color || 'text-brand-500'}`} />;
                          })()}
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-bold text-slate-700 line-clamp-2">{n.text || n.title}</p>
                          <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {n.time || new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    )) : (
                      <div className="p-10 text-center text-slate-400">
                        <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                        <p className="text-[10px] font-black uppercase tracking-widest">No New Alerts</p>
                      </div>
                    )}
                  </div>
                  <div className="p-3 bg-slate-50/50 border-t border-slate-100">
                     <button 
                        onClick={() => {
                          if (showAll) {
                             handleNotificationClick();
                          } else {
                             setShowAll(true);
                          }
                        }}
                        className="w-full py-2.5 bg-white dark:bg-slate-500 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-500 hover:text-white hover:border-brand-500 transition-all shadow-sm active:scale-[0.98]"
                     >
                        {showAll ? 'Go to Notification Center' : 'View All Activity'}
                     </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Theme Toggle Button */}
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-xl transition-all text-slate-400 hover:text-brand-500 hover:bg-slate-50 dark:hover:bg-white/5"
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5 text-yellow-400" />}
          </button>
          
          {/* AT Coins Reward System */}
          <div className="relative">
            <button 
              onMouseEnter={() => setShowCoinInfo(true)}
              onMouseLeave={() => setShowCoinInfo(false)}
              className="flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-700 rounded-xl border border-amber-100 shadow-sm hover:bg-amber-100 transition-colors"
            >
               <Coins className="w-4 h-4 text-amber-500 animate-bounce" />
               <div className="flex flex-col items-start leading-tight">
                 <span className="text-[10px] font-black uppercase tracking-tighter opacity-70">AT Coins</span>
                 <span className="text-xs font-black">{user?.at_coins || 0}</span>
               </div>
               <HelpCircle className="w-3 h-3 opacity-40" />
            </button>

            {showCoinInfo && (
              <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-slate-500 rounded-2xl shadow-2xl border border-slate-100 dark:border-white/10 p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200 transition-colors">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                    <Coins className="w-4 h-4 text-amber-600" />
                  </div>
                  <h4 className="font-black text-xs uppercase tracking-widest text-slate-800">AT Coins Rewards</h4>
                </div>
                
                <div className="space-y-3">
                  <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">How to earn:</p>
                    <p className="text-xs text-slate-700 leading-relaxed">Earn <span className="text-amber-600 font-black">15 Coins</span> per subject for maintaining <span className="text-emerald-600 font-bold">&gt;75% Attendance</span>.</p>
                  </div>
                  
                  <div className="p-2 bg-amber-50 rounded-xl border border-amber-100">
                    <p className="text-[10px] font-bold text-amber-600 uppercase mb-1">Where to use:</p>
                    <ul className="text-[11px] text-amber-800 space-y-1">
                      <li className="flex items-center gap-2">• <span className="font-bold">Xerox Shop</span>: Printing & Xerox</li>
                      <li className="flex items-center gap-2">• <span className="font-bold">Store Room</span>: Files, Pages & Index</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="hidden sm:flex flex-col items-start px-3 py-1 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 shadow-sm">
             <span className="text-[8px] font-black uppercase tracking-tighter opacity-70">Security Status</span>
             <span className="text-[10px] font-bold flex items-center gap-1">
               <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
               Device Trusted
             </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
