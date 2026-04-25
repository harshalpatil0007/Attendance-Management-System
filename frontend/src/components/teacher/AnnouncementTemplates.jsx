import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/apiConfig';
import {
    ChevronLeft, Plus, Search, FileText, 
    MoreHorizontal, Edit2, Trash2, 
    Copy, CheckCircle2, Star, Clock, Megaphone
} from 'lucide-react';

const AnnouncementTemplates = ({ onBack, onUseTemplate }) => {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('attendease_token');
            const res = await axios.get(`${API_BASE_URL}/announcements/teacher/templates`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTemplates(res.data);
        } catch (error) {
            console.error('Error fetching templates:', error);
            // Fallback mock templates if API fails or is empty
            setTemplates([
                { id: 1, template_name: 'Attendance Warning Template', usage_count: 12, content: 'Dear Parent of {{Student Name}}, Your ward\'s attendance is {{Percentage}}%...' },
                { id: 2, template_name: 'ISE Marks Published', usage_count: 8, content: 'Dear Students, ISE-{{Num}} marks for {{Subject}} have been published. Check portal.' },
                { id: 3, template_name: 'Class Cancellation', usage_count: 5, content: 'Due to {{Reason}}, today\'s lecture for {{Subject}} stands cancelled. Next class on {{Date}}.' },
                { id: 4, template_name: 'Extra Class Announcement', usage_count: 15, content: 'An extra class for {{Subject}} is scheduled at {{Time}} on {{Date}} at {{Venue}}.' }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const systemTemplates = [
        { id: 'sys1', template_name: 'Holiday Notice', template_type: 'Administrative', reach: 'All Students' },
        { id: 'sys2', template_name: 'Exam Schedule Announcement', template_type: 'Examination', reach: 'Department-wide' },
        { id: 'sys3', template_name: 'Fee Payment Reminder', template_type: 'Accounts', reach: 'Pending Defaulters' },
        { id: 'sys4', template_name: 'College Event Invitation', template_type: 'General', reach: 'Open to All' }
    ];

    const filteredTemplates = templates.filter(t => 
        t.template_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={onBack}
                        className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-slate-600 hover:border-slate-200 transition-all shrink-0"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3 uppercase">
                            TEMPLATES
                        </h1>
                        <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5 sm:mt-1">
                            Pre-configured patterns for faster workflow
                        </p>
                    </div>
                </div>
                <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-brand-500 text-white rounded-[20px] text-[10px] font-black uppercase tracking-widest shadow-xl shadow-brand-500/20 hover:scale-105 active:scale-95 transition-all">
                    <Plus className="w-4 h-4" />
                    New Template
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* My Templates Section */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-4">
                        <Search className="w-4 h-4 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Filter your saved templates..."
                            className="bg-transparent border-none text-xs font-bold text-slate-800 focus:ring-0 w-full"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        {loading ? (
                            Array(4).fill(0).map((_, i) => (
                                <div key={i} className="h-40 bg-white rounded-[32px] border border-slate-50 animate-pulse"></div>
                            ))
                        ) : filteredTemplates.length === 0 ? (
                            <div className="col-span-full py-16 sm:py-20 bg-white rounded-[40px] border border-dashed border-slate-200 text-center px-6">
                                <FileText className="w-10 h-10 text-slate-100 mx-auto mb-4" />
                                <p className="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">No custom templates found.<br/>Standardize your workflows now.</p>
                            </div>
                        ) : (
                            filteredTemplates.map((template) => (
                                <div key={template.id} className="bg-white p-5 sm:p-6 rounded-[24px] sm:rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                                     <div className="absolute top-0 right-0 w-12 h-12 sm:w-16 sm:h-16 bg-brand-50 rounded-full -mr-6 -mt-6 sm:-mr-8 sm:-mt-8 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="flex justify-between items-start mb-4 relative z-10">
                                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-50 rounded-lg sm:rounded-xl flex items-center justify-center text-slate-400 group-hover:text-brand-500 group-hover:bg-brand-50 transition-colors">
                                            <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                                        </div>
                                        <div className="flex items-center gap-1.5 sm:gap-2">
                                            <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-300 fill-amber-300" />
                                            <span className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest">{template.usage_count} uses</span>
                                        </div>
                                    </div>
                                    
                                    <h3 className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-tight mb-2 group-hover:text-brand-500 transition-colors truncate">
                                        {template.template_name || template.name}
                                    </h3>
                                    <p className="text-[9px] sm:text-[10px] text-slate-500 line-clamp-2 mb-4 sm:mb-6 font-medium leading-relaxed italic">
                                        "{template.content.substring(0, 80)}..."
                                    </p>

                                    <div className="flex items-center gap-2 relative z-10">
                                        <button 
                                            onClick={() => onUseTemplate(template)}
                                            className="flex-1 px-3 sm:px-4 py-2.5 bg-slate-900 text-white rounded-lg sm:rounded-xl text-[8px] sm:text-[9px] font-black uppercase tracking-widest hover:bg-brand-500 shadow-lg shadow-slate-900/10 transition-all flex items-center justify-center gap-2"
                                        >
                                            <Megaphone className="w-3 h-3" /> Use
                                        </button>
                                        <button className="p-2 sm:p-2.5 border border-slate-50 rounded-lg sm:rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all">
                                            <Edit2 className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                                        </button>
                                        <button className="p-2 sm:p-2.5 border border-slate-50 rounded-lg sm:rounded-xl text-slate-400 hover:text-red-500 hover:border-red-50 transition-all">
                                            <Trash2 className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* System Blueprints */}
                <div className="space-y-6">
                    <div className="bg-slate-900 p-8 rounded-[40px] text-white overflow-hidden relative group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform"></div>
                        <h3 className="text-xs font-black text-brand-400 uppercase tracking-widest mb-8 flex items-center gap-3">
                            <CheckCircle2 className="w-4 h-4" />
                            COLLEGE BLUEPRINTS
                        </h3>
                        
                        <div className="space-y-4">
                            {systemTemplates.map((sys) => (
                                <div key={sys.id} className="p-5 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all group/item cursor-pointer">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-[8px] font-black text-brand-400 uppercase tracking-wider bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/20">{sys.template_type}</span>
                                        <Copy className="w-3.5 h-3.5 text-slate-600 group-hover/item:text-white transition-colors" />
                                    </div>
                                    <h4 className="text-xs font-black uppercase tracking-tight text-slate-300 group-hover/item:text-white transition-colors">{sys.template_name}</h4>
                                    <p className="text-[9px] font-bold text-slate-500 mt-1 uppercase tracking-widest">Reach: {sys.reach}</p>
                                </div>
                            ))}
                        </div>

                        <div className="mt-10 pt-8 border-t border-white/5 text-center">
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-relaxed">
                                System templates are curated by SSBT<br/>Administrations to ensure consistency.
                            </p>
                        </div>
                    </div>

                    {/* Pro Tip */}
                    <div className="bg-indigo-50 p-6 rounded-[32px] border border-indigo-100 flex gap-4">
                        <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-indigo-500 flex-shrink-0 shadow-sm">
                            <Clock className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-indigo-900 uppercase tracking-widest">Smart Variable Mapping</p>
                            <p className="text-[9px] font-bold text-indigo-600/80 leading-relaxed mt-1 italic">
                                Use tags like &#123;&#123;StudentName&#125;&#125; or &#123;&#123;Subject&#125;&#125; to automatically inject personalized data during broadcast.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnnouncementTemplates;
