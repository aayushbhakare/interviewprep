import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Award,
  BarChart3,
  AlertCircle,
  RefreshCw,
  Flag,
  Calculator,
  Compass,
  BookOpen,
  Filter,
  Check,
  X,
  History,
} from 'lucide-react';
import aptitudeService from '../../services/aptitudeService';
import AptitudeReportModal from './AptitudeReportModal';
import AptitudeHistoryModal from './AptitudeHistoryModal';

export default function AptitudeResultsPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'correct' | 'incorrect' | 'unanswered'
  const [categoryFilter, setCategoryFilter] = useState('all'); // 'all' | 'Quantitative Aptitude' | 'Logical Reasoning' | 'Verbal Ability'

  // Modals
  const [reportingQuestion, setReportingQuestion] = useState(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    setLoading(true);
    setError(null);

    aptitudeService
      .getSessionResults(sessionId)
      .then((res) => {
        setResults(res.data?.data || null);
      })
      .catch((err) => {
        setError(
          err?.response?.data?.detail ||
            err?.response?.data?.error?.message ||
            'Unable to load session results.'
        );
      })
      .finally(() => setLoading(false));
  }, [sessionId]);

  const questions = results?.questions || [];

  // Summary counts
  const summary = useMemo(() => {
    if (!results) return null;
    const total = results.total_questions || questions.length || 0;
    const correct = results.correct_count || 0;
    const incorrect = results.incorrect_count || 0;
    const unanswered = Math.max(0, total - (correct + incorrect));
    const score = results.score || correct;
    const percentage = results.percentage || (total > 0 ? ((score / total) * 100).toFixed(1) : 0);

    const timeSpentSec = results.time_spent_seconds || 0;
    const mins = Math.floor(timeSpentSec / 60);
    const secs = timeSpentSec % 60;
    const timeFormatted = `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;

    // Section breakdown
    const sections = {
      'Quantitative Aptitude': { total: 0, correct: 0, incorrect: 0, unanswered: 0 },
      'Logical Reasoning': { total: 0, correct: 0, incorrect: 0, unanswered: 0 },
      'Verbal Ability': { total: 0, correct: 0, incorrect: 0, unanswered: 0 },
    };

    questions.forEach((q) => {
      const cat = q.category || 'Quantitative Aptitude';
      if (!sections[cat]) {
        sections[cat] = { total: 0, correct: 0, incorrect: 0, unanswered: 0 };
      }
      sections[cat].total += 1;
      if (q.selected_option_index === null || q.selected_option_index === undefined) {
        sections[cat].unanswered += 1;
      } else if (q.is_correct) {
        sections[cat].correct += 1;
      } else {
        sections[cat].incorrect += 1;
      }
    });

    return {
      total,
      correct,
      incorrect,
      unanswered,
      score,
      percentage,
      timeFormatted,
      sections,
    };
  }, [results, questions]);

  // Filtered questions
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      // Category filter
      if (categoryFilter !== 'all' && q.category !== categoryFilter) {
        return false;
      }

      const isUnanswered = q.selected_option_index === null || q.selected_option_index === undefined;

      // Status filter
      if (statusFilter === 'correct') {
        return q.is_correct === true;
      }
      if (statusFilter === 'incorrect') {
        return !isUnanswered && !q.is_correct;
      }
      if (statusFilter === 'unanswered') {
        return isUnanswered;
      }

      return true;
    });
  }, [questions, categoryFilter, statusFilter]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center text-slate-500">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4" />
        <p className="text-sm font-medium">Loading session scorecard & explanations...</p>
      </div>
    );
  }

  if (error || !results) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 mb-6">
          <AlertCircle className="w-6 h-6 mx-auto mb-2 text-red-500" />
          <p className="font-semibold">{error || 'Scorecard not found'}</p>
          <p className="text-xs text-red-600 mt-1">
            Solutions are only published after the test is completed.
          </p>
        </div>
        <div className="flex justify-center gap-3">
          <Link
            to="/practice/aptitude"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
          >
            Go to Aptitude Practice
          </Link>
          <Link
            to="/practice"
            className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50"
          >
            Practice Hub
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <Link
            to="/practice/aptitude"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Aptitude Practice
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            Aptitude Practice Scorecard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Comprehensive review and step-by-step solutions for your recent practice test.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setHistoryOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <History className="w-3.5 h-3.5" />
            Attempt History
          </button>
          <button
            onClick={() => navigate('/practice/aptitude')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Take Another Test
          </button>
        </div>
      </div>

      {/* Standalone Practice Banner (Explicitly reminding: No Pass/Fail for Standalone Practice) */}
      <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-4 flex items-start gap-3">
        <Award className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-indigo-900 leading-relaxed">
          <span className="font-semibold">Practice Module Performance:</span> This is a self-paced
          aptitude training test designed for TCS NQT cognitive pattern preparation. Practice tests
          do not issue recruitment pass/fail verdicts—review every explanation below to build speed
          and accuracy.
          {results.session_type === 'mixed_stage' && (
            <div className="mt-2 pt-2 border-t border-indigo-200 flex items-center gap-2">
              <span className="font-semibold">Recruitment Simulation Qualification:</span>
              <span
                className={`px-2 py-0.5 rounded text-xs font-bold ${
                  results.is_passed
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-rose-100 text-rose-800 border border-rose-300'
                }`}
              >
                {results.is_passed ? 'QUALIFIED (PASS)' : 'NOT QUALIFIED (FAIL)'}
              </span>
              <span className="text-indigo-700">
                (Cutoff: {results.mixed_qualifying_cutoff}% | Your Score: {summary?.percentage}%)
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Overall Score</span>
            <BarChart3 className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {summary?.percentage}%
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {summary?.score} of {summary?.total} marks
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Correct Answers</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600">{summary?.correct}</div>
          <p className="text-xs text-slate-500 mt-1">
            {summary?.total > 0
              ? Math.round((summary.correct / summary.total) * 100)
              : 0}
            % accuracy
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Incorrect / Skipped</span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            <span className="text-rose-600">{summary?.incorrect}</span>
            <span className="text-slate-400 text-lg font-normal"> / </span>
            <span className="text-amber-600">{summary?.unanswered}</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {summary?.incorrect} wrong, {summary?.unanswered} unattempted
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Time Taken</span>
            <Clock className="w-4 h-4 text-slate-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{summary?.timeFormatted}</div>
          <p className="text-xs text-slate-500 mt-1">Out of 60 mins allotted</p>
        </div>
      </div>

      {/* Section Breakdown Grid */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
        <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-indigo-600" />
          Section-wise Performance Breakdown
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              title: 'Quantitative Aptitude',
              icon: Calculator,
              color: 'text-blue-600',
              bgColor: 'bg-blue-50',
              data: summary?.sections['Quantitative Aptitude'] || {
                total: 0,
                correct: 0,
                incorrect: 0,
                unanswered: 0,
              },
            },
            {
              title: 'Logical Reasoning',
              icon: Compass,
              color: 'text-purple-600',
              bgColor: 'bg-purple-50',
              data: summary?.sections['Logical Reasoning'] || {
                total: 0,
                correct: 0,
                incorrect: 0,
                unanswered: 0,
              },
            },
            {
              title: 'Verbal Ability',
              icon: BookOpen,
              color: 'text-emerald-600',
              bgColor: 'bg-emerald-50',
              data: summary?.sections['Verbal Ability'] || {
                total: 0,
                correct: 0,
                incorrect: 0,
                unanswered: 0,
              },
            },
          ].map((sec) => {
            const Icon = sec.icon;
            const pct =
              sec.data.total > 0
                ? Math.round((sec.data.correct / sec.data.total) * 100)
                : 0;
            return (
              <div
                key={sec.title}
                className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${sec.bgColor} ${sec.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-800">{sec.title}</span>
                  </div>
                  <span className="text-xs font-bold text-slate-700">{pct}%</span>
                </div>

                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1">
                  <span>
                    <strong className="text-emerald-600">{sec.data.correct}</strong> correct
                  </span>
                  <span>
                    <strong className="text-rose-600">{sec.data.incorrect}</strong> wrong
                  </span>
                  <span>
                    <strong className="text-slate-500">{sec.data.unanswered}</strong> skipped
                  </span>
                  <span className="text-slate-400 font-medium">/{sec.data.total} Qs</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Solutions & Explanations Header & Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Detailed Question Analysis & Step-by-Step Solutions
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review correct options, mathematical working, and clear logical deductions for every
              question.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs">
              {[
                { id: 'all', label: `All (${questions.length})` },
                { id: 'correct', label: `Correct (${summary?.correct})` },
                { id: 'incorrect', label: `Incorrect (${summary?.incorrect})` },
                { id: 'unanswered', label: `Skipped (${summary?.unanswered})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                    statusFilter === tab.id
                      ? 'bg-white text-indigo-600 shadow-sm font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-1.5 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Sections</option>
                <option value="Quantitative Aptitude">Quantitative</option>
                <option value="Logical Reasoning">Logical</option>
                <option value="Verbal Ability">Verbal</option>
              </select>
            </div>
          </div>
        </div>

        {/* Question List */}
        {filteredQuestions.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            No questions match the selected filter.
          </div>
        ) : (
          <div className="space-y-6">
            {filteredQuestions.map((q) => {
              const isUnanswered =
                q.selected_option_index === null || q.selected_option_index === undefined;
              const isCorrect = q.is_correct === true;

              return (
                <div
                  key={q.question_id || q.order}
                  id={`q-${q.order}`}
                  className="p-5 rounded-xl border border-slate-200 bg-white space-y-4 hover:border-slate-300 transition-colors shadow-xs"
                >
                  {/* Question Meta Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                        {q.order}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
                        {q.category}
                      </span>
                      {q.topic && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-indigo-50 text-indigo-700">
                          {q.topic}
                        </span>
                      )}
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                          q.difficulty === 'hard'
                            ? 'bg-rose-50 text-rose-700'
                            : q.difficulty === 'easy'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {q.difficulty}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isUnanswered ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                          Unattempted
                        </span>
                      ) : isCorrect ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          Correct (+1)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          <X className="w-3.5 h-3.5 text-rose-600" />
                          Incorrect (0)
                        </span>
                      )}

                      <button
                        onClick={() =>
                          setReportingQuestion({
                            id: q.question_id,
                            text: q.question_text,
                          })
                        }
                        title="Report typo or inaccurate question"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Flag className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Question Text */}
                  <div className="text-sm font-medium text-slate-900 leading-relaxed pl-1 whitespace-pre-line">
                    {q.question_text}
                  </div>

                  {/* 4 MCQ Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    {(q.options || []).map((opt, optIdx) => {
                      const letter = String.fromCharCode(65 + optIdx);
                      const isOptionCorrect = optIdx === q.correct_option_index;
                      const isOptionSelected = optIdx === q.selected_option_index;

                      let cardStyle = 'border-slate-200 bg-white text-slate-800';
                      let badge = null;

                      if (isOptionCorrect && isOptionSelected) {
                        cardStyle =
                          'border-emerald-500 bg-emerald-50/70 text-emerald-950 font-medium ring-1 ring-emerald-400';
                        badge = (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded ml-auto">
                            Your Choice (Correct)
                          </span>
                        );
                      } else if (isOptionCorrect && !isOptionSelected) {
                        cardStyle =
                          'border-emerald-500 bg-emerald-50/50 text-emerald-950 font-medium';
                        badge = (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded ml-auto">
                            Correct Answer
                          </span>
                        );
                      } else if (!isOptionCorrect && isOptionSelected) {
                        cardStyle =
                          'border-rose-400 bg-rose-50/70 text-rose-950 font-medium ring-1 ring-rose-300';
                        badge = (
                          <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded ml-auto">
                            Your Choice (Wrong)
                          </span>
                        );
                      }

                      return (
                        <div
                          key={optIdx}
                          className={`flex items-start gap-2.5 p-3 rounded-lg border text-xs transition-all ${cardStyle}`}
                        >
                          <span
                            className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[11px] flex-shrink-0 ${
                              isOptionCorrect
                                ? 'bg-emerald-600 text-white'
                                : isOptionSelected
                                ? 'bg-rose-600 text-white'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {letter}
                          </span>
                          <span className="pt-0.5 leading-relaxed">{opt}</span>
                          {badge}
                        </div>
                      );
                    })}
                  </div>

                  {/* Step-by-Step Explanation Box */}
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2 text-xs">
                    <div className="font-semibold text-slate-800 flex items-center gap-1.5 text-xs">
                      <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                      Step-by-Step Explanation & Working:
                    </div>
                    <div className="text-slate-700 whitespace-pre-line leading-relaxed font-mono text-[11.5px] bg-white p-3 rounded border border-slate-200">
                      {q.explanation ||
                        'Detailed step-by-step mathematical reasoning verified for TCS NQT standard.'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Return Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200">
        <Link
          to="/practice"
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Practice Tracks
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            Back to Top
          </button>
          <button
            onClick={() => navigate('/practice/aptitude')}
            className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
          >
            Start New Practice Test
          </button>
        </div>
      </div>

      {/* Report Issue Modal */}
      {reportingQuestion && (
        <AptitudeReportModal
          questionId={reportingQuestion.id}
          questionText={reportingQuestion.text}
          onClose={() => setReportingQuestion(null)}
          onSuccess={() => {
            setReportingQuestion(null);
            alert('Thank you! Your report has been submitted to the question moderation team.');
          }}
        />
      )}

      {/* History Modal */}
      {historyOpen && <AptitudeHistoryModal onClose={() => setHistoryOpen(false)} />}
    </div>
  );
}
