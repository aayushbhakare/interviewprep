import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Briefcase,
  Layers,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Save,
  Send,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  Loader2,
  Lock,
  CornerDownRight,
  Target,
  Lightbulb,
} from 'lucide-react';
import { experienceService } from '../../services/experienceService';

const STAGE_TYPES = [
  { value: 'application', label: 'Application & Resume Screening' },
  { value: 'aptitude_test', label: 'Online Aptitude / Coding Test' },
  { value: 'technical_1', label: 'Technical Round 1 (Foundations & DSA)' },
  { value: 'technical_2', label: 'Technical Round 2 (Frameworks & Systems)' },
  { value: 'technical_3', label: 'Technical Round 3 (Live Architecture / DB)' },
  { value: 'managerial', label: 'Managerial / Leadership Round' },
  { value: 'hr', label: 'HR & Culture Discussion' },
  { value: 'offer', label: 'Offer Negotiation & Closure' },
  { value: 'other', label: 'Other Custom Round' },
];

export default function ExperienceEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(isEditing);
  const [savingDraft, setSavingDraft] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState(null);
  const [issues, setIssues] = useState([]);
  const [successMsg, setSuccessMsg] = useState(null);

  // Form State
  const [companyName, setCompanyName] = useState('');
  const [role, setRole] = useState('Backend Developer');
  const [experienceLevel, setExperienceLevel] = useState('Fresher');
  const [salaryRange, setSalaryRange] = useState('₹6 - ₹10 LPA');
  const [companyLocation, setCompanyLocation] = useState('');
  const [recruitmentYear, setRecruitmentYear] = useState(new Date().getFullYear());
  const [jobType, setJobType] = useState('Full-time');
  const [interviewMode, setInterviewMode] = useState('Online');
  const [overallDifficulty, setOverallDifficulty] = useState('Medium');
  const [overallOutcome, setOverallOutcome] = useState('selected');
  const [additionalContext, setAdditionalContext] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [status, setStatus] = useState('draft');

  // Stages State
  const [stages, setStages] = useState([
    {
      stage_type: 'aptitude_test',
      custom_stage_name: 'Online Screening Round',
      order: 1,
      interview_mode: 'Online',
      difficulty: 'Medium',
      result: 'Cleared',
      description: 'Online test with 30 aptitude questions and 2 core coding problems.',
      additional_notes: '',
      questions: [
        {
          question_text: '',
          follow_up_text: '',
          interviewer_approach: '',
          student_response: '',
          order: 1,
        },
      ],
    },
  ]);

  // Load existing experience if editing
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    experienceService
      .getExperienceDetail(id)
      .then((res) => {
        if (res?.data) {
          const exp = res.data;
          setCompanyName(exp.company_name || '');
          setRole(exp.role || '');
          setExperienceLevel(exp.experience_level || 'Fresher');
          setSalaryRange(exp.salary_range || '₹6 - ₹10 LPA');
          setCompanyLocation(exp.company_location || '');
          setRecruitmentYear(exp.recruitment_year || new Date().getFullYear());
          setJobType(exp.job_type || 'Full-time');
          setInterviewMode(exp.interview_mode || 'Online');
          setOverallDifficulty(exp.overall_difficulty || 'Medium');
          setOverallOutcome(exp.overall_outcome || 'selected');
          setAdditionalContext(exp.additional_context || '');
          setIsAnonymous(Boolean(exp.is_anonymous));
          setStatus(exp.status || 'draft');

          if (exp.stages && exp.stages.length > 0) {
            setStages(
              exp.stages.map((st, sIdx) => ({
                ...st,
                order: sIdx + 1,
                questions: (st.questions || []).map((q, qIdx) => ({
                  ...q,
                  order: qIdx + 1,
                })),
              }))
            );
          }
        }
      })
      .catch((err) => {
        setError(err?.response?.data?.detail || 'Failed to load experience for editing.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  // Stages handlers
  const handleAddStage = () => {
    setStages((prev) => [
      ...prev,
      {
        stage_type: 'technical_1',
        custom_stage_name: '',
        order: prev.length + 1,
        interview_mode: interviewMode,
        difficulty: 'Medium',
        result: 'Cleared',
        description: '',
        additional_notes: '',
        questions: [
          {
            question_text: '',
            follow_up_text: '',
            interviewer_approach: '',
            student_response: '',
            order: 1,
          },
        ],
      },
    ]);
  };

  const handleRemoveStage = (index) => {
    if (stages.length === 1) {
      alert('Your recruitment story must include at least one round or stage.');
      return;
    }
    setStages((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleMoveStage = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= stages.length) return;
    setStages((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy.map((st, i) => ({ ...st, order: i + 1 }));
    });
  };

  const handleUpdateStage = (index, field, value) => {
    setStages((prev) =>
      prev.map((st, idx) => (idx === index ? { ...st, [field]: value } : st))
    );
  };

  // Questions handlers
  const handleAddQuestion = (stageIndex) => {
    setStages((prev) =>
      prev.map((st, idx) => {
        if (idx !== stageIndex) return st;
        return {
          ...st,
          questions: [
            ...st.questions,
            {
              question_text: '',
              follow_up_text: '',
              interviewer_approach: '',
              student_response: '',
              order: st.questions.length + 1,
            },
          ],
        };
      })
    );
  };

  const handleRemoveQuestion = (stageIndex, qIndex) => {
    setStages((prev) =>
      prev.map((st, idx) => {
        if (idx !== stageIndex) return st;
        return {
          ...st,
          questions: st.questions.filter((_, i) => i !== qIndex),
        };
      })
    );
  };

  const handleUpdateQuestion = (stageIndex, qIndex, field, value) => {
    setStages((prev) =>
      prev.map((st, sIdx) => {
        if (sIdx !== stageIndex) return st;
        const updatedQs = st.questions.map((q, i) =>
          i === qIndex ? { ...q, [field]: value } : q
        );
        return { ...st, questions: updatedQs };
      })
    );
  };

  // Prepare Payload
  const getPayload = () => {
    return {
      company_name: companyName.trim(),
      role: role.trim(),
      experience_level: experienceLevel,
      salary_range: salaryRange,
      company_location: companyLocation.trim(),
      recruitment_year: parseInt(recruitmentYear, 10) || null,
      job_type: jobType,
      interview_mode: interviewMode,
      overall_difficulty: overallDifficulty,
      overall_outcome: overallOutcome,
      additional_context: additionalContext.trim(),
      is_anonymous: isAnonymous,
      stages: stages.map((st, sIdx) => ({
        stage_type: st.stage_type,
        custom_stage_name: st.custom_stage_name?.trim() || '',
        order: sIdx + 1,
        interview_mode: st.interview_mode || '',
        difficulty: st.difficulty || '',
        result: st.result || '',
        description: st.description?.trim() || '',
        additional_notes: st.additional_notes?.trim() || '',
        questions: (st.questions || [])
          .filter((q) => q.question_text?.trim())
          .map((q, qIdx) => ({
            question_text: q.question_text.trim(),
            follow_up_text: q.follow_up_text?.trim() || '',
            interviewer_approach: q.interviewer_approach?.trim() || '',
            student_response: q.student_response?.trim() || '',
            order: qIdx + 1,
          })),
      })),
    };
  };

  // Save as private draft
  const handleSaveDraft = async () => {
    setSavingDraft(true);
    setError(null);
    setIssues([]);
    try {
      const payload = getPayload();
      const res = await experienceService.saveDraft(payload, id || null);
      setSuccessMsg('Draft saved successfully.');
      if (!id && res?.data?.id) {
        navigate(`/experiences/${res.data.id}/edit`, { replace: true });
      }
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setError(err?.response?.data?.detail || err?.response?.data?.message || 'Failed to save draft.');
    } finally {
      setSavingDraft(false);
    }
  };

  // Publish / Submit Experience
  const handlePublish = async (e) => {
    e.preventDefault();
    if (!companyName.trim()) {
      setError('Company name is required.');
      return;
    }
    if (!role.trim()) {
      setError('Role title is required.');
      return;
    }

    setPublishing(true);
    setError(null);
    setIssues([]);
    try {
      const payload = getPayload();
      let res;
      if (status === 'published' && id) {
        res = await experienceService.editPublishedExperience(id, payload);
      } else {
        // If draft not saved to backend yet, save draft first
        let currentId = id;
        if (!currentId) {
          const draftRes = await experienceService.saveDraft(payload);
          currentId = draftRes.data.id;
        }
        res = await experienceService.publishExperience(currentId, payload);
      }

      const resultData = res?.data || {};
      if (resultData.status === 'published') {
        alert('Your interview experience has been published successfully!');
        navigate(`/experiences/${resultData.experience_id || id}`);
      } else if (resultData.status === 'pending_review') {
        alert(
          resultData.message ||
            'Your submission has been queued for administrative review. Thank you for contributing!'
        );
        navigate('/my-experiences');
      } else if (resultData.status === 'rejected') {
        setError('Submission requires updates before publication.');
        setIssues(resultData.issues || [resultData.rejection_reason]);
      } else {
        navigate('/my-experiences');
      }
    } catch (err) {
      const errorData = err?.response?.data;
      setError(errorData?.message || errorData?.detail || 'Failed to publish interview experience.');
      if (errorData?.issues) setIssues(errorData.issues);
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 animate-pulse space-y-4">
        <div className="h-6 bg-slate-200 rounded w-1/4" />
        <div className="h-10 bg-slate-200 rounded w-1/2" />
        <div className="h-48 bg-slate-100 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          to={isEditing ? `/experiences/${id}` : '/experiences'}
          className="inline-flex items-center text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Return
        </Link>
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {isEditing ? `Editing Submission (${status.replace(/_/g, ' ')})` : 'New Interview Story'}
        </span>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {isEditing ? 'Update Interview Experience' : 'Document Your Recruitment Experience'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600">
              Share authentic round-by-round details to help students prepare for technical and HR standards.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">{error}</p>
              {issues.length > 0 && (
                <ul className="list-disc list-inside mt-2 text-xs space-y-1">
                  {issues.map((iss, i) => (
                    <li key={i}>{iss}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 shrink-0" />
            <span className="font-semibold">{successMsg}</span>
          </div>
        )}

        <form onSubmit={handlePublish} className="space-y-8">
          {/* Section 1: Basic Information */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 pb-2 border-b border-slate-100 flex items-center">
              <Briefcase className="w-4 h-4 mr-2 text-brand-600" />
              1. Basic Recruitment Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Company Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Google, Flipkart, Infosys, Startup..."
                  required
                  className="w-full text-sm rounded-lg border-slate-300 focus:ring-brand-500 focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Job Role <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Backend Developer, SDE 1, QA Analyst..."
                  required
                  className="w-full text-sm rounded-lg border-slate-300 focus:ring-brand-500 focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target / Offered Salary Range
                </label>
                <select
                  value={salaryRange}
                  onChange={(e) => setSalaryRange(e.target.value)}
                  className="w-full text-sm rounded-lg border-slate-300 focus:ring-brand-500 focus:border-brand-500"
                >
                  <option value="₹3 - ₹6 LPA">₹3 - ₹6 LPA</option>
                  <option value="₹6 - ₹10 LPA">₹6 - ₹10 LPA</option>
                  <option value="₹10 - ₹18 LPA">₹10 - ₹18 LPA</option>
                  <option value="₹18 - ₹30 LPA">₹18 - ₹30 LPA</option>
                  <option value="₹30+ LPA">₹30+ LPA</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Candidate Experience Level
                </label>
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                  className="w-full text-sm rounded-lg border-slate-300 focus:ring-brand-500 focus:border-brand-500"
                >
                  <option value="Fresher">Fresher</option>
                  <option value="0-1 Years">0-1 Years</option>
                  <option value="1-3 Years">1-3 Years</option>
                  <option value="3-5 Years">3-5 Years</option>
                  <option value="5+ Years">5+ Years</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Location (City / Remote)
                </label>
                <input
                  type="text"
                  value={companyLocation}
                  onChange={(e) => setCompanyLocation(e.target.value)}
                  placeholder="e.g. Bengaluru, Pune, Hyderabad, Remote"
                  className="w-full text-sm rounded-lg border-slate-300 focus:ring-brand-500 focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Recruitment Year
                </label>
                <input
                  type="number"
                  value={recruitmentYear}
                  onChange={(e) => setRecruitmentYear(e.target.value)}
                  min="2020"
                  max="2030"
                  className="w-full text-sm rounded-lg border-slate-300 focus:ring-brand-500 focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Job Type
                </label>
                <select
                  value={jobType}
                  onChange={(e) => setJobType(e.target.value)}
                  className="w-full text-sm rounded-lg border-slate-300 focus:ring-brand-500 focus:border-brand-500"
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Internship">Internship</option>
                  <option value="Contract">Contract</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Primary Interview Mode
                </label>
                <select
                  value={interviewMode}
                  onChange={(e) => setInterviewMode(e.target.value)}
                  className="w-full text-sm rounded-lg border-slate-300 focus:ring-brand-500 focus:border-brand-500"
                >
                  <option value="Online">Online / Video Call</option>
                  <option value="Offline">Offline / In-person</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Overall Difficulty
                </label>
                <select
                  value={overallDifficulty}
                  onChange={(e) => setOverallDifficulty(e.target.value)}
                  className="w-full text-sm rounded-lg border-slate-300 focus:ring-brand-500 focus:border-brand-500"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                  <option value="Very Hard">Very Hard</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Final Recruitment Outcome
                </label>
                <select
                  value={overallOutcome}
                  onChange={(e) => setOverallOutcome(e.target.value)}
                  className="w-full text-sm rounded-lg border-slate-300 focus:ring-brand-500 focus:border-brand-500"
                >
                  <option value="selected">Selected / Offered</option>
                  <option value="rejected">Rejected</option>
                  <option value="awaited">Result Awaited</option>
                  <option value="withdrew">Withdrew / Did Not Complete</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Recruitment Context & Background
              </label>
              <textarea
                value={additionalContext}
                onChange={(e) => setAdditionalContext(e.target.value)}
                rows={3}
                placeholder="Describe how you applied (referral, career portal, on-campus), preparation timeline, and overall experience..."
                className="w-full text-sm rounded-lg border-slate-300 focus:ring-brand-500 focus:border-brand-500"
              />
            </div>

            {/* Anonymous Publishing Toggle */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start space-x-3">
              <input
                type="checkbox"
                id="isAnonymous"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="mt-1 h-4 w-4 text-brand-600 focus:ring-brand-500 border-slate-300 rounded"
              />
              <label htmlFor="isAnonymous" className="text-xs text-slate-700 cursor-pointer">
                <span className="font-bold text-slate-900 block">Publish Anonymously</span>
                Mask your name and profile publicly. You retain full authorship and ownership, but peers will see "Anonymous Candidate".
              </label>
            </div>
          </div>

          {/* Section 2: Flexible Recruitment Journey Stages */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center">
                <Layers className="w-4 h-4 mr-2 text-brand-600" />
                2. Recruitment Stages ({stages.length})
              </h2>

              <button
                type="button"
                onClick={handleAddStage}
                className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200 rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Stage
              </button>
            </div>

            <div className="space-y-6">
              {stages.map((st, sIdx) => (
                <div
                  key={sIdx}
                  className="bg-white border-2 border-slate-200 rounded-xl p-5 shadow-sm space-y-4"
                >
                  {/* Stage Top Bar */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center space-x-2">
                      <span className="w-6 h-6 rounded-full bg-brand-600 text-white font-bold text-xs flex items-center justify-center">
                        {sIdx + 1}
                      </span>
                      <span className="text-sm font-bold text-slate-900">Stage {sIdx + 1}</span>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => handleMoveStage(sIdx, -1)}
                        disabled={sIdx === 0}
                        className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded"
                        title="Move Stage Up"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveStage(sIdx, 1)}
                        disabled={sIdx === stages.length - 1}
                        className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded"
                        title="Move Stage Down"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveStage(sIdx)}
                        className="p-1 text-rose-500 hover:text-rose-700 rounded hover:bg-rose-50"
                        title="Remove Stage"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Stage Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Stage Type
                      </label>
                      <select
                        value={st.stage_type}
                        onChange={(e) => handleUpdateStage(sIdx, 'stage_type', e.target.value)}
                        className="w-full text-xs rounded-lg border-slate-300 focus:ring-brand-500 focus:border-brand-500"
                      >
                        {STAGE_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Custom Stage Name (Optional)
                      </label>
                      <input
                        type="text"
                        value={st.custom_stage_name}
                        onChange={(e) =>
                          handleUpdateStage(sIdx, 'custom_stage_name', e.target.value)
                        }
                        placeholder="e.g. Coding Assessment, System Architecture"
                        className="w-full text-xs rounded-lg border-slate-300 focus:ring-brand-500 focus:border-brand-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Interview Mode
                      </label>
                      <select
                        value={st.interview_mode}
                        onChange={(e) =>
                          handleUpdateStage(sIdx, 'interview_mode', e.target.value)
                        }
                        className="w-full text-xs rounded-lg border-slate-300 focus:ring-brand-500 focus:border-brand-500"
                      >
                        <option value="Online">Online / Video</option>
                        <option value="Offline">Offline / Onsite</option>
                        <option value="Hybrid">Hybrid</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Stage Result
                      </label>
                      <select
                        value={st.result}
                        onChange={(e) => handleUpdateStage(sIdx, 'result', e.target.value)}
                        className="w-full text-xs rounded-lg border-slate-300 focus:ring-brand-500 focus:border-brand-500"
                      >
                        <option value="Cleared">Cleared / Advanced</option>
                        <option value="Eliminated">Eliminated / Rejected</option>
                        <option value="Awaited">Result Awaited</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Stage Description / Format Overview
                    </label>
                    <textarea
                      value={st.description}
                      onChange={(e) => handleUpdateStage(sIdx, 'description', e.target.value)}
                      rows={2}
                      placeholder="What was the format? (e.g. 60-minute Google Meet with SDE2, live coding on CoderPad...)"
                      className="w-full text-xs rounded-lg border-slate-300 focus:ring-brand-500 focus:border-brand-500"
                    />
                  </div>

                  {/* Stage Questions Sub-builder */}
                  <div className="pt-2 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center">
                        <HelpCircle className="w-4 h-4 mr-1.5 text-brand-600" />
                        Questions Asked in this Stage ({st.questions?.length || 0})
                      </span>
                      <button
                        type="button"
                        onClick={() => handleAddQuestion(sIdx)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-800 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-lg border border-brand-200 transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Question</span>
                      </button>
                    </div>

                    <div className="space-y-4">
                      {(st.questions || []).map((q, qIdx) => (
                        <div
                          key={qIdx}
                          className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs space-y-4 hover:border-slate-300 transition-colors"
                        >
                          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                            <div className="flex items-center space-x-2">
                              <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                Question #{qIdx + 1}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                Document core problem, follow-ups, and approach
                              </span>
                            </div>
                            {st.questions.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveQuestion(sIdx, qIdx)}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded-md transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Remove Question</span>
                              </button>
                            )}
                          </div>

                          {/* Primary Question / Problem Statement */}
                          <div className="bg-slate-50/60 p-4 rounded-xl border border-slate-200">
                            <label className="block text-xs font-bold text-slate-800 mb-2 flex items-center justify-between">
                              <span className="flex items-center gap-1.5">
                                <HelpCircle className="w-4 h-4 text-brand-600" />
                                <span>Interview Question / Problem Statement <span className="text-rose-500">*</span></span>
                              </span>
                              <span className="text-[10px] font-semibold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                                Free text • Markdown & multi-line supported
                              </span>
                            </label>
                            <textarea
                              value={q.question_text}
                              onChange={(e) =>
                                handleUpdateQuestion(sIdx, qIdx, 'question_text', e.target.value)
                              }
                              rows={4}
                              placeholder="Exact question asked by interviewer (e.g. Implement a distributed leaky bucket rate limiter in Python with atomic sliding window. Discuss trade-offs and edge cases under high concurrency)..."
                              className="w-full text-sm p-3.5 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition leading-relaxed shadow-xs font-normal"
                            />
                            <div className="flex items-center justify-between mt-2 text-[11px] text-slate-400">
                              <span>Enter the question accurately as asked during your session.</span>
                              <span>{q.question_text ? q.question_text.length : 0} characters</span>
                            </div>
                          </div>

                          {/* Follow-up question or twist */}
                          <div className="bg-purple-50/40 p-4 rounded-xl border border-purple-200/80">
                            <label className="block text-xs font-semibold text-slate-700 mb-2 flex items-center justify-between">
                              <span className="flex items-center gap-1.5 text-purple-900 font-bold">
                                <CornerDownRight className="w-4 h-4 text-purple-600" />
                                <span>Follow-Up Question or Twist</span>
                              </span>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-100/70 border border-purple-200 px-2 py-0.5 rounded-full">
                                Optional
                              </span>
                            </label>
                            <textarea
                              value={q.follow_up_text}
                              onChange={(e) =>
                                handleUpdateQuestion(sIdx, qIdx, 'follow_up_text', e.target.value)
                              }
                              rows={3}
                              placeholder="Follow-up question or twist (e.g. How would you coordinate rate limits across 50 containerized instances without a centralized lock bottleneck?)..."
                              className="w-full text-sm p-3.5 rounded-xl border border-purple-200 bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition leading-relaxed shadow-xs"
                            />
                            <p className="text-[11px] text-purple-700/70 mt-1.5">
                              Any counter-question, edge-case challenge, or scaling constraint introduced after your initial response.
                            </p>
                          </div>

                          {/* Two Deep-Dive Columns: Expectations & Approach */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                                <Target className="w-3.5 h-3.5 text-slate-500" />
                                <span>Interviewer Expectations (Optional)</span>
                              </label>
                              <textarea
                                value={q.interviewer_approach}
                                onChange={(e) =>
                                  handleUpdateQuestion(
                                    sIdx,
                                    qIdx,
                                    'interviewer_approach',
                                    e.target.value
                                  )
                                }
                                rows={3}
                                placeholder="What was the interviewer looking for? (e.g. Distributed locking, Redis atomicity, handling race conditions, edge cases)..."
                                className="w-full text-xs p-3 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition shadow-xs resize-y leading-relaxed"
                              />
                              <p className="text-[11px] text-slate-400 mt-1">
                                Key skills, trade-offs, or criteria the interviewer was probing for.
                              </p>
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                                <Lightbulb className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Your Response & Solution (Optional)</span>
                              </label>
                              <textarea
                                value={q.student_response}
                                onChange={(e) =>
                                  handleUpdateQuestion(
                                    sIdx,
                                    qIdx,
                                    'student_response',
                                    e.target.value
                                  )
                                }
                                rows={3}
                                placeholder="Your response, algorithm, or thought process... (e.g. Proposed sliding window log in Redis with Lua script for atomic check)"
                                className="w-full text-xs p-3 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition shadow-xs resize-y leading-relaxed"
                              />
                              <p className="text-[11px] text-slate-400 mt-1">
                                How you approached, solved, or discussed the solution with the interviewer.
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={() => handleAddQuestion(sIdx)}
                        className="w-full py-2.5 border-2 border-dashed border-slate-200 hover:border-brand-300 hover:bg-brand-50/30 rounded-xl text-xs font-bold text-slate-600 hover:text-brand-700 flex items-center justify-center gap-1.5 transition"
                      >
                        <Plus className="w-4 h-4 text-brand-600" />
                        <span>Add Another Question to this Stage</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-500 flex items-center">
              <Lock className="w-3.5 h-3.5 mr-1 text-slate-400" />
              Submissions undergo deterministic policy checks before publication.
            </p>

            <div className="flex items-center space-x-3 shrink-0">
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={savingDraft || publishing}
                className="inline-flex items-center px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                {savingDraft ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                )}
                Save Draft
              </button>

              <button
                type="submit"
                disabled={savingDraft || publishing}
                className="inline-flex items-center px-5 py-2 rounded-lg text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 transition-colors shadow-sm disabled:opacity-50"
              >
                {publishing ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5 mr-1.5" />
                )}
                {status === 'published' ? 'Submit Revisions' : 'Publish Experience'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
