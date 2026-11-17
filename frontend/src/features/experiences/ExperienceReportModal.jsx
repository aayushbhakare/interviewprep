import React, { useState } from 'react';
import { AlertTriangle, X, CheckCircle, Loader2 } from 'lucide-react';
import { experienceService } from '../../services/experienceService';

const REPORT_REASONS = [
  { value: 'fake', label: 'Fake or misleading recruitment story' },
  { value: 'spam', label: 'Spam, promotional links, or referrals' },
  { value: 'inappropriate', label: 'Inappropriate or defamatory language' },
  { value: 'pii', label: 'Personal information exposure (phone, email, credentials)' },
  { value: 'duplicate', label: 'Duplicate submission' },
  { value: 'incorrect', label: 'Incorrect or harmful information' },
  { value: 'other', label: 'Other concern' },
];

export default function ExperienceReportModal({ isOpen, onClose, experienceId, onReportSubmitted }) {
  const [reason, setReason] = useState('fake');
  const [explanation, setExplanation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await experienceService.reportExperience(experienceId, reason, explanation);
      setSuccess(true);
      setTimeout(() => {
        if (onReportSubmitted) onReportSubmitted();
        onClose();
        setSuccess(false);
        setExplanation('');
      }, 1500);
    } catch (err) {
      setError(err?.response?.data?.message || err?.response?.data?.detail || 'Failed to submit report.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-2 text-rose-600">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <h3 className="text-lg font-bold text-slate-900">Report Interview Experience</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="py-8 text-center">
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h4 className="text-lg font-bold text-slate-900">Report Submitted</h4>
            <p className="text-sm text-slate-600 mt-1">
              Thank you for keeping our peer community trustworthy. Our moderation team will investigate.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {error && (
              <div className="p-3 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                Reason for Reporting
              </label>
              <div className="space-y-2">
                {REPORT_REASONS.map((r) => (
                  <label
                    key={r.value}
                    className={`flex items-start p-2.5 rounded-lg border cursor-pointer transition-colors ${
                      reason === r.value
                        ? 'border-rose-400 bg-rose-50/50 text-slate-900'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reportReason"
                      value={r.value}
                      checked={reason === r.value}
                      onChange={(e) => setReason(e.target.value)}
                      className="mt-0.5 text-rose-600 focus:ring-rose-500"
                    />
                    <span className="ml-2.5 text-sm font-medium">{r.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Additional Explanation (Optional)
              </label>
              <textarea
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                rows={3}
                placeholder="Provide specific context or references that can assist our review..."
                className="w-full text-sm rounded-lg border-slate-300 shadow-sm focus:border-rose-500 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-sm disabled:opacity-50"
              >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Submit Report
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
