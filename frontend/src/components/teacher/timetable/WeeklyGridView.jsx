import React from 'react';
import { Clock, MapPin, Users } from 'lucide-react';

const WeeklyGridView = ({ timetable, onAction }) => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const timeSlots = [
    { start: '11:00', end: '12:00' },
    { start: '12:00', end: '13:00' },
    { start: '13:00', end: '13:45', isBreak: true, label: 'LUNCH BREAK' },
    { start: '13:45', end: '14:45' },
    { start: '14:45', end: '15:45' },
    { start: '15:45', end: '16:45' },
    { start: '16:45', end: '17:45' }
  ];

  const getSessionsForSlot = (day, slot) => {
    return timetable.filter(t => 
      t.day_of_week === day && 
      t.start_time.startsWith(slot.start)
    );
  };

  return (
    <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl overflow-hidden relative">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full border-collapse min-w-[1000px]">
          <thead>
            <tr className="bg-slate-900">
              <th className="px-6 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-800">Time / Day</th>
              {days.map(day => (
                <th key={day} className="px-6 py-6 text-center text-[10px] font-black text-white uppercase tracking-widest border-r border-slate-800">{day}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {timeSlots.map((slot, idx) => (
              <tr key={idx} className={`group ${slot.isBreak ? 'bg-slate-50' : 'hover:bg-slate-50/50 transition-colors'}`}>
                <td className="px-6 py-8 border-r border-slate-50">
                  <div className="flex flex-col gap-1">
                    <span className="text-slate-800 font-black text-xs flex items-center gap-2">
                       <Clock className="w-3 h-3 text-brand-500" /> {slot.start} - {slot.end}
                    </span>
                    {slot.isBreak && <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{slot.label}</span>}
                  </div>
                </td>
                {days.map(day => {
                  const sessions = getSessionsForSlot(day, slot);
                  if (slot.isBreak) return <td key={`${day}-${idx}`} className="px-3 py-3 border-r border-slate-50 opacity-20"></td>;

                  return (
                    <td key={`${day}-${slot.start}`} className="px-3 py-3 border-r border-slate-50 relative min-w-[170px]">
                      {sessions.length > 0 ? (
                        <div className="flex flex-col gap-2">
                          {sessions.map((session, i) => (
                            <div 
                              key={i} 
                              onClick={() => onAction(session)}
                              className={`cursor-pointer border-l-4 rounded-2xl p-3 shadow-sm transition-all hover:shadow-md hover:scale-[1.02] active:scale-95 ${
                                session.type === 'Lab' 
                                  ? 'bg-indigo-50 border-indigo-500' 
                                  : 'bg-brand-50 border-brand-500'
                              }`}
                            >
                              <div className="flex flex-col gap-0.5">
                                <div className="flex justify-between items-start">
                                  <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-lg ${
                                    session.type === 'Lab' ? 'bg-indigo-100 text-indigo-700' : 'bg-brand-100 text-brand-700'
                                  }`}>
                                    {session.subject_code}
                                  </span>
                                  <span className="text-[8px] font-black text-slate-400 uppercase">{session.type}</span>
                                </div>
                                <span className="text-[11px] font-black text-slate-800 leading-tight mt-1 line-clamp-2">{session.subject_name}</span>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                                  <span className="flex items-center gap-1 text-[7px] font-black text-slate-500 uppercase tracking-widest">
                                    <MapPin className="w-2 h-2" /> {session.room_number}
                                  </span>
                                  <span className="flex items-center gap-1 text-[7px] font-black text-slate-500 uppercase tracking-widest">
                                    <Users className="w-2 h-2" /> {session.department} {session.year_level}-{session.division} {session.batch ? `(${session.batch})` : ''}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="h-full w-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity min-h-[60px]">
                           <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Free</span>
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
      
      {/* Legend */}
      <div className="bg-slate-50 p-6 border-t border-slate-100 flex flex-wrap gap-6 justify-center">
         <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Lab / Practical</span>
         </div>
         <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-brand-500"></div>
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Theory Lecture</span>
         </div>
         <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-slate-200"></div>
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Free Period</span>
         </div>
         <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Availability for Substitution</span>
         </div>
      </div>
    </div>
  );
};

export default WeeklyGridView;
