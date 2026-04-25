import { useState } from 'react';
import { 
    FileText, Download, Filter, Calendar, 
    CheckCircle, FileDown, Mail, Printer,
    Search, FileCheck, ShieldCheck, Activity
} from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/apiConfig';

const ReportsModule = () => {
    const [loading, setLoading] = useState(false);
    const [reportType, setReportType] = useState('attendance'); // attendance, ise, compliance, student-progress

    const handleExport = async (type) => {
        setLoading(true);
        try {
            // Placeholder for real export logic
            const res = await axios.get(`${API_BASE_URL}/admin/reports/export/${type}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('attendease_token')}` }
            });
            alert(`Report generated: ${res.data.message}`);
        } catch (error) {
            console.error('Export failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const reportCards = [
        { id: 'attendance', title: 'Attendance Analytics', icon: Activity, desc: 'Detailed monthly participation logs by department.' },
        { id: 'ise', title: 'Academic Progress', icon: FileCheck, desc: 'ISE performance breakdown and toppers list.' },
        { id: 'compliance', title: 'University Compliance', icon: ShieldCheck, desc: 'AICTE/University format monthly compliance reports.' },
        { id: 'faculty', title: 'Workload Report', icon: FileText, desc: 'Faculty lecture hours and syllabus coverage tracking.' },
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 dark:text-white dark:text-white tracking-tight flex items-center gap-3 transition-colors">
                        <FileText className="w-8 h-8 text-brand-500" />
                        COMPLIANCE & REPORTS
                    </h1>
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-400 dark:text-slate-200 uppercase tracking-widest mt-1 transition-colors">
                        Automated Data Extraction & Official Documentation Generation
                    </p>
                </div>
                <div className="flex bg-slate-900 p-1.5 rounded-2xl shadow-xl shadow-slate-900/20">
                    <button className="flex items-center gap-2 px-6 py-2.5 bg-brand-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all">
                        <Mail className="w-4 h-4" /> Schedule Automated Reports
                    </button>
                </div>
            </div>

            {/* Report Selector Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {reportCards.map((card) => (
                    <div 
                        key={card.id}
                        onClick={() => setReportType(card.id)}
                        className={`p-6 rounded-[32px] border-2 cursor-pointer transition-all transition-colors ${reportType === card.id ? 'bg-white dark:bg-slate-900 border-brand-500 shadow-xl shadow-brand-500/10 scale-[1.02]' : 'bg-white dark:bg-slate-900/50 border-slate-50 dark:border-white/5 hover:border-slate-200 shadow-sm'}`}
                    >
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${reportType === card.id ? 'bg-brand-500 text-white' : 'bg-slate-50 text-slate-400 dark:text-slate-400'}`}>
                            <card.icon className="w-6 h-6" />
                        </div>
                        <h3 className="text-sm font-black text-slate-800 dark:text-white dark:text-white uppercase tracking-widest mb-2 transition-colors">{card.title}</h3>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-400 dark:text-slate-200 leading-relaxed italic transition-colors">{card.desc}</p>
                    </div>
                ))}
            </div>

            {/* Active Report Configurator */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-white/10 shadow-sm transition-colors">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Left: Configuration */}
                    <div className="lg:w-1/3 space-y-6">
                        <h3 className="text-sm font-black text-slate-800 dark:text-white dark:text-white uppercase tracking-widest border-b border-slate-50 dark:border-white/10 pb-4 transition-colors">Report Parameters</h3>
                        
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-400 dark:text-slate-200 uppercase tracking-widest ml-1 transition-colors">Department Scope</label>
                                <select className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 dark:text-white border-none rounded-2xl text-xs font-black outline-none focus:ring-2 ring-brand-500 appearance-none transition-colors">
                                    <option>All Departments</option>
                                    {[
                                        "First Year Engineering", "Chemical Engineering", "Civil Engineering", 
                                        "Computer Engineering", "Electrical Engineering", 
                                        "Electronics & Telecommunications Engg.", "Mechanical Engineering"
                                    ].map(dept => (
                                        <option key={dept}>{dept}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-400 dark:text-slate-200 uppercase tracking-widest ml-1 transition-colors">Time Period</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <input type="date" className="px-3 py-3 bg-slate-50 border-none rounded-xl text-[10px] font-black" />
                                    <input type="date" className="px-3 py-3 bg-slate-50 border-none rounded-xl text-[10px] font-black" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-400 dark:text-slate-200 uppercase tracking-widest ml-1 transition-colors">Format Options</label>
                                <div className="flex flex-wrap gap-2">
                                    {['PDF', 'Excel', 'CSV', 'JSON'].map(f => (
                                        <button key={f} className="px-4 py-2 bg-slate-50 rounded-lg text-[10px] font-black text-slate-400 dark:text-slate-400 hover:bg-brand-50 hover:text-brand-500 transition-all border border-transparent hover:border-brand-100">
                                            {f}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="pt-6">
                            <button 
                                onClick={() => handleExport('pdf')}
                                disabled={loading}
                                className="w-full py-4 bg-slate-900 dark:bg-slate-950 text-white rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-slate-900/20 hover:scale-[1.02] active:scale-95 transition-all"
                            >
                                {loading ? 'Compiling...' : <><FileDown className="w-4 h-4" /> Download Official Report</>}
                            </button>
                        </div>
                    </div>

                    {/* Right: Preview & Meta */}
                    <div className="flex-1 bg-slate-50 dark:bg-slate-800/50 rounded-[32px] p-8 flex flex-col items-center justify-center relative overflow-hidden transition-colors">
                        <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 to-transparent"></div>
                        <div className="w-full max-w-md bg-white dark:bg-slate-800 p-12 rounded-2xl shadow-xl border border-slate-100 dark:border-white/10 relative z-10 transform -rotate-1 transition-colors">
                            <div className="flex items-center gap-4 mb-8 border-b border-slate-50 pb-6">
                                <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center">
                                    <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS9Ja7gfCpnjkyFXUCu_v5gSyxxIGNVuFmSqw&s" className="w-8 h-8 object-contain" alt="Logo" />
                                </div>
                                <div>
                                    <h4 className="text-[10px] font-black text-slate-800 dark:text-white uppercase tracking-[0.2em]">SSBT COET Jalgaon</h4>
                                    <p className="text-[8px] font-bold text-slate-400 dark:text-slate-400 uppercase">Official Regulatory Report</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="h-2 w-3/4 bg-slate-100 rounded-full"></div>
                                <div className="h-2 w-full bg-slate-50 rounded-full"></div>
                                <div className="h-2 w-5/6 bg-slate-50 rounded-full"></div>
                                <div className="grid grid-cols-2 gap-4 py-8">
                                    <div className="h-20 bg-slate-50 dark:bg-slate-900/50 rounded-xl flex flex-col items-center justify-center gap-2 transition-colors">
                                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center overflow-hidden border border-slate-100">
                                            <Activity className="w-4 h-4 text-brand-500" />
                                        </div>
                                        <span className="text-[8px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest">Analytics</span>
                                    </div>
                                    <div className="h-20 bg-slate-50 dark:bg-slate-900/50 rounded-xl flex flex-col items-center justify-center gap-2 transition-colors">
                                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center overflow-hidden border border-slate-100">
                                            <FileCheck className="w-4 h-4 text-emerald-500" />
                                        </div>
                                        <span className="text-[8px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest">Verified</span>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 pt-6">
                                    <div className="w-16 h-1 w-slate-100 rounded-full"></div>
                                    <div className="w-24 h-1 bg-slate-100 rounded-full"></div>
                                </div>
                            </div>
                        </div>
                        <p className="mt-8 text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <ShieldCheck className="w-3 h-3 text-emerald-500" /> Final Authenticated Preview
                        </p>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-slate-900 p-8 rounded-[40px] text-white flex items-center justify-between group overflow-hidden relative">
                    <div className="absolute left-0 bottom-0 w-32 h-32 bg-brand-500/10 rounded-full -ml-16 -mb-16 blur-3xl"></div>
                    <div>
                        <h3 className="text-sm font-black uppercase tracking-widest mb-1 italic">Print Daily Deck</h3>
                        <p className="text-[10px] text-slate-400 dark:text-slate-400 font-bold tracking-tight">Today's summarized attendance & session cards.</p>
                    </div>
                    <button className="p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all group-hover:scale-110 active:scale-95">
                        <Printer className="w-6 h-6 text-brand-400" />
                    </button>
                </div>

                <div className="bg-brand-500 p-8 rounded-[40px] text-white flex items-center justify-between group overflow-hidden relative shadow-xl shadow-brand-500/20">
                    <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                    <div>
                        <h3 className="text-sm font-black uppercase tracking-widest mb-1 italic">Audit Log Export</h3>
                        <p className="text-[10px] text-brand-50 font-bold tracking-tight">Export full system activity logs for security review.</p>
                    </div>
                    <button className="p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all group-hover:scale-110 active:scale-95 border border-white/20">
                        <Download className="w-6 h-6 text-white" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReportsModule;
