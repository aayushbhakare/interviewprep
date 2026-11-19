import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Briefcase,
  MapPin,
  Calendar,
  ThumbsUp,
  AlertTriangle,
  Clock,
  Layers,
  HelpCircle,
  CheckCircle2,
  XCircle,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  User,
  BookOpen,
} from 'lucide-react';
import { experienceService } from '../../services/experienceService';
import ExperienceReportModal from './ExperienceReportModal';

export default function ExperienceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [experience, setExperience] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Expanded stage tracking (all expanded by default)
  const [expandedStages, setExpandedStages] = useState({});

  // Report modal
  const [isReportOpen, setIsReportOpen] = useState(false);

  // Deletion confirm
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setLoading(true);
    experienceService
      .getExperienceDetail(id)
      .then((res) => {
        if (res?.data) {
          setExperience(res.data);
          // Expand all stages initially
          const initial = {};
          (res.data.stages || []).forEach((st, idx) => {
            initial[st.id || idx] = true;
          });
          setExpandedStages(initial);
        }
      })
      .catch((err) => {
        setError(err?.response?.data?.detail || 'Experience not found or unavailable.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  const toggleStage = (stageId) => {
    setExpandedStages((prev) => ({
      ...prev,
      [stageId]: !prev[stageId],
    }));
  };

  const handleToggleVote = async () => {
    try {
      const res = await experienceService.toggleHelpfulVote(id);
      if (res?.data) {
        setExperience((prev) => ({
          ...prev,
          helpful_votes_count: res.data.helpful_votes_count,
          has_voted: res.data.has_voted,
        }));
      }
    } catch {
      navigate('/login');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this interview experience?')) return;
    setIsDeleting(true);
    try {
      await experienceService.deleteExperience(id);
      navigate('/my-experiences');
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to delete experience.');
      setIsDeleting(false);
    }
  };

  const getOutcomeBadge = (outcome) => {
    switch (outcome?.toLowerCase()) {
      case 'selected':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Selected / Offered
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
            <XCircle className="w-3.5 h-3.5 mr-1" /> Rejected
          </span>
        );
      case 'awaited':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
            <Clock className="w-3.5 h-3.5 mr-1" /> Result Awaited
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800">
            {outcome || 'Completed'}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 animate-pulse space-y-4">
        <div className="h-6 bg-slate-200 rounded w-1/4" />
        <div className="h-10 bg-slate-200 rounded w-1/2" />
        <div className="h-32 bg-slate-100 rounded-xl" />
        <div className="h-48 bg-slate-100 rounded-xl" />
      </div>
    );
  }

  if (error || !experience) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-8 max-w-lg mx-auto">
          <AlertTriangle className="w-10 h-10 text-rose-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-900">Experience Unavailable</h3>
          <p className="text-sm text-slate-600 mt-1">{error}</p>
          <Link
            to="/experiences"
            className="mt-4 inline-flex items-center text-sm font-semibold text-brand-600 hover:text-brand-700"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Return to Experiences Feed
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Back Link */}
      <Link
        to="/experiences"
        className="inline-flex items-center text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to All Stories
      </Link>

      {/* Main Header Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2 text-brand-600 text-xs font-semibold uppercase tracking-wider mb-1">
              <Building2 className="w-4 h-4" />
              <span>{experience.company_name}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {experience.role}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mt-2">
              {experience.salary_range && (
                <span className="font-semibold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                  {experience.salary_range}
                </span>
              )}
              {experience.experience_level && <span>• {experience.experience_level}</span>}
              {experience.company_location && (
                <span className="flex items-center">
                  <MapPin className="w-3 h-3 mr-1 text-slate-400" />
                  {experience.company_location}
                </span>
              )}
              {experience.recruitment_year && (
                <span className="flex items-center">
                  <Calendar className="w-3 h-3 mr-1 text-slate-400" />
                  {experience.recruitment_year}
                </span>
              )}
            </div>
          </div>

          <div className="shrink-0">{getOutcomeBadge(experience.overall_outcome)}</div>
        </div>

        {/* Story Attribution & Action Buttons */}
        <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3 text-xs text-slate-500">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div>
              <p className="font-medium text-slate-800">
                {experience.author_display_name || 'Anonymous Candidate'}
              </p>
              <p className="text-[11px] text-slate-400">
                {experience.published_at
                  ? `Published on ${new Date(experience.published_at).toLocaleDateString()}`
                  : 'Draft / In Review'}{' '}
                {experience.published_version > 1 && `(Revision ${experience.published_version})`}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleToggleVote}
              className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                experience.has_voted
                  ? 'bg-brand-50 text-brand-700 border border-brand-200'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <ThumbsUp
                className={`w-3.5 h-3.5 mr-1.5 ${
                  experience.has_voted ? 'text-brand-600 fill-brand-600' : 'text-slate-500'
                }`}
              />
              <span>Helpful ({experience.helpful_votes_count || 0})</span>
            </button>

            <button
              onClick={() => setIsReportOpen(true)}
              className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 border border-slate-200 transition-colors"
              title="Report inappropriate content or policy violation"
            >
              <AlertTriangle className="w-3.5 h-3.5 mr-1" />
              Report
            </button>

            {experience.is_owner && (
              <>
                <Link
                  to={`/experiences/${experience.id}/edit`}
                  className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors"
                >
                  <Edit className="w-3.5 h-3.5 mr-1" />
                  Edit
                </Link>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-700 bg-white border border-rose-200 hover:bg-rose-50 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                  Delete
                </button>
              </>
            )}
          </div>
        </div>

        {/* Additional Context / Background */}
        {experience.additional_context && (
          <div className="mt-6 pt-6 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Recruitment Context & Background
            </h3>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {experience.additional_context}
            </p>
          </div>
        )}
      </div>

      {/* Chronological Recruitment Journey Stages */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-brand-600" />
            <h2 className="text-lg font-bold text-slate-900">
              Recruitment Journey ({experience.stages?.length || 0} Stages)
            </h2>
          </div>
        </div>

        {(experience.stages || []).map((stage, idx) => {
          const isExpanded = expandedStages[stage.id || idx];
          return (
            <div
              key={stage.id || idx}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm transition-all"
            >
              {/* Stage Header Accordion Toggle */}
              <div
                onClick={() => toggleStage(stage.id || idx)}
                className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50/80 transition-colors select-none"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-brand-50 text-brand-700 font-bold text-xs flex items-center justify-center shrink-0">
                    {stage.order || idx + 1}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 truncate">
                      {stage.custom_stage_name || stage.stage_type?.replace(/_/g, ' ').toUpperCase()}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-0.5">
                      {stage.interview_mode && <span>{stage.interview_mode}</span>}
                      {stage.difficulty && <span>• Difficulty: {stage.difficulty}</span>}
                      {stage.time_gap && <span>• Gap: {stage.time_gap}</span>}
                      {stage.result && (
                        <span className="font-semibold text-brand-700">• Result: {stage.result}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <span className="text-xs text-slate-400 font-medium">
                    {stage.questions?.length || 0} Questions
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </div>

              {/* Stage Details (Expanded) */}
              {isExpanded && (
                <div className="p-5 pt-0 border-t border-slate-100 space-y-4">
                  {stage.description && (
                    <div className="pt-3">
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                        Stage Overview & Format
                      </h4>
                      <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                        {stage.description}
                      </p>
                    </div>
                  )}

                  {/* Questions List */}
                  {stage.questions && stage.questions.length > 0 && (
                    <div className="pt-2 space-y-3">
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Interview Questions & Responses
                      </h4>
                      <div className="space-y-3">
                        {stage.questions.map((q, qIdx) => (
                          <div
                            key={q.id || qIdx}
                            className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 space-y-2.5"
                          >
                            <div className="flex items-start space-x-2">
                              <HelpCircle className="w-4 h-4 text-brand-600 mt-0.5 shrink-0" />
                              <div className="flex-1">
                                <p className="text-sm font-bold text-slate-900 leading-snug">
                                  {q.question_text}
                                </p>
                                {q.follow_up_text && (
                                  <p className="text-xs text-purple-700 mt-1 font-medium bg-purple-50 p-2 rounded-lg border border-purple-100">
                                    <span className="font-bold">Follow-up: </span>
                                    {q.follow_up_text}
                                  </p>
                                )}
                              </div>
                            </div>

                            {q.interviewer_approach && (
                              <div className="text-xs text-slate-600 pl-6 border-l-2 border-brand-200 ml-2">
                                <span className="font-semibold text-slate-700">
                                  Interviewer Expectations:{' '}
                                </span>
                                {q.interviewer_approach}
                              </div>
                            )}

                            {q.student_response && (
                              <div className="text-xs text-slate-700 pl-6 border-l-2 border-emerald-300 ml-2">
                                <span className="font-semibold text-emerald-800">
                                  Candidate's Response / Strategy:{' '}
                                </span>
                                {q.student_response}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {stage.additional_notes && (
                    <div className="pt-2">
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                        Tips & Stage Notes
                      </h4>
                      <p className="text-xs text-slate-600 bg-amber-50/50 p-3 rounded-lg border border-amber-100 leading-relaxed">
                        {stage.additional_notes}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Learn Module Integration Callout */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <BookOpen className="w-6 h-6 text-purple-600 shrink-0" />
          <div>
            <h4 className="text-sm font-bold text-purple-900">
              Student-Reported Questions in Learning Roadmap
            </h4>
            <p className="text-xs text-purple-700 mt-0.5">
              Verified questions extracted from peer stories appear directly inside relevant roadmap topics with full candidate context.
            </p>
          </div>
        </div>
        <Link
          to="/learn"
          className="inline-flex items-center px-3 py-1.5 text-xs font-bold text-purple-700 bg-white border border-purple-300 hover:bg-purple-100 rounded-lg shadow-sm shrink-0"
        >
          View Roadmap
        </Link>
      </div>

      {/* Report Modal */}
      <ExperienceReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        experienceId={id}
        onReportSubmitted={() => {
          setExperience((prev) => ({
            ...prev,
            reports_count: (prev.reports_count || 0) + 1,
          }));
        }}
      />
    </div>
  );
}
