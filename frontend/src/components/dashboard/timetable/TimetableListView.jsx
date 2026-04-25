import React from 'react';
import { Clock, MapPin, User, ArrowRight } from 'lucide-react';

const TimetableListView = ({ timetable }) => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500 transition-colors">
      {days.map(day => {
        const dayEntries = timetable.filter(t => t.day_of_week === day);
        return (
          <div key={day} className="bg-white dark:bg-slate-500 rounded-[40px] border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden transition-colors">
            <div className="px-8 py-4 bg-slate-50/50 dark:bg-slate-600/50 border-b border-slate-100 dark:border-white/10 flex justify-between items-center transition-colors">
               <h3 className="text-lg font-black text-[#1a3a5c] dark:text-white uppercase tracking-widest transition-colors">{day}</h3>
               <span className="text-[10px] font-bold text-slate-400 dark:text-slate-200 bg-white dark:bg-slate-600 px-3 py-1 rounded-full border border-slate-100 dark:border-white/10 transition-colors">
                  {dayEntries.length} Sessions
               </span>
            </div>
            <div className="p-4 space-y-4 transition-colors">
              {dayEntries.length > 0 ? dayEntries.map(entry => (
                <div key={entry.id} className="flex gap-4 group">
                   <div className="flex flex-col items-center gap-1 w-12 pt-1 transition-colors">
                      <span className="text-[10px] font-black text-[#1a3a5c] dark:text-white transition-colors">{entry.start_time.substring(0,5)}</span>
                      <div className="w-px flex-1 bg-slate-100 dark:bg-white/10 group-hover:bg-[#d4a017] transition-colors"></div>
                      <span className="text-[10px] font-bold text-slate-300 dark:text-slate-400 transition-colors">{entry.end_time.substring(0,5)}</span>
                   </div>
                   <div className={`flex-1 p-5 rounded-[32px] border transition-all hover:scale-[1.01] ${
                      entry.type === 'Lab' ? 'bg-emerald-50/50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20' : 
                      entry.type === 'Theory' ? 'bg-blue-50/50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20' : 'bg-amber-50/50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20'
                   }`}>
                      <div className="flex justify-between items-start mb-2">
                         <div>
                            <span className={`text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full mb-1 inline-block transition-colors ${
                               entry.type === 'Lab' ? 'bg-emerald-500 text-white' : 
                               entry.type === 'Theory' ? 'bg-blue-500 text-white' : 'bg-[#d4a017] text-[#1a3a5c]'
                            }`}>
                               {entry.type} {entry.batch ? `(${entry.batch})` : ''}
                            </span>
                            <h4 className="font-bold text-slate-800 dark:text-white leading-tight transition-colors">{entry.subject_name}</h4>
                         </div>
                         <ArrowRight className="w-5 h-5 text-slate-300 dark:text-slate-400 group-hover:text-slate-400 dark:group-hover:text-white transform group-hover:translate-x-1 transition-all" />
                      </div>
                      <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 transition-colors">
                         <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-200 transition-colors">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-300 transition-colors" />
                            {entry.room_number || 'Room 316'}
                         </div>
                         <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-200 transition-colors">
                            <User className="w-3.5 h-3.5 text-slate-400 dark:text-slate-300 transition-colors" />
                            {entry.teacher_name || 'Dr. S.A. Patil'}
                         </div>
                         <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-200 ml-auto mr-0 transition-colors">
                            <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-300 transition-colors" />
                            {entry.start_time.substring(0,5)}
                         </div>
                      </div>
                   </div>
                </div>
              )) : (
                <div className="p-8 text-center bg-slate-50/50 dark:bg-slate-600/50 rounded-[32px] border border-dashed border-slate-200 dark:border-white/10 transition-colors">
                   <p className="text-slate-400 dark:text-slate-300 text-sm font-medium italic transition-colors">No classes scheduled for this day.</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TimetableListView;
