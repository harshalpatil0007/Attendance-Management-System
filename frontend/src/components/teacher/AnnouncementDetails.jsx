import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/apiConfig';
import {
    ChevronLeft, Send, Edit2, Trash2, Copy, 
    MoreHorizontal, CheckCircle2, Eye, Mail, 
    MessageSquare, Smartphone, Clock, Pin,
    User, Users, ArrowRight, Activity, BarChart3,
    Bell
} from 'lucide-react';

const AnnouncementDetails = ({ id, onBack }) => {
    const [announcement, setAnnouncement] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDetails();
    }, [id]);

    const fetchDetails = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('attendease_token');
            const res = await axios.get(`${API_BASE_URL}/announcements/teacher/details/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAnnouncement(res.data);
        } catch (error) {
            console.error('Error fetching announcement details:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this broadcast? This will remove it for all recipients.')) return;
        
        try {
            const token = localStorage.getItem('attendease_token');
            await axios.delete(`${API_BASE_URL}/announcements/teacher/delete/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            onBack();
        } catch (error) {
            console.error('Error deleting announcement:', error);
            alert('Failed to delete. Please try again.');
        }
    };

    if (loading) {
        return (
            <div className="p-20 flex flex-col items-center justify-center text-slate-300">
                <div className="w-10 h-10 border-4 border-slate-100 border-t-brand-500 rounded-full animate-spin"></div>
                <p className="mt-4 text-[10px] font-black uppercase tracking-widest">Compiling Analytics...</p>
            </div>
        );
    }

    if (!announcement) return <div className="text-center p-20 text-slate-400 font-bold uppercase tracking-widest text-xs">Broadcast not found.</div>;

    const reachPercent = announcement.total_recipients > 0 ? (announcement.viewed_count / announcement.total_recipients) * 100 : 0;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
            {/* Navigation & Title */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div className="flex items-start gap-4">
                    <button 
                        onClick={onBack}
                        className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-slate-600 hover:border-slate-200 transition-all shrink-0"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="text-[10px] font-black text-brand-500 uppercase tracking-widest bg-brand-50 px-2 py-0.5 rounded-lg border border-brand-100">
                                {announcement.announcement_type}
                            </span>
                            <span className="hidden sm:inline text-slate-300">•</span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {new Date(announcement.sent_at || announcement.created_at).toLocaleDateString()}
                            </span>
                        </div>
                        <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight uppercase leading-tight sm:leading-normal">
                            {announcement.title}
                        </h1>
                    </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 w-full lg:w-auto">
                    <button className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 sm:px-5 py-3 bg-white text-slate-600 border border-slate-100 rounded-[20px] text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all">
                        <Edit2 className="w-4 h-4" />
                        <span className="md:inline">Edit</span>
                    </button>
                    <button className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 sm:px-5 py-3 bg-white text-slate-600 border border-slate-100 rounded-[20px] text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all">
                        <Copy className="w-4 h-4" />
                        <span className="md:inline">Duplicate</span>
                    </button>
                    <button 
                        onClick={handleDelete}
                        className="p-3 bg-white text-red-500 border border-red-50 rounded-[20px] hover:bg-red-50 transition-all"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Content Side */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Message Body */}
                    <div className="bg-white p-6 sm:p-10 rounded-[32px] sm:rounded-[40px] border border-slate-100 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-slate-50 rounded-full -mr-12 -mt-12 sm:-mr-16 sm:-mt-16 opacity-50"></div>
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 sm:mb-8 border-b border-slate-50 pb-4">
                            Message Content
                        </h3>
                        <div 
                            className="prose prose-slate max-w-none text-slate-700 font-medium text-sm sm:text-base leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: announcement.content }}
                        />
                        
                        {announcement.attachments && announcement.attachments.length > 0 && (
                            <div className="mt-8 sm:mt-10 pt-6 sm:pt-8 border-t border-slate-50">
                                <h4 className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                                    Attachments ({announcement.attachments.length})
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {announcement.attachments.map((file, i) => (
                                        <div key={i} className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-100 group cursor-pointer hover:border-brand-200 transition-all">
                                            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-brand-500 shadow-sm">
                                                <Activity className="w-4 h-4" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[9px] sm:text-[10px] font-black text-slate-800 uppercase truncate">{file.name || 'document.pdf'}</p>
                                                <p className="text-[7px] sm:text-[8px] font-bold text-slate-400 uppercase tracking-widest">{file.size || '2.4 MB'}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Recipient Tracking Table */}
                    <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden transition-all">
                        <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-3">
                                <Users className="w-4 h-4 text-brand-500" />
                                DELIVERY STATISTICS & RECIPIENTS
                            </h3>
                            <button className="text-[10px] font-black text-brand-500 uppercase tracking-widest hover:underline">
                                [Export Log]
                            </button>
                        </div>
                        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
                            <div className="min-w-[800px] lg:min-w-full">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/50 text-[8px] font-black text-slate-400 uppercase tracking-widest">
                                            <th className="px-8 py-5">Recipient</th>
                                            <th className="px-8 py-5">Roll No</th>
                                            <th className="px-8 py-5 text-center">In-App</th>
                                            <th className="px-8 py-5 text-center">Email</th>
                                            <th className="px-8 py-5">Viewed At</th>
                                            <th className="px-8 py-5">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {(announcement.recipients || []).map((rec, i) => (
                                            <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500 uppercase shadow-inner">
                                                            {rec.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="text-[11px] font-black text-slate-800 uppercase leading-none">{rec.name}</p>
                                                            <p className="text-[9px] text-slate-400 font-bold tracking-wider mt-1">{rec.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <span className="text-[10px] font-black text-slate-600">#{rec.roll_number || 'NA'}</span>
                                                </td>
                                                <td className="px-8 py-5 text-center">
                                                    <CheckCircle2 className={`w-4 h-4 mx-auto ${rec.delivered_in_app ? 'text-emerald-500' : 'text-slate-200'}`} />
                                                </td>
                                                <td className="px-8 py-5 text-center">
                                                    <Mail className={`w-4 h-4 mx-auto ${rec.delivered_email ? 'text-emerald-500' : 'text-slate-200'}`} />
                                                </td>
                                                <td className="px-8 py-5">
                                                    {rec.viewed ? (
                                                        <div className="flex flex-col">
                                                            <span className="text-[9px] font-black text-slate-700 uppercase">{new Date(rec.viewed_at).toLocaleTimeString()}</span>
                                                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">{new Date(rec.viewed_at).toLocaleDateString()}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[10px] font-black text-slate-300 uppercase leading-none italic">Not Observed</span>
                                                    )}
                                                </td>
                                                <td className="px-8 py-5">
                                                    <button className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:bg-slate-100 transition-all opacity-0 group-hover:opacity-100">
                                                        <Send className="w-3.5 h-3.5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Stats */}
                <div className="space-y-6">
                    {/* Delivery Summary */}
                    <div className="bg-white p-6 sm:p-8 rounded-[32px] sm:rounded-[40px] border border-slate-100 shadow-sm">
                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-6 sm:mb-8 flex items-center gap-3">
                            <BarChart3 className="w-4 h-4 text-brand-500" />
                            REACH SUMMARY
                        </h3>
                        
                        <div className="space-y-8 sm:space-y-10">
                            <div>
                                <div className="flex justify-between items-end mb-4">
                                    <div>
                                        <p className="text-3xl sm:text-4xl font-black text-slate-800 tracking-tighter">{Math.round(reachPercent)}%</p>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Total Reach Volume</p>
                                    </div>
                                    <Eye className="w-8 h-8 sm:w-10 sm:h-10 text-slate-50" />
                                </div>
                                <div className="h-3 sm:h-4 w-full bg-slate-50 rounded-full overflow-hidden p-1 shadow-inner">
                                    <div 
                                        className="h-full bg-gradient-to-r from-brand-500 to-indigo-500 rounded-full shadow-lg transition-all duration-1000" 
                                        style={{ width: `${reachPercent}%` }}
                                    ></div>
                                </div>
                                <div className="flex justify-between mt-3 px-1">
                                    <span className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest">{announcement.viewed_count} Viewed</span>
                                    <span className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest">{announcement.total_recipients - announcement.viewed_count} Pending</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                <div className="p-3 sm:p-4 bg-slate-50 rounded-2xl sm:rounded-3xl border border-slate-100 text-center sm:text-left">
                                    <p className="text-lg sm:text-xl font-black text-slate-800 tracking-tight leading-none">{announcement.total_recipients}</p>
                                    <p className="text-[7px] sm:text-[8px] font-black text-slate-400 uppercase tracking-widest mt-2 leading-none">Total Peers</p>
                                </div>
                                <div className="p-3 sm:p-4 bg-emerald-50 rounded-2xl sm:rounded-3xl border border-emerald-100 text-center sm:text-left">
                                    <p className="text-lg sm:text-xl font-black text-emerald-600 tracking-tight leading-none">{announcement.delivered_count || announcement.total_recipients}</p>
                                    <p className="text-[7px] sm:text-[8px] font-black text-emerald-600/60 uppercase tracking-widest mt-2 leading-none">Delivered</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 sm:mt-10 pt-6 sm:pt-8 border-t border-slate-50 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500">
                                        <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    </div>
                                    <span className="text-[9px] sm:text-[10px] font-black text-slate-600 uppercase tracking-widest">In-App</span>
                                </div>
                                <span className="text-[10px] font-black text-slate-800">100%</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
                                        <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    </div>
                                    <span className="text-[9px] sm:text-[10px] font-black text-slate-600 uppercase tracking-widest">Email</span>
                                </div>
                                <span className="text-[10px] font-black text-slate-800">94%</span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats / Info */}
                    <div className="bg-slate-900 p-8 rounded-[40px] text-white overflow-hidden relative group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform"></div>
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Broadcast Intel</h4>
                        <div className="space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="w-1.5 h-1.5 bg-brand-500 rounded-full mt-1.5 shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Target Segment</p>
                                    <p className="text-xs font-bold mt-0.5">{announcement.department} - {announcement.year} {announcement.division}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1.5 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Creator Hub</p>
                                    <p className="text-xs font-bold mt-0.5">Faculty Node #AX729</p>
                                </div>
                            </div>
                        </div>
                        <button className="w-full mt-10 py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
                            Send Broadcast Reminder
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnnouncementDetails;
