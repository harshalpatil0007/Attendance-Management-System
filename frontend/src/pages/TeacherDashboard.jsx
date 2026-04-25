import { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2 } from 'lucide-react';
import { API_BASE_URL } from '../config/apiConfig';
import { 
    LineChart, Line, BarChart, Bar, XAxis, YAxis, 
    CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';

// Teacher Components
import TeacherSidebar from '../components/teacher/TeacherSidebar';
import TeacherTopBar from '../components/teacher/TeacherTopBar';

// Dashboard Modules
import AttendanceManager from '../components/teacher/AttendanceManager';
import MarksEntry from '../components/teacher/MarksEntry';
import SyllabusTracker from '../components/teacher/SyllabusTracker';
// import StudentRoster from '../components/teacher/StudentRoster';
import CertificateVerification from '../components/teacher/CertificateVerification';
import ReportsSection from '../components/teacher/ReportsSection';
import TeacherProfile from '../components/teacher/TeacherProfile';
import AttendanceHistory from '../components/teacher/AttendanceHistory';
import AttendanceDetailsOverlay from '../components/teacher/AttendanceDetailsOverlay';
import StudentManagement from '../components/teacher/StudentManagement';
import Announcements from '../components/teacher/Announcements';
import UnifiedTeacherBot from '../components/teacher/UnifiedTeacherBot';

import LoadingOverlay from '../components/LoadingOverlay';

const TeacherDashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [collapsed, setCollapsed] = useState(false);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [metrics, setMetrics] = useState(null);
    const [assignedClasses, setAssignedClasses] = useState([]);
    const [expertise, setExpertise] = useState({ subjects: [], labs: [], skills: [] });
    const [notifications, setNotifications] = useState([]);

    const mockAttendanceData = [
        { day: 'Mon', rate: 85 },
        { day: 'Tue', rate: 82 },
        { day: 'Wed', rate: 88 },
        { day: 'Thu', rate: 84 },
        { day: 'Fri', rate: 90 },
    ];

    const mockPerformanceData = [
        { subject: 'DSA', avg: 15 },
        { subject: 'DBMS', avg: 14 },
        { subject: 'CN', avg: 16 },
    ];

    useEffect(() => {
        const startTime = Date.now();
        fetchDashboardData(startTime);
    }, []);

    const fetchDashboardData = async (startTime = Date.now()) => {
        const token = localStorage.getItem('attendease_token');
        if (!token) {
            window.location.href = '/login';
            return;
        }

        try {
            const [profileRes, metricsRes, assignedRes, expertiseRes, notificationsRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/teacher/profile`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(`${API_BASE_URL}/teacher/dashboard-metrics`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(`${API_BASE_URL}/teacher/assigned-classes`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(`${API_BASE_URL}/teacher/expertise`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(`${API_BASE_URL}/teacher/notifications`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            setUser(profileRes.data);
            setMetrics(metricsRes.data);
            setAssignedClasses(assignedRes.data || []);
            setExpertise(expertiseRes.data || { subjects: [], labs: [], skills: [] });
            setNotifications(notificationsRes.data || []);
        } catch (error) {
            console.error('Error fetching teacher data:', error);
            const basicUser = JSON.parse(localStorage.getItem('attendease_user'));
            setUser(basicUser);
        } finally {
            const endTime = Date.now();
            const elapsedTime = endTime - startTime;
            const minLoadingTime = 1200; // 1.2 seconds

            if (elapsedTime < minLoadingTime) {
                setTimeout(() => setLoading(false), minLoadingTime - elapsedTime);
            } else {
                setLoading(false);
            }
        }
    };

    if (loading) {
        return <LoadingOverlay message="Syncing Faculty Cloud..." />;
    }


    // Compute Unified Subjects (Official Assignments + Expertise)
    const expertiseIds = expertise.subjects.map(s => String(s.subject_id));
    const labExpertiseIds = expertise.labs.map(l => String(l.lab_id));
    
    // Start with all officially assigned classes (never filter these)
    const filteredAssigned = assignedClasses;
    
    const unifiedSubjects = filteredAssigned.map(s => ({
        ...s,
        unique_id: s.is_lab ? `lab_${s.subject_id}` : `sub_${s.subject_id || s.id}`
    }));
    
    // Add expertise subjects that are not currently assigned to any class
    expertise.subjects.forEach(expSub => {
        const subKey = `sub_${expSub.subject_id}`;
        if (!unifiedSubjects.some(s => s.unique_id === subKey)) {
            unifiedSubjects.push({
                subject_id: expSub.subject_id,
                unique_id: subKey,
                subject_name: expSub.subject_name,
                subject_code: expSub.subject_code,
                is_expertise_only: true,
                type: 'Theory'
            });
        }
    });

    // Add expertise labs to the unified subjects list
    expertise.labs.forEach(expLab => {
        const labKey = `lab_${expLab.lab_id}`;
        if (!unifiedSubjects.some(s => s.unique_id === labKey)) {
            unifiedSubjects.push({
                subject_id: expLab.lab_id,
                unique_id: labKey,
                subject_name: `${expLab.lab_name}`,
                subject_code: expLab.lab_code,
                is_expertise_only: true,
                type: 'Lab',
                is_lab: true
            });
        }
    });

    const unifiedLabs = expertise.labs;
    
    // Separate unified subjects into theory and labs for the dashboard cards
    const displayTheorySubjects = unifiedSubjects.filter(s => !s.is_lab);
    const displayLabs = unifiedSubjects.filter(s => s.is_lab);


    const renderContent = () => {
        switch (activeTab) {
            case 'overview':
                return (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        {/* Metrics Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                { label: 'Total Students', value: metrics?.totalStudents || 0, icon: '👨‍🎓', color: 'blue' },
                                { label: 'Active Subjects', value: unifiedSubjects.length, icon: '📚', color: 'indigo' },
                                { label: 'Avg Attendance', value: `${metrics?.averageAttendance || 0}%`, icon: '📊', color: 'green' },
                                { label: 'Attendance Alerts', value: metrics?.defaulterCount || 0, icon: '⚠️', color: 'red' },
                            ].map((stat, i) => (
                                <div key={i} className="bg-white dark:bg-slate-800 p-6 rounded-[24px] shadow-sm border border-slate-100 dark:border-white/10 hover:shadow-md transition-shadow group transition-colors">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                                            {stat.icon}
                                        </div>
                                        <span className="text-slate-400 bg-slate-50 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">Active</span>
                                    </div>
                                    <h3 className="text-3xl font-black text-slate-800 tracking-tight leading-none">{stat.value}</h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">{stat.label}</p>
                                </div>
                            ))}
                        </div>

                        {/* Charts Area */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white dark:bg-slate-800 p-8 rounded-[32px] border border-slate-100 dark:border-white/10 shadow-sm relative overflow-hidden group transition-colors">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-50 dark:bg-brand-500/10 rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-110 transition-transform duration-700"></div>
                                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-8 flex items-center gap-2 relative z-10">
                                    📈 Attendance Trend (Weekly)
                                </h3>
                                <div className="h-[250px] w-full relative z-10">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={mockAttendanceData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} dy={10} />
                                            <YAxis hide domain={[0, 100]} />
                                            <Tooltip 
                                                contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: 800, fontSize: '12px'}} 
                                                cursor={{stroke: '#6366f1', strokeWidth: 2}}
                                            />
                                            <Line type="monotone" dataKey="rate" stroke="#6366f1" strokeWidth={4} dot={{r: 6, fill: '#6366f1', strokeWidth: 0}} activeDot={{r: 8, strokeWidth: 0}} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-slate-800 p-8 rounded-[32px] border border-slate-100 dark:border-white/10 shadow-sm relative overflow-hidden group transition-colors">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 dark:bg-green-500/10 rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-110 transition-transform duration-700"></div>
                                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-8 flex items-center gap-2 relative z-10">
                                    📊 Class Performance (Average)
                                </h3>
                                <div className="h-[250px] w-full relative z-10">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={mockPerformanceData}>
                                            <XAxis dataKey="subject" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} dy={10} />
                                            <YAxis hide domain={[0, 20]} />
                                            <Tooltip 
                                                cursor={{fill: '#f8fafc'}}
                                                contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: 800, fontSize: '12px'}} 
                                            />
                                            <Bar dataKey="avg" radius={[10, 10, 0, 0]}>
                                                {mockPerformanceData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={['#6366f1', '#10b981', '#f59e0b'][index % 3]} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        {/* Your Subjects & Labs (Based on Expertise/Assignment) */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Assigned Subjects */}
                            <div className="bg-white dark:bg-slate-800 rounded-[40px] border border-slate-100 dark:border-white/10 shadow-sm overflow-hidden transition-all hover:shadow-md transition-colors">
                                <div className="px-8 py-6 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-white/10 flex justify-between items-center transition-colors">
                                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                                        📚 YOUR SUBJECTS (Assigned)
                                    </h3>
                                    <button 
                                        onClick={() => setActiveTab('profile')}
                                        className="text-[9px] font-black text-brand-500 uppercase tracking-widest hover:underline"
                                    >
                                        [Manage Expertise]
                                    </button>
                                </div>
                                <div className="p-0">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-[8px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest transition-colors">
                                                <th className="px-8 py-4">Subject</th>
                                                <th className="px-6 py-4">Div</th>
                                                <th className="px-6 py-4">Attendance</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                                            {displayTheorySubjects.length > 0 ? displayTheorySubjects.map((sub, i) => (
                                                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-8 py-5">
                                                        <div className="flex items-center gap-3">
                                                            <div>
                                                                <p className="text-[11px] font-black text-slate-800 dark:text-white uppercase leading-none transition-colors">{sub.subject_name}</p>
                                                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1">{sub.subject_code}</p>
                                                            </div>
                                                            {sub.is_expertise_only && (
                                                                <span className="px-2 py-0.5 bg-brand-50 text-brand-500 text-[7px] font-black uppercase tracking-widest rounded-md border border-brand-100">
                                                                    Expertise Matched
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <span className="text-[10px] font-black text-slate-600">
                                                            {sub.is_expertise_only ? 'N/A' : `${sub.year}-${sub.division}`}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] font-black text-slate-700 dark:text-slate-200 transition-colors">{sub.is_expertise_only ? '--' : '87.5%'}</span>
                                                            {!sub.is_expertise_only && <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr><td colSpan="3" className="px-8 py-10 text-center text-[10px] font-bold text-slate-300 italic">No expertise-matched subjects</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Assigned Labs */}
                            <div className="bg-white dark:bg-slate-800 rounded-[40px] border border-slate-100 dark:border-white/10 shadow-sm overflow-hidden transition-all hover:shadow-md transition-colors">
                                <div className="px-8 py-6 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-white/10 flex justify-between items-center transition-colors">
                                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                                        🔬 YOUR LABS (Assigned)
                                    </h3>
                                </div>
                                <div className="p-0">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-slate-50/50 text-[8px] font-black text-slate-400 uppercase tracking-widest">
                                                <th className="px-8 py-4">Lab Name</th>
                                                <th className="px-6 py-4">Batch</th>
                                                <th className="px-6 py-4">Schedule</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                                            {displayLabs.length > 0 ? displayLabs.map((lab, i) => (
                                                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-8 py-5">
                                                        <div className="flex items-center gap-3">
                                                            <div>
                                                                <p className="text-[11px] font-black text-slate-800 dark:text-white uppercase leading-none transition-colors">{lab.subject_name || lab.lab_name}</p>
                                                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1">{lab.subject_code || lab.lab_code}</p>
                                                            </div>
                                                            {lab.is_expertise_only && (
                                                                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-500 text-[7px] font-black uppercase tracking-widest rounded-md border border-indigo-100">
                                                                    Expertise Matched
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 transition-colors">
                                                            {lab.is_expertise_only ? 'N/A' : (lab.batch || 'A1')}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">
                                                            {lab.is_expertise_only ? 'Not Scheduled' : (lab.schedule || 'TBD')}
                                                        </span>
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr><td colSpan="3" className="px-8 py-10 text-center text-[10px] font-bold text-slate-300 italic">No expertise-matched labs</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Attendance Alerts Section */}
                        <div className="bg-red-50 dark:bg-red-500/10 rounded-[40px] border border-red-100 dark:border-red-500/20 p-10 relative overflow-hidden group transition-colors">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-red-100 rounded-full -mr-32 -mt-32 opacity-50 group-hover:scale-110 transition-transform duration-700"></div>
                            <h3 className="text-xs font-black text-red-800 uppercase tracking-widest mb-8 flex items-center gap-3 relative z-10">
                                ⚠️ ATTENDANCE ALERTS (Across Your Subjects)
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                                {[
                                    { subject: 'Data Structures & Algorithms', div: 'CSE-A', alert: '6 students below 75%', color: 'border-red-200 dark:border-red-500/30 bg-white dark:bg-slate-800' },
                                    { subject: 'Database Management Systems', div: 'IT-A', alert: '8 students below 75%', color: 'border-red-200 dark:border-red-500/30 bg-white dark:bg-slate-800' },
                                    { subject: 'Computer Networks', div: 'CSE-A', alert: '3 students below 75%', color: 'border-red-200 dark:border-red-500/30 bg-white dark:bg-slate-800' }
                                ].map((alert, i) => (
                                    <div key={i} className={`p-6 rounded-3xl border ${alert.color} shadow-sm hover:shadow-md transition-shadow cursor-pointer`}>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{alert.subject} ({alert.div})</p>
                                        <p className="font-black text-red-600 text-sm">{alert.alert}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            case 'mark-attendance':
                return <AttendanceManager subjects={unifiedSubjects} user={user} />;
            case 'marks':
                return <MarksEntry assignedClasses={unifiedSubjects} />;
            case 'syllabus':
                return <SyllabusTracker assignedClasses={unifiedSubjects} items={unifiedLabs} />;
            case 'students':
                return <StudentManagement teacherSubjects={unifiedSubjects} />;
            case 'certificates':
                return <CertificateVerification />;
            case 'reports':
                return <ReportsSection assignedClasses={unifiedSubjects} labs={unifiedLabs} />;
            case 'history':
                return <AttendanceHistory teacherSubjects={unifiedSubjects} />;
            case 'announcements':
                return <Announcements assignedClasses={unifiedSubjects} user={user} />;
            case 'profile':
                return <TeacherProfile subjects={unifiedSubjects} onProfileUpdate={fetchDashboardData} />;
            default:
                return <div>Module Under Development</div>;
        }
    };

    const handleClearNotifications = async () => {
        try {
            const token = localStorage.getItem('attendease_token');
            await axios.post(`${API_BASE_URL}/teacher/clear-notifications`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications([]);
        } catch (error) {
            console.error('Failed to clear notifications:', error);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex transition-colors duration-300">
            <TeacherSidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                collapsed={collapsed}
                setCollapsed={setCollapsed}
            />

            <div className={`flex-1 flex flex-col transition-all duration-300 ${collapsed ? 'ml-20' : 'ml-64'}`}>
                <TeacherTopBar 
                    user={user} 
                    notifications={notifications} 
                    setActiveTab={setActiveTab}
                    onClearNotifications={handleClearNotifications}
                />

                <main className="flex-1 p-8 overflow-y-auto custom-scrollbar">
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {renderContent()}
                    </div>
                </main>
 
                <UnifiedTeacherBot 
                    assignedClasses={unifiedSubjects} 
                    setActiveTab={setActiveTab}
                />
 
                <footer className="p-8 text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-white/10 italic transition-colors">
                    SSBT College of Engineering & Technology, Jalgaon • Faculty Portal v2.0
                </footer>
            </div>
        </div>
    );
};

export default TeacherDashboard;
