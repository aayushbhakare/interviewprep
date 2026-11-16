import React, { useEffect, useState } from 'react';
import {
  X,
  CheckCircle,
  Clock,
  Code2,
  Terminal,
  AlertCircle,
  Loader2,
  Sparkles,
  BookOpen,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import api from '../../services/api';

export default function PracticeTaskModal({ task, isOpen, onClose, onStatusChanged, onOpenRelatedTopic }) {
  const [taskDetail, setTaskDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('not_started');
  const [notes, setNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showHints, setShowHints] = useState(false);

  useEffect(() => {
    if (!isOpen || !task) return;

    setLoading(true);
    setError(null);
    api.get(`/learning/practice-tasks/${task.id}/`)
      .then((res) => {
        const data = res.data?.data;
        setTaskDetail(data);
        setStatus(data.status || 'not_started');
        setNotes(data.submission_notes || '');
      })
      .catch((err) => {
        setError(err.response?.data?.detail || 'Unable to load practice task details.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isOpen, task]);

  if (!isOpen || !task) return null;

  const handleStatusUpdate = async (nextStatus) => {
    if (isUpdating) return;
    setIsUpdating(true);
    setStatus(nextStatus);
    try {
      const res = await api.patch(`/learning/practice-tasks/${task.id}/progress/`, {
        status: nextStatus,
        submission_notes: notes,
      });
      onStatusChanged?.(task.id, nextStatus, res.data?.data?.roadmap_stats);
    } catch {
      // Revert on error
      setStatus(taskDetail?.status || 'not_started');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveNotes = async () => {
    setIsUpdating(true);
    try {
      await api.patch(`/learning/practice-tasks/${task.id}/progress/`, {
        status,
        submission_notes: notes,
      });
    } catch {
      // ignore
    } finally {
      setIsUpdating(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const difficultyColors = {
    Easy: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Medium: 'bg-amber-50 text-amber-700 border-amber-200',
    Hard: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-200 flex items-start justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-100">
                {task.task_type?.replace(/_/g, ' ') || 'Practice Task'}
              </span>
              <span
                className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                  difficultyColors[task.difficulty] || 'bg-slate-100 text-slate-700'
                }`}
              >
                {task.difficulty || 'Medium'}
              </span>
              <span className="text-xs text-slate-500 flex items-center">
                <Clock className="w-3.5 h-3.5 mr-1" />
                {task.estimated_minutes} mins estimated
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">{task.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {loading && (
            <div className="py-20 text-center flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-brand-600 animate-spin mb-3" />
              <p className="text-sm text-slate-500">Loading hands-on practice details...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center text-red-700 text-sm">
              <AlertCircle className="w-5 h-5 mr-2 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {taskDetail && !loading && (
            <>
              {/* Connected Related Learning Topic Banner */}
              {taskDetail.related_topic && (
                <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-3.5 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2 text-indigo-900">
                    <BookOpen className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>
                      Reinforces Topic: <strong>{taskDetail.related_topic.title}</strong>
                    </span>
                  </div>
                  {onOpenRelatedTopic && (
                    <button
                      type="button"
                      onClick={() => onOpenRelatedTopic(taskDetail.related_topic)}
                      className="font-semibold text-brand-600 hover:text-brand-800 hover:underline shrink-0 ml-2"
                    >
                      Study Concept →
                    </button>
                  )}
                </div>
              )}

              {/* Task Objective */}
              {taskDetail.objective && (
                <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900 mb-1 flex items-center">
                    <Sparkles className="w-4 h-4 mr-1 text-brand-600" />
                    Task Objective
                  </h3>
                  <p className="text-sm text-blue-950 leading-relaxed">{taskDetail.objective}</p>
                </div>
              )}

              {/* Problem Statement */}
              {taskDetail.problem_statement && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Problem Statement
                  </h3>
                  <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-line">
                    {taskDetail.problem_statement}
                  </p>
                </div>
              )}

              {/* Requirements */}
              {taskDetail.requirements?.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Acceptance Criteria & Requirements
                  </h3>
                  <ul className="space-y-2 text-sm text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    {taskDetail.requirements.map((req, i) => (
                      <li key={i} className="flex items-start">
                        <CheckCircle className="w-4 h-4 text-brand-600 mr-2 mt-0.5 shrink-0" />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Constraints */}
              {taskDetail.constraints?.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Engineering Constraints
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {taskDetail.constraints.map((c, i) => (
                      <span
                        key={i}
                        className="text-xs font-mono bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md border border-slate-200"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Sample Input / Output */}
              {taskDetail.sample_io?.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Sample Scenarios / Test Cases
                  </h3>
                  <div className="space-y-3">
                    {taskDetail.sample_io.map((io, i) => (
                      <div key={i} className="bg-slate-900 text-slate-100 rounded-xl p-4 font-mono text-xs">
                        {io.input && (
                          <div className="mb-2">
                            <span className="text-slate-400 block text-[10px] uppercase">Input:</span>
                            <div className="text-emerald-400">{io.input}</div>
                          </div>
                        )}
                        {io.output && (
                          <div className="mb-2">
                            <span className="text-slate-400 block text-[10px] uppercase">Expected Output:</span>
                            <div className="text-amber-300">{io.output}</div>
                          </div>
                        )}
                        {io.explanation && (
                          <div className="text-slate-400 text-[11px] font-sans border-t border-slate-800 pt-2 mt-2">
                            {io.explanation}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Expected Deliverable */}
              {taskDetail.expected_deliverable && (
                <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900 mb-1 flex items-center">
                    <Code2 className="w-4 h-4 mr-1 text-emerald-600" />
                    Expected Deliverable
                  </h3>
                  <p className="text-sm text-emerald-950">{taskDetail.expected_deliverable}</p>
                </div>
              )}

              {/* Starter Code Skeleton */}
              {taskDetail.starter_code && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center">
                      <Terminal className="w-3.5 h-3.5 mr-1 text-brand-600" />
                      Starter Code Skeleton
                    </h3>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(taskDetail.starter_code)}
                      className="text-xs text-brand-600 hover:text-brand-800 flex items-center space-x-1"
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
                    </button>
                  </div>
                  <pre className="bg-slate-900 text-slate-100 rounded-xl p-4 font-mono text-xs overflow-x-auto">
                    <code>{taskDetail.starter_code}</code>
                  </pre>
                </div>
              )}

              {/* Hints Accordion */}
              {taskDetail.hints?.length > 0 && (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowHints(!showHints)}
                    className="w-full p-3.5 text-left bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-xs font-bold text-slate-700"
                  >
                    <span>Need a Hint? ({taskDetail.hints.length} available)</span>
                    {showHints ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {showHints && (
                    <div className="p-4 bg-white space-y-2 border-t border-slate-200 text-xs text-slate-600">
                      {taskDetail.hints.map((h, i) => (
                        <div key={i} className="flex items-start">
                          <span className="text-amber-500 font-bold mr-2">Hint {i + 1}:</span>
                          <span>{h}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Submission Notes / Work Log */}
              <div>
                <label htmlFor="task-notes" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  My Implementation Notes / Solution Code
                </label>
                <textarea
                  id="task-notes"
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  onBlur={handleSaveNotes}
                  placeholder="Paste your code snippet, GitHub link, or thoughts here (auto-saved)..."
                  className="w-full text-xs font-mono p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                />
              </div>
            </>
          )}
        </div>

        {/* Modal Footer: Independent Progress State Toggle */}
        <div className="p-5 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider mr-1">Progress:</span>
            <button
              type="button"
              onClick={() => handleStatusUpdate('not_started')}
              disabled={isUpdating}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                status === 'not_started'
                  ? 'bg-slate-200 text-slate-800 border-slate-300 shadow-sm'
                  : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Not Started
            </button>
            <button
              type="button"
              onClick={() => handleStatusUpdate('in_progress')}
              disabled={isUpdating}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                status === 'in_progress'
                  ? 'bg-blue-100 text-blue-800 border-blue-300 shadow-sm'
                  : 'bg-white text-slate-500 border-slate-200 hover:bg-blue-50'
              }`}
            >
              In Progress
            </button>
            <button
              type="button"
              onClick={() => handleStatusUpdate('completed')}
              disabled={isUpdating}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                status === 'completed'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'bg-white text-slate-500 border-slate-200 hover:bg-emerald-50 hover:text-emerald-700'
              }`}
            >
              Completed
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
