import React from 'react';
import { BookOpen, Layers, Code, CheckCircle, Sparkles, ArrowRight } from 'lucide-react';

export default function RoadmapIntro({ onStartSetup }) {
  const features = [
    {
      icon: Layers,
      title: 'Targeted by Salary Tier',
      description: 'Prepare for the exact technical depth and expectations associated with your compensation goal.',
    },
    {
      icon: Code,
      title: 'Practical Engineering Focus',
      description: 'Internal mechanics, memory management, and practical code exercises rather than syntax trivia.',
    },
    {
      icon: CheckCircle,
      title: 'Diagnostic Mastery Tracking',
      description: 'Track completed topics and skip known fundamentals with full honest status reporting.',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Hero Welcome Card */}
      <div className="bg-gradient-to-br from-brand-500 to-brand-700 text-white rounded-2xl p-8 sm:p-12 shadow-lg">
        <div className="max-w-2xl">
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-4">
            <BookOpen className="w-4 h-4" />
            <span>Salary-Wise Technical Roadmaps</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
            Master the engineering standards of your target salary range.
          </h1>
          <p className="text-sm sm:text-base text-brand-100 leading-relaxed mb-8">
            Traditional interview preparation focuses on company names. We prepare you according to the actual architectural expectations, query performance, and debugging rigor expected for your target compensation.
          </p>
          <button
            type="button"
            onClick={onStartSetup}
            className="inline-flex items-center px-6 py-3 bg-white text-brand-700 hover:bg-brand-50 font-bold rounded-xl text-sm transition-all shadow-md cursor-pointer"
          >
            <Sparkles className="w-4 h-4 mr-2 text-brand-600" />
            Start Roadmap Setup
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        </div>
      </div>

      {/* 3 Pillars of Learn */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {features.map((f, i) => {
          const Icon = f.icon;
          return (
            <div key={i} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center mb-4">
                <Icon className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-slate-900 mb-1">{f.title}</h2>
              <p className="text-sm text-slate-600 leading-relaxed">{f.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
