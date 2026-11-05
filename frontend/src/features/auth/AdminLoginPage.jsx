import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import BrandLogo from '../../components/shared/BrandLogo';
import { ShieldCheck, Mail, Lock, KeyRound, AlertCircle, Loader2 } from 'lucide-react';

export default function AdminLoginPage() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1: credentials, 2: 2FA code
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [tempToken, setTempToken] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [infoMsg, setInfoMsg] = useState(null);

  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfoMsg(null);

    try {
      const res = await api.post('/admin-panel/auth/login/', formData);
      const data = res.data.data;
      if (data.status === '2fa_required') {
        setTempToken(data.temp_token);
        setInfoMsg(data.message || 'Please enter the 2FA code sent to your admin email.');
        setStep(2);
      }
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.response?.data?.error?.details?.detail || 'Administrator authentication failed.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handle2FASubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.post('/admin-panel/auth/2fa/verify/', {
        temp_token: tempToken,
        code: twoFactorCode,
      });
      const { access, refresh } = res.data.data;
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.response?.data?.error?.details?.detail || '2FA verification failed.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <BrandLogo size={36} className="justify-center mb-4" linkTo="/" />
        <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl mx-auto flex items-center justify-center mb-3">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h2 className="text-center text-3xl font-extrabold text-slate-900 tracking-tight">
          Administrator Portal
        </h2>
        <p className="mt-2 text-center text-xs text-slate-500">
          Invitation-only staff access with mandatory 2FA.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-xl sm:px-10 border border-slate-200">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3 flex items-start space-x-2 text-red-700 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {infoMsg && (
            <div className="mb-4 bg-blue-50 border border-blue-200 rounded-md p-3 flex items-start space-x-2 text-blue-800 text-sm">
              <ShieldCheck className="w-5 h-5 flex-shrink-0 mt-0.5 text-blue-600" />
              <span>{infoMsg}</span>
            </div>
          )}

          {step === 1 ? (
            <form className="space-y-5" onSubmit={handleCredentialsSubmit}>
              <div>
                <label className="block text-sm font-medium text-slate-700">Administrator Email</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="admin@interviewprep.local"
                    className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Password</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type="password"
                    name="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                    placeholder="••••••••"
                    className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 disabled:opacity-50 transition-colors"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Validating...
                  </>
                ) : (
                  'Continue with 2FA'
                )}
              </button>
            </form>
          ) : (
            <form className="space-y-5" onSubmit={handle2FASubmit}>
              <div>
                <label className="block text-sm font-medium text-slate-700">6-Digit 2FA Security Code</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="block w-full pl-10 pr-3 py-2 tracking-widest text-center text-lg font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || twoFactorCode.length !== 6}
                className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 transition-colors"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Verifying 2FA...
                  </>
                ) : (
                  'Authorize Admin Session'
                )}
              </button>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full text-center text-xs text-slate-500 hover:text-slate-800"
              >
                Back to credentials
              </button>
            </form>
          )}

          <div className="mt-6 border-t border-slate-200 pt-4 text-center">
            <Link to="/login" className="text-xs text-slate-500 hover:text-slate-700">
              Back to Student Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
