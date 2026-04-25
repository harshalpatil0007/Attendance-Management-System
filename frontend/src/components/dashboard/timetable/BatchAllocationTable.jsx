import React from 'react';
import { Users, UserCheck } from 'lucide-react';

const BatchAllocationTable = ({ batchInfo }) => {
  const batches = [
    { name: 'A1', range: '1 to 27', count: 27 },
    { name: 'A2', range: '28 to 54', count: 27 },
    { name: 'A3', range: '55 to 81', count: 27 }
  ];

  return (
    <div className="bg-white dark:bg-slate-500 border border-slate-200 dark:border-white/10 rounded-[40px] shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 transition-colors">
      <div className="p-8 border-b border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-slate-600/50 flex items-center gap-3 transition-colors">
         <div className="w-10 h-10 bg-[#d4a017] rounded-2xl flex items-center justify-center">
            <Users className="w-5 h-5 text-[#1a3a5c]" />
         </div>
         <div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white transition-colors">Batch Allocation for Practicals</h3>
            <p className="text-slate-500 dark:text-slate-200 text-xs font-medium transition-colors">Division: TE-A | Total Students: 81</p>
         </div>
      </div>
      
      <div className="p-6 transition-colors">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           {batches.map(batch => (
             <div key={batch.name} className={`relative p-8 rounded-[32px] border-2 transition-all ${batchInfo?.name === batch.name ? 'border-[#d4a017] bg-[#d4a017]/5 shadow-lg shadow-[#d4a017]/10' : 'border-slate-100 dark:border-white/5 bg-slate-50/30 dark:bg-slate-600/30'}`}>
                {batchInfo?.name === batch.name && (
                   <div className="absolute top-4 right-4 bg-[#d4a017] text-[#1a3a5c] px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                      <UserCheck className="w-3 h-3" /> You are here
                   </div>
                )}
                <div className="mb-4">
                   <h4 className="text-3xl font-black text-slate-800 dark:text-white mb-1 transition-colors">{batch.name}</h4>
                   <p className="text-slate-500 dark:text-slate-200 text-xs font-bold uppercase tracking-widest transition-colors">Roll: {batch.range}</p>
                </div>
                <div className="flex items-center gap-2 transition-colors">
                   <div className="flex -space-x-2">
                      {[1,2,3].map(i => <div key={i} className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-500 border-2 border-white dark:border-slate-700 transition-all"></div>)}
                   </div>
                   <span className="text-[10px] font-bold text-slate-400 dark:text-slate-300 transition-colors">{batch.count} Students</span>
                </div>
             </div>
           ))}
        </div>
        <div className="mt-8 p-6 bg-[#1a3a5c] dark:bg-slate-700 rounded-[32px] border border-white/10 text-white flex flex-col md:flex-row justify-between items-center gap-4 transition-colors">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10 transition-colors">
                 <BadgeInfo className="w-6 h-6 text-[#d4a017]" />
              </div>
              <div>
                 <p className="text-white/60 text-[10px] font-black uppercase tracking-widest leading-none mb-1">Your Designation</p>
                 <h4 className="text-lg font-bold">Batch {batchInfo?.name || 'A'} | Roll No {batchInfo?.roll_number || 'N/A'}</h4>
              </div>
           </div>
           <p className="text-white/40 text-[10px] italic max-w-xs text-center md:text-right">
              Batch allocation is managed by the Department Coordinator. Contact HOD if your batch assignment is incorrect.
           </p>
        </div>
      </div>
    </div>
  );
};

// Internal Import for icons
const BadgeInfo = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
);

export default BatchAllocationTable;
