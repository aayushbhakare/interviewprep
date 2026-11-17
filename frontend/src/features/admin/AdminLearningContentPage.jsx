import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import {
  BookOpen,
  Plus,
  Edit3,
  Layers,
  CheckCircle2,
  XCircle,
  Eye,
  GitBranch,
  X,
  Sparkles,
  AlertCircle,
  Save,
} from 'lucide-react';

export default function AdminLearningContentPage() {
  const [topics, setTopics] = useState([]);
  const [technologies, setTechnologies] = useState([]);
  const [selectedTech, setSelectedTech] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);

  // Topic detail & versioning modal
  const [activeTopic, setActiveTopic] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [topicDetail, setTopicDetail] = useState(null);

  // Version edit form
  const [newVersionNumber, setNewVersionNumber] = useState(1);
  const [versionSections, setVersionSections] = useState([]);
  const [versionSubmitting, setVersionSubmitting] = useState(false);

  useEffect(() => {
    fetchTopics();
  }, [selectedTech, search]);

  const fetchTopics = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedTech) params.technology_id = selectedTech;
      if (search) params.search = search;

      const res = await adminService.getLearningTopics(params);
      setTopics(res.data.topics || []);
      setTechnologies(res.data.technologies || []);
    } catch (err) {
      console.error('Failed to load learning topics:', err);
      setFeedback({ type: 'error', message: 'Failed to load learning content topics.' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenVersioning = async (topic) => {
    try {
      setActiveTopic(topic);
      setModalLoading(true);
      const res = await adminService.getLearningTopicDetail(topic.id);
      const data = res.data;
      setTopicDetail(data);

      // Pre-fill next version
      const latestVer = data.latest_version || 1;
      setNewVersionNumber(latestVer + 1);

      // Populate sections from latest version or draft default
      if (data.sections && data.sections.length > 0) {
        setVersionSections(
          data.sections.map((s) => ({
            id: s.id,
            title: s.title,
            content_markdown: s.content_markdown || '',
            order: s.order || 1,
            estimated_read_minutes: s.estimated_read_minutes || 5,
          }))
        );
      } else {
        setVersionSections([
          {
            title: 'Foundational Overview',
            content_markdown: '### Overview\n\nExplain key principles, architecture, and core syntax.',
            order: 1,
            estimated_read_minutes: 5,
          },
        ]);
      }
    } catch (err) {
      console.error('Failed to load topic detail:', err);
      setFeedback({ type: 'error', message: 'Failed to fetch topic details.' });
    } finally {
      setModalLoading(false);
    }
  };

  const handleToggleStatus = async (topic) => {
    try {
      const updatedStatus = !topic.is_published;
      await adminService.toggleTopicStatus(topic.id, updatedStatus);
      setFeedback({
        type: 'success',
        message: `Topic "${topic.title}" ${updatedStatus ? 'published' : 'unpublished'} successfully.`,
      });
      fetchTopics();
    } catch (err) {
      console.error('Failed to toggle topic status:', err);
      setFeedback({ type: 'error', message: 'Failed to update topic status.' });
    }
  };

  const handleAddSection = () => {
    setVersionSections((prev) => [
      ...prev,
      {
        title: `Section ${prev.length + 1}`,
        content_markdown: '### Section Header\n\nAdd technical explanation, code snippets, and diagrams here.',
        order: prev.length + 1,
        estimated_read_minutes: 5,
      },
    ]);
  };

  const handleRemoveSection = (index) => {
    if (versionSections.length <= 1) {
      alert('A topic must have at least one section.');
      return;
    }
    setVersionSections((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSectionChange = (index, field, value) => {
    setVersionSections((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handlePublishNewVersion = async (e) => {
    e.preventDefault();
    try {
      setVersionSubmitting(true);
      await adminService.createOrVersionTopic(activeTopic.id, {
        version: newVersionNumber,
        sections: versionSections,
      });
      setFeedback({
        type: 'success',
        message: `Topic "${activeTopic.title}" version v${newVersionNumber} published successfully without impacting student progress.`,
      });
      setActiveTopic(null);
      setTopicDetail(null);
      fetchTopics();
    } catch (err) {
      console.error('Failed to publish new topic version:', err);
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to save new topic version.',
      });
    } finally {
      setVersionSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Learning Roadmap Content Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Curate multi-section topic guides, manage markdown content, and publish version updates (v+1) while preserving student progress.
          </p>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs font-semibold ${
            feedback.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Technology Taxonomy Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedTech('')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition ${
            selectedTech === ''
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          All Technologies
        </button>
        {technologies.map((t) => (
          <button
            key={t.id}
            onClick={() => setSelectedTech(t.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition ${
              selectedTech === t.id
                ? 'bg-brand-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {t.name}
          </button>
        ))}
      </div>

      {/* Topics Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">Loading topic roadmap taxonomy...</div>
        ) : topics.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-500">
            No topics found for selected criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Order</th>
                  <th className="py-3 px-4">Topic Title & Technology</th>
                  <th className="py-3 px-4">Difficulty</th>
                  <th className="py-3 px-4">Content Version</th>
                  <th className="py-3 px-4">Sections</th>
                  <th className="py-3 px-4">Publication</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {topics.map((tp) => (
                  <tr key={tp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-black text-slate-400">#{tp.order || 1}</td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{tp.title}</div>
                      <div className="text-[11px] text-slate-500">{tp.technology_name}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="capitalize px-2 py-0.5 rounded text-[10.5px] font-bold bg-slate-100 text-slate-700">
                        {tp.difficulty || 'Intermediate'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-brand-700">
                      v{tp.version || 1}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-700">
                      {tp.sections_count || 1} Sections
                    </td>
                    <td className="py-3 px-4">
                      {tp.is_published ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          Draft
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => handleOpenVersioning(tp)}
                        className="px-2.5 py-1 rounded-lg bg-brand-50 text-brand-700 hover:bg-brand-100 font-bold transition border border-brand-200"
                        title="Edit Sections & Release Version"
                      >
                        <GitBranch className="w-3.5 h-3.5 inline mr-1" />
                        Version / Edit
                      </button>

                      <button
                        onClick={() => handleToggleStatus(tp)}
                        className={`px-2.5 py-1 rounded-lg font-semibold transition border ${
                          tp.is_published
                            ? 'border-slate-300 text-slate-700 hover:bg-slate-100'
                            : 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        }`}
                      >
                        {tp.is_published ? 'Unpublish' : 'Publish'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Topic Content Versioning Modal */}
      {activeTopic && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in-50 duration-150">
          <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 p-6 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
                  <GitBranch className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Content Versioning: {activeTopic.title}
                  </h3>
                  <span className="text-xs text-slate-500">
                    Release Version v{newVersionNumber} (Current Active: v{topicDetail?.latest_version || 1})
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setActiveTopic(null);
                  setTopicDetail(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalLoading ? (
              <div className="py-20 text-center text-xs text-slate-400">Loading topic contents...</div>
            ) : (
              <form onSubmit={handlePublishNewVersion} className="flex-1 overflow-y-auto pt-4 space-y-6">
                <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-200 text-xs text-indigo-950 flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Safe Progress Preservation</span>
                    <p className="text-indigo-900/80 mt-0.5 leading-relaxed">
                      Publishing version v{newVersionNumber} updates the reading material for all candidates immediately while preserving existing student topic completions and practice roadmaps.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Topic Sections ({versionSections.length})
                    </h4>
                    <button
                      type="button"
                      onClick={handleAddSection}
                      className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Section
                    </button>
                  </div>

                  {versionSections.map((sec, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-extrabold text-slate-900">
                          Section #{idx + 1}
                        </span>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            value={sec.estimated_read_minutes}
                            onChange={(e) =>
                              handleSectionChange(
                                idx,
                                'estimated_read_minutes',
                                parseInt(e.target.value) || 5
                              )
                            }
                            className="w-16 text-xs p-1 rounded border border-slate-300 text-center"
                            title="Estimated read minutes"
                          />
                          <span className="text-[11px] text-slate-500">mins read</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSection(idx)}
                            className="text-xs font-semibold text-rose-600 hover:underline ml-2"
                          >
                            Remove
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Section Title
                        </label>
                        <input
                          type="text"
                          value={sec.title}
                          onChange={(e) => handleSectionChange(idx, 'title', e.target.value)}
                          required
                          className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white"
                          placeholder="e.g. Memory Model and GIL Internals"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Markdown Content
                        </label>
                        <textarea
                          value={sec.content_markdown}
                          onChange={(e) =>
                            handleSectionChange(idx, 'content_markdown', e.target.value)
                          }
                          rows={6}
                          required
                          className="w-full text-xs font-mono p-3 rounded-lg border border-slate-300 bg-white"
                          placeholder="Write section markdown here..."
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTopic(null);
                      setTopicDetail(null);
                    }}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={versionSubmitting}
                    className="px-4 py-2 text-xs font-bold bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{versionSubmitting ? 'Publishing...' : `Publish Version v${newVersionNumber}`}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
