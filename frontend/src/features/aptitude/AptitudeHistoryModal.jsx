import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { History, X, CheckCircle2, Clock, Eye } from 'lucide-react';
import aptitudeService from '../../services/aptitudeService';

export default function AptitudeHistoryModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setError(null);
    aptitudeService
      .getAptitudeHistory()
      .then((res) => {
        setSessions(res.data?.data?.sessions || []);
      })
      .catch((err) => {
        setError(err?.response?.data?.detail || 'Failed to load test history.');
      })
      .finally(() => setLoading(false));
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-brand-600">
            <History className="w-5 h-5" />
            <h3 className="font-semibold text-slate-900">Aptitude Practice History</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-sm">Loading past sessions...</div>
          ) : error ? (
            <div className="p-4 bg-rose-50 text-rose-700 text-sm rounded-lg">{error}</div>
          ) : sessions.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              No aptitude test sessions completed yet. Start your first session today!
            </div>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
              {sessions.map((sess, idx) => {
                const isSubmitted = sess.status === 'submitted';
                const dateStr = new Date(sess.created_at).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={sess.id}
                    className="p-4 flex items-center justify-between hover:bg-slate-50 transition"
                  >
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm font-semibold text-slate-900">
                          Session #{sessions.length - idx}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            isSubmitted
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {isSubmitted ? 'Completed' : 'Abandoned'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 flex items-center space-x-3">
                        <span className="flex items-center">
                          <Clock className="w-3.5 h-3.5 mr-1" />
                          {dateStr}
                        </span>
                        {isSubmitted && (
                          <span>
                            Score: <strong>{sess.percentage}%</strong> ({sess.correct_count} / {sess.total_questions})
                          </span>
                        )}
                      </div>
                    </div>

                    {isSubmitted && (
                      <button
                        onClick={() => {
                          onClose();
                          navigate(`/practice/aptitude/${sess.id}/results`);
                        }}
                        className="inline-flex items-center px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-white hover:text-brand-600 shadow-sm transition"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1.5" />
                        Review
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
