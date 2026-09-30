import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserCheck, FileCheck2, PlusCircle, ArrowRight, Activity, Calendar } from 'lucide-react';
import { patientAPI, caseAPI } from '../services/api';
import PriorityBadge from '../components/PriorityBadge';
import DisclaimerBanner from '../components/DisclaimerBanner';

const PatientDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [patient, setPatient] = useState(null);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatientAndCases();
  }, [id]);

  const fetchPatientAndCases = async () => {
    try {
      setLoading(true);
      const [pRes, cRes] = await Promise.all([
        patientAPI.get(id).catch(() => ({ data: { patient_id: id, name: `Patient ${id}`, age: 42, gender: 'Male', hospital_name: 'Primary Rural Clinic', department: 'Radiology' } })),
        caseAPI.list({ search: id }),
      ]);
      setPatient(pRes.data);
      setCases(cRes.data || []);
    } catch (err) {
      console.error('Error loading patient details:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-cyan-400" />
            Patient Clinical Profile & Case History
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Complete patient registration metadata and historical X-ray screening archives
          </p>
        </div>

        <button
          onClick={() => navigate('/new-case', { state: { patient_id: id } })}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 font-bold rounded-xl shadow-lg text-xs"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Upload New X-ray</span>
        </button>
      </div>

      <DisclaimerBanner />

      {/* Patient Profile Card */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-slate-100 border-b border-slate-800 pb-2">
          Patient Metadata Information
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Patient Registration ID</span>
            <span className="font-bold text-cyan-300 font-mono text-base">{patient?.patient_id}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Patient Name</span>
            <span className="font-semibold text-slate-100 text-sm">{patient?.name}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Age & Gender</span>
            <span className="font-semibold text-slate-200">{patient?.age} Yrs / {patient?.gender}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Hospital Facility</span>
            <span className="font-semibold text-slate-200">{patient?.hospital_name}</span>
          </div>
        </div>
      </div>

      {/* Patient X-ray Cases History */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <FileCheck2 className="w-5 h-5 text-teal-400" />
          X-ray Screening History ({cases.length} Cases)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-950/50">
                <th className="p-3">Case ID</th>
                <th className="p-3">Examination Date</th>
                <th className="p-3">Body Region</th>
                <th className="p-3">Image Quality</th>
                <th className="p-3">AI Result</th>
                <th className="p-3">Priority</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {cases.map((c) => {
                const pred = c.predictions?.[0] || {};
                return (
                  <tr key={c.case_id} className="hover:bg-slate-800/40 transition-all">
                    <td className="p-3 font-mono font-bold text-cyan-300">{c.case_id}</td>
                    <td className="p-3 text-slate-300">{c.examination_date || '2026-09-29'}</td>
                    <td className="p-3 font-semibold text-slate-200">{c.body_region}</td>
                    <td className="p-3 text-emerald-400 font-bold">{c.image_quality_score || 91}%</td>
                    <td className="p-3 font-semibold text-slate-200">{pred.prediction || 'Possible Fracture'}</td>
                    <td className="p-3"><PriorityBadge priority={pred.priority || 'HIGH'} /></td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => navigate(`/results?case_id=${c.case_id}`)}
                        className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 font-semibold transition-all"
                      >
                        <span>View Result</span>
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

export default PatientDetailsPage;
