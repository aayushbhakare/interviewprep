import React, { useEffect, useState } from 'react';
import { History, X, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import quizService from '../../services/quizService';

export default function QuizHistoryModal({
  isOpen,
  onClose,
  weekNumber,
}) {
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && weekNumber) {
      setLoading(true);
      quizService
        .getWeeklyQuizHistory(weekNumber)
        .then((res) => setHistory(res.data))
        .catch(() => setHistory({ attempts: [], submitted_count: 0, remaining_attempts: 5 }))
        .finally(() => setLoading(false));
    }
  }, [isOpen, weekNumber]);

  if (!isOpen) return null;

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

  const formatDuration = (seconds) => {
    if (!seconds) return '—';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-brand-600 flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Week {weekNumber} Attempt History
              </h3>
              <p className="text-xs text-slate-500">
                {history ? `${history.submitted_count}/5 Submitted Attempts used` : 'Loading...'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="py-12 text-center text-sm text-slate-500">Loading attempt history...</div>
          ) : !history?.attempts || history.attempts.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              No attempts recorded for Week {weekNumber} yet.
            </div>
          ) : (
            <div className="space-y-3">
              {history.attempts.map((att) => {
                const isEvaluated = att.status === 'evaluated';
                const isPending = att.status === 'evaluation_pending';
                const isAbandoned = att.status === 'abandoned';

                return (
                  <div
                    key={att.id}
                    className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-slate-900">
                          Attempt #{att.attempt_number}
                        </span>
                        {isEvaluated && (
                          <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800">
                            {att.score?.toFixed(1)}% ({att.correct_count}/{att.total_questions})
                          </span>
                        )}
                        {isPending && (
                          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800">
                            Evaluation Pending
                          </span>
                        )}
                        {isAbandoned && (
                          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-600">
                            Abandoned (Allowance Intact)
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 mt-1.5 text-xs text-slate-500">
                        <span>Started: {formatDate(att.started_at)}</span>
                        {att.time_taken_seconds > 0 && (
                          <span className="flex items-center space-x-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{formatDuration(att.time_taken_seconds)}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      {isEvaluated && (
                        <button
                          onClick={() => {
                            onClose();
                            navigate(`/learn/quiz/${att.id}/results`);
                          }}
                          className="px-3 py-1.5 rounded-lg border border-brand-200 text-brand-600 hover:bg-brand-50 text-xs font-semibold transition-colors"
                        >
                          Review Answers
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200/60 rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
