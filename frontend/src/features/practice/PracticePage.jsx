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
      <div className="mb-8 bg-indigo-50/70 border border-indigo-200 rounded-xl p-4 sm:p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-start space-x-3 min-w-0 pr-2">
          <Award className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" />
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-indigo-950">
              Aptitude Practice Module is Active (Module Status: Scheduled for Phases 6 & 7)
            </h3>
            <p className="text-xs sm:text-sm text-indigo-800 mt-0.5 leading-relaxed">
              Practice real-time Technical, HR, and Mixed recruitment rounds with adaptive voice dialogue alongside standardized cognitive aptitude tests.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
          <Link
            to="/practice/interviews/history"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-white border border-indigo-300 text-indigo-900 hover:bg-indigo-50 transition-colors shadow-xs whitespace-nowrap shrink-0"
          >
            <Clock className="w-3.5 h-3.5 text-indigo-600" />
            Past Sessions
          </Link>
          <Link
            to="/practice/aptitude"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-white border border-indigo-300 text-indigo-900 hover:bg-indigo-50 transition-colors shadow-xs whitespace-nowrap shrink-0"
          >
            <FileText className="w-3.5 h-3.5 text-indigo-600" />
            Start Aptitude Test
          </Link>
          <Link
            to="/practice/interviews/setup"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm whitespace-nowrap shrink-0"
          >
            <Play className="w-3.5 h-3.5" />
            Start Voice Interview
          </Link>
        </div>
      </div>

      {/* Two Core Tracks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        {/* Track 1: AI Voice Interviews */}
        <div className="bg-white border-2 border-emerald-200 rounded-xl p-6 sm:p-8 shadow-sm flex flex-col justify-between hover:border-emerald-400 transition-colors">
          <div>
            <div className="w-12 h-12 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <Mic className="w-6 h-6" />
            </div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold text-slate-900">Track 1: AI Voice Simulation</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                Active
              </span>
            </div>
            <p className="text-sm text-slate-600 mb-4 leading-relaxed">
              Experience dynamic, voice-to-voice interview rounds. The AI interviewer listens to your responses, probes with contextual follow-up questions, and evaluates readiness.
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
            <span className="text-xs text-emerald-700 font-semibold">Real-Time Voice • Binary PASS/FAIL</span>
            <Link
              to="/practice/interviews/setup"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
            >
              Start Voice Interview <ArrowRight className="w-3.5 h-3.5" />
            </Link>
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
              Standardized cognitive assessments modeled directly on modern fresher recruitment patterns, covering Quantitative Ability, Logical Reasoning, and Verbal Ability.
            </p>
            <ul className="space-y-2 text-sm text-slate-600 mb-6">
              <li className="flex items-center">
                <CheckCircle2 className="w-4 h-4 text-indigo-500 mr-2 shrink-0" />
                <strong>Standard Pattern:</strong> 45 MCQs (15 Quant, 15 Logical, 15 Verbal) in 60 minutes.
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
            <span className="text-xs text-indigo-600 font-semibold">Cognitive Foundation Pattern</span>
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
