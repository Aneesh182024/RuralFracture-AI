import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import AIAssistantWidget from './components/AIAssistantWidget';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import PatientRegisterPage from './pages/PatientRegisterPage';
import PatientListPage from './pages/PatientListPage';
import PatientDetailsPage from './pages/PatientDetailsPage';
import NewCasePage from './pages/NewCasePage';
import QualityEnhancementPage from './pages/QualityEnhancementPage';
import AIAnalysisResultPage from './pages/AIAnalysisResultPage';
import ClinicalReviewPage from './pages/ClinicalReviewPage';
import DatasetImportPage from './pages/DatasetImportPage';
import DatasetManagementPage from './pages/DatasetManagementPage';
import ModelPerformancePage from './pages/ModelPerformancePage';
import UserManagementPage from './pages/UserManagementPage';
import SettingsPage from './pages/SettingsPage';

const ProtectedLayout = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 bg-slate-950/80 overflow-y-auto">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/patient-register" element={<PatientRegisterPage />} />
            <Route path="/patients" element={<PatientListPage />} />
            <Route path="/patients/:id" element={<PatientDetailsPage />} />
            <Route path="/new-case" element={<NewCasePage />} />
            <Route path="/quality-enhancement" element={<QualityEnhancementPage />} />
            <Route path="/results" element={<AIAnalysisResultPage />} />
            <Route path="/clinical-review" element={<ClinicalReviewPage />} />
            <Route path="/dataset-import" element={<DatasetImportPage />} />
            <Route path="/dataset-management" element={<DatasetManagementPage />} />
            <Route path="/model-performance" element={<ModelPerformancePage />} />
            <Route path="/user-management" element={<UserManagementPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      {/* Floating AI Assistant Widget accessible across all pages */}
      <AIAssistantWidget />
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/*" element={<ProtectedLayout />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
