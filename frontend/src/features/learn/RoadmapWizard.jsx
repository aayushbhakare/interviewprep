import React, { useState, useEffect } from 'react';
import { Check, ArrowRight, ArrowLeft, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import api from '../../services/api';

export default function RoadmapWizard({ onComplete, onCancel, isReplacing = false }) {
  const [step, setStep] = useState(1);
  const [catalog, setCatalog] = useState(null);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    role: '',
    custom_role: '',
    experience_level: '',
    target_salary: '',
    language: '',
    framework: '',
    database: '',
  });

  useEffect(() => {
    api.get('/learning/catalog/')
      .then((res) => {
        setCatalog(res.data?.data || null);
      })
      .catch(() => {
        setError('Failed to load technology catalog. Please try refreshing.');
      })
      .finally(() => {
        setLoadingCatalog(false);
      });
  }, []);

  const handleLanguageSelect = (lang) => {
    setFormData((prev) => ({
      ...prev,
      language: lang,
      framework: '', // Changing language clears previously selected framework
    }));
  };

  const isStepValid = () => {
    switch (step) {
      case 1:
        return formData.role && (formData.role !== 'Other' || formData.custom_role.trim().length > 0);
      case 2:
        return !!formData.experience_level;
      case 3:
        return !!formData.target_salary;
      case 4:
        return formData.language && formData.framework;
      case 5:
        return !!formData.database;
      case 6:
        return true;
      default:
        return false;
    }
  };

  const handleGenerate = async () => {
    setSubmitting(true);
    setError(null);

    const payload = {
      role: formData.role,
      custom_role: formData.custom_role,
      experience_level: formData.experience_level,
      target_salary: formData.target_salary === 'Skip' ? null : formData.target_salary,
      language: formData.language,
      framework: formData.framework,
      database: formData.database,
      replace: isReplacing,
    };

    const endpoint = isReplacing ? '/learning/roadmaps/replace/' : '/learning/roadmaps/';

    try {
      const res = await api.post(endpoint, payload);
      onComplete(res.data?.data);
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.response?.data?.detail || 'Failed to generate roadmap. Please check your selections.';
      setError(Array.isArray(msg) ? msg.join(' ') : msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingCatalog) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center flex flex-col items-center">
        <Loader2 className="w-8 h-8 text-brand-600 animate-spin mb-3" />
        <p className="text-sm text-slate-500">Loading catalog options...</p>
      </div>
    );
  }

  const compatibleFrameworks = catalog?.frameworks_by_language?.[formData.language] || ['Other'];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
      {/* Progress Steps Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-2">
          <span>Step {step} of 6</span>
          <span>{Math.round((step / 6) * 100)}% Completed</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2">
          <div
            className="bg-brand-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(step / 6) * 100}%` }}
          />
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 mr-2 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Step 1: Target Role */}
      {step === 1 && (
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-1">Select your Target Role</h2>
          <p className="text-sm text-slate-600 mb-6">
            Choose the technical job role you are preparing to interview for.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
            {catalog?.roles?.map((r) => {
              const selected = formData.role === r;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, role: r }))}
                  className={`p-4 rounded-xl border text-left font-medium text-sm transition-all flex items-center justify-between ${
                    selected
                      ? 'border-brand-600 bg-brand-50 text-brand-700 shadow-sm'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <span>{r}</span>
                  {selected && <Check className="w-4 h-4 text-brand-600 shrink-0" />}
                </button>
              );
            })}
          </div>

          {formData.role === 'Other' && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Specify Custom Role Name
              </label>
              <input
                type="text"
                value={formData.custom_role}
                onChange={(e) => setFormData((prev) => ({ ...prev, custom_role: e.target.value }))}
                placeholder="e.g. Distributed Systems Engineer"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          )}
        </div>
      )}

      {/* Step 2: Experience Level */}
      {step === 2 && (
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-1">Select your Experience Level</h2>
          <p className="text-sm text-slate-600 mb-6">
            The interview preparation depth will be adjusted to your actual engineering level.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {catalog?.experience_levels?.map((exp) => {
              const selected = formData.experience_level === exp;
              return (
                <button
                  key={exp}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, experience_level: exp }))}
                  className={`p-4 rounded-xl border text-left font-medium text-sm transition-all flex items-center justify-between ${
                    selected
                      ? 'border-brand-600 bg-brand-50 text-brand-700 shadow-sm'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <span>{exp}</span>
                  {selected && <Check className="w-4 h-4 text-brand-600 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 3: Target Salary Tier */}
      {step === 3 && (
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-1">Target Salary Tier (Optional)</h2>
          <p className="text-sm text-slate-600 mb-6">
            Our platform evaluates interview depth by target salary band rather than company tags.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
            {catalog?.salary_tiers?.map((sal) => {
              const selected = formData.target_salary === sal;
              return (
                <button
                  key={sal}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, target_salary: sal }))}
                  className={`p-4 rounded-xl border text-left font-medium text-sm transition-all flex items-center justify-between ${
                    selected
                      ? 'border-brand-600 bg-brand-50 text-brand-700 shadow-sm'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <span>{sal}</span>
                  {selected && <Check className="w-4 h-4 text-brand-600 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 4: Language & Compatible Framework */}
      {step === 4 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-1">Select Programming Language</h2>
            <p className="text-sm text-slate-600 mb-4">
              Select exactly one core programming language.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-6">
              {catalog?.languages?.map((lang) => {
                const selected = formData.language === lang;
                return (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => handleLanguageSelect(lang)}
                    className={`p-3 rounded-lg border text-center font-medium text-sm transition-all ${
                      selected
                        ? 'border-brand-600 bg-brand-50 text-brand-700 shadow-sm'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {lang}
                  </button>
                );
              })}
            </div>
          </div>

          {formData.language && (
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-base font-bold text-slate-900 mb-1">
                Select Framework for {formData.language}
              </h3>
              <p className="text-sm text-slate-600 mb-4">
                Showing frameworks compatible with {formData.language}.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {compatibleFrameworks.map((fw) => {
                  const selected = formData.framework === fw;
                  return (
                    <button
                      key={fw}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, framework: fw }))}
                      className={`p-3 rounded-lg border text-center font-medium text-sm transition-all ${
                        selected
                          ? 'border-brand-600 bg-brand-50 text-brand-700 shadow-sm'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {fw}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 5: Database */}
      {step === 5 && (
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-1">Select Primary Database</h2>
          <p className="text-sm text-slate-600 mb-6">
            Select the primary database persistence technology to focus on.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
            {catalog?.databases?.map((db) => {
              const selected = formData.database === db;
              return (
                <button
                  key={db}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, database: db }))}
                  className={`p-4 rounded-xl border text-left font-medium text-sm transition-all flex items-center justify-between ${
                    selected
                      ? 'border-brand-600 bg-brand-50 text-brand-700 shadow-sm'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <span>{db}</span>
                  {selected && <Check className="w-4 h-4 text-brand-600 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 6: Review & Confirmation */}
      {step === 6 && (
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-1">Review & Generate Roadmap</h2>
          <p className="text-sm text-slate-600 mb-6">
            Verify your selections before we build your personalized technical learning journey.
          </p>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 mb-6 space-y-4 text-sm">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <span className="text-slate-500 font-medium">Target Role:</span>
              <span className="font-bold text-slate-900">
                {formData.role === 'Other' ? formData.custom_role : formData.role}
              </span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <span className="text-slate-500 font-medium">Experience Level:</span>
              <span className="font-bold text-slate-900">{formData.experience_level}</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <span className="text-slate-500 font-medium">Target Salary Band:</span>
              <span className="font-bold text-brand-600">{formData.target_salary || 'Standard'}</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <span className="text-slate-500 font-medium">Language & Framework:</span>
              <span className="font-bold text-slate-900">{formData.language} / {formData.framework}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Primary Database:</span>
              <span className="font-bold text-slate-900">{formData.database}</span>
            </div>
          </div>
        </div>
      )}

      {/* Wizard Navigation Footer */}
      <div className="flex items-center justify-between pt-6 border-t border-slate-200 mt-6">
        <div>
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="inline-flex items-center px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
            </button>
          ) : (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700"
            >
              Cancel
            </button>
          )}
        </div>

        <div>
          {step < 6 ? (
            <button
              type="button"
              disabled={!isStepValid()}
              onClick={() => setStep((s) => s + 1)}
              className={`inline-flex items-center px-5 py-2.5 rounded-lg text-sm font-medium shadow-sm transition-all ${
                isStepValid()
                  ? 'bg-brand-600 text-white hover:bg-brand-700 cursor-pointer'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              Next Step <ArrowRight className="w-4 h-4 ml-1.5" />
            </button>
          ) : (
            <button
              type="button"
              disabled={submitting}
              onClick={handleGenerate}
              className="inline-flex items-center px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-bold shadow-md transition-all cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Generating Roadmap...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Roadmap
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
