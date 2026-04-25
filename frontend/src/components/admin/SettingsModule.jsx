import { useState, useEffect } from 'react';
import { 
    Settings as SettingsIcon, Shield, Database, 
    Bell, Globe, HardDrive, Lock, RefreshCcw,
    Activity, Key, Smartphone, AlertTriangle, Save
} from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/apiConfig';

const SettingsModule = () => {
    const [settings, setSettings] = useState([]);
    const [auditLogs, setAuditLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('general'); // general, security, maintenance

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('attendease_token');
            const [settingsRes, auditRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/admin/settings` , {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(`${API_BASE_URL}/admin/audit-logs` , {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);
            setSettings(settingsRes.data);
            setAuditLogs(auditRes.data);
        } catch (error) {
            console.error('Error fetching settings/logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleBackup = async () => {
        try {
            const token = localStorage.getItem('attendease_token');
            await axios.post(`${API_BASE_URL}/admin/backup` , {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Database backup initiated successfully!');
        } catch (error) {
            console.error('Backup failed:', error);
        }
    };

    if (loading) return (
        <div className="p-20 flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-slate-100 border-t-brand-500 rounded-full animate-spin"></div>
            <p className="mt-4 text-[10px] font-black uppercase text-slate-400 dark:text-slate-400 tracking-widest">Accessing System Core...</p>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 dark:text-white dark:text-white tracking-tight flex items-center gap-3 transition-colors">
                        <SettingsIcon className="w-8 h-8 text-brand-500" />
                        SYSTEM CONFIGURATION
                    </h1>
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-400 dark:text-slate-200 uppercase tracking-widest mt-1 transition-colors">
                        Control Institutional Thresholds & Security Governance
                    </p>
                </div>
                <div className="flex bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-100 dark:border-white/10 shadow-sm transition-colors">
                    <button 
                        onClick={() => setActiveTab('general')}
                        className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'general' ? 'bg-brand-500 text-white shadow-lg' : 'text-slate-400 dark:text-slate-400 hover:bg-slate-50'}`}
                    >
                        General
                    </button>
                    <button 
                        onClick={() => setActiveTab('security')}
                        className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'security' ? 'bg-brand-500 text-white shadow-lg' : 'text-slate-400 dark:text-slate-400 hover:bg-slate-50'}`}
                    >
                        Security & Logs
                    </button>
                    <button 
                        onClick={() => setActiveTab('maintenance')}
                        className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'maintenance' ? 'bg-brand-500 text-white shadow-lg' : 'text-slate-400 dark:text-slate-400 hover:bg-slate-50'}`}
                    >
                        Maintenance
                    </button>
                </div>
            </div>

            {activeTab === 'general' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-white/10 shadow-sm space-y-6 transition-colors">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-sm font-black text-slate-800 dark:text-white dark:text-white uppercase tracking-widest flex items-center gap-3 transition-colors">
                                <Activity className="w-5 h-5 text-brand-500" /> Academic Rules
                            </h3>
                            <button className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all">
                                <Save className="w-3 h-3" /> Save Changes
                            </button>
                        </div>

                        <div className="space-y-6">
                            {settings.map((s, i) => (
                                <div key={i} className="group p-6 bg-slate-50 hover:bg-slate-100/50 rounded-3xl transition-all border border-transparent hover:border-slate-200">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-800 dark:text-white dark:text-white uppercase tracking-widest mb-1 transition-colors">{s.setting_key.replace(/_/g, ' ')}</p>
                                            <p className="text-[9px] font-bold text-slate-400 dark:text-slate-400 dark:text-slate-200 italic transition-colors">Governs institutional compliance baseline.</p>
                                        </div>
                                        <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-2 rounded-2xl shadow-sm border border-slate-100 dark:border-white/10 transition-colors">
                                            <input 
                                                type="text" 
                                                defaultValue={s.setting_value} 
                                                className="w-16 bg-transparent border-none text-center font-black text-brand-600 focus:ring-0 text-sm"
                                            />
                                            <span className="text-[10px] font-black text-slate-300">/ UNIT</span>
                                        </div>
                                    </div>
                                    <div className="mt-4 w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                                        <div className="h-full bg-brand-500 rounded-full" style={{width: '60%'}}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div className="bg-slate-900 p-8 rounded-[40px] text-white relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
                            <h3 className="text-sm font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-3">
                                <Globe className="w-5 h-5 text-brand-400" /> API GATEWAY STATUS
                            </h3>
                            <div className="space-y-4 relative z-10">
                                {[
                                    { name: 'WhatsApp API', status: 'Online', color: 'emerald' },
                                    { name: 'SMS Gateway', status: 'Latent', color: 'amber' },
                                    { name: 'Email SMTP', status: 'Online', color: 'emerald' },
                                    { name: 'Firebase Cloud', status: 'Active', color: 'blue' }
                                ].map((api, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all">
                                        <p className="text-[10px] font-black uppercase tracking-widest">{api.name}</p>
                                        <div className="flex items-center gap-2">
                                            <div className={`w-1.5 h-1.5 rounded-full bg-${api.color}-500 animate-pulse`}></div>
                                            <span className={`text-[9px] font-black uppercase tracking-widest text-${api.color}-400`}>{api.status}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-white/10 shadow-sm text-center transition-colors">
                            <Lock className="w-12 h-12 text-slate-100 dark:text-slate-200/20 mx-auto mb-4 transition-colors" />
                            <h3 className="text-sm font-black text-slate-800 dark:text-white dark:text-white uppercase tracking-widest mb-2 italic underline decoration-brand-500 decoration-4 underline-offset-4 transition-colors">Role Permissions</h3>
                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-400 dark:text-slate-200 leading-relaxed max-w-[200px] mx-auto italic mb-6 transition-colors">Assign and audit module access for HODs, Coordinators, and Clerks.</p>
                            <button className="px-8 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-slate-900/20">
                                Define New Access Role
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'security' && (
                <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-white/10 shadow-sm overflow-hidden animate-in fade-in zoom-in-95 duration-300 transition-colors">
                    <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                        <div>
                            <h2 className="text-sm font-black text-slate-800 dark:text-white dark:text-white uppercase tracking-widest transition-colors">Audit Logs</h2>
                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-400 dark:text-slate-200 mt-1 italic tracking-widest uppercase transition-colors">Comprehensive Administrative Action History</p>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={fetchData} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all border border-slate-100">
                                <RefreshCcw className="w-4 h-4 text-slate-400 dark:text-slate-400" />
                            </button>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-400">Timestamp</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-400">Admin</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-400">Action</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-400">Description</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-400">IP ADDRESS</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {auditLogs.map((log, i) => (
                                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-8 py-5 font-black text-[10px] text-slate-500 tracking-tighter">
                                            {new Date(log.created_at).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-lg bg-brand-500 flex items-center justify-center text-[10px] text-white font-black">{log.admin_name?.charAt(0)}</div>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-800 dark:text-white dark:text-white transition-colors">{log.admin_name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="px-2 py-1 bg-brand-50 text-brand-600 text-[10px] font-black rounded uppercase border border-brand-100">{log.action}</span>
                                        </td>
                                        <td className="px-6 py-5 text-xs font-bold text-slate-600 dark:text-slate-300 transition-colors">{log.description}</td>
                                        <td className="px-6 py-5 font-black text-[9px] text-slate-400 dark:text-slate-400 tracking-widest">{log.ip_address}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'maintenance' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-white/10 shadow-sm text-center group transition-colors">
                        <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500">
                            <Database className="w-10 h-10 text-indigo-500" />
                        </div>
                        <h3 className="text-sm font-black text-slate-800 dark:text-white dark:text-white uppercase tracking-widest mb-2 transition-colors">DB BACKUP</h3>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-400 dark:text-slate-200 italic mb-8 transition-colors">Snapshot all academic years and system settings to cloud storage.</p>
                        <button 
                            onClick={handleBackup}
                            className="w-full py-4 bg-indigo-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-indigo-500/20"
                        >
                            Trigger Manual Backup
                        </button>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-white/10 shadow-sm text-center group transition-colors">
                        <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-500">
                            <RefreshCcw className="w-10 h-10 text-emerald-500" />
                        </div>
                        <h3 className="text-sm font-black text-slate-800 dark:text-white dark:text-white uppercase tracking-widest mb-2 transition-colors">Archive Sessions</h3>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-400 dark:text-slate-200 italic mb-8 transition-colors">Move old attendance logs to cold storage to improve performance.</p>
                        <button className="w-full py-4 bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-emerald-500/20">
                            Start Archive Process
                        </button>
                    </div>

                    <div className="bg-red-500 p-8 rounded-[40px] text-white text-center group shadow-xl shadow-red-500/20">
                        <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                            <AlertTriangle className="w-10 h-10 text-white" />
                        </div>
                        <h3 className="text-sm font-black uppercase tracking-widest mb-2">SYSTEM WIPE</h3>
                        <p className="text-[10px] text-red-50 font-bold italic mb-8">Danger Zone: Reset institutional parameters for new academic year.</p>
                        <button className="w-full py-4 bg-white text-red-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all border border-red-500 mb-2">
                            Initialize New Year
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SettingsModule;
