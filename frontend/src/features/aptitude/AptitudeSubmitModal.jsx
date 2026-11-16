import React from 'react';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

export default function AptitudeSubmitModal({
  isOpen,
  onClose,
  onConfirm,
  totalQuestions,
  answeredCount,
  isSubmitting,
}) {
  if (!isOpen) return null;

  const unansweredCount = Math.max(0, totalQuestions - answeredCount);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200">
        <div className="p-6">
          <div className="w-12 h-12 bg-brand-50 text-brand-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-6 h-6" />
          </div>

          <h3 className="text-lg font-bold text-slate-900 text-center mb-2">
            Submit Aptitude Test?
          </h3>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4 text-center">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-slate-500 uppercase tracking-wider block">Answered</span>
                <span className="text-xl font-bold text-emerald-600">{answeredCount}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 uppercase tracking-wider block">Unanswered</span>
                <span className="text-xl font-bold text-amber-600">{unansweredCount}</span>
              </div>
            </div>
          </div>

          {unansweredCount > 0 && (
            <div className="flex items-start space-x-2 text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs mb-4">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                You have <strong>{unansweredCount}</strong> unanswered questions. Unanswered questions will be scored as 0 marks.
              </span>
            </div>
          )}

          <p className="text-xs text-slate-500 text-center mb-6">
            Once submitted, your answers will be permanently evaluated and this will count towards your daily practice allowance.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              Continue Test
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
            >
              {isSubmitting ? 'Evaluating...' : 'Confirm Submission'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
