import React from 'react';
import { AlertCircle } from 'lucide-react';

export default function AptitudeLeaveModal({ isOpen, onClose, onConfirm, isAbandoning }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200">
        <div className="p-6">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>

          <h3 className="text-lg font-bold text-slate-900 text-center mb-2">
            Leave Aptitude Test?
          </h3>

          <p className="text-sm text-slate-600 text-center mb-6 leading-relaxed">
            Leaving now will <strong>abandon this test session</strong> and discard your in-progress answers.
            Your daily attempt allowance will <strong>not</strong> be consumed, and no score will be recorded.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isAbandoning}
              className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              Resume Test
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isAbandoning}
              className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
            >
              {isAbandoning ? 'Abandoning...' : 'Yes, Abandon Test'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
