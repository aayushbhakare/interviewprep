import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Clock,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Flag,
  Save,
  CheckCircle2,
  LogOut,
  Send,
  Loader2,
  Code2,
} from 'lucide-react';
import quizService from '../../services/quizService';
import QuizLeaveModal from './QuizLeaveModal';
import QuizSubmitModal from './QuizSubmitModal';
import QuestionReportModal from './QuestionReportModal';

export default function QuizTakingPage() {
  const { weekNumber } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);

  // Timer state (seconds)
  const [timeLeft, setTimeLeft] = useState(75 * 60);

  // Local answer state: { [questionId]: { submitted_answer, approach_explanation } }
  const [localAnswers, setLocalAnswers] = useState({});
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved' | 'saving' | 'error'

  // Modals
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  const [isAbandoning, setIsAbandoning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState(null);

  const autosaveTimerRef = useRef(null);
  const localAnswersRef = useRef({});
  const autoSubmittedRef = useRef(false);

  useEffect(() => {
    localAnswersRef.current = localAnswers;
  }, [localAnswers]);

  // Category display helpers
  const categoryLabels = {
    output_prediction: 'Code Output Prediction',
    error_debugging: 'Find Error / Debugging',
    coding: 'Coding Problem',
    scenario: 'Scenario-Based Architecture',
    conceptual: 'Conceptual & Short Answer',
  };

  const categoryBadges = {
    output_prediction: 'bg-purple-50 text-purple-700 border-purple-200',
    error_debugging: 'bg-rose-50 text-rose-700 border-rose-200',
    coding: 'bg-blue-50 text-blue-700 border-blue-200',
    scenario: 'bg-amber-50 text-amber-700 border-amber-200',
    conceptual: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };

  // 1. Initialize attempt on mount
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    quizService
      .startWeeklyQuiz(weekNumber)
      .then((res) => {
        if (!isMounted) return;
        const att = res.data;
        setAttempt(att);
        setQuestions(att.questions || []);
        setTimeLeft(att.remaining_seconds != null ? att.remaining_seconds : 75 * 60);

        // Prepopulate local answers
        const initialAnswers = {};
        (att.questions || []).forEach((q) => {
          initialAnswers[q.question_id] = {
            submitted_answer: q.submitted_answer || '',
            approach_explanation: q.approach_explanation || '',
          };
        });
        setLocalAnswers(initialAnswers);
      })
      .catch((err) => {
        if (!isMounted) return;
        setGlobalError(err?.response?.data?.detail || 'Failed to start quiz attempt.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [weekNumber]);

  // 2. Autosave function
  const triggerAutosave = useCallback(
    async (answersToSave) => {
      if (!attempt?.attempt_id) return;
      setSaveStatus('saving');

      const payload = Object.entries(answersToSave).map(([qid, data]) => ({
        question_id: qid,
        submitted_answer: data.submitted_answer || '',
        approach_explanation: data.approach_explanation || '',
      }));

      try {
        const res = await quizService.autosaveQuizAnswers(attempt.attempt_id, payload);
        if (res.data?.is_expired) {
          navigate(`/learn/quiz/${attempt.attempt_id}/results`);
          return false;
        }
        setSaveStatus('saved');
        return true;
      } catch {
        setSaveStatus('error');
        return false;
      }
    },
    [attempt?.attempt_id, navigate]
  );

  // 3. Debounced autosave on local answer edit
  const handleAnswerChange = (questionId, field, value) => {
    setLocalAnswers((prev) => {
      const updated = {
        ...prev,
        [questionId]: {
          ...prev[questionId],
          [field]: value,
        },
      };

      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = setTimeout(() => {
        triggerAutosave(updated);
      }, 1000);

      return updated;
    });
  };

  // 4. Timer countdown
  useEffect(() => {
    if (loading || !attempt) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [loading, attempt]);

  const handleAutoSubmit = useCallback(async () => {
    if (!attempt?.attempt_id || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await triggerAutosave(localAnswersRef.current);
      await quizService.submitQuizAttempt(attempt.attempt_id);
      navigate(`/learn/quiz/${attempt.attempt_id}/results`);
    } catch {
      navigate('/learn');
    }
  }, [attempt?.attempt_id, isSubmitting, navigate, triggerAutosave]);

  // Expiry check
  useEffect(() => {
    if (timeLeft === 0 && attempt?.attempt_id && !autoSubmittedRef.current && !loading) {
      autoSubmittedRef.current = true;
      handleAutoSubmit();
    }
  }, [timeLeft, attempt?.attempt_id, loading, handleAutoSubmit]);

  const handleManualSubmit = async () => {
    if (!attempt?.attempt_id) return;
    setIsSubmitting(true);
    try {
      await triggerAutosave(localAnswersRef.current);
      await quizService.submitQuizAttempt(attempt.attempt_id);
      setSubmitModalOpen(false);
      navigate(`/learn/quiz/${attempt.attempt_id}/results`);
    } catch (err) {
      setGlobalError(err?.response?.data?.detail || 'Failed to submit quiz.');
      setIsSubmitting(false);
    }
  };

  const handleConfirmAbandon = async () => {
    if (!attempt?.attempt_id) return;
    setIsAbandoning(true);
    try {
      await quizService.abandonQuizAttempt(attempt.attempt_id);
      setLeaveModalOpen(false);
      navigate('/learn');
    } catch (err) {
      setGlobalError(err?.response?.data?.detail || 'Failed to abandon quiz.');
      setIsAbandoning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin mb-3" />
        <p className="text-sm text-slate-400">Initializing Week {weekNumber} Assessment...</p>
      </div>
    );
  }

  if (globalError) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
        <div className="bg-slate-800 border border-rose-800 rounded-2xl p-8 max-w-md text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-white">Quiz Unavailable</h2>
          <p className="text-xs text-slate-300 leading-relaxed">{globalError}</p>
          <button
            onClick={() => navigate('/learn')}
            className="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 rounded-lg text-sm font-semibold transition-colors"
          >
            Back to Learn
          </button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIdx] || {};
  const currentAnswer = localAnswers[currentQ.question_id] || {
    submitted_answer: '',
    approach_explanation: '',
  };

  // Calculate answered count
  const answeredCount = questions.filter((q) => {
    const a = localAnswers[q.question_id];
    return a && ((a.submitted_answer || '').trim() || (a.approach_explanation || '').trim());
  }).length;

  // Format timer MM:SS
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const isWarning = timeLeft <= 10 * 60 && timeLeft > 5 * 60;
  const isCritical = timeLeft <= 5 * 60;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Sticky Top Assessment Bar */}
      <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-400">
              Week {weekNumber} Assessment
            </span>
            <div className="text-sm font-semibold text-white">
              Attempt #{attempt?.attempt_number} • Q{currentIdx + 1} of 45
            </div>
          </div>
        </div>

        {/* Center: Autosave status & Server Timer */}
        <div className="flex items-center space-x-6">
          <div className="hidden sm:flex items-center space-x-1.5 text-xs text-slate-400">
            {saveStatus === 'saving' && (
              <>
                <Loader2 className="w-3.5 h-3.5 text-brand-400 animate-spin" />
                <span>Saving...</span>
              </>
            )}
            {saveStatus === 'saved' && (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Answers saved</span>
              </>
            )}
            {saveStatus === 'error' && (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span className="text-rose-400">Save error</span>
              </>
            )}
          </div>

          {/* Countdown Clock */}
          <div
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border font-mono font-bold text-sm tracking-wide ${
              isCritical
                ? 'bg-rose-950/80 border-rose-600 text-rose-400 animate-pulse'
                : isWarning
                ? 'bg-amber-950/80 border-amber-600 text-amber-400'
                : 'bg-slate-800 border-slate-700 text-slate-200'
            }`}
          >
            <Clock className={`w-4 h-4 ${isCritical ? 'text-rose-400' : isWarning ? 'text-amber-400' : 'text-brand-400'}`} />
            <span>{timeFormatted}</span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => setLeaveModalOpen(true)}
            className="px-3 py-1.5 rounded-lg border border-slate-700 hover:border-slate-600 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-colors flex items-center space-x-1"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Leave</span>
          </button>
          <button
            onClick={() => setSubmitModalOpen(true)}
            className="px-4 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-md transition-all flex items-center space-x-1.5"
          >
            <span>Submit Quiz</span>
            <Send className="w-3 h-3" />
          </button>
        </div>
      </header>

      {/* Main Assessment Body: Two Columns */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left/Main Column: Question & Answer Workspace */}
        <section className="lg:col-span-8 flex flex-col space-y-5">
          {/* Question Card */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 sm:p-7 shadow-lg space-y-5">
            {/* Question Header & Meta */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-700/60">
              <div className="flex items-center space-x-2.5">
                <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-slate-700 text-slate-200">
                  Q{currentIdx + 1}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                    categoryBadges[currentQ.category] || 'bg-slate-700 text-slate-200'
                  }`}
                >
                  {categoryLabels[currentQ.category] || currentQ.category}
                </span>
                <span className="text-xs text-slate-400 capitalize">
                  {currentQ.difficulty} Difficulty
                </span>
              </div>

              <button
                onClick={() => setReportModalOpen(true)}
                className="text-slate-400 hover:text-rose-400 transition-colors p-1.5 rounded-lg text-xs flex items-center space-x-1"
                title="Report question issue"
              >
                <Flag className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Report Issue</span>
              </button>
            </div>

            {/* Prompt */}
            <div className="text-sm sm:text-base text-slate-100 font-medium leading-relaxed">
              {currentQ.prompt}
            </div>

            {/* Code Snippet (if present) */}
            {currentQ.code_snippet && (
              <div className="rounded-xl overflow-hidden border border-slate-700 bg-slate-950 font-mono text-xs">
                <div className="px-4 py-1.5 bg-slate-900 border-b border-slate-800 text-slate-400 flex items-center space-x-1.5">
                  <Code2 className="w-3.5 h-3.5 text-brand-400" />
                  <span>Code Snippet</span>
                </div>
                <pre className="p-4 text-emerald-400 overflow-x-auto leading-relaxed">
                  <code>{currentQ.code_snippet}</code>
                </pre>
              </div>
            )}

            {/* Answer Input Workspace */}
            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  {currentQ.category === 'output_prediction'
                    ? 'Expected Standard Output:'
                    : currentQ.category === 'error_debugging'
                    ? 'Identified Error & Corrected Code:'
                    : currentQ.category === 'coding'
                    ? 'Your Code Implementation:'
                    : 'Your Technical Solution:'}
                </label>
                <textarea
                  rows={currentQ.category === 'coding' ? 8 : 4}
                  value={currentAnswer.submitted_answer}
                  onChange={(e) =>
                    handleAnswerChange(currentQ.question_id, 'submitted_answer', e.target.value)
                  }
                  placeholder={
                    currentQ.category === 'output_prediction'
                      ? 'Type the exact output (e.g. [1, 2, 3] or True)...'
                      : currentQ.category === 'coding'
                      ? 'Write clean, runnable implementation code...'
                      : 'Provide your technical explanation...'
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3.5 text-sm font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none leading-relaxed"
                />
              </div>

              {/* Approach / Justification Textarea (mandatory for coding, scenario, debugging) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Approach & Technical Reasoning
                </label>
                <textarea
                  rows={3}
                  value={currentAnswer.approach_explanation}
                  onChange={(e) =>
                    handleAnswerChange(currentQ.question_id, 'approach_explanation', e.target.value)
                  }
                  placeholder="Explain why this approach works, complexity tradeoffs (time/space), or key algorithmic choices..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none leading-relaxed"
                />
              </div>
            </div>

            {/* Navigation Controls */}
            <div className="pt-4 border-t border-slate-700/60 flex items-center justify-between">
              <button
                onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
                disabled={currentIdx === 0}
                className="px-4 py-2 rounded-lg border border-slate-700 hover:bg-slate-700 text-xs font-semibold text-slate-300 disabled:opacity-30 disabled:hover:bg-transparent transition-colors flex items-center space-x-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <button
                onClick={() => setCurrentIdx((prev) => Math.min(questions.length - 1, prev + 1))}
                disabled={currentIdx === questions.length - 1}
                className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs font-semibold text-white disabled:opacity-30 transition-colors flex items-center space-x-1"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>

        {/* Right Column: 45-Question Navigation Palette */}
        <aside className="lg:col-span-4 flex flex-col space-y-4">
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700 mb-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Question Palette
              </h4>
              <span className="text-xs font-bold text-brand-400">
                {answeredCount}/45 Answered
              </span>
            </div>

            {/* Status Legend */}
            <div className="grid grid-cols-3 gap-2 pb-4 mb-4 border-b border-slate-700/60 text-[11px] text-slate-400">
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded bg-emerald-500 flex-shrink-0" />
                <span>Answered</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded bg-slate-700 flex-shrink-0" />
                <span>Unanswered</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded ring-2 ring-brand-400 bg-slate-700 flex-shrink-0" />
                <span>Current</span>
              </div>
            </div>

            {/* 45 Palette Buttons */}
            <div className="grid grid-cols-5 sm:grid-cols-9 lg:grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const ans = localAnswers[q.question_id];
                const isAnswered =
                  ans && ((ans.submitted_answer || '').trim() || (ans.approach_explanation || '').trim());
                const isCurrent = idx === currentIdx;

                return (
                  <button
                    key={q.question_id}
                    onClick={() => setCurrentIdx(idx)}
                    className={`h-9 rounded-lg text-xs font-bold transition-all flex items-center justify-center relative ${
                      isCurrent
                        ? isAnswered
                          ? 'ring-2 ring-white bg-emerald-600 text-white shadow-md'
                          : 'ring-2 ring-brand-400 bg-brand-600 text-white shadow-sm'
                        : isAnswered
                        ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                        : 'bg-slate-700/80 text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </aside>
      </main>

      {/* Leave Modal */}
      <QuizLeaveModal
        isOpen={leaveModalOpen}
        onClose={() => setLeaveModalOpen(false)}
        onConfirmAbandon={handleConfirmAbandon}
        isAbandoning={isAbandoning}
      />

      {/* Submit Modal */}
      <QuizSubmitModal
        isOpen={submitModalOpen}
        onClose={() => setSubmitModalOpen(false)}
        onConfirmSubmit={handleManualSubmit}
        answeredCount={answeredCount}
        totalQuestions={45}
        isSubmitting={isSubmitting}
      />

      {/* Report Modal */}
      <QuestionReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        questionId={currentQ?.question_id}
        questionPrompt={currentQ?.prompt}
      />
    </div>
  );
}
