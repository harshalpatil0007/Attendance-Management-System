import React, { useState } from 'react';
import { LayoutGrid, List, UserCircle, Table as TableIcon, Download, Calendar } from 'lucide-react';
import TimetableGridView from './TimetableGridView';
import TimetableListView from './TimetableListView';
import PersonalizedSchedule from './PersonalizedSchedule';
import SubjectFacultyTable from './SubjectFacultyTable';
import BatchAllocationTable from './BatchAllocationTable';
import UpcomingClassWidget from './UpcomingClassWidget';

const TimetableContainer = ({ data }) => {
  const [activeTab, setActiveTab] = useState('grid');
  const { timetable, profile, subject_details, batch_info } = data || {};

  const tabs = [
    { id: 'grid', label: 'Weekly Grid', icon: LayoutGrid },
    { id: 'list', label: 'List View', icon: List },
    { id: 'personalized', label: 'My Schedule', icon: UserCircle },
    { id: 'metadata', label: 'Academic Details', icon: TableIcon }
  ];

  if (!timetable || timetable.length === 0) {
    return (
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/20 p-12 rounded-[50px] text-center max-w-4xl mx-auto shadow-xl shadow-amber-900/5 transition-colors">
        <div className="w-24 h-24 bg-white rounded-[40px] flex items-center justify-center mx-auto mb-6 shadow-sm border border-amber-100">
           <Calendar className="w-10 h-10 text-amber-500" />
        </div>
        <h3 className="text-2xl font-black text-amber-900 dark:text-amber-100 mb-2 uppercase tracking-tight transition-colors">Schedule Not Available</h3>
        <p className="text-amber-800/60 dark:text-amber-200/60 font-medium max-w-md mx-auto mb-8 transition-colors">
           We couldn't find any timetable entries for your current section. Please ensure your profile academic details are correct.
        </p>
        <button className="px-8 py-3 bg-white text-amber-700 rounded-3xl font-black text-xs uppercase tracking-widest border border-amber-100 transition-all hover:bg-amber-100">
           Verify My Profile
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* 1. Upcoming Class Widget */}
      <UpcomingClassWidget timetable={timetable} />

      {/* 2. Top Header & Tabs */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
           <div className="flex items-center gap-4 mb-1">
              <h2 className="text-3xl font-black text-[#1a3a5c] dark:text-white uppercase tracking-tighter transition-colors">My Timetable</h2>
              <span className="px-3 py-1 bg-[#1a3a5c]/5 dark:bg-white/10 text-[#1a3a5c] dark:text-slate-200 text-[10px] font-black rounded-lg uppercase tracking-widest border border-[#1a3a5c]/5 dark:border-white/10 transition-colors">
                 AY 2025-26
              </span>
           </div>
           <p className="text-slate-400 dark:text-slate-300 text-sm font-bold flex items-center gap-2 transition-colors">
              Dept: <span className="text-slate-600 dark:text-white uppercase transition-colors">{profile?.department}</span> 
              <span className="text-slate-200">|</span> 
              Section: <span className="text-slate-600 dark:text-white transition-colors">{profile?.year}-{profile?.division}</span>
              <span className="text-slate-200">|</span> 
              Semester: <span className="text-slate-600 dark:text-white transition-colors">{profile?.current_semester} (Term II)</span>
           </p>
        </div>

        <div className="flex items-center gap-2 bg-white dark:bg-slate-500 p-2 rounded-[32px] border border-slate-100 dark:border-white/10 shadow-sm transition-colors">
           {tabs.map(tab => (
             <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 rounded-[24px] text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeTab === tab.id ? 'bg-[#1a3a5c] dark:bg-brand-500 text-white shadow-lg' : 'text-slate-400 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600'
                }`}
             >
                <tab.icon className="w-4 h-4" /> {tab.label}
             </button>
           ))}
        </div>
      </div>

      {/* 3. Dynamic Content View */}
      <div className="relative min-h-[400px]">
         {activeTab === 'grid' && <TimetableGridView timetable={timetable} batchInfo={batch_info} />}
         {activeTab === 'list' && <TimetableListView timetable={timetable} />}
         {activeTab === 'personalized' && <PersonalizedSchedule timetable={timetable} batchInfo={batch_info} />}
         {activeTab === 'metadata' && (
           <div className="space-y-10">
              <SubjectFacultyTable subjects={subject_details} />
              <BatchAllocationTable batchInfo={batch_info} />
           </div>
         )}
      </div>

      {/* 4. Footer Actions */}
      <div className="flex flex-col md:flex-row justify-center items-center gap-6 pt-4">
         <button className="group px-10 py-5 bg-[#1a3a5c] hover:bg-[#d4a017] text-white hover:text-[#1a3a5c] rounded-[32px] font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-[#1a3a5c]/20 flex items-center gap-4">
            <Download className="w-5 h-5 group-hover:animate-bounce" /> Download PDF Version
         </button>
         <button className="px-10 py-5 bg-white border-2 border-slate-100 text-slate-400 rounded-[32px] font-black text-xs uppercase tracking-widest transition-all hover:border-[#1a3a5c] hover:text-[#1a3a5c]">
            Report Discrepancy
         </button>
      </div>
    </div>
  );
};

export default TimetableContainer;
