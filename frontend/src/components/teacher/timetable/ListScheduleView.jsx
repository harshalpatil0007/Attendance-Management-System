import React from 'react';
import { Calendar, Clock, MapPin, Users, ChevronRight } from 'lucide-react';

const ListScheduleView = ({ timetable, onAction }) => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl overflow-hidden">
      <div className="px-8 py-6 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
        <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
          📋 MY TEACHING SCHEDULE - LIST VIEW
        </h3>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Classes: {timetable.length}</span>
      </div>

      <div className="divide-y divide-slate-100">
        {days.map(day => {
          const daySessions = timetable.filter(t => t.day_of_week === day);
          
          return (
            <div key={day} className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-800 shadow-sm border border-slate-100">
                  <Calendar className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">{day}</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pl-4 border-l-2 border-slate-50">
                {daySessions.length > 0 ? daySessions.map((session, i) => (
                  <div 
                    key={i}
                    onClick={() => onAction(session)}
                    className="p-5 rounded-3xl bg-slate-50 border border-slate-100 hover:bg-white hover:border-brand-200 hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="flex justify-between items-start mb-3">
                       <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {session.start_time.substring(0, 5)} - {session.end_time.substring(0, 5)}
                       </span>
                       <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-brand-500 transition-colors" />
                    </div>

                    <h5 className="text-[11px] font-black text-slate-800 uppercase leading-tight mb-2">{session.subject_name}</h5>
                    
                    <div className="space-y-1.5">
                       <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                          <Users className="w-3 h-3 text-slate-300" /> {session.department} • {session.year_level}-{session.division} {session.batch ? `(${session.batch})` : ''}
                       </div>
                       <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                          <MapPin className="w-3 h-3 text-slate-300" /> Room {session.room_number || 'TBD'}
                       </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center">
                       <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                          session.type === 'Lab' ? 'bg-indigo-100 text-indigo-600' : 'bg-brand-100 text-brand-600'
                       }`}>
                          {session.type}
                       </span>
                       <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                          {session.role || 'Primary'}
                       </span>
                    </div>
                  </div>
                )) : (
                  <p className="text-[10px] font-bold text-slate-300 italic py-2">No classes scheduled</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ListScheduleView;
