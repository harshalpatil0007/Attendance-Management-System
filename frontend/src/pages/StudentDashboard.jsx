import { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2 } from 'lucide-react';
import { API_BASE_URL } from '../config/apiConfig';

// Main Components
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';

// Dashboard Sections
import Overview from '../components/dashboard/Overview';
import ProfileSection from '../components/dashboard/ProfileSection';
import ISEMarksSection from '../components/dashboard/ISEMarksSection';
import AttendanceAnalysis from '../components/dashboard/AttendanceAnalysis';
import CertificateManager from '../components/dashboard/CertificateManager';
import TopicsTracker from '../components/dashboard/TopicsTracker';
import AttendanceMarker from '../components/dashboard/AttendanceMarker';
import StudentNotifications from '../components/student/StudentNotifications';

import LoadingOverlay from '../components/LoadingOverlay';

const StudentDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);

  // Data States
  const [user, setUser] = useState(null);
  const [fullProfile, setFullProfile] = useState(null);
  const [marks, setMarks] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState([]);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [syllabus, setSyllabus] = useState([]);
  const [subjectsList, setSubjectsList] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const startTime = Date.now();
    fetchDashboardData(startTime);
  }, []);

  const fetchDashboardData = async (startTime = Date.now()) => {
    const token = localStorage.getItem('attendease_token');
    const basicUser = JSON.parse(localStorage.getItem('attendease_user'));

    if (!token || !basicUser) {
      window.location.href = '/login';
      return;
    }

    try {
      // 1. Get Auth Profile First
      const authRes = await axios.get(`${API_BASE_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(authRes.data);

      const identifier = authRes.data.id || authRes.data.prn_number || basicUser.id;

      // 2. Fetch all other data in parallel (Harden with allSettled)
      const results = await Promise.allSettled([
        axios.get(`${API_BASE_URL}/student/profile/me`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE_URL}/student/marks/${identifier}`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE_URL}/attendance/student`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE_URL}/student/certificates/${authRes.data.id}`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE_URL}/student/syllabus/all`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE_URL}/attendance/subjects`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE_URL}/student/notifications`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      // Map results safely
      const [
        profileRes, marksRes,
        attendanceRes, certRes, syllabusRes, subjectsRes, notificationsRes
      ] = results.map(r => r.status === 'fulfilled' ? r.value : { data: [] });

      // Fallback: If full profile failed, use what we have from authRes
      setFullProfile(profileRes.data || { ...authRes.data, bio: 'Student at SSBTCOET Jalgaon' });

      setMarks(marksRes.data || []);
      setAttendanceStats(attendanceRes.data?.stats || []);
      setAttendanceHistory(attendanceRes.data?.history || []);
      setCertificates(certRes.data || []);
      setSyllabus(syllabusRes.data || []);
      setSubjectsList(subjectsRes.data || []);
      setNotifications(notificationsRes.data || []);

    } catch (error) {
      console.error("Dashboard critical fetch error:", error);
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
    return <LoadingOverlay message="Syncing Academic Data..." />;
  }


  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <Overview user={user} stats={attendanceStats} setActiveTab={setActiveTab} />;
      case 'profile':
        return <ProfileSection user={fullProfile} refreshUser={fetchDashboardData} />;
      case 'marks':
        return <ISEMarksSection marks={marks} />;
      case 'attendance':
      case 'analysis':
        return <AttendanceAnalysis stats={attendanceStats} history={attendanceHistory} />;
      case 'certificates':
        return <CertificateManager certificates={certificates} studentId={user.id} refreshData={fetchDashboardData} />;
      case 'syllabus':
        return <TopicsTracker syllabus={syllabus} />;
      case 'mark-attendance':
        return <AttendanceMarker subjects={subjectsList} fetchDashboardData={fetchDashboardData} />;
      case 'notifications':
        return <StudentNotifications />;
      case 'settings':
        return (
          <div className="bg-white dark:bg-slate-900 p-10 rounded-3xl border border-dotted border-slate-300 dark:border-white/10 flex flex-col items-center justify-center text-slate-400 transition-colors">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4 transition-colors">⚙️</div>
            <p className="font-bold flex items-center gap-2 italic text-slate-600 dark:text-slate-400">Account settings coming soon...</p>
          </div>
        );
      default:
        return <Overview user={user} stats={attendanceStats} setActiveTab={setActiveTab} />;
    }
  };

  const handleClearNotifications = async () => {
    try {
      const token = localStorage.getItem('attendease_token');
      await axios.post(`${API_BASE_URL}/student/clear-notifications`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications([]);
    } catch (error) {
      console.error('Failed to clear notifications:', error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex transition-colors duration-300">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      <div className={`flex-1 flex flex-col transition-all duration-300 ${collapsed ? 'ml-20' : 'ml-64'}`}>
        <TopBar 
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

        <footer className="p-8 text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-white/10 transition-colors">
          © 2026 SSBTCOET Jalgaon • Attendance Management System • v2.0-Alpha
        </footer>
      </div>
    </div>
  );
};

export default StudentDashboard;
