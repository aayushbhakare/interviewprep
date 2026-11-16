import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Target, Share2, ArrowRight, Activity, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';

export default function DashboardPage() {
  const [healthStatus, setHealthStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/health/')
      .then((res) => {
        setHealthStatus(res.data);
      })
      .catch((err) => {
        setHealthStatus({ status: 'error', message: err.message });
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          Welcome to your Interview Preparation Platform
        </h1>
        <p className="mt-2 text-slate-600 text-base">
          Prepare by expected difficulty and standard for your target salary range.
        </p>
      </div>

      {/* System Status Banner for Phase 0 */}
      <div className="mb-8 bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Activity className="w-5 h-5 text-brand-600 animate-pulse" />
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Platform Foundation (Phase 0)</h2>
            <p className="text-xs text-slate-500">
              Backend API & Database Connection:{' '}
              {loading ? (
                'Checking...'
              ) : healthStatus?.status === 'success' || healthStatus?.status === 'healthy' ? (
                <span className="text-emerald-600 font-medium">Connected & Healthy</span>
              ) : (
                <span className="text-amber-600 font-medium">Connecting...</span>
              )}
            </p>
          </div>
        </div>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
          Local Development
        </span>
      </div>

      {/* Three Equal Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {/* Module 1: Learn */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:border-brand-300 transition-all flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 bg-blue-50 text-brand-600 rounded-lg flex items-center justify-center mb-4">
              <BookOpen className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Learn</h2>
            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              Personalized, self-paced learning roadmap tailored to your target role, stack, and salary tier with weekly 45-question diagnostic quizzes.
            </p>
          </div>
          <Link
            to="/learn"
            className="inline-flex items-center text-sm font-semibold text-brand-600 hover:text-brand-700 mt-2"
          >
            Open Roadmap <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>

        {/* Module 2: Practice */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:border-brand-300 transition-all flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center mb-4">
              <Target className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Practice</h2>
            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              Realistic AI-led voice interviews (Technical, HR, and sequential Mixed recruitment rounds) plus standalone fresher aptitude practice.
            </p>
          </div>
          <Link
            to="/practice"
            className="inline-flex items-center text-sm font-semibold text-emerald-600 hover:text-emerald-700 mt-2"
          >
            Start Practice <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>

        {/* Module 3: Share Interview Experience */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:border-brand-300 transition-all flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center mb-4">
              <Share2 className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Share Experience</h2>
            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              Read authentic recruitment journeys filtered by company, role, and salary, and share your own interview experiences to help other students.
            </p>
          </div>
          <Link
            to="/experiences"
            className="inline-flex items-center text-sm font-semibold text-purple-600 hover:text-purple-700 mt-2"
          >
            Browse Experiences <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
