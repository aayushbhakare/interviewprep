import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import {
  Settings,
  Layers,
  CheckCircle2,
  Bot,
  Shield,
  Save,
  RotateCcw,
  AlertTriangle,
  X,
  Sparkles,
} from 'lucide-react';

const TABS = [
  { id: 'aptitude', label: 'Aptitude Practice', icon: Layers },
  { id: 'quizzes', label: 'Weekly Quizzes', icon: CheckCircle2 },
  { id: 'interviews', label: 'Mock Interviews', icon: Bot },
  { id: 'security', label: 'Security & Auth', icon: Shield },
];

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState('aptitude');
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Local form state for editable settings
  const [formData, setFormData] = useState({
    'aptitude.daily_test_limit': 1,
    'aptitude.test_duration_minutes': 30,
    'aptitude.questions_total': 30,
    'aptitude.mixed_cutoff_percentage': 60,
    'aptitude.category_distribution': { quantitative: 10, logical: 10, verbal: 10 },
    'quizzes.questions_per_quiz': 45,
    'quizzes.quiz_duration_minutes': 45,
    'quizzes.max_weekly_attempts': 3,
    'interviews.cooling_period_hours': 24,
    'auth.jwt_access_token_lifetime_minutes': 60,
    'auth.enforce_two_factor_for_admins': true,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await adminService.getPlatformSettings();
      const loaded = res.data.settings || {};
      setSettings(loaded);

      // Map loaded values into formData
      setFormData((prev) => {
        const next = { ...prev };
        Object.keys(loaded).forEach((k) => {
          if (loaded[k] && loaded[k].setting_value !== undefined) {
            next[k] = loaded[k].setting_value;
          }
        });
        return next;
      });
    } catch (err) {
      console.error('Failed to load settings:', err);
      setFeedback({ type: 'error', message: 'Failed to load platform settings.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSetting = async (key, value) => {
    try {
      setSavingKey(key);
      await adminService.updatePlatformSetting(key, value);
      setFeedback({
        type: 'success',
        message: `Setting "${key}" updated and recorded in audit log.`,
      });
      fetchSettings();
    } catch (err) {
      console.error(`Failed to update setting ${key}:`, err);
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || `Failed to update ${key}.`,
      });
    } finally {
      setSavingKey(null);
    }
  };

  const handleInputChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleCategoryDistChange = (cat, val) => {
    const intVal = parseInt(val) || 0;
    setFormData((prev) => {
      const updated = {
        ...prev['aptitude.category_distribution'],
        [cat]: intVal,
      };
      return {
        ...prev,
        'aptitude.category_distribution': updated,
      };
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Platform Settings & System Parameters
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Centralized governance of aptitude parameters, quiz constraints, interview cooling intervals, and security policies.
          </p>
        </div>
        <button
          onClick={fetchSettings}
          className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition"
        >
          Reset to Server State
        </button>
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

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition ${
                isActive
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400">Loading parameters...</div>
      ) : (
        <div className="space-y-6">
          {/* TAB 1: Aptitude Settings */}
          {activeTab === 'aptitude' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
              <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Aptitude Module Parameters
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Configure daily quota, test durations, and section distribution for fresher candidates.
                  </p>
                </div>
                <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full">
                  Fresher Only
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Daily Test Limit
                    </label>
                    <p className="text-[11px] text-slate-500 mb-3">
                      Maximum completed aptitude test attempts permitted per student per day.
                    </p>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={formData['aptitude.daily_test_limit']}
                      onChange={(e) =>
                        handleInputChange('aptitude.daily_test_limit', parseInt(e.target.value) || 1)
                      }
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                  <button
                    onClick={() =>
                      handleSaveSetting('aptitude.daily_test_limit', formData['aptitude.daily_test_limit'])
                    }
                    disabled={savingKey === 'aptitude.daily_test_limit'}
                    className="mt-4 px-3 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-bold hover:bg-brand-700 transition"
                  >
                    {savingKey === 'aptitude.daily_test_limit' ? 'Saving...' : 'Save Limit'}
                  </button>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Test Duration (Minutes)
                    </label>
                    <p className="text-[11px] text-slate-500 mb-3">
                      Default countdown timer limit for standard mixed assessment sessions.
                    </p>
                    <input
                      type="number"
                      min="5"
                      max="120"
                      value={formData['aptitude.test_duration_minutes']}
                      onChange={(e) =>
                        handleInputChange(
                          'aptitude.test_duration_minutes',
                          parseInt(e.target.value) || 30
                        )
                      }
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                  <button
                    onClick={() =>
                      handleSaveSetting(
                        'aptitude.test_duration_minutes',
                        formData['aptitude.test_duration_minutes']
                      )
                    }
                    disabled={savingKey === 'aptitude.test_duration_minutes'}
                    className="mt-4 px-3 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-bold hover:bg-brand-700 transition"
                  >
                    {savingKey === 'aptitude.test_duration_minutes' ? 'Saving...' : 'Save Duration'}
                  </button>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Total Questions per Session
                    </label>
                    <p className="text-[11px] text-slate-500 mb-3">
                      Total number of randomized questions drawn for each aptitude session.
                    </p>
                    <input
                      type="number"
                      min="10"
                      max="60"
                      value={formData['aptitude.questions_total']}
                      onChange={(e) =>
                        handleInputChange('aptitude.questions_total', parseInt(e.target.value) || 30)
                      }
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                  <button
                    onClick={() =>
                      handleSaveSetting('aptitude.questions_total', formData['aptitude.questions_total'])
                    }
                    disabled={savingKey === 'aptitude.questions_total'}
                    className="mt-4 px-3 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-bold hover:bg-brand-700 transition"
                  >
                    {savingKey === 'aptitude.questions_total' ? 'Saving...' : 'Save Total'}
                  </button>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Mixed Assessment Cutoff (%)
                    </label>
                    <p className="text-[11px] text-slate-500 mb-3">
                      Score percentage threshold required to achieve a passing scorecard.
                    </p>
                    <input
                      type="number"
                      min="30"
                      max="90"
                      value={formData['aptitude.mixed_cutoff_percentage']}
                      onChange={(e) =>
                        handleInputChange(
                          'aptitude.mixed_cutoff_percentage',
                          parseInt(e.target.value) || 60
                        )
                      }
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                  <button
                    onClick={() =>
                      handleSaveSetting(
                        'aptitude.mixed_cutoff_percentage',
                        formData['aptitude.mixed_cutoff_percentage']
                      )
                    }
                    disabled={savingKey === 'aptitude.mixed_cutoff_percentage'}
                    className="mt-4 px-3 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-bold hover:bg-brand-700 transition"
                  >
                    {savingKey === 'aptitude.mixed_cutoff_percentage' ? 'Saving...' : 'Save Cutoff'}
                  </button>
                </div>
              </div>

              {/* Category distribution */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                <label className="block text-xs font-bold text-slate-800">
                  Category Distribution in Mixed Assessment (Total: {
                    (formData['aptitude.category_distribution']?.quantitative || 0) +
                    (formData['aptitude.category_distribution']?.logical || 0) +
                    (formData['aptitude.category_distribution']?.verbal || 0)
                  } Qs)
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Quantitative Aptitude
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={formData['aptitude.category_distribution']?.quantitative || 10}
                      onChange={(e) => handleCategoryDistChange('quantitative', e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Logical Reasoning
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={formData['aptitude.category_distribution']?.logical || 10}
                      onChange={(e) => handleCategoryDistChange('logical', e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Verbal Ability
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={formData['aptitude.category_distribution']?.verbal || 10}
                      onChange={(e) => handleCategoryDistChange('verbal', e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                </div>
                <button
                  onClick={() =>
                    handleSaveSetting(
                      'aptitude.category_distribution',
                      formData['aptitude.category_distribution']
                    )
                  }
                  disabled={savingKey === 'aptitude.category_distribution'}
                  className="px-3 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-bold hover:bg-brand-700 transition"
                >
                  {savingKey === 'aptitude.category_distribution'
                    ? 'Saving...'
                    : 'Save Distribution'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: Quizzes Settings */}
          {activeTab === 'quizzes' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
              <div className="pb-4 border-b border-slate-100">
                <h3 className="text-sm font-extrabold text-slate-900">
                  Weekly Technical Quiz Parameters
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Standardized 45-question weekly quiz format with anti-cheat timer and attempt quotas.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Questions per Quiz (Standard: 45)
                    </label>
                    <p className="text-[11px] text-slate-500 mb-3">
                      Fixed test length for campus technical rounds.
                    </p>
                    <input
                      type="number"
                      value={formData['quizzes.questions_per_quiz']}
                      onChange={(e) =>
                        handleInputChange('quizzes.questions_per_quiz', parseInt(e.target.value) || 45)
                      }
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                  <button
                    onClick={() =>
                      handleSaveSetting(
                        'quizzes.questions_per_quiz',
                        formData['quizzes.questions_per_quiz']
                      )
                    }
                    disabled={savingKey === 'quizzes.questions_per_quiz'}
                    className="mt-4 px-3 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-bold hover:bg-brand-700 transition"
                  >
                    Save Length
                  </button>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Quiz Duration (Minutes)
                    </label>
                    <p className="text-[11px] text-slate-500 mb-3">
                      Total time allocated for completing the weekly quiz.
                    </p>
                    <input
                      type="number"
                      value={formData['quizzes.quiz_duration_minutes']}
                      onChange={(e) =>
                        handleInputChange(
                          'quizzes.quiz_duration_minutes',
                          parseInt(e.target.value) || 45
                        )
                      }
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                  <button
                    onClick={() =>
                      handleSaveSetting(
                        'quizzes.quiz_duration_minutes',
                        formData['quizzes.quiz_duration_minutes']
                      )
                    }
                    disabled={savingKey === 'quizzes.quiz_duration_minutes'}
                    className="mt-4 px-3 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-bold hover:bg-brand-700 transition"
                  >
                    Save Duration
                  </button>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Max Weekly Attempts
                    </label>
                    <p className="text-[11px] text-slate-500 mb-3">
                      Maximum attempts allowed per weekly quiz cycle.
                    </p>
                    <input
                      type="number"
                      value={formData['quizzes.max_weekly_attempts']}
                      onChange={(e) =>
                        handleInputChange(
                          'quizzes.max_weekly_attempts',
                          parseInt(e.target.value) || 3
                        )
                      }
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                  <button
                    onClick={() =>
                      handleSaveSetting(
                        'quizzes.max_weekly_attempts',
                        formData['quizzes.max_weekly_attempts']
                      )
                    }
                    disabled={savingKey === 'quizzes.max_weekly_attempts'}
                    className="mt-4 px-3 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-bold hover:bg-brand-700 transition"
                  >
                    Save Attempts
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Interviews Settings */}
          {activeTab === 'interviews' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
              <div className="pb-4 border-b border-slate-100">
                <h3 className="text-sm font-extrabold text-slate-900">
                  AI Mock Interview Practice Parameters
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Anti-exhaustion cooling hours and simulation governance.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 max-w-md">
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Cooling Period (Hours)
                </label>
                <p className="text-[11px] text-slate-500 mb-3">
                  Mandatory wait time between consecutive mock interview sessions per candidate.
                </p>
                <input
                  type="number"
                  min="0"
                  max="168"
                  value={formData['interviews.cooling_period_hours']}
                  onChange={(e) =>
                    handleInputChange(
                      'interviews.cooling_period_hours',
                      parseInt(e.target.value) || 24
                    )
                  }
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white mb-3"
                />
                <button
                  onClick={() =>
                    handleSaveSetting(
                      'interviews.cooling_period_hours',
                      formData['interviews.cooling_period_hours']
                    )
                  }
                  disabled={savingKey === 'interviews.cooling_period_hours'}
                  className="px-3 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-bold hover:bg-brand-700 transition"
                >
                  Save Cooling Interval
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: Security & Authentication */}
          {activeTab === 'security' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
              <div className="pb-4 border-b border-slate-100">
                <h3 className="text-sm font-extrabold text-slate-900">
                  Security & Access Controls
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  JWT lifetimes, invitation policies, and administrative MFA requirements.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      JWT Access Token Lifetime (Minutes)
                    </label>
                    <p className="text-[11px] text-slate-500 mb-3">
                      Time window before an access token requires silent refresh.
                    </p>
                    <input
                      type="number"
                      min="5"
                      max="1440"
                      value={formData['auth.jwt_access_token_lifetime_minutes']}
                      onChange={(e) =>
                        handleInputChange(
                          'auth.jwt_access_token_lifetime_minutes',
                          parseInt(e.target.value) || 60
                        )
                      }
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                  <button
                    onClick={() =>
                      handleSaveSetting(
                        'auth.jwt_access_token_lifetime_minutes',
                        formData['auth.jwt_access_token_lifetime_minutes']
                      )
                    }
                    disabled={savingKey === 'auth.jwt_access_token_lifetime_minutes'}
                    className="mt-4 px-3 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-bold hover:bg-brand-700 transition"
                  >
                    Save Token Lifetime
                  </button>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Enforce 2FA for Staff Accounts
                    </label>
                    <p className="text-[11px] text-slate-500 mb-3">
                      Require multi-factor authentication setup for all platform admin logins.
                    </p>
                    <div className="flex items-center space-x-3 pt-2">
                      <label className="inline-flex items-center text-xs font-bold text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData['auth.enforce_two_factor_for_admins']}
                          onChange={(e) =>
                            handleInputChange(
                              'auth.enforce_two_factor_for_admins',
                              e.target.checked
                            )
                          }
                          className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 mr-2"
                        />
                        <span>Enforce 2FA across all administrative accounts</span>
                      </label>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      handleSaveSetting(
                        'auth.enforce_two_factor_for_admins',
                        formData['auth.enforce_two_factor_for_admins']
                      )
                    }
                    disabled={savingKey === 'auth.enforce_two_factor_for_admins'}
                    className="mt-4 px-3 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-bold hover:bg-brand-700 transition"
                  >
                    Save 2FA Policy
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
