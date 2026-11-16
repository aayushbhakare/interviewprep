import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import DashboardPage from '../../features/dashboard/DashboardPage';
import RegisterPage from '../../features/auth/RegisterPage';
import VerifyEmailPage from '../../features/auth/VerifyEmailPage';
import LoginPage from '../../features/auth/LoginPage';
import ForgotPasswordPage from '../../features/auth/ForgotPasswordPage';
import ResetPasswordPage from '../../features/auth/ResetPasswordPage';
import AdminLoginPage from '../../features/auth/AdminLoginPage';
import ProfilePage from '../../features/profile/ProfilePage';
import LearnPage from '../../features/learn/LearnPage';
import PracticePage from '../../features/practice/PracticePage';
import ExperiencesPage from '../../features/experiences/ExperiencesPage';

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

      {/* Protected Profile & Settings Route */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      {/* Core Domain Module Entry Points */}
      <Route path="/learn" element={<LearnPage />} />
      <Route path="/practice" element={<PracticePage />} />
      <Route path="/experiences" element={<ExperiencesPage />} />

      {/* Catch-all Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
