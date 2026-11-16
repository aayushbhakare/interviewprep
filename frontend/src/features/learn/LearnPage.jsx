import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, CheckCircle, Code, Layers, ArrowRight, Clock } from 'lucide-react';

export default function LearnPage() {
  const steps = [
    { title: 'Target Role', desc: 'Backend, Frontend, Full Stack, QA, Mobile' },
    { title: 'Experience Level', desc: 'Fresher, <1 year, 1–3, 3–5, 5+ years' },
    { title: 'Salary Tier', desc: 'Below ₹3, ₹3–5, ₹5–7, ₹7–10, ₹10–15, ₹15+ LPA' },
    { title: 'Language & Framework', desc: 'Python/Django, Java/Spring, JS/Express' },
    { title: 'Database', desc: 'PostgreSQL, MySQL, MongoDB' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Module Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-brand-600 flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Learn — Personalized Technical Roadmaps
            </h1>
            <p className="text-sm sm:text-base text-slate-600">
              Prepare according to expected technical depth and interview standards for your target salary tier.
            </p>
          </div>
        </div>
      </div>

      {/* Module Implementation Status Banner */}
      <div className="mb-8 bg-blue-50/70 border border-blue-200 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start space-x-3">
          <Clock className="w-5 h-5 text-brand-600 mt-0.5 shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-blue-900">Module Status: Phase 3 Foundation In Progress</h3>
            <p className="text-xs sm:text-sm text-blue-700 mt-0.5">
              The full multi-step Roadmap Setup Wizard and topic learning engine will be unlocked in Phase 3.
            </p>
          </div>
        </div>
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 shrink-0">
          Next Phase Milestone
        </span>
      </div>

      {/* Feature Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <Layers className="w-6 h-6 text-brand-600 mb-3" />
          <h2 className="text-lg font-bold text-slate-900 mb-1">Tailored By Salary Tier</h2>
          <p className="text-sm text-slate-600">
            A ₹5–7 LPA backend interview expects solid CRUD, SQL joins, and basic HTTP semantics. A ₹15+ LPA interview demands deep internals, query plans, and concurrency models.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <Code className="w-6 h-6 text-brand-600 mb-3" />
          <h2 className="text-lg font-bold text-slate-900 mb-1">Practical Code Exercises</h2>
          <p className="text-sm text-slate-600">
            Each topic includes real engineering code exercises: debugging edge cases, identifying performance bottlenecks, and tracing memory leaks.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <CheckCircle className="w-6 h-6 text-brand-600 mb-3" />
          <h2 className="text-lg font-bold text-slate-900 mb-1">45-Question Weekly Quizzes</h2>
          <p className="text-sm text-slate-600">
            Diagnostic checkpoints with 0% multiple-choice questions: 10 output prediction, 10 debugging, 10 coding, 10 scenario, and 5 conceptual questions.
          </p>
        </div>
      </div>

      {/* Roadmap Setup Preview */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 mb-2">Roadmap Setup Wizard (Preview)</h2>
        <p className="text-sm text-slate-600 mb-6">
          When launched, you will configure your customized learning curriculum across these five dimensions:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {steps.map((s, idx) => (
            <div key={s.title} className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <span className="text-xs font-semibold text-brand-600 uppercase tracking-wider">Step {idx + 1}</span>
              <h3 className="text-sm font-bold text-slate-900 mt-1">{s.title}</h3>
              <p className="text-xs text-slate-500 mt-1">{s.desc}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-slate-100 gap-4">
          <p className="text-xs text-slate-500">
            Roadmap configurations will be transactionally saved with full progress preservation.
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
