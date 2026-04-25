import { useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/apiConfig';
import {
    Megaphone, X, Send, ArrowRight, 
    Pin, Bell, ChevronDown, CheckCircle2 
} from 'lucide-react';

const QuickAnnouncement = ({ assignedClasses, onSuccess, setActiveTab }) => {
    const [isOpen, setIsOpen] = useState(false);
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
                setIsOpen(false);
                setFormData({ subject_id: '', content: '', is_pinned: false });
                if (onSuccess) onSuccess();
            }, 2000);
        } catch (error) {
            console.error('Quick send error:', error);
            alert('Failed to send. Use the advanced editor.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) {
        return (
            <button 
                onClick={() => setIsOpen(true)}
                className="fixed bottom-8 right-8 w-16 h-16 bg-brand-500 text-white rounded-2xl shadow-2xl shadow-brand-500/40 hover:scale-110 active:scale-95 transition-all flex items-center justify-center z-[60] group overflow-hidden"
            >
                <div className="absolute inset-0 bg-white/20 scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
                <Megaphone className="w-7 h-7 relative z-10" />
            </button>
        );
    }

    return (
        <div className="fixed bottom-28 right-8 w-80 bg-white rounded-[32px] shadow-2xl border border-slate-100 overflow-hidden z-[60] animate-in slide-in-from-bottom-5 duration-300">
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <Megaphone className="w-5 h-5 text-brand-400" />
                    <span className="text-xs font-black uppercase tracking-widest tracking-tighter">Quick Update</span>
                </div>
                <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                    <X className="w-4 h-4" />
                </button>
            </div>

            <div className="p-6">
                {sent ? (
                    <div className="py-8 flex flex-col items-center justify-center animate-in zoom-in-95">
                        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                        </div>
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Broadcast Sent!</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div>
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">Target Year</p>
                                        <div className="relative">
                                            <select 
                                                className="w-full pl-4 pr-8 py-3 bg-slate-50 border-none rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 focus:ring-2 focus:ring-brand-500 appearance-none"
                                                value={formData.year}
                                                onChange={(e) => setFormData(p => ({ ...p, year: e.target.value }))}
                                            >
                                                <option value="">Select Year</option>
                                                {['FE', 'SE', 'TE', 'BE'].map(y => <option key={y} value={y}>{y}</option>)}
                                            </select>
                                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">Target Section</p>
                                        <div className="relative">
                                            <select 
                                                className="w-full pl-4 pr-8 py-3 bg-slate-50 border-none rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 focus:ring-2 focus:ring-brand-500 appearance-none"
                                                value={formData.division}
                                                onChange={(e) => setFormData(p => ({ ...p, division: e.target.value }))}
                                            >
                                                <option value="">Select Section</option>
                                                {['A', 'B', 'C'].map(d => <option key={d} value={d}>{d}</option>)}
                                            </select>
                                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>
                        </div>

                        <div>
                            <textarea 
                                placeholder="What's the update? Be concise..."
                                className="w-full p-4 bg-slate-50 border-none rounded-2xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-brand-500 min-h-[100px] resize-none"
                                value={formData.content}
                                onChange={(e) => setFormData(p => ({ ...p, content: e.target.value }))}
                            ></textarea>
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    className="w-4 h-4 rounded border-slate-200 text-brand-500 focus:ring-brand-500"
                                    checked={formData.is_pinned}
                                    onChange={(e) => setFormData(p => ({ ...p, is_pinned: e.target.checked }))}
                                />
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                    <Pin className="w-3 h-3" /> Pin this
                                </span>
                            </label>
                            
                            <button 
                                type="submit"
                                disabled={loading || !formData.content || !formData.year || !formData.division}
                                className="flex items-center gap-2 px-5 py-2.5 bg-brand-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-brand-500/20 disabled:opacity-50 disabled:shadow-none hover:scale-105 active:scale-95 transition-all"
                            >
                                {loading ? 'Sending...' : <><Send className="w-3.5 h-3.5" /> Send Now</>}
                            </button>
                        </div>

                        <button 
                            type="button"
                            onClick={() => {
                                setIsOpen(false);
                                setActiveTab?.('announcements');
                            }}
                            className="w-full py-3 text-[8px] font-black text-slate-400 hover:text-brand-500 uppercase tracking-widest border-t border-slate-50 mt-2 transition-colors flex items-center justify-center gap-1 group"
                        >
                            Advanced Broadcast Engine <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default QuickAnnouncement;
