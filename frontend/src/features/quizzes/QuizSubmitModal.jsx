import React from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export default function QuizSubmitModal({
  isOpen,
  onClose,
  onConfirmSubmit,
  answeredCount,
  totalQuestions = 45,
  isSubmitting,
}) {
  if (!isOpen) return null;

  const unansweredCount = Math.max(0, totalQuestions - answeredCount);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-brand-100 text-brand-600 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-900">Submit Weekly Assessment?</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Are you sure you want to finalize your quiz submission?
            </p>
          </div>

          {/* Answered / Unanswered stats */}
          <div className="grid grid-cols-2 gap-3 text-left">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
              <span className="block text-xl font-black text-emerald-700">{answeredCount}</span>
              <span className="text-xs font-semibold text-emerald-800">Answered</span>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <span className="block text-xl font-black text-amber-700">{unansweredCount}</span>
              <span className="text-xs font-semibold text-amber-800">Unanswered</span>
            </div>
          </div>

          {unansweredCount > 0 && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-left flex items-start space-x-2 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 flex-shrink-0" />
              <span>
                <strong>Warning:</strong> {unansweredCount} unanswered questions will be marked <strong>Incorrect</strong> with 0 credit.
              </span>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            Review Answers
          </button>
          <button
            onClick={onConfirmSubmit}
            disabled={isSubmitting}
            className="px-5 py-2 text-sm font-semibold rounded-lg bg-brand-600 hover:bg-brand-700 text-white shadow-sm transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Evaluating...' : 'Confirm Submission'}
          </button>
        </div>
      </div>
    </div>
  );
}
