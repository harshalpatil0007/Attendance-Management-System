import React from 'react';
import { BookOpen, Users, Clock, MapPin, GraduationCap } from 'lucide-react';

const TeachingSummary = ({ profile, subjects, workload }) => {
  return (
    <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl overflow-hidden p-8 space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-8 border-b border-slate-100">
        <div className="flex items-center gap-4">
           <div className="w-16 h-16 bg-brand-500 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-brand-500/20">
              <GraduationCap className="w-8 h-8" />
           </div>
           <div>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Teaching Summary</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{profile.name} | Dept of Computer Engineering</p>
           </div>
        </div>
        <div className="flex gap-4">
           <div className="text-right">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Academic Year</p>
              <p className="text-xs font-black text-slate-800 uppercase tracking-tight">2025-26 (Term II)</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Subjects Assigned */}
        <div className="space-y-6">
           <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-brand-500" /> Subjects Currently Assigned
           </h4>
           
           <div className="space-y-4">
              {subjects.length > 0 ? Array.from(new Set(subjects.map(s => s.subject_name))).map((subjectName, i) => {
                 const firstSub = subjects.find(s => s.subject_name === subjectName);
                 const instances = subjects.filter(s => s.subject_name === subjectName);
                 const theory = instances.find(s => s.type === 'Theory');
                 const labs = instances.filter(s => s.type === 'Lab');

                 return (
                    <div key={i} className="p-6 rounded-[32px] bg-slate-50 border border-slate-100 space-y-4">
                       <div className="flex justify-between items-start">
                          <h5 className="text-[11px] font-black text-slate-800 uppercase tracking-wide leading-tight">{subjectName}</h5>
                          <span className="px-2 py-0.5 bg-white border border-slate-200 rounded-lg text-[8px] font-black text-slate-400 uppercase tracking-widest">{firstSub.subject_code}</span>
                       </div>

                       <div className="space-y-3">
                          {theory && (
                             <div className="flex items-start gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-1.5 flex-shrink-0"></div>
                                <div className="text-[10px] font-bold text-slate-600 leading-relaxed uppercase">
                                   Theory: {theory.department} {theory.year_level}-{theory.division} • {theory.start_time.substring(0, 5)} - {theory.room_number || 'Room 316'}
                                </div>
                             </div>
                          )}
                          {labs.map((lab, j) => (
                             <div key={j} className="flex items-start gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0"></div>
                                <div className="text-[10px] font-bold text-slate-600 leading-relaxed uppercase">
                                   Lab: Batch {lab.batch} • {lab.day_of_week} {lab.start_time.substring(0, 5)} • {lab.room_number || 'Lab 4'}
                                </div>
                             </div>
                          ))}
                       </div>

                       <div className="pt-3 border-t border-slate-200 flex items-center gap-2">
                          <Users className="w-3 h-3 text-slate-400" />
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                             Total Students: {theory ? 81 : labs.length * 27}
                          </span>
                       </div>
                    </div>
                 );
              }) : (
                 <p className="text-slate-400 italic text-[10px] font-bold">No subjects assigned.</p>
              )}
           </div>
        </div>

        {/* Weekly Statistics */}
        <div className="space-y-6">
           <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-500" /> Weekly Statistics
           </h4>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-1">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Teaching Hours</p>
                 <p className="text-2xl font-black text-slate-800 tracking-tight">{workload.total_hours || 0} Hrs/Week</p>
                 <div className="flex items-center gap-1 mt-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Active Schedule</span>
                 </div>
              </div>
              <div className="p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-1">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Free Periods</p>
                 <p className="text-2xl font-black text-slate-800 tracking-tight">{22 - (workload.total_hours || 0)} Hrs/Week</p>
                 <div className="flex items-center gap-1 mt-2">
                    <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                    <span className="text-[8px] font-black text-indigo-600 uppercase tracking-widest">Available for Subs</span>
                 </div>
              </div>
           </div>

           <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 space-y-4">
              <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hour Composition</h5>
              <div className="space-y-3">
                 <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                    <span className="text-slate-700">Theory Lectures</span>
                    <span className="text-slate-500">1 Hour</span>
                 </div>
                 <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                    <span className="text-slate-700">Lab Sessions</span>
                    <span className="text-slate-500">6 Hours</span>
                 </div>
                 <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                    <span className="text-slate-700">Project Supervision</span>
                    <span className="text-slate-500">1 Hour</span>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default TeachingSummary;
