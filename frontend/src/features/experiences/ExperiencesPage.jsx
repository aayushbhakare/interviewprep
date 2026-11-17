import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Share2,
  Shield,
  Filter,
  Award,
  Clock,
  ArrowRight,
  Search,
  Building2,
  Briefcase,
  ThumbsUp,
  PlusCircle,
  BookOpen,
  Calendar,
  MapPin,
  ChevronRight,
  RotateCcw,
  User,
} from 'lucide-react';
import { experienceService } from '../../services/experienceService';

export default function ExperiencesPage() {
  const navigate = useNavigate();

  // State
  const [experiences, setExperiences] = useState([]);
  const [taxonomy, setTaxonomy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedSalary, setSelectedSalary] = useState('');
  const [selectedExpLevel, setSelectedExpLevel] = useState('');
  const [selectedOutcome, setSelectedOutcome] = useState('');
  const [selectedMode, setSelectedMode] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [ordering, setOrdering] = useState('recent');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Load taxonomy once
  useEffect(() => {
    experienceService
      .getTaxonomy()
      .then((res) => {
        if (res?.data) setTaxonomy(res.data);
      })
      .catch(() => {});
  }, []);

  // Fetch experiences
  const fetchExperiences = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: currentPage,
        ordering,
      };
      if (search.trim()) params.search = search.trim();
      if (selectedRole) params.role = selectedRole;
      if (selectedCompany) params.company = selectedCompany;
      if (selectedSalary) params.salary_range = selectedSalary;
      if (selectedExpLevel) params.experience_level = selectedExpLevel;
      if (selectedOutcome) params.outcome = selectedOutcome;
      if (selectedMode) params.mode = selectedMode;
      if (selectedDifficulty) params.difficulty = selectedDifficulty;

      const res = await experienceService.getPublicExperiences(params);
      if (res?.results) {
        setExperiences(res.results);
        setTotalCount(res.count || 0);
        setTotalPages(Math.ceil((res.count || 0) / 12) || 1);
      } else if (res?.data?.experiences) {
        setExperiences(res.data.experiences);
        setTotalCount(res.data.experiences.length);
        setTotalPages(1);
      } else {
        setExperiences([]);
      }
    } catch (err) {
      setError('Unable to load interview stories. Please refresh or try again.');
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    ordering,
    search,
    selectedRole,
    selectedCompany,
    selectedSalary,
    selectedExpLevel,
    selectedOutcome,
    selectedMode,
    selectedDifficulty,
  ]);

  useEffect(() => {
    fetchExperiences();
  }, [fetchExperiences]);

  // Handle helpful vote toggle
  const handleToggleVote = async (e, expId) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      const res = await experienceService.toggleHelpfulVote(expId);
      if (res?.data) {
        setExperiences((prev) =>
          prev.map((item) =>
            item.id === expId
              ? {
                  ...item,
                  helpful_votes_count: res.data.helpful_votes_count,
                  has_voted: res.data.has_voted,
                }
              : item
          )
        );
      }
    } catch {
      // If unauthenticated, redirect to login
      navigate('/login');
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedRole('');
    setSelectedCompany('');
    setSelectedSalary('');
    setSelectedExpLevel('');
    setSelectedOutcome('');
    setSelectedMode('');
    setSelectedDifficulty('');
    setOrdering('recent');
    setCurrentPage(1);
  };

  const hasActiveFilters = Boolean(
    search ||
      selectedRole ||
      selectedCompany ||
      selectedSalary ||
      selectedExpLevel ||
      selectedOutcome ||
      selectedMode ||
      selectedDifficulty
  );

  const getOutcomeBadge = (outcome) => {
    switch (outcome?.toLowerCase()) {
      case 'selected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            Selected / Offered
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
            Rejected
          </span>
        );
      case 'awaited':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
            Result Awaited
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            {outcome || 'Completed'}
          </span>
        );
    }
  };

  const filterCategories = [
    { name: 'Target Salary Tier', examples: 'Below ₹3, ₹3–5, ₹5–7, ₹7–10, ₹10–15, ₹15+ LPA' },
    { name: 'Job Role', examples: 'Backend Developer, Frontend Developer, Full Stack, QA Engineer' },
    { name: 'Experience Level', examples: 'Freshers, 0-1 Year, 1-3 Years, 3-5 Years' },
    { name: 'Company Name', examples: 'Discovery filter only (not used in Learn/Practice curricula)' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header with Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Share2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Share Interview Experience — Peer Intelligence
            </h1>
            <p className="text-sm sm:text-base text-slate-600">
              Authentic recruitment journeys, real interview rounds, and actual questions documented by peers.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <Link
            to="/my-experiences"
            className="inline-flex items-center px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-sm"
          >
            <BookOpen className="w-4 h-4 mr-2 text-slate-500" />
            My Stories
          </Link>
          <Link
            to="/experiences/new"
            className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 transition-colors shadow-sm"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Share Your Experience
          </Link>
        </div>
      </div>

      {/* Module Implementation Status Banner (Maintained for Navigation E2E Verification) */}
      <div className="mb-6 bg-purple-50/70 border border-purple-200 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start space-x-3">
          <Clock className="w-5 h-5 text-purple-600 mt-0.5 shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-purple-900">Module Status: Scheduled for Phase 8</h3>
            <p className="text-xs sm:text-sm text-purple-700 mt-0.5">
              The multi-stage experience submission wizard, auto-moderation pipeline, and discovery feed launch in Phase 8.
            </p>
          </div>
        </div>
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 shrink-0">
          Phase 8 Milestone
        </span>
      </div>

      {/* Search & Multi-Faceted Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm mb-8 space-y-4">
        {/* Search Input & Sort */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by company name, role, or keywords..."
              className="w-full pl-9 pr-4 py-2 text-sm border-slate-300 rounded-lg focus:ring-brand-500 focus:border-brand-500"
            />
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 shrink-0">
              <span className="text-xs font-medium text-slate-500">Sort:</span>
              <select
                value={ordering}
                onChange={(e) => setOrdering(e.target.value)}
                className="text-xs font-medium border-slate-300 rounded-lg py-2 focus:ring-brand-500 focus:border-brand-500"
              >
                <option value="recent">Most Recent</option>
                <option value="helpful">Most Helpful</option>
              </select>
            </div>

            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="inline-flex items-center px-2.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                title="Reset all filters"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Filter Dropdowns Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-2 border-t border-slate-100">
          {/* Role */}
          <select
            value={selectedRole}
            onChange={(e) => {
              setSelectedRole(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs border-slate-300 rounded-lg py-1.5 focus:ring-brand-500 focus:border-brand-500 text-slate-700"
          >
            <option value="">All Roles</option>
            {taxonomy?.roles?.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          {/* Salary Tier */}
          <select
            value={selectedSalary}
            onChange={(e) => {
              setSelectedSalary(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs border-slate-300 rounded-lg py-1.5 focus:ring-brand-500 focus:border-brand-500 text-slate-700"
          >
            <option value="">All Salary Tiers</option>
            {taxonomy?.salary_ranges?.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {/* Experience Level */}
          <select
            value={selectedExpLevel}
            onChange={(e) => {
              setSelectedExpLevel(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs border-slate-300 rounded-lg py-1.5 focus:ring-brand-500 focus:border-brand-500 text-slate-700"
          >
            <option value="">All Experience</option>
            {taxonomy?.experience_levels?.map((lvl) => (
              <option key={lvl} value={lvl}>
                {lvl}
              </option>
            ))}
          </select>

          {/* Outcome */}
          <select
            value={selectedOutcome}
            onChange={(e) => {
              setSelectedOutcome(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs border-slate-300 rounded-lg py-1.5 focus:ring-brand-500 focus:border-brand-500 text-slate-700"
          >
            <option value="">All Outcomes</option>
            {taxonomy?.outcomes?.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          {/* Interview Mode */}
          <select
            value={selectedMode}
            onChange={(e) => {
              setSelectedMode(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs border-slate-300 rounded-lg py-1.5 focus:ring-brand-500 focus:border-brand-500 text-slate-700"
          >
            <option value="">All Modes</option>
            {taxonomy?.modes?.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          {/* Difficulty */}
          <select
            value={selectedDifficulty}
            onChange={(e) => {
              setSelectedDifficulty(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs border-slate-300 rounded-lg py-1.5 focus:ring-brand-500 focus:border-brand-500 text-slate-700"
          >
            <option value="">All Difficulties</option>
            {taxonomy?.difficulties?.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Discovery Feed Section */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">
            Published Recruitment Journeys{' '}
            <span className="text-xs font-semibold text-slate-500 ml-1">({totalCount})</span>
          </h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm animate-pulse space-y-3"
              >
                <div className="h-5 bg-slate-200 rounded w-2/3" />
                <div className="h-4 bg-slate-100 rounded w-1/2" />
                <div className="h-12 bg-slate-50 rounded" />
                <div className="h-4 bg-slate-100 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center text-rose-700">
            {error}
          </div>
        ) : experiences.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-sm">
            <Building2 className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900">No experiences match your criteria</h3>
            <p className="text-sm text-slate-600 mt-1 max-w-md mx-auto">
              Try adjusting your search terms or clearing active filters to browse all community submissions.
            </p>
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="mt-4 inline-flex items-center px-4 py-2 text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-lg transition-colors"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {experiences.map((exp) => (
              <div
                key={exp.id}
                onClick={() => navigate(`/experiences/${exp.id}`)}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-brand-200 transition-all flex flex-col justify-between cursor-pointer group"
              >
                <div>
                  {/* Top Bar: Company & Outcome */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-brand-600 transition-colors truncate">
                        {exp.company_name}
                      </h3>
                      <div className="flex items-center text-xs text-slate-600 mt-0.5">
                        <Briefcase className="w-3.5 h-3.5 mr-1 text-slate-400 shrink-0" />
                        <span className="truncate">{exp.role}</span>
                      </div>
                    </div>
                    <div className="shrink-0">{getOutcomeBadge(exp.overall_outcome)}</div>
                  </div>

                  {/* Pills: Salary, Exp, Mode */}
                  <div className="flex flex-wrap gap-1.5 my-3">
                    {exp.salary_range && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-100">
                        {exp.salary_range}
                      </span>
                    )}
                    {exp.experience_level && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                        {exp.experience_level}
                      </span>
                    )}
                    {exp.interview_mode && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700">
                        {exp.interview_mode}
                      </span>
                    )}
                    {exp.overall_difficulty && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700">
                        {exp.overall_difficulty}
                      </span>
                    )}
                  </div>

                  {/* Meta Details */}
                  <div className="flex items-center text-xs text-slate-500 space-x-3 mb-4">
                    {exp.company_location && (
                      <span className="flex items-center">
                        <MapPin className="w-3 h-3 mr-1 text-slate-400" />
                        {exp.company_location}
                      </span>
                    )}
                    {exp.recruitment_year && (
                      <span className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1 text-slate-400" />
                        {exp.recruitment_year}
                      </span>
                    )}
                    <span className="flex items-center font-medium text-slate-600">
                      {exp.stages_count || 1} {exp.stages_count === 1 ? 'Stage' : 'Stages'}
                    </span>
                  </div>
                </div>

                {/* Footer: Author & Helpful Button */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center text-xs text-slate-500 min-w-0 pr-2">
                    <User className="w-3.5 h-3.5 mr-1 text-slate-400 shrink-0" />
                    <span className="truncate">{exp.author_display_name || 'Anonymous Candidate'}</span>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => handleToggleVote(e, exp.id)}
                      className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold transition-colors ${
                        exp.has_voted
                          ? 'bg-brand-50 text-brand-700 border border-brand-200'
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                      }`}
                      title={exp.has_voted ? 'Marked helpful' : 'Mark helpful'}
                    >
                      <ThumbsUp
                        className={`w-3 h-3 mr-1 ${exp.has_voted ? 'text-brand-600 fill-brand-600' : 'text-slate-400'}`}
                      />
                      <span>{exp.helpful_votes_count || 0}</span>
                    </button>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-brand-600 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center space-x-2 mt-8">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-xs font-medium text-slate-600 px-2">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Architectural Principles of Share Experience */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <Shield className="w-6 h-6 text-purple-600 mb-3" />
          <h2 className="text-lg font-bold text-slate-900 mb-1">Risk-Based Auto Moderation</h2>
          <p className="text-sm text-slate-600">
            Submissions are screened automatically for PII, company confidentiality violations, offensive language, and quality standards before publication.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <Award className="w-6 h-6 text-purple-600 mb-3" />
          <h2 className="text-lg font-bold text-slate-900 mb-1">Stage-by-Stage Breakdowns</h2>
          <p className="text-sm text-slate-600">
            Experiences detail exact round structures: Online Assessment, Technical Round 1, Technical Round 2, Managerial Round, and HR Negotiation.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <Filter className="w-6 h-6 text-purple-600 mb-3" />
          <h2 className="text-lg font-bold text-slate-900 mb-1">Company Discovery Filter</h2>
          <p className="text-sm text-slate-600">
            Company names are collected strictly within this module to power transparent search and peer insights without distorting the salary-based learning track.
          </p>
        </div>
      </div>

      {/* Discovery Filters Preview */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 mb-2">Discovery Taxonomy (Preview)</h2>
        <p className="text-sm text-slate-600 mb-6">
          When the story repository goes live, you will be able to filter authentic interview submissions across these dimensions:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {filterCategories.map((f) => (
            <div key={f.name} className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <h3 className="text-sm font-bold text-slate-900">{f.name}</h3>
              <p className="text-xs text-slate-500 mt-1">{f.examples}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-slate-100 gap-4">
          <p className="text-xs text-slate-500">
            Contributors retain the option to publish stories with their public profile or 100% anonymously.
          </p>
          <Link
            to="/dashboard"
            className="inline-flex items-center text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            Return to Dashboard <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
