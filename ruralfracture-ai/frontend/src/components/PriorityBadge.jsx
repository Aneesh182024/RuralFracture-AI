import React from 'react';
import { AlertOctagon, AlertTriangle, CheckCircle, ImageOff } from 'lucide-react';

const PriorityBadge = ({ priority = 'LOW', showDescription = false }) => {
  const configs = {
    HIGH: {
      bg: 'bg-rose-500/20 border-rose-500/50 text-rose-300',
      glow: 'glow-rose',
      icon: AlertOctagon,
      label: 'HIGH PRIORITY',
      desc: 'Strong fracture indication — priority clinical review',
    },
    MEDIUM: {
      bg: 'bg-amber-500/20 border-amber-500/50 text-amber-300',
      glow: 'shadow-amber-500/20',
      icon: AlertTriangle,
      label: 'MEDIUM PRIORITY',
      desc: 'Possible fracture — clinical review required',
    },
    LOW: {
      bg: 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300',
      glow: 'glow-emerald',
      icon: CheckCircle,
      label: 'LOW PRIORITY',
      desc: 'No obvious fracture detected',
    },
    GRAY: {
      bg: 'bg-slate-700/40 border-slate-600 text-slate-300',
      glow: '',
      icon: ImageOff,
      label: 'POOR QUALITY',
      desc: 'Poor image quality — retake/re-upload recommended',
    },
  };

  const config = configs[priority] || configs.LOW;
  const IconComponent = config.icon;

  return (
    <div className="inline-flex flex-col gap-1">
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${config.bg} ${config.glow}`}>
        <IconComponent className="w-3.5 h-3.5" />
        {config.label}
      </span>
      {showDescription && (
        <span className="text-xs text-slate-400 font-normal">
          {config.desc}
        </span>
      )}
    </div>
  );
};

export default PriorityBadge;
