import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  ClipboardList, Search, Filter, Download, 
  ChevronRight, ChevronLeft, Calendar, Users, BarChart3, 
  Loader2, CheckCircle2, XCircle, AlertTriangle,
  Clock, MapPin, Eye, FileSpreadsheet, FileJson, Trash2,
  TrendingUp, TrendingDown, LayoutGrid
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar, Cell 
} from 'recharts';

import AttendanceDetailsOverlay from './AttendanceDetailsOverlay';
import { API_BASE_URL } from '../../config/apiConfig';

const AttendanceHistory = ({ teacherSubjects }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    subject_id: '',
    division: '',
    year: '',
    department: '',
    startDate: '',
    endDate: '',
    status: ''
  });
  const [selectedSession, setSelectedSession] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [viewMode, setViewMode] = useState('students'); // 'list', 'analytics', 'calendar', 'students'
  const [studentReport, setStudentReport] = useState([]);
  const [fetchingReport, setFetchingReport] = useState(false);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [fetchingAnalytics, setFetchingAnalytics] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleLoadData = () => {
    fetchHistory();
    if (filters.subject_id && filters.year && filters.division) {
      fetchStudentReport();
    }
    if (viewMode === 'analytics' && filters.subject_id && filters.division) {
      fetchAnalytics();
    }
  };

  const fetchAnalytics = async () => {
    setFetchingAnalytics(true);
    try {
      const token = localStorage.getItem('attendease_token');
      const params = new URLSearchParams({
        subject_id: filters.subject_id,
        division: filters.division
      });
      
      const res = await axios.get(`${API_BASE_URL}/attendance/analytics?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnalyticsData(res.data);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setFetchingAnalytics(false);
    }
  };

  const fetchStudentReport = async () => {
    setFetchingReport(true);
    try {
      const token = localStorage.getItem('attendease_token');
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => { if (v) params.append(k, v); });
      
      const res = await axios.get(`${API_BASE_URL}/attendance/consolidated-report?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudentReport(res.data);
    } catch (error) {
      console.error("Error fetching student report:", error);
    } finally {
      setFetchingReport(false);
    }
  };

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('attendease_token');
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => { if (v) params.append(k, v); });
      
      const res = await axios.get(`${API_BASE_URL}/attendance/history?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSessions(res.data);
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setLoading(false);
    }
  };

  const groupSessionsByDate = (sessionsList) => {
    return sessionsList.reduce((acc, session) => {
      const date = new Date(session.date).toLocaleDateString('en-US', { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
      });
      if (!acc[date]) acc[date] = [];
      acc[date].push(session);
      return acc;
    }, {});
  };

  const getStatusColor = (rate) => {
    if (rate >= 90) return 'text-emerald-500 bg-emerald-50';
    if (rate >= 75) return 'text-amber-500 bg-amber-50';
    return 'text-red-500 bg-red-50';
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Subject', 'Year', 'Div', 'Type', 'Room', 'Present', 'Total', 'Percentage'];
    const rows = sessions.map(s => [
      new Date(s.date).toLocaleDateString(),
      s.subject_name,
      s.year,
      s.division,
      s.lecture_type,
      s.room_number || 'N/A',
      s.present_count,
      s.total_students,
      ((s.present_count / s.total_students) * 100).toFixed(1) + '%'
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `SSBT_Attendance_History_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  const exportStudentCSV = () => {
    if (studentReport.length === 0) return;
    const headers = ['Roll No', 'Name', 'PRN', 'Present', 'Total', 'Percentage'];
    const rows = studentReport.map(s => [
      s.roll_number || 'N/A',
      s.name,
      s.prn_number || 'N/A',
      s.present_count,
      s.total_sessions,
      s.percentage + '%'
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Student_Attendance_Report_${filters.year}_${filters.division}_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const navigateMonth = (direction) => {
    setCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() + direction, 1));
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(calendarDate);
    const firstDay = getFirstDayOfMonth(calendarDate);
    const days = [];
    
    // Previous month padding
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`pad-${i}`} className="h-32 bg-slate-50/30 dark:bg-slate-800/10 rounded-2xl"></div>);
    }

    // Sessions map for easy lookup
    const sessionMap = sessions.reduce((acc, s) => {
      const d = new Date(s.date).toISOString().split('T')[0];
      if (!acc[d]) acc[d] = { present: 0, total: 0, count: 0, sessions: [] };
      acc[d].present += s.present_count;
      acc[d].total += s.total_students;
      acc[d].count += 1;
      acc[d].sessions.push(s);
      return acc;
    }, {});

    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${calendarDate.getFullYear()}-${String(calendarDate.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const dayData = sessionMap[dateStr];
      const isToday = new Date().toISOString().split('T')[0] === dateStr;

      days.push(
        <div 
          key={i} 
          className={`h-32 p-4 rounded-2xl border transition-all relative group ${
            dayData 
              ? 'bg-white dark:bg-slate-500 border-brand-100 dark:border-brand-500/20 shadow-sm hover:shadow-md cursor-pointer' 
              : 'bg-white dark:bg-slate-500 border-slate-100 dark:border-white/5 opacity-80'
          } ${isToday ? 'ring-2 ring-brand-500 ring-offset-2 dark:ring-offset-slate-900' : ''}`}
          onClick={() => {
            if (dayData && dayData.sessions.length > 0) {
              setSelectedSession(dayData.sessions[0]);
              setShowDetails(true);
            }
          }}
        >
          <span className={`text-xs font-black ${isToday ? 'text-brand-500' : 'text-slate-400'}`}>{i}</span>
          
          {dayData && (
            <div className="mt-2 space-y-2">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-500"></div>
                <span className="text-[10px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                  {dayData.count} {dayData.count === 1 ? 'Session' : 'Sessions'}
                </span>
              </div>
              <div className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Present</p>
                <p className="text-xs font-black text-brand-600 dark:text-brand-400">
                  {dayData.present} <span className="text-[10px] text-slate-400">/ {dayData.total}</span>
                </p>
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">
              {calendarDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h2>
            <div className="flex items-center bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-white/10 p-1">
              <button 
                onClick={() => navigateMonth(-1)}
                className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-brand-500 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setCalendarDate(new Date())}
                className="px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-brand-500 transition-colors"
              >
                Today
              </button>
              <button 
                onClick={() => navigateMonth(1)}
                className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-brand-500 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-brand-500"></div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sessions Logged</span>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="text-center py-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{d}</span>
            </div>
          ))}
          {days}
        </div>
      </div>
    );
  };

  const renderAnalytics = () => {
    if (!filters.subject_id || !filters.division) {
      return (
        <div className="bg-white dark:bg-slate-900 rounded-[40px] p-20 text-center border-2 border-dashed border-slate-100 dark:border-white/10 transition-colors">
          <BarChart3 className="w-20 h-20 text-slate-200 mx-auto mb-6" />
          <h3 className="text-xl font-black text-slate-800">Select Filters for Analytics</h3>
          <p className="text-slate-400 text-xs mt-2 max-w-sm mx-auto font-bold leading-relaxed">
            Please select a Subject and Division to view the attendance performance dashboard.
          </p>
        </div>
      );
    }

    if (fetchingAnalytics) {
      return (
        <div className="h-96 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-brand-500" />
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Syncing Analytics...</p>
        </div>
      );
    }

    const avgRate = analyticsData?.trend?.length > 0 
      ? (analyticsData.trend.reduce((acc, curr) => acc + parseFloat(curr.attendance_rate), 0) / analyticsData.trend.length).toFixed(1)
      : 0;

    return (
      <div className="space-y-8 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-white/10 shadow-sm transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500">
                <TrendingUp className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded-lg">+12% vs Last Month</span>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Average Attendance</p>
            <h4 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight">{avgRate}%</h4>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-white/10 shadow-sm transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-500">
                <ClipboardList className="w-6 h-6" />
              </div>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Total Sessions</p>
            <h4 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight">{analyticsData?.trend?.length || 0}</h4>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-white/10 shadow-sm transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500">
                <Users className="w-6 h-6" />
              </div>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Students Tracked</p>
            <h4 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight">{analyticsData?.distribution?.length || 0}</h4>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-white/10 shadow-sm transition-colors">
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">Attendance Trend</h3>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-brand-500"></span>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Success Rate (%)</span>
              </div>
            </div>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analyticsData?.trend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="date_label" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}}
                    domain={[0, 100]}
                  />
                  <Tooltip 
                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                    labelStyle={{fontWeight: 900, marginBottom: '4px'}}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="attendance_rate" 
                    stroke="#0ea5e9" 
                    strokeWidth={4} 
                    dot={{fill: '#0ea5e9', strokeWidth: 2, r: 4}}
                    activeDot={{r: 6, strokeWidth: 0}}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-white/10 shadow-sm transition-colors">
            <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest mb-10">Student Distribution</h3>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData?.distribution?.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 8, fontWeight: 900}}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}}
                    domain={[0, 100]}
                  />
                  <Tooltip 
                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                  />
                  <Bar dataKey="rate" radius={[6, 6, 0, 0]} barSize={24}>
                    {analyticsData?.distribution?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={parseFloat(entry.rate) < 75 ? '#ef4444' : '#0ea5e9'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const handleDeleteSession = async (sessionId) => {
    if (!window.confirm("Are you sure you want to delete this session? This will permanently remove all attendance records for this lecture.")) {
      return;
    }

    try {
      const token = localStorage.getItem('attendease_token');
      await axios.delete(`${API_BASE_URL}/attendance/session/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchHistory();
    } catch (error) {
      console.error("Error deleting session:", error);
      alert(error.response?.data?.message || "Failed to delete session");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3 transition-colors">
            <ClipboardList className="w-10 h-10 text-brand-500" /> Attendance History
          </h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">
            Analyze, Edit, and Manage your Faculty Records
          </p>
        </div>
        
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-1.5 rounded-2xl shadow-sm border border-slate-100 dark:border-white/10 transition-colors">
          {[
            { id: 'students', label: 'Student Report', icon: Users },
            { id: 'calendar', label: 'Calendar', icon: Calendar },
            { id: 'analytics', label: 'Analytics', icon: BarChart3 },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setViewMode(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                viewMode === tab.id 
                  ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20 scale-105' 
                  : 'text-slate-400 hover:text-brand-500 hover:bg-slate-50'
              }`}
            >
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Bar */}
    <div className="bg-white dark:bg-slate-900 rounded-[32px] p-6 shadow-xl shadow-slate-200/50 border border-slate-100 dark:border-white/10 relative overflow-hidden transition-colors">
        <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 dark:bg-slate-800/50 rounded-full -mr-16 -mt-16 opacity-50"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 relative z-10">
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Subject</label>
            <select 
              value={filters.subject_id}
              onChange={(e) => setFilters(p => ({...p, subject_id: e.target.value}))}
              className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-white/5 rounded-xl px-4 py-2.5 font-bold text-slate-700 dark:text-white outline-none focus:border-brand-500 transition-all text-xs"
            >
              <option value="">All Subjects</option>
              {Array.from(new Map(teacherSubjects?.map(s => [s.unique_id, s])).values()).map(s => (
                <option key={s.unique_id} value={s.subject_id}>{s.is_lab ? `[LAB] ` : ''}{s.subject_name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Year</label>
            <select 
              value={filters.year}
              onChange={(e) => setFilters(p => ({...p, year: e.target.value}))}
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-2.5 font-bold text-slate-700 outline-none focus:border-brand-500 transition-all text-xs"
            >
              <option value="">All Years</option>
              {['FE', 'SE', 'TE', 'BE'].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Div</label>
            <select 
              value={filters.division}
              onChange={(e) => setFilters(p => ({...p, division: e.target.value}))}
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-2.5 font-bold text-slate-700 outline-none focus:border-brand-500 transition-all text-xs"
            >
              <option value="">All</option>
              {['A', 'B', 'C', 'D'].map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Status</label>
            <select 
              value={filters.status}
              onChange={(e) => setFilters(p => ({...p, status: e.target.value}))}
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-2.5 font-bold text-slate-700 outline-none focus:border-brand-500 transition-all text-xs"
            >
              <option value="">All Sessions</option>
              <option value="completed">Completed</option>
              <option value="active">Live</option>
              <option value="edited">Edited</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="space-y-1.5 lg:col-span-2 flex items-end gap-3">
             <div className="flex-1 space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Custom Range</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="date"
                    onChange={(e) => setFilters(p => ({...p, startDate: e.target.value}))}
                    className="flex-1 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-white/5 rounded-xl px-4 py-2.5 font-bold text-slate-700 dark:text-white outline-none focus:border-brand-500 text-[10px]" 
                  />
                  <span className="text-slate-300">to</span>
                  <input 
                    type="date"
                    onChange={(e) => setFilters(p => ({...p, endDate: e.target.value}))}
                    className="flex-1 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-white/5 rounded-xl px-4 py-2.5 font-bold text-slate-700 dark:text-white outline-none focus:border-brand-500 text-[10px]" 
                  />
                </div>
             </div>
             <div className="flex gap-2">
                <button 
                  onClick={() => setFilters({subject_id:'', division:'', year: '', department:'', startDate:'', endDate:'', status:''})}
                  className="px-5 py-3 bg-slate-100 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-colors h-12"
                >
                    Reset
                </button>
             </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-brand-500" />
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Filtering Records...</p>
        </div>
      ) : (
        <>
          {viewMode === 'list' && (
            <div className="space-y-10 pb-20">
              <div className="flex items-center justify-between px-4">
                 <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Recent Attendance Sessions</h2>
                 <div className="flex items-center gap-4">
                    <button 
                      onClick={handleLoadData}
                      className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-brand-500/20 hover:scale-105 transition-all mr-2"
                    >
                      <Search className="w-3.5 h-3.5" /> Load Data
                    </button>
                    <button onClick={exportToCSV} className="flex items-center gap-2 text-[10px] font-black text-brand-500 uppercase tracking-widest hover:underline">
                      <FileSpreadsheet className="w-4 h-4" /> Export CSV
                    </button>
                    <button className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">
                      <Download className="w-4 h-4" /> PDF Report
                    </button>
                 </div>
              </div>

              {sessions.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-[40px] p-20 text-center border-2 border-dashed border-slate-100 dark:border-white/10 transition-colors">
                  <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-300">
                    <Search className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-black text-slate-800 tracking-tight">No sessions found</h3>
                  <p className="text-slate-400 text-xs font-bold mt-2">Try adjusting your filters to find the required records</p>
                </div>
              ) : (
                Object.entries(groupSessionsByDate(sessions)).map(([date, sessionsGroup]) => (
                  <div key={date} className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="h-px flex-1 bg-slate-100"></div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-4 py-1.5 bg-white border border-slate-100 rounded-full shadow-sm">{date}</span>
                      <div className="h-px flex-1 bg-slate-100"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {sessionsGroup.map(s => {
                        const rate = ((s.present_count / s.total_students) * 100) || 0;
                        return (
                          <div key={s.id} className="bg-white dark:bg-slate-900 rounded-[32px] p-6 border border-slate-100 dark:border-white/10 shadow-sm hover:shadow-xl transition-all duration-300 group transition-colors">
                            <div className="flex items-start justify-between mb-6">
                              <div className="flex gap-4">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform ${getStatusColor(rate)}`}>
                                  <Users className="w-6 h-6" />
                                </div>
                                <div>
                                  <h4 className="text-lg font-black text-slate-800 tracking-tight group-hover:text-brand-500 transition-colors">{s.subject_name}</h4>
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-2">
                                     <span className="px-2 py-0.5 bg-slate-100 rounded-md text-slate-600">{s.subject_code}</span> 
                                     • {s.year}-{s.division} • {s.lecture_type || 'Theory'}
                                  </p>
                                </div>
                              </div>
                              <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-2 py-1 rounded-lg ${
                                s.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 
                                s.status === 'edited' ? 'bg-indigo-50 text-indigo-600' :
                                s.status === 'active' ? 'bg-brand-50 text-brand-500 animate-pulse' : 'bg-slate-50 text-slate-400'
                              }`}>
                                {s.status}
                              </span>
                            </div>

                            <div className="grid grid-cols-3 gap-4 mb-6">
                              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-white/5">
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 items-center flex gap-1"><Clock className="w-3 h-3" /> Time</p>
                                <p className="text-xs font-bold text-slate-700">{s.start_time?.substring(0, 5)} - {s.end_time?.substring(0, 5) || '...'}</p>
                              </div>
                              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-white/5">
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 items-center flex gap-1"><Users className="w-3 h-3" /> Present</p>
                                <p className="text-xs font-bold text-slate-700">{s.present_count}/{s.total_students}</p>
                              </div>
                              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-white/5">
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 items-center flex gap-1"><BarChart3 className="w-3 h-3" /> Percentage</p>
                                <p className={`text-xs font-black ${rate < 75 ? 'text-red-500' : 'text-emerald-500'}`}>{rate.toFixed(1)}%</p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between">
                               <div className="flex items-center gap-1.5">
                                  <MapPin className="w-3 h-3 text-slate-400" />
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Room {s.room_number || '201'}</span>
                               </div>
                               <div className="flex items-center gap-2">
                                  <button 
                                    onClick={() => handleDeleteSession(s.id)}
                                    className="flex items-center justify-center w-10 h-10 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all hover:scale-105 active:scale-95 border border-red-100 group/del"
                                    title="Delete Session"
                                  >
                                    <Trash2 className="w-4 h-4 transition-transform group-hover/del:rotate-12" />
                                  </button>
                                  <button 
                                    onClick={() => {
                                      setSelectedSession(s);
                                      setShowDetails(true);
                                    }}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-slate-900/10 hover:bg-brand-500 hover:shadow-brand-500/20 transition-all hover:scale-105 active:scale-95"
                                  >
                                    <Eye className="w-4 h-4" /> View Details
                                  </button>
                               </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {viewMode === 'analytics' && renderAnalytics()}

          {viewMode === 'students' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between px-4">
                 <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Consolidated Student Attendance</h2>
                 <div className="flex items-center gap-4">
                    <button 
                      onClick={handleLoadData}
                      className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-brand-500/20 hover:scale-105 transition-all mr-2"
                    >
                      <Search className="w-3.5 h-3.5" /> Load Data
                    </button>
                    <button onClick={exportStudentCSV} className="flex items-center gap-2 text-[10px] font-black text-brand-500 uppercase tracking-widest hover:underline">
                      <FileSpreadsheet className="w-4 h-4" /> Export Student CSV
                    </button>
                 </div>
              </div>

              {!filters.subject_id || !filters.year || !filters.division ? (
                <div className="bg-white dark:bg-slate-900 rounded-[40px] p-20 text-center border-2 border-dashed border-slate-100 dark:border-white/10">
                   <Users className="w-20 h-20 text-slate-200 mx-auto mb-6" />
                   <h3 className="text-xl font-black text-slate-800">Select Filters to Generate Report</h3>
                   <p className="text-slate-400 text-xs mt-2 font-bold">Please select Subject, Year, and Division to view student-wise attendance.</p>
                </div>
              ) : fetchingReport ? (
                <div className="h-64 flex flex-col items-center justify-center space-y-4">
                  <Loader2 className="w-12 h-12 animate-spin text-brand-500" />
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Generating Report...</p>
                </div>
              ) : studentReport.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-[40px] p-20 text-center border border-slate-100">
                   <Search className="w-20 h-20 text-slate-200 mx-auto mb-6" />
                   <h3 className="text-xl font-black text-slate-800">No students found</h3>
                   <p className="text-slate-400 text-xs mt-2 font-bold">No students matched the selected criteria in the database.</p>
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 rounded-[32px] overflow-hidden border border-slate-100 dark:border-white/10 shadow-sm transition-colors">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50/50 dark:bg-slate-800/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-white/10">
                        <th className="px-8 py-6">Roll No</th>
                        <th className="px-8 py-6">Student Name</th>
                        <th className="px-8 py-6">PRN Number</th>
                        <th className="px-8 py-6 text-center">Sessions</th>
                        <th className="px-8 py-6 text-right">Attendance %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                      {studentReport.map(student => (
                        <tr key={student.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="px-8 py-5 text-sm font-black text-slate-700 dark:text-slate-200">{student.roll_number || 'N/A'}</td>
                          <td className="px-8 py-5">
                            <p className="text-sm font-black text-slate-800 dark:text-white leading-none">{student.name}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1.5">Active Student</p>
                          </td>
                          <td className="px-8 py-5 text-xs font-bold text-slate-500 dark:text-slate-400">{student.prn_number || 'N/A'}</td>
                          <td className="px-8 py-5 text-center">
                            <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-xs font-black text-slate-700 dark:text-slate-300">
                              {student.present_count}/{student.total_sessions}
                            </span>
                          </td>
                          <td className="px-8 py-5 text-right">
                            <span className={`text-sm font-black ${parseFloat(student.percentage) < 75 ? 'text-red-500' : 'text-emerald-500'}`}>
                              {student.percentage}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
          {viewMode === 'calendar' && renderCalendar()}
        </>
      )}

      {/* Details Overlay */}
      {showDetails && selectedSession && (
        <AttendanceDetailsOverlay 
          session={selectedSession} 
          onClose={() => setShowDetails(false)}
          onUpdate={fetchHistory}
        />
      )}
    </div>
  );
};

export default AttendanceHistory;
