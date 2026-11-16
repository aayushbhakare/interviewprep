import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  BookOpen,
  RotateCcw,
  Sparkles,
  ChevronRight,
  Code2,
  Terminal,
  AlertCircle,
  Award,
  ArrowRight,
  Check,
} from 'lucide-react';
import TopicContentModal from './TopicContentModal';
import PracticeTaskModal from './PracticeTaskModal';
import RoadmapReplaceModal from './RoadmapReplaceModal';
import QuizOverviewCard from '../quizzes/QuizOverviewCard';
import api from '../../services/api';

export default function RoadmapViewer({ roadmap, onRoadmapReplaced, onRefreshRoadmap }) {
  const [activeTab, setActiveTab] = useState('learning'); // 'learning' | 'practice'
  const [selectedPhaseIdx, setSelectedPhaseIdx] = useState(0);
  const [selectedWeekIdx, setSelectedWeekIdx] = useState(0);
  const [activeTopicForModal, setActiveTopicForModal] = useState(null);
  const [activeTaskForModal, setActiveTaskForModal] = useState(null);
  const [replaceModalOpen, setReplaceModalOpen] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [localTopicStatuses, setLocalTopicStatuses] = useState({});
  const [localPracticeStatuses, setLocalPracticeStatuses] = useState({});

  const phases = roadmap?.phases || [];
  const currentPhase = phases[selectedPhaseIdx] || phases[0];
  const weeks = currentPhase?.weeks || [];
  const currentWeek = weeks[selectedWeekIdx] || weeks[0];

  const learningStats = roadmap?.learning_stats || roadmap?.stats || {
    total_topics: 0,
    completed_topics: 0,
    skipped_topics: 0,
    progress_percentage: 0,
  };

  const practiceStats = roadmap?.practice_stats || {
    total_tasks: 0,
    completed_tasks: 0,
    in_progress_tasks: 0,
    progress_percentage: 0,
  };

  const getTopicStatus = (topic) => {
    if (localTopicStatuses[topic.id] !== undefined) {
      return localTopicStatuses[topic.id];
    }
    return topic.status;
  };

  const getTaskStatus = (task) => {
    if (localPracticeStatuses[task.id] !== undefined) {
      return localPracticeStatuses[task.id];
    }
    return task.status;
  };

  const handleUpdateTopicStatus = async (topicId, newStatus) => {
    setLocalTopicStatuses((prev) => ({ ...prev, [topicId]: newStatus }));
    setUpdatingId(topicId);
    try {
      await api.patch(`/learning/topics/${topicId}/progress/`, { status: newStatus });
      onRefreshRoadmap();
    } catch {
      onRefreshRoadmap();
    } finally {
      setUpdatingId(null);
    }
  };

  const handleUpdatePracticeStatus = async (taskId, newStatus) => {
    setLocalPracticeStatuses((prev) => ({ ...prev, [taskId]: newStatus }));
    setUpdatingId(taskId);
    try {
      await api.patch(`/learning/practice-tasks/${taskId}/progress/`, { status: newStatus });
      onRefreshRoadmap();
    } catch {
      onRefreshRoadmap();
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCheckboxToggle = (topic) => {
    const currentStatus = getTopicStatus(topic);
    const nextStatus = currentStatus === 'completed' ? 'not_started' : 'completed';
    handleUpdateTopicStatus(topic.id, nextStatus);
  };

  const difficultyColors = {
    Easy: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Medium: 'bg-amber-50 text-amber-700 border-amber-200',
    Hard: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  return (
    <div className="space-y-8">
      {/* Top Header Card with Metadata & Mode Tabs */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-2.5 py-1 rounded-md">
                {roadmap.target_salary || 'Flexible Salary Band'}
              </span>
              <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
                {roadmap.experience_level}
              </span>
              <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md">
                {roadmap.language} / {roadmap.framework || 'Standard'}
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

        {/* Roadmap Mode Switcher: Learning Roadmap vs Hands-on Practice Roadmap */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="inline-flex p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('learning')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'learning'
                  ? 'bg-white text-brand-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Learning Roadmap</span>
              <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600">
                {learningStats.completed_topics}/{learningStats.total_topics}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('practice')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'practice'
                  ? 'bg-white text-brand-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Code2 className="w-4 h-4" />
              <span>Practice Roadmap</span>
              <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600">
                {practiceStats.completed_tasks}/{practiceStats.total_tasks}
              </span>
            </button>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            {activeTab === 'learning'
              ? 'Structured engineering fundamentals, internals, and interview trade-offs.'
              : 'Hands-on coding exercises, SQL tasks, and architectural projects.'}
          </div>
        </div>

        {/* Global Progress Bar for Active Roadmap Mode */}
        <div className="pt-4 mt-4 border-t border-slate-100">
          <div className="flex justify-between items-center text-xs sm:text-sm font-semibold text-slate-700 mb-2">
            <span>
              {activeTab === 'learning' ? 'Overall Roadmap Mastery' : 'Overall Hands-on Practice Mastery'}
            </span>
            <span>
              {activeTab === 'learning' ? (
                <>
                  {learningStats.completed_topics} / {learningStats.total_topics} Topics Completed ({learningStats.progress_percentage}%)
                  {learningStats.skipped_topics > 0 && ` • ${learningStats.skipped_topics} Skipped`}
                </>
              ) : (
                <>
                  {practiceStats.completed_tasks} / {practiceStats.total_tasks} Tasks Completed ({practiceStats.progress_percentage}%)
                  {practiceStats.in_progress_tasks > 0 && ` • ${practiceStats.in_progress_tasks} In Progress`}
                </>
              )}
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
            <div
              className={`h-3 rounded-full transition-all duration-300 ${
                activeTab === 'learning' ? 'bg-brand-600' : 'bg-emerald-600'
              }`}
              style={{
                width: `${Math.max(
                  activeTab === 'learning'
                    ? learningStats.progress_percentage
                    : practiceStats.progress_percentage,
                  2
                )}%`,
              }}
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
                            className={`w-full px-3 py-2 rounded-lg text-left text-xs font-medium transition-all flex items-center justify-between ${
                              isSelectedWeek
                                ? 'bg-brand-50 text-brand-700 font-bold border border-brand-200'
                                : 'text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <span className="truncate">
                              Week {w.week_number}: {w.title}
                            </span>
                            <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded ml-2 shrink-0">
                              {activeTab === 'learning'
                                ? `${w.completed_topics || 0}/${w.total_topics || 0}`
                                : `${w.completed_tasks || 0}/${w.total_tasks || 0}`}
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

        {/* Right Column: Selected Week Content */}
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
                  {activeTab === 'learning'
                    ? `${currentWeek.completed_topics || 0} of ${currentWeek.total_topics || 0} topics verified`
                    : `${currentWeek.completed_tasks || 0} of ${currentWeek.total_tasks || 0} tasks completed`}
                </div>
              </div>

              {/* MODE 1: LEARNING TOPICS LIST */}
              {activeTab === 'learning' && (
                <div className="space-y-3 mb-8">
                  {currentWeek.topics.map((t) => {
                    const status = getTopicStatus(t);
                    const isCompleted = status === 'completed';
                    const isSkipped = status === 'skipped';
                    const isUpdating = updatingId === t.id;

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
                            className="mt-1 h-5 w-5 text-brand-600 border-slate-300 rounded focus:ring-brand-500 cursor-pointer"
                          />
                          <div>
                            <div className="flex items-center space-x-2">
                              <h3
                                className={`text-sm sm:text-base font-bold ${
                                  isCompleted ? 'text-slate-600 line-through' : 'text-slate-900'
                                }`}
                              >
                                {t.title}
                              </h3>
                              {isCompleted && (
                                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                                  Completed
                                </span>
                              )}
                              {isSkipped && (
                                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                                  Not Verified
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-3 text-xs text-slate-500 mt-1">
                              <span className="flex items-center">
                                <Clock className="w-3.5 h-3.5 mr-1" />
                                {t.estimated_minutes} minutes estimated
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-2 self-end sm:self-auto shrink-0">
                          {!isCompleted && !isSkipped && (
                            <button
                              type="button"
                              onClick={() => handleUpdateTopicStatus(t.id, 'skipped')}
                              disabled={isUpdating}
                              className="px-2.5 py-1 text-xs font-medium text-slate-500 hover:text-amber-700 hover:bg-amber-50 border border-slate-200 rounded-md transition-colors"
                            >
                              Skip
                            </button>
                          )}
                          {isSkipped && (
                            <button
                              type="button"
                              onClick={() => handleUpdateTopicStatus(t.id, 'completed')}
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
              )}

              {/* MODE 2: HANDS-ON PRACTICE TASKS LIST */}
              {activeTab === 'practice' && (
                <div className="space-y-4 mb-8">
                  {currentWeek.practice_tasks?.length > 0 ? (
                    currentWeek.practice_tasks.map((task) => {
                      const taskStatus = getTaskStatus(task);
                      const isCompleted = taskStatus === 'completed';
                      const isInProgress = taskStatus === 'in_progress';
                      const isUpdating = updatingId === task.id;

                      return (
                        <div
                          key={task.id}
                          className={`border rounded-xl p-5 transition-all ${
                            isCompleted
                              ? 'border-emerald-200 bg-emerald-50/20'
                              : isInProgress
                              ? 'border-blue-200 bg-blue-50/20'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-2">
                            <div>
                              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-100">
                                  {task.task_type?.replace(/_/g, ' ')}
                                </span>
                                <span
                                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                                    difficultyColors[task.difficulty] || 'bg-slate-100 text-slate-700'
                                  }`}
                                >
                                  {task.difficulty}
                                </span>
                                <span className="text-xs text-slate-500 flex items-center">
                                  <Clock className="w-3.5 h-3.5 mr-1" />
                                  {task.estimated_minutes} mins
                                </span>
                              </div>
                              <h3 className="text-base font-bold text-slate-900">{task.title}</h3>
                            </div>

                            {/* Status Pills */}
                            <div className="flex items-center space-x-1.5 self-start shrink-0">
                              <button
                                type="button"
                                onClick={() => handleUpdatePracticeStatus(task.id, 'not_started')}
                                disabled={isUpdating}
                                className={`px-2 py-1 text-[11px] font-semibold rounded-md border transition-all ${
                                  taskStatus === 'not_started'
                                    ? 'bg-slate-200 text-slate-800 border-slate-300'
                                    : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'
                                }`}
                              >
                                Not Started
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdatePracticeStatus(task.id, 'in_progress')}
                                disabled={isUpdating}
                                className={`px-2 py-1 text-[11px] font-semibold rounded-md border transition-all ${
                                  taskStatus === 'in_progress'
                                    ? 'bg-blue-100 text-blue-800 border-blue-300'
                                    : 'bg-white text-slate-500 border-slate-200 hover:bg-blue-50'
                                }`}
                              >
                                In Progress
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdatePracticeStatus(task.id, 'completed')}
                                disabled={isUpdating}
                                className={`px-2 py-1 text-[11px] font-semibold rounded-md border transition-all ${
                                  taskStatus === 'completed'
                                    ? 'bg-emerald-600 text-white border-emerald-600'
                                    : 'bg-white text-slate-500 border-slate-200 hover:bg-emerald-50 hover:text-emerald-700'
                                }`}
                              >
                                Completed
                              </button>
                            </div>
                          </div>

                          <p className="text-xs text-slate-600 mb-4 line-clamp-2">{task.objective}</p>

                          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
                            {task.related_topic_title ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveTab('learning');
                                  const linked = currentWeek.topics.find((t) => t.id === task.related_topic_id);
                                  if (linked) setActiveTopicForModal(linked);
                                }}
                                className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center space-x-1"
                              >
                                <BookOpen className="w-3.5 h-3.5 mr-1" />
                                <span>Reinforces: {task.related_topic_title}</span>
                              </button>
                            ) : (
                              <span />
                            )}

                            <button
                              type="button"
                              onClick={() => setActiveTaskForModal(task)}
                              className="inline-flex items-center px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg font-semibold transition-colors ml-auto"
                            >
                              <Terminal className="w-3.5 h-3.5 mr-1" />
                              View Task & Starter Code
                              <ArrowRight className="w-3.5 h-3.5 ml-1" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-12 text-center text-slate-500 text-xs">
                      No hands-on practice tasks generated for this week yet.
                    </div>
                  )}
                </div>
              )}

              {/* Weekly Technical Assessment Card */}
              <QuizOverviewCard
                weekNumber={currentWeek.week_number}
                weekTitle={currentWeek.title}
                overview={currentWeek.quiz_overview}
                onRefreshRoadmap={onRefreshRoadmap}
              />
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500">
              Select a phase and week to view learning content.
            </div>
          )}
        </div>
      </div>

      {/* Topic Content Drawer/Modal */}
      <TopicContentModal
        topic={activeTopicForModal}
        isOpen={!!activeTopicForModal}
        onClose={() => setActiveTopicForModal(null)}
        onUpdateStatus={handleUpdateTopicStatus}
      />

      {/* Hands-on Practice Task Modal */}
      <PracticeTaskModal
        task={activeTaskForModal}
        isOpen={!!activeTaskForModal}
        onClose={() => setActiveTaskForModal(null)}
        onStatusChanged={(taskId, newStatus) => {
          setLocalPracticeStatuses((prev) => ({ ...prev, [taskId]: newStatus }));
          onRefreshRoadmap();
        }}
        onOpenRelatedTopic={(topicObj) => {
          setActiveTaskForModal(null);
          setActiveTab('learning');
          const fullTopic = currentWeek.topics.find((t) => t.id === topicObj.id) || topicObj;
          setActiveTopicForModal(fullTopic);
        }}
      />

      {/* Roadmap Replacement Modal */}
      <RoadmapReplaceModal
        isOpen={replaceModalOpen}
        onClose={() => setReplaceModalOpen(false)}
        onConfirm={() => {
          setReplaceModalOpen(false);
          onRoadmapReplaced();
        }}
        currentRole={roadmap.role}
        targetSalary={roadmap.target_salary}
      />
    </div>
  );
}
