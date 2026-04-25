import React from 'react';
import { MapPin, User, Clock } from 'lucide-react';

const TimetableGridView = ({ timetable, batchInfo }) => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const timeSlots = [
    '11:00:00', '12:00:00', '13:00:00', '13:45:00', '14:45:00', '15:45:00', '16:45:00'
  ];

  const getEntry = (day, slot) => {
    return timetable.find(entry => 
      entry.day_of_week === day && 
      String(entry.start_time).startsWith(slot.substring(0, 5))
    );
  };

  const getSlotColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'theory': return 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20 text-blue-700 dark:text-blue-300';
      case 'lab': return 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-300';
      case 'project': return 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-300';
      default: return 'bg-slate-50 dark:bg-slate-600/10 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-200';
    }
  };

  return (
    <div className="bg-white dark:bg-slate-500 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 transition-colors">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[#1a3a5c] dark:bg-slate-700 text-white transition-colors">
              <th className="p-4 border-r border-[#2a4a6c] dark:border-white/10 text-xs font-bold uppercase w-24">Time</th>
              {days.map(day => (
                <th key={day} className="p-4 border-r border-[#2a4a6c] dark:border-white/10 text-xs font-bold uppercase text-center min-w-[150px]">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeSlots.map((slot, idx) => (
              <tr key={slot} className={`transition-colors ${idx % 2 === 0 ? 'bg-white dark:bg-slate-500' : 'bg-slate-50/30 dark:bg-slate-600/30'}`}>
                <td className="p-4 border-r border-slate-100 dark:border-white/10 text-[11px] font-bold text-slate-400 dark:text-slate-300 text-center transition-colors">
                  {slot.substring(0, 5)}
                </td>
                {days.map(day => {
                  const entry = getEntry(day, slot);
                  const isLunch = slot === '13:00:00';
                  
                  if (isLunch) {
                    return (
                      <td key={`${day}-${slot}`} className="p-2 border-r border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-slate-600/50 transition-colors">
                        <div className="text-[10px] font-bold text-slate-300 dark:text-slate-200 text-center uppercase tracking-widest italic transition-colors">Lunch</div>
                      </td>
                    );
                  }

                  return (
                    <td key={`${day}-${slot}`} className="p-2 border-r border-slate-100 dark:border-white/10 h-28 align-top transition-colors">
                      {entry ? (
                        <div className={`h-full p-3 rounded-2xl border transition-all hover:scale-[1.02] hover:shadow-md cursor-default ${getSlotColor(entry.type)}`}>
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-[9px] font-black uppercase tracking-tighter opacity-60">
                              {entry.type} {entry.batch ? `(${entry.batch})` : ''}
                            </span>
                            <span className="text-[9px] font-bold opacity-60">
                              {entry.subject_code}
                            </span>
                          </div>
                          <div className="font-bold text-xs leading-tight mb-2 uppercase truncate transition-colors" title={entry.subject_name}>
                            {entry.subject_name}
                          </div>
                          <div className="space-y-1">
                            <div className="text-[10px] flex items-center gap-1 opacity-80">
                               <MapPin className="w-3 h-3" /> {entry.room_number || 'TBD'}
                            </div>
                            <div className="text-[10px] flex items-center gap-1 opacity-80 truncate">
                               <User className="w-3 h-3" /> {entry.teacher_name || 'All Faculty'}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="h-full flex items-center justify-center opacity-[0.03] dark:opacity-10 transition-opacity">
                           <Clock className="w-8 h-8 dark:text-white" />
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-4 bg-slate-50 dark:bg-slate-600 border-t border-slate-100 dark:border-white/10 flex gap-6 justify-center transition-colors">
         <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-200 uppercase transition-colors">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div> Theory
         </div>
         <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-200 uppercase transition-colors">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div> Practical
         </div>
         <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-200 uppercase transition-colors">
            <div className="w-3 h-3 rounded-full bg-amber-500"></div> Project
         </div>
      </div>
    </div>
  );
};

export default TimetableGridView;
