import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/apiConfig';
import {
    FileBadge, CheckCircle, XCircle, 
    Eye, Download, Calendar, User,
    ExternalLink, Search, Clock
} from 'lucide-react';

const CertificateVerification = () => {
    const [certificates, setCertificates] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchCertificates();
    }, []);

    const fetchCertificates = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('attendease_token');
            const res = await axios.get(`${API_BASE_URL}/student/certificates/all` , { // I'll assume an endpoint for this
                headers: { Authorization: `Bearer ${token}` }
            });
            // Filter only pending for verification
            setCertificates(res.data.filter(c => c.status === 'pending') || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleVerification = async (certId, status) => {
        try {
            const token = localStorage.getItem('attendease_token');
            await axios.put(`${API_BASE_URL}/student/certificates/verify/${certId}`, { status }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchCertificates();
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center">
                <div className="space-y-2">
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <FileBadge className="text-brand-500 w-8 h-8" /> Certificate Verification
                    </h2>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Review and approve student achievements</p>
                </div>
                <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                    <button className="px-6 py-2.5 bg-white rounded-xl shadow-sm text-xs font-black uppercase tracking-widest text-brand-600">Pending ({certificates.length})</button>
                    <button className="px-6 py-2.5 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-800 transition-all">Verified</button>
                    <button className="px-6 py-2.5 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-800 transition-all">Rejected</button>
                </div>
            </div>

            {certificates.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {certificates.map(cert => (
                        <div key={cert.id} className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all">
                            <div className="flex items-start justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-brand-50 rounded-2xl flex items-center justify-center text-2xl shadow-inner">📜</div>
                                    <div>
                                        <h3 className="font-black text-slate-800 text-lg uppercase leading-tight">{cert.title}</h3>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{cert.category} • {cert.issuing_org}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => window.open(cert.file_url, '_blank')} className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center hover:bg-slate-100 hover:text-slate-800 transition-all border border-slate-100">
                                        <ExternalLink className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="bg-slate-50 rounded-2xl p-4 flex items-center justify-between mb-8 border border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-xs">👤</div>
                                    <span className="text-xs font-black text-slate-700 uppercase tracking-tight">{cert.student_name || 'Student Name'}</span>
                                </div>
                                <span className="text-[9px] font-black text-slate-400 flex items-center gap-1 uppercase tracking-widest">
                                    <Clock className="w-3 h-3" /> {new Date(cert.issue_date || Date.now()).toLocaleDateString()}
                                </span>
                            </div>

                            <div className="flex gap-4">
                                <button 
                                    onClick={() => handleVerification(cert.id, 'verified')}
                                    className="flex-1 py-4 bg-green-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-green-500/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                                >
                                    <CheckCircle className="w-4 h-4" /> Approve
                                </button>
                                <button 
                                    onClick={() => handleVerification(cert.id, 'rejected')}
                                    className="flex-1 py-4 bg-white border-2 border-red-100 text-red-500 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-red-50 hover:border-red-200 transition-all flex items-center justify-center gap-2"
                                >
                                    <XCircle className="w-4 h-4" /> Reject
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white p-32 rounded-[60px] border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 text-center">
                    <div className="w-24 h-24 bg-slate-50 rounded-[40px] flex items-center justify-center mb-8">
                        <CheckCircle className="w-10 h-10 text-slate-200" />
                    </div>
                    <p className="font-black uppercase tracking-widest text-sm italic">All caught up!</p>
                    <p className="text-[10px] font-bold text-slate-300 mt-2">No certificates are currently pending verification</p>
                </div>
            )}
        </div>
    );
};

export default CertificateVerification;
