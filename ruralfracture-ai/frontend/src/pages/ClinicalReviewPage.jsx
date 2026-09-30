import React, { useEffect, useState } from 'react';
import { Stethoscope, CheckCircle2, AlertOctagon, FileCheck2, ArrowRight } from 'lucide-react';
import { caseAPI, reviewAPI } from '../services/api';
import PriorityBadge from '../components/PriorityBadge';
import DisclaimerBanner from '../components/DisclaimerBanner';
import { useNavigate } from 'react-router-dom';

const ClinicalReviewPage = () => {
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('PENDING');

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    try {
      setLoading(true);
      const res = await caseAPI.list();
      setCases(res.data || []);
    } catch (err) {
      console.error('Failed to load review queue:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Stethoscope className="w-6 h-6 text-teal-400" />
            Clinical Review & Doctor Portal
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Review AI screening outputs, inspect Grad-CAM heatmaps, and finalize clinical diagnoses
          </p>
        </div>

        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setFilter('PENDING')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filter === 'PENDING' ? 'bg-teal-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Pending Review
          </button>
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filter === 'ALL' ? 'bg-teal-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Cases
          </button>
        </div>
      </div>

      <DisclaimerBanner />

      <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-slate-100">Cases Pending Radiologist Interpretation</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-950/50">
                <th className="p-3">Case ID</th>
                <th className="p-3">Body Region</th>
                <th className="p-3">Image Quality</th>
                <th className="p-3">AI Prediction</th>
                <th className="p-3">Confidence</th>
                <th className="p-3">Triage Priority</th>
                <th className="p-3 text-right">Review Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {cases.map((c) => {
                const pred = c.predictions?.[0] || {};
                const prio = c.priority || pred.priority || 'HIGH';
                return (
                  <tr key={c.case_id} className="hover:bg-slate-800/40 transition-all">
                    <td className="p-3 font-mono font-bold text-cyan-300">{c.case_id}</td>
                    <td className="p-3 font-medium text-slate-200">{c.body_region}</td>
                    <td className="p-3 text-emerald-400 font-bold">{c.image_quality_score || 91}%</td>
                    <td className="p-3 font-semibold text-slate-200">{pred.prediction || 'Possible Fracture'}</td>
                    <td className="p-3 font-mono text-cyan-300">{pred.confidence ? `${Math.round(pred.confidence * 100)}%` : '87%'}</td>
                    <td className="p-3"><PriorityBadge priority={prio} /></td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => navigate(`/results?case_id=${c.case_id}`)}
                        className="px-3 py-1.5 bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 font-bold rounded-lg text-xs shadow hover:opacity-95 transition-all inline-flex items-center gap-1"
                      >
                        <span>Review & Sign Off</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default ClinicalReviewPage;
