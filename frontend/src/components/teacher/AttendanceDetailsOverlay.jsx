import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/apiConfig';
import {
  X, Users, CheckCircle2, XCircle, Clock, 
  MapPin, MousePointer2, Camera, Smartphone, 
  Keyboard, AlertCircle, Save, Download, 
  Send, Loader2, Search, Trash2, Edit3,
  ArrowLeft
} from 'lucide-react';

const AttendanceDetailsOverlay = ({ session: initialSession, onClose, onUpdate }) => {
  const [session, setSession] = useState(initialSession);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [editReason, setEditReason] = useState('');
  const [editRemarks, setEditRemarks] = useState('');
  const [modifiedRecords, setModifiedRecords] = useState({}); // { studentId: newStatus }

  useEffect(() => {
    fetchSessionDetails();
  }, [initialSession.id]);

  const fetchSessionDetails = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('attendease_token');
      const res = await axios.get(`${API_BASE_URL}/attendance/session/${initialSession.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSession(res.data.session);
      setAttendance(res.data.attendance);
    } catch (error) {
      console.error("Error fetching session details:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (studentId, newStatus) => {
    setModifiedRecords(prev => ({
      ...prev,
      [studentId]: newStatus
    }));
  };

  const handleSaveChanges = async () => {
    if (!editReason) {
      alert("Please select a reason for editing.");
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('attendease_token');
      const updates = Object.entries(modifiedRecords).map(([studentId, status]) => ({
        student_id: parseInt(studentId),
        status
      }));

      await axios.put(`${API_BASE_URL}/attendance/edit-session`, {
        sessionId: session.id,
        updates,
        reason: editReason,
        remarks: editRemarks
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert("Attendance updated successfully!");
      setEditMode(false);
      setModifiedRecords({});
      fetchSessionDetails();
      if (onUpdate) onUpdate();
    } catch (error) {
      alert("Failed to update attendance.");
    } finally {
      setSaving(false);
    }
  };

  const filteredAttendance = attendance.filter(a => 
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    a.prn_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getMethodIcon = (method) => {
    switch (method) {
      case 'qr': return <Smartphone className="w-3 h-3" />;
      case 'face': return <Camera className="w-3 h-3" />;
      case 'code': return <MousePointer2 className="w-3 h-3" />;
      case 'manual': return <Keyboard className="w-3 h-3" />;
      default: return null;
    }
  };

  if (loading) return (
    <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-md flex items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-white" />
    </div>
  );

  return (
    <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 max-w-5xl w-full h-[90vh] rounded-[48px] overflow-hidden shadow-2xl flex flex-col relative transition-colors">
        
        {/* Header */}
        <div className="p-8 border-b border-slate-100 dark:border-white/10 flex items-start justify-between bg-slate-50/50 dark:bg-slate-800/50 transition-colors">
          <div className="flex gap-6">
             <button onClick={onClose} className="mt-1 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors">
                <ArrowLeft className="w-5 h-5" />
             </button>
             <div>
                <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight uppercase leading-tight transition-colors">
                    {session.subject_name} ({session.division})
                </h2>
                <div className="flex items-center gap-4 mt-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white dark:bg-slate-800 px-2 py-1 rounded-md border border-slate-100 dark:border-white/10 transition-colors">{new Date(session.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {session.start_time?.substring(0, 5)} - {session.end_time?.substring(0, 5)}</span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Room {session.room_number || '201'}</span>
                </div>
             </div>
          </div>
          <div className="flex gap-3">
             {!editMode ? (
               <>
                <button className="flex items-center gap-2 px-5 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                    <Download className="w-4 h-4" /> Export
                </button>
                <button 
                  onClick={() => setEditMode(true)}
                  className="flex items-center gap-2 px-5 py-3 bg-brand-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-brand-500/20 hover:scale-105 active:scale-95 transition-all"
                >
                    <Edit3 className="w-4 h-4" /> Edit Attendance
                </button>
               </>
             ) : (
                <button 
                  onClick={() => setEditMode(false)}
                  className="flex items-center gap-2 px-5 py-3 bg-slate-100 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest"
                >
                    Cancel
                </button>
             )}
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
            {/* Left Column: Summary & Controls (Scrollable) */}
            <div className="w-full md:w-80 border-r border-slate-100 dark:border-white/10 p-8 space-y-8 overflow-y-auto bg-slate-50/20 dark:bg-slate-800/20 transition-colors">
                
                {/* Stats Card */}
                <div className="space-y-4">
                    <div className="p-6 bg-white dark:bg-slate-800 border border-slate-100 dark:border-white/10 shadow-sm relative overflow-hidden group transition-colors">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-brand-50 rounded-full -mr-10 -mt-10 opacity-50 group-hover:scale-150 transition-transform"></div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 relative z-10">Attendance Rate</p>
                        <div className="flex items-baseline gap-2 relative z-10">
                            <span className="text-4xl font-black text-slate-800 dark:text-white transition-colors">{((session.present_count / session.total_students) * 100).toFixed(1)}%</span>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 mt-2">{session.present_count} Present / {session.total_students} Total</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
                             <p className="text-[8px] font-black uppercase tracking-widest mb-1 opacity-70">Present</p>
                             <p className="text-lg font-black">{session.present_count}</p>
                        </div>
                        <div className="p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100">
                             <p className="text-[8px] font-black uppercase tracking-widest mb-1 opacity-70">Absent</p>
                             <p className="text-lg font-black">{session.total_students - session.present_count}</p>
                        </div>
                    </div>
                </div>

                {/* Method Breakdown */}
                <div className="space-y-4">
                    <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Method Breakdown</h3>
                    <div className="space-y-2">
                        {[
                            { label: 'QR Scan', count: session.qr_scans || 0, icon: Smartphone, color: 'text-indigo-500', bg: 'bg-indigo-50' },
                            { label: 'Face ID', count: session.face_scans || 0, icon: Camera, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                            { label: 'Quick Code', count: session.code_entries || 0, icon: MousePointer2, color: 'text-amber-500', bg: 'bg-amber-50' },
                            { label: 'Manual Entry', count: session.manual_entries || 0, icon: Keyboard, color: 'text-slate-500', bg: 'bg-slate-50' },
                        ].map((m, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-white/10 rounded-xl transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 ${m.bg} ${m.color} rounded-lg flex items-center justify-center`}><m.icon className="w-4 h-4" /></div>
                                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{m.label}</span>
                                </div>
                                <span className="text-xs font-black text-slate-800 dark:text-white transition-colors">{m.count}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Geo-fence Alert */}
                {session.geofence_violations > 0 && (
                    <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                        <div className="space-y-1">
                            <p className="text-xs font-black text-amber-900 uppercase">Geofence Alert</p>
                            <p className="text-[10px] font-bold text-amber-700 leading-tight">
                                {session.geofence_violations} students attempted to mark attendance from outside the classroom radius.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Right Column: Student List & Search (Scrollable) */}
            <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 transition-colors">
                <div className="p-6 border-b border-slate-50 dark:border-white/10 flex items-center justify-between gap-4 transition-colors">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Search by Name or PRN..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl pl-10 pr-4 py-3 text-xs font-bold text-slate-700 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:ring-2 ring-brand-500/20 transition-colors"
                        />
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Showing {filteredAttendance.length} Records</span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {editMode && (
                        <div className="p-8 bg-brand-50 border-b border-brand-100 animate-in slide-in-from-top-4 duration-300">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-brand-600 uppercase tracking-widest ml-1">Reason for Editing *</label>
                                    <select 
                                        value={editReason}
                                        onChange={(e) => setEditReason(e.target.value)}
                                        className="w-full bg-white border-2 border-brand-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none text-xs"
                                    >
                                        <option value="">Select Reason</option>
                                        <option value="System Error">Student present but system error</option>
                                        <option value="Medical Emergency">Medical emergency (documented)</option>
                                        <option value="College Leave">College approved leave</option>
                                        <option value="Technical Issue">Technical issue with attendance portal</option>
                                        <option value="Other">Other (specify below)</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-brand-600 uppercase tracking-widest ml-1">Additional Remarks</label>
                                    <input 
                                        type="text"
                                        placeholder="Explain the changes..."
                                        value={editRemarks}
                                        onChange={(e) => setEditRemarks(e.target.value)}
                                        className="w-full bg-white border-2 border-brand-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none text-xs" 
                                    />
                                </div>
                             </div>
                             <div className="mt-6 flex justify-end gap-3">
                                <button 
                                  onClick={() => { setEditMode(false); setModifiedRecords({}); }}
                                  className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest"
                                >
                                    Cancel
                                </button>
                                <button 
                                  onClick={handleSaveChanges}
                                  disabled={saving || !editReason}
                                  className="px-8 py-3 bg-brand-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-brand-500/20 disabled:opacity-50"
                                >
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Save Changes"}
                                </button>
                             </div>
                        </div>
                    )}

                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 bg-white dark:bg-slate-900 shadow-sm z-10 transition-colors">
                            <tr className="border-b border-slate-50 dark:border-white/5">
                                <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Student</th>
                                <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Verification</th>
                                <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Time</th>
                                <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-white/5 transition-colors">
                            {filteredAttendance.map(a => {
                                const isModified = modifiedRecords[a.student_id] !== undefined;
                                const currentStatus = isModified ? modifiedRecords[a.student_id] : a.status;
                                
                                return (
                                    <tr key={a.id} className={`group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors ${isModified ? 'bg-brand-50/30 dark:bg-brand-500/5' : ''}`}>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center font-black text-slate-500 dark:text-slate-400 text-xs shadow-sm transition-colors">
                                                    {a.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-800 dark:text-white tracking-tight leading-none mb-1 transition-colors">{a.name}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{a.prn_number || 'No PRN'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-white/5 transition-colors">
                                                    {getMethodIcon(a.method)}
                                                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">{a.method}</span>
                                                </div>
                                                {a.face_verified ? (
                                                    <div className="flex items-center gap-1 text-emerald-500">
                                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                                        <span className="text-[8px] font-black uppercase tracking-tighter">Verified</span>
                                                    </div>
                                                ) : a.status === 'present' ? (
                                                    <div className="flex items-center gap-1 text-amber-500">
                                                        <AlertCircle className="w-3.5 h-3.5" />
                                                        <span className="text-[8px] font-black uppercase tracking-tighter">Unverified</span>
                                                    </div>
                                                ) : null}
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <p className="text-xs font-bold text-slate-600 dark:text-slate-400 transition-colors">{a.marked_at?.substring(0, 5) || '--:--'}</p>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            {editMode ? (
                                                <select 
                                                  value={currentStatus}
                                                  onChange={(e) => handleStatusChange(a.student_id, e.target.value)}
                                                  className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none border-2 transition-all ${
                                                    currentStatus === 'present' ? 'border-emerald-100 bg-emerald-50 text-emerald-600' : 'border-red-100 bg-red-50 text-red-600'
                                                  }`}
                                                >
                                                    <option value="present">Present</option>
                                                    <option value="absent">Absent</option>
                                                    <option value="late">Late</option>
                                                </select>
                                            ) : (
                                                <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-2 ${
                                                    a.status === 'present' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 
                                                    a.status === 'late' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                                    'bg-red-50 text-red-600 border border-red-100'
                                                }`}>
                                                    {a.status === 'present' ? <CheckCircle2 className="w-3 h-3" /> : a.status === 'late' ? <Clock className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                                    {a.status}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        
        {/* Footer info bar */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between px-10">
            <div className="flex items-center gap-8">
                <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Security: Face ID Verified</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-brand-500 rounded-full"></span>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Geofence: 44 Active</span>
                </div>
            </div>
            <button className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white flex items-center gap-2">
                <Send className="w-3 h-3" /> Push to Attendance Cloud
            </button>
        </div>
      </div>
    </div>
  );
};

export default AttendanceDetailsOverlay;
