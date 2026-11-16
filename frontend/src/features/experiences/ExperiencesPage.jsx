import React from 'react';
import { Link } from 'react-router-dom';
import { Share2, Shield, Filter, Award, Clock, ArrowRight } from 'lucide-react';

export default function ExperiencesPage() {
  const filterCategories = [
    { name: 'Target Salary Tier', examples: 'Below ₹3, ₹3–5, ₹5–7, ₹7–10, ₹10–15, ₹15+ LPA' },
    { name: 'Job Role', examples: 'Backend Developer, Frontend Developer, Full Stack, QA Engineer' },
    { name: 'Experience Level', examples: 'Freshers, 0-1 Year, 1-3 Years, 3-5 Years' },
    { name: 'Company Name', examples: 'Discovery filter only (not used in Learn/Practice curricula)' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Module Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
            <Share2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Share Interview Experience — Peer Intelligence
            </h1>
            <p className="text-sm sm:text-base text-slate-600">
              Read authentic recruitment journeys and submit your own interview story to help peers.
            </p>
          </div>
        </div>
      </div>

      {/* Module Implementation Status Banner */}
      <div className="mb-8 bg-purple-50/70 border border-purple-200 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start space-x-3">
          <Clock className="w-5 h-5 text-purple-600 mt-0.5 shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-purple-900">Module Status: Scheduled for Phase 8</h3>
            <p className="text-xs sm:text-sm text-purple-700 mt-0.5">
              The multi-stage experience submission wizard, auto-moderation pipeline, and discovery feed launch in Phase 8.
            </p>
          </div>
        </div>
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 shrink-0">
          Phase 8 Milestone
        </span>
      </div>

      {/* Architectural Principles of Share Experience */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <Shield className="w-6 h-6 text-purple-600 mb-3" />
          <h2 className="text-lg font-bold text-slate-900 mb-1">Risk-Based Auto Moderation</h2>
          <p className="text-sm text-slate-600">
            Submissions are screened automatically for PII, company confidentiality violations, offensive language, and quality standards before publication.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <Award className="w-6 h-6 text-purple-600 mb-3" />
          <h2 className="text-lg font-bold text-slate-900 mb-1">Stage-by-Stage Breakdowns</h2>
          <p className="text-sm text-slate-600">
            Experiences detail exact round structures: Online Assessment, Technical Round 1, Technical Round 2, Managerial Round, and HR Negotiation.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <Filter className="w-6 h-6 text-purple-600 mb-3" />
          <h2 className="text-lg font-bold text-slate-900 mb-1">Company Discovery Filter</h2>
          <p className="text-sm text-slate-600">
            Company names are collected strictly within this module to power transparent search and peer insights without distorting the salary-based learning track.
          </p>
        </div>
      </div>

      {/* Discovery Filters Preview */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 mb-2">Discovery Taxonomy (Preview)</h2>
        <p className="text-sm text-slate-600 mb-6">
          When the story repository goes live, you will be able to filter authentic interview submissions across these dimensions:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {filterCategories.map((f) => (
            <div key={f.name} className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <h3 className="text-sm font-bold text-slate-900">{f.name}</h3>
              <p className="text-xs text-slate-500 mt-1">{f.examples}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-slate-100 gap-4">
          <p className="text-xs text-slate-500">
            Contributors retain the option to publish stories with their public profile or 100% anonymously.
          </p>
          <Link
            to="/dashboard"
            className="inline-flex items-center text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            Return to Dashboard <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
