import React from 'react';
import { Clock, MapPin, Users, Play, List, CheckCircle, Info } from 'lucide-react';

const DailyScheduleView = ({ schedule, onAction }) => {
  const formatTime = (time) => {
    return time.substring(0, 5);
  };

  return (
    <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl overflow-hidden p-8 space-y-8">
      <div className="flex justify-between items-center">
         <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            📅 TODAY'S SCHEDULE - {new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
         </h3>
         <button className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-colors">
            <Info className="w-3 h-3" /> Schedule Notes
         </button>
      </div>

      <div className="space-y-4">
        {schedule.length > 0 ? schedule.map((item, index) => (
          <div key={index} className="flex gap-6 group">
            <div className="flex flex-col items-center w-24 flex-shrink-0">
               <span className="text-sm font-black text-slate-800">{formatTime(item.start_time)}</span>
               <div className="w-0.5 h-full bg-slate-100 my-2 relative">
                  {item.is_live && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-red-500 rounded-full animate-ping"></div>}
               </div>
               <span className="text-[10px] font-bold text-slate-400">{formatTime(item.end_time)}</span>
            </div>

            <div className={`flex-1 rounded-[32px] p-6 border transition-all ${
              item.is_live 
                ? 'bg-red-50/50 border-red-100 shadow-lg shadow-red-500/5' 
                : 'bg-white border-slate-100 shadow-sm hover:shadow-md'
            }`}>
              <div className="flex flex-col lg:flex-row justify-between gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                      item.type === 'Lab' ? 'bg-indigo-100 text-indigo-700' : 'bg-brand-100 text-brand-700'
                    }`}>
                      {item.type === 'Lab' ? '🔬 ' : '📚 '}{item.subject_code}
                    </span>
                    {item.is_live && (
                       <span className="px-2 py-1 bg-red-500 text-white rounded-lg text-[9px] font-black uppercase tracking-widest animate-pulse">
                          🔴 LIVE - SESSION ACTIVE
                       </span>
                    )}
                  </div>

                  <div>
                    <h4 className="text-lg font-black text-slate-800 leading-tight uppercase">{item.subject_name}</h4>
                    <div className="flex flex-wrap items-center gap-4 mt-2">
                      <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <Users className="w-3.5 h-3.5" /> {item.department} {item.year_level}-{item.division} {item.batch ? `(Batch ${item.batch})` : ''}
                      </span>
                      <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <MapPin className="w-3.5 h-3.5" /> Venue: {item.room_number || 'TBD'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap lg:flex-nowrap items-center gap-3 lg:self-center">
                  <button 
                    onClick={() => onAction('attendance', item)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      item.is_live 
                        ? 'bg-red-500 text-white shadow-xl shadow-red-500/20 hover:scale-105 active:scale-95' 
                        : 'bg-brand-500 text-white shadow-xl shadow-brand-500/20 hover:scale-105 active:scale-95'
                    }`}
                  >
                    <Play className="w-3.5 h-3.5 fill-current" /> {item.is_live ? 'Resume Hub' : 'Start Attendance'}
                  </button>
                  <button 
                    onClick={() => onAction('roster', item)}
                    className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                  >
                    <List className="w-3.5 h-3.5" /> Student List
                  </button>
                </div>
              </div>
            </div>
          </div>
        )) : (
          <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200">
             <Clock className="w-12 h-12 text-slate-300 mb-4" />
             <p className="text-slate-400 font-black uppercase tracking-widest text-sm">No classes scheduled for today</p>
             <button className="mt-4 text-brand-500 font-bold text-[10px] uppercase tracking-widest border-b-2 border-brand-200 hover:border-brand-500">View Weekly Grid</button>
          </div>
        )}
      </div>

      {/* Free Period Manager for Today */}
      <div className="bg-slate-900 rounded-[32px] p-8 flex flex-col md:flex-row justify-between items-center gap-6">
         <div className="space-y-1 text-center md:text-left">
            <h4 className="text-white font-black text-sm uppercase tracking-widest">Free for Substitution?</h4>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Mark your free slots available for other faculty</p>
         </div>
         <div className="flex gap-3">
            <button className="px-6 py-3 bg-brand-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-brand-500/20 hover:scale-105 transition-all">
               Mark Available Now
            </button>
            <button className="px-6 py-3 bg-slate-800 text-slate-300 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 transition-all">
               Manage Settings
            </button>
         </div>
      </div>
    </div>
  );
};

export default DailyScheduleView;
