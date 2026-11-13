import React from 'react';
import { Award, Clock, AlertTriangle, CheckCircle2, X, Play } from 'lucide-react';

export default function QuizInstructionsModal({
  isOpen,
  onClose,
  weekNumber,
  weekTitle,
  onStart,
  isLoading,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center">
              <Award className="w-5 h-5 text-brand-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                Week {weekNumber} Technical Assessment
              </h2>
              <p className="text-xs text-slate-400">{weekTitle || 'Weekly Quiz'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Instructions Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Key Constraints Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
              <span className="block text-2xl font-black text-brand-600">45</span>
              <span className="text-xs font-semibold text-slate-600">Total Questions</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center space-x-1 text-slate-800">
                <Clock className="w-4 h-4 text-brand-600" />
                <span className="text-2xl font-black text-slate-900">75</span>
                <span className="text-xs font-semibold text-slate-500">min</span>
              </div>
              <span className="text-xs font-semibold text-slate-600">Timer Enforced</span>
            </div>
            <div className="col-span-2 sm:col-span-1 bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
              <span className="block text-sm font-bold text-slate-900">No MCQs</span>
              <span className="text-xs text-slate-500">Real Code & Reasoning</span>
            </div>
          </div>

          {/* Question Breakdown */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Fixed Category Distribution
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg border border-slate-200 bg-white flex justify-between items-center">
                <span className="font-medium text-slate-700">Code Output Prediction</span>
                <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">10 questions</span>
              </div>
              <div className="p-2.5 rounded-lg border border-slate-200 bg-white flex justify-between items-center">
                <span className="font-medium text-slate-700">Find Error / Debugging</span>
                <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">10 questions</span>
              </div>
              <div className="p-2.5 rounded-lg border border-slate-200 bg-white flex justify-between items-center">
                <span className="font-medium text-slate-700">Coding Problems</span>
                <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">10 questions</span>
              </div>
              <div className="p-2.5 rounded-lg border border-slate-200 bg-white flex justify-between items-center">
                <span className="font-medium text-slate-700">Scenario-Based Architecture</span>
                <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">10 questions</span>
              </div>
              <div className="sm:col-span-2 p-2.5 rounded-lg border border-slate-200 bg-white flex justify-between items-center">
                <span className="font-medium text-slate-700">Conceptual / Short Answer</span>
                <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">5 questions</span>
              </div>
            </div>
          </div>

          {/* Rules and Scoring */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 space-y-2 text-xs text-amber-900">
            <div className="flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <span>
                <strong>Binary Grading:</strong> Every question is graded as either Correct or Incorrect. No partial credit. Final score = (Correct / 45) × 100.
              </span>
            </div>
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <span>
                <strong>Unanswered Questions:</strong> Any question left unanswered upon final submission or timer expiration is automatically marked Incorrect.
              </span>
            </div>
            <div className="flex items-start space-x-2">
              <Clock className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <span>
                <strong>Timer & Auto-Submit:</strong> You have 75 minutes. Warnings appear at 10 and 5 minutes remaining. When time reaches 00:00, your answers are submitted automatically.
              </span>
            </div>
            <div className="flex items-start space-x-2">
              <Award className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <span>
                <strong>Retake Limit:</strong> Maximum of 5 submitted attempts allowed per weekly quiz on your active roadmap. Abandoned attempts do not consume an allowance.
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onStart}
            disabled={isLoading}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold shadow-sm transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <span>Preparing Quiz...</span>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Start Quiz Attempt</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
