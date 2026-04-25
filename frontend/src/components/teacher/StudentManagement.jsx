import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, UserCheck, AlertTriangle, Search, 
  Filter, Download, Mail,
  Smartphone, ChevronRight, Loader2,
  TrendingDown, TrendingUp, UserMinus, Plus
} from 'lucide-react';
import StudentProfileOverlay from './StudentProfileOverlay';
import { API_BASE_URL } from '../../config/apiConfig';

const StudentManagement = ({ teacherSubjects }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ students: [], summary: {} });
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedRisk, setSelectedRisk] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  
  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('attendease_token');
      const res = await axios.get(`${API_BASE_URL}/teacher/student-management` , {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          subjectId: selectedSubject,
          division: selectedDivision,
          year: selectedYear,
          riskLevel: selectedRisk,
          search: searchQuery
        }
      });
      setData(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchStudents();
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* KPI Overlays */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-slate-500 p-8 rounded-[32px] border border-slate-100 dark:border-white/10 shadow-sm space-y-4 hover:shadow-lg transition-all group transition-colors">
             <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"><Users className="w-6 h-6" /></div>
             <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Enrollment</h4>
                <div className="flex items-baseline gap-2">
                   <p className="text-3xl font-black text-slate-800 dark:text-white transition-colors">{data.summary.totalStudents || 0}</p>
                   <span className="text-[10px] font-bold text-slate-400">STUDENTS</span>
                </div>
             </div>
          </div>
          <div className="bg-white dark:bg-slate-500 p-8 rounded-[32px] border border-slate-100 dark:border-white/10 shadow-sm space-y-4 hover:shadow-lg transition-all group transition-colors">
             <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"><UserCheck className="w-6 h-6" /></div>
             <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Above 75% Mark</h4>
                <div className="flex items-baseline gap-2">
                   <p className="text-3xl font-black text-emerald-500">{data.summary.above75 || 0}</p>
                   <span className="text-[10px] font-bold text-slate-400">ON TRACK</span>
                </div>
             </div>
          </div>
          <div className="bg-white dark:bg-slate-500 p-8 rounded-[32px] border border-slate-100 dark:border-white/10 shadow-sm space-y-4 hover:shadow-lg transition-all group transition-colors">
             <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"><AlertTriangle className="w-6 h-6" /></div>
             <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Warning (65-75%)</h4>
                <div className="flex items-baseline gap-2">
                   <p className="text-3xl font-black text-amber-500">{data.summary.warning || 0}</p>
                   <span className="text-[10px] font-bold text-slate-400">NEED PUSH</span>
                </div>
             </div>
          </div>
          <div className="bg-white dark:bg-slate-500 p-8 rounded-[32px] border border-red-50 dark:border-red-500/20 shadow-sm space-y-4 hover:shadow-lg transition-all group transition-colors">
             <div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"><TrendingDown className="w-6 h-6" /></div>
             <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Critical (&lt;65%)</h4>
                <div className="flex items-baseline gap-2">
                   <p className="text-3xl font-black text-red-500">{data.summary.critical || 0}</p>
                   <span className="text-[10px] font-bold text-slate-400">DEFAULTERS</span>
                </div>
             </div>
          </div>
      </div>

      {/* Main Hub Content */}
      <div className="bg-white dark:bg-slate-500 rounded-[48px] border border-slate-100 dark:border-white/10 shadow-xl overflow-hidden flex flex-col transition-colors">
          {/* Controls Bar */}
          <div className="p-8 border-b border-slate-50 dark:border-white/10 flex flex-col lg:flex-row gap-6 items-center justify-between bg-slate-50/20 dark:bg-slate-800/20">
             <div className="flex flex-wrap items-center gap-4">
                <div className="relative">
                   <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                   <select 
                    value={selectedSubject}
                    onChange={e => setSelectedSubject(e.target.value)}
                    className="pl-11 pr-4 py-3 bg-white border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 outline-none focus:ring-2 ring-brand-500/20 shadow-sm appearance-none min-w-[180px]"
                   >
                     <option value="">By Subject</option>
                     {Array.from(new Map(teacherSubjects.map(s => [s.unique_id, s])).values()).map(s => (
                        <option key={s.unique_id} value={s.subject_id}>{s.is_lab ? '[LAB] ' : ''}{s.subject_name}</option>
                     ))}
                   </select>
                </div>
                <select 
                    value={selectedDivision}
                    onChange={e => setSelectedDivision(e.target.value)}
                    className="px-6 py-3 bg-white border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 outline-none focus:ring-2 ring-brand-500/20 shadow-sm min-w-[120px]"
                >
                    <option value="">Division</option>
                    <option>A</option>
                    <option>B</option>
                    <option>C</option>
                </select>
                <select 
                    value={selectedYear}
                    onChange={e => setSelectedYear(e.target.value)}
                    className="px-6 py-3 bg-white border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 outline-none focus:ring-2 ring-brand-500/20 shadow-sm min-w-[100px]"
                >
                    <option value="">Year</option>
                    <option value="FE">FE</option>
                    <option value="SE">SE</option>
                    <option value="TE">TE</option>
                    <option value="BE">BE</option>
                </select>
                <select 
                    value={selectedRisk}
                    onChange={e => setSelectedRisk(e.target.value)}
                    className="px-6 py-3 bg-white border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 outline-none focus:ring-2 ring-brand-500/20 shadow-sm"
                >
                    <option value="">Risk Status</option>
                    <option value="critical">Critical Only (&lt;65%)</option>
                    <option value="warning">Warning Level</option>
                    <option value="on-track">On Track</option>
                </select>
             </div>

             <form onSubmit={handleSearch} className="flex-1 max-w-sm relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <input 
                  type="text" 
                  placeholder="PRN or Student Name..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl text-xs font-bold text-slate-700 dark:text-white outline-none focus:ring-2 ring-brand-500/10 placeholder:text-slate-300 transition-colors"
                />
             </form>

             <div className="flex gap-2">
                <button 
                  onClick={fetchStudents}
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all disabled:opacity-50"
                 >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 rotate-45" />}
                    Load Data
                 </button>
                <button className="p-3 bg-white border border-slate-200 text-slate-400 rounded-2xl hover:text-indigo-500 transition-colors shadow-sm"><Download className="w-5 h-5" /></button>
             </div>
          </div>

          {/* Student Grid/List */}
          <div className="flex-1 p-8 overflow-y-auto min-h-[500px]">
             {loading ? (
               <div className="h-full flex items-center justify-center">
                  <div className="flex flex-col items-center gap-4">
                     <Loader2 className="w-10 h-10 animate-spin text-brand-500" />
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Compiling Student Data...</p>
                  </div>
               </div>
             ) : data.students.length > 0 ? (
               <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {data.students.map(student => (
                    <div key={student.id} className="relative group">
                       <div className={`absolute inset-0 rounded-[32px] blur-xl opacity-0 group-hover:opacity-10 transition-opacity ${parseFloat(student.attendance_rate || 0) < 65 ? 'bg-red-500' : 'bg-brand-500'}`}></div>
                       <div className="relative bg-white dark:bg-slate-400 border border-slate-100 dark:border-white/10 rounded-[32px] p-6 space-y-6 hover:border-slate-200 dark:hover:border-white/20 transition-all shadow-sm transition-colors">
                          <div className="flex justify-between items-start">
                             <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-xl shadow-inner border border-slate-100 font-black text-slate-300">
                                   {student.name.charAt(0)}
                                </div>
                                <div className="space-y-0.5">
                                   <h4 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-tight line-clamp-1 transition-colors">{student.name}</h4>
                                   <p className="text-[10px] font-bold text-slate-400 dark:text-slate-200 uppercase tracking-widest transition-colors">{student.prn_number}</p>
                                </div>
                             </div>
                             <div className={`p-2 rounded-xl border ${parseFloat(student.attendance_rate || 0) < 65 ? 'border-red-100 bg-red-50 text-red-500' : parseFloat(student.attendance_rate || 0) < 75 ? 'border-amber-100 bg-amber-50 text-amber-500' : 'border-emerald-100 bg-emerald-50 text-emerald-500'}`}>
                                <TrendingUp className="w-4 h-4" />
                             </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-1 border-r border-slate-50">
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Attendance</p>
                                <p className={`text-sm font-black transition-colors ${parseFloat(student.attendance_rate || 0) < 65 ? 'text-red-500' : 'text-slate-800 dark:text-white'}`}>{parseFloat(student.attendance_rate || 0).toFixed(1)}%</p>
                             </div>
                             <div className="space-y-1">
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">ISE Score</p>
                                <p className="text-sm font-black text-slate-800 dark:text-white transition-colors">{student.ise_sum || '--'} <span className="text-[10px] text-slate-300">/ 40</span></p>
                             </div>
                          </div>

                          <div className="flex items-center gap-2">
                             <button 
                              onClick={() => setSelectedStudent(student.id)}
                              className="flex-1 py-3 bg-slate-50 text-slate-600 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                             >
                               View Full Profile
                             </button>
                             
                          </div>
                       </div>
                    </div>
                  ))}
               </div>
             ) : (
               <div className="h-full flex flex-col items-center justify-center p-20 text-center space-y-6 bg-white dark:bg-slate-500 rounded-[32px] transition-colors">
                  <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                     <Search className="w-10 h-10" />
                  </div>
                  <div className="space-y-2">
                     <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tighter transition-colors">No Students Found</h3>
                     <p className="text-xs font-bold text-slate-400 dark:text-slate-200 max-w-sm transition-colors">Adjust your filters or try a different search term to find the students you're looking for.</p>
                  </div>
                  <button onClick={() => { setSelectedSubject(''); setSelectedDivision(''); setSelectedYear(''); setSelectedRisk(''); setSearchQuery(''); }} className="px-8 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-900/20 active:scale-95 transition-all">Clear All Filters</button>
               </div>
             )}
          </div>

          {/* Footer Bar */}
          <div className="p-5 bg-slate-900 text-white flex items-center justify-between px-10">
              <div className="flex items-center gap-8">
                 <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">8 Critical Defaulters (&lt;65%)</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-brand-500 rounded-full"></div>
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">NBA/NAAC Ready Repository</span>
                 </div>
              </div>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-600">Updated: Today at 04:30 PM</p>
          </div>
      </div>

      {selectedStudent && (
        <StudentProfileOverlay 
          studentId={selectedStudent} 
          onClose={() => setSelectedStudent(null)} 
        />
      )}
    </div>
  );
};

export default StudentManagement;
