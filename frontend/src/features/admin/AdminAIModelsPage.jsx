import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import {
  Cpu,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Save,
  ShieldCheck,
  X,
  Server,
  Zap,
} from 'lucide-react';

export default function AdminAIModelsPage() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);
  const [savingService, setSavingService] = useState(null);

  useEffect(() => {
    fetchAIModels();
  }, []);

  const fetchAIModels = async () => {
    try {
      setLoading(true);
      const res = await adminService.getAIModels();
      setServices(res.data.services || []);
    } catch (err) {
      console.error('Failed to load AI model configurations:', err);
      setFeedback({ type: 'error', message: 'Failed to load AI model routing matrix.' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (serviceName, updatedValues) => {
    try {
      setSavingService(serviceName);
      await adminService.updateAIModel(serviceName, updatedValues);
      setFeedback({
        type: 'success',
        message: `Routing for service "${serviceName}" updated successfully.`,
      });
      fetchAIModels();
    } catch (err) {
      console.error(`Failed to update AI routing for ${serviceName}:`, err);
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to update AI routing configuration.',
      });
    } finally {
      setSavingService(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            AI Model & Provider Routing
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Dynamic service routing across all 10 platform AI pipelines with deterministic fallbacks and strict ₹0 budget compliance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>₹0 Budget Mode Active</span>
          </span>
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

      {/* Zero Cost Policy Disclosure */}
      <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200 text-xs text-indigo-950 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block">Deterministic Zero-Cost Fallback Architecture</span>
          <p className="text-indigo-900/80 mt-0.5 leading-relaxed">
            All platform features support dual-mode execution. In <strong>Deterministic Mode</strong>, services generate structured algorithmic responses (interview questioning, evaluation scorecards, question moderation, aptitude diagnostics) locally at ₹0 cost without external API dependencies. In <strong>Gemini Mode</strong>, models connect through Google Generative AI free-tier quota with automated offline failover.
          </p>
        </div>
      </div>

      {/* Services Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-400">Loading AI model matrix...</div>
        ) : services.length === 0 ? (
          <div className="py-20 text-center text-xs text-slate-500">
            No AI service configurations registered.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">AI Pipeline / Service</th>
                  <th className="py-3 px-4">Primary Provider</th>
                  <th className="py-3 px-4">Target Model</th>
                  <th className="py-3 px-4">Deterministic Fallback</th>
                  <th className="py-3 px-4">Cost Standard</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {services.map((svc) => {
                  const serviceKey = svc.service_key || svc.service_name || 'service';
                  const serviceLabel = svc.service_label || svc.service_name || serviceKey;
                  const activeProvider = svc.provider || svc.active_provider || 'deterministic';
                  const modelName = svc.model || svc.model_name || 'gemini-1.5-flash';
                  const fallbackActive = svc.fallback_provider ? svc.fallback_provider !== 'none' : svc.fallback_enabled !== false;
                  const isSaving = savingService === serviceKey;

                  return (
                    <tr key={serviceKey} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <Cpu className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                          <span>{String(serviceLabel).replace(/_/g, ' ')}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {serviceKey}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={activeProvider}
                          onChange={(e) =>
                            handleUpdate(serviceKey, { active_provider: e.target.value, provider: e.target.value })
                          }
                          disabled={isSaving}
                          className="text-xs p-1.5 rounded-lg border border-slate-300 bg-white font-semibold text-slate-800"
                        >
                          <option value="deterministic">Deterministic Engine (Local)</option>
                          <option value="gemini">Google Gemini API (Free Tier)</option>
                        </select>
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          defaultValue={modelName}
                          onBlur={(e) => {
                            if (e.target.value !== modelName) {
                              handleUpdate(serviceKey, { model_name: e.target.value, model: e.target.value });
                            }
                          }}
                          disabled={isSaving}
                          className="w-36 text-xs p-1.5 rounded-lg border border-slate-300 font-mono text-slate-800"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <label className="inline-flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={fallbackActive}
                            onChange={(e) =>
                              handleUpdate(serviceKey, {
                                fallback_enabled: e.target.checked,
                                fallback_provider: e.target.checked ? 'deterministic' : 'none',
                              })
                            }
                            disabled={isSaving}
                            className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                          />
                          <span className="text-[11px] font-semibold text-slate-700">
                            Auto-Failover
                          </span>
                        </label>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          ₹0.00 / Zero Cost
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {isSaving ? (
                          <span className="text-xs font-semibold text-brand-600">Updating...</span>
                        ) : (
                          <span className="text-xs font-semibold text-slate-400">Synced</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
