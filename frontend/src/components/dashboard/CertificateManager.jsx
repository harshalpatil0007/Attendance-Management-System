import React, { useState } from 'react';
import { Upload, FileText, Download, Trash2, Share2, Plus, X, Loader2, Calendar, Building } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL, BASE_URL } from '../../config/apiConfig';

const CertificateManager = ({ certificates, studentId, refreshData }) => {
  const [showUpload, setShowUpload] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: 'Technical',
    issuing_org: '',
    issue_date: '',
    certificate: null
  });

  const [loadingId, setLoadingId] = useState(null);

  const handleDownload = (cert) => {
    if (cert.file_url) {
      window.open(`${BASE_URL}${cert.file_url}`, '_blank');
    } else {
      alert("Certificate file not found.");
    }
  };

  const handleShare = async (cert) => {
    const fileUrl = `${BASE_URL}${cert.file_url}`;
    const fileName = cert.file_url.split('/').pop();

    try {
      if (navigator.share && navigator.canShare) {
        setLoadingId(cert.id);
        const response = await fetch(fileUrl);
        const blob = await response.blob();
        const file = new File([blob], fileName, { type: blob.type });

        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: cert.title,
            text: `Check out my ${cert.title} certificate from ${cert.issuing_org}!`
          });
          setLoadingId(null);
          return;
        }
      }
      
      if (navigator.share) {
        await navigator.share({
          title: cert.title,
          text: `Check out my ${cert.title} certificate from ${cert.issuing_org}!`,
          url: fileUrl
        });
      } else {
        await navigator.clipboard.writeText(fileUrl);
        alert("Link copied to clipboard!");
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error("Share failed", err);
        await navigator.clipboard.writeText(fileUrl);
        alert("Sharing failed. Link copied to clipboard instead.");
      }
    } finally {
      setLoadingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this certificate?")) return;
    
    setLoadingId(id);
    try {
      await axios.delete(`${API_BASE_URL}/student/certificates/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('attendease_token')}` }
      });
      refreshData();
    } catch (error) {
       console.error(error);
       alert("Delete failed");
    } finally {
      setLoadingId(null);
    }
  };

  const categories = ['Technical', 'Non-Technical', 'Internships', 'Publications', 'MOOCs'];

  const handleUpload = async (e) => {
    e.preventDefault();
    setIsUploading(true);
    
    const data = new FormData();
    data.append('student_id', studentId);
    data.append('title', formData.title);
    data.append('category', formData.category);
    data.append('issuing_org', formData.issuing_org);
    data.append('issue_date', formData.issue_date);
    data.append('certificate', formData.certificate);

    try {
      await axios.post(`${API_BASE_URL}/student/certificates/upload` , data, {
        headers: { 
          Authorization: `Bearer ${localStorage.getItem('attendease_token')}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      alert("Certificate uploaded successfully!");
      setShowUpload(false);
      refreshData();
    } catch (error) {
      console.error(error);
      alert("Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
           <h2 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight transition-colors">Certificate Repository</h2>
           <p className="text-slate-500 dark:text-slate-200 text-sm transition-colors">Upload and manage your academic & skill achievements</p>
        </div>
        <button 
          onClick={() => setShowUpload(true)}
          className="w-full sm:w-auto px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-2xl font-bold shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2 transition-all active:scale-95"
        >
           <Plus className="w-5 h-5" /> Upload New
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {certificates.map((cert) => (
          <div key={cert.id} className="bg-white dark:bg-slate-500 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
             <div className="h-40 bg-slate-100 dark:bg-slate-600 flex items-center justify-center relative overflow-hidden transition-colors">
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all duration-300 flex items-end justify-between p-4 z-10">
                   <div className="flex gap-2">
                      <button 
                        onClick={() => handleDownload(cert)}
                        title="Download Certificate"
                        className="p-2.5 bg-white/20 backdrop-blur-md rounded-xl text-white hover:bg-white/40 active:scale-90 transition-all shadow-lg"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleShare(cert)}
                        title="Share Certificate"
                        className="p-2.5 bg-white/20 backdrop-blur-md rounded-xl text-white hover:bg-white/40 active:scale-90 transition-all shadow-lg"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                   </div>
                   <button 
                     onClick={() => handleDelete(cert.id)}
                     disabled={loadingId === cert.id}
                     title="Delete Certificate"
                     className="p-2.5 bg-red-500/30 backdrop-blur-md rounded-xl text-red-100 hover:bg-red-500/50 active:scale-90 transition-all shadow-lg disabled:opacity-50"
                   >
                     {loadingId === cert.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                   </button>
                </div>
                <FileText className="w-16 h-16 text-slate-300 group-hover:scale-110 transition-transform duration-500" />
                <span className={`absolute top-4 left-4 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm z-20 ${
                   cert.status === 'verified' ? 'bg-emerald-500 text-white' : 
                   cert.status === 'pending' ? 'bg-amber-500 text-white text-shadow' : 'bg-red-500 text-white'
                }`}>
                   {cert.status}
                </span>
             </div>
             <div className="p-6">
                <span className="text-[10px] font-black text-brand-500 uppercase tracking-widest block mb-1 opacity-70">{cert.category}</span>
                <h4 className="font-bold text-slate-800 dark:text-white line-clamp-1 mb-4 text-sm tracking-tight transition-colors">{cert.title}</h4>
                <div className="space-y-2.5">
                   <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-200 font-bold transition-colors">
                      <div className="w-6 h-6 rounded-lg bg-slate-50 dark:bg-slate-600 flex items-center justify-center border border-slate-100 dark:border-white/10 transition-colors">
                        <Building className="w-3 h-3 text-slate-400 dark:text-slate-300 transition-colors" />
                      </div>
                      <span className="truncate">{cert.issuing_org}</span>
                   </div>
                   <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-200 font-bold transition-colors">
                      <div className="w-6 h-6 rounded-lg bg-slate-50 dark:bg-slate-600 flex items-center justify-center border border-slate-100 dark:border-white/10 transition-colors">
                        <Calendar className="w-3 h-3 text-slate-400 dark:text-slate-300 transition-colors" />
                      </div>
                      Issued on {new Date(cert.issue_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                   </div>
                </div>
             </div>
          </div>
        ))}

        {certificates.length === 0 && (
          <div className="col-span-full py-20 bg-slate-50 dark:bg-slate-600 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-3xl flex flex-col items-center justify-center text-slate-400 dark:text-slate-300 transition-colors">
             <FileText className="w-12 h-12 mb-4 opacity-20" />
             <p className="font-bold uppercase tracking-widest text-xs">No certificates uploaded yet</p>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
           <div className="bg-white dark:bg-slate-500 max-w-lg w-full rounded-3xl p-8 shadow-2xl relative transition-colors">
              <button 
                onClick={() => setShowUpload(false)}
                className="absolute top-6 right-6 p-2 text-slate-400 dark:text-slate-200 hover:text-slate-600 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-400/20 transition-colors"
              >
                 <X className="w-5 h-5" />
              </button>
              
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2 transition-colors">Upload Certificate</h3>
              <p className="text-xs text-slate-400 dark:text-slate-200 font-bold uppercase tracking-widest mb-8 transition-colors">Supported: PDF, JPG, PNG (Max 5MB)</p>
              
              <form onSubmit={handleUpload} className="space-y-5">
                 <div>
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-200 uppercase tracking-widest mb-2 block transition-colors">Certificate Title</label>
                    <input 
                      required
                      type="text" 
                      placeholder="e.g. AWS Certified Developer"
                      className="w-full bg-slate-50 dark:bg-slate-600 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none transition-colors"
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                    />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="text-[10px] font-bold text-slate-500 dark:text-slate-200 uppercase tracking-widest mb-2 block transition-colors">Category</label>
                       <select 
                         className="w-full bg-slate-50 dark:bg-slate-600 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-white outline-none transition-colors"
                         onChange={(e) => setFormData({...formData, category: e.target.value})}
                       >
                         {categories.map(c => <option key={c} value={c}>{c}</option>)}
                       </select>
                    </div>
                    <div>
                       <label className="text-[10px] font-bold text-slate-500 dark:text-slate-200 uppercase tracking-widest mb-2 block transition-colors">Issue Date</label>
                       <input 
                         required
                         type="date" 
                         className="w-full bg-slate-50 dark:bg-slate-600 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-white outline-none transition-colors"
                         onChange={(e) => setFormData({...formData, issue_date: e.target.value})}
                       />
                    </div>
                 </div>
                 <div>
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-200 uppercase tracking-widest mb-2 block transition-colors">Issuing Organization</label>
                    <input 
                      required
                      type="text" 
                      placeholder="e.g. Amazon Web Services"
                      className="w-full bg-slate-50 dark:bg-slate-600 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none transition-colors"
                      onChange={(e) => setFormData({...formData, issuing_org: e.target.value})}
                    />
                 </div>
                 <div className="border-2 border-dashed border-slate-200 dark:border-white/10 rounded-3xl p-8 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-600 hover:bg-slate-100 dark:hover:bg-slate-400/10 transition-all cursor-pointer relative group">
                    <input 
                      required
                      type="file" 
                      className="absolute inset-0 opacity-0 cursor-pointer" 
                      onChange={(e) => setFormData({...formData, certificate: e.target.files[0]})}
                    />
                    <Upload className="w-8 h-8 text-slate-300 dark:text-slate-400 group-hover:text-brand-500 transition-colors mb-2" />
                    <span className="text-sm font-bold text-slate-400 dark:text-slate-300 group-hover:text-slate-600 dark:group-hover:text-white transition-colors">
                       {formData.certificate ? formData.certificate.name : 'Click to upload file'}
                    </span>
                 </div>
                 
                 <button 
                   disabled={isUploading}
                   className="w-full py-4 bg-brand-500 hover:bg-brand-600 text-white rounded-2xl font-bold shadow-xl shadow-brand-500/20 transition-all flex items-center justify-center gap-2"
                 >
                    {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Plus className="w-5 h-5" /> Submit for Verification</>}
                 </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default CertificateManager;
