import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/apiConfig';
import {
  Save, Upload, Download, Search, 
  AlertCircle, CheckCircle2, ChevronRight,
  TrendingUp, Users, FileSpreadsheet
} from 'lucide-react';

const MarksEntry = ({ assignedClasses }) => {
  const [loading, setLoading] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedDiv, setSelectedDiv] = useState('');
  const [iseNumber, setIseNumber] = useState('ISE-1');
  const [students, setStudents] = useState([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Derive unique options from assignedClasses
  const subjects = Array.from(new Set(assignedClasses.map(c => JSON.stringify({ id: c.subject_id, name: c.subject_name }))))
    .map(s => JSON.parse(s));
  
  // Get years for the selected subject, or all years if no subject selected or no years found for subject
  let years = Array.from(new Set(assignedClasses
    .filter(c => c.subject_id == selectedSubject && c.year)
    .map(c => c.year)));
  
  if (years.length === 0) {
    years = Array.from(new Set(assignedClasses.filter(c => c.year).map(c => c.year)));
  }
  // Standard fallback if still empty
  if (years.length === 0) years = ['FE', 'SE', 'TE', 'BE'];

  // Get divisions for the selected subject and year
  let divisions = Array.from(new Set(assignedClasses
    .filter(c => c.subject_id == selectedSubject && (!selectedYear || c.year == selectedYear) && c.division)
    .map(c => c.division)));
    
  if (divisions.length === 0) {
    divisions = Array.from(new Set(assignedClasses.filter(c => c.division).map(c => c.division)));
  }
  // Standard fallback if still empty
  if (divisions.length === 0) divisions = ['A', 'B', 'C'];

  const fetchStudents = async () => {
    if (!selectedSubject || !selectedYear || !selectedDiv) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('attendease_token');
      const res = await axios.get(`${API_BASE_URL}/ise/students/${selectedSubject}/${selectedYear}/${selectedDiv}/${iseNumber}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudents(res.data);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error(error);
      alert("Error fetching students.");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkChange = (studentId, value) => {
    if (value === '') {
      setStudents(prev => prev.map(s => 
        s.id === studentId ? { ...s, marks_obtained: '' } : s
      ));
      setHasUnsavedChanges(true);
      return;
    }

    const val = parseFloat(value);
    if (val > 20) return; // Max marks 20
    
    // Normalize: remove leading zeros unless it's "0."
    let normalizedValue = value;
    if (value.length > 1 && value.startsWith('0') && value[1] !== '.') {
      normalizedValue = val.toString();
    }
    
    setStudents(prev => prev.map(s => 
      s.id === studentId ? { ...s, marks_obtained: normalizedValue } : s
    ));
    setHasUnsavedChanges(true);
  };

  const saveMarks = async (status = 'draft') => {
    if (!selectedSubject) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('attendease_token');
      const marksData = students.map(s => ({
        studentId: s.id,
        marks: s.marks_obtained,
        remarks: s.remarks,
        status: status
      }));

      await axios.post(`${API_BASE_URL}/ise/marks` , {
        subjectId: selectedSubject,
        iseNumber,
        marksData
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert(`Marks saved successfully as ${status}.`);
      setHasUnsavedChanges(false);
      fetchStudents();
    } catch (error) {
      console.error(error);
      alert("Error saving marks.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header & Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-[32px] p-8 border border-slate-100 dark:border-white/10 shadow-sm flex flex-col md:flex-row gap-6 items-end transition-colors">
        <div className="flex-1 space-y-4">
            <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3 transition-colors">
                <FileSpreadsheet className="text-brand-500" /> ISE Marks Management
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Subject</label>
                    <select 
                     value={selectedSubject} 
                     onChange={(e) => setSelectedSubject(e.target.value)}
                     className="w-full bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-white/10 rounded-2xl px-4 py-3 font-bold text-slate-700 dark:text-white outline-none transition-colors"
                   >
                     <option value="">Select Subject</option>
                     {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                   </select>
                </div>
                <div>
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Year</label>
                    <select 
                     value={selectedYear} 
                     onChange={(e) => setSelectedYear(e.target.value)}
                     className="w-full bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-white/10 rounded-2xl px-4 py-3 font-bold text-slate-700 dark:text-white outline-none transition-colors"
                   >
                     <option value="">Select Year</option>
                     {years.map((y, idx) => <option key={`year-${y}-${idx}`} value={y}>{y}</option>)}
                   </select>
                </div>
                <div>
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Division</label>
                    <select 
                     value={selectedDiv} 
                     onChange={(e) => setSelectedDiv(e.target.value)}
                     className="w-full bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-white/10 rounded-2xl px-4 py-3 font-bold text-slate-700 dark:text-white outline-none transition-colors"
                   >
                     <option value="">Select Division</option>
                     {divisions.map((d, idx) => <option key={`div-${d}-${idx}`} value={d}>{d}</option>)}
                   </select>
                </div>
                <div>
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Exam Type</label>
                    <select 
                     value={iseNumber} 
                     onChange={(e) => setIseNumber(e.target.value)}
                     className="w-full bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-white/10 rounded-2xl px-4 py-3 font-bold text-slate-700 dark:text-white outline-none transition-colors"
                   >
                     <option>ISE-1</option><option>ISE-2</option><option>ISE-3</option>
                   </select>
                </div>
            </div>
        </div>
        <button 
            onClick={fetchStudents}
            className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-slate-900/20 hover:scale-105 active:scale-95 transition-all"
        >
            Load List
        </button>
      </div>

      {students.length > 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-white/10 shadow-xl overflow-hidden transition-colors">
               <div className="p-6 border-b border-slate-50 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50 transition-colors">
                    <div className="flex items-center gap-4">
                        <span className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest transition-colors">Entry Grid (Max: 20)</span>
                        {hasUnsavedChanges && <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full animate-pulse">Unsaved Changes</span>}
                    </div>
                    <div className="flex gap-2">
                        <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                            <Upload className="w-3 h-3" /> Bulk Upload
                        </button>
                        <button 
                            onClick={() => saveMarks('draft')}
                            className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-brand-500/20 hover:scale-105"
                        >
                            <Save className="w-3 h-3" /> Save Draft
                        </button>
                        <button 
                            onClick={() => saveMarks('published')}
                            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-green-500/20 hover:scale-105"
                        >
                            <CheckCircle2 className="w-3 h-3" /> Publish
                        </button>
                    </div>
               </div>

               <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-900 text-white uppercase tracking-widest text-[9px] font-black">
                                <th className="px-6 py-4">Roll</th>
                                <th className="px-6 py-4">PRN Number</th>
                                <th className="px-6 py-4">Student Name</th>
                                <th className="px-6 py-4">Attendance</th>
                                <th className="px-6 py-4 w-32 text-center">Marks</th>
                                <th className="px-6 py-4">Remarks</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {students.map((s, idx) => (
                                <tr key={s.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${parseFloat(s.attendance_rate || 0) < 75 ? 'bg-red-50/30 dark:bg-red-500/5' : ''}`}>
                                    <td className="px-6 py-4 font-black text-slate-800 dark:text-white text-xs transition-colors">{s.roll_no_in_class || idx + 1}</td>
                                    <td className="px-6 py-4 font-bold text-slate-400 dark:text-slate-200 text-[10px] uppercase tracking-wider transition-colors">{s.prn_number}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-black text-slate-800 dark:text-white text-xs uppercase transition-colors">{s.name}</span>
                                            {parseFloat(s.attendance_rate || 0) < 75 && <span className="text-[8px] text-red-500 font-black uppercase">Low Attendance!</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className={`text-[10px] font-black px-2 py-1 rounded-lg inline-block ${parseFloat(s.attendance_rate || 0) < 75 ? 'text-red-600 bg-red-50' : 'text-green-600 bg-green-50'}`}>
                                            {parseFloat(s.attendance_rate || 0).toFixed(1)}%
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <input 
                                            type="number" 
                                            value={s.marks_obtained !== null && s.marks_obtained !== undefined ? (s.marks_obtained.toString().startsWith('0') && s.marks_obtained.toString().length > 1 && s.marks_obtained.toString()[1] !== '.' ? parseFloat(s.marks_obtained).toString() : s.marks_obtained) : ''}
                                            onChange={(e) => handleMarkChange(s.id, e.target.value)}
                                            className={`w-full bg-slate-50 dark:bg-slate-800 border-2 rounded-xl px-3 py-2 text-center font-black text-slate-800 dark:text-white outline-none transition-all ${parseFloat(s.attendance_rate || 0) < 75 ? 'border-red-200 dark:border-red-500/30 focus:border-red-500' : 'border-slate-100 dark:border-white/10 focus:border-brand-500'}`}
                                            placeholder="--"
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        <input 
                                            type="text"
                                            value={s.remarks || ''}
                                            onChange={(e) => {
                                                setStudents(prev => prev.map(p => p.id === s.id ? { ...p, remarks: e.target.value } : p));
                                                setHasUnsavedChanges(true);
                                            }}
                                            className="w-full bg-transparent border-none text-[10px] font-bold text-slate-500 dark:text-slate-400 placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:ring-0"
                                            placeholder="Add remark..."
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
               </div>
          </div>
      ) : (
          <div className="bg-white dark:bg-slate-900 p-20 rounded-[40px] border border-dashed border-slate-200 dark:border-white/10 flex flex-col items-center justify-center text-slate-400 transition-colors">
               <div className="w-24 h-24 bg-slate-50 rounded-[32px] flex items-center justify-center mb-6">
                    <TrendingUp className="w-10 h-10 text-slate-200" />
               </div>
               <p className="font-black uppercase tracking-widest text-xs italic">Select filters and load the student list to start grading</p>
               <p className="text-[10px] mt-2 font-bold opacity-50">Validation rules and attendance status will be applied automatically</p>
          </div>
      )}
    </div>
  );
};

export default MarksEntry;
