import { useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/apiConfig';
import { 
    Send, Pin, ChevronDown, CheckCircle2, Megaphone, ArrowRight 
} from 'lucide-react';

const AnnouncementForm = ({ assignedClasses, onSuccess, onAdvancedClick }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        subject_id: '',
        year: '',
        division: '',
        content: '',
        is_pinned: false
    });
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.content) return;
        if (!formData.year || !formData.division) return;
        
        setLoading(true);
        try {
            const token = localStorage.getItem('attendease_token');
            const selectedClass = formData.subject_id ? assignedClasses.find(c => c.subject_id == formData.subject_id) : null;
            
            await axios.post(`${API_BASE_URL}/announcements/teacher/create` , {
                title: `Quick Update: ${selectedClass?.subject_name || 'Department Update'}`,
                content: formData.content,
                announcement_type: 'general',
                status: 'sent',
                target_audience: 'students',
                subject_id: formData.subject_id || null,
                department: selectedClass?.department || JSON.parse(localStorage.getItem('attendease_user'))?.department,
                year: selectedClass?.year || formData.year,
                division: selectedClass?.division || formData.division,
                is_pinned: formData.is_pinned
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setSent(true);
            setTimeout(() => {
                setSent(false);
                setFormData({ subject_id: '', year: '', division: '', content: '', is_pinned: false });
                if (onSuccess) onSuccess();
            }, 2000);
        } catch (error) {
            console.error('Quick send error:', error);
            alert('Failed to send announcement.');
        } finally {
            setLoading(false);
        }
    };

    if (sent) {
        return (
            <div className="h-full flex flex-col items-center justify-center animate-in zoom-in-95 p-8">
                <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-500/10 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                </div>
                <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest mb-2">Broadcast Sent!</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Notification pushed to students</p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="p-6 space-y-5 flex flex-col h-full overflow-y-auto">
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 px-1">Target Year</p>
                        <div className="relative">
                            <select 
                                className="w-full pl-4 pr-8 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-[11px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 focus:ring-2 focus:ring-brand-500 appearance-none transition-colors"
                                value={formData.year}
                                onChange={(e) => setFormData(p => ({ ...p, year: e.target.value }))}
                            >
                                <option value="">Year</option>
                                {['FE', 'SE', 'TE', 'BE'].map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                        </div>
                    </div>
                    <div>
                        <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 px-1">Section</p>
                        <div className="relative">
                            <select 
                                className="w-full pl-4 pr-8 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-[11px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 focus:ring-2 focus:ring-brand-500 appearance-none transition-colors"
                                value={formData.division}
                                onChange={(e) => setFormData(p => ({ ...p, division: e.target.value }))}
                            >
                                <option value="">Sec</option>
                                {['A', 'B', 'C'].map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                        </div>
                    </div>
                </div>

                <div>
                    <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 px-1">Announcement Content</p>
                    <textarea 
                        placeholder="Type your message here..."
                        className="w-full p-5 bg-slate-50 dark:bg-slate-900 border-none rounded-[24px] text-xs font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-brand-500 min-h-[140px] resize-none transition-colors"
                        value={formData.content}
                        onChange={(e) => setFormData(p => ({ ...p, content: e.target.value }))}
                    ></textarea>
                </div>

                <div className="flex items-center justify-between pt-2">
                    <label className="flex items-center gap-2 cursor-pointer group">
                        <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${formData.is_pinned ? 'bg-brand-500 border-brand-500' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'}`}>
                            <input 
                                type="checkbox" 
                                className="hidden"
                                checked={formData.is_pinned}
                                onChange={(e) => setFormData(p => ({ ...p, is_pinned: e.target.checked }))}
                            />
                            {formData.is_pinned && <Pin className="w-3 h-3 text-white" />}
                        </div>
                        <span className="text-[10px] font-black text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 uppercase tracking-widest transition-colors">
                            Pin Update
                        </span>
                    </label>
                    
                    <button 
                        type="submit"
                        disabled={loading || !formData.content || !formData.year || !formData.division}
                        className="flex items-center gap-2 px-6 py-3 bg-brand-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-brand-500/20 disabled:opacity-50 disabled:shadow-none hover:scale-105 active:scale-95 transition-all"
                    >
                        {loading ? 'Sending...' : <><Send className="w-4 h-4" /> Broadcast</>}
                    </button>
                </div>
            </div>

            <div className="mt-auto border-t border-slate-100 dark:border-slate-700/50 pt-4">
                <button 
                    type="button"
                    onClick={onAdvancedClick}
                    className="w-full py-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl text-[9px] font-black text-slate-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10 uppercase tracking-widest transition-all flex items-center justify-center gap-2 group"
                >
                    Open Advanced Editor <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
        </form>
    );
};

export default AnnouncementForm;
