import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { Mail, KeyRound, CheckCircle2, AlertCircle, Loader2, RotateCcw } from 'lucide-react';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!code || code.length !== 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/verify-email/', { email, code });
      setSuccessMsg('Email verified successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.response?.data?.error?.details?.detail || 'Verification failed.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || !email) return;
    setResending(true);
    setError(null);
    try {
      await api.post('/auth/resend-code/', { email });
      setSuccessMsg('A new verification code has been dispatched.');
      setCooldown(60);
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.response?.data?.error?.details?.detail || 'Failed to resend code.';
      setError(msg);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="w-12 h-12 bg-brand-50 text-brand-600 rounded-xl mx-auto flex items-center justify-center mb-3">
          <Mail className="w-6 h-6" />
        </div>
        <h2 className="text-center text-3xl font-extrabold text-slate-900 tracking-tight">
          Verify your email
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Enter the 6-digit code sent to <span className="font-semibold text-slate-900">{email || 'your email'}</span>
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

          {successMsg && (
            <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-md p-3 flex items-start space-x-2 text-emerald-800 text-sm">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleVerify}>
            <div>
              <label className="block text-sm font-medium text-slate-700">Email Address</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@example.com"
                  className="block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">6-Digit Code</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="block w-full pl-10 pr-3 py-2 tracking-widest text-center text-lg font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                  Verifying...
                </>
              ) : (
                'Verify & Proceed'
              )}
            </button>
          </form>

          <div className="mt-6 border-t border-slate-200 pt-4 flex items-center justify-between text-xs text-slate-600">
            <span>Didn't receive the code?</span>
            <button
              type="button"
              disabled={cooldown > 0 || resending}
              onClick={handleResend}
              className="inline-flex items-center text-brand-600 hover:text-brand-500 font-semibold disabled:text-slate-400 transition-colors"
            >
              {resending ? (
                <>
                  <Loader2 className="animate-spin mr-1 h-3 w-3" /> Sending...
                </>
              ) : cooldown > 0 ? (
                `Resend in ${cooldown}s`
              ) : (
                <>
                  <RotateCcw className="mr-1 h-3 w-3" /> Resend Code
                </>
              )}
            </button>
          </div>

          <div className="mt-4 text-center">
            <Link to="/login" className="text-xs text-slate-500 hover:text-slate-700">
              Back to Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
