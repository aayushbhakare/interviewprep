import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function QuizLeaveModal({
  isOpen,
  onClose,
  onConfirmAbandon,
  isAbandoning,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-900">Abandon Quiz Attempt?</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              If you leave now, this attempt will be <strong>abandoned</strong> and all draft answers will be discarded.
            </p>
            <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 mt-3">
              Abandoned attempts do <strong>not</strong> consume your 5-attempt limit and do not affect your score.
            </p>
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            Stay in Quiz
          </button>
          <button
            onClick={onConfirmAbandon}
            disabled={isAbandoning}
            className="px-4 py-2 text-sm font-semibold rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-colors disabled:opacity-50"
          >
            {isAbandoning ? 'Abandoning...' : 'Yes, Abandon Quiz'}
          </button>
        </div>
      </div>
    </div>
  );
}
