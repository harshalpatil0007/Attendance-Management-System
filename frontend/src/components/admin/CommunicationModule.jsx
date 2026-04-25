import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/apiConfig';
import {
    Megaphone, MessageSquare, Mail, Bell, 
    Send, History, Search, Filter, Trash2, 
    Smartphone, Globe, Plus, Clock, User,
    ShieldAlert, CheckCircle2, ChevronRight, Zap,
    Paperclip, Image as ImageIcon, Link as LinkIcon, X, Loader2
} from 'lucide-react';

const CommunicationModule = () => {
    const [activeTab, setActiveTab] = useState('broadcast'); // broadcast, history, channels, ticker
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [broadcastForm, setBroadcastForm] = useState({
        title: '',
        content: '',
        priority: 'general',
        target_role: 'student',
        target_dept: 'all',
        target_year: 'all',
        target_div: 'all',
        attachments: []
    });
    const [uploading, setUploading] = useState(false);
    const [linkInput, setLinkInput] = useState('');
    const [showLinkInput, setShowLinkInput] = useState(false);

    useEffect(() => {
        if (activeTab === 'history') {
            fetchHistory();
        }
    }, [activeTab]);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('attendease_token');
            const res = await axios.get(`${API_BASE_URL}/announcements/admin/notifications` , {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(res.data);
        } catch (error) {
            console.error('Error fetching admin notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setUploading(true);
        try {
            const token = localStorage.getItem('attendease_token');
            const res = await axios.post(`${API_BASE_URL}/announcements/upload`, formData, {
                headers: { 
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}` 
                }
            });
            setBroadcastForm(prev => ({
                ...prev,
                attachments: [...prev.attachments, { type: file.type.startsWith('image/') ? 'image' : 'file', name: file.name, url: res.data.url }]
            }));
        } catch (err) {
            console.error('Upload failed:', err);
            alert('Failed to upload file');
        } finally {
            setUploading(false);
        }
    };

    const addLink = () => {
        if (!linkInput) return;
        const formattedLink = linkInput.startsWith('http') ? linkInput : `https://${linkInput}`;
        setBroadcastForm(prev => ({
            ...prev,
            attachments: [...prev.attachments, { type: 'link', name: linkInput, url: formattedLink }]
        }));
        setLinkInput('');
        setShowLinkInput(false);
    };

    const removeAttachment = (index) => {
        setBroadcastForm(prev => ({
            ...prev,
            attachments: prev.attachments.filter((_, i) => i !== index)
        }));
    };

    const handleSendBroadcast = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('attendease_token');
            await axios.post(`${API_BASE_URL}/announcements/broadcast` , broadcastForm, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBroadcastForm({ 
                title: '', 
                content: '', 
                priority: 'general', 
                target_role: 'student', 
                target_dept: 'all', 
                target_year: 'all', 
                target_div: 'all', 
                attachments: [] 
            });
            alert('Broadcast initiated successfully!');
        } catch (err) {
            console.error('Broadcast failed:', err);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3 italic">
                        <Megaphone className="w-8 h-8 text-brand-500" />
                        COMMUNICATION HUB
                    </h1>
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest leading-relaxed">
                        Multichannel Broadcasts • Institutional Alerts • Automated Notification Protocols
                    </p>
                </div>
                
                <div className="flex bg-white dark:bg-slate-900 p-2 rounded-[28px] border border-slate-100 dark:border-white/10 shadow-sm overflow-x-auto no-scrollbar transition-colors">
                    {[
                        { id: 'broadcast', label: 'New Broadcast', icon: Plus },
                        { id: 'history', label: 'History', icon: History },
                        { id: 'channels', label: 'SMS/WA Dash', icon: Smartphone },
                        { id: 'ticker', label: 'News Ticker', icon: Zap }
                    ].map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === tab.id ? 'bg-brand-500 text-white shadow-xl shadow-brand-500/20' : 'text-slate-400 dark:text-slate-400 hover:bg-slate-50'}`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {activeTab === 'broadcast' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-left-4 duration-500">
                    <div className="bg-white dark:bg-slate-900 p-12 rounded-[40px] border border-slate-100 dark:border-white/10 shadow-sm space-y-10 transition-colors">
                        <div>
                             <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight uppercase italic underline decoration-brand-500 decoration-4 underline-offset-8">Compose Intelligence</h2>
                             <p className="text-[10px] font-bold text-slate-400 dark:text-slate-400 mt-6 uppercase tracking-widest italic">Target specific cohorts across institutional communication channels.</p>
                        </div>

                        <form onSubmit={handleSendBroadcast} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Subject Heading</label>
                                <input 
                                    type="text" 
                                    value={broadcastForm.title}
                                    onChange={(e) => setBroadcastForm({...broadcastForm, title: e.target.value})}
                                    className="w-full px-8 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 ring-brand-500" 
                                    placeholder="Enter circular title..."
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Full Content / Narrative</label>
                                <textarea 
                                    rows="5"
                                    value={broadcastForm.content}
                                    onChange={(e) => setBroadcastForm({...broadcastForm, content: e.target.value})}
                                    className="w-full px-8 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-3xl text-xs font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 ring-brand-500 resize-none" 
                                    placeholder="Draft your announcement here..."
                                    required
                                />
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Cohort Targeting</label>
                                <div className="flex gap-4">
                                    <button 
                                        type="button"
                                        onClick={() => document.getElementById('file-upload').click()}
                                        className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800 text-slate-500 rounded-xl text-[10px] font-black uppercase hover:bg-slate-100 transition-all border border-slate-100 dark:border-white/5"
                                    >
                                        <Paperclip className="w-3 h-3" /> Add File
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => document.getElementById('image-upload').click()}
                                        className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800 text-slate-500 rounded-xl text-[10px] font-black uppercase hover:bg-slate-100 transition-all border border-slate-100 dark:border-white/5"
                                    >
                                        <ImageIcon className="w-3 h-3" /> Add Image
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => setShowLinkInput(!showLinkInput)}
                                        className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800 text-slate-500 rounded-xl text-[10px] font-black uppercase hover:bg-slate-100 transition-all border border-slate-100 dark:border-white/5"
                                    >
                                        <LinkIcon className="w-3 h-3" /> Add Link
                                    </button>

                                    <input type="file" id="file-upload" className="hidden" onChange={handleFileUpload} />
                                    <input type="file" id="image-upload" accept="image/*" className="hidden" onChange={handleFileUpload} />
                                </div>

                                {showLinkInput && (
                                    <div className="flex gap-2 animate-in slide-in-from-top-2">
                                        <input 
                                            type="text" 
                                            value={linkInput}
                                            onChange={(e) => setLinkInput(e.target.value)}
                                            placeholder="Paste URL here..."
                                            className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-[10px] font-bold outline-none focus:ring-1 ring-brand-500"
                                        />
                                        <button 
                                            type="button"
                                            onClick={addLink}
                                            className="px-4 py-2 bg-brand-500 text-white rounded-xl text-[10px] font-black"
                                        >
                                            Add
                                        </button>
                                    </div>
                                )}

                                {broadcastForm.attachments.length > 0 && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                                        {broadcastForm.attachments.map((at, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-white/5">
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    {at.type === 'image' ? <ImageIcon className="w-4 h-4 text-emerald-500" /> : at.type === 'link' ? <LinkIcon className="w-4 h-4 text-blue-500" /> : <Paperclip className="w-4 h-4 text-slate-400" />}
                                                    <span className="text-[9px] font-bold text-slate-600 dark:text-slate-300 truncate max-w-[120px]">{at.name}</span>
                                                </div>
                                                <button 
                                                    type="button"
                                                    onClick={() => removeAttachment(idx)}
                                                    className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-all"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {uploading && (
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 animate-pulse mt-2">
                                        <Loader2 className="w-3 h-3 animate-spin" /> Uploading media...
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Cohort Role</label>
                                        <select 
                                            value={broadcastForm.target_role}
                                            onChange={(e) => setBroadcastForm({...broadcastForm, target_role: e.target.value})}
                                            className="w-full px-8 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 outline-none focus:ring-2 ring-brand-500 transition-all font-mono"
                                        >
                                            <option value="student">Students Only</option>
                                            <option value="teacher">Faculty Only</option>
                                            <option value="all">Global (Students & Faculty)</option>
                                        </select>
                                    </div>

                                    {(broadcastForm.target_role === 'student' || broadcastForm.target_role === 'teacher') && (
                                        <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Department Cluster</label>
                                                <select 
                                                    value={broadcastForm.target_dept}
                                                    onChange={(e) => setBroadcastForm({...broadcastForm, target_dept: e.target.value})}
                                                    className="w-full px-8 py-3 bg-slate-50/50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 outline-none focus:ring-1 ring-brand-500 transition-all"
                                                >
                                                    <option value="all">All Departments</option>
                                                    <option value="Computer Engineering">Computer Engineering</option>
                                                    <option value="Information Technology">Information Technology</option>
                                                    <option value="Electronics & Telecommunications Engg.">E&TC</option>
                                                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                                                    <option value="Civil Engineering">Civil Engineering</option>
                                                    <option value="Electrical Engineering">Electrical Engineering</option>
                                                    <option value="Chemical Engineering">Chemical Engineering</option>
                                                    <option value="First Year Engineering">First Year</option>
                                                </select>
                                            </div>

                                            {broadcastForm.target_role === 'student' && (
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Academic Year</label>
                                                        <select 
                                                            value={broadcastForm.target_year}
                                                            onChange={(e) => setBroadcastForm({...broadcastForm, target_year: e.target.value})}
                                                            className="w-full px-8 py-3 bg-slate-50/50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 outline-none focus:ring-1 ring-brand-500 transition-all"
                                                        >
                                                            <option value="all">All Years</option>
                                                            <option value="FE">First Year (FE)</option>
                                                            <option value="SE">Second Year (SE)</option>
                                                            <option value="TE">Third Year (TE)</option>
                                                            <option value="BE">Final Year (BE)</option>
                                                        </select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Division</label>
                                                        <select 
                                                            value={broadcastForm.target_div}
                                                            onChange={(e) => setBroadcastForm({...broadcastForm, target_div: e.target.value})}
                                                            className="w-full px-8 py-3 bg-slate-50/50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 outline-none focus:ring-1 ring-brand-500 transition-all"
                                                        >
                                                            <option value="all">All Divisions</option>
                                                            <option value="A">Division A</option>
                                                            <option value="B">Division B</option>
                                                            <option value="C">Division C</option>
                                                            <option value="D">Division D</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    
                                    {broadcastForm.target_role === 'all' && (
                                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest pl-2 mt-2 italic animate-pulse">Global broadcasts encompass all departments and cohorts (Excl. Admins).</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Priority Protocol</label>
                                    <select 
                                        value={broadcastForm.priority}
                                        onChange={(e) => setBroadcastForm({...broadcastForm, priority: e.target.value})}
                                        className="w-full px-8 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 outline-none focus:ring-2 ring-brand-500"
                                    >
                                        <option value="general">Standard Information</option>
                                        <option value="high">High Priority</option>
                                        <option value="critical">Critical / Emergency</option>
                                    </select>
                                </div>
                            </div>

                            <button className="w-full py-5 bg-brand-500 text-white rounded-3xl text-xs font-black uppercase tracking-[0.2em] shadow-2xl shadow-brand-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3">
                                <Send className="w-5 h-5" /> Execute Broadcast Flow
                            </button>
                        </form>
                    </div>

                    <div className="space-y-8">
                         <div className="bg-slate-900 p-10 rounded-[40px] text-white relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:scale-125 transition-transform duration-1000"></div>
                            <div className="relative z-10">
                                <div className="p-3 bg-white/5 border border-white/10 rounded-2xl w-fit mb-8">
                                    <Globe className="w-6 h-6 text-brand-400" />
                                </div>
                                <h3 className="text-xl font-black tracking-tight uppercase mb-4 italic">Channel Reach</h3>
                                <div className="space-y-6">
                                    {[
                                        { label: 'Cloud Notification', status: 'Active', color: 'emerald' },
                                        { label: 'Institutional Email', status: 'Verified', color: 'emerald' },
                                        { label: 'SMS Gateway', status: 'Standby', color: 'amber' },
                                        { label: 'WhatsApp API', status: 'Encrypted', color: 'emerald' }
                                    ].map((c, i) => (
                                        <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 italic">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">{c.label}</span>
                                            <span className={`text-[8px] font-black uppercase px-2 py-1 rounded bg-${c.color}-500/20 text-${c.color}-400 border border-${c.color}-500/30`}>{c.status}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                         </div>

                         <div className="bg-white dark:bg-slate-900 p-10 rounded-[40px] border border-slate-100 dark:border-white/10 shadow-sm flex flex-col justify-center items-center text-center space-y-4 transition-colors">
                             <div className="w-16 h-16 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center border border-red-100">
                                <ShieldAlert className="w-8 h-8" />
                             </div>
                             <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">Protocol Override</h4>
                             <p className="text-[9px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-[0.2em] leading-relaxed italic px-8">Critical alerts bypass all do-not-disturb student configurations and trigger audio override on mobile devices.</p>
                         </div>
                    </div>
                </div>
            )}

            {activeTab === 'history' && (
                <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-white/10 shadow-sm overflow-hidden animate-in fade-in duration-500 transition-colors">
                    <div className="p-10 border-b border-slate-50 flex items-center justify-between">
                        <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-[0.2em] italic">Cohort Targeting Notifications</h2>
                        <div className="flex gap-2">
                             <button className="p-3 bg-slate-50 text-slate-400 dark:text-slate-400 rounded-xl hover:bg-slate-100 transition-all border border-slate-100">
                                <Search className="w-4 h-4" />
                             </button>
                        </div>
                    </div>
                    {loading ? (
                        <div className="p-20 text-center animate-pulse">Scanning Transmission History...</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/50">
                                    <tr>
                                        <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-400">TRANSMISSION ID / TITLE</th>
                                        <th className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-400">TARGET COHORT</th>
                                        <th className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-400">PRIORITY</th>
                                        <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-400 text-right">METRICS</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {notifications.map((n, i) => (
                                        <tr key={i} className="group hover:bg-slate-50/30 transition-all border-l-4 border-transparent hover:border-brand-500">
                                            <td className="px-10 py-8">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-[10px] italic text-slate-400 dark:text-slate-400">#{n.id}</div>
                                                    <div>
                                                        <p className="text-sm font-black text-slate-800 dark:text-white uppercase italic leading-none">{n.title}</p>
                                                        <p className="text-[9px] font-bold text-slate-400 dark:text-slate-400 uppercase mt-1.5 tracking-widest">{new Date(n.sent_at).toLocaleString()}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-8">
                                                <div className="flex flex-col gap-2">
                                                    <span className="px-3 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/10 rounded-lg text-[9px] font-black uppercase text-slate-400 dark:text-slate-300 tracking-widest w-fit">
                                                        {n.target_role} • {n.target_dept || 'ALL'}
                                                    </span>
                                                    {n.attachments && (typeof n.attachments === 'string' ? JSON.parse(n.attachments) : n.attachments).length > 0 && (
                                                        <div className="flex items-center gap-1.5 text-[8px] font-black text-brand-500 uppercase tracking-widest pl-1">
                                                            <Paperclip className="w-2.5 h-2.5" /> {(typeof n.attachments === 'string' ? JSON.parse(n.attachments) : n.attachments).length} MEDIA
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-8">
                                                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${n.priority === 'critical' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-slate-50 text-slate-600 border-slate-100'}`}>
                                                    {n.priority}
                                                </span>
                                            </td>
                                            <td className="px-10 py-8 text-right">
                                                <div className="flex justify-end gap-4">
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-sm font-black text-slate-800 dark:text-white">84%</span>
                                                        <span className="text-[8px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-tighter">Read Rate</span>
                                                    </div>
                                                    <button className="p-3 text-slate-300 hover:text-slate-800 dark:text-white transition-all">
                                                        <ChevronRight className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'channels' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in zoom-in-95 duration-500">
                     {[
                         { icon: Smartphone, label: 'SMS Gateway', provider: 'Twilio Enterprise', balance: '$240.50', status: 'Online' },
                         { icon: MessageSquare, label: 'WhatsApp Business', provider: 'Meta Cloud API', balance: '1,240 pkts', status: 'Online' },
                         { icon: Mail, label: 'Email Automation', provider: 'SendGrid Pro', balance: 'Unlimited', status: 'Online' }
                     ].map((channel, i) => (
                        <div key={i} className="bg-white dark:bg-slate-900 p-10 rounded-[40px] border border-slate-100 dark:border-white/10 shadow-sm space-y-8 group hover:border-brand-500/30 transition-all transition-colors">
                            <div className="flex items-center justify-between">
                                <div className="p-4 bg-slate-50 group-hover:bg-brand-50 group-hover:text-brand-500 text-slate-400 dark:text-slate-400 rounded-2xl transition-all">
                                    <channel.icon className="w-6 h-6" />
                                </div>
                                <span className="text-[8px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div> {channel.status}
                                </span>
                            </div>
                            <div>
                                <h3 className="text-base font-black text-slate-800 dark:text-white uppercase italic tracking-tight">{channel.label}</h3>
                                <p className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest mt-1">{channel.provider}</p>
                            </div>
                            <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest">Available Flux</span>
                                    <span className="text-sm font-black text-slate-800 dark:text-white">{channel.balance}</span>
                                </div>
                                <button className="p-2.5 bg-slate-50 text-slate-400 dark:text-slate-400 rounded-xl hover:bg-brand-500 hover:text-white transition-all">
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                     ))}
                </div>
            )}

            {activeTab === 'ticker' && (
                <div className="bg-white dark:bg-slate-900 p-16 rounded-[40px] border border-slate-100 dark:border-white/10 shadow-sm text-center flex flex-col items-center justify-center animate-in slide-in-from-right-4 duration-500 transition-colors">
                    <Zap className="w-16 h-16 text-brand-500 mb-8 animate-pulse" />
                    <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-[0.3em] mb-4 italic">Neural News Ticker</h2>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-[0.2em] max-w-lg leading-relaxed italic mb-10">Deploy real-time, scrolling marquee updates across all student dashboards. Ideal for exam reminders and event countdowns.</p>
                    <div className="w-full max-w-xl space-y-6">
                        <textarea 
                            className="w-full px-8 py-5 bg-slate-50 border-none rounded-3xl text-xs font-black uppercase tracking-widest text-slate-600 outline-none focus:ring-2 ring-brand-500"
                            placeholder="Enter scrolling text..."
                            value="ISE-1 Marks Entry Portal will close on Friday (23rd April) at 05:00 PM. Please verify all submissions."
                        />
                        <div className="flex gap-4">
                            <button className="flex-1 py-5 bg-slate-900 text-white rounded-3xl text-[10px] font-black uppercase tracking-[0.3em] shadow-xl shadow-slate-900/20">
                                Deploy Ticker
                            </button>
                            <button className="px-10 py-5 bg-white border-2 border-slate-100 text-slate-400 dark:text-slate-400 rounded-3xl text-[10px] font-black uppercase tracking-[0.3em]">
                                Kill Static
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CommunicationModule;
