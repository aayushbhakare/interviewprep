import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import {
  ShieldCheck,
  UserPlus,
  Ban,
  RotateCcw,
  Trash2,
  Clock,
  AlertTriangle,
  X,
  Mail,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';

export default function AdminSecurityPage() {
  const [admins, setAdmins] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Invite form state
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('staff');
  const [createdInviteToken, setCreatedInviteToken] = useState(null);

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const fetchSecurityData = async () => {
    try {
      setLoading(true);
      const [adminsRes, invitesRes] = await Promise.all([
        adminService.getAdminAccounts(),
        adminService.getAdminInvitations(),
      ]);
      setAdmins(adminsRes.data.admins || []);
      setInvitations(invitesRes.data.invitations || []);
    } catch (err) {
      console.error('Failed to load admin security data:', err);
      setFeedback({ type: 'error', message: 'Failed to load administrator accounts.' });
    } finally {
      setLoading(false);
    }
  };

  const activeAdminsCount = admins.filter((a) => a.is_active).length;

  const handleDeactivate = async (admin) => {
    if (activeAdminsCount <= 1) {
      alert('Safety Lockout Prevention: You cannot deactivate the last active administrator.');
      return;
    }

    if (!window.confirm(`Deactivate staff privileges for ${admin.email}?`)) {
      return;
    }

    try {
      setActionLoading(true);
      await adminService.deactivateAdmin(admin.id);
      setFeedback({
        type: 'success',
        message: `Admin privileges for ${admin.email} deactivated.`,
      });
      fetchSecurityData();
    } catch (err) {
      console.error('Failed to deactivate admin:', err);
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to deactivate admin.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReactivate = async (admin) => {
    try {
      setActionLoading(true);
      await adminService.reactivateAdmin(admin.id);
      setFeedback({
        type: 'success',
        message: `Admin privileges for ${admin.email} reactivated.`,
      });
      fetchSecurityData();
    } catch (err) {
      console.error('Failed to reactivate admin:', err);
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to reactivate admin.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendInvite = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const res = await adminService.sendAdminInvitation(inviteEmail.trim(), inviteRole);
      setCreatedInviteToken(res.data?.token || res.data?.data?.token || 'INVITE-TOKEN-GENERATED');
      setFeedback({
        type: 'success',
        message: `Invitation token created for ${inviteEmail}. Single-use token expires in 7 days.`,
      });
      setInviteEmail('');
      fetchSecurityData();
    } catch (err) {
      console.error('Failed to generate admin invitation:', err);
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to generate invitation.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevokeInvite = async (invitationId) => {
    if (!window.confirm('Revoke this staff invitation immediately?')) {
      return;
    }

    try {
      setActionLoading(true);
      await adminService.revokeAdminInvitation(invitationId);
      setFeedback({
        type: 'success',
        message: 'Invitation revoked successfully.',
      });
      fetchSecurityData();
    } catch (err) {
      console.error('Failed to revoke invitation:', err);
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to revoke invitation.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Admin Accounts & Security Governance
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage staff privileges, generate single-use onboarding invitation tokens, and enforce administrative security.
          </p>
        </div>
        <button
          onClick={() => {
            setInviteModalOpen(true);
            setCreatedInviteToken(null);
          }}
          className="px-4 py-2 rounded-xl bg-brand-600 text-white hover:bg-brand-700 text-xs font-bold transition shadow-xs flex items-center gap-1.5"
        >
          <UserPlus className="w-4 h-4" />
          <span>Invite Administrator</span>
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

      {/* Safety Guard Card */}
      <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block">Lockout Prevention Guarantee</span>
          <p className="text-amber-900/80 mt-0.5 leading-relaxed">
            The platform prevents accidental self-lockout. The last remaining active administrator account cannot be deactivated under any circumstances (enforced at both UI and Django database transaction levels).
          </p>
        </div>
      </div>

      {/* Admin Accounts Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-slate-900">
            Staff & Platform Administrators ({admins.length})
          </h3>
          <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200">
            {activeAdminsCount} Active Admins
          </span>
        </div>

        {loading ? (
          <div className="py-20 text-center text-xs text-slate-400">Loading administrator registry...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Administrator</th>
                  <th className="py-3 px-4">Role & Privileges</th>
                  <th className="py-3 px-4">Last Activity</th>
                  <th className="py-3 px-4">Account Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {admins.map((adm) => {
                  const isLastActive = adm.is_active && activeAdminsCount <= 1;
                  return (
                    <tr key={adm.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{adm.full_name || 'Staff User'}</div>
                        <div className="text-[11px] text-slate-400">{adm.email}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-brand-50 text-brand-700 border border-brand-200">
                          {adm.is_superuser ? 'Super Administrator' : 'Platform Staff'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {adm.last_login
                          ? new Date(adm.last_login).toLocaleString()
                          : 'Never logged in'}
                      </td>
                      <td className="py-3 px-4">
                        {adm.is_active ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                            Deactivated
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {adm.is_active ? (
                          <button
                            onClick={() => handleDeactivate(adm)}
                            disabled={actionLoading || isLastActive}
                            title={isLastActive ? 'Cannot deactivate last active administrator' : 'Deactivate Admin'}
                            className="px-2.5 py-1 rounded-lg border border-rose-300 text-rose-700 hover:bg-rose-50 font-bold transition disabled:opacity-40 disabled:hover:bg-transparent"
                          >
                            <Ban className="w-3.5 h-3.5 inline mr-1" />
                            Deactivate
                          </button>
                        ) : (
                          <button
                            onClick={() => handleReactivate(adm)}
                            disabled={actionLoading}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 font-bold transition disabled:opacity-50"
                          >
                            <RotateCcw className="w-3.5 h-3.5 inline mr-1" />
                            Reactivate
                          </button>
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

      {/* Invitations Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">
              Administrative Invitations ({invitations.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Secure single-use token onboarding links with 7-day automatic expiry.
            </p>
          </div>
        </div>

        {invitations.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-500">
            No pending or active administrator invitations found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Invited Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Issued</th>
                  <th className="py-3 px-4">Expires</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invitations.map((inv) => {
                  const isExpired = new Date(inv.expires_at) < new Date();
                  const isRevoked = inv.is_revoked;
                  const isAccepted = inv.is_accepted;
                  const isPending = !isAccepted && !isRevoked && !isExpired;

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">{inv.email}</td>
                      <td className="py-3 px-4 font-semibold text-slate-700 capitalize">{inv.role || 'Staff'}</td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {new Date(inv.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {new Date(inv.expires_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        {isAccepted && (
                          <span className="inline-block px-2 py-0.5 rounded text-[10.5px] font-bold bg-emerald-100 text-emerald-800">
                            Accepted
                          </span>
                        )}
                        {isRevoked && (
                          <span className="inline-block px-2 py-0.5 rounded text-[10.5px] font-bold bg-rose-100 text-rose-800">
                            Revoked
                          </span>
                        )}
                        {!isAccepted && !isRevoked && isExpired && (
                          <span className="inline-block px-2 py-0.5 rounded text-[10.5px] font-bold bg-slate-100 text-slate-600">
                            Expired
                          </span>
                        )}
                        {isPending && (
                          <span className="inline-block px-2 py-0.5 rounded text-[10.5px] font-bold bg-amber-100 text-amber-800">
                            Pending Use
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {isPending && (
                          <button
                            onClick={() => handleRevokeInvite(inv.id)}
                            disabled={actionLoading}
                            className="px-2.5 py-1 rounded-lg border border-rose-300 text-rose-700 hover:bg-rose-50 font-bold transition disabled:opacity-50"
                          >
                            <Trash2 className="w-3.5 h-3.5 inline mr-1" />
                            Revoke
                          </button>
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

      {/* Invite Modal */}
      {inviteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in-50 duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-brand-600" />
                <span>Issue Staff Invitation</span>
              </h3>
              <button
                onClick={() => setInviteModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createdInviteToken ? (
              <div className="pt-4 space-y-4">
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950">
                  <span className="font-bold block mb-1">Invitation Issued Successfully!</span>
                  <p className="text-emerald-900/80 mb-3">
                    A single-use onboarding token has been generated. Provide this token to the recipient to complete 2FA-secured onboarding.
                  </p>
                  <label className="block text-[11px] font-bold text-emerald-800 uppercase tracking-wider mb-1">
                    Onboarding Token (Single-Use):
                  </label>
                  <pre className="p-2.5 rounded-lg bg-white border border-emerald-300 text-emerald-950 font-mono text-xs select-all break-all">
                    {createdInviteToken}
                  </pre>
                </div>
                <button
                  onClick={() => setInviteModalOpen(false)}
                  className="w-full py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-black transition"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleSendInvite} className="pt-4 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Recipient Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="e.g. colleague@university.edu"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-brand-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Assigned Role
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-brand-500 font-semibold"
                  >
                    <option value="staff">Platform Staff (Operations & Moderation)</option>
                    <option value="admin">Platform Administrator (Full Permissions)</option>
                  </select>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setInviteModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading || !inviteEmail.trim()}
                    className="px-4 py-2 text-xs font-bold bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition disabled:opacity-50"
                  >
                    {actionLoading ? 'Issuing...' : 'Generate Invitation'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
