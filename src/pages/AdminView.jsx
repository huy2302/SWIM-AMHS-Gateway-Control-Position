import React from 'react';
import { 
  Database, BarChart3, Wrench, Globe, 
  ArrowLeftRight, Activity, Trash2, Eraser, 
  RefreshCcw, FileSpreadsheet, Zap, AlertTriangle 
} from 'lucide-react';
import DashboardLayout from '../layout/DashboardLayout';

const AdminView = () => {
  return (
    <DashboardLayout>
        <div className="flex flex-col h-full bg-slate-950 text-slate-200 p-6 overflow-y-auto custom-scrollbar">
        
        {/* Header cảnh báo đặc thù của màn Admin */}
        <div className="mb-6 flex items-center gap-3 bg-red-950/20 border border-red-900/50 p-3 rounded-lg text-red-400">
            <AlertTriangle size={18} />
            <span className="text-xs font-bold uppercase tracking-tight">
            Caution: Some administrative actions are irreversible. Proceed with care.
            </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Nhóm 1: Database Management */}
            <AdminPanel title="Database" icon={<Database size={16}/>}>
            <AdminAction icon={<Trash2 size={14} className="text-red-500"/>} label="Delete all entries from the database" />
            <AdminAction icon={<Eraser size={14} className="text-orange-500"/>} label="Delete entries older than 24 hours" />
            </AdminPanel>

            {/* Nhóm 2: Statistics */}
            <AdminPanel title="Statistics" icon={<BarChart3 size={16}/>}>
            <AdminAction icon={<RefreshCcw size={14}/>} label="Reset all statistics" />
            <AdminAction icon={<FileSpreadsheet size={14}/>} label="Statistical Report" />
            </AdminPanel>

            {/* Nhóm 3: Maintenance */}
            <AdminPanel title="Maintenance" icon={<Wrench size={16}/>}>
            <AdminAction icon={<Zap size={14} className="text-yellow-500"/>} label="Perform Maintenance now" />
            </AdminPanel>

            {/* Nhóm 4: Connectivity Tests */}
            <AdminPanel title="Connectivity Tests" icon={<Globe size={16}/>}>
            <AdminAction icon={<Activity size={14}/>} label="Check Connection" />
            </AdminPanel>

            {/* Nhóm 5: AFTN/AMHS Address Conversion */}
            <AdminPanel title="AFTN/AMHS Address Conversion" icon={<ArrowLeftRight size={16}/>}>
            <AdminAction icon={<ArrowLeftRight size={14}/>} label="AFTN/AMHS Address Conversion" />
            </AdminPanel>

            {/* Nhóm 6: Diagnostic */}
            <AdminPanel title="Diagnostic" icon={<Activity size={16}/>}>
            <AdminAction icon={<Activity size={14}/>} label="Diagnostic" />
            </AdminPanel>

        </div>

        {/* Footer thông tin hệ thống */}
        <div className="mt-auto pt-8 flex justify-between text-[10px] text-slate-600 border-t border-slate-900">
            <span>Admin Console v2.4.0</span>
            <span>Node ID: SWIM-GW-HAN-01</span>
        </div>
        </div>
    </DashboardLayout>
  );
};

// Component khung của từng nhóm chức năng
const AdminPanel = ({ title, icon, children }) => (
  <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg transition-all hover:border-slate-700">
    <div className="bg-slate-800/50 px-4 py-2.5 border-b border-slate-700 flex items-center gap-2">
      <span className="text-blue-400">{icon}</span>
      <h3 className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">{title}</h3>
    </div>
    <div className="p-3 flex flex-col gap-1">
      {children}
    </div>
  </div>
);

// Component cho từng nút hành động
const AdminAction = ({ icon, label }) => (
  <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-all group active:scale-[0.98]">
    <span className="p-1.5 rounded-md bg-slate-950 border border-slate-800 group-hover:border-slate-600 transition-colors">
      {icon}
    </span>
    <span className="font-medium">{label}</span>
  </button>
);

export default AdminView;