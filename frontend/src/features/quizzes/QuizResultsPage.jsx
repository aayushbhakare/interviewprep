import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Flag,
  RotateCcw,
  Code2,
  Loader2,
  HelpCircle,
} from 'lucide-react';
import quizService from '../../services/quizService';
import QuestionReportModal from './QuestionReportModal';

export default function QuizResultsPage() {
  const { attemptId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [expandedQuestions, setExpandedQuestions] = useState({});
  const [reportingQ, setReportingQ] = useState(null);

  useEffect(() => {
    setLoading(true);
    quizService
      .getQuizResults(attemptId)
      .then((res) => {
        setResult(res.data);
      })
      .catch((err) => {
        setError(err?.response?.data?.detail || 'Failed to retrieve quiz results.');
      })
      .finally(() => setLoading(false));
  }, [attemptId]);

  const toggleExpand = (answerId) => {
    setExpandedQuestions((prev) => ({
      ...prev,
      [answerId]: !prev[answerId],
    }));
  };

  const expandAll = () => {
    const all = {};
    (result?.questions || []).forEach((q) => {
      all[q.answer_id] = true;
    });
    setExpandedQuestions(all);
  };

  const collapseAll = () => {
    setExpandedQuestions({});
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0m 0s';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const formatDate = (isoString) => {
    if (!isoString) return '—';
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-brand-600 animate-spin mb-3" />
        <p className="text-sm text-slate-600">Retrieving Evaluation Results...</p>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-md text-center space-y-4 shadow-sm">
          <HelpCircle className="w-12 h-12 text-slate-400 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900">Results Unavailable</h2>
          <p className="text-xs text-slate-600">{error || 'Could not load results.'}</p>
          <Link
            to="/learn"
            className="inline-block px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-semibold"
          >
            Back to Learn
          </Link>
        </div>
      </div>
    );
  }

  // Handle evaluation pending
  if (result.status === 'evaluation_pending') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white border border-amber-200 rounded-2xl p-8 max-w-lg text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 mx-auto flex items-center justify-center">
            <Clock className="w-6 h-6 animate-spin" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Evaluation Pending</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Your quiz submission was received successfully. The binary grading system is currently evaluating your answers.
            No score has been fabricated. Please check back shortly.
          </p>
          <div className="pt-2 flex justify-center space-x-3">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold"
            >
              Refresh Status
            </button>
            <Link
              to="/learn"
              className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-semibold"
            >
              Back to Roadmap
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const scorePct = result.score != null ? result.score.toFixed(1) : '0.0';
  const isPassing = (result.score || 0) >= 60.0;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Back Nav */}
        <div className="flex items-center justify-between">
          <Link
            to="/learn"
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Learning Roadmap</span>
          </Link>
          <span className="text-xs text-slate-500">
            Week {result.week_number} • Attempt #{result.attempt_number}
          </span>
        </div>

        {/* Hero Scorecard */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm overflow-hidden relative">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center space-x-5">
              <div
                className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center font-black text-2xl flex-shrink-0 ${
                  isPassing
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                <span>{scorePct}%</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {isPassing ? 'Proficient' : 'Needs Work'}
                </span>
              </div>

              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                  Assessment Results
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  Week {result.week_number} Technical Assessment Review
                </p>

                <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-3 text-xs text-slate-600">
                  <span className="flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{formatDate(result.submitted_at)}</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Time Taken: {formatDuration(result.time_taken_seconds)}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Binary Stats Counters */}
            <div className="flex items-center space-x-3 self-stretch md:self-auto">
              <div className="flex-1 md:flex-initial px-4 py-3 rounded-2xl bg-emerald-50 border border-emerald-100 text-center min-w-[90px]">
                <div className="flex items-center justify-center space-x-1 text-emerald-700 font-black text-xl">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{result.correct_count}</span>
                </div>
                <span className="text-[11px] font-semibold text-emerald-800">Correct</span>
              </div>

              <div className="flex-1 md:flex-initial px-4 py-3 rounded-2xl bg-rose-50 border border-rose-100 text-center min-w-[90px]">
                <div className="flex items-center justify-center space-x-1 text-rose-700 font-black text-xl">
                  <XCircle className="w-4 h-4" />
                  <span>{result.incorrect_count}</span>
                </div>
                <span className="text-[11px] font-semibold text-rose-800">Incorrect</span>
              </div>

              <div className="flex-1 md:flex-initial px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-center min-w-[90px]">
                <span className="block font-black text-xl text-slate-800">45</span>
                <span className="text-[11px] font-semibold text-slate-600">Total</span>
              </div>
            </div>
          </div>
        </div>

        {/* Review Controls Bar */}
        <div className="flex items-center justify-between pt-2">
          <h2 className="text-base font-bold text-slate-900">
            Question-by-Question Review (45)
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={expandAll}
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 px-2 py-1 rounded"
            >
              Expand All
            </button>
            <span className="text-slate-300">|</span>
            <button
              onClick={collapseAll}
              className="text-xs font-semibold text-slate-500 hover:text-slate-700 px-2 py-1 rounded"
            >
              Collapse All
            </button>
          </div>
        </div>

        {/* Question List */}
        <div className="space-y-4">
          {(result.questions || []).map((q) => {
            const isOpen = !!expandedQuestions[q.answer_id];
            const isCorrect = q.is_correct === true;

            return (
              <div
                key={q.answer_id}
                className={`bg-white border rounded-2xl shadow-sm overflow-hidden transition-all ${
                  isCorrect ? 'border-slate-200' : 'border-rose-200/80'
                }`}
              >
                {/* Header row */}
                <div
                  onClick={() => toggleExpand(q.answer_id)}
                  className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50/80 transition-colors select-none"
                >
                  <div className="flex items-center space-x-3.5 pr-2">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                        isCorrect
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {isCorrect ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">
                          Question {q.order}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 capitalize">
                          {q.category.replace('_', ' ')}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isCorrect
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {isCorrect ? 'Correct' : 'Incorrect'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-1">{q.prompt}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 text-slate-400">
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>

                {/* Expanded Question Details */}
                {isOpen && (
                  <div className="p-5 border-t border-slate-100 bg-slate-50/40 space-y-4">
                    {/* Full Prompt */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                        Question Prompt
                      </h4>
                      <p className="text-sm text-slate-900 leading-relaxed">{q.prompt}</p>
                    </div>

                    {/* Snippet (if any) */}
                    {q.code_snippet && (
                      <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-900 text-emerald-400 p-3 font-mono text-xs leading-relaxed overflow-x-auto">
                        <pre>
                          <code>{q.code_snippet}</code>
                        </pre>
                      </div>
                    )}

                    {/* Student Submitted Answer */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          Your Submitted Answer
                        </span>
                        <div className="font-mono text-xs text-slate-900 whitespace-pre-wrap leading-relaxed">
                          {q.submitted_answer || <span className="text-slate-400 italic">No answer submitted</span>}
                        </div>
                        {q.approach_explanation && (
                          <div className="pt-2 border-t border-slate-100 text-xs text-slate-600">
                            <strong>Approach:</strong> {q.approach_explanation}
                          </div>
                        )}
                      </div>

                      {/* Expected Answer */}
                      <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-200 space-y-1.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                          Expected Solution / Criteria
                        </span>
                        <div className="font-mono text-xs text-emerald-950 whitespace-pre-wrap leading-relaxed">
                          {q.expected_answer}
                        </div>
                      </div>
                    </div>

                    {/* Detailed Explanation */}
                    {q.explanation && (
                      <div className="p-3.5 rounded-xl bg-blue-50/40 border border-blue-100 text-xs text-slate-700 leading-relaxed">
                        <strong className="text-blue-900 block mb-1">Technical Explanation:</strong>
                        {q.explanation}
                      </div>
                    )}

                    {/* AI Feedback explanation */}
                    {q.evaluation_explanation && (
                      <div className="text-xs text-slate-500 italic">
                        <strong>Evaluation Feedback:</strong> {q.evaluation_explanation}
                      </div>
                    )}

                    {/* Report Issue button */}
                    <div className="pt-1 flex justify-end">
                      <button
                        onClick={() => setReportingQ(q)}
                        className="text-xs text-slate-400 hover:text-rose-600 flex items-center space-x-1"
                      >
                        <Flag className="w-3.5 h-3.5" />
                        <span>Report Question Issue</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Report Modal */}
      {reportingQ && (
        <QuestionReportModal
          isOpen={!!reportingQ}
          onClose={() => setReportingQ(null)}
          questionId={reportingQ.question_id}
          questionPrompt={reportingQ.prompt}
        />
      )}
    </div>
  );
}
