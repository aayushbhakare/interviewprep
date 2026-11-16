import React, { useState, useEffect } from 'react';
import {
  Database,
  Search,
  Filter,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Edit3,
  Flag,
  X,
  Loader2,
  ChevronRight,
  ShieldAlert,
  Settings,
  Clock,
  History,
  Check,
  Slash,
} from 'lucide-react';
import aptitudeService from '../../services/aptitudeService';

export default function AdminAptitudePage() {
  const [activeTab, setActiveTab] = useState('questions'); // 'questions' | 'reports' | 'config'
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ questions: [], stats: { total_questions: 0, approved: 0, suspended: 0, inactive: 0 } });

  // Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [status, setStatus] = useState('');

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [newVersionModalOpen, setNewVersionModalOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);

  // Reports state
  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);

  // Config state
  const [config, setConfig] = useState(null);
  const [configLoading, setConfigLoading] = useState(false);
  const [configSaving, setConfigSaving] = useState(false);
  const [configSuccess, setConfigSuccess] = useState(false);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (category) params.category = category;
      if (difficulty) params.difficulty = difficulty;
      if (status) params.status = status;

      const res = await aptitudeService.adminGetQuestions(params);
      setData(res.data?.data || { questions: [], stats: {} });
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    setReportsLoading(true);
    try {
      const res = await aptitudeService.adminGetReports();
      setReports(res.data?.data?.reports || []);
    } catch {
      // Fallback
    } finally {
      setReportsLoading(false);
    }
  };

  const fetchConfig = async () => {
    setConfigLoading(true);
    try {
      const res = await aptitudeService.adminGetConfig();
      setConfig(res.data?.data || null);
    } catch {
      // Fallback
    } finally {
      setConfigLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'questions') {
      fetchQuestions();
    } else if (activeTab === 'reports') {
      fetchReports();
    } else if (activeTab === 'config') {
      fetchConfig();
    }
  }, [activeTab, category, difficulty, status]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchQuestions();
  };

  const handleStatusChange = async (questionId, newStatus) => {
    try {
      await aptitudeService.adminUpdateStatus(questionId, newStatus);
      fetchQuestions();
      if (selectedQuestion?.id === questionId) {
        setSelectedQuestion((prev) => ({ ...prev, status: newStatus }));
      }
    } catch {
      alert('Failed to update question status.');
    }
  };

  const handleResolveReport = async (reportId, action) => {
    const notes = prompt('Enter resolution notes for audit trail:', 'Reviewed by administrator');
    if (notes === null) return;
    try {
      await aptitudeService.adminResolveReport(reportId, action, notes);
      fetchReports();
    } catch {
      alert('Failed to resolve report.');
    }
  };

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    setConfigSaving(true);
    setConfigSuccess(false);
    try {
      await aptitudeService.adminUpdateConfig({
        daily_limit: parseInt(config.daily_limit, 10),
        duration_minutes: parseInt(config.duration_minutes, 10),
        total_questions: parseInt(config.total_questions, 10),
        distribution: config.distribution,
        mixed_qualifying_cutoff: parseFloat(config.mixed_qualifying_cutoff),
      });
      setConfigSuccess(true);
      setTimeout(() => setConfigSuccess(false), 3000);
    } catch {
      alert('Failed to save aptitude configuration.');
    } finally {
      setConfigSaving(false);
    }
  };

  const openDetailModal = async (question) => {
    setSelectedQuestion(question);
    setDetailModalOpen(true);
    try {
      const res = await aptitudeService.adminGetQuestionDetail(question.id);
      setSelectedQuestion(res.data?.data);
    } catch {
      // Keep basic question
    }
  };

  const stats = data.stats || {};

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Database className="w-6 h-6 text-indigo-600" />
              Aptitude Bank & Platform Management
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Curate TCS NQT cognitive pattern MCQs, audit student reports, and tune platform rules.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setAddModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Aptitude MCQ
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Questions</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">{stats.total_questions || 0}</div>
            <p className="text-xs text-slate-400 mt-0.5">Across all 3 cognitive tracks</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Approved Active</span>
            <div className="text-2xl font-bold text-emerald-600 mt-1">{stats.approved || 0}</div>
            <p className="text-xs text-slate-400 mt-0.5">Live in test generation pool</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Suspended</span>
            <div className="text-2xl font-bold text-amber-600 mt-1">{stats.suspended || 0}</div>
            <p className="text-xs text-slate-400 mt-0.5">Flagged for review</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Inactive</span>
            <div className="text-2xl font-bold text-slate-500 mt-1">{stats.inactive || 0}</div>
            <p className="text-xs text-slate-400 mt-0.5">Retired or deprecated</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 space-x-8 text-sm font-semibold">
          <button
            onClick={() => setActiveTab('questions')}
            className={`pb-3 flex items-center gap-2 transition-colors ${
              activeTab === 'questions'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Database className="w-4 h-4" />
            Questions Catalog
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`pb-3 flex items-center gap-2 transition-colors ${
              activeTab === 'reports'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Flag className="w-4 h-4" />
            Student Reports
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={`pb-3 flex items-center gap-2 transition-colors ${
              activeTab === 'config'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Settings className="w-4 h-4" />
            Platform Rules & Config
          </button>
        </div>

        {/* TAB 1: Questions Catalog */}
        {activeTab === 'questions' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
              <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search question text or topic..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </form>

              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 bg-white"
                >
                  <option value="">All Categories</option>
                  <option value="Quantitative Aptitude">Quantitative</option>
                  <option value="Logical Reasoning">Logical</option>
                  <option value="Verbal Ability">Verbal</option>
                </select>

                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 bg-white"
                >
                  <option value="">All Difficulties</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>

                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 bg-white"
                >
                  <option value="">All Statuses</option>
                  <option value="approved">Approved</option>
                  <option value="suspended">Suspended</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            {/* Questions Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              {loading ? (
                <div className="p-12 text-center text-slate-500">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                  Loading questions...
                </div>
              ) : data.questions.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-sm">
                  No aptitude questions found matching your filter criteria.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
                      <tr>
                        <th className="py-3 px-4">Category & Topic</th>
                        <th className="py-3 px-4">Question Preview</th>
                        <th className="py-3 px-4">Difficulty</th>
                        <th className="py-3 px-4">Version</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {data.questions.map((q) => (
                        <tr key={q.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="font-semibold text-slate-900">{q.category}</div>
                            <div className="text-[11px] text-slate-500">{q.topic || 'General'}</div>
                          </td>
                          <td className="py-3 px-4 max-w-md">
                            <p className="line-clamp-2 text-slate-800 leading-snug">
                              {q.question_text}
                            </p>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                q.difficulty === 'hard'
                                  ? 'bg-rose-50 text-rose-700'
                                  : q.difficulty === 'easy'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-amber-50 text-amber-700'
                              }`}
                            >
                              {q.difficulty}
                            </span>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="font-mono text-slate-600">v{q.current_version_number || 1}</span>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                                q.status === 'approved'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : q.status === 'suspended'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {q.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap text-right space-x-2">
                            <button
                              onClick={() => openDetailModal(q)}
                              title="View details and audit log"
                              className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedQuestion(q);
                                setNewVersionModalOpen(true);
                              }}
                              title="Publish new version"
                              className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            {q.status !== 'approved' && (
                              <button
                                onClick={() => handleStatusChange(q.id, 'approved')}
                                title="Approve question"
                                className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                            )}
                            {q.status !== 'suspended' && (
                              <button
                                onClick={() => handleStatusChange(q.id, 'suspended')}
                                title="Suspend question"
                                className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded"
                              >
                                <AlertTriangle className="w-4 h-4" />
                              </button>
                            )}
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

        {/* TAB 2: Student Reports */}
        {activeTab === 'reports' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {reportsLoading ? (
              <div className="p-12 text-center text-slate-500">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                Loading reports...
              </div>
            ) : reports.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-sm">
                No student reports logged. All questions are in good standing!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Reported At</th>
                      <th className="py-3 px-4">Student</th>
                      <th className="py-3 px-4">Reason</th>
                      <th className="py-3 px-4">Description</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reports.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 whitespace-nowrap text-slate-500">
                          {new Date(r.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-900">
                          {r.reported_by_username || 'Student'}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                            {r.reason}
                          </span>
                        </td>
                        <td className="py-3 px-4 max-w-sm">
                          <p className="text-slate-800 line-clamp-2">{r.description || 'No description provided.'}</p>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              r.status === 'resolved'
                                ? 'bg-emerald-50 text-emerald-700'
                                : r.status === 'dismissed'
                                ? 'bg-slate-100 text-slate-500'
                                : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-right space-x-2">
                          {r.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleResolveReport(r.id, 'resolve')}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-medium"
                              >
                                Resolve
                              </button>
                              <button
                                onClick={() => handleResolveReport(r.id, 'dismiss')}
                                className="px-2.5 py-1 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded text-[11px] font-medium"
                              >
                                Dismiss
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Platform Rules & Config */}
        {activeTab === 'config' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 max-w-2xl">
            <h2 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Settings className="w-5 h-5 text-indigo-600" />
              Aptitude Engine Configuration
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              Update test durations, question quotas, and qualifying parameters.
            </p>

            {configLoading || !config ? (
              <div className="py-12 text-center text-slate-500">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                Loading platform rules...
              </div>
            ) : (
              <form onSubmit={handleSaveConfig} className="space-y-5">
                {configSuccess && (
                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    Configuration successfully updated and active platform-wide!
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Daily Standalone Practice Limit
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={config.daily_limit}
                      onChange={(e) => setConfig({ ...config, daily_limit: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">Default: 5 tests / day per fresher.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Test Duration (Minutes)
                    </label>
                    <input
                      type="number"
                      min="10"
                      max="180"
                      value={config.duration_minutes}
                      onChange={(e) => setConfig({ ...config, duration_minutes: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">Default: 60 minutes.</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Total Test Questions
                    </label>
                    <input
                      type="number"
                      min="15"
                      max="100"
                      value={config.total_questions}
                      onChange={(e) => setConfig({ ...config, total_questions: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">Default: 45 questions.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Phase 6 Qualifying Cutoff (%)
                    </label>
                    <input
                      type="number"
                      min="10"
                      max="100"
                      step="0.5"
                      value={config.mixed_qualifying_cutoff}
                      onChange={(e) => setConfig({ ...config, mixed_qualifying_cutoff: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">Used exclusively for Mixed Simulation PASS/FAIL.</p>
                  </div>
                </div>

                {/* Section Question Distribution */}
                <div className="pt-2 border-t border-slate-100">
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    Section Question Breakdown
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <span className="text-[11px] text-slate-500">Quantitative</span>
                      <input
                        type="number"
                        min="1"
                        value={config.distribution?.quantitative || 15}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            distribution: {
                              ...config.distribution,
                              quantitative: parseInt(e.target.value, 10),
                            },
                          })
                        }
                        className="w-full mt-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500">Logical</span>
                      <input
                        type="number"
                        min="1"
                        value={config.distribution?.logical || 15}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            distribution: {
                              ...config.distribution,
                              logical: parseInt(e.target.value, 10),
                            },
                          })
                        }
                        className="w-full mt-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500">Verbal</span>
                      <input
                        type="number"
                        min="1"
                        value={config.distribution?.verbal || 15}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            distribution: {
                              ...config.distribution,
                              verbal: parseInt(e.target.value, 10),
                            },
                          })
                        }
                        className="w-full mt-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={configSaving}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors flex items-center gap-2"
                  >
                    {configSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    Save Platform Rules
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* MODAL: Add Question */}
        {addModalOpen && (
          <CreateQuestionModal
            onClose={() => setAddModalOpen(false)}
            onSuccess={() => {
              setAddModalOpen(false);
              fetchQuestions();
            }}
          />
        )}

        {/* MODAL: Question Detail & History */}
        {detailModalOpen && selectedQuestion && (
          <QuestionDetailModal
            questionData={selectedQuestion}
            onClose={() => {
              setDetailModalOpen(false);
              setSelectedQuestion(null);
            }}
          />
        )}

        {/* MODAL: New Version */}
        {newVersionModalOpen && selectedQuestion && (
          <NewVersionModal
            question={selectedQuestion}
            onClose={() => {
              setNewVersionModalOpen(false);
              setSelectedQuestion(null);
            }}
            onSuccess={() => {
              setNewVersionModalOpen(false);
              setSelectedQuestion(null);
              fetchQuestions();
            }}
          />
        )}
      </div>
    </div>
  );
}

// Subcomponents / Modals
function CreateQuestionModal({ onClose, onSuccess }) {
  const [category, setCategory] = useState('Quantitative Aptitude');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [questionText, setQuestionText] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctIndex, setCorrectIndex] = useState(0);
  const [explanation, setExplanation] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!questionText.trim()) return setError('Question text is required.');
    if (options.some((o) => !o.trim())) return setError('All 4 options must be filled.');
    if (!explanation.trim()) return setError('Explanation is required.');

    setSaving(true);
    setError(null);
    try {
      await aptitudeService.adminCreateQuestion({
        category,
        topic,
        difficulty,
        question_text: questionText,
        options,
        correct_option_index: correctIndex,
        explanation,
      });
      onSuccess();
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to create aptitude question.');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">Create New Aptitude MCQ</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-xs font-semibold">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Section</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
              >
                <option value="Quantitative Aptitude">Quantitative</option>
                <option value="Logical Reasoning">Logical</option>
                <option value="Verbal Ability">Verbal</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Topic</label>
              <input
                type="text"
                placeholder="e.g. Percentages"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Question Statement</label>
            <textarea
              rows="3"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="State the mathematical or logical problem clearly..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          <div className="space-y-2">
            <label className="block font-semibold text-slate-700">4 Multiple Choice Options</label>
            {options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-5 font-bold text-slate-500">{String.fromCharCode(65 + i)}:</span>
                <input
                  type="text"
                  placeholder={`Option ${String.fromCharCode(65 + i)}`}
                  value={opt}
                  onChange={(e) => {
                    const next = [...options];
                    next[i] = e.target.value;
                    setOptions(next);
                  }}
                  className="flex-1 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                />
                <label className="flex items-center gap-1 text-[11px] text-slate-600 cursor-pointer">
                  <input
                    type="radio"
                    name="correctIndex"
                    checked={correctIndex === i}
                    onChange={() => setCorrectIndex(i)}
                  />
                  Correct
                </label>
              </div>
            ))}
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Step-by-Step Explanation</label>
            <textarea
              rows="3"
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Detailed calculation or logical derivation..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono text-[11px]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm"
            >
              {saving ? 'Creating...' : 'Create MCQ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function QuestionDetailModal({ questionData, onClose }) {
  const q = questionData?.question || questionData;
  const versions = questionData?.versions || [];
  const valHistory = questionData?.validation_history || [];

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <span className="text-xs font-semibold text-indigo-600">{q?.category}</span>
            <h3 className="text-base font-bold text-slate-900">Question Audit & Version History</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <p className="font-semibold text-slate-800">{q?.question_text}</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {(q?.options || []).map((opt, i) => (
              <div
                key={i}
                className={`p-2 rounded border text-xs ${
                  i === q?.correct_option_index
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold'
                    : 'border-slate-200'
                }`}
              >
                {String.fromCharCode(65 + i)}: {opt}
              </div>
            ))}
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 font-mono text-[11px] text-slate-700">
            <div className="font-bold text-slate-900 mb-1">Explanation:</div>
            {q?.explanation}
          </div>

          {/* Versions Table */}
          {versions.length > 0 && (
            <div className="pt-2">
              <h4 className="font-bold text-slate-800 mb-1.5">Version History ({versions.length})</h4>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                    <tr>
                      <th className="py-1.5 px-3">Version</th>
                      <th className="py-1.5 px-3">Changelog</th>
                      <th className="py-1.5 px-3">Created By</th>
                      <th className="py-1.5 px-3">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {versions.map((v) => (
                      <tr key={v.id}>
                        <td className="py-1.5 px-3 font-mono font-bold">v{v.version_number}</td>
                        <td className="py-1.5 px-3 text-slate-600">{v.changelog || 'Initial seed'}</td>
                        <td className="py-1.5 px-3 text-slate-500">{v.created_by_username || 'System'}</td>
                        <td className="py-1.5 px-3 text-slate-400">
                          {new Date(v.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Validation History */}
          {valHistory.length > 0 && (
            <div className="pt-2">
              <h4 className="font-bold text-slate-800 mb-1.5">AI Validation Audit ({valHistory.length})</h4>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                    <tr>
                      <th className="py-1.5 px-3">v#</th>
                      <th className="py-1.5 px-3">Revisions</th>
                      <th className="py-1.5 px-3">Status</th>
                      <th className="py-1.5 px-3">Failure Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {valHistory.map((val, idx) => (
                      <tr key={idx}>
                        <td className="py-1.5 px-3 font-mono">v{val.version_number}</td>
                        <td className="py-1.5 px-3">{val.revision_count} / 3</td>
                        <td className="py-1.5 px-3">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              val.is_valid ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {val.is_valid ? 'PASSED' : 'SUSPENDED'}
                          </span>
                        </td>
                        <td className="py-1.5 px-3 text-slate-500">{val.failure_reason || 'None'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function NewVersionModal({ question, onClose, onSuccess }) {
  const [questionText, setQuestionText] = useState(question.question_text || '');
  const [options, setOptions] = useState(question.options || ['', '', '', '']);
  const [correctIndex, setCorrectIndex] = useState(question.correct_option_index || 0);
  const [explanation, setExplanation] = useState(question.explanation || '');
  const [changelog, setChangelog] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!changelog.trim()) return setError('Changelog description is required.');

    setSaving(true);
    setError(null);
    try {
      await aptitudeService.adminPublishVersion(question.id, {
        question_text: questionText,
        options,
        correct_option_index: correctIndex,
        explanation,
        changelog,
      });
      onSuccess();
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to publish new question version.');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">
            Publish Version {((question.current_version_number || 1) + 1)}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-xs font-semibold">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Reason for Revision (Changelog)</label>
            <input
              type="text"
              placeholder="e.g. Corrected typo in option B, clarified mathematical steps"
              value={changelog}
              onChange={(e) => setChangelog(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Question Statement</label>
            <textarea
              rows="3"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          <div className="space-y-2">
            <label className="block font-semibold text-slate-700">Options</label>
            {options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-5 font-bold text-slate-500">{String.fromCharCode(65 + i)}:</span>
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => {
                    const next = [...options];
                    next[i] = e.target.value;
                    setOptions(next);
                  }}
                  className="flex-1 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                />
                <label className="flex items-center gap-1 text-[11px] text-slate-600 cursor-pointer">
                  <input
                    type="radio"
                    name="correctVersionIndex"
                    checked={correctIndex === i}
                    onChange={() => setCorrectIndex(i)}
                  />
                  Correct
                </label>
              </div>
            ))}
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Step-by-Step Explanation</label>
            <textarea
              rows="3"
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono text-[11px]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm"
            >
              {saving ? 'Publishing...' : 'Publish Immutable Version'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
