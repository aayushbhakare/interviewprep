import React, { useState, useEffect } from 'react';
import { Award, Clock, ArrowRight, CheckCircle2, History, RefreshCw, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import quizService from '../../services/quizService';
import QuizInstructionsModal from './QuizInstructionsModal';
import QuizHistoryModal from './QuizHistoryModal';

export default function QuizOverviewCard({
  weekNumber,
  weekTitle,
  overview: preloadedOverview,
  onRefreshRoadmap,
}) {
  const [overview, setOverview] = useState(preloadedOverview || null);
  const [loading, setLoading] = useState(!preloadedOverview);
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchOverview = async () => {
    try {
      const res = await quizService.getWeeklyQuizOverview(weekNumber);
      setOverview(res.data);
    } catch {
      // Fallback
      setOverview({
        week_number: weekNumber,
        status: 'ready',
        is_ready: true,
        submitted_attempts: 0,
        max_attempts: 5,
        can_attempt: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!preloadedOverview) {
      fetchOverview();
    } else {
      setOverview(preloadedOverview);
      setLoading(false);
    }
  }, [weekNumber, preloadedOverview]);

  const handleStartAttempt = async () => {
    setStarting(true);
    setError(null);
    try {
      await quizService.startWeeklyQuiz(weekNumber);
      setInstructionsOpen(false);
      navigate(`/learn/quiz/${weekNumber}/take`);
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to start quiz attempt.');
      setStarting(false);
    }
  };

  const handleResumeAttempt = () => {
    navigate(`/learn/quiz/${weekNumber}/take`);
  };

  const handleViewResults = async () => {
    if (overview?.latest_attempt_id) {
      navigate(`/learn/quiz/${overview.latest_attempt_id}/results`);
    } else {
      try {
        const res = await quizService.getWeeklyQuizOverview(weekNumber);
        if (res.data?.latest_attempt_id) {
          navigate(`/learn/quiz/${res.data.latest_attempt_id}/results`);
        }
      } catch {
        // fallback
      }
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 animate-pulse flex items-center justify-between">
        <div className="h-6 bg-slate-200 rounded w-1/3"></div>
        <div className="h-8 bg-slate-200 rounded w-24"></div>
      </div>
    );
  }

  const isCompleted = overview?.status === 'completed' || overview?.submitted_attempts > 0;
  const isInProgress = overview?.status === 'in_progress' || overview?.has_active_attempt;
  const isPending = overview?.status === 'evaluation_pending';
  const attemptsUsed = overview?.submitted_attempts || 0;
  const canAttempt = overview?.can_attempt && attemptsUsed < 5 && !isPending;

  return (
    <>
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-6 shadow-md border border-slate-700/60 overflow-hidden relative">
        {/* Subtle decorative glow */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-brand-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 rounded-xl bg-brand-500/20 text-brand-400 border border-brand-500/30 flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
              <Award className="w-6 h-6 text-brand-400" />
            </div>

            <div>
              <div className="flex items-center space-x-2.5">
                <h3 className="text-base font-bold text-white">
                  Week {weekNumber} Technical Assessment
                </h3>
                {isCompleted && (
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1">
                    <CheckCircle2 className="w-3 h-3 mr-0.5" />
                    <span>Score: {overview.latest_score?.toFixed(1) || '0.0'}%</span>
                  </span>
                )}
                {isPending && (
                  <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Evaluation Pending
                  </span>
                )}
                {isInProgress && (
                  <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 animate-pulse">
                    Attempt in Progress
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
                45 Non-MCQ technical interview questions: Output prediction, debugging, coding, and system scenarios.
              </p>

              <div className="flex items-center space-x-4 mt-2.5 text-xs text-slate-400">
                <span className="flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>75 Minutes</span>
                </span>
                <span>•</span>
                <span>Attempts: {attemptsUsed}/5 Used</span>
                {overview?.latest_score != null && (
                  <>
                    <span>•</span>
                    <span className="text-emerald-400 font-medium">Milestone +1 Added to Week Progress</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 self-end sm:self-center flex-shrink-0">
            {attemptsUsed > 0 && (
              <button
                onClick={() => setHistoryOpen(true)}
                className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors flex items-center space-x-1"
                title="View past attempts"
              >
                <History className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Past Attempts</span>
              </button>
            )}

            {isCompleted && (
              <button
                onClick={handleViewResults}
                className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-colors"
              >
                View Results
              </button>
            )}

            {isInProgress ? (
              <button
                onClick={handleResumeAttempt}
                className="px-4 py-2 rounded-lg bg-brand-500 hover:bg-brand-400 text-white text-xs font-bold shadow-md transition-all flex items-center space-x-1.5"
              >
                <span>Resume Quiz</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : canAttempt ? (
              <button
                onClick={() => setInstructionsOpen(true)}
                className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-md transition-all flex items-center space-x-1.5"
              >
                <span>{attemptsUsed > 0 ? 'Retake Quiz' : 'Start Quiz'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : attemptsUsed >= 5 ? (
              <span className="text-xs text-slate-400 px-3 py-1.5 bg-slate-800/80 rounded-lg border border-slate-700">
                Attempt Limit Reached (5/5)
              </span>
            ) : isPending ? (
              <span className="text-xs text-amber-300 px-3 py-1.5 bg-amber-950/60 rounded-lg border border-amber-800">
                Evaluating Previous Attempt...
              </span>
            ) : null}
          </div>
        </div>

        {error && (
          <div className="mt-3 p-2.5 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Instructions Modal */}
      <QuizInstructionsModal
        isOpen={instructionsOpen}
        onClose={() => setInstructionsOpen(false)}
        weekNumber={weekNumber}
        weekTitle={weekTitle}
        onStart={handleStartAttempt}
        isLoading={starting}
      />

      {/* History Modal */}
      <QuizHistoryModal
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        weekNumber={weekNumber}
      />
    </>
  );
}
