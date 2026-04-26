import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    FileText, Download, FileSpreadsheet, 
    Calendar, Users, BarChart3, ChevronRight,
    Loader2, CheckCircle, AlertCircle
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import { API_BASE_URL } from '../../config/apiConfig';

const ReportsSection = ({ assignedClasses }) => {
    const [loading, setLoading] = useState(false);
    const [reportType, setReportType] = useState('attendance');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [selectedYear, setSelectedYear] = useState('');
    const [selectedDiv, setSelectedDiv] = useState('');
    const [iseNumber, setIseNumber] = useState('1');
    const [extraClasses, setExtraClasses] = useState([]);

    // Fetch all available classes for this subject if it's from expertise
    useEffect(() => {
        if (selectedSubject) {
            fetchSubjectClasses();
        } else {
            setExtraClasses([]);
        }
    }, [selectedSubject]);

    const fetchSubjectClasses = async () => {
        try {
            const token = localStorage.getItem('attendease_token');
            const res = await axios.get(`${API_BASE_URL}/teacher/subject-classes/${selectedSubject}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setExtraClasses(res.data);
        } catch (error) {
            console.error("Error fetching subject classes:", error);
        }
    };

    // Combine official assignments with all discovered classes for this subject
    const subjectAssignments = assignedClasses.filter(c => c.subject_id == selectedSubject);
    const isExpertiseOnly = subjectAssignments.length > 0 && subjectAssignments.every(c => c.is_expertise_only);
    
    // Use extraClasses if available, otherwise fallback to assignments
    const displayClasses = extraClasses.length > 0 ? extraClasses : subjectAssignments;
    
    const availableYears = Array.from(new Set(displayClasses.map(c => c.year))).filter(Boolean);
    const availableDivs = Array.from(new Set(displayClasses.filter(c => !selectedYear || c.year == selectedYear).map(c => c.division))).filter(Boolean);

    const fetchReportData = async () => {
        if (!selectedSubject || !selectedYear || !selectedDiv) {
            alert("Please select Subject, Year, and Division");
            return null;
        }
        setLoading(true);
        try {
            const token = localStorage.getItem('attendease_token');
            let endpoint = `${API_BASE_URL}/attendance/consolidated-report?subject_id=${selectedSubject}&year=${selectedYear}&division=${selectedDiv}`;
            
            if (reportType === 'ise') {
                endpoint = `${API_BASE_URL}/ise/students/${selectedSubject}/${selectedYear}/${selectedDiv}/${iseNumber}`;
            } else if (reportType === 'syllabus') {
                endpoint = `${API_BASE_URL}/syllabus/${selectedSubject}?division=${selectedDiv}`;
            }

            const res = await axios.get(endpoint, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (reportType === 'syllabus') {
                // Flatten syllabus data: Unit -> Topics
                const flattened = [];
                res.data.forEach(unit => {
                    unit.topics.forEach(topic => {
                        flattened.push({
                            unit_name: unit.unit_name,
                            unit_number: unit.unit_number,
                            topic_name: topic.topic_name,
                            status: topic.status,
                            completed_at: topic.completed_at
                        });
                    });
                });
                return flattened;
            }

            return res.data;
        } catch (error) {
            console.error(error);
            alert("Error fetching report data");
            return null;
        } finally {
            setLoading(false);
        }
    };

    const generatePDF = async () => {
        const data = await fetchReportData();
        if (!data) return;

        try {
            const doc = new jsPDF();
            const subjectName = assignedClasses.find(c => c.subject_id == selectedSubject)?.subject_name;
            
            // Add Header
            doc.setFontSize(22);
            doc.setTextColor(26, 58, 92);
            doc.text("SSBT COET JALGAON", 105, 20, { align: "center" });
            
            doc.setFontSize(14);
            doc.setTextColor(100);
            const reportTitle = reportType === 'defaulters' ? 'Defaulter Students List (<75%)' : 
                               reportType === 'ise' ? `Internal Sessional Examination ${iseNumber} (ISE-${iseNumber})` : 
                               reportType === 'syllabus' ? 'Syllabus Coverage Status' : 'Attendance Performance Report';
            doc.text(reportTitle, 105, 30, { align: "center" });
            
            doc.setDrawColor(212, 160, 23);
            doc.setLineWidth(1);
            doc.line(20, 35, 190, 35);

            // Add Details
            doc.setFontSize(10);
            doc.setTextColor(0);
            doc.text(`Subject: ${subjectName}`, 20, 45);
            doc.text(`Class: ${selectedYear} - Div ${selectedDiv}`, 20, 51);
            doc.text(`Date Generated: ${new Date().toLocaleDateString()}`, 20, 57);

            const filteredData = reportType === 'defaulters' 
                ? data.filter(s => parseFloat(s.percentage) < 75)
                : data;

            let tableHead, tableBody;

            if (reportType === 'ise') {
                tableHead = [['#', 'Student Name', 'PRN', 'Roll', 'Marks (10)', 'Status', 'Attendance %']];
                tableBody = filteredData.map((s, idx) => [
                    (idx + 1).toString(),
                    s.name,
                    s.prn_number || 'N/A',
                    s.roll_no_in_class || 'N/A',
                    s.marks_obtained !== null && s.marks_obtained !== undefined ? parseFloat(s.marks_obtained).toString() : 'N/A',
                    s.status || 'N/A',
                    s.attendance_rate ? `${parseFloat(s.attendance_rate).toFixed(1)}%` : '0%'
                ]);
            } else if (reportType === 'syllabus') {
                tableHead = [['#', 'Unit', 'Topic', 'Status', 'Completed At']];
                tableBody = filteredData.map((t, idx) => [
                    (idx + 1).toString(),
                    `Unit ${t.unit_number}: ${t.unit_name}`,
                    t.topic_name,
                    t.status.replace('_', ' ').toUpperCase(),
                    t.completed_at ? new Date(t.completed_at).toLocaleDateString() : 'N/A'
                ]);
            } else {
                // Attendance or Defaulters
                tableHead = [['#', 'Student Name', 'PRN', 'Roll', 'Attendance', 'Percentage']];
                tableBody = filteredData.map((s, idx) => [
                    (idx + 1).toString(),
                    s.name,
                    s.prn_number || 'N/A',
                    s.roll_number || 'N/A',
                    `${s.present_count}/${s.total_sessions}`,
                    `${s.percentage}%`
                ]);
            }

            autoTable(doc, {
                startY: 65,
                head: tableHead,
                body: tableBody,
                theme: 'grid',
                headStyles: { fillColor: [26, 58, 92], textColor: [255, 255, 255], fontSize: 9 },
                styles: { fontSize: 8 },
                alternateRowStyles: { fillColor: [245, 245, 245] }
            });


            doc.save(`${reportTitle.replace(/ /g, '_')}_${selectedYear}_${selectedDiv}.pdf`);
        } catch (error) {
            console.error(error);
        }
    };

    const generateExcel = async () => {
        const data = await fetchReportData();
        if (!data) return;

        const subjectName = assignedClasses.find(c => c.subject_id == selectedSubject)?.subject_name;
        const filteredData = reportType === 'defaulters' 
            ? data.filter(s => parseFloat(s.percentage) < 75)
            : data;

        let headers, rows;

        if (reportType === 'ise') {
            headers = ['Roll No', 'PRN', 'Name', 'Marks Obtained', 'Status', 'Attendance %'];
            rows = filteredData.map(s => [
                s.roll_no_in_class || '',
                s.prn_number || '',
                s.name,
                s.marks_obtained !== null && s.marks_obtained !== undefined ? parseFloat(s.marks_obtained).toString() : '',
                s.status || '',
                (s.attendance_rate ? parseFloat(s.attendance_rate).toFixed(1) : '0') + '%'
            ]);
        } else if (reportType === 'syllabus') {
            headers = ['Unit', 'Topic', 'Status', 'Completed At'];
            rows = filteredData.map(t => [
                `Unit ${t.unit_number}: ${t.unit_name}`,
                t.topic_name,
                t.status,
                t.completed_at ? new Date(t.completed_at).toLocaleDateString() : 'N/A'
            ]);
        } else {
            headers = ['Roll No', 'PRN', 'Name', 'Present', 'Total', 'Percentage'];
            rows = filteredData.map(s => [
                s.roll_number || '',
                s.prn_number || '',
                s.name,
                s.present_count,
                s.total_sessions,
                s.percentage + '%'
            ]);
        }

        const csvContent = "data:text/csv;charset=utf-8," 
            + headers.join(",") + "\n"
            + rows.map(e => e.map(val => `"${val}"`).join(",")).join("\n"); // Quote values to handle commas

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Report_${subjectName}_${selectedYear}_${selectedDiv}_${reportType}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="bg-white rounded-[40px] p-10 border border-slate-100 shadow-sm">
                <div className="flex items-center gap-4 mb-10">
                    <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center text-3xl">📊</div>
                    <div>
                        <h2 className="text-3xl font-black text-slate-800 tracking-tight">Reports & Analytical Exports</h2>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">One-click documentation for NBA/NAAC</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-6">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Select Report Category</label>
                            <div className="grid grid-cols-1 gap-2">
                                {[
                                    { id: 'attendance', label: 'Daily Attendance Report', icon: Users },
                                    { id: 'ise', label: 'ISE Marks Analysis', icon: BarChart3 },
                                    { id: 'syllabus', label: 'Syllabus Coverage Status', icon: FileText },
                                    { id: 'defaulters', label: 'Defaulter Students List', icon: Calendar }
                                ].map(item => (
                                    <button 
                                        key={item.id}
                                        onClick={() => setReportType(item.id)}
                                        className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${reportType === item.id ? 'border-brand-500 bg-brand-50' : 'border-slate-50 hover:border-slate-100'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <item.icon className={`w-5 h-5 ${reportType === item.id ? 'text-brand-500' : 'text-slate-400'}`} />
                                            <span className={`text-sm font-bold ${reportType === item.id ? 'text-slate-800' : 'text-slate-600'}`}>{item.label}</span>
                                        </div>
                                        {reportType === item.id && <CheckCircle className="w-4 h-4 text-brand-500" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="sm:col-span-2">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Subject</label>
                                <select 
                                    value={selectedSubject}
                                    onChange={(e) => { setSelectedSubject(e.target.value); setSelectedYear(''); setSelectedDiv(''); }}
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 font-bold text-slate-700 outline-none focus:border-brand-500"
                                >
                                    <option value="">Select Target Subject</option>
                                    {Array.from(new Map(assignedClasses.map(s => [s.unique_id, s])).values()).map(c => (
                                        <option key={c.unique_id} value={c.subject_id}>{c.is_lab ? '[LAB] ' : ''}{c.subject_name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Year</label>
                                <select 
                                    value={selectedYear}
                                    onChange={(e) => { setSelectedYear(e.target.value); setSelectedDiv(''); }}
                                    disabled={!selectedSubject}
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 font-bold text-slate-700 outline-none disabled:opacity-50"
                                >
                                    <option value="">Select Year</option>
                                    {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Division</label>
                                <select 
                                    value={selectedDiv}
                                    onChange={(e) => setSelectedDiv(e.target.value)}
                                    disabled={!selectedYear}
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 font-bold text-slate-700 outline-none disabled:opacity-50"
                                >
                                    <option value="">Select Div</option>
                                    {availableDivs.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                            {reportType === 'ise' && (
                                <div className="sm:col-span-2">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">ISE Number</label>
                                    <select 
                                        value={iseNumber}
                                        onChange={(e) => setIseNumber(e.target.value)}
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 font-bold text-slate-700 outline-none focus:border-brand-500"
                                    >
                                        <option value="1">Internal Sessional Examination 1 (ISE-I)</option>
                                        <option value="2">Internal Sessional Examination 2 (ISE-II)</option>
                                        <option value="3">Internal Sessional Examination 3 (ISE-III)</option>
                                    </select>
                                </div>
                            )}

                            {isExpertiseOnly && (
                                <div className={`sm:col-span-2 p-4 ${availableYears.length > 0 ? 'bg-indigo-50 border-indigo-100' : 'bg-amber-50 border-amber-100'} rounded-2xl transition-all`}>
                                    <p className={`text-[10px] font-bold ${availableYears.length > 0 ? 'text-indigo-700' : 'text-amber-700'} flex items-center gap-2`}>
                                        {availableYears.length > 0 ? (
                                            <><CheckCircle className="w-4 h-4" /> This subject is in your expertise. Showing all available classes from the timetable.</>
                                        ) : (
                                            <><AlertCircle className="w-4 h-4" /> This subject is in your expertise but no classes are assigned to you yet.</>
                                        )}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="bg-slate-900 rounded-3xl p-8 text-white space-y-6">
                            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Export Formats</h4>
                            <div className="flex flex-col gap-3">
                                <button 
                                    onClick={generatePDF}
                                    disabled={loading || !selectedDiv}
                                    className="w-full py-4 bg-white text-slate-900 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 hover:bg-brand-500 hover:text-white transition-all disabled:opacity-50"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Download className="w-4 h-4" /> Export as PDF</>}
                                </button>
                                <button 
                                    onClick={generateExcel}
                                    disabled={loading || !selectedDiv}
                                    className="w-full py-4 bg-slate-800 text-slate-400 border border-slate-700 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 hover:text-white transition-all disabled:opacity-50"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><FileSpreadsheet className="w-4 h-4" /> Export as Excel (.xlsx)</>}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportsSection;
