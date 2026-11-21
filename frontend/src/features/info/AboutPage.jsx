import React from 'react';
import { Link } from 'react-router-dom';
import { Target, Shield, BookOpen, Mic, ArrowLeft, CheckCircle2 } from 'lucide-react';
import BrandLogo from '../../components/shared/BrandLogo';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600 hover:text-sky-700 mb-6 group transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
            Back to Home
          </Link>
          <div className="flex items-center gap-3 mb-3">
            <BrandLogo size={32} />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            About InterviewPrep
          </h1>
          <p className="text-base text-slate-600 mt-2 max-w-2xl leading-relaxed">
            A salary-oriented, non-company-centric recruitment preparation platform and career intelligence ecosystem engineered for software students and early-career developers.
          </p>
        </div>

        {/* Mission Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-sky-600" />
            Core Philosophy & Positioning
          </h2>
          <div className="prose prose-slate text-sm text-slate-600 space-y-4 leading-relaxed">
            <p>
              Traditional recruitment preparation creates a false dilemma: students memorize company-specific interview trivia that changes every hiring season. When the questions change, the preparation collapses.
            </p>
            <p>
              <strong>InterviewPrep is salary-wise and role-wise, not company-wise.</strong> The technical depth, system design expectations, and problem-solving rigor required by modern tech hiring correspond to compensation tiers (e.g., ₹3–5 LPA, ₹5–7 LPA, ₹7–10 LPA, ₹10–18 LPA, ₹18–30 LPA, ₹30+ LPA) rather than arbitrary corporate tags.
            </p>
            <p>
              By training students on the foundational engineering standards associated with their target salary tier, candidates become capable of clearing interviews across multiple companies offering that compensation band.
            </p>
          </div>
        </div>

        {/* 3 Pillars Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="w-9 h-9 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center mb-3">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">1. Learn</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              12-week phased roadmaps connecting theoretical concepts with practical code tasks and weekly 45-question diagnostic assessments.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="w-9 h-9 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center mb-3">
              <Mic className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">2. Practice</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Browser-native speech-to-speech AI interviews (Technical, HR, and Mixed pipelines) alongside standardized cognitive aptitude practice.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="w-9 h-9 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center mb-3">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">3. Share Experience</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Real-world peer interview retrospectives with multi-stage breakdowns, exact questions asked, and automated risk moderation.
            </p>
          </div>
        </div>

        {/* ₹0 Budget Commitment */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
          <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            The ₹0 Operational Budget Commitment
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            The platform is built on open-source technologies (Django, React, Vite, Tailwind CSS, PostgreSQL) with zero paid cloud dependencies. AI voice simulations leverage native Web Speech APIs, and all backend AI services run in dual-mode (Deterministic local offline algorithmic execution + Google Generative AI free-tier quota) tracked exclusively in Indian Rupees (₹0.00).
          </p>
        </div>

        <div className="pt-4 flex justify-between items-center text-xs text-slate-500 border-t border-slate-200">
          <span>InterviewPrep Open Architecture</span>
          <Link to="/register" className="font-bold text-sky-600 hover:text-sky-700">
            Start Preparing Free &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
