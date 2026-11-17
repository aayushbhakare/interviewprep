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
import ExperienceDetailPage from '../../features/experiences/ExperienceDetailPage';
import ExperienceEditorPage from '../../features/experiences/ExperienceEditorPage';
import MyExperiencesPage from '../../features/experiences/MyExperiencesPage';
import AdminExperiencesPage from '../../features/admin/AdminExperiencesPage';
import QuizTakingPage from '../../features/quizzes/QuizTakingPage';
import QuizResultsPage from '../../features/quizzes/QuizResultsPage';
import AdminQuestionBankPage from '../../features/admin/AdminQuestionBankPage';
import AptitudePracticePage from '../../features/aptitude/AptitudePracticePage';
import AptitudeTestPage from '../../features/aptitude/AptitudeTestPage';
import AptitudeResultsPage from '../../features/aptitude/AptitudeResultsPage';
import AdminAptitudePage from '../../features/admin/AdminAptitudePage';
import InterviewSetupPage from '../../features/interviews/InterviewSetupPage';
import ActiveInterviewPage from '../../features/interviews/ActiveInterviewPage';
import MixedProcessPage from '../../features/interviews/MixedProcessPage';
import InterviewResultsPage from '../../features/interviews/InterviewResultsPage';
import InterviewHistoryPage from '../../features/interviews/InterviewHistoryPage';
import AdminInterviewsPage from '../../features/admin/AdminInterviewsPage';
import AdminLayout from '../../features/admin/AdminLayout';
import AdminDashboardPage from '../../features/admin/AdminDashboardPage';
import AdminStudentsPage from '../../features/admin/AdminStudentsPage';
import AdminLearningContentPage from '../../features/admin/AdminLearningContentPage';
import AdminSettingsPage from '../../features/admin/AdminSettingsPage';
import AdminAIModelsPage from '../../features/admin/AdminAIModelsPage';
import AdminMonitoringPage from '../../features/admin/AdminMonitoringPage';
import AdminActivityLogsPage from '../../features/admin/AdminActivityLogsPage';
import AdminMaintenancePage from '../../features/admin/AdminMaintenancePage';
import AdminSecurityPage from '../../features/admin/AdminSecurityPage';

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
      <Route
        path="/learn/quiz/:weekNumber/take"
        element={
          <ProtectedRoute>
            <QuizTakingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/learn/quiz/:attemptId/results"
        element={
          <ProtectedRoute>
            <QuizResultsPage />
          </ProtectedRoute>
        }
      />

      {/* Centralized Platform Administrative Console */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute requireAdmin={true}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboardPage />} />
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="students" element={<AdminStudentsPage />} />
        <Route path="learning" element={<AdminLearningContentPage />} />
        <Route path="question-bank" element={<AdminQuestionBankPage />} />
        <Route path="aptitude" element={<AdminAptitudePage />} />
        <Route path="interviews" element={<AdminInterviewsPage />} />
        <Route path="experiences" element={<AdminExperiencesPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
        <Route path="ai-models" element={<AdminAIModelsPage />} />
        <Route path="monitoring" element={<AdminMonitoringPage />} />
        <Route path="activity-logs" element={<AdminActivityLogsPage />} />
        <Route path="maintenance" element={<AdminMaintenancePage />} />
        <Route path="security" element={<AdminSecurityPage />} />
      </Route>

      {/* Practice Module, Interviews & Aptitude Routes */}
      <Route path="/practice" element={<PracticePage />} />
      <Route
        path="/practice/interviews/setup"
        element={
          <ProtectedRoute>
            <InterviewSetupPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/practice/interviews/:sessionId/active"
        element={
          <ProtectedRoute>
            <ActiveInterviewPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/practice/interviews/:sessionId/mixed"
        element={
          <ProtectedRoute>
            <MixedProcessPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/practice/interviews/:sessionId/results"
        element={
          <ProtectedRoute>
            <InterviewResultsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/practice/interviews/history"
        element={
          <ProtectedRoute>
            <InterviewHistoryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/practice/aptitude"
        element={
          <ProtectedRoute>
            <AptitudePracticePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/practice/aptitude/:sessionId/take"
        element={
          <ProtectedRoute>
            <AptitudeTestPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/practice/aptitude/:sessionId/results"
        element={
          <ProtectedRoute>
            <AptitudeResultsPage />
          </ProtectedRoute>
        }
      />

      <Route path="/experiences" element={<ExperiencesPage />} />
      <Route
        path="/experiences/new"
        element={
          <ProtectedRoute>
            <ExperienceEditorPage />
          </ProtectedRoute>
        }
      />
      <Route path="/experiences/:id" element={<ExperienceDetailPage />} />
      <Route
        path="/experiences/:id/edit"
        element={
          <ProtectedRoute>
            <ExperienceEditorPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-experiences"
        element={
          <ProtectedRoute>
            <MyExperiencesPage />
          </ProtectedRoute>
        }
      />

      {/* Catch-all Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
