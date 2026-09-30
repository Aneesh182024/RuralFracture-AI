import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Sliders, AlertTriangle, CheckCircle2, ArrowRight, RefreshCw, Eye, Cpu, AlertCircle } from 'lucide-react';
import { xrayAPI, aiAPI } from '../services/api';
import ImageComparisonViewer from '../components/ImageComparisonViewer';
import DisclaimerBanner from '../components/DisclaimerBanner';

const QualityEnhancementPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const caseId = searchParams.get('case_id') || 'RF-2026-0001';

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [screeningLoading, setScreeningLoading] = useState(false);
  const [enhancingLoading, setEnhancingLoading] = useState(false);
  const [demoMode, setDemoMode] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    fetchQualityData();
  }, [caseId]);

  const fetchQualityData = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const res = await xrayAPI.getInfo(caseId);
      setData(res.data);
    } catch (err) {
      console.error('Failed to fetch quality data:', err);
      setErrorMessage('Failed to load X-ray case quality details. Please check connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleRunEnhancement = async () => {
    try {
      setEnhancingLoading(true);
      setErrorMessage(null);
      await xrayAPI.enhance(caseId);
      await fetchQualityData();
    } catch (err) {
      console.error('Enhancement error:', err);
      setErrorMessage(err.response?.data?.detail || 'Image enhancement failed. Please retry.');
    } finally {
      setEnhancingLoading(false);
    }
  };

  const handleRunAIScreening = async () => {
    try {
      setScreeningLoading(true);
      setErrorMessage(null);
      await aiAPI.predict(caseId, demoMode);
      navigate(`/results?case_id=${caseId}`);
    } catch (err) {
      console.error('AI prediction error:', err);
      setErrorMessage(err.response?.data?.detail || 'AI screening failed. Please try again.');
    } finally {
      setScreeningLoading(false);
    }
  };

  const quality = data?.quality_assessment || {
    score: 91.0,
    status: 'ACCEPTABLE',
    blur_score: 94.0,
    contrast_score: 89.0,
    exposure_score: 92.0,
    noise_score: 88.0,
    recommendation: 'Image quality is acceptable for AI fracture screening.',
  };

  const isPoorQuality = quality.status === 'POOR IMAGE QUALITY' || quality.score < 50.0;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Sliders className="w-6 h-6 text-cyan-400" />
            Image Quality Assessment & OpenCV Enhancement
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Automated image quality validation (Blur, Contrast, Exposure, Noise) & CLAHE contrast sharpening
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setDemoMode(!demoMode)}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 ${
              demoMode
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>{demoMode ? 'DEMO MODE' : 'REAL MODEL MODE'}</span>
          </button>

          <span className="font-mono text-sm font-bold text-cyan-300 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
            Case: {caseId}
          </span>
        </div>
      </div>

      <DisclaimerBanner />

      {/* Stepper Progress Bar */}
      <div className="grid grid-cols-4 gap-2 text-center text-xs">
        <div className="bg-emerald-950/20 border border-emerald-500/40 p-2.5 rounded-xl font-bold text-emerald-300 flex items-center justify-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 1. Uploaded
        </div>
        <div className={`p-2.5 rounded-xl font-bold ${
          isPoorQuality ? 'bg-rose-950/30 border border-rose-500 text-rose-300' : 'bg-emerald-950/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-center gap-1.5'
        }`}>
          2. Quality Assessment ({quality.score}%)
        </div>
        <div className="bg-cyan-500/20 border border-cyan-500/40 p-2.5 rounded-xl font-bold text-cyan-300">
          3. Image Enhancement
        </div>
        <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-slate-500">
          4. AI Screening & Grad-CAM
        </div>
      </div>

      {errorMessage && (
        <div className="bg-rose-500/20 border border-rose-500/40 text-rose-300 p-4 rounded-xl flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-xs underline text-rose-200"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Quality Score Indicator Card */}
      <div className={`glass-panel p-6 rounded-2xl border ${
        isPoorQuality ? 'border-rose-500/60 bg-rose-950/20' : 'border-emerald-500/40 bg-emerald-950/10'
      } space-y-4`}>
        
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-extrabold text-2xl shadow-xl ${
              isPoorQuality
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/50'
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
            }`}>
              {quality.score}%
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-100">
                  Image Quality Score: <span className={isPoorQuality ? 'text-rose-400' : 'text-emerald-400'}>{quality.score}%</span>
                </h3>
                <span className={`px-3 py-0.5 rounded-full text-xs font-extrabold border uppercase ${
                  isPoorQuality
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                }`}>
                  {quality.status}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                {quality.recommendation}
              </p>
            </div>
          </div>

          {/* Action Triggers */}
          <div className="flex items-center gap-3">
            {isPoorQuality ? (
              <button
                onClick={() => navigate('/new-case')}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Upload Clearer X-ray</span>
              </button>
            ) : (
              <>
                <button
                  onClick={handleRunEnhancement}
                  disabled={enhancingLoading}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs flex items-center gap-1.5 border border-slate-700 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${enhancingLoading ? 'animate-spin' : ''}`} />
                  <span>Re-run OpenCV Enhancement</span>
                </button>

                <button
                  onClick={handleRunAIScreening}
                  disabled={screeningLoading}
                  className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg glow-cyan hover:opacity-95 transition-all disabled:opacity-50"
                >
                  {screeningLoading ? (
                    <span>Running EfficientNet-B0...</span>
                  ) : (
                    <>
                      <span>Proceed to AI Fracture Screening</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        {/* OpenCV Quality Metrics Breakdown Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-slate-800 text-xs">
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
            <span className="text-slate-400 block text-[11px]">Sharpness (Laplacian Var)</span>
            <div className="font-bold text-slate-100 text-sm">{quality.blur_score || 94.0}%</div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-cyan-400 h-full" style={{ width: `${quality.blur_score || 94}%` }}></div>
            </div>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
            <span className="text-slate-400 block text-[11px]">Contrast (RMS Std Dev)</span>
            <div className="font-bold text-slate-100 text-sm">{quality.contrast_score || 89.0}%</div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-teal-400 h-full" style={{ width: `${quality.contrast_score || 89}%` }}></div>
            </div>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
            <span className="text-slate-400 block text-[11px]">Exposure Balance</span>
            <div className="font-bold text-slate-100 text-sm">{quality.exposure_score || 92.0}%</div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-400 h-full" style={{ width: `${quality.exposure_score || 92}%` }}></div>
            </div>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
            <span className="text-slate-400 block text-[11px]">Noise Level</span>
            <div className="font-bold text-slate-100 text-sm">{quality.noise_score || 88.0}%</div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-indigo-400 h-full" style={{ width: `${quality.noise_score || 88}%` }}></div>
            </div>
          </div>
        </div>

      </div>

      {/* Interactive Image Comparison Viewer */}
      <ImageComparisonViewer
        originalUrl={data?.case?.image_path || `uploads/original/${caseId}.jpg`}
        enhancedUrl={data?.case?.enhanced_image_path || `uploads/enhanced/${caseId}_enhanced.png`}
      />

    </div>
  );
};

export default QualityEnhancementPage;
