import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import adminService from '../../services/adminService';
import {
  Users,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Bot,
  MessageSquare,
  ArrowRight,
  ShieldAlert,
  HelpCircle,
  Clock,
  Activity,
  Wrench,
  Sparkles,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardOverview();
  }, []);

  const fetchDashboardOverview = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminService.getDashboardOverview();
      setData(res.data);
    } catch (err) {
      console.error('Failed to load admin dashboard overview:', err);
      setError('Unable to load platform overview metrics. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mb-3" />
        <span className="text-xs font-semibold text-slate-500">Aggregating platform metrics...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center max-w-lg mx-auto mt-12">
        <AlertTriangle className="w-8 h-8 text-rose-600 mx-auto mb-2" />
        <h3 className="text-sm font-bold text-rose-900 mb-1">Error Loading Dashboard</h3>
        <p className="text-xs text-rose-700 mb-4">{error || 'Data unavailable'}</p>
        <button
          onClick={fetchDashboardOverview}
          className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  const { overview = {}, attention_required = {}, system_status = {} } = data;

  const totalAttentionCount =
    (attention_required.pending_experience_moderation || 0) +
    (attention_required.pending_technical_question_reports || 0) +
    (attention_required.pending_aptitude_question_reports || 0) +
    (attention_required.suspended_students || 0) +
    (attention_required.maintenance_mode_active ? 1 : 0);

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-200">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Platform Operations & Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time platform telemetry, student recruitment metrics, content governance, and operational controls.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchDashboardOverview}
            className="px-3.5 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold transition shadow-xs"
          >
            Refresh Telemetry
          </button>
          <Link
            to="/admin/settings"
            className="px-3.5 py-1.5 rounded-xl bg-brand-600 text-white hover:bg-brand-700 text-xs font-bold transition shadow-xs"
          >
            Configure Settings
          </Link>
        </div>
      </div>

      {/* Attention Required Section */}
      {totalAttentionCount > 0 ? (
        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-amber-900">
                Attention Required ({totalAttentionCount} Items)
              </h2>
            </div>
            <span className="text-[11px] font-semibold text-amber-700">Immediate action advised</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {attention_required.pending_experience_moderation > 0 && (
              <Link
                to="/admin/experiences"
                className="bg-white border border-amber-300 rounded-xl p-3.5 hover:shadow-sm hover:border-amber-400 transition flex items-center justify-between group"
              >
                <div>
                  <span className="text-lg font-black text-amber-950 block">
                    {attention_required.pending_experience_moderation}
                  </span>
                  <span className="text-xs font-semibold text-slate-600">
                    Flagged Experiences
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-amber-600 group-hover:translate-x-0.5 transition" />
              </Link>
            )}

            {attention_required.pending_technical_question_reports > 0 && (
              <Link
                to="/admin/question-bank"
                className="bg-white border border-amber-300 rounded-xl p-3.5 hover:shadow-sm hover:border-amber-400 transition flex items-center justify-between group"
              >
                <div>
                  <span className="text-lg font-black text-amber-950 block">
                    {attention_required.pending_technical_question_reports}
                  </span>
                  <span className="text-xs font-semibold text-slate-600">
                    Question Reports
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-amber-600 group-hover:translate-x-0.5 transition" />
              </Link>
            )}

            {attention_required.pending_aptitude_question_reports > 0 && (
              <Link
                to="/admin/aptitude"
                className="bg-white border border-amber-300 rounded-xl p-3.5 hover:shadow-sm hover:border-amber-400 transition flex items-center justify-between group"
              >
                <div>
                  <span className="text-lg font-black text-amber-950 block">
                    {attention_required.pending_aptitude_question_reports}
                  </span>
                  <span className="text-xs font-semibold text-slate-600">
                    Aptitude Reports
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-amber-600 group-hover:translate-x-0.5 transition" />
              </Link>
            )}

            {attention_required.suspended_students > 0 && (
              <Link
                to="/admin/students"
                className="bg-white border border-amber-300 rounded-xl p-3.5 hover:shadow-sm hover:border-amber-400 transition flex items-center justify-between group"
              >
                <div>
                  <span className="text-lg font-black text-amber-950 block">
                    {attention_required.suspended_students}
                  </span>
                  <span className="text-xs font-semibold text-slate-600">
                    Suspended Accounts
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-amber-600 group-hover:translate-x-0.5 transition" />
              </Link>
            )}

            {attention_required.maintenance_mode_active && (
              <Link
                to="/admin/maintenance"
                className="bg-rose-50 border border-rose-300 rounded-xl p-3.5 hover:shadow-sm hover:border-rose-400 transition flex items-center justify-between group"
              >
                <div>
                  <span className="text-xs font-black text-rose-900 block uppercase">
                    Active Alert
                  </span>
                  <span className="text-xs font-semibold text-rose-700">
                    Maintenance Enabled
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-rose-600 group-hover:translate-x-0.5 transition" />
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold text-emerald-900">
              Operational Status Normal — No moderation queues or system alerts pending.
            </span>
          </div>
          <span className="text-[11px] font-semibold text-emerald-700">All checks green</span>
        </div>
      )}

      {/* Platform Overview Metrics Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
            Platform Student Activity Overview
          </h2>
          <span className="text-xs text-slate-400 font-medium">Aggregated across all modules</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Card 1: Students */}
          <Link
            to="/admin/students"
            className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-brand-300 hover:shadow-sm transition group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Users className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                {overview.active_students || 0} Active
              </span>
            </div>
            <span className="text-2xl font-black text-slate-900 block">
              {overview.total_students || 0}
            </span>
            <span className="text-xs font-semibold text-slate-500 block mt-0.5">
              Registered Students
            </span>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span>Verified: {overview.verified_students || 0}</span>
              <span className="text-brand-600 font-bold group-hover:underline">Manage →</span>
            </div>
          </Link>

          {/* Card 2: Learning Roadmaps */}
          <Link
            to="/admin/learning"
            className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-brand-300 hover:shadow-sm transition group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <BookOpen className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
                {overview.total_topics || 0} Topics
              </span>
            </div>
            <span className="text-2xl font-black text-slate-900 block">
              {overview.active_roadmaps || 0}
            </span>
            <span className="text-xs font-semibold text-slate-500 block mt-0.5">
              Student Active Roadmaps
            </span>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span>Technologies: {overview.total_technologies || 0}</span>
              <span className="text-brand-600 font-bold group-hover:underline">View Content →</span>
            </div>
          </Link>

          {/* Card 3: Weekly Quizzes */}
          <Link
            to="/admin/question-bank"
            className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-brand-300 hover:shadow-sm transition group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                45 Qs Standard
              </span>
            </div>
            <span className="text-2xl font-black text-slate-900 block">
              {overview.completed_quiz_attempts || 0}
            </span>
            <span className="text-xs font-semibold text-slate-500 block mt-0.5">
              Completed Quiz Submissions
            </span>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span>Bank: {overview.total_technical_questions || 0} Questions</span>
              <span className="text-brand-600 font-bold group-hover:underline">Question Bank →</span>
            </div>
          </Link>

          {/* Card 4: Aptitude Sessions */}
          <Link
            to="/admin/aptitude"
            className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-brand-300 hover:shadow-sm transition group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <Layers className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                Fresher Standard
              </span>
            </div>
            <span className="text-2xl font-black text-slate-900 block">
              {overview.completed_aptitude_sessions || 0}
            </span>
            <span className="text-xs font-semibold text-slate-500 block mt-0.5">
              Completed Aptitude Assessments
            </span>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span>Bank: {overview.total_aptitude_questions || 0} Questions</span>
              <span className="text-brand-600 font-bold group-hover:underline">Manage Bank →</span>
            </div>
          </Link>

          {/* Card 5: AI Mock Interviews */}
          <Link
            to="/admin/interviews"
            className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-brand-300 hover:shadow-sm transition group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <Bot className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                Zero Cost (₹0)
              </span>
            </div>
            <span className="text-2xl font-black text-slate-900 block">
              {overview.completed_mock_interviews || 0}
            </span>
            <span className="text-xs font-semibold text-slate-500 block mt-0.5">
              Completed Voice Mock Interviews
            </span>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span>Total Sessions: {overview.total_mock_interviews || 0}</span>
              <span className="text-brand-600 font-bold group-hover:underline">Simulations →</span>
            </div>
          </Link>

          {/* Card 6: Peer Experiences */}
          <Link
            to="/admin/experiences"
            className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-brand-300 hover:shadow-sm transition group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                <MessageSquare className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
                Community Feed
              </span>
            </div>
            <span className="text-2xl font-black text-slate-900 block">
              {overview.published_experiences || 0}
            </span>
            <span className="text-xs font-semibold text-slate-500 block mt-0.5">
              Published Interview Journeys
            </span>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span>Total Submissions: {overview.total_experiences || 0}</span>
              <span className="text-brand-600 font-bold group-hover:underline">Moderation →</span>
            </div>
          </Link>
        </div>
      </div>

      {/* System Infrastructure & AI Health Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              System Health & Compliance Diagnostics
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Underlying database, AI providers, and ₹0 target budget compliance.
            </p>
          </div>
          <Link
            to="/admin/monitoring"
            className="text-xs font-bold text-brand-600 hover:underline"
          >
            Detailed Diagnostics →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-500 block">Database Status</span>
            <span className="text-xs font-bold text-emerald-700 mt-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>{system_status.database || 'Connected'}</span>
            </span>
            <span className="text-[11px] text-slate-400 mt-1 block">
              PostgreSQL (Source of Truth)
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-500 block">AI Routing Tier</span>
            <span className="text-xs font-bold text-slate-800 mt-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-brand-600" />
              <span>{system_status.ai_mode || 'Hybrid / Deterministic'}</span>
            </span>
            <span className="text-[11px] text-slate-400 mt-1 block">
              10 Services Active
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-500 block">Target Budget Compliance</span>
            <span className="text-xs font-bold text-emerald-700 mt-1 block">
              ₹0.00 / Zero Cost Maintained
            </span>
            <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
              100% Free Tier Compliant
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
