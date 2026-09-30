import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Activity, Shield, User, ToggleLeft, ToggleRight, Sparkles } from 'lucide-react';
import DisclaimerBanner from './DisclaimerBanner';

const Navbar = () => {
  const { user, switchRole, demoMode, setDemoMode } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-6 py-3">
      <div className="flex flex-wrap items-center justify-between gap-4">
        
        {/* Brand & Tagline */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 tracking-tight">
                RuralFracture-AI
              </span>
              <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                v1.0 Clinical
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium tracking-wide">
              Enhance. Detect. Prioritize.
            </p>
          </div>
        </div>

        {/* Center Compact Medical Disclaimer */}
        <div className="hidden lg:block">
          <DisclaimerBanner compact />
        </div>

        {/* Right Section: System Controls, Role Switcher, & User Profile */}
        <div className="flex items-center gap-4">
          
          {/* Demo Mode Toggle */}
          <button
            onClick={() => setDemoMode(!demoMode)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              demoMode
                ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
            }`}
            title="Toggle between Simulated Demo Mode and Real PyTorch Model Mode"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{demoMode ? 'DEMO MODE' : 'REAL MODEL MODE'}</span>
          </button>

          {/* Role Switcher Pill */}
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => switchRole('HEALTHCARE_WORKER')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                user?.role === 'HEALTHCARE_WORKER'
                  ? 'bg-cyan-600 text-white font-semibold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Worker
            </button>
            <button
              onClick={() => switchRole('DOCTOR')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                user?.role === 'DOCTOR'
                  ? 'bg-teal-600 text-white font-semibold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Doctor
            </button>
            <button
              onClick={() => switchRole('ADMIN')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                user?.role === 'ADMIN'
                  ? 'bg-indigo-600 text-white font-semibold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Admin
            </button>
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400 font-bold text-xs">
              {user?.name?.[0] || 'U'}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-semibold text-slate-200">{user?.name}</div>
              <div className="text-[10px] text-cyan-400 capitalize">{user?.role?.replace('_', ' ')}</div>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
};

export default Navbar;
