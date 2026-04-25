import { useState, useEffect } from 'react';
import { 
    Activity, MapPin, AlertCircle, Clock, 
    ArrowRight, Map, CheckCircle2, XCircle, 
    ShieldAlert, Filter, Download, Mail,
    Zap, Locate, Navigation, Crosshair, Users
} from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/apiConfig';

const AttendanceModule = () => {
    const [liveSessions, setLiveSessions] = useState([]);
    const [defaulters, setDefaulters] = useState([]);
    const [geofenceLogs, setGeofenceLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('live'); // live, defaulters, geofencing, master
    const [masterCode, setMasterCode] = useState('');

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('attendease_token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            
            if (activeTab === 'live') {
                const res = await axios.get(`${API_BASE_URL}/admin/attendance/live` , config);
                setLiveSessions(res.data);
            } else if (activeTab === 'defaulters') {
                const res = await axios.get(`${API_BASE_URL}/admin/attendance/defaulters` , config);
                setDefaulters(res.data);
            } else if (activeTab === 'geofencing') {
                const res = await axios.get(`${API_BASE_URL}/admin/attendance/geofence-logs` , config);
                setGeofenceLogs(res.data);
            }
        } catch (err) {
            console.error('Error fetching attendance data:', err);
        } finally {
            setLoading(false);
        }
    };

    const generateCode = async () => {
        try {
            const token = localStorage.getItem('attendease_token');
            const res = await axios.post(`${API_BASE_URL}/admin/attendance/generate-code` , {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMasterCode(res.data.code);
        } catch (err) {
            console.error('Code generation failed:', err);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3 italic transition-colors">
                        <Activity className="w-8 h-8 text-brand-500" />
                        ATTENDANCE COMMAND
                    </h1>
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-200 uppercase tracking-widest mt-1 transition-colors">
                        Real-time Monitoring • Geofencing Validation • Defaulter Management
                    </p>
                </div>
                <div className="flex bg-white dark:bg-slate-500 p-2 rounded-[28px] border border-slate-100 dark:border-white/10 shadow-sm overflow-x-auto no-scrollbar transition-colors">
                    {['live', 'defaulters', 'geofencing', 'master'].map(tab => (
                        <button 
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab ? 'bg-brand-500 text-white shadow-xl shadow-brand-500/20' : 'text-slate-400 hover:bg-slate-50'}`}
                        >
                            {tab.replace('-', ' ')}
                        </button>
                    ))}
                </div>
            </div>

            {loading && activeTab !== 'master' ? (
                <div className="p-20 flex flex-col items-center justify-center">
                    <div className="w-12 h-12 border-4 border-slate-100 border-t-brand-500 rounded-full animate-spin"></div>
                    <p className="mt-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Intercepting Feed...</p>
                </div>
            ) : (
                <>
                    {activeTab === 'live' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {liveSessions.length === 0 ? (
                                <div className="col-span-full py-32 bg-white dark:bg-slate-500 rounded-[40px] border border-dashed border-slate-200 dark:border-white/10 flex flex-col items-center justify-center transition-colors">
                                    <Clock className="w-16 h-16 text-slate-100 mb-4 animate-pulse" />
                                    <p className="font-black text-slate-300 uppercase tracking-widest">No Active Sessions Detected</p>
                                </div>
                            ) : (
                                liveSessions.map((session, i) => (
                                    <div key={i} className="bg-white dark:bg-slate-500 p-8 rounded-[40px] border border-slate-100 dark:border-white/10 shadow-sm hover:shadow-xl transition-all relative overflow-hidden group transition-colors">
                                        <div className="absolute top-0 right-0 w-48 h-48 bg-brand-500/5 -mr-24 -mt-24 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                                        <div className="flex items-center justify-between mb-8">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
                                                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">LIVE FLOW</span>
                                            </div>
                                            <div className="text-[10px] font-black text-slate-400 bg-slate-100 px-3 py-1 rounded-lg uppercase tracking-widest">
                                                {session.room_number || 'LAB-D'}
                                            </div>
                                        </div>
                                        <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tighter mb-1 uppercase italic leading-none transition-colors">{session.subject_name}</h3>
                                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-200 uppercase tracking-widest mb-8 transition-colors">{session.teacher_name}</p>
                                        
                                        <div className="space-y-4 mb-10">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Presence Efficiency</span>
                                                <span className="text-xs font-black text-slate-800 tracking-tighter">84.5%</span>
                                            </div>
                                            <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                                                <div className="h-full bg-brand-500 rounded-full transition-all duration-1000" style={{width: '84.5%'}}></div>
                                            </div>
                                            <div className="flex items-center gap-6">
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-black text-slate-400 dark:text-slate-200 uppercase tracking-widest transition-colors">Present</span>
                                                    <span className="text-sm font-black text-slate-800 dark:text-white transition-colors">48</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-black text-slate-400 dark:text-slate-200 uppercase tracking-widest transition-colors">Target</span>
                                                    <span className="text-sm font-black text-slate-800 dark:text-white transition-colors">60</span>
                                                </div>
                                            </div>
                                        </div>

                                        <button className="w-full py-4 bg-slate-900 border-2 border-slate-800 text-white rounded-3xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-slate-900/20 hover:scale-[1.02] active:scale-95 transition-all">
                                            Track Interaction
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {activeTab === 'defaulters' && (
                        <div className="bg-white dark:bg-slate-500 rounded-[40px] border border-slate-100 dark:border-white/10 shadow-sm overflow-hidden animate-in fade-in duration-500 transition-colors">
                            <div className="p-10 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div>
                                    <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight uppercase italic flex items-center gap-3 transition-colors">
                                        <ShieldAlert className="w-6 h-6 text-red-500" />
                                        Intervention Deck
                                    </h2>
                                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-200 mt-2 uppercase tracking-widest transition-colors">Students with compliance below institutional baseline (75%)</p>
                                </div>
                                <div className="flex gap-2">
                                    <button className="px-8 py-3 bg-red-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-red-500/20 hover:scale-105 transition-all">
                                        Broadcast Warnings
                                    </button>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50/50">
                                        <tr>
                                            <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">STUDENT IDENTIFIER</th>
                                            <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">DEPT / YEAR</th>
                                            <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">COMPLIANCE %</th>
                                            <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">ACTION</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {defaulters.map((s, i) => (
                                            <tr key={i} className="hover:bg-red-50/20 transition-all border-l-4 border-transparent hover:border-red-500 group">
                                                <td className="px-10 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-black text-xs uppercase">
                                                            {s.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black text-slate-800 dark:text-white uppercase italic leading-none transition-colors">{s.name}</p>
                                                            <p className="text-[9px] font-bold text-slate-400 dark:text-slate-200 mt-1 uppercase tracking-widest transition-colors">{s.prn}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-6">
                                                    <span className="px-3 py-1 bg-white border border-slate-100 rounded-lg text-[9px] font-black uppercase text-slate-400 tracking-widest">{s.dept} • {s.year}</span>
                                                </td>
                                                <td className="px-6 py-6 font-primary">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                            <div className="h-full bg-red-500 rounded-full" style={{ width: s.attendance }}></div>
                                                        </div>
                                                        <span className="text-sm font-black text-red-600 tracking-tighter">{s.attendance}</span>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-6">
                                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                        <button className="px-6 py-2 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-slate-900/20 hover:scale-110 active:scale-95 transition-all">
                                                            Generate PDF
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'geofencing' && (
                        <div className="bg-white dark:bg-slate-500 rounded-[40px] border border-slate-100 dark:border-white/10 shadow-sm overflow-hidden animate-in zoom-in-95 duration-500 transition-colors">
                             <div className="p-10 border-b border-slate-50 bg-slate-900 text-white relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
                                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div>
                                        <h2 className="text-xl font-black tracking-tight uppercase italic flex items-center gap-3">
                                            <Locate className="w-6 h-6 text-brand-400" />
                                            GEOFENCE VIOLATION LOGS
                                        </h2>
                                        <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">Deep-dive into classroom perimeter compliance telemetry</p>
                                    </div>
                                    <div className="px-6 py-2 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Total Violations (24h)</p>
                                        <p className="text-xl font-black text-brand-400 mt-0.5">{geofenceLogs.length}</p>
                                    </div>
                                </div>
                             </div>
                             <div className="overflow-x-auto">
                                 <table className="w-full text-left">
                                     <thead className="bg-slate-50/50">
                                         <tr>
                                             <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">TIMESTAMP / USER</th>
                                             <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">LOCATION DATA</th>
                                             <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">DISTANCE OFF</th>
                                             <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">PROTOCOL STATUS</th>
                                         </tr>
                                     </thead>
                                     <tbody className="divide-y divide-slate-50 dark:divide-white/10">
                                         {geofenceLogs.map((log, i) => (
                                             <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-600/50 transition-all border-l-4 border-transparent hover:border-brand-500 group">
                                                 <td className="px-10 py-6">
                                                     <div className="flex flex-col">
                                                          <span className="text-[10px] font-black text-slate-800 dark:text-white uppercase tracking-widest mb-1 italic transition-colors">{new Date(log.created_at).toLocaleTimeString()}</span>
                                                          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-200 uppercase tracking-[0.2em] transition-colors">{log.student_name}</span>
                                                      </div>
                                                 </td>
                                                 <td className="px-6 py-6">
                                                     <div className="flex items-center gap-3 px-3 py-1 bg-white dark:bg-slate-600 border border-slate-100 dark:border-white/10 rounded-xl w-fit shadow-sm">
                                                         <Navigation className="w-3 h-3 text-brand-500 rotate-45" />
                                                         <span className="text-[9px] font-black text-slate-500 dark:text-slate-200 uppercase tracking-widest">{log.latitude}, {log.longitude}</span>
                                                     </div>
                                                 </td>
                                                 <td className="px-6 py-6">
                                                     <div className="flex items-center gap-2">
                                                         <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                                                         <span className="text-sm font-black text-red-600 tracking-tighter">+{log.distance_meters}m</span>
                                                     </div>
                                                 </td>
                                                 <td className="px-10 py-6">
                                                     <div className="flex justify-end">
                                                         <span className="px-4 py-1.5 bg-red-50 text-red-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-red-100">Access Denied</span>
                                                     </div>
                                                 </td>
                                             </tr>
                                         ))}
                                     </tbody>
                                 </table>
                             </div>
                        </div>
                    )}

                    {activeTab === 'master' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-right-4 duration-500">
                             <div className="bg-white dark:bg-slate-500 p-12 rounded-[40px] border border-slate-100 dark:border-white/10 shadow-sm space-y-10 transition-colors">
        <div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight uppercase italic underline decoration-brand-500 decoration-4 underline-offset-8">Neural Unlock</h2>
            <p className="text-[10px] font-bold text-slate-400 mt-6 leading-relaxed uppercase tracking-widest italic">Generate a 24-hour cryptographic token for student self-validation bypass. Use with extreme caution.</p>
        </div>
                                <div className="space-y-6">
                                    <div className="p-10 bg-slate-50 rounded-[32px] border border-slate-100 text-center relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 to-transparent"></div>
                                        {masterCode ? (
                                            <div className="relative z-10 animate-in zoom-in duration-300">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Current Master Flow</p>
                                                <h4 className="text-6xl font-black text-slate-900 tracking-[0.4em] mb-2 font-primary">{masterCode}</h4>
                                                <p className="text-[9px] font-bold text-brand-500 bg-brand-50 py-1 px-4 rounded-full w-fit mx-auto uppercase tracking-widest">Valid until Midnight</p>
                                            </div>
                                        ) : (
                                            <div className="relative z-10 py-10">
                                                <Zap className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">System Idle • Waiting for Command</p>
                                            </div>
                                        )}
                                    </div>
                                    <button 
                                        onClick={generateCode}
                                        className="w-full py-5 bg-brand-500 text-white rounded-[24px] text-xs font-black uppercase tracking-[0.2em] shadow-2xl shadow-brand-500/40 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                                    >
                                        <Crosshair className="w-5 h-5" /> Initialize Token Generation
                                    </button>
                                </div>
                             </div>

                             <div className="bg-slate-900 p-12 rounded-[40px] text-white flex flex-col justify-between relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-brand-500/10 to-transparent"></div>
                                <div className="relative z-10">
                                    <ShieldAlert className="w-12 h-12 text-brand-400 mb-8" />
                                    <h3 className="text-xl font-black tracking-tight uppercase mb-6 italic underline decoration-white/20 underline-offset-8">Access Protocols</h3>
                                    <div className="space-y-6">
                                        {[
                                            'Token bypasses Geofencing validation layer',
                                            'All usage is logged against Admin Identity',
                                            'Token expires automatically at 23:59:59',
                                            'Manual invalidation resets all active sessions'
                                        ].map((rule, i) => (
                                            <div key={i} className="flex gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all">
                                                <div className="w-2 h-2 bg-brand-500 rounded-full mt-1.5 shrink-0 animate-pulse"></div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 leading-relaxed italic">{rule}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="relative z-10 mt-12 pt-8 border-t border-white/5 flex items-center justify-between">
                                    <div className="flex items-center gap-3 text-emerald-400">
                                        <CheckCircle2 className="w-5 h-5" />
                                        <span className="text-[9px] font-black uppercase tracking-[0.2em]">Compliance Engine Green</span>
                                    </div>
                                </div>
                             </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default AttendanceModule;

