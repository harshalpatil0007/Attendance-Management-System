import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API_BASE_URL, BASE_URL } from '../../config/apiConfig';
import { 
  User, Mail, Phone, Shield, Edit3, 
  Save, X, Lock, CheckCircle, MapPin, 
  Briefcase, Calendar, Droplets, Book,
  Users, ChevronRight, Loader2, Camera,
  Image as ImageIcon, Video, Trash2, RefreshCw, Plus
} from 'lucide-react';

const TeacherProfile = ({ subjects: assignedSubjects, onProfileUpdate }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editSection, setEditSection] = useState(null); // 'personal', 'address', 'account'
  
  // Photo states
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);

  // Form states
  const [formData, setFormData] = useState({});
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });

  // Expertise state
  const [expertise, setExpertise] = useState({ subjects: [], labs: [], skills: [] });
  const [masterData, setMasterData] = useState({ subjects: [], labs: [] });
  const [isExpertiseModalOpen, setIsExpertiseModalOpen] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchExpertise();
  }, []);

  const fetchExpertise = async () => {
    try {
      const token = localStorage.getItem('attendease_token');
      const [expRes, masterRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/teacher/expertise`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_BASE_URL}/teacher/expertise/master-data`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setExpertise(expRes.data);
      setMasterData(masterRes.data);
    } catch (error) {
      console.error("Expertise fetch error:", error);
    }
  };

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('attendease_token');
      const res = await axios.get(`${API_BASE_URL}/teacher/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(res.data);
      setFormData(res.data);
    } catch (error) {
      console.error("Profile fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Photo logic
  const openCamera = async () => {
    setShowPhotoOptions(false);
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      alert("Could not access camera");
      setShowCamera(false);
    }
  };

  const closeCamera = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
    canvas.toBlob((blob) => {
      const file = new File([blob], "captured-photo.jpg", { type: "image/jpeg" });
      uploadProfileImage(file);
    }, 'image/jpeg');
    closeCamera();
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) uploadProfileImage(file);
    setShowPhotoOptions(false);
  };

  const uploadProfileImage = async (file) => {
    const data = new FormData();
    data.append('profile_image', file);
    setSaving(true);
    try {
      const token = localStorage.getItem('attendease_token');
      await axios.post(`${API_BASE_URL}/teacher/profile-image`, data, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      await fetchProfile();
      if (onProfileUpdate) await onProfileUpdate();
    } catch (error) {
      alert("Failed to upload image.");
    } finally {
      setSaving(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!window.confirm("Remove profile picture?")) return;
    setSaving(true);
    try {
      const token = localStorage.getItem('attendease_token');
      await axios.delete(`${API_BASE_URL}/teacher/profile-image`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchProfile();
      if (onProfileUpdate) await onProfileUpdate();
      setShowPhotoOptions(false);
    } catch (error) {
      alert("Failed to remove image.");
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async (section) => {
    setSaving(true);
    try {
      const token = localStorage.getItem('attendease_token');
      if (section === 'account') {
        if (passwords.new !== passwords.confirm) {
            alert("New passwords do not match!");
            return;
        }
        await axios.put(`${API_BASE_URL}/teacher/change-password`, {
            currentPassword: passwords.current,
            newPassword: passwords.new
        }, { headers: { Authorization: `Bearer ${token}` } });
        alert("Password updated successfully!");
        setPasswords({ current: '', new: '', confirm: '' });
      } else {
        await axios.put(`${API_BASE_URL}/teacher/profile`, formData, {
            headers: { Authorization: `Bearer ${token}` }
        });
        await fetchProfile();
        if (onProfileUpdate) await onProfileUpdate();
      }
      setEditSection(null);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveExpertise = async (tempExp) => {
    setSaving(true);
    try {
      const token = localStorage.getItem('attendease_token');
      await Promise.all([
        axios.post(`${API_BASE_URL}/teacher/expertise/subjects`, { selections: tempExp.subjects }, { headers: { Authorization: `Bearer ${token}` } }),
        axios.post(`${API_BASE_URL}/teacher/expertise/labs`, { selections: tempExp.labs }, { headers: { Authorization: `Bearer ${token}` } }),
        axios.post(`${API_BASE_URL}/teacher/expertise/skills`, { skills: tempExp.skills }, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      await fetchExpertise();
      setIsExpertiseModalOpen(false);
    } catch (error) {
      alert("Failed to update expertise.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="h-96 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-brand-500" />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
      {/* Header Profile Card */}
      <div className="bg-white dark:bg-slate-900 p-10 border border-slate-100 dark:border-white/10 shadow-xl shadow-slate-200/50 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand-50 rounded-full -mr-40 -mt-40 opacity-50 group-hover:scale-110 transition-transform duration-1000"></div>
        
        <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
          <div className="relative">
            <div 
              className="w-40 h-40 bg-slate-100 rounded-[48px] overflow-hidden border-4 border-white shadow-2xl relative group/img cursor-pointer"
              onClick={() => setShowPhotoOptions(true)}
            >
                {profile.profile_image ? (
                    <img src={`${BASE_URL}${profile.profile_image}`} alt={profile.name} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-brand-500 text-white text-5xl font-black">
                        {profile.name.charAt(0)}
                    </div>
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity">
                    <Camera className="w-10 h-10 text-white" />
                </div>
                {saving && (
                    <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-20">
                        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
                    </div>
                )}
            </div>
            <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-green-500 rounded-2xl border-4 border-white flex items-center justify-center text-white shadow-lg shadow-green-500/30">
                <CheckCircle className="w-6 h-6" />
            </div>
          </div>

          <div className="flex-1 text-center md:text-left space-y-4">
            <div>
                <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight leading-tight">
                    {profile.designation ? `${profile.designation.split(' ')[0]}. ` : ''}{profile.name}
                </h1>
                <p className="text-slate-400 dark:text-slate-400 font-bold uppercase tracking-[0.2em] text-xs mt-1 transition-colors">
                    {profile.designation} • {profile.department}
                </p>
            </div>
            
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/10 rounded-xl shadow-sm transition-colors">
                    <Shield className="w-4 h-4 text-brand-500" />
                    <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">{profile.employee_id}</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/10 rounded-xl shadow-sm transition-colors">
                    <Mail className="w-4 h-4 text-brand-500" />
                    <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 lowercase">{profile.email}</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/10 rounded-xl shadow-sm transition-colors">
                    <Phone className="w-4 h-4 text-brand-500" />
                    <span className="text-[10px] font-black text-slate-700 dark:text-slate-300">{profile.mobile_number}</span>
                </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Main Details */}
        <div className="lg:col-span-2 space-y-8">
            
            {/* Personal Information */}
            <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-white/10 shadow-sm overflow-hidden transition-all hover:shadow-md">
                <div className="px-10 py-8 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-white/10 flex justify-between items-center transition-colors">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center text-white">
                            <Briefcase className="w-5 h-5" />
                        </div>
                        <h2 className="text-lg font-black text-slate-800 dark:text-white tracking-tight">Personal Information</h2>
                    </div>
                    {editSection === 'personal' ? (
                        <div className="flex gap-2">
                             <button onClick={() => setEditSection(null)} className="p-3 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-red-500 transition-colors">
                                <X className="w-5 h-5" />
                             </button>
                             <button onClick={() => handleSave('personal')} disabled={saving} className="p-3 bg-brand-500 text-white rounded-xl shadow-lg shadow-brand-500/20">
                                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                             </button>
                        </div>
                    ) : (
                        <button onClick={() => setEditSection('personal')} className="p-3 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-brand-500 transition-colors">
                            <Edit3 className="w-5 h-5" />
                        </button>
                    )}
                </div>
                <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-8">
                    {[
                        { label: 'Full Name', key: 'name', icon: User },
                        { label: 'Employee ID', key: 'employee_id', icon: Shield },
                        { label: 'Department', key: 'department', icon: Book },
                        { label: 'Designation', key: 'designation', icon: Briefcase },
                        { label: 'Date of Joining', key: 'date_of_joining', icon: Calendar, type: 'date' },
                        { label: 'Official Email', key: 'email', icon: Mail },
                        { label: 'Mobile Number', key: 'mobile_number', icon: Phone },
                        { label: 'Alternate Mobile', key: 'alternate_mobile', icon: Phone },
                        { label: 'Blood Group', key: 'blood_group', icon: Droplets }
                    ].map(field => (
                        <div key={field.key} className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <field.icon className="w-3 h-3" /> {field.label}
                            </label>
                            {editSection === 'personal' ? (
                                <input 
                                    type={field.type || "text"} 
                                    value={field.type === 'date' && formData[field.key] ? formData[field.key].split('T')[0] : (formData[field.key] || '')} 
                                    onChange={(e) => setFormData(p => ({...p, [field.key]: e.target.value}))}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-white/10 rounded-xl px-4 py-3 font-bold text-slate-700 dark:text-white focus:border-brand-500 outline-none transition-colors"
                                />
                            ) : (
                                <p className="font-bold text-slate-700 dark:text-slate-200 px-1 truncate transition-colors">
                                    {field.type === 'date' && profile[field.key] ? new Date(profile[field.key]).toLocaleDateString() : (profile[field.key] || 'Not specified')}
                                    {field.key === 'mobile_number' && <span className="ml-2 text-[8px] bg-green-100 text-green-600 px-2 py-0.5 rounded-full">VERIFIED ✓</span>}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Address Section */}
            <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-white/10 shadow-sm overflow-hidden transition-all hover:shadow-md">
                <div className="px-10 py-8 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-white/10 flex justify-between items-center transition-colors">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center text-white">
                            <MapPin className="w-5 h-5" />
                        </div>
                        <h2 className="text-lg font-black text-slate-800 dark:text-white tracking-tight">Living Address</h2>
                    </div>
                    {editSection === 'address' ? (
                        <div className="flex gap-2">
                             <button onClick={() => setEditSection(null)} className="p-3 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-red-500 transition-colors">
                                <X className="w-5 h-5" />
                             </button>
                             <button onClick={() => handleSave('address')} disabled={saving} className="p-3 bg-brand-500 text-white rounded-xl shadow-lg shadow-brand-500/20">
                                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                             </button>
                        </div>
                    ) : (
                        <button onClick={() => setEditSection('address')} className="p-3 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-brand-500 transition-colors">
                            <Edit3 className="w-5 h-5" />
                        </button>
                    )}
                </div>
                <div className="p-10">
                    {editSection === 'address' ? (
                        <textarea 
                            value={formData.local_address || ''} 
                            onChange={(e) => setFormData(p => ({...p, local_address: e.target.value}))}
                            rows={4}
                            className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-white/10 rounded-2xl px-6 py-4 font-bold text-slate-700 dark:text-white focus:border-brand-500 outline-none resize-none transition-colors"
                            placeholder="Type your current address..."
                        />
                    ) : (
                        <p className="text-slate-600 dark:text-slate-300 font-bold leading-relaxed whitespace-pre-wrap transition-colors">
                            {profile.local_address || 'No address specified. Please update your current location.'}
                        </p>
                    )}
                </div>
            </div>

            {/* Subject & Lab Expertise Section */}
            <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-white/10 shadow-sm overflow-hidden transition-all hover:shadow-md">
                <div className="px-10 py-8 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-white/10 flex justify-between items-center transition-colors">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white">
                            <Book className="w-5 h-5" />
                        </div>
                        <h2 className="text-lg font-black text-slate-800 dark:text-white tracking-tight">Subject & Lab Expertise</h2>
                    </div>
                    <button 
                        onClick={() => setIsExpertiseModalOpen(true)}
                        className="flex items-center gap-2 px-6 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-300 hover:text-indigo-500 transition-all active:scale-95 shadow-sm"
                    >
                        <Edit3 className="w-4 h-4" /> Edit Expertise
                    </button>
                </div>
                <div className="p-10 space-y-10">
                    {/* Theory Subjects */}
                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                             CORE SUBJECTS (Theory)
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {expertise.subjects.length > 0 ? expertise.subjects.map(sub => (
                                <div key={sub.id} className="flex items-center gap-3 p-4 bg-slate-50/50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/10 rounded-2xl transition-colors">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{sub.subject_name}</span>
                                </div>
                            )) : (
                                <p className="text-[10px] font-bold text-slate-300 italic uppercase">No theory subjects selected</p>
                            )}
                        </div>
                    </div>

                    {/* Labs */}
                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                             LAB EXPERTISE (Practical)
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {expertise.labs.length > 0 ? expertise.labs.map(lab => (
                                <div key={lab.id} className="flex items-center gap-3 p-4 bg-slate-50/50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/10 rounded-2xl transition-colors">
                                    <div className="w-2 h-2 bg-brand-500 rounded-full shadow-[0_0_8px_rgba(79,70,229,0.5)]"></div>
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{lab.lab_name}</span>
                                </div>
                            )) : (
                                <p className="text-[10px] font-bold text-slate-300 italic uppercase">No lab expertise selected</p>
                            )}
                        </div>
                    </div>

                    {/* Programming Skills */}
                    <div className="space-y-6 pt-4">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Programming Languages Proficiency</h4>
                        <div className="space-y-4">
                            {expertise.skills.length > 0 ? expertise.skills.map(skill => (
                                <div key={skill.id} className="space-y-2">
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                        <span className="text-slate-600">{skill.language_name}</span>
                                        <span className="text-brand-500">{skill.proficiency_level}</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-brand-500 rounded-full transition-all duration-1000"
                                            style={{ width: skill.proficiency_level === 'Expert' ? '100%' : skill.proficiency_level === 'Advanced' ? '80%' : skill.proficiency_level === 'Intermediate' ? '60%' : '40%' }}
                                        />
                                    </div>
                                </div>
                            )) : (
                                <p className="text-[10px] font-bold text-slate-300 dark:text-slate-500 italic uppercase">Declare your language skills in edit mode</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Right Column - Assignments & Settings */}
        <div className="space-y-8">
            
            {/* Assigned Subjects */}
            <div className="bg-slate-900 rounded-[40px] p-8 text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500 rounded-full -mr-16 -mt-16 opacity-10 group-hover:scale-150 transition-transform duration-700"></div>
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
                    <Book className="w-4 h-4" /> Assignments
                </h3>
                
                <div className="space-y-4">
                    {assignedSubjects && assignedSubjects.length > 0 ? assignedSubjects.map((sub, i) => (
                        <div key={i} className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors group/item">
                            <p className="font-bold text-sm tracking-tight truncate">{sub.subject_name}</p>
                            <div className="flex justify-between items-center mt-2">
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{sub.department} {sub.year}-{sub.division}</span>
                                <ChevronRight className="w-3 h-3 text-slate-600 group-hover/item:text-brand-400 transition-colors" />
                            </div>
                        </div>
                    )) : (
                        <div className="text-center py-10 opacity-30">
                            <Book className="w-10 h-10 mx-auto mb-4" />
                            <p className="text-[10px] font-black uppercase tracking-widest">No assigned classes</p>
                        </div>
                    )}
                </div>

                <div className="mt-8 pt-8 border-t border-white/5 flex justify-between items-center">
                    <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Impact</p>
                        <p className="text-2xl font-black">{assignedSubjects?.length || 0} Classes</p>
                    </div>
                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center">
                        <Users className="w-6 h-6 text-brand-400" />
                    </div>
                </div>
            </div>

        </div>
      </div>

      {/* Photo Options Modal */}
      {showPhotoOptions && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
           <div className="bg-white dark:bg-slate-900 max-w-xs w-full rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200 transition-colors">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white text-center mb-4 transition-colors">Update Profile Photo</h3>
              <button onClick={openCamera} className="w-full flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors group">
                 <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors"><Video className="w-5 h-5" /></div>
                 <span className="font-bold text-slate-700 dark:text-slate-200 text-sm transition-colors">Take Live Photo</span>
              </button>
              <button onClick={() => fileInputRef.current.click()} className="w-full flex items-center gap-3 p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors group">
                 <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center group-hover:bg-emerald-600 transition-colors"><ImageIcon className="w-5 h-5" /></div>
                 <span className="font-bold text-slate-700 text-sm">Choose from Gallery</span>
              </button>
              <button onClick={handleRemovePhoto} className="w-full flex items-center gap-3 p-4 bg-red-50 rounded-2xl hover:bg-red-100 transition-colors group">
                 <div className="w-10 h-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center group-hover:bg-red-600 transition-colors"><Trash2 className="w-5 h-5" /></div>
                 <span className="font-bold text-red-700 text-sm">Remove Photo</span>
              </button>
              <button onClick={() => setShowPhotoOptions(false)} className="w-full py-3 text-slate-500 dark:text-slate-400 font-bold hover:text-slate-700 dark:hover:text-white text-sm transition-colors">Cancel</button>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} />
           </div>
        </div>
      )}

      {/* Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 bg-slate-900 z-[110] flex flex-col items-center justify-center p-4">
           <div className="relative max-w-lg w-full aspect-square bg-black rounded-[40px] overflow-hidden shadow-2xl border-4 border-white/10">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover transform scale-x-[-1]" />
           </div>
           <div className="mt-10 flex items-center gap-8">
              <button onClick={closeCamera} className="p-4 bg-white/10 text-white rounded-full"><X className="w-6 h-6" /></button>
              <button onClick={capturePhoto} className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all outline outline-offset-4 outline-white/20">
                 <div className="w-16 h-16 border-4 border-slate-900 rounded-full"></div>
              </button>
               <button className="p-4 bg-white/10 text-white rounded-full"><RefreshCw className="w-6 h-6" /></button>
            </div>
        </div>
      )}

      {/* Expertise Selection Modal */}
      {isExpertiseModalOpen && (
        <ExpertiseModal 
            masterData={masterData}
            currentExpertise={expertise}
            onClose={() => setIsExpertiseModalOpen(false)}
            onSave={handleSaveExpertise}
            saving={saving}
            fetchExpertise={fetchExpertise}
        />
      )}
    </div>
  );
};

const ExpertiseModal = ({ masterData, currentExpertise, onClose, onSave, saving, fetchExpertise }) => {
    const [tempExp, setTempExp] = useState({
        subjects: currentExpertise.subjects.map(s => ({ subject_id: s.subject_id, proficiency_level: s.proficiency_level, years_of_experience: s.years_of_experience })),
        labs: currentExpertise.labs.map(l => ({ lab_id: l.lab_id, proficiency_level: l.proficiency_level })),
        skills: currentExpertise.skills.map(s => ({ language_name: s.language_name, proficiency_level: s.proficiency_level }))
    });

    const [activeSubTab, setActiveSubTab] = useState('subjects');
    const [showAddForm, setShowAddForm] = useState(false);
    const [newMasterData, setNewMasterData] = useState({ name: '', code: '', dept: '', sem: 1, type: 'Theory' });

    const toggleSubject = (id) => {
        const exists = tempExp.subjects.find(s => s.subject_id === id);
        if (exists) {
            setTempExp({ ...tempExp, subjects: tempExp.subjects.filter(s => s.subject_id !== id) });
        } else {
            setTempExp({ ...tempExp, subjects: [...tempExp.subjects, { subject_id: id, proficiency_level: 'Intermediate', years_of_experience: 0 }] });
        }
    };

    const toggleLab = (id) => {
        const exists = tempExp.labs.find(l => l.lab_id === id);
        if (exists) {
            setTempExp({ ...tempExp, labs: tempExp.labs.filter(l => l.lab_id !== id) });
        } else {
            setTempExp({ ...tempExp, labs: [...tempExp.labs, { lab_id: id, proficiency_level: 'Intermediate' }] });
        }
    };

    const handleAddMaster = async () => {
        try {
            const token = localStorage.getItem('attendease_token');
            if (activeSubTab === 'subjects') {
                await axios.post(`${API_BASE_URL}/teacher/expertise/master/subjects`, {
                    subject_name: newMasterData.name,
                    subject_code: newMasterData.code,
                    department: newMasterData.dept,
                    semester: newMasterData.sem,
                    subject_type: newMasterData.type
                }, { headers: { Authorization: `Bearer ${token}` } });
            } else {
                await axios.post(`${API_BASE_URL}/teacher/expertise/master/labs`, {
                    lab_name: newMasterData.name,
                    lab_code: newMasterData.code,
                    department: newMasterData.dept
                }, { headers: { Authorization: `Bearer ${token}` } });
            }
            await fetchExpertise();
            setShowAddForm(false);
            setNewMasterData({ name: '', code: '', dept: '', sem: 1, type: 'Theory' });
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to add item');
        }
    };

    const handleDeleteMaster = async (id, type) => {
        if (!window.confirm(`Remove this ${type} from the master list?`)) return;
        try {
            const token = localStorage.getItem('attendease_token');
            const endpoint = type === 'subject' ? `/master/subjects/${id}` : `/master/labs/${id}`;
            await axios.delete(`${API_BASE_URL}/teacher/expertise${endpoint}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            await fetchExpertise();
        } catch (error) {
            alert('Failed to remove item');
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[150] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
             <div className="bg-white dark:bg-slate-900 max-w-4xl w-full h-[85vh] rounded-[48px] overflow-hidden shadow-2xl flex flex-col relative transition-colors">
                <div className="px-10 py-8 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-white/10 flex justify-between items-center transition-colors">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight transition-colors">Edit Academic Expertise</h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Select subjects and labs you are qualified to teach</p>
                    </div>
                    <button onClick={onClose} className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-400 hover:text-red-500 transition-colors"><X className="w-5 h-5" /></button>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                    <div className="w-full md:w-56 border-r border-slate-100 dark:border-white/10 p-6 space-y-2 bg-slate-50/30 dark:bg-slate-800/30 transition-colors">
                        {['subjects', 'labs', 'skills'].map(tab => (
                            <button 
                                key={tab}
                                onClick={() => setActiveSubTab(tab)}
                                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSubTab === tab ? 'bg-slate-900 dark:bg-brand-500 text-white shadow-xl shadow-slate-900/20' : 'text-slate-400 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-white'}`}
                            >
                                {tab === 'subjects' && <Book className="w-4 h-4" />}
                                {tab === 'labs' && <RefreshCw className="w-4 h-4" />}
                                {tab === 'skills' && <Shield className="w-4 h-4" />}
                                {tab}
                            </button>
                        ))}
                    </div>

                    <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-white dark:bg-slate-900 transition-colors">
                        {(activeSubTab === 'subjects' || activeSubTab === 'labs') && (
                            <div className="mb-8 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[32px] border border-slate-100 dark:border-white/10 transition-colors">
                                <div className="space-y-1">
                                    <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight transition-colors">System Master Pool</h4>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select to add to your personal expertise</p>
                                </div>
                                <button 
                                    onClick={() => setShowAddForm(!showAddForm)}
                                    className="px-6 py-2.5 bg-brand-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-brand-500/20 active:scale-95 transition-all flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" /> Add New {activeSubTab === 'subjects' ? 'Subject' : 'Lab'}
                                </button>
                            </div>
                        )}

                        {showAddForm && (
                            <div className="mb-8 p-8 bg-brand-50/50 border-2 border-dashed border-brand-200 rounded-[32px] space-y-6 animate-in zoom-in-95 duration-200">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Name</label>
                                        <input 
                                            value={newMasterData.name}
                                            onChange={e => setNewMasterData({...newMasterData, name: e.target.value})}
                                            className="w-full bg-white border border-slate-100 rounded-xl px-4 py-2 text-xs font-bold"
                                            placeholder="e.g. Data Structures"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Code</label>
                                        <input 
                                            value={newMasterData.code}
                                            onChange={e => setNewMasterData({...newMasterData, code: e.target.value})}
                                            className="w-full bg-white border border-slate-100 rounded-xl px-4 py-2 text-xs font-bold"
                                            placeholder="e.g. CS101"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Department</label>
                                        <input 
                                            value={newMasterData.dept}
                                            onChange={e => setNewMasterData({...newMasterData, dept: e.target.value})}
                                            className="w-full bg-white border border-slate-100 rounded-xl px-4 py-2 text-xs font-bold"
                                            placeholder="e.g. CSE"
                                        />
                                    </div>
                                    {activeSubTab === 'subjects' && (
                                        <>
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Semester</label>
                                                <input 
                                                    type="number"
                                                    value={newMasterData.sem}
                                                    onChange={e => setNewMasterData({...newMasterData, sem: e.target.value})}
                                                    className="w-full bg-white border border-slate-100 rounded-xl px-4 py-2 text-xs font-bold"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Type</label>
                                                <select 
                                                    value={newMasterData.type}
                                                    onChange={e => setNewMasterData({...newMasterData, type: e.target.value})}
                                                    className="w-full bg-white border border-slate-100 rounded-xl px-4 py-2 text-xs font-bold"
                                                >
                                                    <option>Theory</option>
                                                    <option>Lab</option>
                                                    <option>Tutorial</option>
                                                    <option>Project</option>
                                                </select>
                                            </div>
                                        </>
                                    )}
                                </div>
                                <div className="flex justify-end gap-3">
                                    <button onClick={() => setShowAddForm(false)} className="px-6 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cancel</button>
                                    <button onClick={handleAddMaster} className="px-8 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Confirm Add</button>
                                </div>
                            </div>
                        )}

                        {activeSubTab === 'subjects' && (
                            <div className="space-y-8 animate-in slide-in-from-right-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {masterData.subjects.map(sub => (
                                            <div 
                                                key={sub.id} 
                                                onClick={() => toggleSubject(sub.id)}
                                                className={`p-5 rounded-3xl border-2 transition-all cursor-pointer flex flex-col gap-2 relative group ${tempExp.subjects.some(s => s.subject_id === sub.id) ? 'border-brand-500 bg-brand-50/30 dark:bg-brand-500/10' : 'border-slate-50 dark:border-white/5 bg-white dark:bg-slate-800 hover:border-slate-200 dark:hover:border-white/20'}`}
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div className="space-y-0.5">
                                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Sem {sub.semester} • {sub.subject_type}</p>
                                                        <h4 className="text-xs font-black text-slate-800 dark:text-white leading-tight uppercase transition-colors">{sub.subject_name}</h4>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); handleDeleteMaster(sub.id, 'subject'); }}
                                                            className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${tempExp.subjects.some(s => s.subject_id === sub.id) ? 'bg-brand-500 border-brand-500 text-white' : 'border-slate-200'}`}>
                                                        {tempExp.subjects.some(s => s.subject_id === sub.id) && <CheckCircle className="w-3 h-3" />}
                                                    </div>
                                                </div>
                                            </div>
                                            {tempExp.subjects.some(s => s.subject_id === sub.id) && (
                                                <div className="mt-2 pt-2 border-t border-brand-100 flex gap-2" onClick={e => e.stopPropagation()}>
                                                    <select 
                                                        value={tempExp.subjects.find(s => s.subject_id === sub.id).proficiency_level}
                                                        onChange={(e) => {
                                                            const newSubs = [...tempExp.subjects];
                                                            const idx = newSubs.findIndex(s => s.subject_id === sub.id);
                                                            newSubs[idx].proficiency_level = e.target.value;
                                                            setTempExp({ ...tempExp, subjects: newSubs });
                                                        }}
                                                        className="flex-1 bg-white dark:bg-slate-800 border border-brand-200 dark:border-brand-500/30 rounded-lg px-2 py-1 text-[9px] font-black uppercase text-slate-800 dark:text-white outline-none transition-colors"
                                                    >
                                                        <option>Intermediate</option>
                                                        <option>Advanced</option>
                                                        <option>Expert</option>
                                                    </select>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeSubTab === 'labs' && (
                            <div className="space-y-8 animate-in slide-in-from-right-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {masterData.labs.map(lab => (
                                            <div 
                                                key={lab.id} 
                                                onClick={() => toggleLab(lab.id)}
                                                className={`p-5 rounded-3xl border-2 transition-all cursor-pointer flex justify-between items-center group ${tempExp.labs.some(l => l.lab_id === lab.id) ? 'border-indigo-500 bg-indigo-50/30 dark:bg-indigo-500/10' : 'border-slate-50 dark:border-white/5 bg-white dark:bg-slate-800 hover:border-slate-200 dark:hover:border-white/20'}`}
                                            >
                                                <div className="space-y-0.5">
                                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{lab.lab_code}</p>
                                                    <h4 className="text-xs font-black text-slate-800 dark:text-white leading-tight uppercase transition-colors">{lab.lab_name}</h4>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); handleDeleteMaster(lab.id, 'lab'); }}
                                                        className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${tempExp.labs.some(l => l.lab_id === lab.id) ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-slate-200 dark:border-white/20'}`}>
                                                    {tempExp.labs.some(l => l.lab_id === lab.id) && <CheckCircle className="w-3 h-3" />}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeSubTab === 'skills' && (
                            <div className="space-y-8 animate-in slide-in-from-right-4">
                                <div className="space-y-4">
                                    {tempExp.skills.map((skill, i) => (
                                        <div key={i} className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-white/10 transition-colors">
                                            <input 
                                                value={skill.language_name}
                                                onChange={(e) => {
                                                    const newSkills = [...tempExp.skills];
                                                    newSkills[i].language_name = e.target.value;
                                                    setTempExp({ ...tempExp, skills: newSkills });
                                                }}
                                                className="flex-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-xs font-bold font-black uppercase text-slate-800 dark:text-white outline-none transition-colors"
                                            />
                                            <select 
                                                value={skill.proficiency_level}
                                                onChange={(e) => {
                                                    const newSkills = [...tempExp.skills];
                                                    newSkills[i].proficiency_level = e.target.value;
                                                    setTempExp({ ...tempExp, skills: newSkills });
                                                }}
                                                className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-[10px] font-black uppercase text-slate-800 dark:text-white outline-none transition-colors"
                                            >
                                                <option>Intermediate</option>
                                                <option>Advanced</option>
                                                <option>Expert</option>
                                            </select>
                                            <button 
                                                onClick={() => setTempExp({ ...tempExp, skills: tempExp.skills.filter((_, idx) => idx !== i) })}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    <button 
                                        onClick={() => setTempExp({ ...tempExp, skills: [...tempExp.skills, { language_name: '', proficiency_level: 'Intermediate' }] })}
                                        className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 flex items-center justify-center gap-2 hover:border-brand-500 hover:text-brand-500 transition-all font-black uppercase tracking-widest text-[10px]"
                                    >
                                        <Plus className="w-4 h-4" /> Add Programming Language
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-8 border-t border-slate-50 dark:border-white/10 bg-slate-50/50 dark:bg-slate-800/50 flex justify-end gap-3 transition-colors">
                    <button onClick={onClose} className="px-8 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-slate-600 transition-colors">Cancel Changes</button>
                    <button 
                        onClick={() => onSave(tempExp)}
                        disabled={saving}
                        className="px-10 py-3.5 bg-slate-900 dark:bg-brand-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-slate-900/20 dark:shadow-brand-500/20 active:scale-95 transition-all flex items-center gap-2"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Academic Profile
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TeacherProfile;
