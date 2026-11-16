import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  BookOpen,
  RotateCcw,
  Sparkles,
  ChevronRight,
  Layers,
  HelpCircle,
  Award,
} from 'lucide-react';
import TopicContentModal from './TopicContentModal';
import RoadmapReplaceModal from './RoadmapReplaceModal';
import api from '../../services/api';

export default function RoadmapViewer({ roadmap, onRoadmapReplaced, onRefreshRoadmap }) {
  const [selectedPhaseIdx, setSelectedPhaseIdx] = useState(0);
  const [selectedWeekIdx, setSelectedWeekIdx] = useState(0);
  const [activeTopicForModal, setActiveTopicForModal] = useState(null);
  const [replaceModalOpen, setReplaceModalOpen] = useState(false);
  const [updatingTopicId, setUpdatingTopicId] = useState(null);
  const [localStatuses, setLocalStatuses] = useState({});

  const getTopicStatus = (topic) => {
    if (localStatuses[topic.id] !== undefined) {
      return localStatuses[topic.id];
    }
    return topic.status;
  };

  const phases = roadmap?.phases || [];
  const currentPhase = phases[selectedPhaseIdx] || phases[0];
  const weeks = currentPhase?.weeks || [];
  const currentWeek = weeks[selectedWeekIdx] || weeks[0];
  const stats = roadmap?.stats || { total_topics: 0, completed_topics: 0, skipped_topics: 0, progress_percentage: 0 };

  const handleUpdateStatus = async (topicId, newStatus) => {
    setLocalStatuses((prev) => ({ ...prev, [topicId]: newStatus }));
    setUpdatingTopicId(topicId);
    try {
      await api.patch(`/learning/topics/${topicId}/progress/`, { status: newStatus });
      onRefreshRoadmap();
    } catch {
      onRefreshRoadmap();
    } finally {
      setUpdatingTopicId(null);
    }
  };

  const handleCheckboxToggle = (topic) => {
    const currentStatus = getTopicStatus(topic);
    const nextStatus = currentStatus === 'completed' ? 'not_started' : 'completed';
    handleUpdateStatus(topic.id, nextStatus);
  };

  return (
    <div className="space-y-8">
      {/* Roadmap Top Header Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-2.5 py-1 rounded-md">
                {roadmap.target_salary || 'Flexible Salary Band'}
              </span>
              <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
                {roadmap.experience_level}
              </span>
              <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md">
                {roadmap.language} / {roadmap.framework}
              </span>
              <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">
                {roadmap.database}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {roadmap.role} Learning Roadmap
            </h1>
          </div>

          <button
            type="button"
            onClick={() => setReplaceModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-slate-300 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm transition-all self-start md:self-auto"
          >
            <RotateCcw className="w-4 h-4 mr-1.5 text-slate-500" />
            Replace Roadmap
          </button>
        </div>

        {/* Global Progress Bar */}
        <div className="pt-4 border-t border-slate-100">
          <div className="flex justify-between items-center text-xs sm:text-sm font-semibold text-slate-700 mb-2">
            <span>Overall Roadmap Mastery</span>
            <span>
              {stats.completed_topics} / {stats.total_topics} Topics Completed ({stats.progress_percentage}%)
              {stats.skipped_topics > 0 && ` • ${stats.skipped_topics} Skipped`}
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
            <div
              className="bg-brand-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${Math.max(stats.progress_percentage, 2)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Roadmap Workspace: Phases & Weeks Navigation */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Column: Phase & Week Selector */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
            Phases & Milestones
          </h2>

          <div className="space-y-3">
            {phases.map((p, pIdx) => {
              const isSelectedPhase = selectedPhaseIdx === pIdx;
              return (
                <div
                  key={p.id}
                  className={`border rounded-xl transition-all overflow-hidden ${
                    isSelectedPhase
                      ? 'border-brand-500 bg-white shadow-sm'
                      : 'border-slate-200 bg-slate-50/70 hover:bg-white'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPhaseIdx(pIdx);
                      setSelectedWeekIdx(0);
                    }}
                    className="w-full p-3.5 text-left flex items-start justify-between"
                  >
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-brand-600 block">
                        Phase {p.phase_number}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 mt-0.5 leading-snug">
                        {p.title}
                      </h3>
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 text-slate-400 mt-1 transition-transform ${
                        isSelectedPhase ? 'rotate-90 text-brand-600' : ''
                      }`}
                    />
                  </button>

                  {/* Week Tabs inside active Phase */}
                  {isSelectedPhase && (
                    <div className="px-3 pb-3 pt-1 space-y-1.5 border-t border-slate-100 bg-white">
                      {p.weeks.map((w, wIdx) => {
                        const isSelectedWeek = selectedWeekIdx === wIdx;
                        return (
                          <button
                            key={w.id}
                            type="button"
                            onClick={() => setSelectedWeekIdx(wIdx)}
                            className={`w-full px-3 py-2 rounded-lg text-left text-xs font-medium transition-colors flex items-center justify-between ${
                              isSelectedWeek
                                ? 'bg-brand-50 text-brand-700 font-bold'
                                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                            }`}
                          >
                            <span>Week {w.week_number}: {w.title}</span>
                            <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                              {w.completed_topics}/{w.total_topics}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Selected Week Topics List */}
        <div className="lg:col-span-3 space-y-6">
          {currentWeek ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
              {/* Week Heading & Goal */}
              <div className="mb-6 pb-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-600">
                    Phase {currentPhase.phase_number} • Week {currentWeek.week_number}
                  </span>
                  <h2 className="text-2xl font-bold text-slate-900 mt-0.5">{currentWeek.title}</h2>
                  {currentWeek.goal && (
                    <p className="text-sm text-slate-600 mt-1">{currentWeek.goal}</p>
                  )}
                </div>
                <div className="text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg self-start sm:self-auto">
                  {currentWeek.completed_topics} of {currentWeek.total_topics} items verified
                </div>
              </div>

              {/* Topics List */}
              <div className="space-y-3 mb-8">
                {currentWeek.topics.map((t) => {
                  const status = getTopicStatus(t);
                  const isCompleted = status === 'completed';
                  const isSkipped = status === 'skipped';
                  const isUpdating = updatingTopicId === t.id;

                  return (
                    <div
                      key={t.id}
                      className={`border rounded-xl p-4 transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${
                        isCompleted
                          ? 'border-emerald-200 bg-emerald-50/30'
                          : isSkipped
                          ? 'border-amber-200 bg-amber-50/30'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      {/* Checkbox and Title */}
                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          checked={isCompleted}
                          disabled={isUpdating}
                          onChange={() => handleCheckboxToggle(t)}
                          aria-label={`Mark topic ${t.title} as completed`}
                          className="w-5 h-5 mt-0.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                        />
                        <div>
                          <div className="flex items-center space-x-2">
                            <span
                              className={`text-sm font-bold ${
                                isCompleted
                                  ? 'text-slate-700 line-through'
                                  : 'text-slate-900'
                              }`}
                            >
                              {t.title}
                            </span>
                            {isCompleted && (
                              <span className="inline-flex items-center text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                                Completed
                              </span>
                            )}
                            {isSkipped && (
                              <span className="inline-flex items-center text-[10px] font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                                Not Verified
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-500 flex items-center mt-0.5">
                            <Clock className="w-3.5 h-3.5 mr-1" />
                            {t.estimated_minutes} minutes estimated
                          </span>
                        </div>
                      </div>

                      {/* Topic Action Buttons */}
                      <div className="flex items-center space-x-2 self-end sm:self-auto">
                        {!isCompleted && !isSkipped && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(t.id, 'skipped')}
                            disabled={isUpdating}
                            className="px-2.5 py-1 text-xs font-medium text-slate-500 hover:text-amber-700 hover:bg-amber-50 border border-slate-200 rounded-md transition-colors"
                          >
                            Skip
                          </button>
                        )}
                        {isSkipped && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(t.id, 'completed')}
                            disabled={isUpdating}
                            className="px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors"
                          >
                            Verify
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setActiveTopicForModal(t)}
                          className="inline-flex items-center px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 rounded-lg text-xs font-semibold transition-colors"
                        >
                          <BookOpen className="w-3.5 h-3.5 mr-1" />
                          Study Content
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Weekly Diagnostic Quiz Item (Placeholder for Phase 4 & 5) */}
              <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-5 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 text-brand-600 flex items-center justify-center font-bold">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Week {currentWeek.week_number} Diagnostic Quiz (45 Non-MCQ Questions)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Output prediction, code debugging, and design scenarios. Unlocks in Phase 5.
                    </p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-slate-400 bg-slate-200/60 px-2.5 py-1 rounded-md shrink-0">
                  Phase 5 Milestone
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500">
              Select a phase and week to view topics.
            </div>
          )}
        </div>
      </div>

      {/* Topic Content Modal */}
      {activeTopicForModal && (
        <TopicContentModal
          topic={activeTopicForModal}
          isOpen={!!activeTopicForModal}
          onClose={() => setActiveTopicForModal(null)}
          onUpdateStatus={(topicId, newStatus) => {
            handleUpdateStatus(topicId, newStatus);
          }}
        />
      )}

      {/* Roadmap Replacement Modal */}
      <RoadmapReplaceModal
        isOpen={replaceModalOpen}
        onClose={() => setReplaceModalOpen(false)}
        onConfirm={() => {
          setReplaceModalOpen(false);
          onRoadmapReplaced();
        }}
      />
    </div>
  );
}
