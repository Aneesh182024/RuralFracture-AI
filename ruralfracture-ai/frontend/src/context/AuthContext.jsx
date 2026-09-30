import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState({
    name: 'Nurse Mary (Healthcare Worker)',
    email: 'worker@ruralfracture.ai',
    role: 'HEALTHCARE_WORKER',
    hospital: 'Primary Rural Clinic',
  });
  const [token, setToken] = useState(localStorage.getItem('token') || 'demo_token');
  const [demoMode, setDemoMode] = useState(true);
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    try {
      setLoading(true);
      const res = await authAPI.login(email, password);
      setToken(res.data.access_token);
      setUser(res.data.user);
      localStorage.setItem('token', res.data.access_token);
      return { success: true };
    } catch (err) {
      console.warn('Login fallback to demo role simulation:', err);
      // Fallback demo logins
      let role = 'HEALTHCARE_WORKER';
      let name = 'Healthcare Worker';
      if (email.includes('admin')) { role = 'ADMIN'; name = 'System Admin'; }
      if (email.includes('doctor')) { role = 'DOCTOR'; name = 'Dr. Aris Thorne (Radiologist)'; }

      const demoUser = { name, email, role, hospital: 'Regional Rural Hospital' };
      setUser(demoUser);
      setToken('demo_token');
      return { success: true };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  const switchRole = (newRole) => {
    let name = 'Nurse Mary';
    if (newRole === 'ADMIN') name = 'System Administrator';
    if (newRole === 'DOCTOR') name = 'Dr. Aris Thorne (Radiologist)';
    setUser((prev) => ({
      ...prev,
      role: newRole,
      name: name,
    }));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        demoMode,
        setDemoMode,
        login,
        logout,
        switchRole,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
