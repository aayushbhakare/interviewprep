import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  History,
  Calculator,
  Compass,
  BookOpen,
  ShieldCheck,
  ArrowLeft,
} from 'lucide-react';
import aptitudeService from '../../services/aptitudeService';
import AptitudeHistoryModal from './AptitudeHistoryModal';

export default function AptitudePracticePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [configData, setConfigData] = useState(null);
  const [eligibility, setEligibility] = useState({ is_eligible: true, reason: '' });
  const [dailyUsage, setDailyUsage] = useState({ used: 0, limit: 5, remaining: 5 });
  const [isStarting, setIsStarting] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    aptitudeService
      .getAptitudeConfig()
      .then((res) => {
        const d = res.data?.data || {};
        setConfigData(d.config || {});
        setEligibility(d.eligibility || { is_eligible: true });
        setDailyUsage(d.daily_usage || { used: 0, limit: 5, remaining: 5 });
      })
      .catch((err) => {
        setError(err?.response?.data?.detail || 'Failed to load aptitude test configuration.');
      })
      .finally(() => setLoading(false));
  }, []);

  const handleStartTest = async () => {
    setIsStarting(true);
    setError(null);
    try {
      const res = await aptitudeService.startOrResumeSession();
      const sessId = res.data?.data?.session_id;
      if (sessId) {
        navigate(`/practice/aptitude/${sessId}/take`);
      }
    } catch (err) {
      setError(err?.response?.data?.detail || err?.response?.data?.error?.message || 'Failed to start test.');
      setIsStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center text-slate-500">
        Loading Aptitude Module...
      </div>
    );
  }

  const durationMin = configData?.duration_minutes || 60;
  const totalQ = configData?.total_questions || 45;
  const distribution = configData?.distribution || { quantitative: 15, logical: 15, verbal: 15 };
  const canTakeTest = eligibility.is_eligible && dailyUsage.remaining > 0;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back to Practice */}
      <Link
        to="/practice"
        className="inline-flex items-center text-xs font-medium text-slate-500 hover:text-slate-800 mb-6 transition"
      >
        <ArrowLeft className="w-3.5 h-3.5 mr-1" />
        Back to Practice Hub
      </Link>

      {/* Module Title Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center space-x-2 text-brand-600 mb-1">
            <FileText className="w-6 h-6" />
            <span className="text-xs font-bold uppercase tracking-wider bg-brand-50 text-brand-700 px-2.5 py-0.5 rounded-full border border-brand-200">
              Cognitive Foundation Practice
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Fresher Aptitude Practice
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Standardized cognitive assessments modeled on modern campus hiring patterns across
            Quantitative Aptitude, Logical Reasoning, and Verbal Ability. Sharpen speed math, logical
            problem-solving, and verbal reasoning.
          </p>
        </div>

        <button
          onClick={() => setHistoryOpen(true)}
          className="inline-flex items-center px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 shadow-sm transition shrink-0"
        >
          <History className="w-4 h-4 mr-2 text-slate-500" />
          Past Sessions
        </button>
      </div>

      {/* Eligibility Warning Banner */}
      {!eligibility.is_eligible && (
        <div className="mb-6 bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start space-x-3 text-rose-800 text-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block">Fresher Eligibility Restriction</span>
            <p className="text-xs text-rose-700 mt-0.5">
              {eligibility.reason || 'Aptitude practice is reserved for fresher and entry-level candidates.'}
            </p>
          </div>
        </div>
      )}

      {/* Daily Quota Card */}
      <div className="mb-8 bg-gradient-to-r from-brand-50 to-blue-50/50 border border-brand-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <ShieldCheck className="w-4 h-4 text-brand-600" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Daily Practice Allowance
              </h3>
            </div>
            <p className="text-xs text-slate-600">
              Freshers receive up to 5 submitted sessions each calendar day. Abandoned attempts do not consume quota.
            </p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black text-brand-700">
              {dailyUsage.remaining} / {dailyUsage.limit}
            </span>
            <span className="block text-xs font-medium text-slate-500">Attempts Remaining Today</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-200 rounded-full h-2 mt-4 overflow-hidden">
          <div
            className="bg-brand-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(dailyUsage.remaining / dailyUsage.limit) * 100}%` }}
          />
        </div>
      </div>

      {/* Test Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
            <Calculator className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">Quantitative Aptitude</h3>
          <p className="text-xs text-slate-500 mb-3">Numerical Ability & Speed Math</p>
          <ul className="text-xs text-slate-600 space-y-1.5 border-t border-slate-100 pt-3">
            <li className="flex justify-between">
              <span>Section Questions:</span>
              <span className="font-semibold text-slate-800">{distribution.quantitative || 15} MCQs</span>
            </li>
            <li className="flex justify-between">
              <span>Key Topics:</span>
              <span className="text-slate-700">Percentages, Work, Speed</span>
            </li>
          </ul>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
            <Compass className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">Logical Reasoning</h3>
          <p className="text-xs text-slate-500 mb-3">Deductive & Analytical Thinking</p>
          <ul className="text-xs text-slate-600 space-y-1.5 border-t border-slate-100 pt-3">
            <li className="flex justify-between">
              <span>Section Questions:</span>
              <span className="font-semibold text-slate-800">{distribution.logical || 15} MCQs</span>
            </li>
            <li className="flex justify-between">
              <span>Key Topics:</span>
              <span className="text-slate-700">Syllogisms, Blood Relations</span>
            </li>
          </ul>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
            <BookOpen className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">Verbal Ability</h3>
          <p className="text-xs text-slate-500 mb-3">English Grammar & Comprehension</p>
          <ul className="text-xs text-slate-600 space-y-1.5 border-t border-slate-100 pt-3">
            <li className="flex justify-between">
              <span>Section Questions:</span>
              <span className="font-semibold text-slate-800">{distribution.verbal || 15} MCQs</span>
            </li>
            <li className="flex justify-between">
              <span>Key Topics:</span>
              <span className="text-slate-700">Comprehension, Error Spotting</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Test Parameters & Rules */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mb-8">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
          Test Rules & Scoring Structure
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-slate-500 block mb-1">Total Questions</span>
            <span className="text-base font-bold text-slate-900">{totalQ} MCQs</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-slate-500 block mb-1">Allocated Duration</span>
            <span className="text-base font-bold text-slate-900">{durationMin} Minutes</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-slate-500 block mb-1">Negative Marking</span>
            <span className="text-base font-bold text-emerald-600">None (0 Penalty)</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-slate-500 block mb-1">Question Bank Type</span>
            <span className="text-base font-bold text-slate-900">4-Option Multiple Choice</span>
          </div>
        </div>
      </div>

      {/* Global Error Banner */}
      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
          {error}
        </div>
      )}

      {/* Start Button */}
      <div className="flex justify-center">
        <button
          onClick={handleStartTest}
          disabled={!canTakeTest || isStarting}
          className="inline-flex items-center px-8 py-3.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Play className="w-4 h-4 mr-2" />
          {isStarting ? 'Starting Test...' : 'Start Aptitude Practice Test'}
        </button>
      </div>

      {/* History Modal */}
      <AptitudeHistoryModal isOpen={historyOpen} onClose={() => setHistoryOpen(false)} />
    </div>
  );
}
