import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import {
  User,
  Mail,
  Lock,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  Shield,
  Briefcase,
  DollarSign,
  Phone,
} from 'lucide-react';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout, refreshProfile } = useAuth();

  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'security' | 'email' | 'delete'
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Profile Edit form
  const [editForm, setEditForm] = useState({
    full_name: '',
    phone_number: '',
    target_role: '',
    experience_level: '',
    target_salary: '',
  });

  // Password Change form
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  // Email Change flow
  const [emailStep, setEmailStep] = useState(1);
  const [emailForm, setEmailForm] = useState({
    new_email: '',
    password: '',
    code: '',
  });

  // Account Delete form
  const [deleteForm, setDeleteForm] = useState({
    password: '',
    confirmation: '',
  });

  const fetchProfileDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get('/account/profile/');
      const data = res.data.data;
      setProfileData(data);
      setEditForm({
        full_name: data.full_name || '',
        phone_number: data.phone_number || '',
        target_role: data.target_role || '',
        experience_level: data.experience_level || '',
        target_salary: data.target_salary || '',
      });
    } catch (err) {
      setErrorMsg('Failed to load profile details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileDetails();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setStatusMsg(null);
    setErrorMsg(null);

    try {
      const res = await api.patch('/account/profile/', editForm);
      setProfileData(res.data.data);
      setStatusMsg('Profile updated successfully.');
      refreshProfile();
    } catch (err) {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to update profile.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setStatusMsg(null);
    setErrorMsg(null);

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setErrorMsg('New passwords do not match.');
      setActionLoading(false);
      return;
    }

    try {
      await api.post('/account/change-password/', passwordForm);
      setStatusMsg('Password updated successfully. Other sessions have been signed out.');
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      const errDetails = err.response?.data?.error?.details || {};
      const fieldMsg = errDetails.new_password || errDetails.current_password || errDetails.detail;
      const formattedFieldMsg = Array.isArray(fieldMsg) ? fieldMsg.join(' ') : fieldMsg;
      setErrorMsg(formattedFieldMsg || err.response?.data?.error?.message || 'Failed to change password.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestEmailChange = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setStatusMsg(null);
    setErrorMsg(null);

    try {
      await api.post('/account/change-email/request/', {
        new_email: emailForm.new_email,
        password: emailForm.password,
      });
      setEmailStep(2);
      setStatusMsg(`Verification code sent to ${emailForm.new_email}.`);
    } catch (err) {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to initiate email change.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmEmailChange = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setStatusMsg(null);
    setErrorMsg(null);

    try {
      await api.post('/account/change-email/confirm/', {
        new_email: emailForm.new_email,
        code: emailForm.code,
      });
      setStatusMsg('Email address updated successfully.');
      setEmailStep(1);
      setEmailForm({ new_email: '', password: '', code: '' });
      fetchProfileDetails();
      refreshProfile();
    } catch (err) {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to confirm email change.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    if (deleteForm.confirmation.trim() !== 'DELETE') {
      setErrorMsg('Please type DELETE exactly to confirm.');
      return;
    }

    setActionLoading(true);
    setStatusMsg(null);
    setErrorMsg(null);

    try {
      await api.post('/account/delete/', deleteForm);
      logout();
      navigate('/register');
    } catch (err) {
      setErrorMsg(err.response?.data?.error?.message || 'Account deletion failed.');
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Profile & Account Settings</h1>
        <p className="mt-1 text-sm text-slate-600">
          Manage your personal details, security credentials, and preferences.
        </p>
      </div>

      {statusMsg && (
        <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-center space-x-3 text-emerald-800 text-sm">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
          <span>{statusMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3 text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Profile Overview Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-2xl font-bold uppercase">
            {profileData?.full_name ? profileData.full_name[0] : 'U'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">{profileData?.full_name}</h2>
            <div className="flex items-center space-x-2 text-sm text-slate-500 mt-0.5">
              <Mail className="w-3.5 h-3.5" />
              <span>{profileData?.email}</span>
            </div>
            <div className="flex items-center space-x-3 mt-2 text-xs text-slate-500">
              <span className="flex items-center">
                <Calendar className="w-3.5 h-3.5 mr-1" />
                Joined {new Date(profileData?.created_at).toLocaleDateString()}
              </span>
              {profileData?.is_verified && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full font-medium bg-emerald-100 text-emerald-800">
                  Verified Student
                </span>
              )}
            </div>
          </div>
        </div>

        <div>
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-red-600 border border-slate-300 rounded-lg hover:border-red-300 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 mb-6 flex space-x-8 text-sm font-medium">
        <button
          onClick={() => setActiveTab('details')}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === 'details'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Profile Details
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === 'security'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Change Password
        </button>
        <button
          onClick={() => setActiveTab('email')}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === 'email'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Change Email
        </button>
        <button
          onClick={() => setActiveTab('delete')}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === 'delete'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-slate-500 hover:text-red-600'
          }`}
        >
          Delete Account
        </button>
      </div>

      {/* Tab 1: Profile Details */}
      {activeTab === 'details' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Edit Profile Information</h3>
          <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-lg">
            <div>
              <label className="block text-sm font-medium text-slate-700">Full Name</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  value={editForm.full_name}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, full_name: e.target.value }))}
                  className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Phone Number (Optional)</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Phone className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  value={editForm.phone_number}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, phone_number: e.target.value }))}
                  placeholder="+91 98765 43210"
                  className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Target Role (Optional)</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Briefcase className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  value={editForm.target_role}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, target_role: e.target.value }))}
                  placeholder="e.g. Full Stack Developer"
                  className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Target Salary Tier (Optional)</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <DollarSign className="h-4 w-4" />
                </div>
                <select
                  value={editForm.target_salary}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, target_salary: e.target.value }))}
                  className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">Not selected</option>
                  <option value="Below ₹3 LPA">Below ₹3 LPA</option>
                  <option value="₹3–5 LPA">₹3–5 LPA</option>
                  <option value="₹5–7 LPA">₹5–7 LPA</option>
                  <option value="₹7–10 LPA">₹7–10 LPA</option>
                  <option value="₹10–15 LPA">₹10–15 LPA</option>
                  <option value="₹15+ LPA">₹15+ LPA</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={actionLoading}
              className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {actionLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      )}

      {/* Tab 2: Security / Password */}
      {activeTab === 'security' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Change Account Password</h3>
          <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
            <div>
              <label className="block text-sm font-medium text-slate-700">Current Password</label>
              <input
                type="password"
                required
                value={passwordForm.current_password}
                onChange={(e) => setPasswordForm((prev) => ({ ...prev, current_password: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">New Password (min 8 chars)</label>
              <input
                type="password"
                required
                value={passwordForm.new_password}
                onChange={(e) => setPasswordForm((prev) => ({ ...prev, new_password: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Confirm New Password</label>
              <input
                type="password"
                required
                value={passwordForm.confirm_password}
                onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirm_password: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {actionLoading ? 'Updating Password...' : 'Update Password'}
            </button>
          </form>
        </div>
      )}

      {/* Tab 3: Change Email */}
      {activeTab === 'email' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-2">Change Registered Email</h3>
          <p className="text-xs text-slate-500 mb-4">
            Changing your email requires verifying a 6-digit code sent to the new email address.
          </p>

          {emailStep === 1 ? (
            <form onSubmit={handleRequestEmailChange} className="space-y-4 max-w-lg">
              <div>
                <label className="block text-sm font-medium text-slate-700">New Email Address</label>
                <input
                  type="email"
                  required
                  value={emailForm.new_email}
                  onChange={(e) => setEmailForm((prev) => ({ ...prev, new_email: e.target.value }))}
                  placeholder="newemail@example.com"
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Current Password</label>
                <input
                  type="password"
                  required
                  value={emailForm.password}
                  onChange={(e) => setEmailForm((prev) => ({ ...prev, password: e.target.value }))}
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {actionLoading ? 'Sending Code...' : 'Send Verification Code'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleConfirmEmailChange} className="space-y-4 max-w-lg">
              <p className="text-sm text-slate-700">
                Enter the 6-digit code sent to <span className="font-semibold">{emailForm.new_email}</span>:
              </p>
              <div>
                <label className="block text-sm font-medium text-slate-700">6-Digit Code</label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={emailForm.code}
                  onChange={(e) => setEmailForm((prev) => ({ ...prev, code: e.target.value.replace(/\D/g, '') }))}
                  placeholder="123456"
                  className="mt-1 block w-full tracking-widest text-center text-lg font-mono px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={actionLoading || emailForm.code.length !== 6}
                  className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  {actionLoading ? 'Verifying...' : 'Confirm Email Change'}
                </button>
                <button
                  type="button"
                  onClick={() => setEmailStep(1)}
                  className="px-4 py-2.5 text-sm text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Tab 4: Delete Account */}
      {activeTab === 'delete' && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-red-900 mb-2">Delete Account</h3>
          <p className="text-sm text-red-700 mb-4">
            Warning: This action is permanent. All your progress, roadmaps, and personal profile data will be permanently removed.
          </p>
          <form onSubmit={handleDeleteAccount} className="space-y-4 max-w-lg">
            <div>
              <label className="block text-sm font-medium text-red-900">Your Password</label>
              <input
                type="password"
                required
                value={deleteForm.password}
                onChange={(e) => setDeleteForm((prev) => ({ ...prev, password: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 border border-red-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-red-900">
                Type <span className="font-bold">DELETE</span> to confirm
              </label>
              <input
                type="text"
                required
                value={deleteForm.confirmation}
                onChange={(e) => setDeleteForm((prev) => ({ ...prev, confirmation: e.target.value }))}
                placeholder="DELETE"
                className="mt-1 block w-full px-3 py-2 border border-red-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 bg-white"
              />
            </div>
            <button
              type="submit"
              disabled={actionLoading || deleteForm.confirmation !== 'DELETE'}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
            >
              {actionLoading ? 'Deleting Account...' : 'Permanently Delete Account'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
