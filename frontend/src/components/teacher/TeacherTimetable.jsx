import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/apiConfig';
import { 
    Calendar as CalendarIcon, Clock, MapPin, 
    BookOpen, Users, ChevronLeft, ChevronRight,
    Printer, Download, Filter, GraduationCap, LayoutGrid,
    List, BarChart2, RefreshCw, Info, CheckCircle
} from 'lucide-react';

// Sub-components
import WeeklyGridView from './timetable/WeeklyGridView';
import DailyScheduleView from './timetable/DailyScheduleView';
import ListScheduleView from './timetable/ListScheduleView';
import CalendarScheduleView from './timetable/CalendarScheduleView';
import WorkloadAnalytics from './timetable/WorkloadAnalytics';
import TeachingSummary from './timetable/TeachingSummary';
import SubstitutionManager from './timetable/SubstitutionManager';

const TeacherTimetable = () => {
    const [view, setView] = useState('weekly'); // weekly, daily, list, calendar, workload, substitution
    const [timetableData, setTimetableData] = useState([]);
    const [todaySchedule, setTodaySchedule] = useState([]);
    const [workload, setWorkload] = useState({});
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('attendease_token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            
            const [profileRes, timetableRes, todayRes, workloadRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/teacher/profile`, config),
                axios.get(`${API_BASE_URL}/timetable/teacher/my-timetable`, config),
                axios.get(`${API_BASE_URL}/timetable/teacher/today`, config),
                axios.get(`${API_BASE_URL}/timetable/teacher/workload`, config)
            ]);

            setUser(profileRes.data);
            setTimetableData(timetableRes.data);
            setTodaySchedule(todayRes.data);
            setWorkload(workloadRes.data);
        } catch (error) {
            console.error('Error fetching teacher timetable data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = (type, data) => {
        console.log(`Action: ${type}`, data);
        if (type === 'attendance') {
            // In a real app, this might navigate to the attendance Hub
            window.location.hash = '#mark-attendance';
        }
    };

    const renderView = () => {
        switch (view) {
            case 'daily': return <DailyScheduleView schedule={todaySchedule} onAction={handleAction} />;
            case 'list': return <ListScheduleView timetable={timetableData} onAction={handleAction} />;
            case 'calendar': return <CalendarScheduleView timetable={timetableData} />;
            case 'workload': return <WorkloadAnalytics workload={workload} />;
            case 'substitution': return <SubstitutionManager user={user} />;
            default: return <WeeklyGridView timetable={timetableData} onAction={handleAction} />;
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header & Main Controls */}
            <div className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-sm flex flex-col lg:flex-row justify-between items-center gap-6">
                <div className="space-y-2 text-center lg:text-left">
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center justify-center lg:justify-start gap-3 uppercase">
                        <CalendarIcon className="text-brand-500 w-8 h-8" /> My Timetable
                    </h2>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                        {user?.name || 'Prof. Shital A. Patil'} • Academic Year 2025-26 (Term II)
                    </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3">
                    <div className="flex items-center gap-1 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                        {[
                            { id: 'weekly', label: 'Weekly Grid', icon: LayoutGrid },
                            { id: 'daily', label: 'Daily', icon: Clock },
                            { id: 'list', label: 'List', icon: List },
                            { id: 'calendar', label: 'Calendar', icon: CalendarIcon }
                        ].map(t => (
                            <button
                                key={t.id}
                                onClick={() => setView(t.id)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                    view === t.id 
                                        ? 'bg-slate-900 text-white shadow-lg' 
                                        : 'text-slate-500 hover:bg-slate-100'
                                }`}
                            >
                                <t.icon className="w-3.5 h-3.5" /> {t.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex gap-2">
                        <button className="p-3 bg-white border border-slate-200 text-slate-600 rounded-2xl hover:bg-slate-50 transition-all shadow-sm">
                            <Download className="w-4 h-4" />
                        </button>
                        <button className="p-3 bg-brand-500 text-white rounded-2xl shadow-lg shadow-brand-500/20 hover:scale-105 transition-all">
                            <Printer className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Quick Summary Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Weekly Workload', value: `${workload.total_hours || 0} Hours`, icon: BarChart2, color: 'indigo', action: 'workload' },
                    { label: 'Assigned Classes', value: workload.subjects?.length || 0, icon: BookOpen, color: 'brand', action: 'weekly' },
                    { label: 'Sub. Requests', value: '0 Pending', icon: RefreshCw, color: 'amber', action: 'substitution' }
                ].map((stat, i) => (
                    <button 
                        key={i}
                        onClick={() => setView(stat.action)}
                        className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-brand-200 hover:shadow-md transition-all active:scale-[0.98]"
                    >
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 bg-${stat.color}-50 rounded-2xl flex items-center justify-center text-${stat.color}-500 group-hover:scale-110 transition-transform`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                            <div className="text-left">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{stat.label}</p>
                                <h4 className="text-xl font-black text-slate-800 tracking-tight">{stat.value}</h4>
                            </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-brand-500 transition-all" />
                    </button>
                ))}
            </div>

            {/* View Container */}
            <div className="relative min-h-[500px]">
                {loading && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center rounded-[40px]">
                        <div className="w-12 h-12 border-4 border-slate-200 border-t-brand-500 rounded-full animate-spin"></div>
                        <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Compiling Schedule...</p>
                    </div>
                )}
                {renderView()}
            </div>

            {/* Teaching Summary Deep-Dive */}
            {view !== 'substitution' && view !== 'workload' && (
                <TeachingSummary 
                    profile={user || {}} 
                    subjects={timetableData} 
                    workload={workload} 
                />
            )}

            {/* Branding Footer */}
            <div className="bg-slate-50 rounded-[32px] p-8 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left border border-slate-100">
                <div className="space-y-1">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Timezone / Location</p>
                   <p className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                       📍 SSBT COET Campus, Jalgaon • Faculty Portal
                   </p>
                </div>
                <div className="flex items-center gap-6">
                   <div className="text-right hidden md:block">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Need Help?</p>
                      <p className="text-[10px] font-black text-brand-500">Contact Timetable Coordinator</p>
                   </div>
                   <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 border border-slate-200">
                      <Info className="w-5 h-5" />
                   </div>
                </div>
            </div>
        </div>
    );
};

export default TeacherTimetable;

