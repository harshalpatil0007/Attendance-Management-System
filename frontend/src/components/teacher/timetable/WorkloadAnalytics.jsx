import React from 'react';
import { BarChart2, PieChart, Users, TrendingDown, TrendingUp } from 'lucide-react';

const WorkloadAnalytics = ({ workload }) => {
  const { hours_distribution = [], subjects = [], total_hours = 0, dept_avg = 9 } = workload;

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayLabels = {
    'Monday': 'M', 'Tuesday': 'T', 'Wednesday': 'W', 
    'Thursday': 'T', 'Friday': 'F', 'Saturday': 'S'
  };

  const getHoursForDay = (day) => {
    const found = hours_distribution.find(h => h.day_of_week === day);
    return found ? parseFloat(found.hours) : 0;
  };

  const maxHours = Math.max(...hours_distribution.map(h => parseFloat(h.hours) || 0), 4);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
       <div className="px-8 py-6 bg-white rounded-[40px] border border-slate-100 shadow-sm flex justify-between items-center">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                <BarChart2 className="w-6 h-6" />
             </div>
             <div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase">Weekly Workload Analysis</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Academic Year 2025-26 • Term II</p>
             </div>
          </div>
          <div className="text-right">
             <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                total_hours < dept_avg ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
             }`}>
                Status: {total_hours < dept_avg ? 'Below Average Load' : 'At Average Load'}
             </span>
          </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Hours Distribution */}
          <div className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-sm relative overflow-hidden group">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-2 relative z-10">
               <TrendingUp className="w-3 h-3" /> Hours Distribution by Day
            </h4>
            
            <div className="flex items-end justify-between gap-2 h-48 mb-8 relative z-10">
               {days.map(day => {
                  const hours = getHoursForDay(day);
                  const height = (hours / maxHours) * 100;
                  return (
                    <div key={day} className="flex-1 flex flex-col items-center gap-4 group/bar">
                       <div className="w-full relative flex flex-col justify-end h-full">
                          <div 
                            style={{ height: `${height}%` }}
                            className={`w-full rounded-2xl transition-all duration-700 ${
                               hours > 0 ? 'bg-slate-900 group-hover/bar:bg-brand-500 shadow-lg' : 'bg-slate-50'
                            }`}
                          >
                             {hours > 0 && (
                               <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] font-black px-2 py-1 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity">
                                  {hours}h
                               </div>
                             )}
                          </div>
                       </div>
                       <span className="text-[10px] font-black text-slate-400 uppercase">{dayLabels[day]}</span>
                    </div>
                  );
               })}
            </div>

            <div className="pt-6 border-t border-slate-50 flex justify-between items-center relative z-10">
               <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Teaching Hours</p>
                  <p className="text-2xl font-black text-slate-800 tracking-tight">{total_hours} Hours/Week</p>
               </div>
               <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Dept Average</p>
                  <p className="text-lg font-black text-slate-500 tracking-tight">{dept_avg} Hours</p>
               </div>
            </div>
            
            <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-slate-50 rounded-full opacity-50 group-hover:scale-110 transition-transform duration-700"></div>
          </div>

          {/* Student Count distribution */}
          <div className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-sm overflow-hidden group">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-2">
               <Users className="w-3 h-3 text-brand-500" /> Student Reach by Class
            </h4>
            
            <div className="space-y-6">
               {subjects.map((sub, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                       <span className="text-slate-800">{sub.subject_name} ({sub.batch ? `Batch ${sub.batch}` : 'Theory'})</span>
                       <span className="text-slate-400">{sub.student_count || 0} Students</span>
                    </div>
                    <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
                       <div 
                         style={{ width: `${(sub.student_count / 81) * 100}%` }}
                         className={`h-full rounded-full transition-all duration-1000 ${
                            sub.type === 'Lab' ? 'bg-indigo-500' : 'bg-brand-500 shadow-lg shadow-brand-500/20'
                         }`}
                       ></div>
                    </div>
                  </div>
               ))}
            </div>

            <div className="mt-8 pt-8 border-t border-slate-50 flex items-center gap-4">
                <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center text-brand-600 shadow-sm">
                   <Users className="w-5 h-5" />
                </div>
                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Total Unique Students</p>
                   <p className="text-sm font-black text-slate-800 tracking-tight">81 Reach across all classes</p>
                </div>
            </div>
          </div>
       </div>
    </div>
  );
};

export default WorkloadAnalytics;
