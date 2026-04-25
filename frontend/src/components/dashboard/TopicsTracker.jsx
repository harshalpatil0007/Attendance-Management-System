import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/apiConfig';
import {
    CheckCircle2, Circle, Book, Layout, ArrowRight, 
    Star, Info, Calendar, Edit3, Save, 
    AlertCircle, Clock, BookOpen, ChevronRight,
    Search, Filter
} from 'lucide-react';

const TopicsTracker = ({ syllabus: initialSyllabus }) => {
  const [syllabus, setSyllabus] = useState(initialSyllabus || []);
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [loading, setLoading] = useState(false);
  const [activeNote, setActiveNote] = useState(null); // { topicId, note, review }
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    fetchLatestSyllabus();
  }, [selectedSubject]);

  const fetchLatestSyllabus = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('attendease_token');
      const res = await axios.get(`${API_BASE_URL}/student/syllabus/${selectedSubject}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSyllabus(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const savePersonalNote = async (topicId) => {
    setSavingNote(true);
    try {
      const token = localStorage.getItem('attendease_token');
      await axios.post(`${API_BASE_URL}/student/syllabus/note` , {
        topicId,
        personalNote: activeNote.note,
        markedForReview: activeNote.review
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setActiveNote(null);
      fetchLatestSyllabus();
    } catch (error) {
      console.error(error);
    } finally {
      setSavingNote(false);
    }
  };

  // Progress Calculation
  const calculateTotalProgress = (subjects) => {
    const allTopics = subjects.flatMap(s => s.units.flatMap(u => u.topics));
    if (allTopics.length === 0) return 0;
    const score = allTopics.reduce((acc, t) => {
      if (t.status === 'completed') return acc + 1;
      if (t.status === 'teaching') return acc + 0.5;
      return acc;
    }, 0);
    return Math.round((score / allTopics.length) * 100);
  };

  const totalProgress = calculateTotalProgress(syllabus);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Hero Stats */}
      <div className="bg-white dark:bg-slate-500 p-8 rounded-[40px] border border-slate-100 dark:border-white/10 shadow-sm flex flex-col md:flex-row justify-between items-center gap-8 transition-colors">
        <div className="flex-1 space-y-4">
            <div className="flex items-center gap-3">
               <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/20 rounded-2xl flex items-center justify-center text-xl transition-colors">🎓</div>
               <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight transition-colors">Curriculum Tracking Hub</h2>
            </div>
            <p className="text-slate-500 dark:text-slate-200 font-bold text-sm transition-colors">Stay ahead by tracking teacher progress and managing your personal study notes.</p>
           
           <div className="flex flex-wrap gap-3">
               <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-600 rounded-xl border border-slate-100 dark:border-white/10 transition-colors">
                 <Clock className="w-3.5 h-3.5 text-orange-400" />
                 <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-200 tracking-wider transition-colors">0.5 pts per live topic</span>
               </div>
               <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-600 rounded-xl border border-slate-100 dark:border-white/10 transition-colors">
                 <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                 <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-200 tracking-wider transition-colors">1.0 pts per covered topic</span>
               </div>
           </div>
        </div>

        <div className="w-full md:w-64 bg-slate-50/50 dark:bg-slate-600 p-6 rounded-[32px] border border-slate-100 dark:border-white/10 flex flex-col items-center transition-colors">
            <div className="relative w-24 h-24 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                    <circle cx="48" cy="48" r="42" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-200 dark:text-slate-500" />
                    <circle cx="48" cy="48" r="42" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={263.8} strokeDashoffset={263.8 - (263.8 * totalProgress) / 100} className="text-indigo-600 transition-all duration-1000" />
                </svg>
                <span className="absolute text-xl font-black text-slate-800 dark:text-white transition-colors">{totalProgress}%</span>
            </div>
            <p className="text-[9px] font-black text-slate-400 dark:text-slate-200 uppercase tracking-widest mt-4 transition-colors">Average Progress</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search concepts, topics or notes..."
              className="w-full bg-white border-2 border-slate-100 rounded-2xl pl-12 pr-6 py-4 font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all shadow-sm"
            />
          </div>
          <select 
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="bg-white border-2 border-slate-100 rounded-2xl px-6 py-4 font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all shadow-sm cursor-pointer"
          >
            <option value="all">All Subjects</option>
            {syllabus.map(sub => <option key={sub.id} value={sub.id}>{sub.name}</option>)}
          </select>
          <button className="p-4 bg-white border-2 border-slate-100 rounded-2xl hover:border-indigo-500 transition-all shadow-sm">
            <Filter className="w-5 h-5 text-slate-400" />
          </button>
      </div>

      {/* Syllabus Content */}
      <div className="grid grid-cols-1 gap-12 pb-20">
        {syllabus.map((subject) => {
          const subProgress = calculateTotalProgress([subject]);
          
          return (
            <div key={subject.id} className="space-y-6">
               <div className="flex items-center justify-between px-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight transition-colors">{subject.name}</h3>
                      <span className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest transition-colors">{subject.code}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-200 uppercase tracking-widest transition-colors">Syllabus Completion</span>
                    <div className="w-32 h-2.5 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-600 rounded-full transition-all duration-1000" style={{width: `${subProgress}%`}}></div>
                    </div>
                    <span className="text-[11px] font-black text-indigo-600 w-8">{subProgress}%</span>
                  </div>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {subject.units.map(unit => (
                    <div key={unit.unit_id} className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                      <div className="p-6 bg-slate-50/50 dark:bg-slate-600/50 border-b border-slate-100 dark:border-white/10 flex items-center justify-between transition-colors">
                        <h4 className="text-xs font-black text-slate-600 dark:text-slate-200 uppercase tracking-widest transition-colors">Unit {unit.number}: {unit.name}</h4>
                        <span className="px-3 py-1 bg-white dark:bg-slate-500 border border-slate-200 dark:border-white/10 rounded-full text-[9px] font-black text-slate-400 dark:text-slate-200 uppercase transition-colors">{unit.topics.length} Topics</span>
                      </div>
                      
                      <div className="p-4 flex-1 space-y-3">
                        {unit.topics.map(topic => (
                          <div 
                            key={topic.id} 
                            className={`group relative p-4 rounded-3xl transition-all border-2 ${
                              topic.status === 'completed' 
                              ? 'bg-slate-50/50 dark:bg-slate-600/50 border-transparent' 
                              : topic.status === 'teaching'
                                ? 'bg-orange-50/30 dark:bg-orange-500/10 border-orange-100 dark:border-orange-500/20'
                                : 'bg-white dark:bg-slate-500 border-slate-50 dark:border-white/5'
                            }`}
                          >
                            <div className="flex items-start gap-4">
                               <div className="mt-1">
                                  {topic.status === 'completed' ? (
                                    <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                                      <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                                    </div>
                                  ) : topic.status === 'teaching' ? (
                                    <div className="w-5 h-5 rounded-full bg-orange-400 animate-pulse flex items-center justify-center">
                                      <div className="w-2 h-2 bg-white rounded-full shadow-inner" />
                                    </div>
                                  ) : (
                                    <div className="w-5 h-5 rounded-full border-2 border-slate-200 flex items-center justify-center">
                                      <Circle className="w-3.5 h-3.5 text-slate-100" />
                                    </div>
                                  )}
                               </div>

                               <div className="flex-1 space-y-2">
                                   <div className="flex justify-between items-start gap-3">
                                    <p className={`text-sm font-bold tracking-tight leading-snug transition-colors ${topic.status === 'completed' ? 'text-slate-500 dark:text-slate-400' : 'text-slate-800 dark:text-white'}`}>
                                      {topic.name}
                                    </p>
                                    <div className="flex gap-2 shrink-0">
                                      {topic.marked_for_review && (
                                        <div className="p-1.5 bg-amber-50 rounded-lg text-amber-500" title="Marked for Review">
                                          <Star className="w-3 h-3 fill-current" />
                                        </div>
                                      )}
                                      <button 
                                        onClick={() => setActiveNote({ topicId: topic.id, note: topic.personal_note || '', review: !!topic.marked_for_review })}
                                        className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all opacity-0 group-hover:opacity-100"
                                      >
                                        <Edit3 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>

                                  <div className="flex flex-wrap gap-2 items-center">
                                    {topic.is_extra && (
                                      <span className="text-[7px] font-black uppercase tracking-[0.2em] bg-indigo-500 text-white px-2 py-0.5 rounded-md">Extra</span>
                                    )}
                                    {topic.importance === 'mandatory' && (
                                      <span className="text-[7px] font-black uppercase tracking-[0.2em] bg-red-100 text-red-600 px-2 py-0.5 rounded-md">V. Important</span>
                                    )}
                                    {topic.status === 'completed' && (
                                      <span className="text-[7px] font-black uppercase tracking-[0.2em] text-emerald-500">Covered</span>
                                    )}
                                    {topic.personal_note && (
                                      <span className="text-[7px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-1">
                                        <Info className="w-2.5 h-2.5" /> Note Added
                                      </span>
                                    )}
                                  </div>

                                   {topic.teacher_notes && (
                                    <div className="bg-white/50 dark:bg-slate-600/50 p-2.5 rounded-2xl border border-slate-100 dark:border-white/10 mt-2 transition-colors">
                                      <p className="text-[9px] font-bold text-slate-400 dark:text-slate-200 italic transition-colors">Teacher's Note: {topic.teacher_notes}</p>
                                    </div>
                                   )}
                               </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
               </div>
            </div>
          );
        })}
      </div>

      {/* Personal Note Modal */}
      {activeNote && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setActiveNote(null)}></div>
            <div className="bg-white dark:bg-slate-500 rounded-[40px] w-full max-w-lg relative z-10 shadow-2xl border border-slate-100 dark:border-white/10 overflow-hidden animate-in zoom-in-95 duration-300 transition-colors">
                <div className="p-8 bg-indigo-600 text-white flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/20 rounded-2xl">
                            <Edit3 className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-black tracking-tight">Personal Study Notes</h3>
                    </div>
                </div>

                <div className="p-8 space-y-6">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-200 uppercase mb-2 block px-1 transition-colors">Concept Difficulty / Questions</label>
                        <textarea 
                            autoFocus
                            value={activeNote.note}
                            onChange={(e) => setActiveNote({...activeNote, note: e.target.value})}
                            placeholder="Write your personal understanding, questions to ask, or reminder to study this later..."
                            className="w-full bg-slate-50 dark:bg-slate-600 border-2 border-slate-100 dark:border-white/10 rounded-2xl px-5 py-4 font-bold text-slate-700 dark:text-white outline-none focus:border-indigo-500 min-h-[150px] transition-colors"
                        />
                    </div>

                    <div 
                      onClick={() => setActiveNote({...activeNote, review: !activeNote.review})}
                      className={`flex items-center justify-between p-5 rounded-3xl border-2 cursor-pointer transition-all ${activeNote.review ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20' : 'bg-slate-50 dark:bg-slate-600 border-slate-100 dark:border-white/10'}`}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-xl ${activeNote.review ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                <Star className={`w-5 h-5 ${activeNote.review ? 'fill-current' : ''}`} />
                            </div>
                             <div>
                                <p className="text-sm font-black text-slate-800 dark:text-white transition-colors">Mark for Review</p>
                                <p className="text-[10px] text-slate-400 dark:text-slate-200 font-bold transition-colors">This will pin the topic for quick access</p>
                            </div>
                        </div>
                        <div className={`w-12 h-6 rounded-full transition-all relative ${activeNote.review ? 'bg-amber-500' : 'bg-slate-300'}`}>
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${activeNote.review ? 'left-7' : 'left-1'}`} />
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button onClick={() => setActiveNote(null)} className="flex-1 py-5 bg-slate-50 dark:bg-slate-600 text-slate-400 dark:text-slate-200 rounded-[28px] text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-slate-500 transition-all">Cancel</button>
                        <button 
                          onClick={() => savePersonalNote(activeNote.topicId)} 
                          disabled={savingNote}
                          className="flex-[2] py-5 bg-indigo-600 text-white rounded-[28px] text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            {savingNote ? <Clock className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {savingNote ? 'SYNCING...' : 'SAVE TO CLOUD'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default TopicsTracker;
