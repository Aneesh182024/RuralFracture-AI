import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  UploadCloud, FileImage, AlertCircle, Sparkles, CheckCircle2, ArrowRight, 
  RefreshCw, SlidersHorizontal, Flame, Cpu, ShieldAlert, FileText, CheckCircle
} from 'lucide-react';
import { xrayAPI, aiAPI, patientAPI, getImageUrl } from '../services/api';
import DisclaimerBanner from '../components/DisclaimerBanner';
import ImageComparisonViewer from '../components/ImageComparisonViewer';
import GradCAMViewer from '../components/GradCAMViewer';
import PriorityBadge from '../components/PriorityBadge';

const NewCasePage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(location.state?.patient_id || 'RF-PAT-001');
  const [bodyRegion, setBodyRegion] = useState('Wrist');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [demoMode, setDemoMode] = useState(true);

  // Workflow steps: 1 = Upload, 2 = Quality, 3 = Enhancement, 4 = AI Screening & Grad-CAM
  const [currentStep, setCurrentStep] = useState(1);
  const [stepStates, setStepStates] = useState({
    1: 'active',
    2: 'disabled',
    3: 'disabled',
    4: 'disabled',
  });

  const [caseId, setCaseId] = useState(null);
  const [qualityResult, setQualityResult] = useState(null);
  const [enhanceData, setEnhanceData] = useState(null);
  const [predictionResult, setPredictionResult] = useState(null);

  const [stepErrors, setStepErrors] = useState({
    1: null,
    2: null,
    3: null,
    4: null,
  });

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const res = await patientAPI.list();
      setPatients(res.data || []);
      if (res.data?.length > 0 && !location.state?.patient_id) {
        setSelectedPatientId(res.data[0].patient_id);
      }
    } catch (err) {
      console.error('Failed to load patients:', err);
    }
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer ? e.dataTransfer.files[0] : e.target.files[0];
    if (!droppedFile) return;

    // Reset step states if new file is selected
    setStepErrors({ 1: null, 2: null, 3: null, 4: null });
    setQualityResult(null);
    setEnhanceData(null);
    setPredictionResult(null);
    setCurrentStep(1);
    setStepStates({ 1: 'active', 2: 'disabled', 3: 'disabled', 4: 'disabled' });

    // Validate extension
    const ext = droppedFile.name.split('.').pop().toLowerCase();
    if (!['jpg', 'jpeg', 'png'].includes(ext)) {
      setStepErrors((prev) => ({ ...prev, 1: 'Invalid file format. Only JPG, JPEG, and PNG images are supported.' }));
      return;
    }

    // Validate empty file
    if (droppedFile.size === 0) {
      setStepErrors((prev) => ({ ...prev, 1: 'Uploaded file is empty (0 bytes). Please upload a valid X-ray image.' }));
      return;
    }

    // Validate file size (max 15MB)
    if (droppedFile.size > 15 * 1024 * 1024) {
      setStepErrors((prev) => ({ ...prev, 1: 'File size exceeds maximum threshold of 15MB.' }));
      return;
    }

    // Client side image dimensions / corruption pre-check using Image object
    const img = new Image();
    const objectUrl = URL.createObjectURL(droppedFile);
    img.onload = () => {
      if (img.width < 100 || img.height < 100) {
        setStepErrors((prev) => ({
          ...prev,
          1: `Image resolution too low (${img.width}x${img.height} px). Minimum required resolution is 100x100 pixels.`,
        }));
        setFile(null);
        setFilePreview(null);
      } else {
        setFile(droppedFile);
        setFilePreview(objectUrl);
      }
    };
    img.onerror = () => {
      setStepErrors((prev) => ({ ...prev, 1: 'Corrupted image file. Unable to decode radiographic X-ray data.' }));
      setFile(null);
      setFilePreview(null);
    };
    img.src = objectUrl;
  };

  // Main step-by-step pipeline runner
  const startPipeline = async () => {
    if (!file) {
      setStepErrors((prev) => ({ ...prev, 1: 'Please select an X-ray image before submitting.' }));
      return;
    }

    setStepErrors({ 1: null, 2: null, 3: null, 4: null });

    // 1. Upload & Quality Assessment
    setStepStates({ 1: 'completed', 2: 'processing', 3: 'disabled', 4: 'disabled' });
    setCurrentStep(2);

    let createdCaseId = null;
    let qual = null;

    try {
      const formData = new FormData();
      formData.append('patient_id', selectedPatientId);
      formData.append('body_region', bodyRegion);
      formData.append('clinical_notes', clinicalNotes);
      formData.append('file', file);

      const res = await xrayAPI.upload(formData);
      createdCaseId = res.data.case_id;
      qual = res.data.image_quality;

      setCaseId(createdCaseId);
      setQualityResult(qual);

      // Check Quality Gate
      if (qual.status === 'POOR IMAGE QUALITY' || qual.score < 50.0) {
        setStepStates({ 1: 'completed', 2: 'error', 3: 'disabled', 4: 'disabled' });
        setStepErrors((prev) => ({
          ...prev,
          2: `POOR IMAGE QUALITY DETECTED (${qual.score}%). ${qual.recommendation}`,
        }));
        return; // STOP PIPELINE
      }

      setStepStates({ 1: 'completed', 2: 'completed', 3: 'processing', 4: 'disabled' });
    } catch (err) {
      console.error('Upload / Quality Assessment error:', err);
      const msg = err.response?.data?.detail || 'Failed to upload or assess image quality. Please try again.';
      setStepStates({ 1: 'completed', 2: 'error', 3: 'disabled', 4: 'disabled' });
      setStepErrors((prev) => ({ ...prev, 2: msg }));
      return;
    }

    // 2. Image Enhancement
    setCurrentStep(3);
    let enh = null;
    try {
      const resEnh = await xrayAPI.enhance(createdCaseId);
      enh = resEnh.data;
      setEnhanceData(enh);
      setStepStates({ 1: 'completed', 2: 'completed', 3: 'completed', 4: 'processing' });
    } catch (err) {
      console.error('Image enhancement error:', err);
      const msg = err.response?.data?.detail || 'Image enhancement pipeline failed. Please retry.';
      setStepStates({ 1: 'completed', 2: 'completed', 3: 'error', 4: 'disabled' });
      setStepErrors((prev) => ({ ...prev, 3: msg }));
      return;
    }

    // 3. AI Screening & Grad-CAM
    setCurrentStep(4);
    try {
      const resAI = await aiAPI.predict(createdCaseId, demoMode);
      setPredictionResult(resAI.data);
      setStepStates({ 1: 'completed', 2: 'completed', 3: 'completed', 4: 'completed' });
    } catch (err) {
      console.error('AI screening error:', err);
      const msg = err.response?.data?.detail || 'AI fracture screening failed. Please retry.';
      setStepStates({ 1: 'completed', 2: 'completed', 3: 'completed', 4: 'error' });
      setStepErrors((prev) => ({ ...prev, 4: msg }));
    }
  };

  // Retry logic for individual steps
  const retryEnhancement = async () => {
    if (!caseId) return;
    setStepErrors((prev) => ({ ...prev, 3: null }));
    setStepStates({ 1: 'completed', 2: 'completed', 3: 'processing', 4: 'disabled' });
    setCurrentStep(3);
    try {
      const resEnh = await xrayAPI.enhance(caseId);
      setEnhanceData(resEnh.data);
      setStepStates({ 1: 'completed', 2: 'completed', 3: 'completed', 4: 'processing' });
      // Continue to AI screening
      retryAIScreening();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Image enhancement failed.';
      setStepStates({ 1: 'completed', 2: 'completed', 3: 'error', 4: 'disabled' });
      setStepErrors((prev) => ({ ...prev, 3: msg }));
    }
  };

  const retryAIScreening = async () => {
    if (!caseId) return;
    setStepErrors((prev) => ({ ...prev, 4: null }));
    setStepStates({ 1: 'completed', 2: 'completed', 3: 'completed', 4: 'processing' });
    setCurrentStep(4);
    try {
      const resAI = await aiAPI.predict(caseId, demoMode);
      setPredictionResult(resAI.data);
      setStepStates({ 1: 'completed', 2: 'completed', 3: 'completed', 4: 'completed' });
    } catch (err) {
      const msg = err.response?.data?.detail || 'AI screening failed.';
      setStepStates({ 1: 'completed', 2: 'completed', 3: 'completed', 4: 'error' });
      setStepErrors((prev) => ({ ...prev, 4: msg }));
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <UploadCloud className="w-6 h-6 text-cyan-400" />
            New X-ray Case Submission Workflow
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Standard clinical workflow: Upload → Quality Assessment → OpenCV CLAHE Enhancement → EfficientNet-B0 AI Screening → Grad-CAM → Clinical Result
          </p>
        </div>

        {/* Demo Mode Toggle */}
        <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-xs">
          <span className="font-semibold text-slate-300">Execution Mode:</span>
          <button
            type="button"
            onClick={() => setDemoMode(!demoMode)}
            className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              demoMode
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>{demoMode ? 'DEMO MODE' : 'REAL MODEL MODE'}</span>
          </button>
        </div>
      </div>

      <DisclaimerBanner />

      {/* Mode Explanation Notice */}
      <div className={`p-3.5 rounded-xl border text-xs flex items-center gap-3 ${
        demoMode 
          ? 'bg-amber-950/20 border-amber-500/40 text-amber-200' 
          : 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
      }`}>
        <Cpu className="w-4 h-4 shrink-0" />
        <div>
          {demoMode ? (
            <span className="font-bold">DEMO PREDICTION — NOT GENERATED BY THE TRAINED CLINICAL MODEL.</span>
          ) : (
            <span><strong className="text-emerald-300">REAL MODEL MODE ENABLED:</strong> AI inference will run the live EfficientNet-B0 PyTorch neural network forward pass on your uploaded X-ray.</span>
          )}
        </div>
      </div>

      {/* Interactive Workflow Step Navigation Stepper */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
        
        {/* Step 1: Upload */}
        <div className={`p-3.5 rounded-xl border transition-all ${
          stepStates[1] === 'completed'
            ? 'bg-emerald-950/20 border-emerald-500/50 text-emerald-300 font-bold'
            : stepStates[1] === 'active'
            ? 'bg-cyan-500/20 border-cyan-500 text-cyan-200 font-bold glow-cyan'
            : 'bg-slate-900 border-slate-800 text-slate-500'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider">Step 1</span>
            {stepStates[1] === 'completed' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          </div>
          <div className="text-sm font-bold">1. X-ray Upload</div>
          <div className="text-[11px] opacity-80 mt-0.5">Validate & register image</div>
        </div>

        {/* Step 2: Quality Assessment */}
        <div className={`p-3.5 rounded-xl border transition-all ${
          stepStates[2] === 'completed'
            ? 'bg-emerald-950/20 border-emerald-500/50 text-emerald-300 font-bold'
            : stepStates[2] === 'processing'
            ? 'bg-cyan-500/20 border-cyan-500 text-cyan-200 font-bold animate-pulse'
            : stepStates[2] === 'error'
            ? 'bg-rose-950/30 border-rose-500 text-rose-300 font-bold'
            : 'bg-slate-900 border-slate-800 text-slate-500'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider">Step 2</span>
            {stepStates[2] === 'completed' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            {stepStates[2] === 'processing' && <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />}
            {stepStates[2] === 'error' && <AlertCircle className="w-4 h-4 text-rose-400" />}
          </div>
          <div className="text-sm font-bold">2. Quality Assessment</div>
          <div className="text-[11px] opacity-80 mt-0.5">Blur, contrast & noise gate</div>
        </div>

        {/* Step 3: Image Enhancement */}
        <div className={`p-3.5 rounded-xl border transition-all ${
          stepStates[3] === 'completed'
            ? 'bg-emerald-950/20 border-emerald-500/50 text-emerald-300 font-bold'
            : stepStates[3] === 'processing'
            ? 'bg-cyan-500/20 border-cyan-500 text-cyan-200 font-bold animate-pulse'
            : stepStates[3] === 'error'
            ? 'bg-rose-950/30 border-rose-500 text-rose-300 font-bold'
            : 'bg-slate-900 border-slate-800 text-slate-500'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider">Step 3</span>
            {stepStates[3] === 'completed' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            {stepStates[3] === 'processing' && <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />}
            {stepStates[3] === 'error' && <AlertCircle className="w-4 h-4 text-rose-400" />}
          </div>
          <div className="text-sm font-bold">3. Image Enhancement</div>
          <div className="text-[11px] opacity-80 mt-0.5">OpenCV CLAHE & Sharpening</div>
        </div>

        {/* Step 4: AI Screening & Grad-CAM */}
        <div className={`p-3.5 rounded-xl border transition-all ${
          stepStates[4] === 'completed'
            ? 'bg-emerald-950/20 border-emerald-500/50 text-emerald-300 font-bold'
            : stepStates[4] === 'processing'
            ? 'bg-cyan-500/20 border-cyan-500 text-cyan-200 font-bold animate-pulse'
            : stepStates[4] === 'error'
            ? 'bg-rose-950/30 border-rose-500 text-rose-300 font-bold'
            : 'bg-slate-900 border-slate-800 text-slate-500'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider">Step 4</span>
            {stepStates[4] === 'completed' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            {stepStates[4] === 'processing' && <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />}
            {stepStates[4] === 'error' && <AlertCircle className="w-4 h-4 text-rose-400" />}
          </div>
          <div className="text-sm font-bold">4. AI Screening & Grad-CAM</div>
          <div className="text-[11px] opacity-80 mt-0.5">EfficientNet-B0 inference</div>
        </div>

      </div>

      {/* Main Form & Upload View */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
        
        {/* Step 1 Form Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Select Registered Patient</label>
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              disabled={stepStates[1] === 'completed'}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 font-mono disabled:opacity-60"
            >
              {patients.map((p) => (
                <option key={p.patient_id} value={p.patient_id}>
                  {p.patient_id} — {p.name} ({p.gender}, {p.age}y)
                </option>
              ))}
              <option value="RF-PAT-001">RF-PAT-001 — Aarav Sharma (Male, 42y)</option>
              <option value="RF-PAT-002">RF-PAT-002 — Priya Patel (Female, 31y)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Anatomical Body Region</label>
            <select
              value={bodyRegion}
              onChange={(e) => setBodyRegion(e.target.value)}
              disabled={stepStates[1] === 'completed'}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 disabled:opacity-60"
            >
              <option value="Wrist">Wrist</option>
              <option value="Forearm">Forearm</option>
              <option value="Femur">Femur / Thigh</option>
              <option value="Ankle">Ankle / Foot</option>
              <option value="Ribs">Ribs / Chest</option>
              <option value="Hand">Hand / Digits</option>
              <option value="Shoulder">Shoulder / Clavicle</option>
            </select>
          </div>
        </div>

        {/* Drag & Drop X-ray Upload Box */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-2">Upload Radiographic X-ray Image (JPG, JPEG, PNG)</label>
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
              filePreview
                ? 'border-cyan-500 bg-cyan-950/20'
                : 'border-slate-800 bg-slate-950/60 hover:border-cyan-500/50 hover:bg-slate-900'
            }`}
          >
            {filePreview ? (
              <div className="flex flex-col items-center space-y-3">
                <img src={filePreview} alt="X-ray Preview" className="h-52 rounded-xl object-contain border border-slate-700 shadow-xl" />
                <div className="text-xs font-semibold text-cyan-300">{file?.name} ({(file?.size / (1024 * 1024)).toFixed(2)} MB)</div>
                {stepStates[1] !== 'completed' && (
                  <button
                    type="button"
                    onClick={() => { setFile(null); setFilePreview(null); }}
                    className="text-xs text-rose-400 hover:underline font-semibold"
                  >
                    Remove & Upload Different File
                  </button>
                )}
              </div>
            ) : (
              <label className="cursor-pointer space-y-3 block py-4">
                <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-200">
                    Click to browse or drag & drop X-ray image here
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Supports JPG, JPEG, and PNG (Min 100x100 px, Max 15MB)
                  </p>
                </div>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={handleFileDrop}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>

        {/* Step 1 Error Callout */}
        {stepErrors[1] && (
          <div className="bg-rose-500/20 border border-rose-500/40 text-rose-300 p-4 rounded-xl flex items-center gap-3 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{stepErrors[1]}</span>
          </div>
        )}

        {/* Clinical Notes Input */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Clinical Observations / Notes (Optional)</label>
          <textarea
            rows="2"
            placeholder="e.g. Patient presents with acute wrist pain after sports fall..."
            value={clinicalNotes}
            onChange={(e) => setClinicalNotes(e.target.value)}
            disabled={stepStates[1] === 'completed'}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 disabled:opacity-60"
          ></textarea>
        </div>

        {/* Initial Pipeline Trigger Button */}
        {stepStates[1] !== 'completed' && (
          <div className="flex justify-end pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={startPipeline}
              disabled={!file}
              className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 font-bold rounded-xl shadow-lg glow-cyan hover:opacity-95 disabled:opacity-40 transition-all text-xs flex items-center gap-2"
            >
              <span>Assess Quality & Screen X-ray</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

      </div>

      {/* Step 2: Quality Assessment Display */}
      {qualityResult && (
        <div className={`glass-panel p-6 rounded-2xl border ${
          qualityResult.status === 'POOR IMAGE QUALITY' || qualityResult.score < 50.0
            ? 'border-rose-500/60 bg-rose-950/20'
            : 'border-emerald-500/40 bg-emerald-950/10'
        } space-y-4`}>
          
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-extrabold text-xl shadow-xl ${
                qualityResult.status === 'POOR IMAGE QUALITY' || qualityResult.score < 50.0
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/50'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
              }`}>
                {qualityResult.score}%
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-100">
                    Step 2: Quality Assessment Score: <span className={qualityResult.score < 50 ? 'text-rose-400' : 'text-emerald-400'}>{qualityResult.score}%</span>
                  </h3>
                  <span className={`px-3 py-0.5 rounded-full text-[11px] font-extrabold border uppercase ${
                    qualityResult.status === 'POOR IMAGE QUALITY' || qualityResult.score < 50.0
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  }`}>
                    {qualityResult.status}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  {qualityResult.recommendation}
                </p>
              </div>
            </div>

            {/* Quality Failure Re-upload Button */}
            {(qualityResult.status === 'POOR IMAGE QUALITY' || qualityResult.score < 50.0) && (
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setFilePreview(null);
                  setQualityResult(null);
                  setStepStates({ 1: 'active', 2: 'disabled', 3: 'disabled', 4: 'disabled' });
                  setCurrentStep(1);
                }}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Upload Clearer X-ray</span>
              </button>
            )}
          </div>

          {/* OpenCV Quality Metrics Breakdown Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-slate-800 text-xs">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-400 block text-[11px]">Sharpness (Laplacian Var)</span>
              <div className="font-bold text-slate-100 text-sm">{qualityResult.blur_score}%</div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-cyan-400 h-full" style={{ width: `${qualityResult.blur_score}%` }}></div>
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-400 block text-[11px]">Contrast (RMS Std Dev)</span>
              <div className="font-bold text-slate-100 text-sm">{qualityResult.contrast_score}%</div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-teal-400 h-full" style={{ width: `${qualityResult.contrast_score}%` }}></div>
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-400 block text-[11px]">Exposure Balance</span>
              <div className="font-bold text-slate-100 text-sm">{qualityResult.exposure_score}%</div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-400 h-full" style={{ width: `${qualityResult.exposure_score}%` }}></div>
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-400 block text-[11px]">Noise Level</span>
              <div className="font-bold text-slate-100 text-sm">{qualityResult.noise_score}%</div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-indigo-400 h-full" style={{ width: `${qualityResult.noise_score}%` }}></div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Step 2 Error Notice */}
      {stepErrors[2] && (
        <div className="bg-rose-500/20 border border-rose-500/40 text-rose-300 p-4 rounded-xl flex items-center gap-3 text-xs">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{stepErrors[2]}</span>
        </div>
      )}

      {/* Step 3: Image Enhancement Viewer */}
      {enhanceData && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-cyan-400" />
              Step 3: OpenCV Image Enhancement Complete
            </h3>
          </div>

          <ImageComparisonViewer
            originalUrl={enhanceData.original_image_path}
            enhancedUrl={enhanceData.enhanced_image_path}
            title="Raw X-ray vs OpenCV CLAHE & Unsharp Masked Result"
          />
        </div>
      )}

      {/* Step 3 Error Callout & Retry */}
      {stepErrors[3] && (
        <div className="bg-rose-500/20 border border-rose-500/40 text-rose-300 p-4 rounded-xl flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{stepErrors[3]}</span>
          </div>
          <button
            type="button"
            onClick={retryEnhancement}
            className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg shrink-0 flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Enhancement</span>
          </button>
        </div>
      )}

      {/* Step 4: AI Screening & Grad-CAM Output */}
      {predictionResult && (
        <div className="space-y-6">
          
          {/* Result Card */}
          <div className="glass-panel p-6 rounded-2xl border border-cyan-500/40 glow-cyan space-y-4">
            
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Step 4: AI Fracture Screening Result</span>
                <div className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 mt-0.5">
                  AI Screening Result: {predictionResult.prediction}
                </div>
              </div>

              <PriorityBadge priority={predictionResult.priority} showDescription />
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-400 block text-[11px]">Model Confidence</span>
                <div className="text-xl font-extrabold text-cyan-300">{Math.round(predictionResult.confidence * 100)}%</div>
                <span className="text-[10px] text-slate-500">Feature probability</span>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-400 block text-[11px]">Architecture</span>
                <div className="text-sm font-bold text-slate-100">{predictionResult.model}</div>
                <span className="text-[10px] text-slate-400">{predictionResult.model_version}</span>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-400 block text-[11px]">Image Quality</span>
                <div className="text-sm font-bold text-emerald-400">{predictionResult.image_quality_score}%</div>
                <span className="text-[10px] text-emerald-300">Acceptable</span>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-400 block text-[11px]">Mode</span>
                <div className="text-xs font-bold text-amber-300">{predictionResult.demo_mode ? 'DEMO MODE' : 'REAL MODEL'}</div>
                <span className="text-[10px] text-slate-400">Execution mode</span>
              </div>
            </div>

          </div>

          {/* Grad-CAM Viewer */}
          <GradCAMViewer
            originalUrl={qualityResult?.original_image_path || enhanceData?.original_image_path}
            enhancedUrl={enhanceData?.enhanced_image_path}
            gradcamUrl={predictionResult?.gradcam_path}
          />

          {/* Final Navigation to Clinical Result Page */}
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => navigate(`/results?case_id=${caseId}`)}
              className="px-8 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 font-extrabold rounded-xl shadow-xl hover:opacity-95 transition-all text-sm flex items-center gap-2"
            >
              <span>View Full Clinical Result & Sign-Off</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

        </div>
      )}

      {/* Step 4 Error Callout & Retry */}
      {stepErrors[4] && (
        <div className="bg-rose-500/20 border border-rose-500/40 text-rose-300 p-4 rounded-xl flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{stepErrors[4]}</span>
          </div>
          <button
            type="button"
            onClick={retryAIScreening}
            className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg shrink-0 flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry AI Screening</span>
          </button>
        </div>
      )}

    </div>
  );
};

export default NewCasePage;
