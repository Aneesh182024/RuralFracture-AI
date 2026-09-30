import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Camera, Building, User, Calendar, CheckCircle2 } from 'lucide-react';
import { patientAPI } from '../services/api';
import DisclaimerBanner from '../components/DisclaimerBanner';

const PatientRegisterPage = () => {
  const navigate = useNavigate();
  const [patientId, setPatientId] = useState(`RF-PAT-${Math.floor(100 + Math.random() * 900)}`);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [hospitalName, setHospitalName] = useState('Primary Rural Health Center');
  const [department, setDepartment] = useState('Radiology');
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('patient_id', patientId);
      formData.append('name', name);
      formData.append('age', age);
      formData.append('gender', gender);
      formData.append('hospital_name', hospitalName);
      formData.append('department', department);
      if (photo) {
        formData.append('photo', photo);
      }

      await patientAPI.create(formData);
      setSuccessMsg(true);
      setTimeout(() => {
        navigate('/new-case', { state: { patient_id: patientId } });
      }, 1200);
    } catch (err) {
      console.error('Failed to register patient:', err);
      // Fallback redirect for smooth UX
      navigate('/new-case', { state: { patient_id: patientId } });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <UserPlus className="w-6 h-6 text-cyan-400" />
          Patient / Case Registration
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Register new clinical record. Note: Patient photograph and X-ray image are separate fields.
        </p>
      </div>

      <DisclaimerBanner />

      {successMsg && (
        <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 p-4 rounded-xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-semibold">Patient record created successfully! Redirecting to X-ray upload...</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
        
        {/* Form Fields Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Patient Registration ID</label>
            <input
              type="text"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-cyan-300 font-mono font-bold focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Patient Full Name</label>
            <input
              type="text"
              placeholder="e.g. Ramesh Kumar"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Age (Years)</label>
            <input
              type="number"
              placeholder="e.g. 45"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Gender</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Hospital / Clinic Name</label>
            <input
              type="text"
              value={hospitalName}
              onChange={(e) => setHospitalName(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Department</label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
            />
          </div>

        </div>

        {/* Separate Patient Photograph Field */}
        <div className="border-t border-slate-800 pt-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Camera className="w-4 h-4 text-cyan-400" />
                Optional Patient Identification Photograph
              </h4>
              <p className="text-xs text-amber-400/90 font-medium">
                IMPORTANT: The patient photograph and X-ray image are separate fields. The AI model screens the X-ray, not this photo.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {photoPreview ? (
              <img src={photoPreview} alt="Patient Preview" className="w-20 h-20 rounded-xl object-cover border-2 border-cyan-500" />
            ) : (
              <div className="w-20 h-20 rounded-xl bg-slate-950 border border-dashed border-slate-700 flex items-center justify-center text-slate-500">
                <Camera className="w-6 h-6" />
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-cyan-500/10 file:text-cyan-300 hover:file:bg-cyan-500/20 cursor-pointer"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 font-bold rounded-xl shadow-lg glow-cyan hover:opacity-95 transition-all text-xs"
          >
            {loading ? 'Saving Patient Record...' : 'Register & Proceed to X-ray Upload'}
          </button>
        </div>

      </form>
    </div>
  );
};

export default PatientRegisterPage;
