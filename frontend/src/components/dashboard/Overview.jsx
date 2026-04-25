import React from 'react';
import { 
  Users, Calendar, BookOpen, Clock, 
  ChevronRight, ArrowUpRight, ArrowDownRight,
  Plus, CheckCircle2, AlertCircle
} from 'lucide-react';

const Overview = ({ user, stats, setActiveTab }) => {
  const overallAttendance = Math.round(stats.reduce((acc, curr) => acc + (curr.attended / (curr.total_classes || 1) * 100), 0) / (stats.length || 1));

  return (
    <div className="space-y-8 animate-in fade-in duration-500 transition-colors">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 transition-colors">
        <div>
           <h1 className="text-3xl font-black text-slate-800 dark:text-white mb-2 transition-colors">Hello, {user?.name.split(' ')[0]}! 👋</h1>
           <p className="text-slate-500 dark:text-slate-200 font-medium transition-colors">Here's what's happening with your academics today.</p>
        </div>
        <button 
          onClick={() => setActiveTab('mark-attendance')}
          className="px-8 py-4 bg-brand-500 hover:bg-brand-600 text-white rounded-2xl font-black shadow-xl shadow-brand-500/30 flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
        >
           <Plus className="w-5 h-5" /> Mark Presence
        </button>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-colors">
        <div className="bg-white dark:bg-slate-500 p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm flex flex-col justify-between transition-colors">
           <div className="flex justify-between items-start mb-4 transition-colors">
              <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 rounded-xl flex items-center justify-center transition-colors">
                 <Users className="w-5 h-5" />
              </div>
              <span className="flex items-center text-[10px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full transition-colors">
                 <ArrowUpRight className="w-3 h-3" /> 2.5%
              </span>
           </div>
           <div>
              <h4 className="text-2xl font-black text-slate-800 dark:text-white transition-colors">{overallAttendance}%</h4>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-200 uppercase tracking-widest mt-1 transition-colors">Avg Attendance</p>
           </div>
        </div>

        <div className="bg-white dark:bg-slate-500 p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm flex flex-col justify-between transition-colors">
           <div className="flex justify-between items-start mb-4 transition-colors">
              <div className="w-10 h-10 bg-violet-50 dark:bg-violet-500/10 text-violet-500 rounded-xl flex items-center justify-center transition-colors">
                 <BookOpen className="w-5 h-5" />
              </div>
           </div>
           <div>
              <h4 className="text-2xl font-black text-slate-800 dark:text-white transition-colors">{stats.length}</h4>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-200 uppercase tracking-widest mt-1 transition-colors">Subjects Enrolled</p>
           </div>
        </div>

        <div className="bg-white dark:bg-slate-500 p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm flex flex-col justify-between border-b-4 border-b-brand-500 transition-colors">
           <div className="flex justify-between items-start mb-4 transition-colors">
              <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center transition-colors">
                 <Plus className="w-5 h-5" />
              </div>
           </div>
           <div>
              <h4 className="text-2xl font-black text-slate-800 dark:text-white transition-colors">{user?.at_coins || 0}</h4>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-200 uppercase tracking-widest mt-1 transition-colors">Reward Coins</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 transition-colors">
         {/* Academic Status Card */}
         <div className="bg-slate-900 dark:bg-slate-800 rounded-[40px] p-8 text-white relative overflow-hidden shadow-2xl transition-colors min-h-[300px] flex flex-col justify-center text-center">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full blur-[100px] -mr-32 -mt-32 transition-colors"></div>
            
            <div className="relative z-10 transition-colors space-y-4">
                <div className="w-20 h-20 bg-brand-500/20 rounded-[32px] flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-10 h-10 text-brand-400" />
                </div>
                <h3 className="text-2xl font-black transition-colors uppercase tracking-tight">Academic Pulse</h3>
                <p className="text-slate-400 font-medium text-sm max-w-xs mx-auto">Your academic performance is being tracked. Stay consistent with your attendance to earn more rewards!</p>
            </div>
         </div>

         {/* Subject Summary Cards List */}
         <div className="space-y-6 transition-colors">
            <div className="flex justify-between items-center transition-colors">
               <h3 className="text-xl font-black text-slate-800 dark:text-white transition-colors">Attendance Focus</h3>
               <button onClick={() => setActiveTab('attendance')} className="text-[10px] font-bold uppercase tracking-widest text-brand-500 hover:text-brand-600 transition-colors">Analysis Details</button>
            </div>

            <div className="grid grid-cols-1 gap-4 transition-colors">
               {stats.slice(0, 3).map((sub, i) => {
                  const percentage = Math.round((sub.attended / (sub.total_classes || 1)) * 100);
                  return (
                     <div key={i} className="bg-white dark:bg-slate-500 p-5 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm flex items-center justify-between group hover:border-brand-500 transition-all cursor-pointer transition-colors">
                        <div className="flex items-center gap-4 transition-colors">
                           <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg transition-colors ${
                              percentage >= 75 ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400'
                           }`}>
                              {percentage}%
                           </div>
                           <div className="transition-colors">
                              <h4 className="font-bold text-slate-800 dark:text-white text-sm group-hover:text-brand-600 transition-colors">{sub.subject_name}</h4>
                              <p className="text-[10px] font-medium text-slate-400 dark:text-slate-200 uppercase tracking-widest transition-colors">{sub.subject_code}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-3 transition-colors">
                           {percentage >= 75 ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <AlertCircle className="w-5 h-5 text-red-500" />}
                           <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 transition-colors" />
                        </div>
                     </div>
                  );
               })}
            </div>

            {/* Notification Brief */}
            <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-6 rounded-[32px] text-white flex items-center gap-6 shadow-xl shadow-indigo-500/20 transition-colors">
               <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center shrink-0 transition-colors">
                  <span className="text-2xl">📢</span>
               </div>
                <div className="transition-colors">
                  <h4 className="font-bold text-sm transition-colors">Academic Broadcasts</h4>
                  <p className="text-xs text-white/70 mt-1 transition-colors">Check for recent announcements from your department faculty.</p>
                  <button onClick={() => setActiveTab('notifications')} className="mt-2 text-[10px] font-black uppercase tracking-widest hover:underline flex items-center gap-1 transition-colors">Open Hub <ChevronRight className="w-3 h-3" /></button>
                </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Overview;
