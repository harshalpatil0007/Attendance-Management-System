import { useState, useEffect } from 'react';
import { useNavigate, Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from '../components/admin/AdminLayout';
import OverviewModule from '../components/admin/OverviewModule';
import UserManagementModule from '../components/admin/UserManagementModule';
import AttendanceModule from '../components/admin/AttendanceModule';
import AcademicModule from '../components/admin/AcademicModule';
import CertificatesModule from '../components/admin/CertificatesModule';
import CommunicationModule from '../components/admin/CommunicationModule';
import PlacementModule from '../components/admin/PlacementModule';
import ReportsModule from '../components/admin/ReportsModule';
import SettingsModule from '../components/admin/SettingsModule';
import LoadingOverlay from '../components/LoadingOverlay';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('attendease_user'));
        const adminRoles = ['admin', 'super_admin', 'hod'];
        if (!user || !adminRoles.includes(user.role)) {
            navigate('/login');
            return;
        }

        // Add 1.2s artificial delay as requested
        const timer = setTimeout(() => {
            setLoading(false);
        }, 1200);

        return () => clearTimeout(timer);
    }, [navigate]);

    if (loading) {
        return <LoadingOverlay message="Initializing Administrative Console..." />;
    }

    return (
        <AdminLayout>
            <Routes>
                <Route path="/" element={<OverviewModule />} />
                <Route path="users" element={<UserManagementModule />} />
                <Route path="attendance" element={<AttendanceModule />} />
                <Route path="academic" element={<AcademicModule />} />
                <Route path="certificates" element={<CertificatesModule />} />
                <Route path="placement" element={<PlacementModule />} />
                <Route path="reports" element={<ReportsModule />} />
                <Route path="notifications" element={<CommunicationModule />} />
                <Route path="settings" element={<SettingsModule />} />
                
                {/* Fallback */}
                <Route path="*" element={<Navigate to="/dashboard/admin" replace />} />
            </Routes>
        </AdminLayout>
    );
};

export default AdminDashboard;

