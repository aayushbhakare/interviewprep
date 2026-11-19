import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  PlusCircle,
  Building2,
  Briefcase,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  ThumbsUp,
  Edit,
  Trash2,
  Send,
  Eye,
  Loader2,
} from 'lucide-react';
import { experienceService } from '../../services/experienceService';

export default function MyExperiencesPage() {
  const navigate = useNavigate();

  const [experiences, setExperiences] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMyExperiences = async (status = '') => {
    setLoading(true);
    setError(null);
    try {
      const res = await experienceService.getMyExperiences(status === 'all' ? '' : status);
      if (res?.data) {
        setExperiences(res.data);
      } else {
        setExperiences([]);
      }
    } catch {
      setError('Failed to load your interview submissions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyExperiences(activeTab);
  }, [activeTab]);

  const handleDelete = async (expId) => {
    if (!window.confirm('Are you sure you want to delete this submission?')) return;
    try {
      await experienceService.deleteExperience(expId);
      setExperiences((prev) => prev.filter((item) => item.id !== expId));
    } catch {
      alert('Unable to delete submission.');
    }
  };

  const handlePublishDraft = async (expId) => {
    try {
      const res = await experienceService.publishExperience(expId);
      alert(res?.data?.message || 'Submission status updated.');
      fetchMyExperiences(activeTab);
    } catch (err) {
      alert(err?.response?.data?.message || 'Publishing failed.');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'published':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Published
          </span>
        );
      case 'pending_review':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
            <Clock className="w-3 h-3 mr-1" /> In Review
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
            <AlertTriangle className="w-3 h-3 mr-1" /> Revisions Needed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
            <FileText className="w-3 h-3 mr-1" /> Draft
          </span>
        );
    }
  };

  // Metrics
  const totalHelpful = experiences.reduce(
    (acc, curr) => acc + (curr.helpful_votes_count || 0),
    0
  );
  const totalPublished = experiences.filter((e) => e.status === 'published').length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/experiences"
          className="inline-flex items-center text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Public Feed
        </Link>
        <Link
          to="/experiences/new"
          className="inline-flex items-center px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 transition-colors shadow-sm"
        >
          <PlusCircle className="w-3.5 h-3.5 mr-1.5" /> Share New Story
        </Link>
      </div>

      {/* Header & Metrics */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            My Interview Stories & Submissions
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Manage your drafts, track pending moderation reviews, and update published recruitment journeys.
          </p>
        </div>

        <div className="flex items-center space-x-4 shrink-0">
          <div className="bg-purple-50 border border-purple-100 rounded-xl px-4 py-2.5 text-center">
            <p className="text-xs font-semibold text-purple-600 uppercase">Total Stories</p>
            <p className="text-xl font-extrabold text-purple-900">{experiences.length}</p>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2.5 text-center">
            <p className="text-xs font-semibold text-emerald-600 uppercase">Live Published</p>
            <p className="text-xl font-extrabold text-emerald-900">{totalPublished}</p>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-2.5 text-center">
            <p className="text-xs font-semibold text-amber-600 uppercase">Helpful Votes</p>
            <p className="text-xl font-extrabold text-amber-900">{totalHelpful}</p>
          </div>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
        {[
          { key: 'all', label: 'All Stories' },
          { key: 'draft', label: 'Drafts' },
          { key: 'pending_review', label: 'In Review' },
          { key: 'published', label: 'Published' },
          { key: 'rejected', label: 'Needs Revisions' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              activeTab === tab.key
                ? 'bg-brand-50 text-brand-700'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Experience Cards Feed */}
      {loading ? (
        <div className="py-12 flex justify-center items-center">
          <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center text-rose-700 text-sm">
          {error}
        </div>
      ) : experiences.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
          <Building2 className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900">No submissions found</h3>
          <p className="text-sm text-slate-600 mt-1 max-w-md mx-auto">
            You have not created any recruitment stories under this status tab. Share your interview experiences to help other students!
          </p>
          <Link
            to="/experiences/new"
            className="mt-4 inline-flex items-center px-4 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors shadow-sm"
          >
            <PlusCircle className="w-4 h-4 mr-1.5" /> Document An Interview
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {experiences.map((exp) => (
            <div
              key={exp.id}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-bold text-slate-900">{exp.company_name}</h3>
                    {getStatusBadge(exp.status)}
                    {exp.is_anonymous && (
                      <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        Anonymous
                      </span>
                    )}
                  </div>
                  <div className="flex items-center text-xs text-slate-600 mt-1 space-x-3">
                    <span className="flex items-center">
                      <Briefcase className="w-3.5 h-3.5 mr-1 text-slate-400" />
                      {exp.role}
                    </span>
                    {exp.salary_range && <span>• {exp.salary_range}</span>}
                    {exp.experience_level && <span>• {exp.experience_level}</span>}
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  {exp.status === 'published' && (
                    <div className="flex items-center text-xs font-semibold text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 mr-2">
                      <ThumbsUp className="w-3 h-3 mr-1 text-slate-500" />
                      {exp.helpful_votes_count || 0} Helpful
                    </div>
                  )}

                  {exp.status === 'draft' && (
                    <button
                      onClick={() => handlePublishDraft(exp.id)}
                      className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 transition-colors"
                      title="Submit for publication"
                    >
                      <Send className="w-3 h-3 mr-1" />
                      Publish
                    </button>
                  )}

                  <Link
                    to={`/experiences/${exp.id}`}
                    className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    View
                  </Link>

                  <Link
                    to={`/experiences/${exp.id}/edit`}
                    className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </Link>

                  <button
                    onClick={() => handleDelete(exp.id)}
                    className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-700 bg-white border border-rose-200 hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Delete
                  </button>
                </div>
              </div>

              {/* Rejection Alert Notice */}
              {exp.status === 'rejected' && exp.rejection_reason && (
                <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
                  <span className="font-bold">Moderator Notice: </span>
                  {exp.rejection_reason}
                </div>
              )}

              {/* In Review Notice */}
              {exp.status === 'pending_review' && (
                <div className="p-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg">
                  This submission is currently queued for policy review. If you already had a published version, it remains live to peers while this revision is reviewed.
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
