import { useState, useEffect } from 'react';
import { 
    BookOpen, Layers, Edit, Save, 
    Plus, CheckCircle, Lock, Unlock,
    ChevronRight, Activity, TrendingUp,
    AlertCircle, RotateCcw
} from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/apiConfig';

const AcademicModule = () => {
    const [subTab, setSubTab] = useState('subjects'); // ise, subjects, syllabus
    const [subjects, setSubjects] = useState([]);
    const [iseStats, setIseStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ dept: 'Computer Engineering', year: 'TE', div: 'A' });



    useEffect(() => {
        fetchAcademicData();
    }, [subTab, filters]);

    const fetchAcademicData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('attendease_token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            
            if (subTab === 'subjects') {
                const res = await axios.get(`${API_BASE_URL}/admin/academic/subjects` , {
                    params: { department: filters.dept },
                    ...config
                });
                setSubjects(res.data);
            } else if (subTab === 'ise') {
                const res = await axios.get(`${API_BASE_URL}/admin/academic/ise/stats` , config);
                setIseStats(res.data);
            }
        } catch (err) {
            console.error('Academic data fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleLockMarks = async (iseNum, status) => {
        try {
            const token = localStorage.getItem('attendease_token');
            await axios.post(`${API_BASE_URL}/admin/academic/ise/lock` , {
                ise_number: iseNum,
                is_locked: status
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchAcademicData();
        } catch (err) {
            console.error('Failed to lock/unlock marks:', err);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header area */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black text-slate-800 dark:text-white dark:text-white tracking-tight flex items-center gap-3 italic transition-colors">
                        <BookOpen className="w-8 h-8 text-brand-500" />
                        ACADEMIC OPERATIONS
                    </h1>
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-400 dark:text-slate-200 uppercase tracking-widest leading-relaxed transition-colors">
                        ISE Performance Engine • Curriculum Metadata
                    </p>
                </div>
                
                <div className="flex bg-white dark:bg-slate-900 p-2 rounded-[28px] border border-slate-100 dark:border-white/10 shadow-sm overflow-x-auto no-scrollbar transition-colors">
                    {['ise', 'subjects', 'syllabus'].map(tab => (
                        <button 
                            key={tab}
                            onClick={() => setSubTab(tab)}
                            className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${subTab === tab ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/20' : 'text-slate-400 dark:text-slate-400 hover:bg-slate-50'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {subTab === 'ise' && (
                <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-slate-900 p-8 rounded-[40px] text-white relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-brand-500/10 rounded-full -mr-24 -mt-24 blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
                            <div className="relative z-10 space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest italic">ISE-1 Protocol</h3>
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-3xl font-black tracking-tighter italic">GATEWAY OPEN</p>
                                    <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Faculty Entry Permitted</p>
                                </div>
                                <button className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                                    Broadcast Deadline
                                </button>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-white/10 shadow-sm md:col-span-2 relative group overflow-hidden transition-colors">
                            <div className="absolute top-0 right-0 p-8">
                                <TrendingUp className="w-20 h-20 text-slate-50" />
                            </div>
                            <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest mb-6 italic">Performance Intelligence</h3>
                            <div className="grid grid-cols-3 gap-12 relative z-10">
                                {[{ l: 'Avg Score', v: '18.4/20', c: 'slate' }, { l: 'Failure Risk', v: '4.2%', c: 'red' }, { l: 'Submission', v: '92.1%', c: 'emerald' }].map((s, i) => (
                                    <div key={i} className="space-y-1">
                                        <p className={`text-3xl font-black tracking-tighter transition-colors ${s.c === 'slate' ? 'text-slate-800 dark:text-white dark:text-white' : `text-${s.c}-600 dark:text-${s.c}-400`}`}>{s.v}</p>
                                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-400 dark:text-slate-200 uppercase tracking-widest italic transition-colors">{s.l}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-white/10 shadow-sm overflow-hidden transition-colors">
                        <div className="p-10 border-b border-slate-50 flex items-center justify-between">
                            <h2 className="text-sm font-black text-slate-800 dark:text-white dark:text-white uppercase tracking-[0.2em] italic underline decoration-brand-500 decoration-4 underline-offset-8 transition-colors">Marking Control Center</h2>
                            <div className="flex gap-2">
                                <button className="p-3 bg-slate-50 text-slate-400 dark:text-slate-400 rounded-xl hover:bg-slate-100 transition-all border border-slate-100">
                                    <RotateCcw className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/50">
                                    <tr>
                                        <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-400">ISE SCHEME</th>
                                        <th className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-400">SUBMISSION STATUS</th>
                                        <th className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-400">ENTRY WINDOW</th>
                                        <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-400 text-right">GLOBAL LOCK</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {[1, 2].map(num => (
                                        <tr key={num} className="group hover:bg-slate-50/50 transition-all">
                                            <td className="px-10 py-8">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-black text-xs">
                                                        I-{num}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-slate-800 dark:text-white dark:text-white uppercase italic transition-colors">In-Semester Exam {num}</p>
                                                        <p className="text-[9px] font-bold text-slate-400 dark:text-slate-400 dark:text-slate-200 uppercase tracking-widest transition-colors">Weightage: 20 Marks</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-8">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                        <div className="h-full bg-brand-500 rounded-full" style={{width: num === 1 ? '98%' : '45%'}}></div>
                                                    </div>
                                                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-400">{num === 1 ? '98%' : '45%'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-8">
                                                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${num === 1 ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                                                    {num === 1 ? 'Window Closed' : 'Entry Active'}
                                                </span>
                                            </td>
                                            <td className="px-10 py-8 text-right">
                                                <button 
                                                    onClick={() => handleLockMarks(num, num === 1 ? false : true)}
                                                    className={`p-3 rounded-xl transition-all shadow-lg hover:scale-110 active:scale-95 ${num === 1 ? 'bg-slate-900 text-white shadow-slate-900/20' : 'bg-white border-2 border-brand-500 text-brand-500 shadow-brand-500/10'}`}
                                                >
                                                    {num === 1 ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {subTab === 'subjects' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-white/10 shadow-sm overflow-hidden animate-in fade-in duration-500 transition-colors">
                        <div className="p-8 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                             <h2 className="text-[10px] font-black text-slate-600 dark:text-slate-200 uppercase tracking-[0.2em] flex items-center gap-2 transition-colors">
                                <BookOpen className="w-4 h-4" /> Syllabus Registry
                             </h2>
                             <button className="px-6 py-2 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl shadow-slate-900/20">
                                New Subject
                             </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-white dark:bg-slate-900 transition-colors">
                                    <tr>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-400 dark:text-slate-200">Subject Details</th>
                                        <th className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-400 dark:text-slate-200">Assigned Faculty</th>
                                        <th className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-400 dark:text-slate-200">Progress</th>
                                        <th className="px-8 py-6 text-right"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {loading ? (
                                        [1, 2, 3].map(i => <tr key={i} className="animate-pulse px-8 py-10 h-24 bg-slate-50/30"></tr>)
                                    ) : (subjects || []).map((sub, i) => (
                                        <tr key={i} className="group hover:bg-slate-50/50 transition-all">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black text-[10px] uppercase">{sub.subject_code}</div>
                                                    <div>
                                                        <p className="text-sm font-black text-slate-800 dark:text-white dark:text-white uppercase italic leading-none transition-colors">{sub.subject_name}</p>
                                                        <p className="text-[9px] font-bold text-slate-400 dark:text-slate-400 dark:text-slate-200 mt-1 uppercase tracking-widest transition-colors">{sub.department}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white"></div>
                                                    <span className="text-[10px] font-black text-slate-600 dark:text-slate-200 uppercase tracking-widest italic transition-colors">{sub.teacher_name || 'Unassigned'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-20 h-1 bg-slate-100 rounded-full overflow-hidden">
                                                        <div className="h-full bg-brand-500" style={{width: '65%'}}></div>
                                                    </div>
                                                    <span className="text-[9px] font-black text-slate-400 dark:text-slate-400 dark:text-slate-200 transition-colors">65%</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <button className="p-2.5 text-slate-300 hover:text-slate-800 dark:text-white dark:hover:text-white transition-all opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0">
                                                    <ChevronRight className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-white/10 shadow-sm text-center group transition-colors">
                            <div className="w-20 h-20 bg-emerald-50 rounded-[28px] flex items-center justify-center mx-auto mb-6 group-hover:rotate-12 transition-transform duration-500">
                                <Activity className="w-10 h-10 text-emerald-500" />
                            </div>
                            <h3 className="text-sm font-black text-slate-800 dark:text-white dark:text-white uppercase tracking-widest italic mb-2 transition-colors">Curriculum Sync</h3>
                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-400 dark:text-slate-200 uppercase tracking-widest leading-relaxed px-6 transition-colors">Harmonize all syllabus topics with current academic year timeline.</p>
                            <button className="mt-8 px-10 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:scale-105 transition-all shadow-xl shadow-slate-900/20">
                                Run Global Sync
                            </button>
                        </div>
                        
                        <div className="bg-slate-50 dark:bg-slate-600 p-8 rounded-[40px] border border-dashed border-slate-200 dark:border-white/10 transition-colors">
                            <h3 className="text-[10px] font-black text-slate-500 dark:text-slate-200 uppercase tracking-widest mb-6 italic transition-colors">Batch Summary</h3>
                            <div className="space-y-6">
                                {[
                                    { label: 'Total Subjects', value: '42 Active' },
                                    { label: 'Pending Lab Setup', value: '8 Units' },
                                    { label: 'Elective Selection', value: 'Complete' }
                                ].map((it, i) => (
                                    <div key={i} className="flex items-center justify-between">
                                        <span className="text-[9px] font-black text-slate-400 dark:text-slate-400 dark:text-slate-300 uppercase tracking-widest transition-colors">{it.label}</span>
                                        <span className="text-[9px] font-black text-slate-800 dark:text-white dark:text-white uppercase tracking-widest transition-colors">{it.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {subTab === 'syllabus' && (
                <div className="bg-white dark:bg-slate-900 p-16 rounded-[40px] border border-slate-100 dark:border-white/10 shadow-sm text-center flex flex-col items-center animate-in zoom-in-95 duration-500 overflow-hidden relative transition-colors">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                    <Layers className="w-20 h-20 text-slate-100 mb-8" />
                    <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-[0.3em] italic mb-4 font-primary">Course Depth Meter</h2>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-[0.2em] max-w-lg leading-relaxed italic mb-10">Real-time visualization of unit-wise coverage across all 8 semesters. Integrated with teacher daily logs and verified by department HODs.</p>
                    <div className="w-full max-w-2xl bg-slate-50 p-1 rounded-full border border-slate-100 mb-12">
                         <div className="flex justify-between px-8 py-3 text-[9px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest italic">
                            <span>Syllabus Completed</span>
                            <span className="text-brand-500">62.8% Aggregate</span>
                         </div>
                    </div>
                    <button className="px-12 py-5 bg-slate-900 text-white rounded-3xl text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-slate-900/40 hover:scale-105 active:scale-95 transition-all">
                        Initialize Tracking Deck
                    </button>
                </div>
            )}
        </div>
    );
};

export default AcademicModule;

