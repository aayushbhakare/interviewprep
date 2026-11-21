import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';
import BrandLogo from '../../components/shared/BrandLogo';

export default function PrivacyPage() {
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
            <Shield className="w-7 h-7 text-sky-600" />
            Privacy Policy
          </h1>
          <p className="text-xs text-slate-500 mt-1">Last Updated: November 2026</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6 text-sm text-slate-600 leading-relaxed shadow-xs">
          <div>
            <h2 className="text-base font-bold text-slate-900 mb-2">1. Information We Collect</h2>
            <p>
              We collect information provided directly by you during registration: full name, email address, password, target job role, experience level, and target salary range. When uploading resumes, documents are securely stored solely to provide contextual probing during mock interviews.
            </p>
          </div>

          <div>
            <h2 className="text-base font-bold text-slate-900 mb-2">2. How Your Data Is Used</h2>
            <p>
              Your profile data is strictly utilized to tailor personalized learning roadmaps, calibrate weekly assessments, and evaluate mock interview simulations. We do not sell, rent, or monetize student personal data or resumes to third-party advertisers.
            </p>
          </div>

          <div>
            <h2 className="text-base font-bold text-slate-900 mb-2">3. Anonymous Experience Sharing</h2>
            <p>
              When contributing to the Share Interview Experience module, candidates have the option to publish anonymously as "Anonymous Candidate". In this mode, author name and profile links are completely masked from peer discovery feeds.
            </p>
          </div>

          <div>
            <h2 className="text-base font-bold text-slate-900 mb-2">4. Data Security & Storage</h2>
            <p>
              All passwords are cryptographically hashed using PBKDF2/bcrypt. Authenticated requests leverage short-lived JWT access tokens with rotation. Staff accounts are governed by mandatory Multi-Factor Authentication (2FA).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
