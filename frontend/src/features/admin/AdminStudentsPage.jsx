import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import {
  Users,
  Search,
  Filter,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Eye,
  Ban,
  RotateCcw,
  AlertTriangle,
  X,
  FileText,
  Clock,
  Sparkles,
} from 'lucide-react';

export default function AdminStudentsPage() {
  const [students, setStudents] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isVerifiedFilter, setIsVerifiedFilter] = useState('');
  const [isSuspendedFilter, setIsSuspendedFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Modals state
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [studentDetail, setStudentDetail] = useState(null);

  const [suspendModalStudent, setSuspendModalStudent] = useState(null);
  const [suspensionReason, setSuspensionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    fetchStudents();
  }, [search, isVerifiedFilter, isSuspendedFilter, currentPage]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const params = { page: currentPage };
      if (search) params.search = search;
      if (isVerifiedFilter !== '') params.is_verified = isVerifiedFilter;
      if (isSuspendedFilter !== '') params.is_suspended = isSuspendedFilter;

      const res = await adminService.getStudents(params);
      setStudents(res.data.results || []);
      setTotalCount(res.data.count || 0);
    } catch (err) {
      console.error('Failed to load students:', err);
      setFeedback({ type: 'error', message: 'Failed to load students list.' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetail = async (student) => {
    try {
      setSelectedStudent(student);
      setDetailLoading(true);
      const res = await adminService.getStudentDetail(student.id);
      setStudentDetail(res.data);
    } catch (err) {
      console.error('Failed to load student detail:', err);
      setFeedback({ type: 'error', message: 'Failed to load student profile details.' });
    } finally {
      setDetailLoading(false);
    }
  };

  const handleConfirmSuspend = async (e) => {
    e.preventDefault();
    if (!suspensionReason.trim()) {
      alert('A suspension reason is mandatory for audit compliance.');
      return;
    }

    try {
      setActionLoading(true);
      await adminService.suspendStudent(suspendModalStudent.id, suspensionReason.trim());
      setFeedback({
        type: 'success',
        message: `Student account ${suspendModalStudent.email} suspended successfully.`,
      });
      setSuspendModalStudent(null);
      setSuspensionReason('');
      fetchStudents();
      if (selectedStudent?.id === suspendModalStudent.id) {
        handleOpenDetail(suspendModalStudent);
      }
    } catch (err) {
      console.error('Failed to suspend student:', err);
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to suspend student.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReactivate = async (student) => {
    if (!window.confirm(`Are you sure you want to reactivate ${student.email}?`)) {
      return;
    }

    try {
      setActionLoading(true);
      await adminService.reactivateStudent(student.id);
      setFeedback({
        type: 'success',
        message: `Student account ${student.email} reactivated successfully.`,
      });
      fetchStudents();
      if (selectedStudent?.id === student.id) {
        handleOpenDetail(student);
      }
    } catch (err) {
      console.error('Failed to reactivate student:', err);
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to reactivate student.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Student Account Governance
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Search, inspect preparation trajectories, enforce policy compliance, and manage student suspension status.
          </p>
        </div>
        <div className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700">
          Total Candidates: {totalCount}
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
            placeholder="Search student by full name, email, target role, or college..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={isVerifiedFilter}
            onChange={(e) => {
              setIsVerifiedFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs p-2 rounded-xl border border-slate-300 bg-white text-slate-700 font-medium focus:ring-2 focus:ring-brand-500"
          >
            <option value="">All Verification</option>
            <option value="true">Verified Students</option>
            <option value="false">Unverified</option>
          </select>

          <select
            value={isSuspendedFilter}
            onChange={(e) => {
              setIsSuspendedFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs p-2 rounded-xl border border-slate-300 bg-white text-slate-700 font-medium focus:ring-2 focus:ring-brand-500"
          >
            <option value="">All Account Statuses</option>
            <option value="false">Active Only</option>
            <option value="true">Suspended Only</option>
          </select>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">Loading student registry...</div>
        ) : students.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-500">
            No students found matching current filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Target Role & Salary</th>
                  <th className="py-3 px-4">Registered</th>
                  <th className="py-3 px-4">Verification</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{student.full_name || 'Candidate'}</div>
                      <div className="text-[11px] text-slate-500">{student.email}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">
                        {student.target_role || 'Not set'}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {student.target_salary_range || 'General tier'}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {new Date(student.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      {student.is_verified ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {student.is_suspended ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                          <Ban className="w-3 h-3" />
                          Suspended
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => handleOpenDetail(student)}
                        className="px-2.5 py-1 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold transition"
                        title="View Full Profile"
                      >
                        <Eye className="w-3.5 h-3.5 inline mr-1" />
                        Details
                      </button>

                      {student.is_suspended ? (
                        <button
                          onClick={() => handleReactivate(student)}
                          disabled={actionLoading}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 font-bold transition disabled:opacity-50"
                        >
                          <RotateCcw className="w-3.5 h-3.5 inline mr-1" />
                          Reactivate
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setSuspendModalStudent(student);
                            setSuspensionReason('');
                          }}
                          disabled={actionLoading}
                          className="px-2.5 py-1 rounded-lg border border-rose-300 text-rose-700 hover:bg-rose-50 font-bold transition disabled:opacity-50"
                        >
                          <Ban className="w-3.5 h-3.5 inline mr-1" />
                          Suspend
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Student Detail Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in-50 duration-150">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-black text-sm">
                  {selectedStudent.full_name ? selectedStudent.full_name.charAt(0).toUpperCase() : 'S'}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {selectedStudent.full_name || 'Candidate Profile'}
                  </h3>
                  <span className="text-xs text-slate-500">{selectedStudent.email}</span>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedStudent(null);
                  setStudentDetail(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {detailLoading ? (
              <div className="py-12 text-center text-xs text-slate-400">Loading full activity dossier...</div>
            ) : studentDetail ? (
              <div className="space-y-6 pt-4">
                {/* Status Badges Bar */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-100 text-slate-800">
                    Target: {studentDetail.profile?.target_role || 'General Software Engineering'}
                  </span>
                  <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-100 text-slate-800">
                    Tier: {studentDetail.profile?.target_salary_range || '₹10-20 LPA'}
                  </span>
                  <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-100 text-slate-800">
                    Exp: {studentDetail.profile?.experience_level || 'Fresher'}
                  </span>
                  {studentDetail.user?.is_suspended ? (
                    <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                      Suspended Account
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Active Account
                    </span>
                  )}
                </div>

                {/* Suspension Details if active */}
                {studentDetail.user?.is_suspended && (
                  <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs">
                    <span className="font-bold text-rose-900 block mb-1">
                      Account Suspension Enforced
                    </span>
                    <p className="text-rose-700">
                      Reason: {studentDetail.user?.suspension_reason || 'Policy violation.'}
                    </p>
                  </div>
                )}

                {/* Activity Statistics Grid */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                    Aggregated Module Activity Dossier
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-lg font-black text-slate-900 block">
                        {studentDetail.activity_summary?.quiz_attempts || 0}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500">Weekly Quizzes</span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-lg font-black text-slate-900 block">
                        {studentDetail.activity_summary?.aptitude_sessions || 0}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500">Aptitude Tests</span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-lg font-black text-slate-900 block">
                        {studentDetail.activity_summary?.interview_sessions || 0}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500">Mock Interviews</span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-lg font-black text-slate-900 block">
                        {studentDetail.activity_summary?.experiences_authored || 0}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500">Experiences</span>
                    </div>
                  </div>
                </div>

                {/* Account Metadata */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span className="font-semibold">Email Verified:</span>
                    <span>{studentDetail.user?.is_verified ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Account Registered:</span>
                    <span>{new Date(studentDetail.user?.created_at).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Last Active:</span>
                    <span>
                      {studentDetail.user?.last_login
                        ? new Date(studentDetail.user.last_login).toLocaleString()
                        : 'Never logged in'}
                    </span>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => {
                  setSelectedStudent(null);
                  setStudentDetail(null);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suspend Confirmation Modal */}
      {suspendModalStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in-50 duration-150">
          <form
            onSubmit={handleConfirmSuspend}
            className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 p-6"
          >
            <div className="flex items-center space-x-2.5 text-rose-600 mb-3">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <h3 className="text-sm font-bold text-slate-900">Enforce Account Suspension</h3>
            </div>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Suspending <strong>{suspendModalStudent.email}</strong> will block all student API access, cancel in-flight interview sessions, and restrict authentication.
            </p>

            <div className="space-y-1.5 mb-5">
              <label className="block text-xs font-bold text-slate-700">
                Suspension Reason (Mandatory for Audit Trail) <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={suspensionReason}
                onChange={(e) => setSuspensionReason(e.target.value)}
                rows={3}
                required
                placeholder="Specify policy or security justification (e.g. Terms of Service abuse, spam submissions, automated scraping)..."
                className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition shadow-xs"
              />
            </div>

            <div className="flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => {
                  setSuspendModalStudent(null);
                  setSuspensionReason('');
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading || !suspensionReason.trim()}
                className="px-4 py-2 text-xs font-bold bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition disabled:opacity-50"
              >
                {actionLoading ? 'Suspending...' : 'Confirm Suspension'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
