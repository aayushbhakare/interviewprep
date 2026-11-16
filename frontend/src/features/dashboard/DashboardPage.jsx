import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  BookOpen,
  Target,
  Share2,
  ArrowRight,
  User,
  Compass,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';
import api from '../../services/api';

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(isAuthenticated);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    api.get('/dashboard/student/')
      .then((res) => {
        setDashboardData(res.data?.data || null);
      })
      .catch((err) => {
        // Fallback gracefully on network/auth error
        setError(err.response?.data?.error?.message || 'Unable to load dashboard details.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isAuthenticated]);

  const activeRoadmap = dashboardData?.active_roadmap;
  const recentActivities = dashboardData?.recent_activities || [];
  const shortcuts = dashboardData?.shortcuts || [
    {
      id: 'learn',
      title: 'Personalized Roadmap',
      description: 'Build a self-paced curriculum for your target salary tier',
      path: '/learn',
      badge: 'Core Pillar',
    },
    {
      id: 'practice',
      title: 'AI Voice Interviews',
      description: 'Simulate Technical, HR, and Mixed interview rounds',
      path: '/practice',
      badge: 'Core Pillar',
    },
    {
      id: 'experiences',
      title: 'Interview Experiences',
      description: 'Read real recruitment stories and round breakdowns',
      path: '/experiences',
      badge: 'Core Pillar',
    },
    {
      id: 'profile',
      title: 'Profile & Account',
      description: 'Manage contact details, credentials, and settings',
      path: '/profile',
      badge: 'Account',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome & Overview Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {isAuthenticated
              ? `Welcome back, ${user?.full_name || 'Student'}`
              : 'Welcome to your Interview Preparation Platform'}
          </h1>
          <p className="mt-1 text-sm sm:text-base text-slate-600">
            Prepare according to expected technical depth and interview standards for your target salary range.
          </p>
        </div>

        {isAuthenticated && (
          <div className="inline-flex items-center space-x-2 text-xs bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-full text-slate-700 self-start md:self-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Active Student Account</span>
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white border border-slate-200 rounded-xl p-8 mb-8 text-center flex flex-col items-center justify-center">
          <Loader2 className="w-7 h-7 text-brand-600 animate-spin mb-3" />
          <p className="text-sm text-slate-500">Loading your personalized dashboard...</p>
        </div>
      )}

      {/* Error Notice */}
      {error && !loading && (
        <div className="mb-8 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between text-amber-800 text-sm">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="text-xs font-semibold text-amber-900 underline hover:no-underline ml-4"
          >
            Retry
          </button>
        </div>
      )}

      {/* Three Equal Pillars */}
      <div className="mb-10">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Core Modules</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Module 1: Learn */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:border-brand-300 transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 bg-blue-50 text-brand-600 rounded-lg flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Learn</h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                Personalized, self-paced learning roadmap tailored to your target role, stack, and salary tier with weekly 45-question diagnostic quizzes.
              </p>
            </div>
            <Link
              to="/learn"
              className="inline-flex items-center text-sm font-semibold text-brand-600 hover:text-brand-700 pt-2"
            >
              Open Roadmap <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>

          {/* Module 2: Practice */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:border-emerald-300 transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center mb-4">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Practice</h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                Realistic AI-led voice interviews (Technical, HR, and sequential Mixed recruitment rounds) plus standalone fresher aptitude practice.
              </p>
            </div>
            <Link
              to="/practice"
              className="inline-flex items-center text-sm font-semibold text-emerald-600 hover:text-emerald-700 pt-2"
            >
              Start Practice <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>

          {/* Module 3: Share Experience */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:border-purple-300 transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center mb-4">
                <Share2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Share Experience</h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                Read authentic recruitment journeys filtered by company, role, and salary, and share your own interview experiences to help other students.
              </p>
            </div>
            <Link
              to="/experiences"
              className="inline-flex items-center text-sm font-semibold text-purple-600 hover:text-purple-700 pt-2"
            >
              Browse Experiences <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </div>
      </div>

      {/* Continue Learning & Recent Activity Section (Split Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        {/* Left Column: Continue Learning Card (Spans 2 cols on lg) */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">Continue Learning</h2>
            {activeRoadmap && (
              <Link to="/learn" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
                View Details →
              </Link>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            {activeRoadmap ? (
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <div>
                    <span className="text-xs font-semibold text-brand-600 uppercase tracking-wider">
                      {activeRoadmap.target_salary} • {activeRoadmap.experience_level}
                    </span>
                    <h3 className="text-xl font-bold text-slate-900 mt-0.5">{activeRoadmap.role}</h3>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {activeRoadmap.language} / {activeRoadmap.framework}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-slate-600 mb-1">
                    <span>Roadmap Progress</span>
                    <span>{activeRoadmap.progress_percentage}% completed</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-brand-600 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${Math.max(activeRoadmap.progress_percentage, 5)}%` }}
                    />
                  </div>
                </div>

                {/* Status details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                  <div>
                    <span className="text-xs text-slate-500">Database</span>
                    <p className="text-sm font-semibold text-slate-800">{activeRoadmap.database}</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500">Weekly Quiz Status</span>
                    <p className="text-sm font-semibold text-slate-800 flex items-center">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mr-1" />
                      {activeRoadmap.weekly_quiz_status}
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
                  <Link
                    to="/learn"
                    className="inline-flex items-center px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors shadow-sm"
                  >
                    Resume Roadmap <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Link>
                </div>
              </div>
            ) : (
              /* Clean Empty State */
              <div className="py-6 text-center flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                  <Compass className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1">No active roadmap yet</h3>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mb-5 leading-relaxed">
                  Configure your target salary range, role, and tech stack to generate a customized, self-paced learning journey with diagnostic weekly quizzes.
                </p>
                <Link
                  to="/learn"
                  className="inline-flex items-center px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors shadow-sm"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Set Up Roadmap
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Recent Activity Feed */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">Recent Activity</h2>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm min-h-[220px]">
            {recentActivities.length > 0 ? (
              <div className="space-y-4">
                {recentActivities.map((act) => (
                  <div key={act.id} className="flex items-start space-x-3 pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                    <div className="w-2 h-2 rounded-full bg-brand-600 mt-1.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{act.title}</p>
                      <p className="text-xs text-slate-500 truncate">{act.description}</p>
                    </div>
                    <span className="text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded shrink-0">
                      {act.badge}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              /* Clean Empty State */
              <div className="py-6 text-center flex flex-col items-center justify-center h-full">
                <Clock className="w-8 h-8 text-slate-300 mb-2" />
                <h3 className="text-sm font-bold text-slate-800 mb-1">No recent activity yet</h3>
                <p className="text-xs text-slate-500 leading-relaxed max-w-[220px]">
                  As you complete roadmap topics, weekly quizzes, and interviews, your history will appear here.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Useful Shortcuts */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Quick Shortcuts</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {shortcuts.map((sc) => (
            <Link
              key={sc.id}
              to={sc.path}
              className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-brand-300 hover:shadow transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold text-brand-600 uppercase tracking-wider">
                    {sc.badge}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">{sc.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{sc.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Guest Call to Action */}
      {!isAuthenticated && (
        <div className="bg-gradient-to-r from-brand-50 to-blue-50 border border-brand-200 rounded-xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Track your interview preparation journey</h3>
            <p className="text-sm text-slate-600 mt-1 max-w-xl">
              Create a free student account to save roadmaps, track quiz scores, practice voice interviews, and share real placement experiences.
            </p>
          </div>
          <div className="flex items-center space-x-3 shrink-0">
            <Link
              to="/login"
              className="px-4 py-2 border border-slate-300 bg-white rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 shadow-sm transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
