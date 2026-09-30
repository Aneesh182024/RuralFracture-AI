import React, { useState } from 'react';
import { Flame, Info, Eye, Layers, AlertCircle } from 'lucide-react';
import { getImageUrl } from '../services/api';

const GradCAMViewer = ({ originalUrl, enhancedUrl, gradcamUrl }) => {
  const [viewMode, setViewMode] = useState('overlay'); // 'overlay', 'side-by-side'

  const origSrc = getImageUrl(originalUrl);
  const enhSrc = getImageUrl(enhancedUrl) || origSrc;
  const hasGradcam = Boolean(gradcamUrl);
  const gradcamSrc = getImageUrl(gradcamUrl) || origSrc;

  return (
    <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Flame className="w-5 h-5 text-rose-400" />
            Grad-CAM Model Explainability (XAI)
          </h3>
          <p className="text-xs text-slate-400">
            Gradient-weighted Class Activation Map showing EfficientNet-B0 feature attention
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setViewMode('overlay')}
            className={`px-3 py-1 rounded-md transition-all ${
              viewMode === 'overlay' ? 'bg-rose-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Heatmap Overlay
          </button>
          <button
            onClick={() => setViewMode('side-by-side')}
            className={`px-3 py-1 rounded-md transition-all ${
              viewMode === 'side-by-side' ? 'bg-rose-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            3-Way Comparison
          </button>
        </div>
      </div>

      {/* Mandatory Grad-CAM Explanation Notice */}
      <div className="bg-rose-950/30 border border-rose-800/40 p-3 rounded-xl flex items-start gap-2.5 text-xs text-rose-200">
        <Info className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-rose-300">Explainable AI Disclaimer: </span>
          Grad-CAM highlights image regions that influenced the model prediction. It is an AI explanation and should not be interpreted as a confirmed fracture location.
        </div>
      </div>

      {!hasGradcam && (
        <div className="bg-amber-950/20 border border-amber-500/40 p-3 rounded-xl flex items-center gap-2 text-xs text-amber-300">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Grad-CAM activation map is not available or could not be generated for this image.</span>
        </div>
      )}

      {/* Overlay View */}
      {viewMode === 'overlay' && (
        <div className="relative bg-slate-950 rounded-xl p-3 border border-slate-800 h-[380px] flex items-center justify-center overflow-hidden">
          <img
            src={gradcamSrc}
            alt="Grad-CAM Overlay"
            className="max-h-full max-w-full object-contain rounded-lg shadow-2xl"
          />
          <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700 text-xs flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-rose-400 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> High Attention
            </span>
            <span className="flex items-center gap-1.5 text-cyan-400 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span> Low Attention
            </span>
          </div>
        </div>
      )}

      {/* 3-Way Comparison View */}
      {viewMode === 'side-by-side' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-slate-400 block">1. Original X-ray</span>
            <div className="bg-slate-950 rounded-xl p-2 border border-slate-800 h-[240px] flex items-center justify-center">
              <img src={origSrc} alt="Original" className="max-h-full max-w-full object-contain rounded-lg" />
            </div>
          </div>
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-cyan-300 block">2. Enhanced X-ray</span>
            <div className="bg-slate-950 rounded-xl p-2 border border-cyan-900/40 h-[240px] flex items-center justify-center">
              <img src={enhSrc} alt="Enhanced" className="max-h-full max-w-full object-contain rounded-lg" />
            </div>
          </div>
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-rose-300 block">3. Grad-CAM Overlay</span>
            <div className="bg-slate-950 rounded-xl p-2 border border-rose-900/40 h-[240px] flex items-center justify-center">
              <img src={gradcamSrc} alt="Grad-CAM" className="max-h-full max-w-full object-contain rounded-lg" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GradCAMViewer;
