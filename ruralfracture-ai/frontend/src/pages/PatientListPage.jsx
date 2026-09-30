import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Search, UserPlus, ArrowRight, Shield } from 'lucide-react';
import { patientAPI } from '../services/api';
import DisclaimerBanner from '../components/DisclaimerBanner';

const PatientListPage = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const res = await patientAPI.list();
      setPatients(res.data || []);
    } catch (err) {
      console.error('Failed to load patient list:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter((p) =>
    p.patient_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.hospital_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Users className="w-6 h-6 text-cyan-400" />
            Registered Patients Registry
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Clinical patient records, history, and associated X-ray case archives
          </p>
        </div>

        <button
          onClick={() => navigate('/patient-register')}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 font-bold rounded-xl shadow-lg glow-cyan hover:opacity-95 transition-all text-xs"
        >
          <UserPlus className="w-4 h-4" />
          <span>Register New Patient</span>
        </button>
      </div>

      <DisclaimerBanner />

      <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
        
        {/* Search */}
        <div className="flex items-center justify-between">
          <div className="relative w-72">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search Patient ID, Name, or Hospital..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <span className="text-xs text-slate-400">Total Registered Patients: <strong className="text-cyan-400">{filteredPatients.length}</strong></span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-950/50">
                <th className="p-3">Patient ID</th>
                <th className="p-3">Name</th>
                <th className="p-3">Age / Gender</th>
                <th className="p-3">Hospital Facility</th>
                <th className="p-3">Department</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredPatients.map((p) => (
                <tr key={p.patient_id} className="hover:bg-slate-800/40 transition-all">
                  <td className="p-3 font-mono font-bold text-cyan-300">{p.patient_id}</td>
                  <td className="p-3 font-semibold text-slate-200">{p.name}</td>
                  <td className="p-3 text-slate-300">{p.age} Yrs / {p.gender}</td>
                  <td className="p-3 text-slate-300">{p.hospital_name}</td>
                  <td className="p-3 text-slate-400">{p.department || 'Radiology'}</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => navigate('/new-case', { state: { patient_id: p.patient_id } })}
                      className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 font-semibold transition-all mr-3"
                    >
                      <span>New X-ray</span>
                    </button>
                    <button
                      onClick={() => navigate(`/patients/${p.patient_id}`)}
                      className="inline-flex items-center gap-1 text-xs text-teal-400 hover:text-teal-300 font-semibold transition-all"
                    >
                      <span>History</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
};

export default PatientListPage;
