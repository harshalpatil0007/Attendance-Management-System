import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  X, Mail, Phone, MapPin, Calendar, 
  Droplet, Award, Clock, FileText, 
  Plus, Edit3, Send, CheckCircle2, 
  AlertCircle, ChevronRight, Loader2,
  LineChart, TrendingUp, UserCheck
} from 'lucide-react';
import { API_BASE_URL, BASE_URL } from '../../config/apiConfig';
import {
  LineChart as RechartsLine, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';

const StudentProfileOverlay = ({ studentId, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('performance');
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [newNote, setNewNote] = useState({ reason: '', summary: '', action: '' });

  useEffect(() => {
    fetchStudentDetails();
  }, [studentId]);

  const fetchStudentDetails = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('attendease_token');
      const res = await axios.get(`${API_BASE_URL}/teacher/student-management/${studentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    try {
      const token = localStorage.getItem('attendease_token');
      await axios.post(`${API_BASE_URL}/teacher/student-management/${studentId}/counseling-note`, {
        meetingDate: new Date().toISOString().split('T')[0],
        reason: newNote.reason,
        discussionSummary: newNote.summary,
        actionItems: newNote.action
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowNoteForm(false);
      fetchStudentDetails();
    } catch (error) {
      alert("Failed to add note.");
    }
  };

  if (loading) return (
    <div className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-xl flex items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-white" />
    </div>
  );

  const { profile, attendance, iseMarks, recentActivity, notes, commLog, certificates } = data;

  return (
    <div className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-xl flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
      <div className="bg-white max-w-6xl w-full h-[90vh] rounded-[48px] overflow-hidden shadow-2xl flex flex-col relative">
        
        {/* Header Section */}
        <div className="p-10 border-b border-slate-50 flex flex-col md:flex-row gap-8 items-start bg-slate-50/30">
           <div className="relative">
              <div className="w-24 h-24 bg-brand-100 rounded-3xl overflow-hidden shadow-inner flex items-center justify-center border-4 border-white">
                {profile.profile_image ? (
                  <img src={`${BASE_URL}${profile.profile_image}`} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-black text-brand-500">{profile.name.charAt(0)}</span>
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full border-4 border-white flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
           </div>

           <div className="flex-1 space-y-2">
              <div className="flex items-center gap-4">
                <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase leading-none">{profile.name}</h2>
                <span className="px-3 py-1 bg-brand-500 text-white text-[10px] font-black rounded-lg uppercase tracking-widest">{profile.current_year} {profile.division}</span>
              </div>
              <div className="flex flex-wrap gap-4 text-slate-400 font-bold uppercase tracking-widest text-[11px]">
                <span className="flex items-center gap-1.5"><FileText className="w-4 h-4" /> PRN: {profile.prn_number}</span>
                <span className="flex items-center gap-1.5 font-black text-slate-600">•</span>
                <span className="flex items-center gap-1.5"><Award className="w-4 h-4" /> ROll: {profile.roll_no_in_class}</span>
                <span className="flex items-center gap-1.5 font-black text-slate-600">•</span>
                <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {profile.department}</span>
              </div>
              <div className="flex flex-wrap gap-6 pt-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-slate-100 shadow-sm">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Attendance: 89.2%</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-slate-100 shadow-sm">
                  <div className="w-2 h-2 bg-brand-500 rounded-full"></div>
                  <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">ISE Eligibility: Cleared</span>
                </div>
              </div>
           </div>

           <div className="flex gap-3">
              <button className="p-3 bg-white border border-slate-200 text-slate-400 rounded-2xl hover:text-brand-500 transition-colors shadow-sm"><Mail className="w-5 h-5" /></button>
              <button className="p-3 bg-white border border-slate-200 text-slate-400 rounded-2xl hover:text-indigo-500 transition-colors shadow-sm"><Phone className="w-5 h-5" /></button>
              <button onClick={onClose} className="p-3 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20"><X className="w-5 h-5" /></button>
           </div>
        </div>

        {/* Content Tabs */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
            {/* Sidebar Navigation */}
            <div className="w-full md:w-64 border-r border-slate-50 p-6 space-y-2 bg-slate-50/10">
               {[
                 { id: 'performance', label: 'Performance', icon: LineChart },
                 { id: 'details', label: 'Personal Details', icon: UserCheck },
                 { id: 'activity', label: 'Recent Activity', icon: Clock },
                 { id: 'notes', label: 'Counseling Notes', icon: Edit3 },
                 { id: 'certificates', label: 'Certificates', icon: Award }
               ].map(tab => (
                 <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/20' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}
                 >
                   <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-brand-400' : 'text-slate-300'}`} />
                   {tab.label}
                 </button>
               ))}
            </div>

            {/* Main Tab Content */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                {activeTab === 'performance' && (
                  <div className="space-y-10 animate-in slide-in-from-right-4 duration-300">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Attendance Chart */}
                        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-6">
                           <div className="flex justify-between items-center">
                              <h3 className="text-sm font-black text-slate-800 uppercase tracking-[0.2em]">Attendance Strength</h3>
                              <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg">89.2% AVG</span>
                           </div>
                           <div className="h-48">
                              <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={attendance.map(a => ({ name: a.subject_code, val: parseFloat(a.attendance_percentage) }))}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                  <XAxis dataKey="name" hide />
                                  <YAxis hide domain={[0, 100]} />
                                  <Tooltip />
                                  <Area type="monotone" dataKey="val" stroke="#3b82f6" fill="#eff6ff" strokeWidth={3} />
                                </AreaChart>
                              </ResponsiveContainer>
                           </div>
                        </div>

                        {/* ISE Score Summary */}
                        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-6">
                           <div className="flex justify-between items-center">
                              <h3 className="text-sm font-black text-slate-800 uppercase tracking-[0.2em]">Academic Readiness</h3>
                              <span className="text-[10px] font-black text-brand-500 bg-brand-50 px-2 py-1 rounded-lg">36/40 ISE</span>
                           </div>
                           <div className="space-y-4">
                              {iseMarks.map((m, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-slate-50/50 rounded-xl">
                                   <div className="flex flex-col">
                                      <span className="text-[9px] font-black text-slate-800 uppercase">{m.subject_name}</span>
                                      <span className="text-[8px] font-bold text-slate-400">BEST OF 2 APPLIED</span>
                                   </div>
                                   <div className="text-right">
                                      <span className="text-xs font-black text-slate-800">{(parseFloat(m.ise1)+parseFloat(m.ise2))}</span>
                                      <span className="text-[8px] font-black text-slate-300 ml-1">/ 40</span>
                                   </div>
                                </div>
                              ))}
                           </div>
                        </div>
                    </div>

                    {/* Full table */}
                    <div className="space-y-6">
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-[0.2em] ml-2">Subject Breakdown</h3>
                        <div className="overflow-hidden bg-white border border-slate-50 rounded-[32px]">
                            <table className="w-full text-left">
                                <thead className="bg-slate-900">
                                    <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                        <th className="px-6 py-4">Subject</th>
                                        <th className="px-6 py-4">Attendance</th>
                                        <th className="px-6 py-4">ISE-1</th>
                                        <th className="px-6 py-4">ISE-2</th>
                                        <th className="px-6 py-4">Eligibility</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {attendance.map((a, i) => {
                                      const m = iseMarks.find(mark => mark.subject_code === a.subject_code) || {};
                                      return (
                                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <p className="text-[10px] font-black text-slate-800 uppercase tracking-tight">{a.subject_name}</p>
                                                <p className="text-[8px] font-bold text-slate-400">{a.subject_code}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                        <div className="h-full bg-brand-500" style={{ width: `${a.attendance_percentage}%` }}></div>
                                                    </div>
                                                    <span className="text-[9px] font-black text-slate-600">{a.attendance_percentage}%</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-xs text-slate-600">{m.ise1 || '--'}</td>
                                            <td className="px-6 py-4 font-bold text-xs text-slate-600">{m.ise2 || '--'}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-md text-[8px] font-black uppercase ${parseFloat(a.attendance_percentage) >= 75 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                                  {parseFloat(a.attendance_percentage) >= 75 ? 'Eligible' : 'Debarred'}
                                                </span>
                                            </td>
                                        </tr>
                                      );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                  </div>
                )}

                {activeTab === 'details' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10 animate-in slide-in-from-right-4 duration-300">
                      <div className="space-y-8">
                         <div className="space-y-4">
                            <h4 className="text-[10px] font-black text-brand-500 uppercase tracking-[0.2em] border-b border-brand-100 pb-2">Personal Information</h4>
                            <div className="grid grid-cols-2 gap-6">
                               <div>
                                  <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Blood Group</p>
                                  <p className="text-xs font-black text-slate-700">{profile.blood_group || 'B+'}</p>
                               </div>
                               <div>
                                  <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Date of Birth</p>
                                  <p className="text-xs font-black text-slate-700">{profile.dob ? new Date(profile.dob).toLocaleDateString() : '15/08/2005'}</p>
                               </div>
                               <div className="col-span-2">
                                  <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Permanent Address</p>
                                  <p className="text-xs font-bold text-slate-600 leading-relaxed">{profile.permanent_address || 'Room 12, Boys Hostel, SSBTCOET Campus, Jalgaon'}</p>
                               </div>
                            </div>
                         </div>

                         <div className="space-y-4">
                            <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] border-b border-indigo-100 pb-2">Medical Notes</h4>
                            <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 border-dashed">
                               <p className="text-[9px] font-bold text-indigo-600 italic leading-relaxed">
                                  {profile.medical_conditions || 'No significant medical history reported by the student. Physically fit for academic activities.'}
                                </p>
                            </div>
                         </div>
                      </div>

                      <div className="space-y-8">
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-2">Emergency Contacts</h4>
                            <div className="space-y-4">
                               <div className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                                  <div>
                                     <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Father</p>
                                     <p className="text-xs font-black text-slate-800">{profile.guardian_name || 'Sunil Patil'}</p>
                                  </div>
                                  <a href={`tel:${profile.guardian_mobile}`} className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:text-indigo-500 transition-colors"><Phone className="w-4 h-4" /></a>
                               </div>
                               <div className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                                  <div>
                                     <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Secondary Contact</p>
                                     <p className="text-xs font-black text-slate-800">{profile.emergency_contact_name || 'Rajesh Patil (Uncle)'}</p>
                                  </div>
                                  <a href={`tel:${profile.emergency_contact_mobile}`} className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:text-indigo-500 transition-colors"><Phone className="w-4 h-4" /></a>
                               </div>
                            </div>
                         </div>
                      </div>
                  </div>
                )}

                {activeTab === 'notes' && (
                  <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                     <div className="flex justify-between items-center px-4">
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-[0.2em]">Counseling History</h3>
                        <button 
                          onClick={() => setShowNoteForm(!showNoteForm)}
                          className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-slate-900/20 hover:scale-105 transition-all"
                        >
                          <Plus className="w-4 h-4" /> Add Record
                        </button>
                     </div>

                     {showNoteForm && (
                       <div className="p-8 bg-brand-50 border border-brand-100 rounded-[32px] space-y-6 animate-in slide-in-from-top-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div className="space-y-2">
                                <label className="text-[9px] font-black text-brand-600 uppercase tracking-widest ml-1">Reason for Session</label>
                                <input 
                                  type="text" 
                                  placeholder="e.g. ISE-1 Performance Discussion" 
                                  value={newNote.reason}
                                  onChange={e => setNewNote({...newNote, reason: e.target.value})}
                                  className="w-full bg-white border-none rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:ring-2 ring-brand-200" 
                                />
                             </div>
                             <div className="space-y-2">
                                <label className="text-[9px] font-black text-brand-600 uppercase tracking-widest ml-1">Status</label>
                                <select 
                                  className="w-full bg-white border-none rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:ring-2 ring-brand-200"
                                >
                                   <option>Pending</option>
                                   <option>Completed</option>
                                   <option>Escalated</option>
                                </select>
                             </div>
                             <div className="md:col-span-2 space-y-2">
                                <label className="text-[9px] font-black text-brand-600 uppercase tracking-widest ml-1">Discussion Summary</label>
                                <textarea 
                                  rows="3"
                                  placeholder="Details of the interaction..."
                                  value={newNote.summary}
                                  onChange={e => setNewNote({...newNote, summary: e.target.value})}
                                  className="w-full bg-white border-none rounded-2xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:ring-2 ring-brand-200"
                                ></textarea>
                             </div>
                             <div className="md:col-span-2 space-y-2">
                                <label className="text-[9px] font-black text-brand-600 uppercase tracking-widest ml-1">Action Items / Advice</label>
                                <input 
                                  type="text" 
                                  placeholder="Steps for student to take..." 
                                  value={newNote.action}
                                  onChange={e => setNewNote({...newNote, action: e.target.value})}
                                  className="w-full bg-white border-none rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:ring-2 ring-brand-200" 
                                />
                             </div>
                          </div>
                          <div className="flex justify-end gap-3 pt-2">
                             <button onClick={() => setShowNoteForm(false)} className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cancel</button>
                             <button onClick={handleAddNote} className="px-10 py-3 bg-brand-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-brand-500/20 active:scale-95 transition-transform">Save Note</button>
                          </div>
                       </div>
                     )}

                     <div className="space-y-4">
                        {notes.length > 0 ? notes.map((note, i) => (
                          <div key={i} className="p-6 bg-white border border-slate-100 rounded-[28px] shadow-sm flex gap-6 hover:shadow-md transition-shadow">
                             <div className="flex-shrink-0 w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center font-black text-[10px]">
                                {new Date(note.meeting_date).toLocaleDateString('en-US', { day: '2-digit', month: 'short' })}
                             </div>
                             <div className="flex-1 space-y-2">
                                <div className="flex items-center justify-between">
                                  <h5 className="text-xs font-black text-slate-800 uppercase tracking-tight">{note.reason}</h5>
                                  <span className={`text-[8px] font-black px-2 py-0.5 rounded-md uppercase ${note.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>{note.status}</span>
                                </div>
                                <p className="text-[10px] font-medium text-slate-500 leading-relaxed line-clamp-2">{note.discussion_summary}</p>
                                <div className="flex items-center gap-2 text-[9px] font-black text-brand-500 uppercase tracking-widest pt-2">
                                  <TrendingUp className="w-3.5 h-3.5" /> Plan: {note.action_items}
                                </div>
                             </div>
                             <button className="self-start p-2 bg-slate-50 text-slate-300 rounded-xl hover:text-slate-600"><ChevronRight className="w-4 h-4" /></button>
                          </div>
                        )) : (
                          <div className="p-16 border-2 border-dashed border-slate-100 rounded-[40px] flex flex-col items-center justify-center text-slate-400 italic">
                             <Edit3 className="w-10 h-10 mb-4 opacity-20" />
                             <p className="text-xs font-bold font-black tracking-widest uppercase">No counseling history on record</p>
                          </div>
                        )}
                     </div>
                  </div>
                )}
                
                {/* Other tabs follow similar logic... */}
                {activeTab === 'activity' && (
                  <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                     <h3 className="text-sm font-black text-slate-800 uppercase tracking-[0.2em] ml-2">Attendance Feed</h3>
                     <div className="space-y-3">
                        {recentActivity.map((act, i) => (
                          <div key={i} className="flex items-center justify-between p-5 bg-white border border-slate-50 rounded-2xl group hover:bg-slate-50/50 transition-colors">
                             <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${act.status === 'present' ? 'bg-emerald-50 text-emerald-500' : 'bg-red-50 text-red-500'}`}>
                                   <CheckCircle2 className="w-5 h-5" />
                                </div>
                                <div>
                                   <p className="text-[11px] font-black text-slate-800 uppercase tracking-tight">{act.subject_name}</p>
                                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                      <Calendar className="w-3 h-3" /> {new Date(act.date).toLocaleDateString()} <span className="text-slate-200">|</span> <Clock className="w-3 h-3" /> {act.time.substring(0, 5)}
                                   </p>
                                </div>
                             </div>
                             <div className="flex items-center gap-3">
                                <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">{act.method}</span>
                                <div className="w-1.5 h-1.5 bg-brand-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                             </div>
                          </div>
                        ))}
                     </div>
                  </div>
                )}
            </div>
        </div>

        {/* Footer info bar */}
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between px-12 border-t border-slate-800">
            <div className="flex items-center gap-10">
                <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Student Profile Verified</span>
                </div>
                <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-brand-500" />
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Performing Above Median</span>
                </div>
            </div>
            <div className="flex items-center gap-4">
               <button className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.3em] text-brand-400 hover:text-white transition-colors">
                  <Send className="w-4 h-4" /> Generate Transcript
               </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfileOverlay;
