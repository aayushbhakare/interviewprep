import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  RotateCcw,
  BookOpen,
  Sparkles,
  AlertTriangle,
  FileText,
  HelpCircle,
  Lightbulb,
} from 'lucide-react';
import { interviewService } from '../../services/interviewService';
import CoolingPeriodCard from './CoolingPeriodCard';

export default function InterviewResultsPage() {
  const { sessionId } = useParams();

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadResults();
  }, [sessionId]);

  const loadResults = async () => {
    setLoading(true);
    try {
      const res = await interviewService.getResults(sessionId);
      setResults(res.data);
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to load interview results.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-slate-500">
        <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-medium">Compiling final interview scorecard & evaluation...</p>
      </div>
    );
  }

  if (error || !results) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs max-w-md mx-auto mb-4">
          {error || 'Results not found.'}
        </div>
        <Link
          to="/practice"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 text-white rounded-lg text-xs font-bold"
        >
          Return to Practice Hub
        </Link>
      </div>
    );
  }

  const isPass = results.final_result === 'pass';
  const fb = results.overall_feedback || {};
  const rounds = results.rounds || [];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Banner Card: Overall Verdict */}
      <div
        className={`rounded-2xl p-6 sm:p-8 mb-8 border shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 ${
          isPass
            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
            : 'bg-rose-50/70 border-rose-200 text-rose-950'
        }`}
      >
        <div className="flex items-start gap-4">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
              isPass ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
            }`}
          >
            {isPass ? <CheckCircle2 className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                  isPass
                    ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                    : 'bg-rose-100 text-rose-900 border-rose-300'
                }`}
              >
                Simulation Verdict
              </span>
              <span className="text-xs text-slate-500 capitalize">
                {results.interview_type} Track
              </span>
            </div>

            <h1 className="text-3xl font-black tracking-tight mt-1">
              {isPass ? 'INTERVIEW PASSED' : 'INTERVIEW NOT CLEARED'}
            </h1>
            <p className="text-xs text-slate-600 mt-1 max-w-xl leading-relaxed">
              Target Standard: <span className="font-semibold text-slate-900">{results.role}</span> •{' '}
              Compensation Level: <span className="font-semibold text-slate-900">{results.salary_range}</span>
            </p>
          </div>
        </div>

        <div className="shrink-0 self-end sm:self-center text-right">
          <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
            Evaluation Model
          </span>
          <span className="text-xs font-bold text-slate-700">
            Binary Recruitment Decision
          </span>
        </div>
      </div>

      {/* Cooling Period Card if Failed */}
      {!isPass && results.cooling_period_until && (
        <CoolingPeriodCard
          coolingData={{
            remaining_seconds: Math.max(
              0,
              Math.floor((new Date(results.cooling_period_until) - new Date()) / 1000)
            ),
          }}
          interviewType={results.interview_type}
        />
      )}

      {/* Mixed Process Round Breakdown if Applicable */}
      {rounds.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-8">
          <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Award className="w-4 h-4 text-purple-600" />
            Recruitment Process Round Breakdown
          </h2>

          <div className="space-y-3">
            {rounds.map((r) => (
              <div
                key={r.round_id}
                className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              >
                <div className="flex items-center gap-2.5">
                  {r.result === 'pass' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : r.result === 'fail' ? (
                    <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  ) : (
                    <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                  <div>
                    <span className="font-bold text-slate-900 block">{r.round_name}</span>
                    <span className="text-[11px] text-slate-500 capitalize">{r.round_type.replace('_', ' ')}</span>
                  </div>
                </div>

                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-bold uppercase ${
                    r.result === 'pass'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : r.result === 'fail'
                      ? 'bg-rose-100 text-rose-800 border border-rose-200'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {r.result}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comprehensive Evaluator Feedback Cards */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 mb-8">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            Constructive Performance Evaluation & Feedback
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Objective assessment measured against typical industry expectations for {results.salary_range} engineering candidates.
          </p>
        </div>

        {/* Summary */}
        {fb.summary && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs leading-relaxed text-slate-800">
            <span className="font-bold text-slate-900 block mb-1">Evaluator Executive Summary:</span>
            {fb.summary}
          </div>
        )}

        {/* Dimension Breakdown Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs">
            <span className="font-bold text-slate-900 block mb-1">Technical Knowledge</span>
            <p className="text-slate-600 leading-relaxed text-[11.5px]">
              {fb.technical_knowledge || 'Evaluated core concepts and engineering depth.'}
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs">
            <span className="font-bold text-slate-900 block mb-1">Communication</span>
            <p className="text-slate-600 leading-relaxed text-[11.5px]">
              {fb.communication || 'Evaluated clarity, structure, and verbal articulation.'}
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs">
            <span className="font-bold text-slate-900 block mb-1">Problem Solving</span>
            <p className="text-slate-600 leading-relaxed text-[11.5px]">
              {fb.problem_solving || 'Evaluated trade-off decomposition and logic.'}
            </p>
          </div>
        </div>

        {/* Key Weaknesses & Areas for Improvement */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-rose-50/40 border border-rose-200 rounded-xl text-xs">
            <span className="font-bold text-rose-950 flex items-center gap-1.5 mb-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              Observed Weaknesses:
            </span>
            <ul className="space-y-1.5 text-slate-700 text-[11.5px] list-disc pl-4">
              {(fb.key_weaknesses || ['Further depth in distributed edge cases needed.']).map((w, idx) => (
                <li key={idx}>{w}</li>
              ))}
            </ul>
          </div>

          <div className="p-4 bg-amber-50/40 border border-amber-200 rounded-xl text-xs">
            <span className="font-bold text-amber-950 flex items-center gap-1.5 mb-2">
              <BookOpen className="w-4 h-4 text-amber-600" />
              Priority Areas to Revise:
            </span>
            <ul className="space-y-1.5 text-slate-700 text-[11.5px] list-disc pl-4">
              {(fb.areas_for_improvement || ['System architecture trade-offs under high scale.']).map((a, idx) => (
                <li key={idx}>{a}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Improvement Suggestions & Better Approaches */}
        <div className="space-y-3 pt-2">
          <div className="p-4 bg-indigo-50/50 border border-indigo-200 rounded-xl text-xs">
            <span className="font-bold text-indigo-950 flex items-center gap-1.5 mb-2">
              <Lightbulb className="w-4 h-4 text-indigo-600" />
              Actionable Recommendations for {results.salary_range} Benchmark:
            </span>
            <ul className="space-y-1.5 text-slate-700 text-[11.5px] list-disc pl-4">
              {(fb.improvement_suggestions || [
                'Practice structuring your responses by first stating your architectural assumption.',
              ]).map((s, idx) => (
                <li key={idx}>{s}</li>
              ))}
            </ul>
          </div>

          {fb.better_approaches && fb.better_approaches.length > 0 && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs">
              <span className="font-bold text-slate-900 flex items-center gap-1.5 mb-2">
                <HelpCircle className="w-4 h-4 text-slate-600" />
                Exemplar Answering Strategies:
              </span>
              <ul className="space-y-1.5 text-slate-700 text-[11.5px] list-disc pl-4">
                {fb.better_approaches.map((ba, idx) => (
                  <li key={idx}>{ba}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Return Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <Link
          to="/practice"
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
        >
          Return to Practice Hub
        </Link>

        <div className="flex items-center gap-3">
          <Link
            to="/practice/interviews/history"
            className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition shadow-xs"
          >
            View Past Interviews
          </Link>

          <Link
            to={`/practice/interviews/setup?type=${results.interview_type}`}
            className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Configure Another Interview</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
