import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { RefreshCw, Check, X, AlertCircle, Clock, Calendar, Users } from 'lucide-react';
import { API_BASE_URL } from '../../../config/apiConfig';

const SubstitutionManager = ({ user }) => {
  const [requests, setRequests] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('attendease_token');
      const [reqRes, availRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/teacher/substitution/requests`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_BASE_URL}/teacher/availability`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setRequests(reqRes.data);
      setAvailability(availRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, action) => {
    try {
      const token = localStorage.getItem('attendease_token');
      await axios.put(`${API_BASE_URL}/teacher/substitution/request/${id}/${action}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const freePeriods = [
    { day: 'Monday', time: '13:45 - 16:45', duration: '3 hours' },
    { day: 'Tuesday', time: '13:45 - 16:45', duration: '3 hours' },
    { day: 'Wednesday', time: '13:45 - 16:45', duration: '3 hours' },
    { day: 'Thursday', time: '11:00 - 13:00', duration: '2 hours' },
    { day: 'Friday', time: '14:45 - 16:45', duration: '2 hours' },
    { day: 'Saturday', time: 'All Day', duration: '6 hours' },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="bg-white rounded-[40px] p-10 border border-slate-100 shadow-xl space-y-8">
        <div className="flex justify-between items-center">
           <div>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight uppercase flex items-center gap-3">
                 <RefreshCw className="w-8 h-8 text-indigo-500" /> Substitution Availability
              </h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Manage your free periods and availability status</p>
           </div>
           <button className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-slate-900/20 hover:scale-105 transition-all">
              Manage Availability Settings
           </button>
        </div>

        <div className="overflow-x-auto rounded-[32px] border border-slate-100 pb-2">
           <table className="w-full text-left">
              <thead>
                 <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="px-8 py-5">Day</th>
                    <th className="px-8 py-5">Time Slot</th>
                    <th className="px-8 py-5">Duration</th>
                    <th className="px-8 py-5 text-right">Action</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                 {freePeriods.map((fp, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                       <td className="px-8 py-6">
                          <span className="text-sm font-black text-slate-800 uppercase tracking-wide">{fp.day}</span>
                       </td>
                       <td className="px-8 py-6">
                          <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
                             <Clock className="w-4 h-4 text-indigo-400" /> {fp.time}
                          </div>
                       </td>
                       <td className="px-8 py-6">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded-lg">{fp.duration}</span>
                       </td>
                       <td className="px-8 py-6 text-right">
                          <div className="flex justify-end gap-2">
                             <button className="px-5 py-2.5 bg-brand-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-md shadow-brand-500/10 hover:scale-105 transition-all">
                                Mark Available
                             </button>
                             <button className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all">
                                View Requests
                             </button>
                          </div>
                       </td>
                    </tr>
                 ))}
              </tbody>
           </table>
        </div>
      </div>

      {/* Pending Requests */}
      <div className="bg-white rounded-[40px] p-10 border border-slate-100 shadow-xl space-y-8 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-50 rounded-full -mr-24 -mt-24 opacity-50"></div>
        
        <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase flex items-center gap-3 relative z-10">
           <AlertCircle className="w-7 h-7 text-amber-500" /> Pending Substitution Requests
        </h3>

        {requests.length > 0 ? (
          <div className="space-y-4 relative z-10">
            {requests.map((req, i) => (
              <div key={i} className="p-8 rounded-[32px] bg-slate-50 border border-slate-100 flex flex-col lg:flex-row justify-between items-center gap-8">
                 <div className="flex items-start gap-6">
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-amber-500 shadow-sm border border-slate-100 text-xl font-black">
                       {req.original_teacher_name.charAt(0)}
                    </div>
                    <div>
                       <div className="flex items-center gap-2 mb-2">
                          <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">{req.original_teacher_name}</span>
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1.5 py-0.5 border border-slate-200 rounded-lg">Requester</span>
                       </div>
                       <h5 className="text-md font-black text-slate-800 uppercase tracking-tight">{req.subject_name}</h5>
                       <div className="flex flex-wrap items-center gap-4 mt-3">
                          <span className="flex items-center gap-1 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                             <Calendar className="w-3.5 h-3.5" /> {new Date(req.request_date).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                             <Clock className="w-3.5 h-3.5" /> {req.start_time.substring(0, 5)} - {req.end_time.substring(0, 5)}
                          </span>
                       </div>
                       <p className="mt-4 text-[10px] font-bold text-slate-500 italic bg-amber-50 px-3 py-2 rounded-xl border border-amber-100">" {req.reason || 'Medical emergency'} "</p>
                    </div>
                 </div>

                 <div className="flex gap-3">
                    <button 
                      onClick={() => handleAction(req.id, 'accept')}
                      className="px-8 py-4 bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                    >
                       <Check className="w-4 h-4" /> Accept Request
                    </button>
                    <button 
                      onClick={() => handleAction(req.id, 'reject')}
                      className="px-8 py-4 bg-white border border-red-100 text-red-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-50 transition-all flex items-center gap-2"
                    >
                       <X className="w-4 h-4" /> Reject
                    </button>
                 </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center relative z-10">
             <CheckCircle className="w-10 h-10 text-emerald-400 mb-3 opacity-50" />
             <p className="text-slate-400 font-black uppercase tracking-widest text-[11px]">No pending substitution requests</p>
          </div>
        )}

        <div className="pt-6 text-center relative z-10">
           <button className="text-[10px] font-black text-brand-500 uppercase tracking-widest border-b-2 border-brand-200 hover:border-brand-500 transition-all">View Full Request History</button>
        </div>
      </div>
    </div>
  );
};

export default SubstitutionManager;
