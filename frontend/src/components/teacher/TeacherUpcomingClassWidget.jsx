import React from 'react';
import { Calendar, MapPin, Users, ArrowRight, PlayCircle, Clock } from 'lucide-react';

const TeacherUpcomingClassWidget = ({ schedule, onAction }) => {
  const now = new Date();
  const currentTime = now.toTimeString().split(' ')[0].substring(0, 5);

  // Find ongoing or next class
  const ongoingClass = schedule.find(t => currentTime >= t.start_time.substring(0,5) && currentTime <= t.end_time.substring(0,5));
  const upcomingClass = schedule
    .filter(t => t.start_time.substring(0, 5) > currentTime)
    .sort((a, b) => a.start_time.localeCompare(b.start_time))[0];

  const targetClass = ongoingClass || upcomingClass;

  if (!targetClass) return (
    <div className="bg-[#1a3a5c] p-8 rounded-[40px] shadow-xl text-white flex items-center justify-between">
       <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
             <Clock className="w-6 h-6 text-[#d4a017]" />
          </div>
          <div>
             <h3 className="text-xl font-black uppercase tracking-tight">No more classes today</h3>
             <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Enjoy your free time!</p>
          </div>
       </div>
       <button 
         onClick={() => onAction('timetable')}
         className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
       >
         View Weekly Grid
       </button>
    </div>
  );

  return (
    <div className={`relative overflow-hidden group transition-all duration-500 hover:scale-[1.01] ${ongoingClass ? 'bg-[#1a3a5c] dark:bg-slate-900' : 'bg-white dark:bg-slate-500 border border-slate-200 dark:border-white/10'} p-8 rounded-[40px] shadow-xl transition-colors`}>
      {/* Decorative Background Icon */}
      <div className="absolute -right-8 -bottom-8 opacity-[0.05] transform rotate-12 transition-transform group-hover:rotate-6">
         <Calendar className={`w-48 h-48 ${ongoingClass ? 'text-white' : 'text-[#1a3a5c]'}`} />
      </div>

      <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
        <div className="flex items-center gap-6">
           <div className={`w-20 h-20 rounded-[32px] flex items-center justify-center border-4 ${ongoingClass ? 'bg-white/10 border-white/10' : 'bg-[#1a3a5c]/5 border-[#1a3a5c]/10'}`}>
              {ongoingClass ? (
                <PlayCircle className="w-10 h-10 text-[#d4a017] animate-pulse" />
              ) : (
                <Clock className={`w-10 h-10 ${ongoingClass ? 'text-white' : 'text-[#1a3a5c]'}`} />
              )}
           </div>
           <div>
              <div className="flex items-center gap-3 mb-2">
                 <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 ${ongoingClass ? 'bg-[#d4a017] text-[#1a3a5c]' : 'bg-[#1a3a5c] text-white'}`}>
                    {ongoingClass ? <span className="w-1.5 h-1.5 bg-[#1a3a5c] rounded-full animate-ping"></span> : null}
                    {ongoingClass ? 'Session Ongoing' : 'Upcoming Lecture'}
                 </span>
                 <span className={`text-[10px] font-black uppercase tracking-widest ${ongoingClass ? 'text-white/40' : 'text-slate-400'}`}>
                    {targetClass.start_time.substring(0,5)} - {targetClass.end_time.substring(0,5)}
                 </span>
              </div>
              <h3 className={`text-2xl font-black mb-2 uppercase tracking-tight ${ongoingClass ? 'text-white' : 'text-slate-800 dark:text-white'}`}>
                 {targetClass.subject_name}
              </h3>
              <div className={`flex flex-wrap gap-4 text-[10px] font-black uppercase tracking-widest ${ongoingClass ? 'text-white/60' : 'text-slate-500'}`}>
                 <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> {targetClass.department} {targetClass.year_level}-{targetClass.division} {targetClass.batch ? `(${targetClass.batch})` : ''}</span>
                 <span className="opacity-20 hidden md:block">|</span>
                 <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Venue: {targetClass.room_number || 'Room 316'}</span>
              </div>
           </div>
        </div>
        
        <div className="flex flex-wrap gap-3">
           <button 
             onClick={() => onAction('attendance', targetClass)}
             className={`px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl ${
               ongoingClass 
                 ? 'bg-[#d4a017] text-[#1a3a5c] shadow-[#d4a017]/20 hover:scale-105 active:scale-95' 
                 : 'bg-[#1a3a5c] text-white shadow-[#1a3a5c]/20 hover:bg-[#d4a017] hover:text-[#1a3a5c]'
             }`}
           >
              {ongoingClass ? 'Resume Hub' : 'Start Session'}
           </button>
           <button 
             onClick={() => onAction('roster', targetClass)}
             className={`px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all border ${
               ongoingClass 
                 ? 'bg-white/10 text-white border-white/20 hover:bg-white/20' 
                 : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
             }`}
           >
              Student List <ArrowRight className="w-4 h-4" />
           </button>
        </div>
      </div>
    </div>
  );
};

export default TeacherUpcomingClassWidget;
