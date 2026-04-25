import { Briefcase, FileText, Bell, Settings as SettingsIcon } from 'lucide-react';

export const PlacementModule = () => (
    <div className="bg-white p-20 rounded-3xl border border-dotted border-slate-200 text-center">
        <Briefcase className="w-16 h-16 text-slate-100 mx-auto mb-4" />
        <h3 className="font-bold text-slate-400 uppercase tracking-widest text-sm text-center">Placement Analytics Portal</h3>
    </div>
);

export const ReportsModule = () => (
    <div className="bg-white p-20 rounded-3xl border border-dotted border-slate-200 text-center">
        <FileText className="w-16 h-16 text-slate-100 mx-auto mb-4" />
        <h3 className="font-bold text-slate-400 uppercase tracking-widest text-sm text-center">Compliance Report Engine</h3>
    </div>
);

export const NotificationsModule = () => (
    <div className="bg-white p-20 rounded-3xl border border-dotted border-slate-200 text-center">
        <Bell className="w-16 h-16 text-slate-100 mx-auto mb-4" />
        <h3 className="font-bold text-slate-400 uppercase tracking-widest text-sm text-center">Broadcast & Notification Center</h3>
    </div>
);

export const SettingsModule = () => (
    <div className="bg-white p-20 rounded-3xl border border-dotted border-slate-200 text-center">
        <SettingsIcon className="w-16 h-16 text-slate-100 mx-auto mb-4" />
        <h3 className="font-bold text-slate-400 uppercase tracking-widest text-sm text-center">System Configuration & Audit Logs</h3>
    </div>
);
