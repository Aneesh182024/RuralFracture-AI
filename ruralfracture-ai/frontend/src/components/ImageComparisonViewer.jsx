import React, { useState } from 'react';
import { SlidersHorizontal, Eye } from 'lucide-react';
import { getImageUrl } from '../services/api';

const ImageComparisonViewer = ({ originalUrl, enhancedUrl, title = 'X-ray Image Enhancement Comparison' }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [activeTab, setActiveTab] = useState('slider'); // 'slider', 'side-by-side', 'original', 'enhanced'

  const origSrc = getImageUrl(originalUrl);
  const enhSrc = getImageUrl(enhancedUrl) || origSrc;

  return (
    <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
            {title}
          </h3>
          <p className="text-xs text-slate-400">
            Compare Raw X-ray vs OpenCV CLAHE & Unsharp Masked Enhanced Output
          </p>
        </div>

        {/* Display Mode Tabs */}
        <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('slider')}
            className={`px-3 py-1 rounded-md transition-all ${
              activeTab === 'slider' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Interactive Split Slider
          </button>
          <button
            onClick={() => setActiveTab('side-by-side')}
            className={`px-3 py-1 rounded-md transition-all ${
              activeTab === 'side-by-side' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Side-by-Side
          </button>
          <button
            onClick={() => setActiveTab('original')}
            className={`px-3 py-1 rounded-md transition-all ${
              activeTab === 'original' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Original Only
          </button>
          <button
            onClick={() => setActiveTab('enhanced')}
            className={`px-3 py-1 rounded-md transition-all ${
              activeTab === 'enhanced' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Enhanced Only
          </button>
        </div>
      </div>

      {/* Mode 1: Interactive Split Slider */}
      {activeTab === 'slider' && (
        <div className="relative w-full h-[380px] bg-slate-950 rounded-xl overflow-hidden select-none border border-slate-800 flex items-center justify-center">
          {/* Enhanced Image (Background) */}
          <img
            src={enhSrc}
            alt="Enhanced X-ray"
            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
          />

          {/* Original Image (Clipped Foreground) */}
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ width: `${sliderPosition}%` }}
          >
            <img
              src={origSrc}
              alt="Original X-ray"
              className="absolute inset-0 w-full h-full object-contain pointer-events-none"
              style={{ width: '100%', maxWidth: 'none' }}
            />
          </div>

          {/* Slider Line & Handle */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-cyan-400 cursor-ew-resize z-10 shadow-lg"
            style={{ left: `${sliderPosition}%` }}
          >
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-cyan-500 text-slate-950 font-bold flex items-center justify-center text-xs shadow-lg border-2 border-white">
              ↔
            </div>
          </div>

          {/* Labels */}
          <span className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-md text-[11px] font-semibold text-slate-300 border border-slate-700">
            Raw X-ray (Original)
          </span>
          <span className="absolute top-3 right-3 bg-cyan-950/80 backdrop-blur-md px-2.5 py-1 rounded-md text-[11px] font-semibold text-cyan-300 border border-cyan-800">
            OpenCV Enhanced (CLAHE)
          </span>

          {/* Range Controller */}
          <input
            type="range"
            min="0"
            max="100"
            value={sliderPosition}
            onChange={(e) => setSliderPosition(Number(e.target.value))}
            className="absolute bottom-3 left-1/2 -translate-x-1/2 w-64 accent-cyan-400 z-20 cursor-pointer"
          />
        </div>
      )}

      {/* Mode 2: Side-by-Side */}
      {activeTab === 'side-by-side' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-slate-400" /> Original Raw X-ray
            </span>
            <div className="bg-slate-950 rounded-xl p-2 border border-slate-800 h-[320px] flex items-center justify-center">
              <img src={origSrc} alt="Original X-ray" className="max-h-full max-w-full object-contain rounded-lg" />
            </div>
          </div>
          <div className="space-y-2">
            <span className="text-xs font-semibold text-cyan-300 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-cyan-400" /> OpenCV Enhanced X-ray (CLAHE + Sharpened)
            </span>
            <div className="bg-slate-950 rounded-xl p-2 border border-cyan-900/40 h-[320px] flex items-center justify-center">
              <img src={enhSrc} alt="Enhanced X-ray" className="max-h-full max-w-full object-contain rounded-lg" />
            </div>
          </div>
        </div>
      )}

      {/* Mode 3 & 4: Single View */}
      {activeTab === 'original' && (
        <div className="bg-slate-950 rounded-xl p-3 border border-slate-800 h-[360px] flex items-center justify-center">
          <img src={origSrc} alt="Original X-ray" className="max-h-full max-w-full object-contain rounded-lg" />
        </div>
      )}
      {activeTab === 'enhanced' && (
        <div className="bg-slate-950 rounded-xl p-3 border border-cyan-900/40 h-[360px] flex items-center justify-center">
          <img src={enhSrc} alt="Enhanced X-ray" className="max-h-full max-w-full object-contain rounded-lg" />
        </div>
      )}
    </div>
  );
};

export default ImageComparisonViewer;
