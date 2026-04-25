import React from 'react';
import { BadgeCheck, Beaker, BookOpen, Layers } from 'lucide-react';

const PersonalizedSchedule = ({ timetable, batchInfo }) => {
  const ongoing = timetable.find(t => {
    const now = new Date();
    const currentDay = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][now.getDay()];
    const currentTime = now.toTimeString().split(' ')[0].substring(0, 5);
    return t.day_of_week === currentDay && currentTime >= t.start_time.substring(0,5) && currentTime <= t.end_time.substring(0,5);
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-right-4 duration-500 transition-colors">
      {/* Batch Identity Card */}
      <div className="lg:col-span-1 bg-gradient-to-br from-[#1a3a5c] to-[#2a4a6c] dark:from-slate-700 dark:to-slate-800 p-8 rounded-[40px] text-white shadow-xl shadow-slate-200 dark:shadow-none transition-all">
        <div className="flex justify-between items-start mb-6">
          <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center backdrop-blur-md">
            <BadgeCheck className="w-8 h-8 text-[#d4a017]" />
          </div>
          <div className="text-right">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Your Batch</span>
            <h3 className="text-3xl font-black text-[#d4a017]">{batchInfo?.name || 'GEN'}</h3>
          </div>
        </div>
        <div>
          <p className="text-white/60 text-sm font-medium mb-1">Roll Number</p>
          <h4 className="text-xl font-bold mb-4">{batchInfo?.roll_number || 'N/A'}</h4>
          <p className="text-white/40 text-xs leading-relaxed">
            Your lab sessions are filtered specifically for Batch {batchInfo?.name}. 
            Theory classes are common for all students.
          </p>
        </div>
      </div>

      {/* Lab Schedule Summary */}
      <div className="lg:col-span-2 bg-white dark:bg-slate-500 border border-slate-200 dark:border-white/10 p-8 rounded-[40px] shadow-sm transition-colors">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl flex items-center justify-center transition-colors">
            <Beaker className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white transition-colors">Your Lab Sessions</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {timetable.filter(t => t.type === 'Lab').map(lab => (
            <div key={lab.id} className="p-4 rounded-3xl border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-600/30 flex gap-4 items-center transition-all hover:border-emerald-200 dark:hover:border-emerald-500/50 group">
              <div className="w-12 h-12 bg-white dark:bg-slate-600 rounded-2xl flex flex-col items-center justify-center border border-slate-100 dark:border-white/10 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                 <span className="text-[9px] font-bold uppercase transition-colors">{lab.day_of_week.substring(0,3)}</span>
                 <span className="text-[10px] font-bold transition-colors">{lab.start_time.substring(0,5)}</span>
              </div>
              <div className="flex-1">
                 <h4 className="font-bold text-sm text-slate-800 dark:text-white transition-colors">{lab.subject_name}</h4>
                 <div className="flex gap-3 text-[10px] font-bold text-slate-400 dark:text-slate-300 uppercase transition-colors">
                    <span>{lab.room_number}</span>
                    <span className="text-slate-200 dark:text-slate-500">|</span>
                    <span>{lab.teacher_name}</span>
                 </div>
              </div>
            </div>
          ))}
          {timetable.filter(t => t.type === 'Lab').length === 0 && (
            <p className="text-slate-400 dark:text-slate-300 text-sm italic col-span-2 py-4 transition-colors">No lab sessions assigned to your batch yet.</p>
          )}
        </div>
      </div>
      
      {/* Theory Summary */}
      <div className="lg:col-span-3 bg-white dark:bg-slate-500 border border-slate-200 dark:border-white/10 p-8 rounded-[40px] shadow-sm transition-colors">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-50 dark:bg-blue-500/10 rounded-2xl flex items-center justify-center transition-colors">
            <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white transition-colors">Common Theory Lectures</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
           {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => {
             const lectures = timetable.filter(t => t.day_of_week === day && t.type === 'Theory');
             return (
               <div key={day} className="space-y-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-300 border-b border-slate-100 dark:border-white/10 block pb-1 transition-colors">{day}</span>
                  {lectures.length > 0 ? lectures.map(l => (
                    <div key={l.id} className="p-3 rounded-2xl bg-blue-50/30 dark:bg-blue-500/10 border border-blue-50 dark:border-blue-500/20 text-blue-800 dark:text-blue-300 transition-colors">
                       <div className="font-bold text-[11px] uppercase truncate">{l.subject_name}</div>
                       <div className="text-[9px] font-bold opacity-60 flex justify-between">
                          <span>{l.start_time.substring(0,5)}</span>
                          <span>{l.room_number}</span>
                       </div>
                    </div>
                  )) : (
                    <div className="text-[9px] font-medium text-slate-300 dark:text-slate-400 italic transition-colors">No Theory</div>
                  )}
               </div>
             );
           })}
        </div>
      </div>
    </div>
  );
};

export default PersonalizedSchedule;
