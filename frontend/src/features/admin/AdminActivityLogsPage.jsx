import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import {
  FileText,
  Search,
  Filter,
  Eye,
  Shield,
  X,
  Clock,
  Terminal,
} from 'lucide-react';

export default function AdminActivityLogsPage() {
  const [logs, setLogs] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [resourceFilter, setResourceFilter] = useState('');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Modal inspection
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, resourceFilter, search, currentPage]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = { page: currentPage };
      if (actionFilter) params.action = actionFilter;
      if (resourceFilter) params.resource_type = resourceFilter;
      if (search) params.search = search;

      const res = await adminService.getActivityLogs(params);
      setLogs(res.data.results || []);
      setTotalCount(res.data.count || 0);
    } catch (err) {
      console.error('Failed to load activity logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const getActionBadgeColor = (action) => {
    if (!action) return 'bg-slate-100 text-slate-700';
    if (action.includes('suspend') || action.includes('deactivate') || action.includes('revoke')) {
      return 'bg-rose-100 text-rose-800 border-rose-200';
    }
    if (action.includes('reactivate') || action.includes('publish') || action.includes('create')) {
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
    if (action.includes('update') || action.includes('version')) {
      return 'bg-blue-100 text-blue-800 border-blue-200';
    }
    return 'bg-purple-100 text-purple-800 border-purple-200';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Immutable Administrative Audit Logs
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete append-only audit trail capturing every privileged staff action, setting mutation, and moderation decision.
          </p>
        </div>
        <div className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700">
          Recorded Audit Events: {totalCount}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search audit trail by actor, IP address, or details..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs p-2 rounded-xl border border-slate-300 bg-white text-slate-700 font-medium focus:ring-2 focus:ring-brand-500"
          >
            <option value="">All Actions</option>
            <option value="suspend_student">Suspend Student</option>
            <option value="reactivate_student">Reactivate Student</option>
            <option value="update_platform_setting">Update Setting</option>
            <option value="version_topic">Version Topic</option>
            <option value="toggle_topic_status">Toggle Topic Status</option>
            <option value="update_ai_model">Update AI Model</option>
            <option value="update_maintenance">Update Maintenance</option>
            <option value="deactivate_admin">Deactivate Admin</option>
            <option value="reactivate_admin">Reactivate Admin</option>
            <option value="send_invitation">Send Invitation</option>
            <option value="revoke_invitation">Revoke Invitation</option>
          </select>

          <select
            value={resourceFilter}
            onChange={(e) => {
              setResourceFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs p-2 rounded-xl border border-slate-300 bg-white text-slate-700 font-medium focus:ring-2 focus:ring-brand-500"
          >
            <option value="">All Resources</option>
            <option value="student">Student</option>
            <option value="learning_topic">Learning Topic</option>
            <option value="platform_setting">Platform Setting</option>
            <option value="ai_model">AI Model</option>
            <option value="maintenance">Maintenance</option>
            <option value="admin_account">Admin Account</option>
            <option value="admin_invitation">Admin Invitation</option>
            <option value="processing_job">Processing Job</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-400">Loading audit events...</div>
        ) : logs.length === 0 ? (
          <div className="py-20 text-center text-xs text-slate-500">
            No audit records matching criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Staff Actor</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Target Resource</th>
                  <th className="py-3 px-4">IP Address</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">
                        {log.actor_name || 'Staff User'}
                      </div>
                      <div className="text-[11px] text-slate-400">{log.actor_email}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border ${getActionBadgeColor(
                          log.action
                        )}`}
                      >
                        {log.action ? log.action.replace(/_/g, ' ') : 'Action'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-700 capitalize">
                      {log.resource_type ? log.resource_type.replace(/_/g, ' ') : 'Resource'}{' '}
                      {log.resource_id ? <span className="font-mono text-slate-400">#{log.resource_id}</span> : ''}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                      {log.ip_address || '127.0.0.1'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="px-2.5 py-1 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold transition"
                      >
                        <Eye className="w-3.5 h-3.5 inline mr-1" />
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details JSON Inspector Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in-50 duration-150">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 p-6 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center space-x-2">
                <Terminal className="w-5 h-5 text-brand-600" />
                <h3 className="text-sm font-extrabold text-slate-900">
                  Audit Event Dossier #{selectedLog.id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block">Staff Actor</span>
                  <span className="font-bold text-slate-900">{selectedLog.actor_email}</span>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block">IP Address</span>
                  <span className="font-mono text-slate-800">{selectedLog.ip_address || '127.0.0.1'}</span>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block">Action</span>
                  <span className="font-bold text-brand-700">{selectedLog.action}</span>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block">Target Resource</span>
                  <span className="font-bold text-slate-900">
                    {selectedLog.resource_type} #{selectedLog.resource_id}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                  Payload & Mutated Attributes (JSON)
                </span>
                <pre className="p-4 rounded-xl bg-slate-900 text-emerald-400 font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800 max-h-64">
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end shrink-0">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
