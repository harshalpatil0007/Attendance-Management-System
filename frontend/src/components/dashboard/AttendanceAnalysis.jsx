import React from 'react';
import { CheckCircle2, AlertCircle, XCircle, TrendingUp, Calendar, Filter, Download } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AttendanceAnalysis = ({ stats, history }) => {
  const overallPercentage = Math.round(stats.reduce((acc, curr) => acc + (curr.attended / (curr.total_classes || 1) * 100), 0) / (stats.length || 1));

  // Mock trend data for the graph
  const trendData = [
    { name: 'Week 1', percentage: 80 },
    { name: 'Week 2', percentage: 75 },
    { name: 'Week 3', percentage: 85 },
    { name: 'Week 4', percentage: 70 },
    { name: 'Week 5', percentage: 78 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 transition-colors">
      {/* Top Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 transition-colors">
        <div className="md:col-span-2 bg-white dark:bg-slate-500 p-8 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm flex flex-col items-center justify-center gap-6 relative overflow-hidden transition-all">
           <div className="absolute top-0 left-0 w-24 h-24 bg-brand-50 dark:bg-brand-500/10 rounded-full -ml-12 -mt-12 transition-colors"></div>
           <div className="relative w-40 h-40 transition-colors">
              <svg className="w-full h-full transform -rotate-90">
                 <circle cx="80" cy="80" r="70" fill="transparent" stroke="#f1f5f9" className="dark:stroke-slate-600 transition-colors" strokeWidth="12" />
                 <circle 
                   cx="80" cy="80" r="70" fill="transparent" stroke="#0ea5e9" strokeWidth="12" 
                   strokeDasharray={440}
                   strokeDashoffset={440 - (440 * overallPercentage) / 100}
                   strokeLinecap="round"
                   className="transition-all duration-1000 ease-out"
                 />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center transition-colors">
                  <span className="text-4xl font-black text-slate-800 dark:text-white transition-colors">{overallPercentage}%</span>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-200 uppercase tracking-widest transition-colors">Attendance</span>
              </div>
           </div>
           <div className="text-center transition-colors">
               <h3 className="text-lg font-bold text-slate-800 dark:text-white transition-colors">Overall Status</h3>
               <p className="text-slate-500 dark:text-slate-200 text-sm max-w-[250px] transition-colors">
                {overallPercentage >= 75 ? 'Excellent! You are maintaining an ideal attendance score for your ISE exams.' : 'Warning: Your attendance is below the mandatory 75% requirement.'}
              </p>
           </div>
        </div>

        <div className="grid grid-rows-2 gap-6 h-full md:col-span-2 transition-colors">
           <div className="bg-emerald-500 p-8 rounded-3xl text-white shadow-xl shadow-emerald-500/20 flex flex-col justify-center transition-all">
              <span className="text-white/70 text-xs font-bold uppercase tracking-widest mb-1">Eligible Subjects</span>
              <div className="flex items-end justify-between transition-colors">
                 <h4 className="text-4xl font-black">{stats.filter(s => (s.attended / (s.total_classes || 1) * 100) >= 75).length}</h4>
                 <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center transition-colors">
                    <CheckCircle2 className="w-6 h-6" />
                 </div>
              </div>
           </div>
           <div className="bg-red-500 p-8 rounded-3xl text-white shadow-xl shadow-red-500/20 flex flex-col justify-center transition-all">
              <span className="text-white/70 text-xs font-bold uppercase tracking-widest mb-1">Defaulter Warning</span>
              <div className="flex items-end justify-between transition-colors">
                 <h4 className="text-4xl font-black">{stats.filter(s => (s.attended / (s.total_classes || 1) * 100) < 75).length}</h4>
                 <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center transition-colors">
                    <AlertCircle className="w-6 h-6" />
                 </div>
              </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 transition-colors">
         {/* Trend Graph */}
          <div className="bg-white dark:bg-slate-500 p-8 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm transition-colors">
             <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-8 flex items-center gap-2 transition-colors">
               <TrendingUp className="w-5 h-5 text-brand-500" /> Monthly Growth Trend
            </h3>
            <div className="h-64 transition-colors">
               <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-white/10 transition-colors" />
                     <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                     <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} domain={[0, 100]} />
                     <Tooltip 
                        contentStyle={{
                           borderRadius: '16px', 
                           border: 'none', 
                           boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                           backgroundColor: 'rgba(255, 255, 255, 0.9)',
                           color: '#1e293b'
                        }} 
                     />
                     <Line type="monotone" dataKey="percentage" stroke="#0ea5e9" strokeWidth={4} dot={{r: 6, fill: '#0ea5e9', strokeWidth: 3, stroke: '#fff'}} />
                  </LineChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* Subject Summary Cards List */}
         <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar transition-colors">
            {stats.map((sub, i) => {
               const percentage = Math.round((sub.attended / (sub.total_classes || 1)) * 100);
               const classesTo75 = Math.max(0, Math.ceil((0.75 * sub.total_classes - sub.attended) / (1 - 0.75)));
               
               return (
                   <div key={i} className="bg-white dark:bg-slate-500 p-5 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm flex items-center gap-4 transition-colors">
                     <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg transition-colors ${
                        percentage >= 75 ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400'
                     }`}>
                        {percentage}%
                     </div>
                     <div className="flex-1 transition-colors">
                        <div className="flex justify-between items-start transition-colors">
                             <h4 className="font-bold text-slate-800 dark:text-white text-sm transition-colors">{sub.subject_name}</h4>
                           <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors ${
                              percentage >= 75 ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400'
                           }`}>
                              {percentage >= 75 ? 'ELIGIBLE' : 'NOT ELIGIBLE'}
                           </span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-600 h-1.5 rounded-full mt-2 relative overflow-hidden transition-colors">
                           <div className={`h-full rounded-full transition-all duration-1000 ${percentage >= 75 ? 'bg-emerald-500' : 'bg-red-500'}`} style={{width: `${percentage}%`}}></div>
                        </div>
                         <div className="flex justify-between mt-2 text-[10px] font-medium text-slate-400 dark:text-slate-200 transition-colors">
                           <span>{sub.attended} / {sub.total_classes} Classes</span>
                           {percentage < 75 && <span className="text-red-500 font-bold transition-colors">Needs {classesTo75} more classes for 75%</span>}
                        </div>
                     </div>
                  </div>
               );
            })}
         </div>
      </div>

      {/* Detailed History Table */}
       <div className="bg-white dark:bg-slate-500 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden transition-colors">
         <div className="p-8 border-b border-slate-100 dark:border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-colors">
             <h3 className="text-lg font-bold text-slate-800 dark:text-white transition-colors">Attendance Log</h3>
            <div className="flex gap-3 transition-colors">
               <button className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-600 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-200 transition-all">
                  <Filter className="w-3 h-3" /> Filter
               </button>
               <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-slate-800 text-white border border-white/10 rounded-xl text-xs font-bold transition-all">
                  <Download className="w-3 h-3" /> Export Report
               </button>
            </div>
         </div>
         <div className="overflow-x-auto transition-colors">
            <table className="w-full text-left transition-colors">
               <thead className="bg-slate-50 dark:bg-slate-600/50 transition-colors">
                  <tr>
                     <th className="px-8 py-4 text-xs font-bold text-slate-500 dark:text-slate-200 uppercase tracking-wider transition-colors">Date & Time</th>
                     <th className="px-8 py-4 text-xs font-bold text-slate-500 dark:text-slate-200 uppercase tracking-wider transition-colors">Subject</th>
                     <th className="px-8 py-4 text-xs font-bold text-slate-500 dark:text-slate-200 uppercase tracking-wider text-center transition-colors">method</th>
                     <th className="px-8 py-4 text-xs font-bold text-slate-500 dark:text-slate-200 uppercase tracking-wider text-center transition-colors">Status</th>
                     <th className="px-8 py-4 text-xs font-bold text-slate-500 dark:text-slate-200 uppercase tracking-wider text-center transition-colors">Location</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100 dark:divide-white/10 transition-colors">
                  {history.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-600/40 transition-colors">
                      <td className="px-8 py-5">
                         <div className="flex items-center gap-3 transition-colors">
                            <Calendar className="w-4 h-4 text-slate-300 dark:text-slate-500 transition-colors" />
                            <div className="transition-colors">
                               <div className="font-bold text-slate-800 dark:text-white text-xs transition-colors">{new Date(row.date).toLocaleDateString()}</div>
                               <div className="text-[10px] text-slate-400 dark:text-slate-300 transition-colors">{row.time || 'N/A'}</div>
                            </div>
                         </div>
                      </td>
                      <td className="px-8 py-5 font-bold text-slate-600 dark:text-slate-200 text-xs transition-colors">{row.subject_name}</td>
                      <td className="px-8 py-5 text-center">
                         <span className="text-[10px] font-bold text-slate-500 dark:text-slate-200 uppercase bg-slate-100 dark:bg-white/10 px-2 py-1 rounded-lg italic transition-colors">{row.method || 'Manual'}</span>
                      </td>
                      <td className="px-8 py-5 text-center">
                         <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors ${
                            row.status === 'present' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' : 
                            row.status === 'absent' ? 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400' : 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400'
                         }`}>
                            {row.status === 'present' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                            {row.status}
                         </span>
                      </td>
                      <td className="px-8 py-5 text-center">
                         <div className="flex flex-col items-center gap-1 transition-colors">
                            <span className={`text-[10px] font-bold transition-colors ${row.geofence_passed ? 'text-emerald-500' : 'text-slate-400 dark:text-slate-500'}`}>
                               {row.classroom_number ? `Room ${row.classroom_number}` : (row.geofence_passed ? '✓ Verified' : '—')}
                            </span>
                            {row.geofence_passed && (
                               <span className="text-[8px] font-medium text-slate-300 dark:text-slate-500 uppercase tracking-tighter transition-colors">GPS Authenticated</span>
                            )}
                         </div>
                      </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
};

export default AttendanceAnalysis;
