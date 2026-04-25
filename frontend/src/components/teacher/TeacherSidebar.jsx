import {
  LayoutDashboard, User, BookOpen, Calendar,
  CheckSquare, FileBadge, LifeBuoy, Settings,
  LogOut, ChevronLeft, ChevronRight, BarChart3,
  Users, Bell, Megaphone, ClipboardList
} from 'lucide-react';
import { Link } from 'react-router-dom';

const TeacherSidebar = ({ activeTab, setActiveTab, collapsed, setCollapsed }) => {
  const menuItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'mark-attendance', label: 'Mark Attendance', icon: CheckSquare },
    { id: 'history', label: 'Attendance History', icon: ClipboardList },
    { id: 'marks', label: 'ISE Marks Entry', icon: BookOpen },
    { id: 'syllabus', label: 'Syllabus Tracker', icon: LifeBuoy },
    { id: 'students', label: 'My Students', icon: Users },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'announcements', label: 'Announcements', icon: Megaphone },
  ];

  return (
    <div className={`fixed left-0 top-0 h-full bg-slate-900 text-slate-300 transition-all duration-300 z-50 shadow-2xl flex flex-col ${collapsed ? 'w-20' : 'w-64'}`}>
      <div className="flex items-center justify-between p-6 border-b border-slate-800">
        {!collapsed && (
          <Link to="/" className="flex items-center gap-2.5 group cursor-pointer overflow-hidden">
            <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-all duration-300 flex-shrink-0 p-1.5 active:scale-95">
              <img
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS9Ja7gfCpnjkyFXUCu_v5gSyxxIGNVuFmSqw&s"
                alt="SSBT"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-white font-black text-base tracking-tight whitespace-nowrap group-hover:text-brand-400 transition-colors uppercase tracking-widest">Faculty Hub</span>
          </Link>
        )}
        {collapsed && (
          <Link to="/" className="w-10 h-10 bg-white rounded-xl mx-auto flex items-center justify-center shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer p-1.5 active:scale-95">
            <img
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS9Ja7gfCpnjkyFXUCu_v5gSyxxIGNVuFmSqw&s"
              alt="SSBT"
              className="w-full h-full object-contain"
            />
          </Link>
        )}
      </div>

      <nav className="p-4 space-y-1.5 flex-1 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 group relative ${activeTab === item.id
              ? 'bg-brand-500 text-white shadow-xl shadow-brand-500/30'
              : 'hover:bg-slate-800/50 hover:text-white'
              }`}
          >
            {activeTab === item.id && (
              <div className="absolute left-[-16px] w-1.5 h-8 bg-white rounded-r-full shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
            )}
            <item.icon className={`w-5 h-5 min-w-[20px] transition-colors duration-300 ${activeTab === item.id ? 'text-white' : 'text-slate-500 group-hover:text-brand-400'}`} />
            {!collapsed && <span className="font-bold text-sm whitespace-nowrap tracking-wide">{item.label}</span>}
          </button>
        ))}
      </nav>

      <div className="p-4 pb-12 border-t border-slate-800 bg-slate-900/50 backdrop-blur-sm space-y-2">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-slate-800 transition-all duration-200 text-slate-500 hover:text-white group"
        >
          {collapsed ? <ChevronRight className="w-5 h-5 mx-auto" /> : <><ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> <span className="text-sm font-bold uppercase tracking-widest">Collapse</span></>}
        </button>

        <button
          onClick={() => {
            if (window.confirm("Are you sure you want to log out?")) {
              localStorage.removeItem('attendease_token');
              localStorage.removeItem('attendease_user');
              window.location.href = '/login';
            }
          }}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-red-400 hover:bg-red-500 hover:text-white shadow-lg hover:shadow-red-500/20 transition-all duration-300 group"
        >
          <LogOut className="w-5 h-5 min-w-[20px] group-hover:rotate-12 transition-transform" />
          {!collapsed && <span className="font-black text-sm uppercase tracking-widest">Logout</span>}
        </button>
      </div>
    </div>
  );
};

export default TeacherSidebar;
