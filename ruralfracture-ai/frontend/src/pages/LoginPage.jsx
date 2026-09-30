import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Activity, ShieldCheck, UserCheck, Lock } from 'lucide-react';
import DisclaimerBanner from '../components/DisclaimerBanner';

const LoginPage = () => {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState('worker@ruralfracture.ai');
  const [password, setPassword] = useState('password123');

  const handleSubmit = async (e) => {
    e.preventDefault();
    await login(email, password);
  };

  const setRoleQuick = (roleEmail) => {
    setEmail(roleEmail);
    setPassword('password123');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        
        {/* Brand Logo */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-600 to-emerald-500 items-center justify-center shadow-xl shadow-cyan-500/20 mb-2">
            <Activity className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400">
            RuralFracture-AI
          </h1>
          <p className="text-sm font-medium text-slate-400">
            Enhance. Detect. Prioritize.
          </p>
        </div>

        {/* Login Form Card */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5 shadow-2xl">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
              Clinical Staff Portal Sign-In
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Select a role or sign in with registered healthcare credentials.
            </p>
          </div>

          {/* Role Quick Selector */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setRoleQuick('worker@ruralfracture.ai')}
              className={`p-2.5 rounded-xl border text-center text-xs transition-all ${
                email === 'worker@ruralfracture.ai'
                  ? 'bg-cyan-600/20 border-cyan-500 text-cyan-300 font-bold'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Healthcare Worker
            </button>
            <button
              type="button"
              onClick={() => setRoleQuick('doctor@ruralfracture.ai')}
              className={`p-2.5 rounded-xl border text-center text-xs transition-all ${
                email === 'doctor@ruralfracture.ai'
                  ? 'bg-teal-600/20 border-teal-500 text-teal-300 font-bold'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Radiologist / Doctor
            </button>
            <button
              type="button"
              onClick={() => setRoleQuick('admin@ruralfracture.ai')}
              className={`p-2.5 rounded-xl border text-center text-xs transition-all ${
                email === 'admin@ruralfracture.ai'
                  ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 font-bold'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              System Admin
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
              <div className="relative">
                <UserCheck className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 font-bold rounded-xl shadow-lg glow-cyan hover:opacity-95 transition-all text-sm"
            >
              {loading ? 'Authenticating...' : 'Enter Clinical System'}
            </button>
          </form>
        </div>

        <DisclaimerBanner />
      </div>
    </div>
  );
};

export default LoginPage;
