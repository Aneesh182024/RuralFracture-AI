import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  UserPlus,
  Users,
  UploadCloud,
  Sliders,
  FileCheck2,
  Stethoscope,
  Database,
  FolderKanban,
  LineChart,
  UserCog,
  Settings,
  Bot
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { user } = useAuth();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/new-case', label: 'Upload X-ray / New Case', icon: UploadCloud, highlight: true },
    { path: '/patient-register', label: 'Patient Registration', icon: UserPlus },
    { path: '/patients', label: 'Patient List', icon: Users },
    { path: '/quality-enhancement', label: 'Quality & Enhancement', icon: Sliders },
    { path: '/results', label: 'AI Screening Results', icon: FileCheck2 },
    { path: '/clinical-review', label: 'Clinical Review', icon: Stethoscope },
    { path: '/dataset-import', label: 'Dataset Import', icon: Database },
    { path: '/dataset-management', label: 'Dataset Management', icon: FolderKanban },
    { path: '/model-performance', label: 'Model Performance', icon: LineChart },
  ];

  if (user?.role === 'ADMIN') {
    navItems.push({ path: '/user-management', label: 'User Management', icon: UserCog });
  }

  navItems.push({ path: '/settings', label: 'System Settings', icon: Settings });

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 min-h-[calc(100vh-61px)]">
      <div className="p-4 space-y-1">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
          Clinical Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-lg shadow-cyan-600/20 font-semibold'
                    : item.highlight
                    ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/20'
                    : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          );
        })}
      </div>

      {/* Footer Info Box */}
      <div className="mt-auto p-4 border-t border-slate-800 text-xs text-slate-400 space-y-1">
        <div className="flex items-center justify-between text-slate-300 font-semibold">
          <span>EfficientNet-B0</span>
          <span className="text-emerald-400 text-[10px]">READY</span>
        </div>
        <div className="text-[11px] text-slate-400">OpenCV CLAHE Active</div>
        <div className="text-[10px] text-slate-400 pt-1">
          Grad-CAM Explainable AI Enabled
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
