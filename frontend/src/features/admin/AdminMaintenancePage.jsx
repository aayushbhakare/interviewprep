import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import {
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Shield,
  Save,
  RotateCcw,
  X,
  Lock,
  Unlock,
  Info,
} from 'lucide-react';

export default function AdminMaintenancePage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const [globalMaintenance, setGlobalMaintenance] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState(
    'Platform maintenance is in progress. Student services will resume shortly.'
  );

  const [moduleToggles, setModuleToggles] = useState({
    quizzes: false,
    aptitude: false,
    interviews: false,
    learning: false,
    experiences: false,
  });

  const [moduleMessages, setModuleMessages] = useState({
    quizzes: 'Weekly quiz system is temporarily offline for scheduled question updates.',
    aptitude: 'Aptitude assessment engine is undergoing routine calibration.',
    interviews: 'Voice mock interview simulations are currently paused for system upgrades.',
    learning: 'Learning roadmap guides are undergoing routine content synchronization.',
    experiences: 'Experience publishing is temporarily in read-only mode.',
  });

  useEffect(() => {
    fetchMaintenance();
  }, []);

  const fetchMaintenance = async () => {
    try {
      setLoading(true);
      const res = await adminService.getMaintenanceStatus();
      const data = res.data;
      setGlobalMaintenance(!!data.global_maintenance);
      if (data.message) setMaintenanceMessage(data.message);
      if (data.modules) {
        setModuleToggles((prev) => ({
          ...prev,
          ...data.modules,
        }));
      }
      if (data.module_messages) {
        setModuleMessages((prev) => ({
          ...prev,
          ...data.module_messages,
        }));
      }
    } catch (err) {
      console.error('Failed to load maintenance status:', err);
      setFeedback({ type: 'error', message: 'Failed to retrieve maintenance controls.' });
    } finally {
      setLoading(false);
    }
  };

  const handleModuleToggle = (moduleKey) => {
    setModuleToggles((prev) => ({
      ...prev,
      [moduleKey]: !prev[moduleKey],
    }));
  };

  const handleModuleMessageChange = (moduleKey, msg) => {
    setModuleMessages((prev) => ({
      ...prev,
      [moduleKey]: msg,
    }));
  };

  const handleSaveMaintenance = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await adminService.updateMaintenanceStatus({
        global_maintenance: globalMaintenance,
        message: maintenanceMessage,
        modules: moduleToggles,
        module_messages: moduleMessages,
      });
      setFeedback({
        type: 'success',
        message: 'Platform maintenance configurations and middleware routing updated.',
      });
      fetchMaintenance();
    } catch (err) {
      console.error('Failed to update maintenance controls:', err);
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to update maintenance settings.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Platform Maintenance & Service Availability
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Activate emergency maintenance windows, toggle selective module lockdowns, and customize student alert messages.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {globalMaintenance ? (
            <span className="px-3 py-1 rounded-xl bg-rose-100 text-rose-800 border border-rose-300 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
              <Lock className="w-4 h-4" />
              <span>Global Lockout Active</span>
            </span>
          ) : (
            <span className="px-3 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1.5">
              <Unlock className="w-4 h-4 text-emerald-600" />
              <span>All Student Services Open</span>
            </span>
          )}
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

      {/* Staff Exemption Notice */}
      <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-blue-950 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block">Staff Administrator Exemption</span>
          <p className="text-blue-900/80 mt-0.5 leading-relaxed">
            The platform's <code>MaintenanceModeMiddleware</code> enforces maintenance restrictions exclusively on student traffic. Authenticated staff administrators are completely exempt and can access all student features, test routes, and admin tools during maintenance periods.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400">Loading maintenance parameters...</div>
      ) : (
        <form onSubmit={handleSaveMaintenance} className="space-y-6">
          {/* Section 1: Global Platform Lockdown */}
          <div
            className={`border rounded-2xl p-6 transition-all ${
              globalMaintenance
                ? 'bg-rose-50/60 border-rose-300'
                : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-brand-600" />
                  <span>Global Platform Maintenance Mode</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  When enabled, all student-facing endpoints return HTTP 503 with your custom announcement.
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={globalMaintenance}
                  onChange={(e) => setGlobalMaintenance(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600" />
                <span className="ml-3 text-xs font-bold text-slate-800">
                  {globalMaintenance ? 'Enabled' : 'Disabled'}
                </span>
              </label>
            </div>

            <div className="pt-4 space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Global Student Maintenance Notification Message
              </label>
              <textarea
                value={maintenanceMessage}
                onChange={(e) => setMaintenanceMessage(e.target.value)}
                rows={2}
                required
                className="w-full text-xs p-3 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-brand-500 transition"
              />
            </div>
          </div>

          {/* Section 2: Selective Per-Module Maintenance Controls */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
            <div className="pb-3 border-b border-slate-100">
              <h3 className="text-sm font-extrabold text-slate-900">
                Selective Module Maintenance Controls
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Lock down individual candidate modules without disrupting the rest of the preparation journey.
              </p>
            </div>

            <div className="space-y-4">
              {Object.keys(moduleToggles).map((modKey) => {
                const isLocked = moduleToggles[modKey];
                const displayName =
                  modKey === 'quizzes'
                    ? 'Weekly Technical Quizzes'
                    : modKey === 'aptitude'
                    ? 'Aptitude Practice & Tests'
                    : modKey === 'interviews'
                    ? 'AI Voice Mock Interviews'
                    : modKey === 'learning'
                    ? 'Learning Roadmaps & Topics'
                    : 'Share Interview Experience Feed';

                return (
                  <div
                    key={modKey}
                    className={`p-4 rounded-xl border transition-all ${
                      isLocked
                        ? 'bg-amber-50/50 border-amber-300'
                        : 'bg-slate-50/50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">
                          {displayName}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Endpoint scope: <code>/api/v1/{modKey}/</code>
                        </span>
                      </div>

                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isLocked}
                          onChange={() => handleModuleToggle(modKey)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600" />
                        <span className="ml-2.5 text-xs font-semibold text-slate-700">
                          {isLocked ? 'Locked' : 'Available'}
                        </span>
                      </label>
                    </div>

                    <div>
                      <input
                        type="text"
                        value={moduleMessages[modKey] || ''}
                        onChange={(e) => handleModuleMessageChange(modKey, e.target.value)}
                        placeholder="Custom student message when this module is accessed..."
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={fetchMaintenance}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-brand-600 text-white hover:bg-brand-700 text-xs font-bold transition shadow-sm flex items-center gap-1.5 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{submitting ? 'Applying Middleware Rules...' : 'Save Maintenance State'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
