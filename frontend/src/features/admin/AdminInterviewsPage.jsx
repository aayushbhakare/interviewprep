import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Settings,
  BarChart3,
  ShieldAlert,
  Bot,
  Clock,
  CheckCircle2,
  AlertCircle,
  Save,
  ArrowLeft,
  Activity,
  Layers,
} from 'lucide-react';
import { interviewService } from '../../services/interviewService';

export default function AdminInterviewsPage() {
  const [config, setConfig] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [techCooling, setTechCooling] = useState(24);
  const [hrCooling, setHrCooling] = useState(24);
  const [mixedCooling, setMixedCooling] = useState(24);
  const [mixedCutoff, setMixedCutoff] = useState(60.0);
  const [defaultProvider, setDefaultProvider] = useState('gemini');
  const [defaultModel, setDefaultModel] = useState('gemini-2.0-flash');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cfgRes, statsRes] = await Promise.all([
        interviewService.getAdminConfig(),
        interviewService.getAdminAnalytics(),
      ]);
      const cfg = cfgRes.data;
      setConfig(cfg);
      setTechCooling(cfg.technical_cooling_hours || 24);
      setHrCooling(cfg.hr_cooling_hours || 24);
      setMixedCooling(cfg.mixed_cooling_hours || 24);
      setMixedCutoff(cfg.mixed_aptitude_cutoff || 60.0);
      setDefaultProvider(cfg.default_provider || 'gemini');
      setDefaultModel(cfg.default_model || 'gemini-2.0-flash');

      setAnalytics(statsRes.data);
    } catch (err) {
      setErrorMsg(err?.response?.data?.detail || 'Failed to load administrative interview settings.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const payload = {
        technical_cooling_hours: parseInt(techCooling, 10),
        hr_cooling_hours: parseInt(hrCooling, 10),
        mixed_cooling_hours: parseInt(mixedCooling, 10),
        mixed_aptitude_cutoff: parseFloat(mixedCutoff),
        default_provider: defaultProvider,
        default_model: defaultModel,
      };

      const res = await interviewService.updateAdminConfig(payload);
      setConfig(res.data);
      setSuccessMsg('Interview simulation parameters successfully saved and audited.');
    } catch (err) {
      setErrorMsg(err?.response?.data?.detail || 'Failed to update configuration.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center text-slate-500">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-medium">Loading administrative interview controls...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <Link
            to="/admin/aptitude"
            className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 mb-2 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Admin Console
          </Link>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Settings className="w-6 h-6 text-indigo-600" />
            Interview Simulation Administration & Telemetry
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure cooling periods, AI provider limits, and review aggregate recruitment pass metrics.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Analytics Overview Cards */}
      {analytics && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-400 block uppercase">
              Total Sessions
            </span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">
              {analytics.total_sessions}
            </span>
            <span className="text-[11px] text-slate-500 mt-1 block">
              {analytics.completed_sessions} evaluated
            </span>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-400 block uppercase">
              Overall Pass Rate
            </span>
            <span className="text-2xl font-black text-emerald-600 mt-1 block">
              {analytics.overall_pass_rate}%
            </span>
            <span className="text-[11px] text-slate-500 mt-1 block">
              {analytics.pass_count} passed / {analytics.fail_count} failed
            </span>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-400 block uppercase">
              AI Token Consumption
            </span>
            <span className="text-2xl font-black text-indigo-600 mt-1 block">
              {analytics.ai_telemetry?.total_tokens?.toLocaleString() || 0}
            </span>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Across {analytics.ai_telemetry?.total_calls || 0} provider turns
            </span>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-400 block uppercase">
              Estimated AI Cost
            </span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">
              ${analytics.ai_telemetry?.total_cost_usd || '0.0000'}
            </span>
            <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
              Within ₹0 target budget
            </span>
          </div>
        </div>
      )}

      {/* Configuration Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Independent Cooling Periods */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600" />
            Independent Practice Cooling Hours
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            Duration in hours candidate must wait before re-attempting an interview type after an unsuccessful session.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Technical Interview (Hours)
              </label>
              <input
                type="number"
                min="0"
                max="168"
                value={techCooling}
                onChange={(e) => setTechCooling(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                HR Interview (Hours)
              </label>
              <input
                type="number"
                min="0"
                max="168"
                value={hrCooling}
                onChange={(e) => setHrCooling(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mixed Recruitment (Hours)
              </label>
              <input
                type="number"
                min="0"
                max="168"
                value={mixedCooling}
                onChange={(e) => setMixedCooling(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 2: AI Provider & Mixed Cutoff */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
            <Bot className="w-4 h-4 text-emerald-600" />
            AI Provider & Mixed Aptitude Cutoff
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            Configure backend conversational model and the qualifying threshold for Phase 5 mixed aptitude stages.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mixed Aptitude Cutoff (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={mixedCutoff}
                onChange={(e) => setMixedCutoff(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Default Provider
              </label>
              <select
                value={defaultProvider}
                onChange={(e) => setDefaultProvider(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none font-medium"
              >
                <option value="gemini">Google Gemini 2.0 Flash</option>
                <option value="deterministic">Deterministic Engine (Offline)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Model Identifier
              </label>
              <input
                type="text"
                value={defaultModel}
                onChange={(e) => setDefaultModel(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Changes...' : 'Save Configuration'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
