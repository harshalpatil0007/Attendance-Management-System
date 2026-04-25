import { useState, useEffect } from 'react';
import { 
    Briefcase, TrendingUp, Users, Building2, 
    ArrowUpRight, Download, Plus, Filter, Search,
    CheckCircle, AlertCircle, Bookmark, RefreshCw, 
    Sliders, FileText, Mail, X, Info
} from 'lucide-react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    PieChart, Pie, Cell, LineChart, Line 
} from 'recharts';
import axios from 'axios';
import { API_BASE_URL } from '../../config/apiConfig';

const PlacementModule = () => {
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('analytics'); // analytics, eligibility, data-entry
    const [departments, setDepartments] = useState([]);
    
    // Eligibility States
    const [rules, setRules] = useState(null);
    const [eligibleStudents, setEligibleStudents] = useState([]);
    const [ineligibleStudents, setIneligibleStudents] = useState([]);
    const [exceptions, setExceptions] = useState([]);
    const [activeEligibilityTab, setActiveEligibilityTab] = useState('eligible'); // eligible, ineligible, exceptions
    const [isEvaluating, setIsEvaluating] = useState(false);
    const [isNotifying, setIsNotifying] = useState(false);
    const [isNotifyingEligible, setIsNotifyingEligible] = useState(false);
    const [showRulesModal, setShowRulesModal] = useState(false);
    const [showExceptionModal, setShowExceptionModal] = useState(false);
    const [selectedStudentForException, setSelectedStudentForException] = useState(null);
    const [exceptionJustification, setExceptionJustification] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [deptFilter, setDeptFilter] = useState('All');

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('attendease_token');
            const headers = { Authorization: `Bearer ${token}` };
            
            const [statsRes, rulesRes, deptsRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/admin/placement/stats`, { headers }),
                axios.get(`${API_BASE_URL}/admin/placement/eligibility/rules`, { headers }),
                axios.get(`${API_BASE_URL}/admin/departments`, { headers })
            ]);
            
            setStats(statsRes.data);
            setRules(rulesRes.data);
            setDepartments(deptsRes.data);
            
            // Fetch student lists
            fetchEligibilityLists();
            
        } catch (error) {
            console.error('Error fetching placement data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchEligibilityLists = async () => {
        try {
            const token = localStorage.getItem('attendease_token');
            const headers = { Authorization: `Bearer ${token}` };
            
            const [eligibleRes, ineligibleRes, exceptionsRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/admin/placement/eligibility/students?filter=eligible`, { headers }),
                axios.get(`${API_BASE_URL}/admin/placement/eligibility/students?filter=ineligible`, { headers }),
                axios.get(`${API_BASE_URL}/admin/placement/eligibility/students?filter=exceptions`, { headers })
            ]);
            
            setEligibleStudents(eligibleRes.data);
            setIneligibleStudents(ineligibleRes.data);
            setExceptions(exceptionsRes.data);
        } catch (error) {
            console.error('Error fetching eligibility lists:', error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleReevaluate = async () => {
        setIsEvaluating(true);
        try {
            const token = localStorage.getItem('attendease_token');
            await axios.post(`${API_BASE_URL}/admin/placement/eligibility/evaluate`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            await fetchEligibilityLists();
            alert('Re-evaluation complete!');
        } catch (error) {
            console.error('Evaluation failed:', error);
            alert('Evaluation failed. Please check logs.');
        } finally {
            setIsEvaluating(false);
        }
    };

    const handleSaveRules = async (updatedRules) => {
        try {
            const token = localStorage.getItem('attendease_token');
            await axios.put(`${API_BASE_URL}/admin/placement/eligibility/rules`, updatedRules, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRules(updatedRules);
            setShowRulesModal(false);
            handleReevaluate(); // Auto-trigger evaluation
        } catch (error) {
            console.error('Error saving rules:', error);
        }
    };

    const handleGrantException = async () => {
        if (!selectedStudentForException) return;
        try {
            const token = localStorage.getItem('attendease_token');
            await axios.post(`${API_BASE_URL}/admin/placement/eligibility/exception`, {
                student_id: selectedStudentForException.student_id,
                academic_year: rules.academic_year,
                notes: exceptionJustification
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShowExceptionModal(false);
            setExceptionJustification('');
            fetchEligibilityLists();
        } catch (error) {
            console.error('Error granting exception:', error);
        }
    };

    const handleRevokeException = async (id) => {
        if (!window.confirm('Are you sure you want to revoke this exception?')) return;
        try {
            const token = localStorage.getItem('attendease_token');
            await axios.delete(`${API_BASE_URL}/admin/placement/eligibility/exception/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchEligibilityLists();
        } catch (error) {
            console.error('Error revoking exception:', error);
        }
    };

    const handleNotifyIneligible = async () => {
        if (ineligibleStudents.length === 0) return;
        if (!window.confirm(`Are you sure you want to send placement ineligibility notifications to ${ineligibleStudents.length} students?`)) return;
        
        setIsNotifying(true);
        try {
            const token = localStorage.getItem('attendease_token');
            await axios.post(`${API_BASE_URL}/admin/placement/eligibility/notify`, {
                academic_year: rules?.academic_year || '2025-26'
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Notifications have been queued and sent successfully.');
        } catch (error) {
            console.error('Error sending notifications:', error);
            alert('Failed to send notifications. Please check server logs.');
        } finally {
            setIsNotifying(false);
        }
    };

    const handleNotifyEligible = async () => {
        if (eligibleStudents.length === 0) return;
        if (!window.confirm(`Are you sure you want to send placement eligibility success emails to ${eligibleStudents.length} students?`)) return;
        
        setIsNotifyingEligible(true);
        try {
            const token = localStorage.getItem('attendease_token');
            await axios.post(`${API_BASE_URL}/admin/placement/eligibility/notify-eligible`, {
                academic_year: rules?.academic_year || '2025-26'
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Success notifications have been sent to all eligible students.');
        } catch (error) {
            console.error('Error sending success notifications:', error);
            alert('Failed to send notifications. Please check server logs.');
        } finally {
            setIsNotifyingEligible(false);
        }
    };

    const COLORS = ['#1a3a5c', '#d4a017', '#3b82f6', '#10b981', '#f59e0b'];

    const filteredStudents = (list) => {
        return list.filter(s => 
            (s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
             s.prn_number.toLowerCase().includes(searchTerm.toLowerCase())) &&
            (deptFilter === 'All' || s.department === deptFilter)
        );
    };

    if (loading) return (
        <div className="p-20 flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-slate-100 border-t-brand-500 rounded-full animate-spin"></div>
            <p className="mt-4 text-[10px] font-black uppercase text-slate-400 dark:text-slate-400 tracking-widest">Compiling Placement Data...</p>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3 transition-colors">
                        <Briefcase className="w-8 h-8 text-brand-500" />
                        PLACEMENT ANALYTICS
                    </h1>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 transition-colors">
                        Tracking Institutional Career Success & Corporate Relations
                    </p>
                </div>
                <div className="flex bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-100 dark:border-white/10 shadow-sm transition-colors">
                    {[
                        { id: 'analytics', label: 'Statistics' },
                        { id: 'eligibility', label: 'Eligibility' },
                        { id: 'data-entry', label: 'Data Entry' }
                    ].map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-brand-500 text-white shadow-lg' : 'text-slate-400 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {activeTab === 'analytics' && (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { label: 'Overall Placed', value: '82%', sub: 'Last Batch', icon: TrendingUp, color: 'blue' },
                            { label: 'Avg Package', value: '4.8 LPA', sub: '+12% YoY', icon: Briefcase, color: 'emerald' },
                            { label: 'Highest Package', value: '18.0 LPA', sub: 'MNC (Pune)', icon: ArrowUpRight, color: 'amber' },
                            { label: 'Total Recruiters', value: '45+', sub: 'Active Partners', icon: Building2, color: 'indigo' },
                        ].map((card, i) => (
                            <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-white/10 shadow-sm hover:shadow-md transition-all group">
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-3 bg-${card.color}-50 dark:bg-${card.color}-900/20 text-${card.color}-600 dark:text-${card.color}-400 rounded-2xl group-hover:scale-110 transition-transform`}>
                                        <card.icon className="w-6 h-6" />
                                    </div>
                                    <div className="px-2 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-[8px] font-black rounded-lg">LIVE</div>
                                </div>
                                <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tighter transition-colors">{card.value}</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 transition-colors">{card.label}</p>
                                <p className="text-[9px] font-bold text-slate-400 mt-2 italic transition-colors">{card.sub}</p>
                            </div>
                        ))}
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-white/10 shadow-sm transition-colors">
                            <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest mb-8">Department-wise Placement</h3>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={stats}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="department" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#94a3b8'}} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#94a3b8'}} unit="%" />
                                        <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}} />
                                        <Bar dataKey="placed_students" fill="#1a3a5c" radius={[10, 10, 0, 0]} barSize={40}>
                                            {stats.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-white/10 shadow-sm transition-colors">
                            <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest mb-8">Package Trends (LPA)</h3>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={stats}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#94a3b8'}} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#94a3b8'}} />
                                        <Tooltip contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}} />
                                        <Line type="monotone" dataKey="avg_package" stroke="#d4a017" strokeWidth={4} dot={{r: 6, fill: '#fff', strokeWidth: 4}} activeDot={{r: 8}} />
                                        <Line type="monotone" dataKey="highest_package" stroke="#1a3a5c" strokeWidth={4} dot={{r: 6, fill: '#fff', strokeWidth: 4}} activeDot={{r: 8}} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {activeTab === 'eligibility' && (
                <div className="space-y-6">
                    {/* Header Controls */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-100 dark:border-white/10 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-brand-50 text-brand-600 rounded-2xl">
                                <RefreshCw className={`w-6 h-6 ${isEvaluating ? 'animate-spin' : ''}`} />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">Placement Eligibility</h3>
                                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">
                                    Last evaluated: {eligibleStudents.length > 0 ? new Date(eligibleStudents[0].evaluated_at).toLocaleString() : 'Never'}
                                </p>
                            </div>
                        </div>
                        <button 
                            onClick={handleReevaluate}
                            disabled={isEvaluating}
                            className="px-6 py-2.5 bg-brand-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-brand-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                        >
                            {isEvaluating ? 'Evaluating...' : 'Re-evaluate Now'}
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Rules Summary */}
                        <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-100 dark:border-white/10 shadow-sm transition-colors">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Eligibility Criteria</h3>
                                <button onClick={() => setShowRulesModal(true)} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors text-brand-500">
                                    <Sliders className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="space-y-4">
                                {[
                                    { label: 'Min. Attendance', value: `${rules?.min_attendance || 0}%`, icon: CheckCircle },
                                    { label: 'Max. Backlogs', value: rules?.max_backlogs || 0, icon: AlertCircle },
                                    { label: 'Min. ISE Average', value: `${rules?.min_ise_avg || 0}%`, icon: FileText },
                                    { label: 'Disciplinary', value: rules?.enforce_disciplinary ? 'Enforced' : 'Not Enforced', icon: Bookmark },
                                    { label: 'Target Year', value: rules?.only_final_year ? 'BE (Final)' : 'All', icon: Users },
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl transition-colors">
                                        <div className="flex items-center gap-3">
                                            <item.icon className="w-4 h-4 text-slate-400" />
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{item.label}</span>
                                        </div>
                                        <span className="text-xs font-black text-slate-800 dark:text-white">{item.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Counts Card */}
                        <div className="lg:col-span-2 grid grid-cols-2 gap-6">
                            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-8 rounded-[40px] border border-emerald-100 dark:border-emerald-800/30 flex flex-col justify-center items-center text-center">
                                <CheckCircle className="w-10 h-10 text-emerald-600 mb-4" />
                                <h4 className="text-4xl font-black text-emerald-700 dark:text-emerald-400 tracking-tighter">{eligibleStudents.length}</h4>
                                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1">Eligible Students</p>
                            </div>
                            <div className="bg-red-50 dark:bg-red-900/20 p-8 rounded-[40px] border border-red-100 dark:border-red-800/30 flex flex-col justify-center items-center text-center">
                                <AlertCircle className="w-10 h-10 text-red-600 mb-4" />
                                <h4 className="text-4xl font-black text-red-700 dark:text-red-400 tracking-tighter">{ineligibleStudents.length}</h4>
                                <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mt-1">Ineligible Students</p>
                            </div>
                        </div>
                    </div>

                    {/* Tabs & List */}
                    <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-white/10 shadow-sm overflow-hidden transition-colors">
                        <div className="px-8 pt-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="flex bg-slate-50 dark:bg-slate-800 p-1 rounded-2xl transition-colors">
                                {[
                                    { id: 'eligible', label: 'Eligible List', count: eligibleStudents.length },
                                    { id: 'ineligible', label: 'Ineligible List', count: ineligibleStudents.length },
                                    { id: 'exceptions', label: 'Exceptions', count: exceptions.length }
                                ].map(tab => (
                                    <button 
                                        key={tab.id}
                                        onClick={() => setActiveEligibilityTab(tab.id)}
                                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeEligibilityTab === tab.id ? 'bg-white dark:bg-slate-700 text-brand-500 shadow-sm' : 'text-slate-400'}`}
                                    >
                                        {tab.label}
                                        <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-600 rounded-md text-[8px]">{tab.count}</span>
                                    </button>
                                ))}
                            </div>
                            <div className="flex gap-2 w-full md:w-auto">
                                <div className="relative flex-1 md:w-64">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input 
                                        type="text" 
                                        placeholder="Search by Name or PRN..." 
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-[10px] font-black uppercase tracking-widest focus:ring-2 ring-brand-500 outline-none transition-colors"
                                    />
                                </div>
                                <select 
                                    value={deptFilter}
                                    onChange={(e) => setDeptFilter(e.target.value)}
                                    className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-[10px] font-black uppercase tracking-widest focus:ring-2 ring-brand-500 outline-none transition-colors dark:text-white"
                                >
                                    <option value="All">All Departments</option>
                                    {departments.map(dept => (
                                        <option key={dept} value={dept}>{dept}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="p-8">
                            <div className="flex justify-end gap-3 mb-6">
                                {activeEligibilityTab === 'eligible' && (
                                    <>
                                        <button 
                                            onClick={handleNotifyEligible}
                                            disabled={isNotifyingEligible || eligibleStudents.length === 0}
                                            className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-100 hover:bg-emerald-100 transition-all disabled:opacity-50"
                                        >
                                            <Mail className={`w-4 h-4 ${isNotifyingEligible ? 'animate-bounce' : ''}`} /> 
                                            {isNotifyingEligible ? 'Sending...' : 'Bulk Email'}
                                        </button>
                                        <button className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-brand-500/20 hover:scale-105 transition-all">
                                            <Download className="w-4 h-4" /> Export (Excel)
                                        </button>
                                    </>
                                )}
                                {activeEligibilityTab === 'ineligible' && (
                                    <>
                                        <button 
                                            onClick={handleNotifyIneligible}
                                            disabled={isNotifying || ineligibleStudents.length === 0}
                                            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-red-100 hover:bg-red-100 transition-all disabled:opacity-50"
                                        >
                                            <Mail className={`w-4 h-4 ${isNotifying ? 'animate-bounce' : ''}`} /> 
                                            {isNotifying ? 'Sending...' : 'Notify All'}
                                        </button>
                                        <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:scale-105 transition-all">
                                            <Download className="w-4 h-4" /> Export Defaulters (PDF)
                                        </button>
                                    </>
                                )}
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-slate-50 dark:border-white/5">
                                            <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Roll</th>
                                            <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Student Name</th>
                                            <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Dept</th>
                                            <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Att. %</th>
                                            <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">ISE Avg</th>
                                            {activeEligibilityTab === 'ineligible' ? (
                                                <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Reason</th>
                                            ) : activeEligibilityTab === 'exceptions' ? (
                                                <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Approved By</th>
                                            ) : (
                                                <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                                            )}
                                            <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                                        {filteredStudents(
                                            activeEligibilityTab === 'eligible' ? eligibleStudents : 
                                            activeEligibilityTab === 'ineligible' ? ineligibleStudents : 
                                            exceptions
                                        ).map((s, i) => (
                                            <tr key={i} className="group hover:bg-slate-50/50 dark:hover:bg-white/5 transition-all">
                                                <td className="px-4 py-5 text-xs font-black text-slate-400">{s.roll_number || 'N/A'}</td>
                                                <td className="px-4 py-5">
                                                    <p className="text-sm font-black text-slate-800 dark:text-white group-hover:text-brand-500 transition-colors">{s.name}</p>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{s.prn_number}</p>
                                                </td>
                                                <td className="px-4 py-5">
                                                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[9px] font-black text-slate-500 uppercase">{s.department}</span>
                                                </td>
                                                <td className="px-4 py-5 text-xs font-black text-slate-700 dark:text-slate-200">{Number(s.attendance_percentage).toFixed(1)}%</td>
                                                <td className="px-4 py-5 text-xs font-black text-slate-700 dark:text-slate-200">{Number(s.ise_average).toFixed(1)}%</td>
                                                <td className="px-4 py-5">
                                                    {activeEligibilityTab === 'eligible' ? (
                                                        <div className="flex items-center gap-2">
                                                            <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-100 dark:border-emerald-800/30">ELIGIBLE</span>
                                                            {s.is_exception && <span className="px-3 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-full text-[9px] font-black uppercase tracking-widest border border-amber-100 dark:border-amber-800/30">EXCEPTION</span>}
                                                        </div>
                                                    ) : activeEligibilityTab === 'ineligible' ? (
                                                        <span className="text-[10px] font-bold text-red-500 uppercase tracking-tight">
                                                            {Array.isArray(s.ineligibility_reasons) ? s.ineligibility_reasons.join(' + ') : s.ineligibility_reasons}
                                                        </span>
                                                    ) : (
                                                        <p className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">{s.approved_by_name || 'Admin'}</p>
                                                    )}
                                                </td>
                                                <td className="px-4 py-5 text-right">
                                                    {activeEligibilityTab === 'ineligible' ? (
                                                        <button 
                                                            onClick={() => {
                                                                setSelectedStudentForException(s);
                                                                setShowExceptionModal(true);
                                                            }}
                                                            className="p-2 hover:bg-amber-50 text-amber-600 rounded-lg transition-colors"
                                                            title="Grant Exception"
                                                        >
                                                            <Bookmark className="w-4 h-4" />
                                                        </button>
                                                    ) : activeEligibilityTab === 'exceptions' ? (
                                                        <button 
                                                            onClick={() => handleRevokeException(s.id)}
                                                            className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                                                            title="Revoke Exception"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    ) : null}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'data-entry' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-white/10 shadow-sm h-fit transition-colors">
                        <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest mb-6 transition-colors">Add Batch Data</h3>
                        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 transition-colors">Academic Year</label>
                                <input type="text" placeholder="2025-26" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-xs font-bold focus:ring-2 ring-brand-500 transition-all shadow-inner outline-none dark:text-white" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Department</label>
                                <select className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-xs font-bold focus:ring-2 ring-brand-500 transition-all shadow-inner outline-none appearance-none dark:text-white">
                                    {departments.map(dept => (
                                        <option key={dept} value={dept}>{dept}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Total</label>
                                    <input type="number" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-xs font-bold focus:ring-2 ring-brand-500 outline-none dark:text-white" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Placed</label>
                                    <input type="number" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-xs font-bold focus:ring-2 ring-brand-500 outline-none dark:text-white" />
                                </div>
                            </div>
                            <button className="w-full py-4 bg-brand-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-brand-500/30 hover:scale-[1.02] active:scale-95 transition-all mt-4">
                                Update Placement Database
                            </button>
                        </form>
                    </div>

                    <div className="lg:col-span-2 bg-slate-900 p-8 rounded-[40px] text-white overflow-hidden relative group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-3">
                            <Plus className="w-5 h-5 text-brand-400" /> TOP RECRUITERS OF 2025
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 relative z-10">
                            {[
                                { name: 'TCS', offers: 34, logo: 'https://companieslogo.com/img/orig/TCS.NS-74514422.png?t=1633501170' },
                                { name: 'Infosys', offers: 28, logo: 'https://companieslogo.com/img/orig/INFY-10bed5f5.png?t=1648396656' },
                                { name: 'Capgemini', offers: 21, logo: 'https://companieslogo.com/img/orig/CAP.PA-6a10787e.png?t=1659616086' },
                                { name: 'Cognizant', offers: 15, logo: 'https://companieslogo.com/img/orig/CTSH-595b1123.png?t=1633439401' },
                            ].map((company, i) => (
                                <div key={i} className="flex flex-col items-center p-6 bg-white/5 rounded-3xl border border-white/10 hover:bg-white/10 transition-all cursor-pointer group/item">
                                    <div className="w-12 h-12 bg-white rounded-xl mb-3 flex items-center justify-center p-2 group-hover/item:scale-110 transition-transform">
                                        <img src={company.logo} alt={company.name} className="max-w-full max-h-full object-contain grayscale group-hover/item:grayscale-0 transition-all" />
                                    </div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{company.name}</p>
                                    <p className="text-lg font-black text-brand-400 mt-1">{company.offers}</p>
                                    <p className="text-[8px] font-bold text-slate-500 uppercase">OFFERS</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Rules Modal */}
            {showRulesModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-6 border-b border-slate-50 dark:border-white/5 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
                            <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest">Edit Eligibility Rules</h3>
                            <button onClick={() => setShowRulesModal(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">
                                <X className="w-4 h-4 text-slate-400" />
                            </button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Min. Attendance (%)</label>
                                    <span className="text-xs font-black text-brand-500">{rules?.min_attendance || 0}%</span>
                                </div>
                                <input 
                                    type="range" min="0" max="100" 
                                    value={rules?.min_attendance || 0} 
                                    onChange={(e) => setRules({...rules, min_attendance: Number(e.target.value)})}
                                    className="w-full accent-brand-500" 
                                />
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Max. Backlogs</label>
                                    <input 
                                        type="number" 
                                        value={rules?.max_backlogs || 0} 
                                        onChange={(e) => setRules({...rules, max_backlogs: Number(e.target.value)})}
                                        className="w-16 px-2 py-1 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs font-black outline-none border border-slate-100 dark:border-white/5 focus:ring-1 ring-brand-500 dark:text-white"
                                    />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Min. ISE Average (%)</label>
                                    <span className="text-xs font-black text-brand-500">{rules?.min_ise_avg || 0}%</span>
                                </div>
                                <input 
                                    type="range" min="0" max="100" 
                                    value={rules?.min_ise_avg || 0} 
                                    onChange={(e) => setRules({...rules, min_ise_avg: Number(e.target.value)})}
                                    className="w-full accent-brand-500" 
                                />
                            </div>
                            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Enforce No Disciplinary</label>
                                <button 
                                    onClick={() => setRules({...rules, enforce_disciplinary: !rules?.enforce_disciplinary})}
                                    className={`w-10 h-5 rounded-full relative transition-all ${rules?.enforce_disciplinary ? 'bg-brand-500' : 'bg-slate-300'}`}
                                >
                                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${rules?.enforce_disciplinary ? 'right-1' : 'left-1'}`}></div>
                                </button>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Only Final Year (BE)</label>
                                <button 
                                    onClick={() => setRules({...rules, only_final_year: !rules?.only_final_year})}
                                    className={`w-10 h-5 rounded-full relative transition-all ${rules?.only_final_year ? 'bg-brand-500' : 'bg-slate-300'}`}
                                >
                                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${rules?.only_final_year ? 'right-1' : 'left-1'}`}></div>
                                </button>
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button 
                                    onClick={() => setShowRulesModal(false)}
                                    className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={() => handleSaveRules(rules)}
                                    className="flex-1 py-3 bg-brand-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-brand-500/20 hover:scale-105 transition-all"
                                >
                                    Save & Re-evaluate
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Exception Modal */}
            {showExceptionModal && selectedStudentForException && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-6 border-b border-slate-50 dark:border-white/5 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
                            <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest">Grant Exception</h3>
                            <button onClick={() => setShowExceptionModal(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">
                                <X className="w-4 h-4 text-slate-400" />
                            </button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Student Information</p>
                                <h4 className="text-sm font-black text-slate-800 dark:text-white">{selectedStudentForException.name}</h4>
                                <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">{selectedStudentForException.prn_number} | {selectedStudentForException.department}</p>
                                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-white/5">
                                    <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">Ineligibility Reason:</p>
                                    <p className="text-xs font-bold text-slate-600 dark:text-slate-400 italic">
                                        {Array.isArray(selectedStudentForException.ineligibility_reasons) ? selectedStudentForException.ineligibility_reasons.join(' + ') : selectedStudentForException.ineligibility_reasons}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Justification for Exception</label>
                                <textarea 
                                    rows="4"
                                    value={exceptionJustification}
                                    onChange={(e) => setExceptionJustification(e.target.value)}
                                    placeholder="e.g., Represented college in national hackathon, exceptional project work..."
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-xs font-bold focus:ring-2 ring-brand-500 outline-none transition-all shadow-inner dark:text-white"
                                ></textarea>
                            </div>

                            <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-xl text-[9px] font-bold italic">
                                <Info className="w-4 h-4 flex-shrink-0" />
                                <span>Exceptions will allow the student to appear in the Eligible List with a special badge.</span>
                            </div>

                            <div className="flex gap-4">
                                <button 
                                    onClick={() => setShowExceptionModal(false)}
                                    className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleGrantException}
                                    className="flex-1 py-3 bg-brand-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-brand-500/20 hover:scale-105 transition-all"
                                >
                                    Grant Exception
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PlacementModule;
