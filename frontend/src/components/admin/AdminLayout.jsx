import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, Users, Calendar, ClipboardCheck,
    FileCheck, Briefcase, FileText, Bell, Settings,
    LogOut, ChevronLeft, ChevronRight, Search, Moon, Sun,
    ShieldAlert, X, Clock
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const AdminLayout = ({ children }) => {
    const { theme, toggleTheme } = useTheme();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [notifications, setNotifications] = useState([
        { id: 1, text: 'Security Warning: Multiple failed login attempts from IP 192.168.1.45', time: '2h ago', type: 'urgent' },
        { id: 2, text: 'Faculty Request: Prof. Sharma requested classroom projector replacement (Room 302)', time: '4h ago', type: 'info' },
        { id: 3, text: 'System Report: Weekly automated database backup completed successfully', time: '1d ago', type: 'success' },
        { id: 4, text: 'Insight: Student engagement increased by 14% this month', time: '2d ago', type: 'info' },
    ]);
    const navigate = useNavigate();
    const location = useLocation();

    const user = JSON.parse(localStorage.getItem('attendease_user')) || { name: 'Admin', role: 'admin' };

    const menuItems = [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard, path: '/dashboard/admin' },
        { id: 'users', label: 'User Management', icon: Users, path: '/dashboard/admin/users' },
        { id: 'attendance', label: 'Attendance', icon: ClipboardCheck, path: '/dashboard/admin/attendance' },
        { id: 'academic', label: 'Academic Mgmt', icon: Calendar, path: '/dashboard/admin/academic' },
        { id: 'certificates', label: 'Certificates', icon: FileCheck, path: '/dashboard/admin/certificates' },
        { id: 'placement', label: 'Placement', icon: Briefcase, path: '/dashboard/admin/placement' },
        { id: 'reports', label: 'Reports', icon: FileText, path: '/dashboard/admin/reports' },
        { id: 'notifications', label: 'Communication', icon: Bell, path: '/dashboard/admin/notifications' },
        { id: 'settings', label: 'System Settings', icon: Settings, path: '/dashboard/admin/settings' },
    ];

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    const [showAll, setShowAll] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);

    const handleNotificationClick = (n) => {
        setShowNotifications(false);
        if (!n) {
            navigate('/dashboard/admin/notifications');
            return;
        }

        // Smart redirection based on notification type
        if (n.path) {
            navigate(n.path);
        } else if (n.type === 'urgent' || n.type === 'security') {
            navigate('/dashboard/admin/settings');
        } else {
            navigate('/dashboard/admin/notifications');
        }
    };

    return (
        <div className="min-h-screen flex overflow-x-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-300">
            {/* Sidebar */}
            <aside
                className={`fixed left-0 top-0 h-full bg-slate-900 text-white transition-all duration-300 z-50 flex flex-col overflow-x-hidden
                ${isSidebarOpen ? 'w-72' : 'w-20'}`}
            >
                {/* Logo Section */}
                <div 
                    onClick={() => navigate('/')}
                    className="p-6 flex items-center gap-3 border-b border-slate-800 cursor-pointer hover:bg-slate-800/50 transition-colors"
                >
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
                        <img
                            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS9Ja7gfCpnjkyFXUCu_v5gSyxxIGNVuFmSqw&s"
                            alt="SSBT Logo"
                            className="w-full h-full object-contain"
                        />
                    </div>
                    {isSidebarOpen && (
                        <div className="font-bold text-lg tracking-tight leading-tight">
                            <span className="text-brand-400">SSBTCOET</span>
                            <br />
                            <span className="text-xs text-slate-400 font-medium uppercase tracking-widest">AttendEase Admin</span>
                        </div>
                    )}
                </div>

                {/* Navigation Menu */}
                <nav className="flex-1 overflow-y-auto overflow-x-hidden py-6 px-3 space-y-1 custom-scrollbar">
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => navigate(item.path)}
                            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all group relative
                                ${location.pathname === item.path ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}
                        >
                            <item.icon className={`w-5 h-5 flex-shrink-0 ${location.pathname === item.path ? 'text-white' : 'text-slate-500 group-hover:text-brand-400'}`} />
                            {isSidebarOpen && <span className="font-medium">{item.label}</span>}
                            {!isSidebarOpen && (
                                <div className="absolute left-full ml-4 px-3 py-1 bg-slate-800 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
                                    {item.label}
                                </div>
                            )}
                        </button>
                    ))}
                </nav>

                {/* Logout Only */}
                <div className="p-4 border-t border-slate-800">
                    <button 
                        onClick={handleLogout}
                        className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-red-500/10 text-red-400 hover:text-red-500 transition-all font-medium
                        ${!isSidebarOpen && 'justify-center'}`}
                    >
                        <LogOut className="w-5 h-5" />
                        {isSidebarOpen && <span>Logout</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main 
                className={`flex-1 transition-all duration-300 min-h-screen flex flex-col
                ${isSidebarOpen ? 'ml-72' : 'ml-20'}`}
            >
                {/* Topbar */}
                <header className="sticky top-0 h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-white/10 px-4 md:px-8 flex items-center justify-between z-40">
                    <div className="flex items-center gap-6">
                        {/* Collapse Toggle moved here */}
                        <button 
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all"
                        >
                            {isSidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                        </button>

                        <div className="relative group hidden lg:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 group-focus-within:text-brand-500 transition-colors" />
                            <input 
                                type="text" 
                                placeholder="Search PRN, Teacher..." 
                                className="pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 focus:bg-white dark:focus:bg-slate-900 border-2 border-transparent focus:border-brand-500 rounded-full w-48 xl:w-64 outline-none transition-all text-sm font-medium dark:text-white"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3 md:gap-6">
                        <button 
                            onClick={toggleTheme}
                            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-all border border-transparent dark:border-white/5"
                        >
                            {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5" />}
                        </button>
                        
                        <div className="relative">
                            <button 
                                onClick={() => {
                                    setShowNotifications(!showNotifications);
                                    if (!showNotifications) setShowAll(false);
                                }}
                                className={`p-2.5 rounded-xl transition-all relative ${showNotifications ? 'bg-brand-50 text-brand-500 shadow-inner' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
                            >
                                <Bell className="w-5 h-5" />
                                {notifications.length > 0 && (
                                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-black rounded-full border-2 border-white flex items-center justify-center shadow-sm">
                                        {notifications.length > 9 ? '9+' : notifications.length}
                                    </span>
                                )}
                            </button>

                            {showNotifications && (
                                <div className="absolute right-0 mt-3 w-[calc(100vw-2rem)] sm:w-80 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/10 rounded-3xl shadow-2xl shadow-slate-200/50 dark:shadow-black/50 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                                    <div className="p-5 border-b border-slate-50 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-white/5 backdrop-blur-sm">
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">System Activity</span>
                                        <div className="flex items-center gap-3">
                                            {notifications.length > 0 && (
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setNotifications([]);
                                                    }}
                                                    className="text-[9px] font-black uppercase tracking-widest text-brand-500 hover:text-brand-600 px-2 py-1 rounded-lg hover:bg-brand-50 transition-colors"
                                                >
                                                    Clear All
                                                </button>
                                            )}
                                            <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-slate-600">
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="max-h-[400px] overflow-y-auto p-2 space-y-1">
                                        {(showAll ? notifications : notifications.slice(0, 2)).length > 0 ? (
                                            (showAll ? notifications : notifications.slice(0, 2)).map(n => (
                                                <div 
                                                    key={n.id} 
                                                    onClick={() => handleNotificationClick(n)}
                                                    className="p-4 rounded-2xl hover:bg-slate-50 transition-colors cursor-pointer flex gap-4 group/item"
                                                >
                                                    <div className={`w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center group-hover/item:scale-110 transition-transform flex-shrink-0`}>
                                                        <Bell className={`w-5 h-5 ${n.type === 'urgent' ? 'text-red-500' : 'text-brand-500'}`} />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200 leading-tight group-hover/item:text-brand-600 transition-colors">{n.text}</p>
                                                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold flex items-center gap-1.5">
                                                            <Clock className="w-3 h-3" /> {n.time}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-10 text-center text-slate-400">
                                                <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                                <p className="text-[10px] font-black uppercase tracking-widest">No new activity</p>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="p-3 bg-slate-50 border-t border-slate-100">
                                        <button 
                                            onClick={() => {
                                                if (showAll) {
                                                    handleNotificationClick();
                                                } else {
                                                    setShowAll(true);
                                                }
                                            }}
                                            className="w-full py-2.5 bg-white border border-slate-200 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-500 hover:text-white hover:border-brand-500 transition-all shadow-sm active:scale-[0.98]"
                                        >
                                            {showAll ? 'View Full System Log' : 'View All Activity'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="h-10 w-px bg-slate-100 hidden sm:block"></div>

                        {/* User Profile moved here */}
                        <div className="flex items-center gap-4 group cursor-pointer pl-2">
                            <div className="text-right hidden md:block">
                                <p className="font-bold text-sm leading-none text-slate-900 dark:text-white">{user.name}</p>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-widest font-black italic">{user.role}</p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-500 to-amber-400 flex items-center justify-center font-bold text-white shadow-lg group-hover:rotate-6 transition-transform">
                                {user.name.charAt(0)}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Dashboard Content */}
                <div className="p-8 flex-1">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
