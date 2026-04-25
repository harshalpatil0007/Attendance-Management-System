import { useState, useEffect } from 'react';
import { 
    CheckCircle, XCircle, Eye, Download, Search, 
    Filter, FileText, CheckCircle2, AlertCircle, Clock,
    ShieldCheck, ExternalLink, Trash2, User, Building,
    Calendar, History, Square, CheckSquare, Award
} from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/apiConfig';

const CertificatesModule = () => {
    const [certificates, setCertificates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('pending'); // pending, verified
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDept, setFilterDept] = useState('all');

    useEffect(() => {
        fetchCertificates();
    }, [viewMode]);

    const fetchCertificates = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('attendease_token');
            const res = await axios.get(`${API_BASE_URL}/admin/certificates` , {
                params: { status: viewMode },
                headers: { Authorization: `Bearer ${token}` }
            });
            setCertificates(res.data);
        } catch (err) {
            console.error('Failed to fetch certificates:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id, status) => {
        try {
            const token = localStorage.getItem('attendease_token');
            await axios.put(`${API_BASE_URL}/admin/certificates/${id}/status`, 
                { status },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setCertificates(certificates.filter(c => c.id !== id));
        } catch (err) {
            console.error('Certificate update failed:', err);
        }
    };

    const filtered = (certificates || []).filter(c => 
        (c.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
         c.student_prn?.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (filterDept === 'all' || c.department === filterDept)
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3 italic">
                        <Award className="w-8 h-8 text-brand-500" />
                        CREDENTIAL ENGINE
                    </h1>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
                        Curricular Validation • Skill Verification • Professional Audit Trail
                    </p>
                </div>
                
                <div className="flex bg-white dark:bg-slate-900 p-2 rounded-[28px] border border-slate-100 dark:border-white/10 shadow-sm transition-colors">
                    <button 
                        onClick={() => setViewMode('pending')}
                        className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${viewMode === 'pending' ? 'bg-brand-500 text-white shadow-xl shadow-brand-500/20' : 'text-slate-400 hover:bg-slate-50'}`}
                    >
                        <Clock className="w-4 h-4" />
                        Pending Review ({certificates.length})
                    </button>
                    <button 
                        onClick={() => setViewMode('verified')}
                        className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${viewMode === 'verified' ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/20' : 'text-slate-400 hover:bg-slate-50'}`}
                    >
                        <History className="w-4 h-4" />
                        Verified Data
                    </button>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-100 dark:border-white/10 shadow-sm flex flex-wrap items-center justify-between gap-6 transition-colors">
                <div className="flex flex-wrap items-center gap-4 flex-1">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Search by PRN or Student Name..."
                            className="w-full pl-12 pr-6 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-200 outline-none focus:ring-2 ring-brand-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select 
                        value={filterDept}
                        onChange={(e) => setFilterDept(e.target.value)}
                        className="px-6 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-200 outline-none focus:ring-2 ring-brand-500"
                    >
                        <option value="all">All Departments</option>
                        <option>Computer Science</option>
                        <option>Mechanical</option>
                        <option>Electronics</option>
                    </select>
                </div>
                <div className="flex items-center gap-3">
                    <button className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-400 rounded-2xl hover:bg-slate-100 transition-all">
                        <Filter className="w-5 h-5" />
                    </button>
                    <button className="flex items-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-900/20">
                        <Download className="w-4 h-4" /> Export Report
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="p-20 flex flex-col items-center justify-center">
                    <div className="w-12 h-12 border-4 border-slate-100 border-t-brand-500 rounded-full animate-spin"></div>
                    <p className="mt-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Hydrating Archives...</p>
                </div>
            ) : filtered.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 py-32 rounded-[40px] border border-dashed border-slate-200 dark:border-white/10 flex flex-col items-center justify-center transition-colors">
                    <Award className="w-20 h-20 text-slate-100 mb-6" />
                    <h3 className="font-black text-slate-300 uppercase tracking-widest">Registry is Empty</h3>
                    <p className="text-[9px] font-bold text-slate-300 mt-2 uppercase tracking-[0.2em] italic">No certificates found matching your current parameters</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filtered.map((cert) => (
                        <div key={cert.id} className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-white/10 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden flex flex-col h-full transition-colors">
                            {cert.status === 'verified' && (
                                <div className="absolute top-0 right-0 p-8">
                                    <ShieldCheck className="w-12 h-12 text-emerald-500/10" />
                                </div>
                            )}

                            <div className="flex items-center justify-between mb-8">
                                <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border italic ${cert.status === 'verified' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                    {cert.status === 'verified' ? 'System Validated' : 'Awaiting Review'}
                                </div>
                                <span className="text-[9px] font-black text-slate-400 tracking-[0.2em]">{cert.certificate_type || 'SKILLSET'}</span>
                            </div>

                            <div className="flex items-start gap-4 mb-8">
                                <div className="w-14 h-14 bg-slate-900 text-white rounded-[20px] flex items-center justify-center shrink-0 shadow-lg shadow-slate-900/10 group-hover:rotate-6 transition-transform">
                                    <FileText className="w-6 h-6 text-brand-400" />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-lg font-black text-slate-800 dark:text-white tracking-tight leading-tight uppercase italic truncate">{cert.title || 'Advanced Workshop'}</h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 truncate">{cert.organization || 'External Provider'}</p>
                                </div>
                            </div>

                            <div className="p-6 bg-slate-50/50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-white/10 space-y-4 mb-8 flex-1 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center">
                                        <User className="w-4 h-4 text-slate-400" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Candidate</p>
                                        <p className="text-xs font-black text-slate-700 truncate">{cert.student_name}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center">
                                        <Calendar className="w-4 h-4 text-slate-400" />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Issue Date</p>
                                        <p className="text-xs font-black text-slate-700">{new Date(cert.issue_date).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">PRN Ident</span>
                                    <span className="text-[9px] font-black text-brand-500 font-mono">{cert.student_prn}</span>
                                </div>
                            </div>

                            {viewMode === 'pending' ? (
                                <div className="grid grid-cols-2 gap-4">
                                    <button 
                                        onClick={() => handleAction(cert.id, 'verified')}
                                        className="py-4 bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle2 className="w-4 h-4" /> Approve
                                    </button>
                                    <button 
                                        onClick={() => handleAction(cert.id, 'rejected')}
                                        className="py-4 bg-white border-2 border-slate-100 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-red-500 hover:text-red-500 hover:bg-red-50 transition-all active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        <Trash2 className="w-4 h-4" /> Reject
                                    </button>
                                    <button className="col-span-2 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-900/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2">
                                        <Eye className="w-4 h-4 text-brand-400" /> Preview Evidence
                                    </button>
                                </div>
                            ) : (
                                <button className="w-full py-4 bg-slate-50 border-2 border-slate-100 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-500 hover:text-white hover:border-brand-500 transition-all flex items-center justify-center gap-2 group/btn">
                                    <ExternalLink className="w-4 h-4 group-hover/btn:-translate-y-0.5 group-hover/btn:translate-x-0.5 transition-transform" /> 
                                    View Verified Audit
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Bottom Insight */}
            <div className="bg-slate-900 dark:bg-slate-950 p-12 rounded-[40px] text-white flex flex-col lg:flex-row items-center justify-between relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-brand-600/10 to-transparent"></div>
                <div className="relative z-10 space-y-2 text-center lg:text-left">
                    <h3 className="text-xl font-black italic uppercase tracking-widest">Placement Readiness Score</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest max-w-md leading-relaxed">Each verified certificate contributes to the student's institutional rank and placement eligibility profile.</p>
                </div>
                <div className="relative z-10 flex gap-10 mt-8 lg:mt-0">
                    <div className="text-center">
                        <p className="text-3xl font-black tracking-tighter text-brand-400">842</p>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1 italic">Verified Skills</p>
                    </div>
                    <div className="text-center">
                        <p className="text-3xl font-black tracking-tighter text-emerald-400">12</p>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1 italic">Pending Audit</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CertificatesModule;

