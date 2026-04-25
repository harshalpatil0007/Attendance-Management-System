import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/apiConfig';
import { 
    BookOpenCheck, CheckCircle2, Circle, 
    Calendar, Link as LinkIcon, Plus,
    BarChart, PieChart, Info, ChevronDown, 
    ChevronUp, Settings, Trash2, Edit2, 
    MoreVertical, CheckSquare, Download, Share2,
    Clock, Archive, AlertCircle
} from 'lucide-react';

const SyllabusTracker = ({ assignedClasses }) => {
    // Selection States
    const [selectedSubject, setSelectedSubject] = useState('');
    const [selectedDivision, setSelectedDivision] = useState('A');
    
    // UI States
    const [syllabus, setSyllabus] = useState([]);
    const [loading, setLoading] = useState(false);
    const [expandedUnits, setExpandedUnits] = useState([1]);
    
    // Modals States
    const [showCompletionModal, setShowCompletionModal] = useState(null); // topicId or null
    const [showExtraTopicModal, setShowExtraTopicModal] = useState(null); // { unitId, topicId (for edit) } or null
    const [showRevertModal, setShowRevertModal] = useState(null);
    const [bulkActionTarget, setBulkActionTarget] = useState(null);
    const [activeDropdown, setActiveDropdown] = useState(null); // unit.id or null

    // Form States
    const [completionNotes, setCompletionNotes] = useState('');
    const [completionDate, setCompletionDate] = useState(new Date().toISOString().split('T')[0]);
    const [newExtraTopic, setNewExtraTopic] = useState({
        name: '',
        type: 'additional_concept',
        description: '',
        lectures: 1,
        importance: 'recommended',
        visibleToStudents: true
    });

    useEffect(() => {
        if (selectedSubject) fetchSyllabus();
    }, [selectedSubject, selectedDivision]);

    // Click outside handler for dropdowns
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (activeDropdown && !event.target.closest('.bulk-menu-container')) {
                setActiveDropdown(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [activeDropdown]);

    const fetchSyllabus = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('attendease_token');
            const res = await axios.get(`${API_BASE_URL}/syllabus/${selectedSubject}?division=${selectedDivision}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSyllabus(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (topic) => {
        const { id, status } = topic;
        
        if (status === 'not_started') {
            await updateStatus(id, 'teaching');
        } else if (status === 'teaching') {
            setShowCompletionModal(topic);
        } else if (status === 'completed') {
            setShowRevertModal(topic);
        }
    };

    const updateStatus = async (topicId, status, extraData = {}) => {
        try {
            const token = localStorage.getItem('attendease_token');
            await axios.put(`${API_BASE_URL}/syllabus/topic/${topicId}`, {
                status,
                division: selectedDivision,
                ...extraData
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchSyllabus();
            setShowCompletionModal(null);
            setShowRevertModal(null);
            setCompletionNotes('');
        } catch (error) {
            console.error(error);
        }
    };

    const handleAddExtraTopic = async () => {
        if (!newExtraTopic.name.trim()) return;
        try {
            const token = localStorage.getItem('attendease_token');
            await axios.post(`${API_BASE_URL}/syllabus/extra`, {
                unitId: showExtraTopicModal.unitId,
                topicName: newExtraTopic.name,
                topicType: newExtraTopic.type,
                importance: newExtraTopic.importance,
                lectureCount: newExtraTopic.lectures,
                visibleToStudents: newExtraTopic.visibleToStudents,
                division: selectedDivision
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNewExtraTopic({ name: '', type: 'additional_concept', description: '', lectures: 1, importance: 'recommended', visibleToStudents: true });
            setShowExtraTopicModal(null);
            fetchSyllabus();
        } catch (error) {
            console.error(error);
        }
    };

    const handleDeleteExtraTopic = async (topicId) => {
        if (!window.confirm("Are you sure you want to delete this extra topic?")) return;
        try {
            const token = localStorage.getItem('attendease_token');
            await axios.delete(`${API_BASE_URL}/syllabus/extra/${topicId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchSyllabus();
        } catch (error) {
            console.error(error);
        }
    };

    const handleBulkAction = async (unitId, action) => {
        try {
            const token = localStorage.getItem('attendease_token');
            await axios.post(`${API_BASE_URL}/syllabus/bulk`, {
                unitId,
                division: selectedDivision,
                action
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchSyllabus();
            setBulkActionTarget(null);
        } catch (error) {
            console.error(error);
        }
    };

    // Calculation Helpers
    const calculateProgress = (topics) => {
        if (!topics || topics.length === 0) return 0;
        const score = topics.reduce((acc, t) => {
            if (t.status === 'completed') return acc + 1;
            if (t.status === 'teaching') return acc + 0.5;
            return acc;
        }, 0);
        return Math.round((score / topics.length) * 100);
    };

    const overallProgress = calculateProgress(syllabus.flatMap(u => u.topics));

    // Progress Color
    const getProgressColor = (percent) => {
        if (percent <= 25) return 'bg-red-500';
        if (percent <= 50) return 'bg-orange-500';
        if (percent <= 75) return 'bg-yellow-500';
        return 'bg-emerald-500';
    };

    const toggleUnit = (unitId) => {
        setExpandedUnits(prev => 
            prev.includes(unitId) ? prev.filter(id => id !== unitId) : [...prev, unitId]
        );
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header Section */}
            <div className="bg-white dark:bg-slate-500 rounded-[40px] p-8 border border-slate-100 dark:border-white/10 shadow-sm space-y-8 transition-colors">
                <div className="flex flex-col md:flex-row justify-between gap-8 items-start md:items-center">
                    <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-brand-50 rounded-2xl flex items-center justify-center text-xl">📚</div>
                            <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight transition-colors">Syllabus Progress Tracker</h2>
                        </div>
                        <div className="flex flex-wrap gap-4">
                            <select 
                                value={selectedSubject}
                                onChange={(e) => setSelectedSubject(e.target.value)}
                                className="bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-white/10 rounded-2xl px-5 py-4 font-bold text-slate-700 dark:text-white outline-none focus:border-brand-500 transition-all min-w-[300px]"
                            >
                                <option value="">Select Subject</option>
                                {Array.from(new Map(assignedClasses.map(s => [s.unique_id, s])).values()).map(c => (
                                    <option key={c.unique_id} value={c.subject_id}>{c.is_lab ? '[LAB] ' : ''}{c.subject_name}</option>
                                ))}
                            </select>
                            <select 
                                value={selectedDivision}
                                onChange={(e) => setSelectedDivision(e.target.value)}
                                className="bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-white/10 rounded-2xl px-5 py-4 font-bold text-slate-700 dark:text-white outline-none focus:border-brand-500 transition-all w-32"
                            >
                                {['A', 'B', 'C'].map(div => <option key={div} value={div}>Div {div}</option>)}
                            </select>
                        </div>
                    </div>

                    {selectedSubject && (
                        <div className="w-full md:w-80 space-y-4 bg-slate-50/50 p-6 rounded-[32px] border border-slate-100">
                            <div className="flex justify-between items-center px-1">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Overall Progress</span>
                                <span className="text-xl font-black text-slate-800 dark:text-white transition-colors">{overallProgress}%</span>
                            </div>
                            <div className="w-full h-4 bg-slate-200 rounded-full overflow-hidden shadow-inner">
                                <div className={`h-full transition-all duration-1000 ease-out rounded-full ${getProgressColor(overallProgress)}`} style={{ width: `${overallProgress}%` }} />
                            </div>
                            <div className="flex justify-between gap-2">
                                <button className="flex-1 py-3 bg-white border border-slate-200 rounded-xl text-[9px] font-black text-slate-500 uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                                    <Download className="w-3 h-3" /> PDF Report
                                </button>
                                <button className="flex-1 py-3 bg-white border border-slate-200 rounded-xl text-[9px] font-black text-slate-500 uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                                    <Share2 className="w-3 h-3" /> Share HOD
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {selectedSubject && (
                    <div className="flex justify-between items-center py-4 border-t border-slate-50">
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full border-2 border-slate-300"></div>
                                <span className="text-[10px] font-black text-slate-400 uppercase">Not Started</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-orange-400 animate-pulse"></div>
                                <span className="text-[10px] font-black text-slate-400 uppercase">Teaching</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-emerald-500 flex items-center justify-center">
                                    <CheckCircle2 className="w-2 h-2 text-white" />
                                </div>
                                <span className="text-[10px] font-black text-slate-400 uppercase">Completed</span>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button onClick={() => setExpandedUnits(syllabus.map(u => u.unit_number))} className="text-[9px] font-black text-brand-500 uppercase underline">Expand All</button>
                            <button onClick={() => setExpandedUnits([])} className="text-[9px] font-black text-slate-400 uppercase underline">Collapse All</button>
                        </div>
                    </div>
                )}
            </div>

            {selectedSubject ? (
                <div className="space-y-6">
                    {syllabus.map((unit) => {
                        const isExpanded = expandedUnits.includes(unit.unit_number);
                        const unitProgress = calculateProgress(unit.topics);
                        const coreTopics = unit.topics.filter(t => !t.is_extra);
                        const extraTopics = unit.topics.filter(t => t.is_extra);

                        return (
                            <div key={unit.id} className="bg-white dark:bg-slate-500 rounded-[32px] border border-slate-100 dark:border-white/10 shadow-sm overflow-hidden transition-all duration-300 transition-colors">
                                {/* Unit Header */}
                                <div 
                                    className={`p-6 flex items-center justify-between cursor-pointer transition-colors ${isExpanded ? 'bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-100 dark:border-white/10' : 'bg-white dark:bg-slate-500'}`}
                                    onClick={() => toggleUnit(unit.unit_number)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 rounded-xl bg-slate-100 text-slate-500 group-hover:bg-brand-50 transition-colors">
                                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest flex items-center gap-2 transition-colors">
                                                Unit {unit.unit_number}: {unit.unit_name}
                                                {unitProgress === 100 && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                                            </h3>
                                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-200 mt-0.5 transition-colors">
                                                {unit.topics.filter(t => t.status === 'completed').length}/{unit.topics.length} Topics Completed
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <div className="hidden md:flex flex-col items-end gap-1.5">
                                            <div className="w-32 h-2 bg-slate-200/50 rounded-full overflow-hidden shadow-inner flex-shrink-0">
                                                <div 
                                                    className={`h-full transition-all duration-1000 ease-out rounded-full ${getProgressColor(unitProgress)}`} 
                                                    style={{ width: `${unitProgress}%` }} 
                                                />
                                            </div>
                                            <span className={`text-[10px] font-black ${unitProgress === 100 ? 'text-emerald-500' : 'text-slate-400'}`}>{unitProgress}% Complete</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); setShowExtraTopicModal({ unitId: unit.id }); }}
                                                className="p-2.5 rounded-xl bg-brand-50 text-brand-500 hover:bg-brand-500 hover:text-white transition-all shadow-sm"
                                                title="Add Extra Topic"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                            <div className="relative bulk-menu-container">
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActiveDropdown(activeDropdown === unit.id ? null : unit.id);
                                                    }}
                                                    className={`p-2.5 rounded-xl transition-all border ${activeDropdown === unit.id ? 'bg-brand-500 text-white border-brand-500 shadow-lg shadow-brand-500/20' : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100'}`}
                                                >
                                                    <MoreVertical className="w-4 h-4" />
                                                </button>
                                                {activeDropdown === unit.id && (
                                                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 p-2 space-y-1 animate-in slide-in-from-top-2 duration-200">
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); handleBulkAction(unit.id, 'complete'); }} 
                                                            className="w-full text-left px-4 py-2 text-[10px] font-black uppercase text-slate-600 hover:bg-slate-50 hover:text-emerald-500 rounded-xl transition-all flex items-center gap-2"
                                                        >
                                                            <CheckSquare className="w-3.5 h-3.5" /> Mark Unit Complete
                                                        </button>
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); handleBulkAction(unit.id, 'teaching'); }} 
                                                            className="w-full text-left px-4 py-2 text-[10px] font-black uppercase text-slate-600 hover:bg-slate-50 hover:text-orange-500 rounded-xl transition-all flex items-center gap-2"
                                                        >
                                                            <Clock className="w-3.5 h-3.5" /> Mark Unit Teaching
                                                        </button>
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); handleBulkAction(unit.id, 'reset'); }} 
                                                            className="w-full text-left px-4 py-2 text-[10px] font-black uppercase text-slate-600 hover:bg-slate-50 hover:text-red-500 rounded-xl transition-all flex items-center gap-2"
                                                        >
                                                            <Archive className="w-3.5 h-3.5" /> Reset All Topics
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Unit Content */}
                                {isExpanded && (
                                    <div className="p-8 bg-white dark:bg-slate-500 animate-in slide-in-from-top-4 duration-300 transition-colors">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            {/* Core Topics Column */}
                                            <div className="space-y-4">
                                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                    📘 Core topics (University Syllabus)
                                                </h4>
                                                <div className="space-y-3">
                                                    {coreTopics.map(topic => (
                                                        <TopicCard 
                                                            key={topic.id} 
                                                            topic={topic} 
                                                            onToggle={() => handleToggleStatus(topic)} 
                                                        />
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Extra Topics Column */}
                                            <div className="space-y-4">
                                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                    ✨ Extra topics (Teacher Added)
                                                </h4>
                                                <div className="space-y-3">
                                                    {extraTopics.length > 0 ? extraTopics.map(topic => (
                                                        <TopicCard 
                                                            key={topic.id} 
                                                            topic={topic} 
                                                            onToggle={() => handleToggleStatus(topic)}
                                                            isExtra={true}
                                                            onDelete={() => handleDeleteExtraTopic(topic.id)}
                                                        />
                                                    )) : (
                                                        <button 
                                                            onClick={() => setShowExtraTopicModal({ unitId: unit.id })}
                                                            className="w-full py-10 border-2 border-dashed border-slate-100 rounded-3xl flex flex-col items-center justify-center text-slate-300 hover:bg-slate-50 hover:border-slate-200 transition-all group"
                                                        >
                                                            <Plus className="w-6 h-6 mb-2 group-hover:scale-110 transition-transform" />
                                                            <span className="text-[10px] font-black uppercase tracking-widest">Add extra teaching content</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-500 py-40 rounded-[60px] border border-dashed border-slate-200 dark:border-white/10 flex flex-col items-center justify-center text-slate-400 transition-colors">
                    <div className="w-32 h-32 bg-slate-50 rounded-[48px] flex items-center justify-center mb-10 shadow-inner">
                        <BarChart className="w-12 h-12 text-slate-200" />
                    </div>
                    <p className="font-black uppercase tracking-widest text-lg italic text-slate-300">Syllabus Cloud Tracker</p>
                    <p className="text-xs font-bold text-slate-400 mt-4 opacity-100">Synchronize your curriculum progress across departments and divisions.</p>
                    <div className="mt-12 p-3 px-6 bg-brand-50 text-brand-600 rounded-2xl text-[10px] font-black uppercase tracking-widest">
                        🚀 SELECT A SUBJECT ABOVE TO BEGIN
                    </div>
                </div>
            )}

            {/* Completion Confirmation Modal */}
            {showCompletionModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowCompletionModal(null)}></div>
                    <div className="bg-white dark:bg-slate-500 rounded-[40px] w-full max-w-lg relative z-10 shadow-2xl border border-slate-100 dark:border-white/10 overflow-hidden animate-in zoom-in-95 duration-300 transition-colors">
                        <div className="p-8 bg-emerald-500 text-white flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                                    <CheckCircle2 className="w-8 h-8" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black tracking-tight">Mark as Completed?</h3>
                                    <p className="text-emerald-100 font-bold text-sm">Update the teaching status for your class</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Now Completing</p>
                                <p className="text-lg font-black text-slate-800 leading-tight">{showCompletionModal.topic_name}</p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block px-1">Completion Date</label>
                                    <input 
                                        type="date" 
                                        value={completionDate}
                                        onChange={(e) => setCompletionDate(e.target.value)}
                                        className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-5 py-4 font-bold text-slate-700 outline-none focus:border-brand-500 transition-all font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block px-1">Delivery Notes (Optional)</label>
                                    <textarea 
                                        placeholder="Add summary of teaching examples, case studies covered, etc."
                                        value={completionNotes}
                                        onChange={(e) => setCompletionNotes(e.target.value)}
                                        className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-5 py-4 font-bold text-slate-700 outline-none focus:border-brand-500 transition-all min-h-[100px]"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button 
                                    onClick={() => setShowCompletionModal(null)}
                                    className="flex-1 py-5 bg-slate-100 text-slate-500 rounded-[24px] text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={() => updateStatus(showCompletionModal.id, 'completed', { notes: completionNotes, date: completionDate })}
                                    className="flex-[2] py-5 bg-emerald-500 text-white rounded-[24px] text-xs font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all"
                                >
                                    Confirm Completion
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Revert Options Modal */}
            {showRevertModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowRevertModal(null)}></div>
                    <div className="bg-white dark:bg-slate-500 rounded-[40px] w-full max-w-sm relative z-10 p-8 shadow-2xl space-y-6 transition-colors">
                        <div className="text-center space-y-2">
                            <div className="w-20 h-20 bg-orange-50 text-orange-400 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-orange-100">
                                <AlertCircle className="w-10 h-10" />
                            </div>
                            <h3 className="text-xl font-black text-slate-800">Change Status?</h3>
                            <p className="text-xs font-bold text-slate-400">This topic is already marked as completed on {new Date(showRevertModal.completed_at).toLocaleDateString()}</p>
                        </div>
                        <div className="space-y-3">
                            <button 
                                onClick={() => updateStatus(showRevertModal.id, 'teaching')}
                                className="w-full py-4 bg-orange-50 text-orange-600 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-orange-100 transition-all"
                            >
                                Revert to "Teaching" Status
                            </button>
                            <button 
                                onClick={() => updateStatus(showRevertModal.id, 'not_started')}
                                className="w-full py-4 bg-slate-50 text-slate-500 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-100 transition-all"
                            >
                                Reset to "Not Started"
                            </button>
                            <button 
                                onClick={() => setShowRevertModal(null)}
                                className="w-full py-4 border-2 border-slate-100 text-slate-400 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 transition-all"
                            >
                                Keep as Completed
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Extra Topic Modal */}
            {showExtraTopicModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowExtraTopicModal(null)}></div>
                    <div className="bg-white dark:bg-slate-500 rounded-[40px] w-full max-w-xl relative z-10 shadow-2xl border border-slate-100 dark:border-white/10 overflow-hidden transition-colors">
                        <div className="p-8 bg-brand-500 text-white flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white/20 rounded-2xl">
                                    <Plus className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-black tracking-tight uppercase">Add Extra Content</h3>
                            </div>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Topic Name</label>
                                    <input 
                                        type="text" 
                                        value={newExtraTopic.name}
                                        onChange={(e) => setNewExtraTopic({...newExtraTopic, name: e.target.value})}
                                        placeholder="e.g., Practical session on NoSQL injection"
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 font-bold text-slate-700 outline-none focus:border-brand-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Content Type</label>
                                    <select 
                                        value={newExtraTopic.type}
                                        onChange={(e) => setNewExtraTopic({...newExtraTopic, type: e.target.value})}
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 font-bold text-slate-700 outline-none focus:border-brand-500"
                                    >
                                        <option value="additional_concept">Additional Concept</option>
                                        <option value="practice_session">Practice Session</option>
                                        <option value="case_study">Case Study</option>
                                        <option value="background_knowledge">Background Knowledge</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Est. Lectures</label>
                                    <input 
                                        type="number" 
                                        value={newExtraTopic.lectures}
                                        onChange={(e) => setNewExtraTopic({...newExtraTopic, lectures: e.target.value})}
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 font-bold text-slate-700 outline-none focus:border-brand-500"
                                    />
                                </div>
                                <div className="md:col-span-2 bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Visible to Students</span>
                                        <button 
                                            onClick={() => setNewExtraTopic({...newExtraTopic, visibleToStudents: !newExtraTopic.visibleToStudents})}
                                            className={`w-12 h-6 rounded-full transition-all relative ${newExtraTopic.visibleToStudents ? 'bg-brand-500' : 'bg-slate-300'}`}
                                        >
                                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${newExtraTopic.visibleToStudents ? 'left-7' : 'left-1'}`} />
                                        </button>
                                    </div>
                                    <div className="flex gap-4">
                                        {['Mandatory', 'Recommended', 'Optional'].map(imp => (
                                            <button 
                                                key={imp}
                                                onClick={() => setNewExtraTopic({...newExtraTopic, importance: imp.toLowerCase()})}
                                                className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border-2 ${newExtraTopic.importance === imp.toLowerCase() ? 'bg-brand-500 text-white border-brand-500' : 'bg-white text-slate-400 border-slate-100'}`}
                                            >
                                                {imp}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button onClick={() => setShowExtraTopicModal(null)} className="flex-1 py-5 bg-slate-50 text-slate-400 rounded-[28px] text-[10px] font-black uppercase tracking-widest">Cancel</button>
                                <button onClick={handleAddExtraTopic} className="flex-[2] py-5 bg-brand-500 text-white rounded-[28px] text-[10px] font-black uppercase tracking-widest shadow-xl shadow-brand-500/20">Add Topic to Unit</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Sub-component for Topic Item
const TopicCard = ({ topic, onToggle, isExtra = false, onDelete }) => {
    const statusIcons = {
        not_started: <div className="w-5 h-5 rounded-full border-2 border-slate-200" title="Not Started" />,
        teaching: (
            <div className="w-5 h-5 rounded-full bg-orange-400 flex items-center justify-center animate-pulse" title="Teaching Currently">
                <div className="w-2.5 h-2.5 bg-white rounded-full" />
            </div>
        ),
        completed: (
            <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center transition-all scale-110" title="Completed">
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
            </div>
        )
    };

    return (
        <div 
            onClick={onToggle}
            className={`flex items-start gap-4 p-5 rounded-[24px] border-2 transition-all cursor-pointer group relative overflow-hidden ${
                topic.status === 'completed' 
                    ? 'bg-slate-50 dark:bg-slate-800/50 border-transparent opacity-80' 
                    : topic.status === 'teaching'
                        ? 'bg-orange-50/30 dark:bg-orange-500/10 border-orange-100 dark:border-orange-500/20 shadow-sm'
                        : 'bg-white dark:bg-slate-700 border-slate-50 dark:border-white/10 hover:border-slate-200'
            }`}
        >
            <div className="relative z-10 mt-0.5">
                {statusIcons[topic.status]}
            </div>
            
            <div className="flex-1 relative z-10 space-y-1.5">
                <div className="flex justify-between items-start gap-4">
                    <p className={`text-[12px] font-bold tracking-tight leading-snug ${topic.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                        {topic.topic_name}
                    </p>
                    {isExtra && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); onDelete(); }}
                            className="p-1 px-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                        >
                            <Trash2 className="w-3 h-3" />
                        </button>
                    )}
                </div>

                {topic.status === 'completed' && (
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="text-[8px] font-black uppercase text-emerald-600 flex items-center gap-1.5 bg-emerald-50 px-2 py-1 rounded-lg">
                            <Calendar className="w-2.5 h-2.5" /> {new Date(topic.completed_at).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                        </span>
                        {topic.notes && (
                            <span className="text-[8px] font-black uppercase text-brand-500 flex items-center gap-1.5 bg-brand-50 px-2 py-1 rounded-lg" title={topic.notes}>
                                <Info className="w-2.5 h-2.5" /> Feedback: {topic.notes.substring(0, 15)}...
                            </span>
                        )}
                    </div>
                )}

                {topic.status === 'teaching' && (
                    <div className="flex items-center gap-2">
                        <span className="text-[8px] font-black uppercase text-orange-600 bg-orange-100/50 px-2 py-1 rounded-lg">In Focus Today</span>
                    </div>
                )}

                {!isExtra && topic.topic_type && topic.topic_type !== 'core' && (
                    <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">{topic.topic_type.replace(/_/g, ' ')}</span>
                )}
            </div>

            {/* Special Badge for Extra Topics */}
            {isExtra && (
                <div className="absolute -right-1 -top-1 px-3 py-1 bg-brand-500 text-white text-[7px] font-black tracking-widest uppercase origin-bottom-right transform rotate-45 translate-x-3 translate-y-3 hidden group-hover:block">
                    PRO TOPIC
                </div>
            )}
        </div>
    );
};

export default SyllabusTracker;
