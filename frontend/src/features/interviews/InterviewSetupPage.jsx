import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Code2,
  Users,
  Layers,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  FileText,
  Volume2,
  AlertCircle,
  Play,
  RotateCcw,
} from 'lucide-react';
import { interviewService } from '../../services/interviewService';
import CoolingPeriodCard from './CoolingPeriodCard';
import VoicePoCModal from './VoicePoCModal';

const ROLES = [
  'Backend Developer',
  'Frontend Developer',
  'Full Stack Developer',
  'Mobile Developer',
  'Data Engineer',
  'DevOps Engineer',
];

const EXPERIENCE_LEVELS = [
  'Fresher',
  'Less than 1 year',
  '1–3 years',
  '3–5 years',
  '5+ years',
];

const SALARY_RANGES = [
  'Below ₹3 LPA',
  '₹3–5 LPA',
  '₹5–7 LPA',
  '₹7–10 LPA',
  '₹10–15 LPA',
  '₹15+ LPA',
];

export default function InterviewSetupPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialType = searchParams.get('type') || 'technical';

  const [interviewType, setInterviewType] = useState(initialType);
  const [role, setRole] = useState('Backend Developer');
  const [experienceLevel, setExperienceLevel] = useState('Fresher');
  const [salaryRange, setSalaryRange] = useState('₹5–7 LPA');
  const [language, setLanguage] = useState('Python');
  const [framework, setFramework] = useState('Django');
  const [database, setDatabase] = useState('PostgreSQL');
  const [selectedResumeVersion, setSelectedResumeVersion] = useState('');

  const [availableResumes, setAvailableResumes] = useState([]);
  const [eligibilityData, setEligibilityData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [isPoCOpen, setIsPoCOpen] = useState(false);

  useEffect(() => {
    loadSetupData();
  }, []);

  const loadSetupData = async () => {
    setLoading(true);
    try {
      const [eligRes, prepRes] = await Promise.all([
        interviewService.getEligibility(),
        interviewService.getPrepopulateData(),
      ]);

      setEligibilityData(eligRes.data);
      const prep = prepRes.data;
      if (prep) {
        if (prep.role) setRole(prep.role);
        if (prep.experience_level) setExperienceLevel(prep.experience_level);
        if (prep.salary_range) setSalaryRange(prep.salary_range);
        if (prep.language) setLanguage(prep.language);
        if (prep.framework) setFramework(prep.framework);
        if (prep.database) setDatabase(prep.database);
        setAvailableResumes(prep.available_resumes || []);
        if (prep.current_resume_version) {
          setSelectedResumeVersion(String(prep.current_resume_version));
        }
      }
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to load setup configuration.');
    } finally {
      setLoading(false);
    }
  };

  const currentTypeEligibility = eligibilityData ? eligibilityData[interviewType] : null;
  const isTypeInCooling = currentTypeEligibility && !currentTypeEligibility.is_eligible;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const payload = {
        interview_type: interviewType,
        role,
        experience_level: experienceLevel,
        salary_range: salaryRange,
        language: interviewType === 'hr' ? '' : language,
        framework: interviewType === 'hr' ? '' : framework,
        database: interviewType === 'hr' ? '' : database,
        resume_version_reference: selectedResumeVersion ? parseInt(selectedResumeVersion, 10) : null,
      };

      const res = await interviewService.startSession(payload);
      const session = res.data;

      if (interviewType === 'mixed') {
        navigate(`/practice/interviews/${session.session_id}/mixed`);
      } else {
        navigate(`/practice/interviews/${session.session_id}/active`);
      }
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          err?.response?.data?.error?.message ||
          'Failed to initialize interview session.'
      );
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-slate-500">
        <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-medium">Configuring interview session parameters...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb Return */}
      <Link
        to="/practice"
        className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 mb-6 transition"
      >
        <ArrowLeft className="w-3.5 h-3.5 mr-1" />
        Back to Practice Hub
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-2.5 py-1 rounded-full border border-brand-200">
            Interactive Voice Simulation
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1.5">
            Configure Interview Practice Session
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Practice realistic recruitment rounds tailored to your target salary tier and technical stack.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsPoCOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg border border-slate-300 transition shrink-0"
        >
          <Volume2 className="w-3.5 h-3.5 text-indigo-600" />
          Test Audio / Mic PoC
        </button>
      </div>

      {/* Active Cooling Warning if Selected Type is Cooled Down */}
      {isTypeInCooling && (
        <CoolingPeriodCard
          coolingData={currentTypeEligibility}
          interviewType={interviewType}
          onExpired={loadSetupData}
        />
      )}

      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step 1: Select Interview Type */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <label className="text-sm font-bold text-slate-900 block mb-3">
            1. Select Interview Track
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Technical */}
            <button
              type="button"
              onClick={() => setInterviewType('technical')}
              className={`p-4 rounded-xl border-2 text-left transition flex flex-col justify-between ${
                interviewType === 'technical'
                  ? 'border-brand-600 bg-brand-50/40 ring-2 ring-brand-500/20'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div>
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2">
                  <Code2 className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Technical Interview</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  DSA, system architecture, language runtime, and scenario debugging.
                </p>
              </div>
              <span className="text-[11px] font-semibold text-brand-700 mt-3 block">
                Single Round • Voice
              </span>
            </button>

            {/* HR */}
            <button
              type="button"
              onClick={() => setInterviewType('hr')}
              className={`p-4 rounded-xl border-2 text-left transition flex flex-col justify-between ${
                interviewType === 'hr'
                  ? 'border-brand-600 bg-brand-50/40 ring-2 ring-brand-500/20'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
                  <Users className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">HR Interview</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Behavioral, situational, teamwork, and professional communication.
                </p>
              </div>
              <span className="text-[11px] font-semibold text-brand-700 mt-3 block">
                Single Round • Voice
              </span>
            </button>

            {/* Mixed */}
            <button
              type="button"
              onClick={() => setInterviewType('mixed')}
              className={`p-4 rounded-xl border-2 text-left transition flex flex-col justify-between ${
                interviewType === 'mixed'
                  ? 'border-brand-600 bg-brand-50/40 ring-2 ring-brand-500/20'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div>
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-2">
                  <Layers className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Mixed Recruitment</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Sequential 3–4 round simulation (Aptitude screening + Tech 1 & 2 + HR).
                </p>
              </div>
              <span className="text-[11px] font-semibold text-brand-700 mt-3 block">
                Multi-Round • 60% Cutoff
              </span>
            </button>
          </div>
        </div>

        {/* Step 2: Role, Experience & Salary Tier */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <label className="text-sm font-bold text-slate-900">
              2. Target Role & Compensation Standard
            </label>
            <button
              type="button"
              onClick={loadSetupData}
              className="text-xs text-brand-600 hover:text-brand-800 font-semibold flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Reset to Roadmap
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Role */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* Experience */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Experience Level
              </label>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                {EXPERIENCE_LEVELS.map((exp) => (
                  <option key={exp} value={exp}>
                    {exp}
                  </option>
                ))}
              </select>
            </div>

            {/* Salary Tier */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Salary Tier
              </label>
              <select
                value={salaryRange}
                onChange={(e) => setSalaryRange(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                {SALARY_RANGES.map((sal) => (
                  <option key={sal} value={sal}>
                    {sal}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Step 3: Tech Stack (Visible only for Technical & Mixed) */}
        {interviewType !== 'hr' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <label className="text-sm font-bold text-slate-900 block mb-3">
              3. Technology Stack Focus
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Programming Language
                </label>
                <input
                  type="text"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  placeholder="e.g. Python, JavaScript, Java"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Framework / Library
                </label>
                <input
                  type="text"
                  value={framework}
                  onChange={(e) => setFramework(e.target.value)}
                  placeholder="e.g. Django, React, Spring Boot"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Database / Storage
                </label>
                <input
                  type="text"
                  value={database}
                  onChange={(e) => setDatabase(e.target.value)}
                  placeholder="e.g. PostgreSQL, MongoDB, Redis"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Optional Resume Selection */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-slate-600" />
              <span>4. Resume Reference (Optional)</span>
            </label>
            <span className="text-[11px] text-slate-400">Snapshot preserved with session</span>
          </div>
          <p className="text-xs text-slate-500 mb-4 leading-relaxed">
            Selecting a resume version allows the AI interviewer to probe real projects and experiences highlighted on your CV.
          </p>

          {availableResumes.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">Standard Role-Based Questioning</h5>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                      Interviews will focus on your selected target role ({role}), tech stack, and compensation standard ({salaryRange}).
                    </p>
                  </div>
                </div>
                <span className="text-[10.5px] font-bold text-emerald-700 bg-emerald-100/70 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0">
                  Active
                </span>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">No resumes uploaded to your account yet.</span>
                <Link
                  to="/profile"
                  className="inline-flex items-center gap-1 font-semibold text-brand-600 hover:text-brand-700 hover:underline"
                >
                  Upload resume in Profile <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <select
                value={selectedResumeVersion}
                onChange={(e) => setSelectedResumeVersion(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-slate-300 bg-white text-slate-800 font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none shadow-xs"
              >
                <option value="">Do not use resume (Proceed with standard role questions)</option>
                {availableResumes.map((r) => (
                  <option key={r.version_number} value={r.version_number}>
                    Resume v{r.version_number}: {r.original_filename} ({Math.round(r.file_size_bytes / 1024)} KB)
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400">
                A read-only snapshot of your selected resume will be attached to this interview for question generation.
              </p>
            </div>
          )}
        </div>

        {/* Simulation Rules Briefing Card */}
        <div className="bg-indigo-50/60 border border-indigo-200 rounded-2xl p-5 text-indigo-950">
          <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-800 flex items-center gap-1.5 mb-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            Real-Time Voice Simulation Briefing
          </h4>
          <ul className="text-xs text-indigo-900/90 space-y-1.5 list-disc pl-4 leading-relaxed">
            <li>The AI interviewer speaks verbally and asks one question at a time.</li>
            <li>Speak clearly into your microphone; the system uses automatic silence detection to recognize when you finish speaking.</li>
            <li>You can interrupt the interviewer manually at any time by clicking "Interrupt Interviewer".</li>
            <li>If you do not know an answer, simply state so verbally—there is no penalty for honest communication.</li>
            <li>Final evaluation produces a strictly binary <strong>PASS</strong> or <strong>FAIL</strong> with structured constructive feedback.</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2">
          <Link
            to="/practice"
            className="px-5 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={submitting || isTypeInCooling}
            className="inline-flex items-center gap-2 px-8 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Initializing Simulation...</span>
              </>
            ) : isTypeInCooling ? (
              <>Cooling Period Active</>
            ) : (
              <>
                <Play className="w-4 h-4" /> Start Voice Interview Simulation
              </>
            )}
          </button>
        </div>
      </form>

      {/* Voice PoC Diagnostics Modal */}
      <VoicePoCModal isOpen={isPoCOpen} onClose={() => setIsPoCOpen(false)} />
    </div>
  );
}
