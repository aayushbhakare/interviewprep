import React from 'react';
import { Link } from 'react-router-dom';
import { Target, Mic, FileText, CheckCircle2, Clock, ArrowRight, Play, Award } from 'lucide-react';

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
              Realistic simulated recruitment rounds designed to evaluate cognitive problem-solving, verbal articulation, and technical depth.
            </p>
          </div>
        </div>
      </div>

      {/* Module Implementation Status Banner */}
      <div className="mb-8 bg-indigo-50/70 border border-indigo-200 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start space-x-3">
          <Award className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-indigo-950">Aptitude Practice Module is Active (Module Status: Scheduled for Phases 6 & 7 for Voice Simulation)</h3>
            <p className="text-xs sm:text-sm text-indigo-800 mt-0.5">
              Standardized 60-minute, 45-question TCS NQT pattern practice tests are now live for fresher candidates.
            </p>
          </div>
        </div>
        <Link
          to="/practice/aptitude"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm shrink-0"
        >
          <Play className="w-3.5 h-3.5" />
          Start Aptitude Test
        </Link>
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
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Phase 6 • Real-time WebRTC / Gemini Live API</span>
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
              Upcoming
            </span>
          </div>
        </div>

        {/* Track 2: Aptitude Practice */}
        <div className="bg-white border-2 border-indigo-200 rounded-xl p-6 sm:p-8 shadow-sm flex flex-col justify-between hover:border-indigo-400 transition-colors">
          <div>
            <div className="w-12 h-12 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
              <FileText className="w-6 h-6" />
            </div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold text-slate-900">Track 2: Fresher Aptitude Practice</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                Active
              </span>
            </div>
            <p className="text-sm text-slate-600 mb-4 leading-relaxed">
              Standardized cognitive assessments modeled directly on modern fresher recruitment patterns (TCS NQT Foundation), covering Quantitative Ability, Logical Reasoning, and Verbal Ability.
            </p>
            <ul className="space-y-2 text-sm text-slate-600 mb-6">
              <li className="flex items-center">
                <CheckCircle2 className="w-4 h-4 text-indigo-500 mr-2 shrink-0" />
                <strong>TCS NQT Pattern:</strong> 45 MCQs (15 Quant, 15 Logical, 15 Verbal) in 60 minutes.
              </li>
              <li className="flex items-center">
                <CheckCircle2 className="w-4 h-4 text-indigo-500 mr-2 shrink-0" />
                <strong>Daily Practice Quota:</strong> Up to 5 full attempts per day for freshers.
              </li>
              <li className="flex items-center">
                <CheckCircle2 className="w-4 h-4 text-indigo-500 mr-2 shrink-0" />
                <strong>Detailed Solutions:</strong> Step-by-step mathematical reasoning & zero pass/fail pressure.
              </li>
            </ul>
          </div>
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-indigo-600 font-semibold">TCS NQT Cognitive Foundation</span>
            <Link
              to="/practice/aptitude"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
            >
              Enter Aptitude Hub <ArrowRight className="w-3.5 h-3.5" />
            </Link>
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
