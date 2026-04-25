import React, { useMemo } from 'react';
import { BookOpen, TrendingUp, Download, CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const ISEMarksSection = ({ marks }) => {
  const processedMarks = useMemo(() => {
    return marks.map(m => {
      const scores = [parseFloat(m.ise_1 || 0), parseFloat(m.ise_2 || 0), parseFloat(m.ise_3 || 0)].sort((a, b) => b - a);
      const bestTwoSum = scores[0] + scores[1];
      let status = 'Good';
      let color = '#10b981'; // green
      if (bestTwoSum < 20) {
        status = 'Poor';
        color = '#ef4444'; // red
      } else if (bestTwoSum < 30) {
        status = 'Average';
        color = '#f59e0b'; // yellow
      }
      
      return {
        ...m,
        bestTwoSum,
        status,
        color
      };
    });
  }, [marks]);

  const recommendations = useMemo(() => {
    const poor = processedMarks.filter(m => m.bestTwoSum < 24);
    const good = processedMarks.filter(m => m.bestTwoSum >= 32);
    
    let recs = [];
    if (poor.length > 0) {
      recs.push(`Focus on ${poor[0].subject_name} - Current score is ${poor[0].bestTwoSum.toFixed(1)}/40.`);
    }
    if (good.length > 0) {
      recs.push(`Excellent performance in ${good[0].subject_name} - Consistently above 15 marks.`);
    }
    return recs;
  }, [processedMarks]);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-500 p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm flex items-center gap-4 transition-colors">
           <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
           </div>
            <div>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-300 uppercase tracking-wider transition-colors">Overall Average</p>
              <h4 className="text-xl font-bold text-slate-800 dark:text-white transition-colors">
                {(processedMarks.reduce((acc, curr) => acc + curr.bestTwoSum, 0) / (processedMarks.length || 1)).toFixed(1)}/40
              </h4>
            </div>
        </div>
        <div className="bg-white dark:bg-slate-500 p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm flex items-center gap-4 transition-colors">
           <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
           </div>
            <div>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-300 uppercase tracking-wider transition-colors">Passed (Best 2 Sum)</p>
              <h4 className="text-xl font-bold text-slate-800 dark:text-white transition-colors">{processedMarks.filter(m => m.bestTwoSum >= 20).length} Subjects</h4>
            </div>
        </div>
        <button className="bg-slate-900 hover:bg-slate-800 text-white p-6 rounded-3xl shadow-xl shadow-slate-900/20 transition-all flex items-center justify-center gap-3">
           <Download className="w-5 h-5" />
           <span className="font-bold">Download Marksheet</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-500 p-8 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm transition-colors">
           <div className="flex justify-between items-center mb-8">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white transition-colors">Performance Chart</h3>
              <div className="flex gap-4 text-xs font-bold text-slate-400 dark:text-slate-300 transition-colors">
                 <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Good</div>
                 <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Avg</div>
                 <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> Poor</div>
              </div>
           </div>
           <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={processedMarks}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="subject_code" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} domain={[0, 40]} />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}} 
                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} 
                  />
                  <Bar dataKey="bestTwoSum" radius={[6, 6, 0, 0]} barSize={40}>
                    {processedMarks.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Recommendations */}
        <div className="bg-indigo-600 dark:bg-indigo-900 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden transition-colors">
           <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
           <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <HelpCircle className="w-5 h-5" /> Suggestions
           </h3>
           <div className="space-y-4">
              {recommendations.length > 0 ? recommendations.map((rec, i) => (
                <div key={i} className="bg-white/10 p-4 rounded-2xl border border-white/10 flex gap-3 italic text-sm">
                   <div className="min-w-[4px] h-full bg-indigo-300 rounded-full"></div>
                   "{rec}"
                </div>
              )) : (
                <div className="text-white/60 text-sm">No data available for recommendations.</div>
              )}
           </div>
        </div>
      </div>

      {/* Marks Table */}
      <div className="bg-white dark:bg-slate-500 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden transition-colors">
         <div className="p-8 border-b border-slate-100 dark:border-white/10 flex justify-between items-center transition-colors">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white transition-colors">ISE Detailed Report</h3>
            <span className="text-xs font-bold text-slate-400 dark:text-slate-200 uppercase tracking-widest transition-colors">Max Marks: 20 per ISE</span>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead className="bg-slate-50">
                  <tr>
                    <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Subject</th>
                    <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">ISE-1</th>
                    <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">ISE-2</th>
                    <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">ISE-3</th>
                    <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Best Two Sum</th>
                    <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Status</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                  {processedMarks.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-600/50 transition-colors">
                      <td className="px-8 py-5">
                         <div className="font-bold text-slate-800 dark:text-white transition-colors">{row.subject_name}</div>
                         <div className="text-xs text-slate-400 dark:text-slate-200 font-medium transition-colors">{row.subject_code}</div>
                      </td>
                      <td className="px-8 py-5 text-center font-medium text-slate-600 dark:text-slate-200 transition-colors">{row.ise_1 !== null && row.ise_1 !== undefined ? parseFloat(row.ise_1).toString() : '--'}</td>
                      <td className="px-8 py-5 text-center font-medium text-slate-600 dark:text-slate-200 transition-colors">{row.ise_2 !== null && row.ise_2 !== undefined ? parseFloat(row.ise_2).toString() : '--'}</td>
                      <td className="px-8 py-5 text-center font-medium text-slate-600 dark:text-slate-200 transition-colors">{row.ise_3 !== null && row.ise_3 !== undefined ? parseFloat(row.ise_3).toString() : '--'}</td>
                      <td className="px-8 py-5 text-center font-bold text-brand-600 dark:text-brand-400 transition-colors">{row.bestTwoSum.toFixed(1)}</td>
                      <td className="px-8 py-5 text-center">
                         <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            row.status === 'Good' ? 'bg-emerald-100 text-emerald-700' : 
                            row.status === 'Average' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                         }`}>
                            {row.status}
                         </span>
                      </td>
                    </tr>
                  ))}
                  {processedMarks.length === 0 && (
                     <tr>
                        <td colSpan="6" className="px-8 py-10 text-center text-slate-400 italic">No ISE marks published yet.</td>
                     </tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
};

export default ISEMarksSection;
