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
} from 'lucide-react';
import quizService from '../../services/quizService';
import Navbar from '../../components/shared/Navbar';

export default function AdminQuestionBankPage() {
  const [activeTab, setActiveTab] = useState('questions'); // 'questions' | 'reports'
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ questions: [], total: 0, approved: 0, suspended: 0, inactive: 0 });

  // Filters
  const [search, setSearch] = useState('');
  const [technology, setTechnology] = useState('');
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

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (technology) params.technology = technology;
      if (category) params.category = category;
      if (difficulty) params.difficulty = difficulty;
      if (status) params.status = status;

      const res = await quizService.getAdminQuestions(params);
      setData(res.data);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    setReportsLoading(true);
    try {
      const res = await quizService.getAdminReports();
      setReports(res.data?.reports || []);
    } catch {
      // Fallback
    } finally {
      setReportsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'questions') {
      fetchQuestions();
    } else {
      fetchReports();
    }
  }, [activeTab, technology, category, difficulty, status]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchQuestions();
  };

  const handleStatusChange = async (questionId, newStatus) => {
    try {
      await quizService.updateAdminQuestionStatus(questionId, newStatus);
      fetchQuestions();
      if (selectedQuestion?.id === questionId) {
        setSelectedQuestion((prev) => ({ ...prev, status: newStatus }));
      }
    } catch {
      alert('Failed to update question status.');
    }
  };

  const handleResolveReport = async (reportId, newStatus) => {
    try {
      await quizService.resolveAdminReport(reportId, { status: newStatus, admin_notes: 'Reviewed by administrator' });
      fetchReports();
    } catch {
      alert('Failed to resolve report.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-brand-600 mb-1">
              <Database className="w-4 h-4" />
              <span>Admin Management</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Technical Question Bank</h1>
            <p className="text-xs text-slate-500 mt-1">
              Curate, version, inspect AI validation, and review student issue reports across shared question pools.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setAddModalOpen(true)}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Question</span>
            </button>
          </div>
        </div>

        {/* Stats Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 block">Total Questions</span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">{data.total}</span>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <span className="text-xs font-semibold text-emerald-600 block">Approved Pool</span>
            <span className="text-2xl font-bold text-emerald-700 mt-1 block">{data.approved}</span>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <span className="text-xs font-semibold text-amber-600 block">Suspended Review</span>
            <span className="text-2xl font-bold text-amber-700 mt-1 block">{data.suspended}</span>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <span className="text-xs font-semibold text-slate-400 block">Inactive</span>
            <span className="text-2xl font-bold text-slate-700 mt-1 block">{data.inactive}</span>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex space-x-2 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('questions')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'questions'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Questions Catalog ({data.filtered_count || data.total})
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'reports'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Student Reports ({reports.length})
          </button>
        </div>

        {/* Tab 1: Questions */}
        {activeTab === 'questions' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <form onSubmit={handleSearchSubmit} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm grid grid-cols-1 sm:grid-cols-5 gap-3">
              <div className="sm:col-span-2 relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search questions or technologies..."
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
              </div>

              <div>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-2.5 py-2 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                >
                  <option value="">All Categories</option>
                  <option value="output_prediction">Code Output</option>
                  <option value="error_debugging">Find Error</option>
                  <option value="coding">Coding Problems</option>
                  <option value="scenario">Scenario-Based</option>
                  <option value="conceptual">Conceptual</option>
                </select>
              </div>

              <div>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-2.5 py-2 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                >
                  <option value="">All Difficulties</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              <div>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-2.5 py-2 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                >
                  <option value="">All Statuses</option>
                  <option value="approved">Approved</option>
                  <option value="suspended">Suspended</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </form>

            {/* Questions Table */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              {loading ? (
                <div className="py-16 text-center text-sm text-slate-500 flex items-center justify-center space-x-2">
                  <Loader2 className="w-5 h-5 text-brand-600 animate-spin" />
                  <span>Loading question catalog...</span>
                </div>
              ) : !data.questions || data.questions.length === 0 ? (
                <div className="py-16 text-center text-sm text-slate-500">
                  No questions match your filter criteria.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Category & Tech</th>
                        <th className="py-3 px-4">Prompt Preview</th>
                        <th className="py-3 px-4">Difficulty</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Version</th>
                        <th className="py-3 px-4">Usage</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.questions.map((q) => {
                        const latest = q.latest_version || (q.versions && q.versions[0]) || {};
                        return (
                          <tr key={q.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-3.5 px-4">
                              <span className="font-bold text-slate-900 block capitalize">
                                {q.category.replace('_', ' ')}
                              </span>
                              <span className="text-slate-500 text-[11px]">
                                {q.technology} • {q.topic_slug}
                              </span>
                            </td>

                            <td className="py-3.5 px-4 max-w-xs">
                              <p className="text-slate-800 line-clamp-2">{latest.prompt}</p>
                            </td>

                            <td className="py-3.5 px-4 capitalize font-medium text-slate-700">
                              {q.difficulty}
                            </td>

                            <td className="py-3.5 px-4">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
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

                            <td className="py-3.5 px-4 font-mono font-semibold text-slate-600">
                              v{q.current_version_number}
                            </td>

                            <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                              {q.times_assigned} assigned • {q.times_attempted} attempts
                            </td>

                            <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
                              <button
                                onClick={() => {
                                  setSelectedQuestion(q);
                                  setDetailModalOpen(true);
                                }}
                                className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors"
                                title="View details & versions"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedQuestion(q);
                                  setNewVersionModalOpen(true);
                                }}
                                className="p-1.5 hover:bg-slate-100 text-brand-600 rounded-lg transition-colors"
                                title="Create new version"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              {q.status !== 'approved' && (
                                <button
                                  onClick={() => handleStatusChange(q.id, 'approved')}
                                  className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded"
                                >
                                  Approve
                                </button>
                              )}
                              {q.status === 'approved' && (
                                <button
                                  onClick={() => handleStatusChange(q.id, 'suspended')}
                                  className="text-[11px] font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded"
                                >
                                  Suspend
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Reports */}
        {activeTab === 'reports' && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Student Issue Reports</h3>
            {reportsLoading ? (
              <div className="py-12 text-center text-sm text-slate-500">Loading reports...</div>
            ) : reports.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-500">
                No reports submitted by students.
              </div>
            ) : (
              <div className="space-y-3">
                {reports.map((rep) => (
                  <div key={rep.id} className="p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-xs text-rose-700 bg-rose-50 px-2 py-0.5 rounded capitalize">
                          {rep.reason.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-slate-400">• From {rep.student_email || 'Student'}</span>
                        <span className="text-xs font-semibold text-slate-600">[{rep.status}]</span>
                      </div>
                      <p className="text-xs text-slate-800 mt-1">{rep.description}</p>
                    </div>

                    <div className="flex items-center space-x-2">
                      {rep.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleResolveReport(rep.id, 'resolved')}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg"
                          >
                            Resolve
                          </button>
                          <button
                            onClick={() => handleResolveReport(rep.id, 'dismissed')}
                            className="px-3 py-1 border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold rounded-lg"
                          >
                            Dismiss
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Add Question Modal */}
      {addModalOpen && (
        <AddQuestionModal
          isOpen={addModalOpen}
          onClose={() => setAddModalOpen(false)}
          onCreated={() => {
            setAddModalOpen(false);
            fetchQuestions();
          }}
        />
      )}

      {/* Question Details Modal */}
      {detailModalOpen && selectedQuestion && (
        <QuestionDetailModal
          isOpen={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          question={selectedQuestion}
        />
      )}

      {/* New Version Modal */}
      {newVersionModalOpen && selectedQuestion && (
        <NewVersionModal
          isOpen={newVersionModalOpen}
          onClose={() => setNewVersionModalOpen(false)}
          question={selectedQuestion}
          onCreated={() => {
            setNewVersionModalOpen(false);
            fetchQuestions();
          }}
        />
      )}
    </div>
  );
}

function AddQuestionModal({ isOpen, onClose, onCreated }) {
  const [tech, setTech] = useState('Python');
  const [topic, setTopic] = useState('general');
  const [cat, setCat] = useState('output_prediction');
  const [diff, setDiff] = useState('medium');
  const [prompt, setPrompt] = useState('');
  const [snippet, setSnippet] = useState('');
  const [expected, setExpected] = useState('');
  const [explanation, setExplanation] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErr('');
    try {
      await quizService.createAdminQuestion({
        technology: tech,
        topic_slug: topic,
        category: cat,
        difficulty: diff,
        prompt,
        code_snippet: snippet,
        expected_answer: expected,
        explanation,
      });
      onCreated();
    } catch (e) {
      setErr(e?.response?.data?.detail || 'Failed to create question.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-4">
        <div className="flex justify-between items-center pb-2 border-b">
          <h3 className="font-bold text-base text-slate-900">Add New Question</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700">Technology</label>
              <input value={tech} onChange={(e) => setTech(e.target.value)} className="w-full border p-2 rounded" required />
            </div>
            <div>
              <label className="font-bold text-slate-700">Topic Slug</label>
              <input value={topic} onChange={(e) => setTopic(e.target.value)} className="w-full border p-2 rounded" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700">Category</label>
              <select value={cat} onChange={(e) => setCat(e.target.value)} className="w-full border p-2 rounded">
                <option value="output_prediction">Code Output</option>
                <option value="error_debugging">Find Error</option>
                <option value="coding">Coding Problems</option>
                <option value="scenario">Scenario-Based</option>
                <option value="conceptual">Conceptual</option>
              </select>
            </div>
            <div>
              <label className="font-bold text-slate-700">Difficulty</label>
              <select value={diff} onChange={(e) => setDiff(e.target.value)} className="w-full border p-2 rounded">
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700">Question Prompt</label>
            <textarea rows={3} value={prompt} onChange={(e) => setPrompt(e.target.value)} className="w-full border p-2 rounded" required />
          </div>

          <div>
            <label className="font-bold text-slate-700">Code Snippet (if applicable)</label>
            <textarea rows={3} value={snippet} onChange={(e) => setSnippet(e.target.value)} className="w-full border p-2 rounded font-mono" />
          </div>

          <div>
            <label className="font-bold text-slate-700">Expected Answer / Solution Criteria</label>
            <textarea rows={2} value={expected} onChange={(e) => setExpected(e.target.value)} className="w-full border p-2 rounded" required />
          </div>

          <div>
            <label className="font-bold text-slate-700">Technical Explanation</label>
            <textarea rows={3} value={explanation} onChange={(e) => setExplanation(e.target.value)} className="w-full border p-2 rounded" required />
          </div>

          {err && <div className="text-rose-600 text-xs">{err}</div>}

          <div className="flex justify-end space-x-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600">Cancel</button>
            <button type="submit" disabled={loading} className="px-5 py-2 bg-brand-600 text-white font-bold rounded">
              {loading ? 'Creating...' : 'Create Question'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function QuestionDetailModal({ isOpen, onClose, question }) {
  if (!isOpen || !question) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-4">
        <div className="flex justify-between items-center pb-2 border-b">
          <div>
            <h3 className="font-bold text-base text-slate-900">Question Details</h3>
            <span className="text-xs text-slate-500">{question.technology} • {question.category}</span>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
        </div>

        <div className="space-y-3 text-xs">
          <h4 className="font-bold uppercase tracking-wider text-slate-500">Version History ({question.versions?.length || 1})</h4>
          <div className="space-y-2">
            {(question.versions || []).map((v) => (
              <div key={v.id} className="p-3 border rounded-xl bg-slate-50 space-y-1">
                <div className="flex justify-between font-bold">
                  <span>Version {v.version_number}</span>
                  <span className="text-slate-400">{v.validation_status}</span>
                </div>
                <p className="text-slate-800">{v.prompt}</p>
                {v.expected_answer && (
                  <p className="text-emerald-700"><strong>Expected:</strong> {v.expected_answer}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button onClick={onClose} className="px-4 py-2 bg-slate-100 rounded text-xs font-semibold">Close</button>
        </div>
      </div>
    </div>
  );
}

function NewVersionModal({ isOpen, onClose, question, onCreated }) {
  const latest = question.latest_version || (question.versions && question.versions[0]) || {};
  const [prompt, setPrompt] = useState(latest.prompt || '');
  const [snippet, setSnippet] = useState(latest.code_snippet || '');
  const [expected, setExpected] = useState(latest.expected_answer || '');
  const [explanation, setExplanation] = useState(latest.explanation || '');
  const [reason, setReason] = useState('Admin improved clarity');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await quizService.createAdminQuestionVersion(question.id, {
        prompt,
        code_snippet: snippet,
        expected_answer: expected,
        explanation,
        change_reason: reason,
      });
      onCreated();
    } catch {
      alert('Failed to publish version.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4">
        <div className="flex justify-between items-center pb-2 border-b">
          <h3 className="font-bold text-base text-slate-900">Publish New Version (v{question.current_version_number + 1})</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="font-bold text-slate-700">Updated Prompt</label>
            <textarea rows={3} value={prompt} onChange={(e) => setPrompt(e.target.value)} className="w-full border p-2 rounded" required />
          </div>
          <div>
            <label className="font-bold text-slate-700">Updated Expected Answer</label>
            <textarea rows={2} value={expected} onChange={(e) => setExpected(e.target.value)} className="w-full border p-2 rounded" required />
          </div>
          <div>
            <label className="font-bold text-slate-700">Updated Explanation</label>
            <textarea rows={2} value={explanation} onChange={(e) => setExplanation(e.target.value)} className="w-full border p-2 rounded" required />
          </div>
          <div>
            <label className="font-bold text-slate-700">Change Reason</label>
            <input value={reason} onChange={(e) => setReason(e.target.value)} className="w-full border p-2 rounded" required />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600">Cancel</button>
            <button type="submit" disabled={loading} className="px-5 py-2 bg-brand-600 text-white font-bold rounded">
              {loading ? 'Publishing...' : 'Publish Version'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
