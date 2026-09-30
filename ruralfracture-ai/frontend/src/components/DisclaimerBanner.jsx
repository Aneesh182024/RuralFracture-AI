import React from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

const DisclaimerBanner = ({ compact = false }) => {
  if (compact) {
    return (
      <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-lg text-xs text-amber-300">
        <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
        <span>AI-assisted screening only. Final clinical decision must be made by a qualified healthcare professional.</span>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent border-l-4 border-amber-500 p-4 rounded-r-xl my-4 text-slate-200 shadow-md">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-semibold text-amber-300 uppercase tracking-wider">
            Important Medical Disclaimer
          </h4>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            RuralFracture-AI provides <strong>AI-assisted screening only</strong>. Final interpretation, diagnosis, and treatment planning must be performed by a licensed medical practitioner or radiologist.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DisclaimerBanner;
