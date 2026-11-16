import React from 'react';
import { Link } from 'react-router-dom';
import { Target, Mic, FileText, CheckCircle2, Clock, ArrowRight } from 'lucide-react';

export default function PracticePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Module Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Practice — AI Voice Interviews & Aptitude
            </h1>
            <p className="text-sm sm:text-base text-slate-600">
              Realistic simulated recruitment rounds designed to evaluate verbal articulation and technical depth.
            </p>
          </div>
        </div>
      </div>

      {/* Module Implementation Status Banner */}
      <div className="mb-8 bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start space-x-3">
          <Clock className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-emerald-900">Module Status: Scheduled for Phases 6 & 7</h3>
            <p className="text-xs sm:text-sm text-emerald-700 mt-0.5">
              Aptitude Practice (Phase 6) and Gemini Live AI Voice Simulation (Phase 7) are upcoming milestones.
            </p>
          </div>
        </div>
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 shrink-0">
              Future Milestone
        </span>
      </div>

      {/* Two Core Tracks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        {/* Track 1: AI Voice Interviews */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <Mic className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Track 1: AI Voice Simulation</h2>
            <p className="text-sm text-slate-600 mb-4 leading-relaxed">
              Experience dynamic, voice-to-voice interview rounds. The AI interviewer listens to your responses, probes with contextual follow-up questions, and challenges technical assertions.
            </p>
            <ul className="space-y-2 text-sm text-slate-600 mb-6">
              <li className="flex items-center">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 mr-2 shrink-0" />
                <strong>Technical Round:</strong> System design, syntax trivia, and complexity trade-offs.
              </li>
              <li className="flex items-center">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 mr-2 shrink-0" />
                <strong>HR Round:</strong> Behavioral questions, conflict resolution, and career motivation.
              </li>
              <li className="flex items-center">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 mr-2 shrink-0" />
                <strong>Mixed Sequential Round:</strong> Full recruitment simulation with 60% qualification cutoff.
              </li>
            </ul>
          </div>
          <div className="pt-4 border-t border-slate-100">
            <span className="text-xs text-slate-400 font-medium">Phase 7 • Real-time WebRTC / Gemini Live API</span>
          </div>
        </div>

        {/* Track 2: Aptitude Practice */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-lg bg-blue-50 text-brand-600 flex items-center justify-center mb-4">
              <FileText className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Track 2: Fresher Aptitude Practice</h2>
            <p className="text-sm text-slate-600 mb-4 leading-relaxed">
              Aptitude preparation modeled directly on modern fresher recruitment patterns (such as TCS NQT), focusing on Quantitative Ability, Logical Reasoning, and Verbal Ability.
            </p>
            <ul className="space-y-2 text-sm text-slate-600 mb-6">
              <li className="flex items-center">
                <CheckCircle2 className="w-4 h-4 text-brand-500 mr-2 shrink-0" />
                <strong>Daily Practice Quota:</strong> Up to 5 focused practice sessions per day.
              </li>
              <li className="flex items-center">
                <CheckCircle2 className="w-4 h-4 text-brand-500 mr-2 shrink-0" />
                <strong>Qualifying Threshold:</strong> Enforces standard industry benchmark criteria.
              </li>
              <li className="flex items-center">
                <CheckCircle2 className="w-4 h-4 text-brand-500 mr-2 shrink-0" />
                <strong>Topic Breakdowns:</strong> Speed math, percentages, syllogisms, and comprehension.
              </li>
            </ul>
          </div>
          <div className="pt-4 border-t border-slate-100">
            <span className="text-xs text-slate-400 font-medium">Phase 6 • Standardized Timed Assessments</span>
          </div>
        </div>
      </div>

      <div className="text-center">
        <Link
          to="/dashboard"
          className="inline-flex items-center text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          Return to Dashboard <ArrowRight className="w-4 h-4 ml-1" />
        </Link>
      </div>
    </div>
  );
}
