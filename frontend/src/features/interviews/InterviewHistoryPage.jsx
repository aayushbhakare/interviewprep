import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  History,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
  ChevronRight,
  Filter,
  Eye,
  X,
  Sparkles,
} from 'lucide-react';
import { interviewService } from '../../services/interviewService';

export default function InterviewHistoryPage() {
  const [history, setHistory] = useState([]);
  const [filterType, setFilterType] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadHistory(filterType);
  }, [filterType]);

  const loadHistory = async (type = '') => {
    setLoading(true);
    try {
      const res = await interviewService.getHistory(type);
      setHistory(res.data || []);
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to load interview history.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetail = async (sessionId) => {
    setLoadingDetail(true);
    try {
      const res = await interviewService.getHistoryDetail(sessionId);
      setSelectedDetail(res.data);
    } catch (err) {
      console.warn('Failed to fetch detail:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <Link
            to="/practice"
            className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 mb-2 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Practice Hub
          </Link>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <History className="w-6 h-6 text-indigo-600" />
            Interview Practice History
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Historical simulation sessions, recruitment decisions, and feedback.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
          {['', 'technical', 'hr', 'mixed'].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-lg font-bold capitalize transition ${
                filterType === t
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {t || 'All Tracks'}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center text-slate-400 text-xs">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Loading historical simulations...
        </div>
      ) : history.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
          <History className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">No Past Interviews Recorded</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto mb-5 leading-relaxed">
            You haven't completed any voice interview practice sessions yet. Start a session to benchmark your readiness.
          </p>
          <Link
            to="/practice/interviews/setup"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
          >
            Start an Interview Simulation
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100">
            {history.map((item) => {
              const isPass = item.final_result === 'pass';
              const isFail = item.final_result === 'fail';
              const isAbandoned = item.status === 'abandoned';

              return (
                <div
                  key={item.id}
                  className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition"
                >
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white ${
                        isPass
                          ? 'bg-emerald-600'
                          : isFail
                          ? 'bg-rose-600'
                          : 'bg-slate-400'
                      }`}
                    >
                      {isPass ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : isFail ? (
                        <XCircle className="w-5 h-5" />
                      ) : (
                        <Clock className="w-5 h-5" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-900 capitalize">
                          {item.interview_type} Interview
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            isPass
                              ? 'bg-emerald-100 text-emerald-800'
                              : isFail
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {isAbandoned ? 'Abandoned' : item.final_result}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {item.role} • {item.salary_range} • {item.experience_level}
                      </p>
                      <span className="text-[11px] text-slate-400 mt-1 block font-mono">
                        {new Date(item.started_at).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => handleOpenDetail(item.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Review Details</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 capitalize">
                  {selectedDetail.interview_type} Session Details
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedDetail.role} • {selectedDetail.salary_range}
                </p>
              </div>
              <button
                onClick={() => setSelectedDetail(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-semibold text-slate-700">Final Verdict:</span>
                <span
                  className={`px-3 py-0.5 rounded-full font-bold uppercase text-[11px] ${
                    selectedDetail.final_result === 'pass'
                      ? 'bg-emerald-100 text-emerald-800'
                      : selectedDetail.final_result === 'fail'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {selectedDetail.final_result}
                </span>
              </div>

              {selectedDetail.overall_feedback?.summary && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl leading-relaxed">
                  <span className="font-bold text-slate-900 block mb-1">Executive Summary:</span>
                  {selectedDetail.overall_feedback.summary}
                </div>
              )}

              {selectedDetail.overall_feedback?.improvement_suggestions && (
                <div className="p-4 bg-indigo-50/50 border border-indigo-200 rounded-xl leading-relaxed">
                  <span className="font-bold text-indigo-950 block mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Key Recommendations:
                  </span>
                  <ul className="list-disc pl-4 space-y-1 text-slate-700 text-[11.5px]">
                    {selectedDetail.overall_feedback.improvement_suggestions.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedDetail(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
