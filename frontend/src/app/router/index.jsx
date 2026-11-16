import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardPage from '../../features/dashboard/DashboardPage';
import RegisterPage from '../../features/auth/RegisterPage';
import VerifyEmailPage from '../../features/auth/VerifyEmailPage';
import LoginPage from '../../features/auth/LoginPage';
import ForgotPasswordPage from '../../features/auth/ForgotPasswordPage';
import ResetPasswordPage from '../../features/auth/ResetPasswordPage';
import AdminLoginPage from '../../features/auth/AdminLoginPage';
import ProfilePage from '../../features/profile/ProfilePage';

// Simple placeholder page for router completeness
const SimplePage = ({ title, description }) => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">{title}</h1>
      <p className="text-slate-600">{description}</p>
      <div className="mt-6 inline-flex items-center px-3 py-1 rounded-md text-xs font-semibold bg-brand-50 text-brand-700">
        Phase 1 Ready
      </div>
    </div>
  </div>
);

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<DashboardPage />} />

      {/* Authentication Routes */}
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/admin-login" element={<AdminLoginPage />} />

      {/* Profile & Account Routes */}
      <Route path="/profile" element={<ProfilePage />} />

      {/* Domain Modules */}
      <Route path="/learn" element={<SimplePage title="Learn Module" description="Personalized roadmap setup and learning weeks." />} />
      <Route path="/practice" element={<SimplePage title="Practice Module" description="AI voice-led interviews & aptitude simulation." />} />
      <Route path="/experiences" element={<SimplePage title="Share Interview Experience" description="Real student recruitment journeys & discovery." />} />

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
