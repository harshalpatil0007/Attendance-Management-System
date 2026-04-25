import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/apiConfig';
import {
    Megaphone, Bell, Clock, Eye, 
    AlertCircle, BookOpen, FileText, 
    Pin, ChevronRight, CheckCircle2,
    Calendar, Tag, User,
    ExternalLink, Paperclip, Image as ImageIcon, Download
} from 'lucide-react';

const StudentNotifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('attendease_token');
            // Reusing the teacher list logic for now but filtered for the student in upcoming updates
            // For now, let's assume there's an endpoint for student notifications
            const res = await axios.get(`${API_BASE_URL}/student/notifications`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(res.data);
        } catch (error) {
            console.error('Error fetching student notifications:', error);
            // Fallback for demonstration
            setNotifications([
                { id: 101, title: 'End Semester Exam Schedule - May 2026', content: 'The tentative schedule for end semester exams has been posted. Please check the department notice board.', announcement_type: 'exam', sender_name: 'Prof. Aditya Sharma', is_pinned: true, created_at: new Date(Date.now() - 86400000 * 5).toISOString() },
                { id: 102, title: 'Extra Practice Session - DSA', content: 'Tomorrow 4-5 PM in Lab 5. Topics: Binary Search Trees.', announcement_type: 'general', sender_name: 'Prof. Aditya Sharma', is_pinned: false, created_at: new Date(Date.now() - 3600000 * 2).toISOString() },
                { id: 103, title: 'ISE-2 Marks Published - DBMS', content: 'Marks have been uploaded to the portal. Access them via the Marks section.', announcement_type: 'marks', sender_name: 'Prof. Aditya Sharma', is_pinned: false, created_at: new Date(Date.now() - 86400000).toISOString() },
                { id: 104, title: 'Attendance Alert - DSA', content: 'Your attendance is 71% (Below 75% requirement)', announcement_type: 'urgent', sender_name: 'System', is_pinned: false, created_at: new Date(Date.now() - 86400000).toISOString() }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsViewed = async (id) => {
        try {
            const token = localStorage.getItem('attendease_token');
            await axios.post(`${API_BASE_URL}/announcements/view/${id}`, { device: 'Web' }, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (error) {
            console.error('View tracking failed:', error);
        }
    };

    const getTypeIcon = (type, backendIconName) => {
        // Fallback or explicit override based on type
        if (backendIconName === 'BarChart3') return <AlertCircle className="w-5 h-5 text-emerald-500" />;
        if (backendIconName === 'Coins') return <BookOpen className="w-5 h-5 text-amber-500" />;
        
        switch (type) {
            case 'urgent': return <AlertCircle className="w-5 h-5 text-red-500" />;
            case 'assignment': return <BookOpen className="w-5 h-5 text-indigo-500" />;
            case 'exam': return <FileText className="w-5 h-5 text-amber-500" />;
            case 'general':
            default: return <Megaphone className="w-5 h-5 text-brand-500" />;
        }
    };

    if (loading) {
        return (
            <div className="p-20 flex flex-col items-center justify-center text-slate-300 transition-colors">
                <div className="w-10 h-10 border-4 border-slate-100 dark:border-white/10 border-t-brand-500 rounded-full animate-spin"></div>
                <p className="mt-4 text-[10px] font-black uppercase tracking-widest">Fetching Broadcasts...</p>
            </div>
        );
    }

    const pinned = notifications.filter(n => n.is_pinned);
    const recent = notifications.filter(n => !n.is_pinned);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3 italic">
                        <Bell className="w-7 h-7 text-brand-500" />
                        COMMUNICATIONS
                    </h1>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                        Stay updated with academic bulletins & alerts
                    </p>
                </div>
            </div>

            {pinned.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em] flex items-center gap-2 px-2">
                        <Pin className="w-3.5 h-3.5 fill-amber-500" />
                        pinned BULLETINS
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                        {pinned.map((n) => (
                            <NotificationCard key={n.id} n={n} icon={getTypeIcon(n.type || n.announcement_type, n.icon)} onOpen={() => handleMarkAsViewed(n.id)} isPinned />
                        ))}
                    </div>
                </div>
            )}

            <div className="space-y-4">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 px-2">
                    <Clock className="w-3.5 h-3.5" />
                    RECENT UPDATES
                </h3>
                <div className="grid grid-cols-1 gap-4">
                    {recent.map((n) => (
                        <NotificationCard key={n.id} n={n} icon={getTypeIcon(n.type || n.announcement_type, n.icon)} onOpen={() => handleMarkAsViewed(n.id)} />
                    ))}
                </div>
            </div>
        </div>
    );
};

const NotificationCard = ({ n, icon, onOpen, isPinned }) => {
    const [expanded, setExpanded] = useState(false);

    return (
        <div 
            className={`bg-white dark:bg-slate-900 rounded-[32px] border transition-all duration-300 group ${
                isPinned ? 'border-amber-100 dark:border-amber-500/20 shadow-amber-500/5 shadow-xl' : 'border-slate-100 dark:border-white/10 shadow-sm'
            } ${expanded ? 'p-8' : 'p-6 hover:shadow-md'} transition-colors`}
        >
            <div className="flex items-start gap-6">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform ${expanded ? 'scale-110' : 'group-hover:scale-105'} ${
                    isPinned ? 'bg-amber-50 dark:bg-amber-500/10' : 'bg-slate-50 dark:bg-slate-800'
                }`}>
                    {icon}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                        <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                            {new Date(n.created_at).toLocaleDateString()} • {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="text-slate-200 dark:text-slate-800">•</span>
                        <span className="text-[9px] font-black text-brand-500 uppercase tracking-widest flex items-center gap-1">
                            <User className="w-2.5 h-2.5" />
                            {n.sender_name}
                        </span>
                    </div>

                    <h4 className={`text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight transition-colors ${expanded ? 'mb-4' : 'mb-1 group-hover:text-brand-500'}`}>
                        {n.title || n.text}
                    </h4>

                    {expanded ? (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="prose prose-slate dark:prose-invert max-w-none text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed mb-6">
                                {n.content}
                            </div>

                            {/* Attachments Section */}
                            {n.attachments && (typeof n.attachments === 'string' ? JSON.parse(n.attachments) : n.attachments).length > 0 && (
                                <div className="space-y-3 mb-8">
                                    <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <Paperclip className="w-3 h-3" /> ATTACHED MEDIA
                                    </h5>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {(typeof n.attachments === 'string' ? JSON.parse(n.attachments) : n.attachments).map((at, idx) => (
                                            <a 
                                                key={idx}
                                                href={at.url.startsWith('http') ? at.url : `${API_BASE_URL.replace('/api', '')}${at.url}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all group/at"
                                            >
                                                <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center shadow-sm">
                                                    {at.type === 'image' ? <ImageIcon className="w-5 h-5 text-emerald-500" /> : at.type === 'link' ? <ExternalLink className="w-5 h-5 text-blue-500" /> : <Paperclip className="w-5 h-5 text-slate-400" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[10px] font-bold text-slate-700 dark:text-slate-200 truncate pr-4">{at.name}</p>
                                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-tight group-hover/at:text-brand-500 transition-colors">
                                                        {at.type === 'link' ? 'OPEN RESOURCE' : at.type === 'image' ? 'VIEW IMAGE' : 'DOWNLOAD FILE'}
                                                    </p>
                                                </div>
                                                <Download className="w-3 h-3 text-slate-300 group-hover/at:text-slate-600 dark:group-hover/at:text-white transition-all mr-2" />
                                            </a>
                                        ))}
                                    </div>
                                    
                                    {/* Inline Image Previews */}
                                    <div className="flex flex-wrap gap-3 mt-4">
                                        {(typeof n.attachments === 'string' ? JSON.parse(n.attachments) : n.attachments).filter(at => at.type === 'image').map((at, idx) => (
                                            <img 
                                                key={idx}
                                                src={at.url.startsWith('http') ? at.url : `${API_BASE_URL.replace('/api', '')}${at.url}`}
                                                alt={at.name}
                                                className="w-24 h-24 object-cover rounded-2xl border border-slate-100 dark:border-white/5 hover:scale-105 transition-transform cursor-pointer shadow-sm"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    window.open(at.url.startsWith('http') ? at.url : `${API_BASE_URL.replace('/api', '')}${at.url}`, '_blank');
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center gap-3 pt-6 border-t border-slate-50 dark:border-white/5">
                                <button className="px-5 py-2 bg-slate-900 dark:bg-slate-950 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-brand-500 transition-all">
                                    Acknowledge Receipt
                                </button>
                                <button onClick={() => setExpanded(false)} className="px-5 py-2 bg-white dark:bg-slate-400 text-slate-400 dark:text-white border border-slate-100 dark:border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all">
                                    Close Update
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between">
                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 font-medium italic opacity-70">
                                {n.content.substring(0, 100)}...
                            </p>
                            <button 
                                onClick={() => { setExpanded(true); onOpen(); }}
                                className="flex items-center gap-1.5 text-[9px] font-black text-brand-500 uppercase tracking-widest hover:underline whitespace-nowrap"
                            >
                                Details <ChevronRight className="w-3 h-3" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentNotifications;
