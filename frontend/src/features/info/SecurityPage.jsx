import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, Key, Lock, Database } from 'lucide-react';
import BrandLogo from '../../components/shared/BrandLogo';

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600 hover:text-sky-700 mb-6 group transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
            Back to Home
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <BrandLogo size={28} />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-sky-600" />
            Platform Security & Architecture
          </h1>
          <p className="text-xs text-slate-500 mt-1">Enterprise-grade security controls and integrity guarantees.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-4">
              <Key className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Staff Two-Factor Authentication (2FA)</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Mandatory TOTP / email verification 2FA for all administrative accounts with single-use backup recovery codes.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-4">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">JWT Rotation & Blacklisting</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Short-lived access tokens combined with secure refresh rotation and immediate token blacklisting upon logout.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-4">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Automated Disaster Recovery</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Automated PostgreSQL backups with rolling 14-day retention and transactional single-command recovery verification.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Zero Deployment Warnings</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Hardened with Django <code>check --deploy</code> reporting zero issues, OWASP CSRF defenses, and strict input sanitization.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
