import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/apiConfig';
import { 
    Megaphone, Plus, FileText, History, Search, Filter, 
    Pin, Eye, Edit2, Send, Clock, Trash2, ChevronRight,
    AlertCircle, CheckCircle2, MoreHorizontal, User,
    Users, BookOpen, Layout, Bell, Settings
} from 'lucide-react';
import AnnouncementEditor from './AnnouncementEditor';
import AnnouncementDetails from './AnnouncementDetails';
import AnnouncementTemplates from './AnnouncementTemplates';

const Announcements = ({ assignedClasses, user }) => {
    const [view, setView] = useState('list'); // 'list', 'create', 'details', 'templates'
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState(null);
    const [filterType, setFilterType] = useState('all');
    const [filterAudience, setFilterAudience] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchAnnouncements();
    }, [filterType, filterAudience]);

    const fetchAnnouncements = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('attendease_token');
            const res = await axios.get(`${API_BASE_URL}/announcements/teacher/all`, {
                headers: { Authorization: `Bearer ${token}` },
                params: { type: filterType, audience: filterAudience }
            });
            setAnnouncements(res.data);
        } catch (error) {
            console.error('Error fetching announcements:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateNew = () => {
        setSelectedId(null);
        setView('create');
    };

    const handleViewDetails = (id) => {
        setSelectedId(id);
        setView('details');
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'sent': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'scheduled': return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'draft': return 'bg-slate-50 text-slate-600 border-slate-100';
            case 'cancelled': return 'bg-red-50 text-red-600 border-red-100';
            default: return 'bg-slate-50 text-slate-600 border-slate-100';
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'urgent': return <AlertCircle className="w-3.5 h-3.5" />;
            case 'assignment': return <BookOpen className="w-3.5 h-3.5" />;
            case 'exam': return <FileText className="w-3.5 h-3.5" />;
            case 'general': return <Megaphone className="w-3.5 h-3.5" />;
            default: return <Megaphone className="w-3.5 h-3.5" />;
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this broadcast?')) return;
        try {
            const token = localStorage.getItem('attendease_token');
            await axios.delete(`${API_BASE_URL}/announcements/teacher/delete/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchAnnouncements();
        } catch (error) {
            console.error('Error deleting announcement:', error);
            alert('Failed to delete.');
        }
    };

    if (view === 'create') {
        return <AnnouncementEditor 
            onBack={() => setView('list')} 
            onSuccess={() => { setView('list'); fetchAnnouncements(); }}
            user={user}
            assignedClasses={assignedClasses}
            editId={selectedId}
        />;
    }

    if (view === 'details') {
        return <AnnouncementDetails 
            id={selectedId} 
            onBack={() => setView('list')} 
        />;
    }

    if (view === 'templates') {
        return <AnnouncementTemplates 
            onBack={() => setView('list')} 
            onUseTemplate={(template) => {
                setView('create');
            }}
        />;
    }

    const pinned = announcements.filter(a => a.is_pinned);
    const recent = announcements.filter(a => !a.is_pinned);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header / Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div className="flex-1 space-y-1">
                    <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <Megaphone className="w-6 h-6 sm:w-8 sm:h-8 text-brand-500 shrink-0" />
                        <span className="truncate">ANNOUNCEMENTS</span>
                    </h1>
                    <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest max-w-[280px] sm:max-w-none">
                        Communicate and Broadcast updates to Students & Faculty
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                    <button 
                        onClick={handleCreateNew}
                        className="flex items-center justify-center gap-2 px-6 py-3.5 bg-brand-500 text-white rounded-[20px] text-[10px] font-black uppercase tracking-widest shadow-xl shadow-brand-500/20 hover:scale-[1.02] sm:hover:scale-105 active:scale-95 transition-all w-full sm:w-auto"
                    >
                        <Plus className="w-4 h-4" />
                        Create New
                    </button>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setView('templates')}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3.5 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-white/10 rounded-[20px] text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                        >
                            <FileText className="w-4 h-4" />
                            Templates
                        </button>
                        <button className="p-3.5 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-white/10 rounded-[20px] hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex-shrink-0">
                            <History className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-[24px] sm:rounded-[32px] border border-slate-100 dark:border-white/10 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center gap-4 sm:gap-6 transition-colors">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="Search announcements..."
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-xs font-bold text-slate-800 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500 transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                    <div className="flex-1 sm:flex-none flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-xl px-3 sm:px-4 py-2 border-none transition-colors">
                        <Filter className="w-3.5 h-3.5 text-slate-400" />
                        <select 
                            className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest text-slate-600 focus:ring-0 w-full"
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                        >
                            <option value="all">TYPE: ALL</option>
                            <option value="general">GENERAL</option>
                            <option value="urgent">URGENT</option>
                            <option value="assignment">ASSIGNMENT</option>
                            <option value="exam">EXAM</option>
                        </select>
                    </div>
                    <div className="flex-1 sm:flex-none bg-slate-50 dark:bg-slate-800 rounded-xl px-3 sm:px-4 py-2 transition-colors">
                        <select 
                            className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest text-slate-600 focus:ring-0 w-full"
                            value={filterAudience}
                            onChange={(e) => setFilterAudience(e.target.value)}
                        >
                            <option value="all">AUDIENCE: ALL</option>
                            <option value="students">STUDENTS</option>
                            <option value="parents">PARENTS</option>
                            <option value="colleagues">COLLEAGUES</option>
                            <option value="hod">HOD</option>
                        </select>
                    </div>
                    <button 
                        onClick={() => { setFilterType('all'); setFilterAudience('all'); setSearchQuery(''); }}
                        className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-brand-500 transition-colors px-2"
                    >
                        Reset
                    </button>
                </div>
            </div>

            {/* pinned Section */}
            {pinned.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 px-2">
                        <Pin className="w-4 h-4 text-brand-500 fill-brand-500/20" />
                        pinned ANNOUNCEMENTS
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                        {pinned.map((ann) => (
                            <AnnouncementCard 
                                key={ann.id} 
                                ann={ann} 
                                onDetails={() => handleViewDetails(ann.id)} 
                                onDelete={() => handleDelete(ann.id)}
                                getStatusColor={getStatusColor} 
                                getTypeIcon={getTypeIcon} 
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Recent Section */}
            <div className="space-y-4">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 px-2">
                    <Clock className="w-4 h-4 text-brand-500" />
                    RECENT ANNOUNCEMENTS
                </h3>
                
                {loading ? (
                    <div className="p-20 flex flex-col items-center justify-center text-slate-300">
                        <div className="w-10 h-10 border-4 border-slate-100 border-t-brand-500 rounded-full animate-spin"></div>
                        <p className="mt-4 text-[10px] font-black uppercase tracking-widest">Loading Broadcasts...</p>
                    </div>
                ) : announcements.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 p-20 rounded-[40px] border border-dashed border-slate-200 dark:border-white/10 text-center transition-colors">
                        <Megaphone className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">No announcements found matching your criteria</p>
                        <button 
                            onClick={handleCreateNew}
                            className="mt-6 text-[10px] font-black text-brand-500 uppercase tracking-widest hover:underline"
                        >
                            + Create your first announcement
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {recent.map((ann) => (
                            <AnnouncementCard 
                                key={ann.id} 
                                ann={ann} 
                                onDetails={() => handleViewDetails(ann.id)} 
                                onDelete={() => handleDelete(ann.id)}
                                getStatusColor={getStatusColor} 
                                getTypeIcon={getTypeIcon} 
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const AnnouncementCard = ({ ann, onDetails, onDelete, getStatusColor, getTypeIcon }) => {
    return (
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-[24px] sm:rounded-[32px] border border-slate-100 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow group flex flex-col sm:flex-row items-start gap-4 sm:gap-6 transition-colors">
            <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center text-lg sm:text-xl flex-shrink-0 ${getStatusColor(ann.status)}`}>
                {getTypeIcon(ann.announcement_type)}
            </div>
            
            <div className="flex-1 min-w-0 w-full">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1">
                    <span className={`px-2 py-0.5 rounded-lg border text-[8px] font-black uppercase tracking-widest ${getStatusColor(ann.status)}`}>
                        {ann.status}
                    </span>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        {new Date(ann.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <span className="hidden sm:inline text-slate-300">•</span>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {ann.target_audience}
                    </span>
                </div>
                
                <h4 className="text-sm sm:text-base font-black text-slate-800 dark:text-white uppercase tracking-tight mb-2 truncate group-hover:text-brand-500 transition-colors">
                    {ann.is_pinned && <Pin className="w-3.5 h-3.5 inline mr-1 fill-brand-500" />}
                    {ann.title}
                </h4>
                
                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 font-medium leading-relaxed transition-colors">
                    {ann.content.replace(/<[^>]*>?/gm, '')}
                </p>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto">
                        <div className="flex items-center gap-2 flex-1 sm:flex-none">
                            <Eye className="w-4 h-4 text-slate-400 shrink-0" />
                            <div className="h-1.5 flex-1 sm:w-24 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden transition-colors">
                                <div 
                                    className="h-full bg-brand-500 rounded-full" 
                                    style={{ width: `${ann.total_recipients > 0 ? (ann.viewed_count / ann.total_recipients) * 100 : 0}%` }}
                                ></div>
                            </div>
                            <span className="text-[9px] sm:text-[10px] font-black text-slate-600 shrink-0">
                                {ann.viewed_count}/{ann.total_recipients}
                            </span>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button 
                            onClick={onDetails}
                            className="flex-1 sm:flex-none px-4 py-2 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
                        >
                            Details
                        </button>
                        {ann.status === 'draft' && (
                            <button className="p-2 bg-slate-50 dark:bg-slate-800 text-brand-500 rounded-xl hover:bg-brand-50 dark:hover:bg-brand-500/20 transition-all">
                                <Edit2 className="w-4 h-4" />
                            </button>
                        )}
                            <button 
                                onClick={onDelete}
                                className="p-2 bg-slate-50 dark:bg-slate-800 text-red-500 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/20 transition-all"
                            >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Announcements;
