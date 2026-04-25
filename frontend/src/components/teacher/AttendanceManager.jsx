import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  QrCode, Hash, Users, CheckCircle, 
  XCircle, Clock, MapPin, ShieldCheck,
  Play, StopCircle, RefreshCw, AlertTriangle,
  Search, UserCheck, UserMinus, ChevronRight, Loader2,
  BookOpen
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { API_BASE_URL } from '../../config/apiConfig';

const AttendanceManager = ({ subjects = [], user }) => {
  const [step, setStep] = useState(1); // 1: Setup, 2: Active Session
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState(null);
  const [liveAttendance, setLiveAttendance] = useState([]);
  const [classRoster, setClassRoster] = useState([]);
  const [method, setMethod] = useState('qr');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Setup fields
  const [department] = useState(user?.department || 'CSE');
  const [year, setYear] = useState('SE');
  const [division, setDivision] = useState('A');
  const [subjectName, setSubjectName] = useState('');
  const [activeSubjectId, setActiveSubjectId] = useState(null);
  const uniqueSubjects = subjects.reduce((acc, s) => {
    const name = s.subject_name || s.lab_name;
    if (name && !acc.includes(name)) acc.push(name);
    return acc;
  }, []);

  // Auto-fill Year/Division when subject changes
  const handleSubjectChange = (name) => {
    setSubjectName(name);
    // Find if this subject is assigned to a specific class
    const assignment = subjects.find(s => (s.subject_name === name || s.lab_name === name) && !s.is_expertise_only);
    if (assignment) {
        if (assignment.year) setYear(assignment.year);
        if (assignment.division) setDivision(assignment.division);
    }
  };

  // Live polling for attendance
  useEffect(() => {
    let interval;
    if (session && session.id) {
        if (method !== 'manual') {
            interval = setInterval(fetchLiveAttendance, 3000);
        } else {
            interval = setInterval(fetchClassRoster, 5000); // Poll roster in manual mode
        }
    }
    return () => clearInterval(interval);
  }, [session, method]);

  const fetchLiveAttendance = async () => {
    try {
        const token = localStorage.getItem('attendease_token');
        const res = await axios.get(`${API_BASE_URL}/attendance/live-session/${session.id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        setLiveAttendance(res.data);
    } catch (error) {
        console.error("Live fetch error:", error);
    }
  };

  const fetchClassRoster = async () => {
    if (!session?.id) return;
    try {
        const token = localStorage.getItem('attendease_token');
        const res = await axios.get(`${API_BASE_URL}/attendance/class-students?department=${department}&year=${year}&division=${division}&session_id=${session.id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        setClassRoster(res.data);
    } catch (error) {
        console.error("Roster fetch error:", error);
    }
  };

  const startSession = async () => {
    if (!subjectName.trim()) {
        alert("Please select a subject.");
        return;
    }
    setLoading(true);
    try {
        const token = localStorage.getItem('attendease_token');
        const res = await axios.post(`${API_BASE_URL}/attendance/session/start` , {
            subjectName: subjectName.trim(),
            department,
            year,
            division,
            method_used: method,
            room_id: 1 
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        setSession(res.data);
        setActiveSubjectId(res.data.subject_id);
        if (method === 'manual') {
            await fetchClassRoster();
        }
        setStep(2);
    } catch (error) {
        alert("Failed to start session.");
    } finally {
        setLoading(false);
    }
  };

  const markManual = async (studentId, status) => {
    try {
        const token = localStorage.getItem('attendease_token');
        await axios.post(`${API_BASE_URL}/attendance/mark-manual` , {
            student_id: studentId,
            subject_id: activeSubjectId,
            session_id: session.id,
            status: status
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        // Update local roster state for instant feedback
        setClassRoster(prev => prev.map(s => s.id === studentId ? { ...s, marked: status === 'present' } : s));
    } catch (error) {
        console.error(error);
    }
  };

  const stopSession = async () => {
    if(!window.confirm("Stop attendance session and finalize counts?")) return;
    setLoading(true);
    try {
        const token = localStorage.getItem('attendease_token');
        await axios.post(`${API_BASE_URL}/attendance/session/stop/${session.id}`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        setSession(null);
        setStep(1);
        setLiveAttendance([]);
        setClassRoster([]);
    } catch (error) {
        alert("Error stopping session.");
    } finally {
        setLoading(false);
    }
  };

  if (step === 1) {
    return (
      <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-white dark:bg-slate-900 rounded-[32px] p-8 md:p-12 border border-slate-100 dark:border-white/10 shadow-xl shadow-slate-200/50 transition-colors">
          <div className="flex items-center gap-4 mb-12">
            <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center text-3xl shadow-inner">🎯</div>
            <div>
              <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight transition-colors">Configure Session</h2>
              <p className="text-slate-400 dark:text-slate-200 font-bold uppercase tracking-widest text-[10px] transition-colors">Setup your classroom environment</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="space-y-8">
              <div className="relative group">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Subject Name</label>
                <div className="relative">
                    <BookOpen className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-brand-500 transition-colors" />
                    <select 
                        value={subjectName} 
                        onChange={(e) => handleSubjectChange(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-white/10 rounded-2xl pl-14 pr-6 py-5 font-bold text-slate-700 dark:text-white focus:border-brand-500 focus:bg-white dark:focus:bg-slate-700 transition-all outline-none text-lg shadow-sm appearance-none cursor-pointer"
                    >
                        <option value="">Select Subject</option>
                        {uniqueSubjects.map((sub, idx) => (
                            <option key={idx} value={sub}>{sub}</option>
                        ))}
                    </select>
                </div>
                <p className="mt-2 text-[9px] text-slate-400 font-bold italic px-1 tracking-tight">Select from your expertise or assignments</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="sm:col-span-2">
                   <div className="bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-white/10 rounded-2xl px-6 py-5 flex items-center justify-between shadow-sm transition-colors">
                      <div>
                        <label className="block text-[8px] font-black text-slate-400 dark:text-slate-200 uppercase tracking-widest leading-none mb-1.5 opacity-60">Verified Identity</label>
                         <p className="font-black text-slate-800 dark:text-white text-sm uppercase tracking-wide transition-colors">{department} Department Faculty</p>
                      </div>
                      <div className="w-10 h-10 bg-white dark:bg-slate-700 rounded-xl flex items-center justify-center shadow-sm transition-colors">
                        <ShieldCheck className="w-6 h-6 text-brand-500" />
                      </div>
                   </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Year Level</label>
                  <select value={year} onChange={(e) => setYear(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-white/10 rounded-2xl px-6 py-4 font-bold text-slate-700 dark:text-white outline-none focus:border-brand-500 transition-all cursor-pointer shadow-sm">
                    <option className="dark:bg-slate-800">FE</option><option className="dark:bg-slate-800">SE</option><option className="dark:bg-slate-800">TE</option><option className="dark:bg-slate-800">BE</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Division</label>
                  <select value={division} onChange={(e) => setDivision(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-white/10 rounded-2xl px-6 py-4 font-bold text-slate-700 dark:text-white outline-none focus:border-brand-500 transition-all cursor-pointer shadow-sm">
                    <option className="dark:bg-slate-800">A</option><option className="dark:bg-slate-800">B</option><option className="dark:bg-slate-800">C</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-6">
               <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Marking Method</label>
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                  {[
                    { id: 'qr', label: 'QR Code', icon: QrCode, desc: 'Dynamic secure scanning' },
                    { id: 'code', label: '6-Digit Code', icon: Hash, desc: 'Verbal classroom token' },
                    { id: 'manual', label: 'Manual Roster', icon: Users, desc: 'Roster-based marking' }
                  ].map(item => (
                    <button 
                      key={item.id}
                      onClick={() => setMethod(item.id)}
                      className={`flex items-center gap-5 p-5 rounded-2xl border-2 transition-all text-left group ${method === item.id ? 'border-brand-500 bg-brand-50/50 shadow-xl shadow-brand-500/10 scale-[1.02]' : 'border-slate-50 hover:border-slate-200'}`}
                    >
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${method === item.id ? 'bg-brand-500 text-white rotate-6' : 'bg-slate-100 text-slate-500 group-hover:rotate-6'}`}>
                        <item.icon className="w-6 h-6" />
                      </div>
                      <div>
                        <p className={`font-black text-xs uppercase tracking-[0.15em] ${method === item.id ? 'text-brand-600' : 'text-slate-700'}`}>{item.label}</p>
                        <p className="text-[10px] font-bold text-slate-400 lowercase opacity-80">{item.desc}</p>
                      </div>
                    </button>
                  ))}
               </div>
            </div>
          </div>

          <button 
            disabled={!subjectName || loading}
            onClick={startSession}
            className="w-full mt-12 py-6 bg-brand-500 text-white rounded-[24px] font-black uppercase tracking-[0.25em] text-sm shadow-2xl shadow-brand-500/40 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-40 disabled:scale-100"
          >
            {loading ? <Loader2 className="w-7 h-7 animate-spin" /> : <><Play className="w-6 h-6 fill-current" /> Initialize Classroom Hub</>}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in zoom-in-95 duration-500">
        <div className="flex flex-col lg:flex-row gap-8">
            {/* Main Visual Area */}
            <div className="flex-1 space-y-8">
                {method !== 'manual' ? (
                    <div className="bg-white dark:bg-slate-900 rounded-[40px] p-12 border border-slate-100 dark:border-white/10 shadow-xl flex flex-col items-center justify-center text-center relative overflow-hidden group transition-colors">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-50 rounded-full -mr-32 -mt-32 opacity-50 group-hover:scale-110 transition-transform duration-1000"></div>
                        
                        {method === 'qr' && (
                            <div className="relative z-10 w-full flex flex-col items-center">
                                <div className="p-8 bg-white dark:bg-slate-400 border-4 border-brand-500 rounded-[40px] shadow-2xl shadow-brand-500/20 mb-8 relative group transition-colors">
                                    {session?.qr_token ? (
                                        <QRCodeSVG 
                                            value={session.qr_token} 
                                            size={220} 
                                            level="H" 
                                            includeMargin={false}
                                            imageSettings={{
                                                src: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS9Ja7gfCpnjkyFXUCu_v5gSyxxIGNVuFmSqw&s",
                                                height: 40, width: 40, excavate: true
                                            }}
                                        />
                                    ) : <QrCode className="w-56 h-56 text-slate-100" />}
                                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-brand-500 text-white px-6 py-2.5 rounded-full font-black text-[10px] uppercase tracking-widest shadow-2xl scale-110 group-hover:scale-115 transition-transform whitespace-nowrap">
                                        Live Attendance QR
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-brand-600 font-black uppercase tracking-widest text-[10px] bg-brand-50 px-6 py-3 rounded-full border border-brand-100 shadow-sm">
                                    <RefreshCw className="w-4 h-4 animate-spin text-brand-400" /> Auto-syncing with students...
                                </div>
                            </div>
                        )}

                        {method === 'code' && (
                            <div className="relative z-10 w-full py-10">
                                <p className="text-xs font-black text-slate-400 uppercase tracking-[0.4em] mb-12">Class Access Token</p>
                                <div className="flex gap-4 justify-center">
                                    {(session?.unique_code || "XXXXXX").split('').map((char, i) => (
                                        <div key={i} className="w-20 h-28 bg-slate-900 rounded-[28px] flex items-center justify-center text-5xl font-black text-white shadow-2xl shadow-slate-900/50 border-b-8 border-brand-500 group-hover:-translate-y-4 transition-transform duration-500" style={{ transitionDelay: `${i * 100}ms` }}>
                                            {char}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="mt-14 space-y-3 relative z-10">
                            <h3 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight uppercase leading-none transition-colors">{subjectName}</h3>
                            <p className="text-slate-400 dark:text-slate-200 font-black uppercase tracking-[0.3em] text-xs opacity-70 transition-colors">{year} Level • Div {division} • {department} Dept</p>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-white/10 shadow-xl overflow-hidden flex flex-col min-h-[650px] transition-colors">
                        <div className="p-10 border-b border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 flex flex-col md:flex-row justify-between items-center gap-6">
                            <div>
                                <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight transition-colors">{subjectName} Roster</h3>
                                <p className="text-slate-400 dark:text-slate-200 font-bold text-[10px] uppercase tracking-widest transition-colors">Marking attendance for {classRoster.length} students</p>
                            </div>
                            <div className="relative w-full md:w-96 shadow-sm rounded-2xl overflow-hidden">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input 
                                    type="text" 
                                    placeholder="Search by name or PRN..." 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-14 pr-6 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 font-bold text-sm text-slate-800 dark:text-white outline-none focus:border-brand-500 transition-all dark:placeholder:text-slate-400"
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar grid grid-cols-1 md:grid-cols-2 gap-5 bg-slate-50/30">
                            {classRoster.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.prn_number.includes(searchQuery)).map(student => (
                                <div key={student.id} className={`p-6 rounded-[28px] border-2 transition-all flex items-center justify-between group cursor-pointer ${student.marked ? 'border-green-500 bg-green-50/50 dark:bg-green-500/10 shadow-lg shadow-green-500/5' : 'border-white dark:border-white/5 hover:border-slate-200 dark:hover:border-white/20 bg-white dark:bg-slate-800 hover:translate-y-[-2px] shadow-sm'} transition-colors`} onClick={() => markManual(student.id, student.marked ? 'absent' : 'present')}>
                                    <div className="flex items-center gap-5">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl transition-all ${student.marked ? 'bg-green-500 text-white rotate-6 scale-110' : 'bg-slate-100 text-slate-400'}`}>
                                            {student.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-black text-slate-800 dark:text-white text-base leading-tight transition-colors">{student.name}</p>
                                            <div className="flex flex-col gap-0.5 mt-1">
                                                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-200 uppercase tracking-widest transition-colors">{student.prn_number}</p>
                                                {student.roll_number && (
                                                    <p className="text-[10px] font-black text-slate-500 dark:text-slate-300 uppercase tracking-tight mt-0.5">Roll No: {student.roll_number}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${student.marked ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-300'}`}>
                                        {student.marked ? <UserCheck className="w-7 h-7" /> : <UserMinus className="w-7 h-7" />}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Sidebar Stats Panel */}
            <div className="lg:w-[450px] flex flex-col gap-8">
                <div className="bg-slate-900 rounded-[40px] p-10 text-white shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-500 to-transparent opacity-50"></div>
                    <div className="absolute bottom-0 right-0 w-48 h-48 bg-brand-500 rounded-full -mr-24 -mb-24 opacity-10 group-hover:scale-150 transition-transform duration-1000"></div>
                    
                    <div className="flex justify-between items-start mb-12 relative z-10">
                        <div className="space-y-2">
                            <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.25em] leading-none opacity-80">Students Present</p>
                            <h2 className="text-8xl font-black leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-500">
                                {method === 'manual' ? classRoster.filter(s => s.marked).length : liveAttendance.length}
                            </h2>
                        </div>
                        <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center backdrop-blur-xl border border-white/10 group-hover:bg-brand-500/20 transition-all">
                            <Users className="w-10 h-10 text-brand-400" />
                        </div>
                    </div>
                    
                    <div className="space-y-6 relative z-10">
                         <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.25em] border-b border-white/5 pb-4">
                            <span className="text-slate-500">Live Status</span>
                            <span className="text-green-400 flex items-center gap-3"><div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse shadow-[0_0_15px_rgba(74,222,128,0.6)]"></div> Active Feed</span>
                         </div>
                         <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.25em] border-b border-white/5 pb-4">
                            <span className="text-slate-500">Class Registry</span>
                            <span className="text-white">{method === 'manual' ? classRoster.length : 'Automated'} Students</span>
                         </div>
                    </div>

                    <button 
                        onClick={stopSession}
                        className="w-full mt-12 py-6 bg-white text-slate-900 rounded-[28px] font-black uppercase tracking-[0.3em] text-[10px] shadow-2xl hover:bg-brand-500 hover:text-white transition-all transform hover:-translate-y-2 relative z-10"
                    >
                        End & Finalize Session
                    </button>
                </div>

                {method !== 'manual' && (
                    <div className="bg-white dark:bg-slate-900 rounded-[40px] p-10 border border-slate-100 dark:border-white/10 shadow-sm overflow-hidden flex flex-col flex-1 max-h-[500px] transition-colors">
                        <div className="flex items-center justify-between mb-8">
                            <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.2em] flex items-center gap-3">
                                <Clock className="w-5 h-5 text-brand-500" /> Recent Scans
                            </h4>
                            <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">{liveAttendance.length} Total</span>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2">
                            {liveAttendance.length > 0 ? liveAttendance.map((log, i) => (
                                <div key={i} className="flex items-center gap-5 p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-white/10 hover:bg-white dark:hover:bg-slate-400 hover:border-brand-200 transition-all duration-300 group">
                                    <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-500 shadow-sm flex items-center justify-center text-sm group-hover:scale-110 transition-transform">✅</div>
                                    <div className="flex-1">
                                        <p className="text-sm font-black text-slate-800 leading-tight">{log.name}</p>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1 opacity-70">{log.prn_number} • {log.time.substring(0, 5)}</p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-brand-500 transition-colors" />
                                </div>
                            )) : (
                                <div className="h-full flex flex-col items-center justify-center text-center opacity-40 space-y-5 py-24">
                                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center animate-bounce duration-1000">
                                        <Users className="w-10 h-10 text-slate-300" />
                                    </div>
                                    <p className="text-[11px] font-black uppercase tracking-[0.4em] italic leading-relaxed">Waiting for student<br/>broadcasts...</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default AttendanceManager;
