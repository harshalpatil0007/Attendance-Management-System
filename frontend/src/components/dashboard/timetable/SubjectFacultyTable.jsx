import React from 'react';
import { Book, User, Award, Hash } from 'lucide-react';

const SubjectFacultyTable = ({ subjects }) => {
  return (
    <div className="bg-white dark:bg-slate-500 border border-slate-200 dark:border-white/10 rounded-[40px] shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 transition-colors">
      <div className="p-8 border-b border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-slate-600/50 flex items-center gap-3 transition-colors">
         <div className="w-10 h-10 bg-[#1a3a5c] rounded-2xl flex items-center justify-center">
            <Book className="w-5 h-5 text-[#d4a017]" />
         </div>
         <div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white transition-colors">Subject & Faculty Details</h3>
            <p className="text-slate-500 dark:text-slate-200 text-xs font-medium transition-colors">Academic Year 2025-26 | Semester VI</p>
         </div>
      </div>
      
      <div className="overflow-x-auto transition-colors">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50/50 dark:bg-slate-600/50 border-b border-slate-100 dark:border-white/10 transition-colors">
              <th className="p-5 text-left text-[11px] font-black uppercase tracking-widest text-[#1a3a5c] dark:text-white/60 opacity-60 transition-colors">Sr. No.</th>
              <th className="p-5 text-left text-[11px] font-black uppercase tracking-widest text-[#1a3a5c] dark:text-white/60 opacity-60 transition-colors">Course Name</th>
              <th className="p-5 text-left text-[11px] font-black uppercase tracking-widest text-[#1a3a5c] dark:text-white/60 opacity-60 transition-colors">Abbreviation</th>
              <th className="p-5 text-left text-[11px] font-black uppercase tracking-widest text-[#1a3a5c] dark:text-white/60 opacity-60 transition-colors">Type</th>
              <th className="p-5 text-left text-[11px] font-black uppercase tracking-widest text-[#1a3a5c] dark:text-white/60 opacity-60 transition-colors">Faculty Name</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/10 transition-colors">
            {subjects.length > 0 ? subjects.map((sub, idx) => (
              <tr key={sub.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-600/50 transition-colors group">
                <td className="p-5 text-sm font-bold text-slate-400 dark:text-slate-200 transition-colors">
                   {String(idx + 1).padStart(2, '0')}
                </td>
                <td className="p-5">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-600 flex items-center justify-center group-hover:bg-[#1a3a5c]/5 transition-colors">
                         <Hash className="w-4 h-4 text-slate-400 dark:text-slate-300 group-hover:text-[#1a3a5c] transition-colors" />
                      </div>
                      <span className="font-bold text-slate-700 dark:text-white transition-colors">{sub.name}</span>
                   </div>
                </td>
                <td className="p-5">
                   <span className="px-3 py-1 bg-slate-100 dark:bg-slate-600 text-slate-600 dark:text-slate-200 rounded-lg text-[10px] font-black uppercase tracking-tight transition-colors">
                      {sub.code || sub.name.substring(0,3).toUpperCase()}
                   </span>
                </td>
                <td className="p-5">
                   <div className="flex items-center gap-2 transition-colors">
                      <div className={`w-2 h-2 rounded-full ${sub.type === 'PR' ? 'bg-emerald-500' : 'bg-blue-500'}`}></div>
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-200 transition-colors">{sub.type === 'PR' ? 'Practical' : 'Theory'}</span>
                   </div>
                </td>
                <td className="p-5">
                   <div className="flex items-center gap-2 transition-colors">
                      <div className="w-8 h-8 rounded-full bg-[#d4a017]/10 flex items-center justify-center transition-colors">
                         <User className="w-4 h-4 text-[#d4a017]" />
                      </div>
                      <span className="text-sm font-bold text-slate-600 dark:text-slate-200 transition-colors">{sub.faculty || 'Unassigned'}</span>
                   </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="5" className="p-12 text-center text-slate-400 dark:text-slate-300 italic transition-colors">No subject data available.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SubjectFacultyTable;
