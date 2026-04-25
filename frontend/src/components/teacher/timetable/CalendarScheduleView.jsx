import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

const CalendarScheduleView = ({ timetable }) => {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 3, 1)); // April 2026 as per mockup
  const daysOfWeek = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // Adjust for Monday start
  };

  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  
  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  const sessionsForDay = (dayName) => {
    return timetable.filter(t => t.day_of_week === dayName);
  };

  const dayCells = [];
  // Add empty cells for previous month
  for (let i = 0; i < firstDay; i++) {
    dayCells.push(<div key={`empty-${i}`} className="h-24 lg:h-32 bg-slate-50 border border-slate-100"></div>);
  }

  // Add actual day cells
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    const daySessions = sessionsForDay(dayName);
    
    dayCells.push(
      <div key={d} className="h-24 lg:h-32 bg-white border border-slate-100 p-2 overflow-y-auto custom-scrollbar group">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[10px] font-black text-slate-400 group-hover:text-brand-500 transition-colors">{d}</span>
        </div>
        <div className="space-y-1">
          {daySessions.map((s, i) => (
            <div key={i} className={`px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-tighter truncate ${
              s.type === 'Lab' ? 'bg-indigo-100 text-indigo-700' : 'bg-brand-100 text-brand-700'
            }`}>
              {s.subject_code}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl overflow-hidden p-8">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg">
              <CalendarIcon className="w-6 h-6" />
           </div>
           <div>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight uppercase">{monthName} {year}</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Teaching Calendar Overview</p>
           </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-100">
          <button className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 hover:bg-slate-50 transition-all">
            <ChevronLeft className="w-4 h-4 text-slate-600" />
          </button>
          <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest px-4">Today</span>
          <button className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 hover:bg-slate-50 transition-all">
            <ChevronRight className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-collapse">
        {daysOfWeek.map(day => (
          <div key={day} className="py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest border-b-2 border-slate-50">{day}</div>
        ))}
        {dayCells}
      </div>

      <div className="mt-8 flex flex-wrap gap-6 justify-center bg-slate-50 p-6 rounded-[32px] border border-slate-100">
         <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-500"></div>
            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Lab / Practical</span>
         </div>
         <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-brand-500"></div>
            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Theory Lecture</span>
         </div>
         <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 font-black"></div>
            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Substitution Needed</span>
         </div>
      </div>
    </div>
  );
};

export default CalendarScheduleView;
