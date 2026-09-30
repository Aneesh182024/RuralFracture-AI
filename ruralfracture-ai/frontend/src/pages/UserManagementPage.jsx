import React from 'react';
import { UserCog, ShieldCheck, Plus } from 'lucide-react';
import DisclaimerBanner from '../components/DisclaimerBanner';

const UserManagementPage = () => {
  const users = [
    { name: 'System Admin', email: 'admin@ruralfracture.ai', role: 'ADMIN', hospital: 'Central Health Authority' },
    { name: 'Nurse Mary', email: 'worker@ruralfracture.ai', role: 'HEALTHCARE_WORKER', hospital: 'Primary Rural Clinic' },
    { name: 'Dr. Aris Thorne', email: 'doctor@ruralfracture.ai', role: 'DOCTOR', hospital: 'District General Hospital' },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <UserCog className="w-6 h-6 text-indigo-400" />
            User & Healthcare Staff Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage administrative credentials, healthcare worker access, and doctor roles
          </p>
        </div>
      </div>

      <DisclaimerBanner />

      <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-slate-100">Registered Staff Accounts</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase bg-slate-950/50">
                <th className="p-3">Staff Name</th>
                <th className="p-3">Email Address</th>
                <th className="p-3">System Role</th>
                <th className="p-3">Hospital Facility</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {users.map((u, i) => (
                <tr key={i} className="hover:bg-slate-800/40">
                  <td className="p-3 font-semibold text-slate-100">{u.name}</td>
                  <td className="p-3 font-mono text-cyan-300">{u.email}</td>
                  <td className="p-3 font-bold text-indigo-400">{u.role}</td>
                  <td className="p-3 text-slate-400">{u.hospital}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default UserManagementPage;
