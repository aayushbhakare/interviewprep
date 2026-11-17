import React, { useState, useEffect } from 'react';
import {
  Shield,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  Clock,
  Layers,
  HelpCircle,
  User,
  Building2,
  Calendar,
  X,
  Loader2,
  FileText,
  AlertOctagon,
} from 'lucide-react';
import { experienceService } from '../../services/experienceService';

export default function AdminExperiencesPage() {
  const [activeTab, setActiveTab] = useState('queue'); // 'queue' | 'reports'

  // Queue state
  const [queueItems, setQueueItems] = useState([]);
  const [queueStatus, setQueueStatus] = useState('pending_review');
  const [queueSearch, setQueueSearch] = useState('');
  const [hasReportsOnly, setHasReportsOnly] = useState(false);
  const [queueLoading, setQueueLoading] = useState(true);

  // Review modal state
  const [selectedExpId, setSelectedExpId] = useState(null);
  const [detailExp, setDetailExp] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionReason, setActionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Reports state
  const [reports, setReports] = useState([]);
  const [reportStatus, setReportStatus] = useState('pending');
  const [reportsLoading, setReportsLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportNotes, setReportNotes] = useState('');

  // Fetch Queue
  const fetchQueue = async () => {
    setQueueLoading(true);
    try {
      const params = {
        status: queueStatus,
      };
      if (queueSearch.trim()) params.search = queueSearch.trim();
      if (hasReportsOnly) params.has_reports = true;

      const res = await experienceService.getAdminModerationQueue(params);
      if (res?.results) {
        setQueueItems(res.results);
      } else {
        setQueueItems([]);
      }
    } catch {
      setQueueItems([]);
    } finally {
      setQueueLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'queue') {
      fetchQueue();
    } else {
      fetchReports();
    }
  }, [activeTab, queueStatus, queueSearch, hasReportsOnly, reportStatus]);

  // Fetch Reports
  const fetchReports = async () => {
    setReportsLoading(true);
    try {
      const res = await experienceService.getAdminReports(reportStatus);
      if (res?.results) {
        setReports(res.results);
      } else {
        setReports([]);
      }
    } catch {
      setReports([]);
    } finally {
      setReportsLoading(false);
    }
  };

  // Open Review Dialog
  const handleOpenReview = async (expId) => {
    setSelectedExpId(expId);
    setDetailLoading(true);
    setActionReason('');
    try {
      const res = await experienceService.getAdminExperienceDetail(expId);
      if (res?.data) {
        setDetailExp(res.data);
      }
    } catch {
      alert('Failed to load experience detail.');
      setSelectedExpId(null);
    } finally {
      setDetailLoading(false);
    }
  };

  // Execute Moderation Action
  const handleExecuteAction = async (action) => {
    if ((action === 'reject' || action === 'suspend') && !actionReason.trim()) {
      alert(`Please provide a reason to ${action} this experience.`);
      return;
    }

    setActionLoading(true);
    try {
      await experienceService.adminModerationAction(
        selectedExpId,
        action,
        actionReason.trim()
      );
      alert(`Experience successfully ${action}ed.`);
      setSelectedExpId(null);
      setDetailExp(null);
      fetchQueue();
    } catch (err) {
      alert(err?.response?.data?.message || err?.response?.data?.detail || 'Action failed.');
    } finally {
      setActionLoading(false);
    }
  };

  // Resolve Report
  const handleResolveReport = async (reportId, resolution) => {
    try {
      await experienceService.resolveAdminReport(reportId, resolution, reportNotes);
      alert(`Report marked as resolved (${resolution}).`);
      setSelectedReport(null);
      setReportNotes('');
      fetchReports();
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to resolve report.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Interview Experience Moderation Console
            </h1>
            <p className="text-xs sm:text-sm text-slate-600">
              Review student submissions, investigate automated policy flags, and resolve community reports.
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-xl shrink-0">
          <button
            onClick={() => setActiveTab('queue')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'queue'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Moderation Queue
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'reports'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Community Reports
          </button>
        </div>
      </div>

      {/* Tab 1: Moderation Queue */}
      {activeTab === 'queue' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {['pending_review', 'published', 'rejected', 'all'].map((st) => (
                <button
                  key={st}
                  onClick={() => setQueueStatus(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    queueStatus === st
                      ? 'bg-amber-100 text-amber-900 border border-amber-200'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {st.replace(/_/g, ' ').toUpperCase()}
                </button>
              ))}

              <label className="flex items-center space-x-2 ml-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasReportsOnly}
                  onChange={(e) => setHasReportsOnly(e.target.checked)}
                  className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                />
                <span>With Reports Only</span>
              </label>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={queueSearch}
                onChange={(e) => setQueueSearch(e.target.value)}
                placeholder="Search company, role, author..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border-slate-300 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
          </div>

          {/* Submissions Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            {queueLoading ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
              </div>
            ) : queueItems.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-sm">
                No submissions matching this filter in the moderation queue.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Company & Role</th>
                      <th className="py-3 px-4">Candidate / Author</th>
                      <th className="py-3 px-4">Tiers & Outcome</th>
                      <th className="py-3 px-4">Status & Reports</th>
                      <th className="py-3 px-4">Risk Level</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {queueItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-900 text-sm">{item.company_name}</p>
                          <p className="text-slate-500 text-xs">{item.role}</p>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-medium text-slate-900">{item.author_name}</p>
                          <p className="text-slate-500 text-[11px]">{item.author_email}</p>
                          {item.is_anonymous && (
                            <span className="inline-block mt-0.5 text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200">
                              Anonymous Publicly
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-semibold text-slate-800">{item.salary_range || 'N/A'}</p>
                          <p className="text-slate-500 text-[11px] capitalize">{item.overall_outcome}</p>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                              item.status === 'published'
                                ? 'bg-emerald-100 text-emerald-800'
                                : item.status === 'pending_review'
                                ? 'bg-amber-100 text-amber-800'
                                : item.status === 'rejected'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {item.status.replace(/_/g, ' ')}
                          </span>
                          {item.reports_count > 0 && (
                            <p className="text-rose-600 font-bold text-[11px] mt-1 flex items-center">
                              <AlertTriangle className="w-3 h-3 mr-0.5" />
                              {item.reports_count} {item.reports_count === 1 ? 'Report' : 'Reports'}
                            </p>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                              item.latest_moderation_result?.risk_level === 'high'
                                ? 'bg-rose-100 text-rose-800'
                                : item.latest_moderation_result?.risk_level === 'medium'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-50 text-emerald-800'
                            }`}
                          >
                            {item.latest_moderation_result?.risk_level || 'low'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleOpenReview(item.id)}
                            className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            Review
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Community Reports */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center space-x-2">
            {['pending', 'resolved', 'dismissed', 'all'].map((st) => (
              <button
                key={st}
                onClick={() => setReportStatus(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  reportStatus === st
                    ? 'bg-rose-100 text-rose-900 border border-rose-200'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {st.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            {reportsLoading ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="w-8 h-8 text-rose-600 animate-spin" />
              </div>
            ) : reports.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-sm">
                No reports matching this filter.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Experience</th>
                      <th className="py-3 px-4">Reporter</th>
                      <th className="py-3 px-4">Reason & Notes</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Resolve</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {reports.map((rep) => (
                      <tr key={rep.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {rep.company_name} - {rep.role}
                        </td>
                        <td className="py-3 px-4 text-slate-600">{rep.reporter_email}</td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-rose-700 uppercase text-[10px]">
                            {rep.reason}:{' '}
                          </span>
                          <span className="text-slate-600">{rep.explanation || 'No details provided.'}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 capitalize">
                            {rep.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => handleResolveReport(rep.id, 'dismiss')}
                              className="px-2 py-1 rounded text-[11px] font-medium text-slate-600 bg-slate-100 hover:bg-slate-200"
                            >
                              Dismiss
                            </button>
                            <button
                              onClick={() => handleResolveReport(rep.id, 'resolve_suspend')}
                              className="px-2 py-1 rounded text-[11px] font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200"
                            >
                              Suspend Experience
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Review Dialog Modal */}
      {selectedExpId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Experience Moderation Review</h3>
                <p className="text-xs text-slate-500">ID: {selectedExpId}</p>
              </div>
              <button
                onClick={() => setSelectedExpId(null)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {detailLoading || !detailExp ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Author & Status Strip */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block font-semibold">Author Real Identity</span>
                    <span className="font-bold text-slate-900">
                      {detailExp.author_real_name || 'N/A'} ({detailExp.author_real_email})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Public Masking</span>
                    <span className="font-bold text-purple-700">
                      {detailExp.is_anonymous ? 'Anonymous' : 'Public Name'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Company & Role</span>
                    <span className="font-bold text-slate-900">
                      {detailExp.company_name} — {detailExp.role}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Current Status</span>
                    <span className="font-bold capitalize text-slate-900">{detailExp.status}</span>
                  </div>
                </div>

                {/* Automated Moderation Results */}
                {detailExp.versions_history?.[0]?.moderation_result && (
                  <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4 space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center">
                      <Shield className="w-4 h-4 mr-1.5 text-amber-700" />
                      Automated Policy Scanner Findings
                    </h4>
                    <p className="text-xs text-amber-800">
                      Risk Level:{' '}
                      <span className="font-bold uppercase">
                        {detailExp.versions_history[0].moderation_result.risk_level}
                      </span>
                    </p>
                    {detailExp.versions_history[0].moderation_result.issues?.length > 0 && (
                      <ul className="list-disc list-inside text-xs text-amber-900 space-y-0.5">
                        {detailExp.versions_history[0].moderation_result.issues.map((iss, i) => (
                          <li key={i}>{iss}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {/* Stages & Questions Breakdown */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-900">
                    Recruitment Stages ({detailExp.stages?.length || 0})
                  </h4>
                  {(detailExp.stages || []).map((st, i) => (
                    <div
                      key={st.id || i}
                      className="border border-slate-200 rounded-xl p-4 bg-white space-y-3"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs">
                        <span className="font-bold text-slate-900">
                          Stage {st.order || i + 1}: {st.custom_stage_name || st.stage_type}
                        </span>
                        <span className="text-slate-500">
                          Mode: {st.interview_mode || 'N/A'} • Result: {st.result || 'N/A'}
                        </span>
                      </div>
                      {st.description && <p className="text-xs text-slate-600">{st.description}</p>}

                      {st.questions?.length > 0 && (
                        <div className="space-y-2 pt-2">
                          {st.questions.map((q, qi) => (
                            <div key={q.id || qi} className="bg-slate-50 p-2.5 rounded text-xs space-y-1">
                              <p className="font-semibold text-slate-900">Q: {q.question_text}</p>
                              {q.follow_up_text && (
                                <p className="text-purple-700">Follow-up: {q.follow_up_text}</p>
                              )}
                              {q.student_response && (
                                <p className="text-slate-600">Response: {q.student_response}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Moderation Actions Footer */}
                <div className="pt-6 border-t border-slate-200 space-y-3">
                  <label className="block text-xs font-semibold text-slate-700">
                    Moderator Decision Notes / Reason (Required for rejection or suspension)
                  </label>
                  <textarea
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                    rows={2}
                    placeholder="Provide specific justification..."
                    className="w-full text-xs rounded-lg border-slate-300 focus:ring-amber-500 focus:border-amber-500"
                  />

                  <div className="flex items-center justify-end space-x-3 pt-2">
                    <button
                      type="button"
                      onClick={() => handleExecuteAction('reject')}
                      disabled={actionLoading}
                      className="inline-flex items-center px-4 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1" />
                      Reject Submission
                    </button>

                    {detailExp.status === 'published' ? (
                      <button
                        type="button"
                        onClick={() => handleExecuteAction('suspend')}
                        disabled={actionLoading}
                        className="inline-flex items-center px-4 py-2 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <AlertOctagon className="w-3.5 h-3.5 mr-1" />
                        Suspend / Hide
                      </button>
                    ) : detailExp.is_hidden ? (
                      <button
                        type="button"
                        onClick={() => handleExecuteAction('restore')}
                        disabled={actionLoading}
                        className="inline-flex items-center px-4 py-2 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <CheckCircle className="w-3.5 h-3.5 mr-1" />
                        Restore to Discovery
                      </button>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => handleExecuteAction('approve')}
                      disabled={actionLoading}
                      className="inline-flex items-center px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                    >
                      <CheckCircle className="w-3.5 h-3.5 mr-1" />
                      Approve & Publish
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
