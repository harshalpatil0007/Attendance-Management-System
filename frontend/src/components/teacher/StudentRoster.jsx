import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/apiConfig';
import {
    Search, User, Phone, Mail, 
    AlertCircle, CheckCircle2, MoreHorizontal,
    MessageSquare, Eye, PhoneCall, Heart, Users
} from 'lucide-react';

const StudentRoster = ({ assignedClasses }) => {
    const [selectedSubject, setSelectedSubject] = useState('');
    const [selectedDiv, setSelectedDiv] = useState('');
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStudent, setSelectedStudent] = useState(null);

    const fetchStudents = async () => {
        if (!selectedSubject || !selectedDiv) return;
        setLoading(true);
        try {
            const token = localStorage.getItem('attendease_token');
            const res = await axios.get(`${API_BASE_URL}/ise/students/${selectedSubject}/${selectedDiv}/ISE-1`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStudents(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedSubject && selectedDiv) fetchStudents();
    }, [selectedSubject, selectedDiv]);

    const filteredStudents = students.filter(s => 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.prn_number.includes(searchQuery)
    );

    const getRiskLevel = (attendance) => {
        const rate = parseFloat(attendance || 0);
        if (rate < 70) return { label: 'At Risk', color: 'red', icon: AlertCircle };
        if (rate < 75) return { label: 'Borderline', color: 'amber', icon: AlertCircle };
        return { label: 'On Track', color: 'green', icon: CheckCircle2 };
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Filters & Search */}
            <div className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-sm flex flex-col xl:flex-row gap-6 items-end">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Subject</label>
                        <select 
                            value={selectedSubject}
                            onChange={(e) => setSelectedSubject(e.target.value)}
                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3.5 font-bold text-slate-700 outline-none focus:border-brand-500 transition-all"
                        >
                            <option value="">Select Subject</option>
                            {assignedClasses.map(c => <option key={c.subject_id} value={c.subject_id}>{c.subject_name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Division</label>
                        <select 
                            value={selectedDiv}
                            onChange={(e) => setSelectedDiv(e.target.value)}
                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3.5 font-bold text-slate-700 outline-none focus:border-brand-500 transition-all"
                        >
                            <option value="">Select Division</option>
                            <option>A</option><option>B</option><option>C</option>
                        </select>
                    </div>
                    <div className="relative">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Search Student</label>
                        <Search className="absolute left-5 top-[52px] w-5 h-5 text-slate-400" />
                        <input 
                            type="text"
                            placeholder="Search by name or PRN..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-12 pr-5 py-3.5 font-bold text-slate-700 outline-none focus:border-brand-500 transition-all flex items-center"
                        />
                    </div>
                </div>
            </div>

            {/* Content Area */}
            {selectedSubject && selectedDiv ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredStudents.map(student => {
                        const risk = getRiskLevel(student.attendance_rate);
                        return (
                            <div key={student.id} className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all group overflow-hidden relative">
                                <div className={`absolute top-0 right-0 w-32 h-32 bg-${risk.color}-50 rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-110 transition-transform`}></div>
                                
                                <div className="relative z-10">
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="w-16 h-16 rounded-2xl bg-slate-100 p-0.5 border-2 border-white shadow-lg overflow-hidden">
                                            <img src={`https://ui-avatars.com/api/?name=${student.name}&background=random`} alt={student.name} className="w-full h-full object-cover rounded-[14px]" />
                                        </div>
                                        <div className={`px-3 py-1.5 rounded-xl bg-${risk.color}-50 text-${risk.color}-600 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest`}>
                                            <risk.icon className="w-3 h-3" />
                                            {risk.label}
                                        </div>
                                    </div>

                                    <h3 className="text-lg font-black text-slate-800 tracking-tight uppercase leading-snug">{student.name}</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Roll: {student.roll_no_in_class} | {student.prn_number}</p>

                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
                                           <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Attendance</p>
                                           <p className={`text-sm font-black text-${risk.color}-600 underline decoration-2 underline-offset-4`}>{parseFloat(student.attendance_rate || 0).toFixed(1)}%</p>
                                        </div>
                                        <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
                                           <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Last Score</p>
                                           <p className="text-sm font-black text-slate-700">{student.marks_obtained || '--'}/20</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button className="flex-1 py-3 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-800 transition-all">
                                            <Eye className="w-3 h-3" /> Profile
                                        </button>
                                        <button className="w-12 h-11 bg-brand-50 text-brand-500 rounded-xl flex items-center justify-center hover:bg-brand-500 hover:text-white transition-all">
                                            <PhoneCall className="w-4 h-4" />
                                        </button>
                                        <button className="w-12 h-11 bg-indigo-50 text-indigo-500 rounded-xl flex items-center justify-center hover:bg-indigo-500 hover:text-white transition-all">
                                            <MessageSquare className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="bg-white p-32 rounded-[60px] border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 text-center">
                    <div className="w-24 h-24 bg-slate-50 rounded-[40px] flex items-center justify-center mb-8">
                        <Users className="w-10 h-10 text-slate-200" />
                    </div>
                    <p className="font-black uppercase tracking-widest text-sm italic">Class Roster & Compliance</p>
                    <p className="text-[10px] font-bold text-slate-300 mt-2">Select a class to monitor performance and attendance</p>
                </div>
            )}
        </div>
    );
};

export default StudentRoster;
