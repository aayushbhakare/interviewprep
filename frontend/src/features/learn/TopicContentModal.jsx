import React, { useEffect, useState } from 'react';
import { X, CheckCircle, Clock, BookOpen, AlertCircle, Loader2, Sparkles, Terminal } from 'lucide-react';
import api from '../../services/api';

export default function TopicContentModal({ topic, isOpen, onClose, onUpdateStatus }) {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen || !topic) return;

    setLoading(true);
    setError(null);
    api.get(`/learning/topics/${topic.id}/content/`)
      .then((res) => {
        setContent(res.data?.data || null);
      })
      .catch((err) => {
        setError(err.response?.data?.detail || 'Unable to load topic content.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isOpen, topic]);

  if (!isOpen || !topic) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-200 flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-brand-600 uppercase tracking-wider mb-1">
              <BookOpen className="w-4 h-4" />
              <span>{content?.technology || 'Technical'} • Estimated {topic.estimated_minutes} mins</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">{topic.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {loading && (
            <div className="py-16 text-center flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-brand-600 animate-spin mb-3" />
              <p className="text-sm text-slate-500">Retrieving technical learning content...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center text-red-700 text-sm">
              <AlertCircle className="w-5 h-5 mr-2 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {content && !loading && (
            <>
              {/* Learning Objectives */}
              {content.learning_objectives?.length > 0 && (
                <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900 mb-2 flex items-center">
                    <Sparkles className="w-4 h-4 mr-1 text-brand-600" />
                    Learning Objectives
                  </h3>
                  <ul className="space-y-1.5 text-xs sm:text-sm text-blue-950">
                    {content.learning_objectives.map((obj, i) => (
                      <li key={i} className="flex items-start">
                        <span className="text-brand-600 mr-2 font-bold">•</span>
                        <span>{obj}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Concept Explanation */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">
                  Concept Overview
                </h3>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                  {content.concept_explanation}
                </p>
              </div>

              {/* How It Works Internally */}
              {content.how_it_works && (
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">
                    Internal Runtime Mechanics
                  </h3>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-700 leading-relaxed">
                    {content.how_it_works}
                  </div>
                </div>
              )}

              {/* Code Examples */}
              {content.examples?.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center">
                    <Terminal className="w-4 h-4 mr-1 text-slate-500" />
                    Practical Code Example
                  </h3>
                  {content.examples.map((ex, i) => (
                    <div key={i} className="bg-slate-900 text-slate-100 rounded-xl p-4 text-xs font-mono overflow-x-auto shadow-inner">
                      <p className="text-slate-400 mb-2 text-[11px]">// {ex.description}</p>
                      <pre><code>{ex.code}</code></pre>
                    </div>
                  ))}
                </div>
              )}

              {/* Practical Implementation */}
              {content.practical_implementation && (
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">
                    Production Implementation Nuances
                  </h3>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {content.practical_implementation}
                  </p>
                </div>
              )}

              {/* Interview Perspective */}
              {content.interview_perspective && (
                <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-purple-900 mb-1.5">
                    Recruitment Interview Perspective
                  </h3>
                  <p className="text-xs sm:text-sm text-purple-950 leading-relaxed">
                    {content.interview_perspective}
                  </p>
                </div>
              )}

              {/* Key Takeaways */}
              {content.key_takeaways?.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">
                    Key Takeaways
                  </h3>
                  <ul className="space-y-1 text-sm text-slate-600">
                    {content.key_takeaways.map((item, i) => (
                      <li key={i} className="flex items-start">
                        <CheckCircle className="w-4 h-4 text-emerald-500 mr-2 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Actions Footer */}
        <div className="p-4 sm:p-6 border-t border-slate-200 bg-slate-50 rounded-b-2xl flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => {
                onUpdateStatus(topic.id, 'completed');
                onClose();
              }}
              className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 shadow-sm"
            >
              <CheckCircle className="w-4 h-4 mr-1.5" />
              Mark Completed
            </button>
            <button
              type="button"
              onClick={() => {
                onUpdateStatus(topic.id, 'skipped');
                onClose();
              }}
              className="inline-flex items-center px-4 py-2 border border-amber-300 bg-amber-50 text-amber-800 rounded-lg text-sm font-medium hover:bg-amber-100"
            >
              <Clock className="w-4 h-4 mr-1.5 text-amber-600" />
              Skip (Not Verified)
            </button>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
