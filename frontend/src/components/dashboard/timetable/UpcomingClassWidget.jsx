import React from 'react';
import { Calendar, MapPin, User, ArrowRight, PlayCircle } from 'lucide-react';

const UpcomingClassWidget = ({ timetable }) => {
  const now = new Date();
  const currentDay = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][now.getDay()];
  const currentTime = now.toTimeString().split(' ')[0].substring(0, 5);

  // Find all classes today that haven't ended yet
  const todayClasses = timetable
    .filter(t => t.day_of_week === currentDay)
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  const upcomingClass = todayClasses.find(t => t.start_time.substring(0, 5) > currentTime);
  const ongoingClass = todayClasses.find(t => currentTime >= t.start_time.substring(0,5) && currentTime <= t.end_time.substring(0,5));

  const targetClass = ongoingClass || upcomingClass;

  if (!targetClass) return null;

  return (
    <div className={`relative overflow-hidden group transition-all duration-500 hover:scale-[1.02] ${ongoingClass ? 'bg-[#1a3a5c]' : 'bg-white dark:bg-slate-500 border border-slate-200 dark:border-white/10'} p-8 rounded-[40px] shadow-sm transition-colors`}>
      {/* Decorative Background Icon */}
      <div className="absolute -right-8 -bottom-8 opacity-[0.03] transform rotate-12 transition-transform group-hover:rotate-6">
         <Calendar className={`w-48 h-48 ${ongoingClass ? 'text-white' : 'text-[#1a3a5c]'}`} />
      </div>

      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-6">
           <div className={`w-20 h-20 rounded-[32px] flex items-center justify-center border-4 ${ongoingClass ? 'bg-white/10 border-white/10' : 'bg-[#1a3a5c]/5 border-[#1a3a5c]/5'}`}>
              {ongoingClass ? (
                <PlayCircle className="w-10 h-10 text-[#d4a017] animate-pulse" />
              ) : (
                <Calendar className="w-10 h-10 text-[#1a3a5c]" />
              )}
           </div>
           <div>
              <div className="flex items-center gap-2 mb-2">
                 <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${ongoingClass ? 'bg-[#d4a017] text-[#1a3a5c]' : 'bg-[#1a3a5c] text-white'}`}>
                    {ongoingClass ? 'Ongoing Now' : 'Upcoming Class'}
                 </span>
                  <span className={`text-[10px] font-bold transition-colors ${ongoingClass ? 'text-white/40' : 'text-slate-400 dark:text-slate-300'}`}>
                     {targetClass.start_time.substring(0,5)} - {targetClass.end_time.substring(0,5)}
                  </span>
              </div>
               <h3 className={`text-2xl font-black mb-2 transition-colors ${ongoingClass ? 'text-white' : 'text-slate-800 dark:text-white'}`}>
                  {targetClass.subject_name} ({targetClass.subject_code})
               </h3>
               <div className={`flex flex-wrap gap-4 text-[11px] font-bold transition-colors ${ongoingClass ? 'text-white/60' : 'text-slate-500 dark:text-slate-200'}`}>
                  <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {targetClass.room_number || 'Room 316'}</span>
                 <span className="text-white/20">|</span>
                 <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> {targetClass.teacher_name || 'Dr. S.A. Patil'}</span>
              </div>
           </div>
        </div>
        
        <div className="flex gap-4">
           {ongoingClass && (
             <button className="px-6 py-3 bg-[#d4a017] text-[#1a3a5c] rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white hover:text-[#1a3a5c] transition-all shadow-lg shadow-[#d4a017]/20">
                Mark Attendance
             </button>
           )}
            <button className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all ${
              ongoingClass ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-slate-100 dark:bg-slate-600 text-slate-600 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-500'
            }`}>
              View Map <ArrowRight className="w-4 h-4" />
           </button>
        </div>
      </div>
    </div>
  );
};

export default UpcomingClassWidget;
