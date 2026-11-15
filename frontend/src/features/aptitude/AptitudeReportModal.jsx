import React, { useState } from 'react';
import { AlertTriangle, X, Check } from 'lucide-react';
import aptitudeService from '../../services/aptitudeService';

export default function AptitudeReportModal({ isOpen, onClose, questionId, questionText }) {
  const [reason, setReason] = useState('incorrect_answer');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await aptitudeService.reportQuestion(questionId, reason, description);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setDescription('');
        onClose();
      }, 1500);
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to submit report.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-amber-600">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="font-semibold text-slate-900">Report Question Issue</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <Check className="w-6 h-6" />
            </div>
            <h4 className="text-base font-semibold text-slate-900">Thank You</h4>
            <p className="text-sm text-slate-600 mt-1">Your report has been sent to the review queue.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {questionText && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-700 line-clamp-2">
                {questionText}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Issue Category
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="incorrect_answer">Incorrect Answer / Mathematical Error</option>
                <option value="ambiguous_options">Ambiguous or Duplicate Options</option>
                <option value="typo_grammar">Typo, Grammar, or Phrasing Issue</option>
                <option value="other">Other Technical Discrepancy</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Details & Explanation
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Explain the error or correct calculation..."
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
              />
            </div>

            {error && <div className="text-xs text-rose-600">{error}</div>}

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-brand-600 text-white text-xs font-medium rounded-lg hover:bg-brand-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
