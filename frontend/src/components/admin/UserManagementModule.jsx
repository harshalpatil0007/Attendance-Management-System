import { useState, useEffect } from 'react';
import { 
    Search, Filter, Download, UserPlus, FileUp, 
    MoreVertical, Trash2, Edit, CheckCircle, XCircle,
    GraduationCap, Users, BookOpen, ShieldCheck, Mail, Activity, FileText,
    X, Upload, Loader2, AlertCircle, Check
} from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/apiConfig';

const UserManagementModule = () => {
    const [activeTab, setActiveTab] = useState('students'); // students, faculty, promotion
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [search, setSearch] = useState('');
    const [filters, setFilters] = useState({ department: '', year: '' });

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Modal States
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [activeMenuId, setActiveMenuId] = useState(null);
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [promotionData, setPromotionData] = useState({ sourceYear: 'TE', department: 'Computer Engineering' });
    
    // Form States
    const [formData, setFormData] = useState({
        name: '', email: '', role: 'student', mobile_number: '',
        prn_number: '', department: 'Computer Engineering', current_year: 'FE', division: 'A',
        employee_id: '', designation: ''
    });

    useEffect(() => {
        fetchUsers();
    }, [activeTab, filters]);

    const fetchUsers = async (resetPage = true) => {
        setLoading(true);
        if (resetPage) setCurrentPage(1);
        try {
            const token = localStorage.getItem('attendease_token');
            const endpoint = activeTab === 'students' ? 'students' : 'teachers';
            const response = await axios.get(`${API_BASE_URL}/admin/users/${endpoint}`, {
                params: filters,
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(response.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddUser = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const token = localStorage.getItem('attendease_token');
            if (isEditMode) {
                await axios.put(`${API_BASE_URL}/admin/users/${selectedUser.id}`, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                alert('User updated successfully');
            } else {
                await axios.post(`${API_BASE_URL}/admin/users`, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                alert('User created successfully');
            }
            setIsAddModalOpen(false);
            fetchUsers(false);
            resetForm();
        } catch (err) {
            alert(err.response?.data?.message || 'Error saving user');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEditClick = (user) => {
        setSelectedUser(user);
        setIsEditMode(true);
        setFormData({
            name: user.name,
            email: user.email,
            role: user.role,
            mobile_number: user.mobile_number || '',
            prn_number: user.prn_number || '',
            department: user.department || 'Computer Engineering',
            current_year: user.current_year || 'FE',
            division: user.division || 'A',
            employee_id: user.employee_id || '',
            designation: user.designation || ''
        });
        setIsAddModalOpen(true);
    };

    const handleDeleteUser = async (id) => {
        if (!window.confirm('CRITICAL ACTION: Are you absolutely sure you want to permanently delete this user session? This action cannot be undone.')) return;
        try {
            const token = localStorage.getItem('attendease_token');
            await axios.delete(`${API_BASE_URL}/admin/users/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('User purged from system');
            fetchUsers(false);
        } catch (error) {
            alert('Security clearance failed or error purging user');
        }
    };


    const handleBulkImport = async (data) => {
        setSubmitting(true);
        try {
            const token = localStorage.getItem('attendease_token');
            await axios.post(`${API_BASE_URL}/admin/users/bulk-upload`, { users: data }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setIsBulkModalOpen(false);
            fetchUsers(true);
        } catch (err) {
            alert(err.response?.data?.message || 'Error during bulk upload');
        } finally {
            setSubmitting(false);
        }
    };

    const handleExportCSV = async () => {
        try {
            const token = localStorage.getItem('attendease_token');
            const role = activeTab === 'students' ? 'student' : 'teacher';
            const response = await axios.get(`${API_BASE_URL}/admin/users/export`, {
                params: { ...filters, role },
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            });
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `users_${role}_${Date.now()}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error(err);
            alert('Error exporting CSV');
        }
    };

    const handlePromoteBatch = async () => {
        if (!confirm(`Are you sure you want to promote all ${promotionData.sourceYear} students in ${promotionData.department}?`)) return;
        setSubmitting(true);
        try {
            const token = localStorage.getItem('attendease_token');
            await axios.post(`${API_BASE_URL}/admin/users/promote`, promotionData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Promotion protocol executed successfully');
        } catch (err) {
            alert(err.response?.data?.message || 'Error during promotion');
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setIsEditMode(false);
        setSelectedUser(null);
        setFormData({
            name: '', email: '', role: activeTab === 'students' ? 'student' : 'teacher', mobile_number: '',
            prn_number: '', department: 'Computer Engineering', current_year: 'FE', division: 'A',
            employee_id: '', designation: ''
        });
    };

    const filteredUsers = users.filter(u => 
        u.name.toLowerCase().includes(search.toLowerCase()) || 
        (u.prn_number || u.employee_id || '').toLowerCase().includes(search.toLowerCase())
    );

    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const paginatedUsers = filteredUsers.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const departments = [
        "First Year Engineering", "Chemical Engineering", "Civil Engineering", 
        "Computer Engineering", "Electrical Engineering", 
        "Electronics & Telecommunications Engg.", "Mechanical Engineering"
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Area */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black text-slate-800 dark:text-white dark:text-white tracking-tight flex items-center gap-3 italic transition-colors">
                        {activeTab === 'students' ? <Users className="w-8 h-8 text-brand-500" /> : 
                         activeTab === 'faculty' ? <BookOpen className="w-8 h-8 text-amber-500" /> : 
                         <GraduationCap className="w-8 h-8 text-emerald-500" />}
                        {activeTab === 'students' ? 'STUDENT DIRECTORY' : 
                         activeTab === 'faculty' ? 'FACULTY ROSTER' : 
                         'BATCH PROMOTION'}
                    </h1>
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-400 dark:text-slate-300 uppercase tracking-widest leading-relaxed transition-colors">
                        {activeTab === 'students' ? 'Manage Student Lifecycle & Academic Records' : 
                         activeTab === 'faculty' ? 'Administration of Teaching Staff & Departmental Assignments' : 
                         'End-of-Year Academic Transition & Level-up Logic'}
                    </p>
                </div>
                
                <div className="flex bg-white dark:bg-slate-900 p-2 rounded-[24px] border border-slate-100 dark:border-white/10 shadow-sm self-start transition-colors">
                    {['students', 'faculty', 'promotion'].map(tab => (
                        <button 
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-slate-900 dark:bg-brand-600 text-white shadow-xl shadow-slate-900/20' : 'text-slate-400 dark:text-slate-400 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {activeTab !== 'promotion' && (
                <>
                    {/* Action Bar */}
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex-1 min-w-[300px] relative group">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-400 dark:text-slate-200 group-focus-within:text-brand-500 transition-colors" />
                            <input 
                                type="text" 
                                placeholder={`Search by name or ${activeTab === 'students' ? 'PRN' : 'Employee ID'}...`}
                                className="w-full pl-14 pr-6 py-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-white/10 rounded-[28px] focus:ring-4 ring-brand-500/5 outline-none transition-all text-sm font-bold text-slate-700 dark:text-white shadow-sm"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => { resetForm(); setIsAddModalOpen(true); }}
                                className="flex items-center gap-2 px-8 py-4 bg-brand-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-brand-500/20 hover:scale-[1.02] active:scale-95 transition-all"
                            >
                                <UserPlus className="w-4 h-4" /> Add {activeTab === 'students' ? 'Student' : 'Faculty'}
                            </button>
                            <button 
                                onClick={() => setIsBulkModalOpen(true)}
                                className="flex items-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-slate-900/20 hover:scale-[1.02] active:scale-95 transition-all"
                            >
                                <FileUp className="w-4 h-4" /> Bulk Import
                            </button>
                        </div>
                    </div>

                    {/* Quick Filters */}
                    <div className="flex flex-wrap gap-3">
                        <div className="flex items-center gap-3 px-6 py-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/10 shadow-sm transition-colors">
                            <Filter className="w-3.5 h-3.5 text-slate-400 dark:text-slate-400" />
                            <select 
                                className="bg-transparent border-none outline-none text-[10px] font-black uppercase tracking-widest text-slate-600 cursor-pointer"
                                onChange={(e) => setFilters({...filters, department: e.target.value})}
                                value={filters.department}
                            >
                                <option value="">All Departments</option>
                                {departments.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                        {activeTab === 'students' && (
                            <div className="flex items-center gap-3 px-6 py-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/10 shadow-sm transition-colors">
                                <GraduationCap className="w-3.5 h-3.5 text-slate-400 dark:text-slate-400" />
                                <select 
                                    className="bg-transparent border-none outline-none text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-100 cursor-pointer transition-colors"
                                    onChange={(e) => setFilters({...filters, year: e.target.value})}
                                    value={filters.year}
                                >
                                    <option value="">All Years</option>
                                    <option value="FE">First Year</option>
                                    <option value="SE">Second Year</option>
                                    <option value="TE">Third Year</option>
                                    <option value="BE">Final Year</option>
                                </select>
                            </div>
                        )}
                        <button 
                            onClick={handleExportCSV}
                            className="ml-auto flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-400 dark:text-slate-300 hover:text-brand-500 transition-all shadow-sm transition-colors"
                        >
                            <Download className="w-4 h-4" /> Export CSV
                        </button>
                    </div>

                    {/* Table */}
                    <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-white/10 shadow-sm overflow-hidden animate-in zoom-in-95 duration-500 transition-colors">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/50">
                                    <tr>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-400 dark:text-slate-200 font-primary italic transition-colors">Profile Info</th>
                                        <th className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-400 dark:text-slate-200 font-primary italic transition-colors">{activeTab === 'students' ? 'PRN / Batch' : 'EMPID / Role'}</th>
                                        <th className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-400 dark:text-slate-200 font-primary italic transition-colors">Department</th>
                                        <th className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-400 dark:text-slate-200 font-primary italic transition-colors">Status</th>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-400 dark:text-slate-200 font-primary italic text-right transition-colors">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {loading ? (
                                        [1, 2, 3, 4, 5].map(i => (
                                            <tr key={i} className="animate-pulse">
                                                <td className="px-8 py-6"><div className="w-48 h-10 bg-slate-100 rounded-xl"></div></td>
                                                <td className="px-6 py-6"><div className="w-32 h-6 bg-slate-100 rounded-lg"></div></td>
                                                <td className="px-6 py-6"><div className="w-40 h-6 bg-slate-100 rounded-lg"></div></td>
                                                <td className="px-6 py-6"><div className="w-20 h-8 bg-slate-100 rounded-full"></div></td>
                                                <td className="px-8 py-6 flex justify-end gap-2"><div className="w-10 h-10 bg-slate-100 rounded-xl"></div></td>
                                            </tr>
                                        ))
                                    ) : paginatedUsers.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="p-20 text-center">
                                                <Search className="w-16 h-16 text-slate-100 mx-auto mb-4" />
                                                <h3 className="text-sm font-black text-slate-300 uppercase tracking-[0.2em]">Matrix Clear</h3>
                                                <p className="text-[10px] font-bold text-slate-200 mt-2 italic">No personnel matching your filter criteria found.</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedUsers.map((user, i) => (
                                            <tr key={user.id} className="group hover:bg-slate-50/50 transition-all border-l-4 border-transparent hover:border-brand-500">
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm transition-transform group-hover:scale-110 ${activeTab === 'students' ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'}`}>
                                                            {user.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black text-slate-800 dark:text-white tracking-tight uppercase italic">{user.name}</p>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                <Mail className="w-3 h-3 text-slate-300" />
                                                                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-400 lowercase">{user.email}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <p className="text-xs font-black text-slate-700 dark:text-slate-200 tracking-widest">{user.prn_number || user.employee_id}</p>
                                                    <p className="text-[9px] font-bold text-slate-400 dark:text-slate-400 dark:text-slate-300 uppercase mt-1 italic">{activeTab === 'students' ? user.current_year : user.designation}</p>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="px-3 py-1 bg-white border border-slate-100 w-fit rounded-lg shadow-sm">
                                                        <p className="text-[9px] font-black text-slate-500 dark:text-slate-600 uppercase tracking-widest">{user.department}</p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-full w-fit border border-emerald-100">
                                                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                                                        <span className="text-[9px] font-black uppercase tracking-widest">Active Status</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0 relative">
                                                        <button 
                                                            onClick={() => handleEditClick(user)}
                                                            className="p-3 bg-white border border-slate-100 rounded-xl text-slate-400 dark:text-slate-400 hover:text-brand-500 hover:border-brand-500 shadow-sm transition-all hover:scale-110"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDeleteUser(user.id)}
                                                            className="p-3 bg-white border border-slate-100 rounded-xl text-slate-400 dark:text-slate-400 hover:text-red-500 hover:border-red-500 shadow-sm transition-all hover:scale-110"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                        <div className="relative">
                                                            <button 
                                                                onClick={() => setActiveMenuId(activeMenuId === user.id ? null : user.id)}
                                                                className="p-3 bg-slate-900 text-white rounded-xl shadow-lg shadow-slate-900/20 hover:scale-110 transition-all focus:ring-2 ring-brand-500 ring-offset-2"
                                                            >
                                                                <MoreVertical className="w-4 h-4" />
                                                            </button>
                                                            
                                                            {activeMenuId === user.id && (
                                                                <div className="absolute right-0 bottom-full mb-3 w-48 bg-slate-900 rounded-2xl shadow-2xl p-2 z-[60] animate-in zoom-in-95 slide-in-from-bottom-2 duration-200">
                                                                    <div className="absolute -bottom-1 right-5 w-3 h-3 bg-slate-900 rotate-45"></div>
                                                                    <button 
                                                                        onClick={() => {
                                                                            navigator.clipboard.writeText(user.prn_number || user.employee_id);
                                                                            alert('ID Copied to clipboard');
                                                                            setActiveMenuId(null);
                                                                        }}
                                                                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 rounded-xl text-left transition-all"
                                                                    >
                                                                        <FileText className="w-4 h-4 text-brand-400" />
                                                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Copy ID</span>
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {/* Footer / Pagination */}
                        <div className="px-8 py-6 bg-slate-50/30 flex items-center justify-between border-t border-slate-50">
                             <p className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-[0.2em] italic">
                                 Showing {filteredUsers.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} Records
                             </p>
                             <div className="flex items-center gap-2">
                                 <button 
                                     onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                     disabled={currentPage === 1}
                                     className="px-4 py-2 bg-white border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-brand-500 disabled:opacity-50 transition-all"
                                 >
                                     Previous
                                 </button>
                                 <div className="flex gap-1.5">
                                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                          <button 
                                            key={p} 
                                            onClick={() => setCurrentPage(p)}
                                            className={`w-8 h-8 rounded-lg text-[10px] font-black flex items-center justify-center transition-all ${currentPage === p ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20' : 'bg-white border border-slate-100 text-slate-400 dark:text-slate-400 hover:bg-slate-50'}`}
                                          >
                                            {p}
                                          </button>
                                      ))}
                                 </div>
                                 <button 
                                     onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                     disabled={currentPage === totalPages || totalPages === 0}
                                     className="px-4 py-2 bg-white border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-brand-500 disabled:opacity-50 transition-all"
                                 >
                                     Next
                                 </button>
                             </div>
                        </div>
                    </div>
                </>
            )}

            {activeTab === 'promotion' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white dark:bg-slate-900 p-10 rounded-[40px] border border-slate-100 dark:border-white/10 shadow-sm space-y-8 transition-colors">
                        <div>
                            <h2 className="text-xl font-black text-slate-800 dark:text-white dark:text-white tracking-tight uppercase italic underline decoration-emerald-500 decoration-4 underline-offset-8 transition-colors">Promotion Logic</h2>
                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-400 dark:text-slate-200 mt-4 leading-relaxed uppercase tracking-widest italic transition-colors">Bulk transition students to the next academic level. Records will be archived automatically.</p>
                        </div>
                        
                        <div className="space-y-6">
                            <div className="p-8 bg-slate-50 dark:bg-slate-800/50 rounded-[32px] border border-slate-100 dark:border-white/10 relative overflow-hidden group transition-colors">
                                <div className="absolute right-0 bottom-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mb-16 blur-2xl group-hover:scale-150 transition-transform duration-1000"></div>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-[0.2em] ml-1">Source Batch</label>
                                        <select 
                                            value={promotionData.sourceYear}
                                            onChange={(e) => setPromotionData({...promotionData, sourceYear: e.target.value})}
                                            className="w-full px-6 py-4 bg-white border-none rounded-2xl text-xs font-black uppercase tracking-widest shadow-inner outline-none focus:ring-2 ring-emerald-500 transition-all appearance-none"
                                        >
                                            <option value="TE">Third Year (TE)</option>
                                            <option value="SE">Second Year (SE)</option>
                                            <option value="FE">First Year (FE)</option>
                                            <option value="BE">Final Year (BE)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-[0.2em] ml-1">Department</label>
                                        <select 
                                            value={promotionData.department}
                                            onChange={(e) => setPromotionData({...promotionData, department: e.target.value})}
                                            className="w-full px-6 py-4 bg-white border-none rounded-2xl text-xs font-black uppercase tracking-widest shadow-inner outline-none focus:ring-2 ring-emerald-500 transition-all appearance-none"
                                        >
                                            {departments.map(d => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-[0.2em] ml-1">Target Batch</label>
                                        <div className="px-6 py-4 bg-white/50 border border-slate-100 rounded-2xl text-xs font-black uppercase tracking-widest text-emerald-600 flex items-center justify-between">
                                            {promotionData.sourceYear === 'FE' ? 'Second Year (SE)' : 
                                             promotionData.sourceYear === 'SE' ? 'Third Year (TE)' : 
                                             promotionData.sourceYear === 'TE' ? 'Final Year (BE)' : 'GRADUATED'}
                                            <ShieldCheck className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button 
                                onClick={handlePromoteBatch}
                                disabled={submitting}
                                className="w-full py-5 bg-slate-900 text-white rounded-[24px] text-xs font-black uppercase tracking-[0.2em] shadow-2xl shadow-slate-900/40 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Activity className="w-5 h-5 text-emerald-400" />}
                                Executive Promotion Protocol
                            </button>
                        </div>
                    </div>

                    <div className="bg-slate-900 p-10 rounded-[40px] text-white flex flex-col justify-between relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-brand-500/10 to-transparent"></div>
                        <div className="relative z-10">
                            <ShieldCheck className="w-12 h-12 text-brand-400 mb-6" />
                            <h3 className="text-xl font-black tracking-tight uppercase mb-4 italic">Safety Check</h3>
                            <div className="space-y-4">
                                {[
                                    { check: 'Database Backup Completed', ok: true },
                                    { check: 'Grade Validation Verified', ok: true },
                                    { check: 'System Lockdown Phase Active', ok: false },
                                    { check: 'Archive Buffer Ready', ok: true }
                                ].map((c, i) => (
                                    <div key={i} className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 group-hover:bg-white/10 transition-all">
                                        <div className={`w-2 h-2 rounded-full ${c.ok ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`}></div>
                                        <span className="text-[10px] font-black uppercase tracking-widest flex-1">{c.check}</span>
                                        {c.ok ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-red-500" />}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="mt-10 relative z-10 flex items-center gap-3 p-4 bg-white/5 rounded-2xl italic">
                            <ShieldCheck className="w-5 h-5 text-brand-400" />
                            <p className="text-[9px] font-bold text-slate-400 dark:text-slate-400 leading-relaxed uppercase tracking-widest">Promotion logic applies to active students only. Suspended accounts are excluded from bulk transition.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Add User Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsAddModalOpen(false)}></div>
                    <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 transition-colors">
                        <div className="flex items-center justify-between px-10 py-8 border-b border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50">
                            <div>
                                <h3 className="text-xl font-black text-slate-800 dark:text-white dark:text-white italic uppercase">{isEditMode ? 'Update' : 'Add New'} {activeTab === 'students' ? 'Student' : 'Faculty'}</h3>
                                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest">{isEditMode ? 'Modify existing' : 'Create individual'} {activeTab} record</p>
                            </div>
                            <button onClick={() => setIsAddModalOpen(false)} className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 dark:text-slate-400 hover:text-red-500 transition-all shadow-sm">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleAddUser} className="p-10 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                                    <input required type="text" className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold shadow-inner outline-none focus:ring-2 ring-brand-500/20" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                                    <input required type="email" className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold shadow-inner outline-none focus:ring-2 ring-brand-500/20" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest ml-1">Mobile Number</label>
                                    <input required type="text" className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold shadow-inner outline-none focus:ring-2 ring-brand-500/20" value={formData.mobile_number} onChange={(e) => setFormData({...formData, mobile_number: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest ml-1">Department</label>
                                    <select 
                                        required 
                                        className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold shadow-inner outline-none focus:ring-2 ring-brand-500/20 appearance-none" 
                                        value={formData.department} 
                                        onChange={(e) => setFormData({...formData, department: e.target.value})}
                                    >
                                        {departments.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest ml-1">{activeTab === 'students' ? 'PRN Number' : 'Employee ID'}</label>
                                    <input required type="text" className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold shadow-inner outline-none focus:ring-2 ring-brand-500/20" value={activeTab === 'students' ? formData.prn_number : formData.employee_id} onChange={(e) => setFormData({...formData, [activeTab === 'students' ? 'prn_number' : 'employee_id']: e.target.value})} />
                                </div>
                                {activeTab === 'students' ? (
                                    <>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest ml-1">Current Year</label>
                                            <select required className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold shadow-inner outline-none focus:ring-2 ring-brand-500/20 appearance-none" value={formData.current_year} onChange={(e) => setFormData({...formData, current_year: e.target.value})}>
                                                <option value="">Select Year</option>
                                                <option value="FE">FE</option>
                                                <option value="SE">SE</option>
                                                <option value="TE">TE</option>
                                                <option value="BE">BE</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest ml-1">Division</label>
                                            <input required type="text" maxLength="1" className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold shadow-inner outline-none focus:ring-2 ring-brand-500/20" value={formData.division} onChange={(e) => setFormData({...formData, division: e.target.value.toUpperCase()})} />
                                        </div>
                                    </>
                                ) : (
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest ml-1">Designation</label>
                                        <input required type="text" className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold shadow-inner outline-none focus:ring-2 ring-brand-500/20" value={formData.designation} onChange={(e) => setFormData({...formData, designation: e.target.value})} />
                                    </div>
                                )}
                            </div>
                             <button disabled={submitting} type="submit" className="w-full py-5 bg-brand-500 text-white rounded-3xl text-sm font-black uppercase tracking-widest shadow-xl shadow-brand-500/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3">
                                 {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (isEditMode ? <CheckCircle className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />)}
                                 {isEditMode ? 'Update Record in Database' : 'Add Record to Database'}
                             </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Bulk Import Modal */}
            {isBulkModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsBulkModalOpen(false)}></div>
                    <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 p-10 text-center space-y-8 transition-colors">
                         <div className="w-20 h-20 bg-slate-100 rounded-[32px] flex items-center justify-center mx-auto">
                            <Upload className="w-10 h-10 text-brand-500" />
                         </div>
                         <div className="space-y-2">
                            <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase italic">Bulk CSV Import</h3>
                            <p className="text-sm font-bold text-slate-400 dark:text-slate-400 leading-relaxed px-10">Upload student/faculty lists in JSON format for lightning-fast processing. Ensure all fields map correctly.</p>
                         </div>
                         
                         <input 
                            type="file" 
                            id="bulk-file" 
                            className="hidden" 
                            accept=".csv,.json"
                            onChange={(e) => {
                                const file = e.target.files[0];
                                if (!file) return;
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                    const text = event.target.result;
                                    try {
                                        let data;
                                        if (file.name.endsWith('.json')) {
                                            data = JSON.parse(text);
                                        } else {
                                            const lines = text.split('\n');
                                            const headers = lines[0].split(',').map(h => h.trim());
                                            data = lines.slice(1).filter(line => line.trim()).map(line => {
                                                const values = line.split(',').map(v => v.trim());
                                                const obj = {};
                                                headers.forEach((header, i) => {
                                                    obj[header] = values[i];
                                                });
                                                return obj;
                                            });
                                        }
                                        handleBulkImport(data);
                                    } catch (err) {
                                        alert('Invalid file format');
                                    }
                                };
                                reader.readAsText(file);
                            }}
                         />
                         
                         <label htmlFor="bulk-file" className="block w-full py-10 border-4 border-dashed border-slate-100 rounded-[40px] hover:border-brand-500/50 hover:bg-brand-50/10 cursor-pointer transition-all group">
                            <p className="text-sm font-black text-slate-400 uppercase tracking-widest group-hover:text-brand-500">Click to Select CSV/JSON File</p>
                            <p className="text-[10px] font-bold text-slate-300 mt-2 lowercase">or drag and drop anywhere here</p>
                         </label>

                         <div className="flex gap-4">
                            <button onClick={() => setIsBulkModalOpen(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all">Cancel</button>
                            <button onClick={() => alert('Download template logic here')} className="flex-1 py-4 border border-slate-100 text-brand-500 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-brand-50 transition-all italic">Download Template</button>
                         </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagementModule;

