import { useState, useEffect } from 'react';
import { 
    Users, BookOpen, GraduationCap, AlertTriangle, 
    TrendingUp, ArrowUpRight, Activity, FileText,
    Zap, Megaphone, FileDown, ShieldCheck, Clock, CheckCircle
} from 'lucide-react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    AreaChart, Area, LineChart, Line, Cell, PieChart, Pie
} from 'recharts';
import axios from 'axios';
import { API_BASE_URL } from '../../config/apiConfig';

const OverviewModule = () => {
    const [stats, setStats] = useState(null);
    const [chartData, setChartData] = useState(null);
    const [recentLogs, setRecentLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('attendease_token');
                const config = { headers: { Authorization: `Bearer ${token}` } };
                
                const [statsRes, chartRes, activityRes] = await Promise.all([
                    axios.get(`${API_BASE_URL}/admin/dashboard/stats` , config),
                    axios.get(`${API_BASE_URL}/admin/dashboard/charts` , config),
                    axios.get(`${API_BASE_URL}/admin/dashboard/recent-activity` , config)
                ]);
                
                setStats(statsRes.data);
                setChartData(chartRes.data);
                setRecentLogs(activityRes.data);
            } catch (err) {
                console.error('Error fetching dashboard data:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return (
        <div className="space-y-8 p-10 flex flex-col items-center justify-center min-h-[400px]">
             <div className="w-16 h-16 border-4 border-slate-100 dark:border-white/10 border-t-brand-500 rounded-full animate-spin"></div>
             <p className="mt-4 text-[10px] font-black uppercase text-slate-400 dark:text-slate-300 tracking-widest animate-pulse transition-colors">Synchronizing Campus Data...</p>
        </div>
    );

    const cards = [
        { label: "Today's Presence", value: `${stats?.today_attendance || 0}%`, sub: "Live Session Data", icon: Activity, color: "blue" },
        { label: "Total Students", value: stats?.total_students || 0, sub: "Across all Depts", icon: Users, color: "indigo" },
        { label: "Faculty Strength", value: stats?.total_faculty || 0, sub: "SSBT Teaching Staff", icon: BookOpen, color: "emerald" },
        { label: "Total Defaulters", value: stats?.defaulters || 0, sub: "< 75% Attendance", icon: AlertTriangle, color: "red" },
    ];

    const COLORS = ['#1a3a5c', '#d4a017', '#3b82f6', '#10b981', '#f59e0b'];

    // Mock data for new charts as requested in spec
    const yearWiseData = [
        { year: 'FE', pct: 88 },
        { year: 'SE', pct: 82 },
        { year: 'TE', pct: 75 },
        { year: 'BE', pct: 91 },
    ];

    const lowestSubjects = [
        { subject: 'DBMS', pct: 64 },
        { subject: 'TOC', pct: 68 },
        { subject: 'OS', pct: 71 },
        { subject: 'CN', pct: 73 },
        { subject: 'AI', pct: 74 },
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
                        <Zap className="w-8 h-8 text-brand-500 fill-brand-500" />
                        CAMPUS OVERVIEW
                    </h1>
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest mt-1 italic transition-colors">
                        SSBTCOET Jalgaon • Attendance Management Interface
                    </p>
                </div>
                <div className="flex bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-100 dark:border-white/10 shadow-sm transition-colors">
                    <div className="px-4 py-2 text-[10px] font-black uppercase text-brand-500 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-ping"></div>
                        Live System Status
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((card, i) => (
                    <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-100 dark:border-white/10 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden transition-colors">
                        <div className="flex justify-between items-start mb-6">
                            <div className={`p-4 ${card.color === 'red' ? 'bg-red-50 dark:bg-red-500/10 text-red-500' : 'bg-brand-50 dark:bg-brand-500/10 text-brand-500'} rounded-2xl group-hover:rotate-6 transition-transform shadow-sm`}>
                                <card.icon className="w-6 h-6" />
                            </div>
                            <div className="flex items-center gap-1.5 text-emerald-500 text-[10px] font-black bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-lg transition-colors">
                                <TrendingUp className="w-3 h-3" /> +2.4%
                            </div>
                        </div>
                        <h3 className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter transition-colors">{card.value}</h3>
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-200 uppercase tracking-widest mt-1 transition-colors">{card.label}</p>
                        <p className="text-[9px] font-bold text-slate-400 dark:text-slate-300 mt-2 italic transition-colors">{card.sub}</p>
                        <div className={`absolute bottom-0 left-0 w-full h-1 bg-${card.color === 'red' ? 'red' : 'brand'}-500 opacity-20 group-hover:opacity-100 transition-opacity`}></div>
                    </div>
                ))}
            </div>

            {/* Main Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Department Wise Attendance */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-white/10 shadow-sm transition-colors">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest transition-colors">Department Compliance</h3>
                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-200 mt-1 italic uppercase tracking-wider transition-colors">Average Attendance Percentage per Department</p>
                        </div>
                        <button className="p-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all">
                            <ArrowUpRight className="w-4 h-4 text-slate-400 dark:text-slate-200" />
                        </button>
                    </div>
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData?.department_comparison || []}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis 
                                    dataKey="department" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fontSize: 10, fontWeight: 900, fill: '#94a3b8'}} 
                                    dy={10}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fontSize: 10, fontWeight: 900, fill: '#94a3b8'}} 
                                    unit="%"
                                />
                                <Tooltip 
                                    cursor={{fill: '#f8fafc'}}
                                    contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)', padding: '16px'}}
                                />
                                <Bar dataKey="attendance_pct" radius={[12, 12, 0, 0]} barSize={50}>
                                    {(chartData?.department_comparison || []).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Daily Trend */}
                <div className="bg-slate-900 p-8 rounded-[40px] shadow-2xl shadow-slate-900/20 text-white relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
                    <div className="mb-10 relative z-10">
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-1 italic">30-Day Velocity</h3>
                        <p className="text-2xl font-black text-white tracking-tighter">Attendance Flow</p>
                    </div>
                    <div className="h-[250px] relative z-10">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData?.daily_trend || []}>
                                <defs>
                                    <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="date" hide />
                                <Tooltip contentStyle={{backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px'}} />
                                <Area type="monotone" dataKey="pct" stroke="#3b82f6" strokeWidth={5} fillOpacity={1} fill="url(#colorTrend)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-8 pt-8 border-t border-white/5 flex items-center justify-between relative z-10">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Avg. Consistency</p>
                            <p className="text-2xl font-black text-brand-400 mt-1 tracking-tighter">94.2%</p>
                        </div>
                        <div className="h-14 w-14 bg-white/5 rounded-2xl flex items-center justify-center text-brand-400 border border-white/10 group-hover:scale-110 transition-all">
                             <CheckCircle className="w-8 h-8" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Secondary Charts & Feed Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Year-wise Attendance */}
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-white/10 shadow-sm transition-colors">
                    <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest mb-8 transition-colors">Batch Participation</h3>
                    <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={yearWiseData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" opacity={0.1} />
                                <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#94a3b8'}} />
                                <Bar dataKey="pct" radius={[8, 8, 0, 0]} fill="#1a3a5c" barSize={30} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Lowest Attendance Subjects */}
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-white/10 shadow-sm transition-colors">
                    <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest mb-8 transition-colors">Subject Warning List</h3>
                    <div className="space-y-5">
                        {lowestSubjects.map((sub, i) => (
                            <div key={i} className="space-y-2">
                                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest transition-colors">
                                    <span className="text-slate-700 dark:text-slate-300">{sub.subject}</span>
                                    <span className="text-red-500">{sub.pct}%</span>
                                </div>
                                <div className="w-full h-2 bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-100 dark:border-white/5 transition-colors">
                                    <div className="h-full bg-red-500 rounded-full transition-all duration-1000" style={{width: `${sub.pct}%`}}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <p className="mt-8 text-[9px] font-bold text-slate-400 dark:text-slate-200 text-center italic uppercase transition-colors">Critical subjects requiring intervention</p>
                </div>

                {/* Activity Feed */}
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-white/10 shadow-sm transition-colors">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest italic transition-colors">Live Activity</h3>
                        <div className="w-2 h-2 bg-brand-500 rounded-full animate-ping"></div>
                    </div>
                    <div className="space-y-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar transition-colors">
                        {recentLogs.length > 0 ? (
                            recentLogs.map((log, i) => (
                                <div key={i} className="flex gap-4 relative">
                                    {i !== recentLogs.length - 1 && <div className="absolute left-[11px] top-8 bottom-[-24px] w-0.5 bg-slate-50 dark:bg-slate-800"></div>}
                                    <div className={`w-6 h-6 rounded-lg bg-${log.action.includes('CREATE') ? 'emerald' : log.action.includes('DELETE') ? 'red' : 'brand'}-50 dark:bg-white/5 text-${log.action.includes('CREATE') ? 'emerald' : log.action.includes('DELETE') ? 'red' : 'brand'}-500 flex items-center justify-center shrink-0 z-10 border border-white dark:border-slate-800 transition-colors`}>
                                        <Activity className="w-3.5 h-3.5" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-tight mb-1 transition-colors">{log.description}</p>
                                        <p className="text-[9px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest transition-colors">{new Date(log.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-center py-20 text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest transition-colors">No recent logs</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Actions Bar */}
            <div className="flex flex-wrap gap-4 pt-4">
                <button className="flex-1 min-w-[200px] bg-brand-500 p-6 rounded-[32px] text-white flex items-center justify-between group shadow-xl shadow-brand-500/20 hover:scale-[1.02] active:scale-95 transition-all outline-none border-2 border-brand-400">
                    <div>
                        <h4 className="text-sm font-black uppercase tracking-widest mb-1 italic">Master Code</h4>
                        <p className="text-[10px] text-brand-100 font-bold opacity-80">Generate Daily Token</p>
                    </div>
                    <div className="p-3 bg-white/10 rounded-2xl group-hover:rotate-12 transition-transform">
                        <Zap className="w-6 h-6" />
                    </div>
                </button>
                <button className="flex-1 min-w-[200px] bg-slate-900 p-6 rounded-[32px] text-white flex items-center justify-between group shadow-xl shadow-slate-900/20 hover:scale-[1.02] active:scale-95 transition-all outline-none border-2 border-slate-800">
                    <div>
                        <h4 className="text-sm font-black uppercase tracking-widest mb-1 italic">Broadcast</h4>
                        <p className="text-[10px] text-slate-400 font-bold opacity-80">Global Notification</p>
                    </div>
                    <div className="p-3 bg-white/10 rounded-2xl group-hover:-rotate-12 transition-transform">
                        <Megaphone className="w-6 h-6 text-brand-400" />
                    </div>
                </button>
                <button className="flex-1 min-w-[200px] bg-white dark:bg-slate-900 p-6 rounded-[32px] text-slate-800 dark:text-white flex items-center justify-between group border border-slate-100 dark:border-white/10 shadow-sm hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all outline-none">
                    <div>
                        <h4 className="text-sm font-black uppercase tracking-widest mb-1 italic">Intelligence</h4>
                        <p className="text-[10px] text-slate-400 dark:text-slate-300 font-bold opacity-80">Download Full Deck</p>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl group-hover:scale-110 transition-transform transition-colors">
                        <FileDown className="w-6 h-6 text-brand-500" />
                    </div>
                </button>
            </div>
        </div>
    );
};

export default OverviewModule;

