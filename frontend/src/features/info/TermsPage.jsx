import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';
import BrandLogo from '../../components/shared/BrandLogo';

export default function TermsPage() {
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
            <FileText className="w-7 h-7 text-sky-600" />
            Terms of Service
          </h1>
          <p className="text-xs text-slate-500 mt-1">Last Updated: November 2026</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6 text-sm text-slate-600 leading-relaxed shadow-xs">
          <div>
            <h2 className="text-base font-bold text-slate-900 mb-2">1. Educational Platform Scope</h2>
            <p>
              InterviewPrep provides educational preparation tools, algorithmic practice tasks, cognitive tests, and AI-driven interview simulations. The platform is designed to calibrate candidate readiness based on industry compensation benchmarks.
            </p>
          </div>

          <div>
            <h2 className="text-base font-bold text-slate-900 mb-2">2. No Guarantee of Employment</h2>
            <p>
              While our curriculum reflects rigorous technical and behavioral standards, InterviewPrep makes no explicit or implied guarantee of job placement, hiring success, salary offers, or employment at any specific company.
            </p>
          </div>

          <div>
            <h2 className="text-base font-bold text-slate-900 mb-2">3. User Responsibilities & Conduct</h2>
            <p>
              Candidates agree to submit accurate profile information and adhere to academic honesty during assessments. In the Share Interview Experience module, students may not submit confidential proprietary code, non-disclosure agreement (NDA) protected trade secrets, abusive content, or personally identifiable information (PII).
            </p>
          </div>

          <div>
            <h2 className="text-base font-bold text-slate-900 mb-2">4. Community Guidelines & Moderation</h2>
            <p>
              Submissions undergo automated risk moderation and administrative review. Content violating community guidelines or receiving 3+ verified reports may be suspended or removed to maintain platform integrity.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
