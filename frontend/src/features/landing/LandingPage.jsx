import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import BrandLogo from '../../components/shared/BrandLogo';
import {
  ArrowRight,
  BookOpen,
  Target,
  Share2,
  Mic,
  Brain,
  Layers,
  CheckCircle2,
  Sparkles,
  Terminal,
  Shield,
  Code2,
  Database,
  ArrowUpRight,
  Menu,
  X,
  Volume2,
  Calendar,
  Zap,
  HelpCircle,
  Clock,
  Compass,
} from 'lucide-react';

export default function LandingPage() {
  const { isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-sky-100 selection:text-sky-700">
      
      {/* =========================================================================
          SECTION 1: STICKY FROSTED NAVIGATION BAR
          ========================================================================= */}
      <header className="sticky top-0 left-0 right-0 w-full z-50 bg-white/90 backdrop-blur-xl border-b border-sky-100/80 shadow-[0_2px_16px_rgba(14,165,233,0.04)]">
        <div className="h-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          
          {/* Logo & Platform Name */}
          <div className="flex items-center">
            <BrandLogo size={32} linkTo="/" />
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-6 lg:space-x-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-sky-600 transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-sky-600 transition-colors">
              How It Works
            </a>
            <a href="#salary-wise" className="hover:text-sky-600 transition-colors">
              Salary-Wise Standard
            </a>
            <a href="#simulation-modes" className="hover:text-sky-600 transition-colors">
              AI Voice Simulation
            </a>
            <Link to="/about" className="hover:text-sky-600 transition-colors">
              About
            </Link>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-3">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold transition-all shadow-sm hover:shadow-sky-500/20"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-sky-600 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold transition-all shadow-sm hover:shadow-sky-500/20"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex md:hidden items-center">
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div id="mobile-drawer" className="md:hidden border-b border-sky-100 bg-white/95 backdrop-blur-xl px-4 pt-2 pb-6 space-y-3">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-sky-50"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-sky-50"
            >
              How It Works
            </a>
            <a
              href="#salary-wise"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-sky-50"
            >
              Salary-Wise Standard
            </a>
            <a
              href="#simulation-modes"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-sky-50"
            >
              AI Voice Simulation
            </a>
            <Link
              to="/about"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-sky-50"
            >
              About
            </Link>

            <div className="pt-3 border-t border-slate-100 space-y-2">
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-center py-2.5 px-4 rounded-xl bg-sky-500 text-white font-bold text-sm shadow-sm"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full text-center py-2 px-4 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full text-center py-2.5 px-4 rounded-xl bg-sky-500 text-white font-bold text-sm shadow-sm"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* =========================================================================
          SECTION 2: HERO SECTION
          ========================================================================= */}
      <section className="relative overflow-hidden bg-gradient-to-b from-sky-50/70 via-sky-50/20 to-white pt-12 pb-16 md:pt-20 md:pb-24">
        {/* Ambient Atmospheric Layering */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-tr from-sky-200/30 via-cyan-100/40 to-transparent blur-3xl pointer-events-none rounded-full" />
        <div className="absolute top-1/4 -right-40 w-80 h-80 bg-blue-100/40 blur-3xl pointer-events-none rounded-full" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          {/* Top Pill Meta-Badge */}
          <div className="flex items-center justify-start md:justify-center mb-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-sky-200 text-sky-700 text-xs font-semibold shadow-xs">
              <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
              <span className="uppercase tracking-wider text-[11px] text-slate-500 font-bold">Salary-Wise Preparation</span>
              <span className="text-sky-300 font-normal">|</span>
              <span className="text-sky-600">Zero Paid Dependencies</span>
            </div>
          </div>

          {/* Main Headline & Supporting Text */}
          <div className="text-left md:text-center max-w-4xl mx-auto mb-10">
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15] mb-5">
              Your Target Salary.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 via-sky-600 to-cyan-600">
                Your Career Roadmap.
              </span>{' '}
              Your Interview Preparation.
            </h1>
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Prepare for your next opportunity with personalized learning roadmaps, hands-on practice, aptitude assessments and AI-powered interview simulations tailored to your target salary, experience and career role.
            </p>

            {/* Hero CTAs */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <Link
                to="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-sm transition-all shadow-md shadow-sky-500/25 hover:shadow-sky-500/35"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#features"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white border border-sky-200 text-slate-700 font-semibold text-sm hover:bg-sky-50/60 hover:border-sky-300 transition-all shadow-xs"
              >
                <Terminal className="w-4 h-4 text-sky-600" />
                <span>Explore Features</span>
              </a>
            </div>
          </div>

          {/* =========================================================================
              SECTION 3: REALISTIC PRODUCT PREVIEW (Backend Dev • Fresher • ₹7–9 LPA)
              ========================================================================= */}
          <div className="mt-8 rounded-2xl bg-white border border-sky-200/90 p-3 sm:p-5 shadow-[0_12px_40px_rgba(14,165,233,0.08)]">
            
            {/* Context Badge */}
            <div className="flex flex-wrap items-center justify-between pb-3 mb-4 border-b border-sky-100 gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Live Platform Preview
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                  Illustrative Candidate Journey
                </span>
              </div>
              <span className="text-xs text-slate-500">
                Calibrated by Role & Salary Tier Standard
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              
              {/* LEFT COLUMN: Target Career Configuration & Phased Curriculum (5 cols) */}
              <div className="lg:col-span-5 bg-sky-50/40 border border-sky-100 rounded-xl p-4 sm:p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Target className="w-4 h-4 text-sky-600" />
                      Target Goal Calibration
                    </span>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/70 border border-emerald-200 px-2 py-0.5 rounded-full">
                      Active Target
                    </span>
                  </div>

                  <div className="space-y-3">
                    {/* Selected Profile Criteria */}
                    <div className="bg-white border border-sky-100 rounded-lg p-3 shadow-2xs">
                      <div className="text-[11px] text-slate-500 font-medium">Target Engineering Role</div>
                      <div className="text-sm font-bold text-slate-900 mt-0.5 flex items-center gap-1.5">
                        <Code2 className="w-4 h-4 text-sky-600" />
                        Backend Developer (APIs & Systems)
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="bg-white border border-sky-100 rounded-lg p-2.5 shadow-2xs">
                        <div className="text-[10px] text-slate-500 font-medium">Experience Tier</div>
                        <div className="text-xs font-bold text-slate-900 mt-0.5 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          Fresher (&lt; 1 Year)
                        </div>
                      </div>
                      <div className="bg-white border border-sky-100 rounded-lg p-2.5 shadow-2xs">
                        <div className="text-[10px] text-slate-500 font-medium">Target Salary Band</div>
                        <div className="text-xs font-bold text-sky-700 mt-0.5">
                          ₹7–9 LPA Tier
                        </div>
                      </div>
                    </div>

                    {/* Skill Matrix */}
                    <div>
                      <div className="text-[11px] text-slate-500 font-medium mb-1.5">Calibrated Technical Stack</div>
                      <div className="flex flex-wrap gap-1.5">
                        <span className="px-2 py-0.5 rounded bg-white border border-sky-200 text-slate-800 text-[11px] font-semibold">Python</span>
                        <span className="px-2 py-0.5 rounded bg-white border border-sky-200 text-slate-800 text-[11px] font-semibold">Django</span>
                        <span className="px-2 py-0.5 rounded bg-white border border-sky-200 text-slate-800 text-[11px] font-semibold">PostgreSQL</span>
                        <span className="px-2 py-0.5 rounded bg-white border border-sky-200 text-slate-800 text-[11px] font-semibold">REST APIs</span>
                        <span className="px-2 py-0.5 rounded bg-sky-100 text-sky-700 border border-sky-200 text-[11px] font-semibold">System Design</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 12-Week Roadmap Phasing */}
                <div className="mt-5 pt-4 border-t border-sky-100">
                  <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>12-Week Roadmap Progress</span>
                    <span className="text-sky-600 font-bold">Week 6 of 12</span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="bg-white border border-sky-100 rounded-lg p-2 flex items-center justify-between">
                      <span className="text-slate-700 font-medium flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        Phase 1: Python Internals &amp; Algorithms
                      </span>
                      <span className="text-[10px] font-bold text-emerald-600">Passed</span>
                    </div>
                    <div className="bg-sky-50 border border-sky-200 rounded-lg p-2 flex items-center justify-between">
                      <span className="text-slate-900 font-bold flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-sky-600" />
                        Phase 2: Django &amp; Database Architecture
                      </span>
                      <span className="text-[10px] font-bold text-sky-600">In Progress</span>
                    </div>
                    <div className="bg-white/60 border border-slate-100 rounded-lg p-2 flex items-center justify-between text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5" />
                        Phase 3: High-Scale Systems &amp; Caching
                      </span>
                      <span className="text-[10px]">Locked</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Active AI Voice Interview Simulation (7 cols) */}
              <div className="lg:col-span-7 bg-[#f8fbff] border border-sky-100 rounded-xl p-4 sm:p-5 flex flex-col justify-between">
                
                {/* Terminal Header */}
                <div>
                  <div className="flex flex-wrap items-center justify-between pb-3 mb-4 border-b border-sky-100 gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-bold text-slate-800">
                        Voice Interview Simulation
                      </span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-white border border-sky-200 text-sky-700">
                        Technical Round
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <span className="px-2 py-0.5 rounded bg-white border border-sky-200 font-mono">Web Speech API</span>
                      <span className="text-emerald-600 font-bold">₹0 Cost Telemetry</span>
                    </div>
                  </div>

                  {/* Conversational Speech Turns */}
                  <div className="space-y-3.5 my-2">
                    
                    {/* Turn 1: AI Interviewer */}
                    <div className="flex gap-2.5 items-start">
                      <div className="w-7 h-7 rounded-lg bg-sky-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                        <Brain className="w-4 h-4" />
                      </div>
                      <div className="bg-white border border-sky-100 p-3 rounded-xl rounded-tl-none shadow-2xs flex-1">
                        <div className="text-[11px] font-bold text-sky-700 mb-1">
                          Interview AI (Technical Evaluator)
                        </div>
                        <p className="text-xs text-slate-800 leading-relaxed">
                          "When optimizing database queries in Django for a ₹7–9 LPA backend role, how do you diagnose N+1 query bottlenecks, and what is the exact operational difference between <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px]">select_related</code> and <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px]">prefetch_related</code>?"
                        </p>
                      </div>
                    </div>

                    {/* Turn 2: Candidate Voice Stream */}
                    <div className="flex gap-2.5 items-start flex-row-reverse">
                      <div className="w-7 h-7 rounded-lg bg-sky-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                        <Mic className="w-4 h-4" />
                      </div>
                      <div className="bg-sky-50 border border-sky-200 p-3 rounded-xl rounded-tr-none shadow-2xs flex-1 text-right">
                        <div className="text-[11px] font-bold text-sky-800 mb-1">
                          Candidate Voice Stream (Real-Time Audio)
                        </div>
                        <p className="text-xs text-slate-700 italic leading-relaxed text-left">
                          "select_related performs an SQL JOIN in a single database query for single-valued foreign keys. In contrast, prefetch_related executes a separate query for reverse or many-to-many relationships and merges the record sets in Python memory, preventing N+1 database roundtrips..."
                        </p>
                        {/* Audio Waveform Indicator */}
                        <div className="flex items-center justify-end gap-1 mt-2 h-4">
                          <span className="w-1 bg-sky-400 rounded-full h-2 animate-pulse" />
                          <span className="w-1 bg-sky-500 rounded-full h-4" />
                          <span className="w-1 bg-sky-600 rounded-full h-3 animate-pulse" />
                          <span className="w-1 bg-sky-500 rounded-full h-2" />
                          <span className="w-1 bg-sky-400 rounded-full h-4" />
                        </div>
                      </div>
                    </div>

                    {/* Turn 3: Live Qualitative Verdict Evaluation */}
                    <div className="p-3 rounded-xl bg-white border border-emerald-200 shadow-2xs flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-emerald-800">
                            Evaluator Assessment: Verified
                          </span>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            INTERVIEW PASSED
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                          Accurately explained SQL join mechanics, memory tradeoffs, and execution patterns expected for the target ₹7–9 LPA fresher benchmark.
                        </p>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Terminal Actions Footer */}
                <div className="pt-3 border-t border-sky-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">
                    Strict Binary Rubrics (Passed / Not Cleared)
                  </span>
                  <Link
                    to="/register"
                    className="inline-flex items-center gap-1 font-bold text-sky-600 hover:text-sky-700"
                  >
                    Simulate Your Role &rarr;
                  </Link>
                </div>

              </div>

            </div>

          </div>

        </div>
      </section>

      {/* =========================================================================
          SECTION 4: PLATFORM FEATURES (The 5 Main Capabilities)
          ========================================================================= */}
      <section id="features" className="py-16 md:py-24 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-3xl mb-12">
            <span className="text-xs font-bold text-sky-600 uppercase tracking-wider block mb-1.5">
              Engineered Preparation Ecosystem
            </span>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
              Five Complete Capabilities Built for Recruitment Success.
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-2 leading-relaxed">
              Every tool required to prepare for modern software hiring, from conceptual learning to realistic voice simulations and peer intelligence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Feature 1: Personalized Learning Roadmaps */}
            <div className="bg-white border border-slate-200 hover:border-sky-300 rounded-2xl p-6 transition-all shadow-xs hover:shadow-md flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform border border-sky-100">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  1. Personalized Learning Roadmaps
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
                  12-week structured curricula calibrated dynamically to your target salary band and role. Features clear Markdown topic explanations, estimated read times, and progress tracking.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 text-xs font-semibold text-sky-600 flex items-center justify-between">
                <span>Weekly Assessments</span>
                <span>Role-Calibrated</span>
              </div>
            </div>

            {/* Feature 2: Hands-on Practice Roadmap */}
            <div className="bg-white border border-slate-200 hover:border-sky-300 rounded-2xl p-6 transition-all shadow-xs hover:shadow-md flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform border border-sky-100">
                  <Code2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  2. Hands-on Practice Roadmap
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
                  Weekly practical coding tasks, database schema exercises, debugging challenges, and real-world implementation problems linked directly to your learning topics.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 text-xs font-semibold text-sky-600 flex items-center justify-between">
                <span>Code &amp; Query Tasks</span>
                <span>Independent Progress</span>
              </div>
            </div>

            {/* Feature 3: Aptitude Preparation */}
            <div className="bg-white border border-slate-200 hover:border-sky-300 rounded-2xl p-6 transition-all shadow-xs hover:shadow-md flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform border border-sky-100">
                  <Brain className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  3. Aptitude Preparation
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
                  Cognitive test preparation across Quantitative Aptitude, Logical Reasoning, and Verbal Ability. Standardized 45-question timed mock sessions with step-by-step mathematical scorecards.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 text-xs font-semibold text-sky-600 flex items-center justify-between">
                <span>Fresher Screening Drills</span>
                <span>5 Daily Sessions</span>
              </div>
            </div>

            {/* Feature 4: AI Voice Interview Simulations */}
            <div className="bg-white border border-slate-200 hover:border-sky-300 rounded-2xl p-6 transition-all shadow-xs hover:shadow-md flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform border border-sky-100">
                  <Mic className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  4. AI Interview Simulations
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
                  Realistic, speech-to-speech simulations for Technical, HR, and Mixed rounds using browser-native Web Speech API. Delivers definitive binary verdicts (Passed / Not Cleared) and qualitative feedback.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 text-xs font-semibold text-sky-600 flex items-center justify-between">
                <span>Speech-to-Speech</span>
                <span>24h Cooling Periods</span>
              </div>
            </div>

            {/* Feature 5: Share Interview Experience */}
            <div className="bg-white border border-slate-200 hover:border-sky-300 rounded-2xl p-6 transition-all shadow-xs hover:shadow-md flex flex-col justify-between group md:col-span-2 lg:col-span-2">
              <div>
                <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform border border-sky-100">
                  <Share2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  5. Real Interview Experiences (Peer Intelligence)
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
                  Explore authentic interview retrospectives shared by fellow students. Features structured multi-stage recruitment journeys, exact questions asked, follow-up twists, interviewer expectations, and candidate solution approaches.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 text-xs font-semibold text-sky-600 flex items-center justify-between">
                <span>Company Attribution Permitted</span>
                <span>Automated Risk Moderation</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* =========================================================================
          SECTION 5: HOW IT WORKS (Simple 4-Step Journey)
          ========================================================================= */}
      <section id="how-it-works" className="py-16 md:py-24 bg-sky-50/40 border-t border-sky-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-left md:text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-bold text-sky-600 uppercase tracking-wider block mb-1.5">
              Structured Recruitment Journey
            </span>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
              How You Move From Preparation to Placement.
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-2">
              A four-step operating system designed to eliminate guesswork and systematically elevate your technical interview readiness.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Step 1 */}
            <div className="bg-white border border-sky-100 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-2xl font-bold text-sky-300">01</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-50 text-sky-700 border border-sky-200">
                    CALIBRATION
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">
                  Choose Your Career Goal
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Select your target salary range (e.g. ₹7–9 LPA), experience level, engineering role, and technical stack.
                </p>
              </div>
              <div className="mt-6 pt-3 border-t border-slate-100 text-xs font-medium text-slate-500 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-sky-600" />
                <span>Salary &amp; Role Lock</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white border border-sky-100 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-2xl font-bold text-sky-300">02</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-50 text-sky-700 border border-sky-200">
                    CURRICULUM
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">
                  Get Your Roadmaps
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Receive personalized learning and hands-on practice roadmaps mapped to the depth expected for your compensation tier.
                </p>
              </div>
              <div className="mt-6 pt-3 border-t border-slate-100 text-xs font-medium text-slate-500 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-sky-600" />
                <span>12-Week Phased Plan</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white border border-sky-100 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-2xl font-bold text-sky-300">03</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-50 text-sky-700 border border-sky-200">
                    MASTERY
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">
                  Learn and Practice
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Complete structured topics, practical coding exercises, weekly 45-question diagnostic quizzes, and aptitude tests.
                </p>
              </div>
              <div className="mt-6 pt-3 border-t border-slate-100 text-xs font-medium text-slate-500 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Diagnostics &amp; Practice</span>
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-white border border-sky-100 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-2xl font-bold text-sky-300">04</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-50 text-sky-700 border border-sky-200">
                    SIMULATION
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">
                  Simulate Recruitment
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Rehearse realistic Technical, HR, and Mixed sequential interviews with real-time speech interaction and rubric feedback.
                </p>
              </div>
              <div className="mt-6 pt-3 border-t border-slate-100 text-xs font-medium text-slate-500 flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5 text-sky-600" />
                <span>Recruitment Ready</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* =========================================================================
          SECTION 6: SALARY-WISE & ROLE-WISE PREPARATION (Core Differentiator)
          ========================================================================= */}
      <section id="salary-wise" className="py-16 md:py-24 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-3xl mb-12">
            <span className="text-xs font-bold text-sky-600 uppercase tracking-wider block mb-1.5">
              The Platform Differentiator
            </span>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Prepare for the Salary You Want, Not Just a Company You Choose.
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-3 leading-relaxed">
              Preparation is tailored to the expected technical depth and interview standards associated with your target salary, experience level, and engineering role.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* The Old Way: Company-Wise Preparation */}
            <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-6 sm:p-7">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Traditional Preparation
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-3">
                Company-Specific Question Lists
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-5">
                Focuses on memorizing past question banks from a specific named company. When recruiters change interview questions, preparation falls apart.
              </p>
              <ul className="space-y-2.5 text-xs sm:text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold shrink-0 mt-0.5">✕</span>
                  <span>Memorizing obsolete company trivia instead of fundamentals</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold shrink-0 mt-0.5">✕</span>
                  <span>Fragile preparation that doesn't transfer to other employers</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold shrink-0 mt-0.5">✕</span>
                  <span>Unclear expectations regarding salary-tier technical standards</span>
                </li>
              </ul>
            </div>

            {/* Our Way: Salary-Wise & Role-Wise Preparation */}
            <div className="bg-sky-50/40 border border-sky-200 rounded-2xl p-6 sm:p-7 shadow-xs">
              <div className="text-xs font-bold text-sky-700 uppercase tracking-wider mb-2">
                Our Standard
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-3">
                Salary-Wise &amp; Role-Wise Mastery
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-5">
                Master the foundational engineering standards, architectural decisions, and problem-solving depth expected at your target compensation tier.
              </p>
              <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700">
                <li className="flex items-start gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Curricula calibrated to realistic industry salary standards</span>
                </li>
                <li className="flex items-start gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Transferable depth that prepares you for multiple hiring opportunities</span>
                </li>
                <li className="flex items-start gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Clear engineering benchmarks corresponding to your experience level</span>
                </li>
              </ul>
            </div>

          </div>

        </div>
      </section>

      {/* =========================================================================
          SECTION 7: VOICE-BASED INTERVIEW SIMULATION (The 3 Modes)
          ========================================================================= */}
      <section id="simulation-modes" className="py-16 md:py-24 bg-[#f8fbff] border-t border-sky-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-3xl mb-12">
            <span className="text-xs font-bold text-sky-600 uppercase tracking-wider block mb-1.5">
              Authentic Voice Practice
            </span>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
              Master All Three Modes of Recruitment Interviews.
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-2">
              Experience voice-based interview rounds powered by native speech technology. Speak naturally, articulate your technical reasoning, and receive definitive verdicts.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Mode 1: Technical Interview */}
            <div className="bg-white border border-sky-100 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="px-2.5 py-1 rounded-full bg-sky-100 text-sky-700 text-xs font-bold border border-sky-200">
                    Mode 01
                  </span>
                  <Code2 className="w-5 h-5 text-sky-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  Technical Interview
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
                  Deep-dive technical probing focused on syntax trivia, system design trade-offs, database optimization, and algorithmic complexity.
                </p>
                <ul className="space-y-2 text-xs text-slate-700">
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                    <span>Role-specific technical questions</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                    <span>Architecture &amp; scaling trade-offs</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                    <span>Contextual follow-up probing</span>
                  </li>
                </ul>
              </div>
              <div className="mt-6 pt-3 border-t border-slate-100 text-xs font-semibold text-slate-500 flex items-center justify-between">
                <span>Evaluation</span>
                <span className="text-sky-600 font-bold">Passed / Not Cleared</span>
              </div>
            </div>

            {/* Mode 2: HR & Behavioral Interview */}
            <div className="bg-white border border-sky-100 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="px-2.5 py-1 rounded-full bg-sky-100 text-sky-700 text-xs font-bold border border-sky-200">
                    Mode 02
                  </span>
                  <Mic className="w-5 h-5 text-sky-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  HR &amp; Behavioral Interview
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
                  Evaluation focused on communication clarity, the STAR framework, conflict resolution, work culture, and career objectives.
                </p>
                <ul className="space-y-2 text-xs text-slate-700">
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                    <span>STAR behavioral methodology</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                    <span>Cross-functional teamwork scenarios</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                    <span>Conciseness &amp; verbal articulation</span>
                  </li>
                </ul>
              </div>
              <div className="mt-6 pt-3 border-t border-slate-100 text-xs font-semibold text-slate-500 flex items-center justify-between">
                <span>Evaluation</span>
                <span className="text-sky-600 font-bold">Passed / Not Cleared</span>
              </div>
            </div>

            {/* Mode 3: Mixed Recruitment Process */}
            <div className="bg-white border border-sky-100 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="px-2.5 py-1 rounded-full bg-sky-100 text-sky-700 text-xs font-bold border border-sky-200">
                    Mode 03
                  </span>
                  <Layers className="w-5 h-5 text-sky-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  Mixed Recruitment Process
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
                  Simulates a sequential multi-stage hiring pipeline. Freshers face Aptitude (60% cutoff) $\rightarrow$ Tech 1 $\rightarrow$ Tech 2 $\rightarrow$ HR. Experienced candidates face multi-round tech and leadership screens.
                </p>
                <ul className="space-y-2 text-xs text-slate-700">
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                    <span>Sequential multi-stage pipeline</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                    <span>Aptitude qualifying stage (Freshers)</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                    <span>Comprehensive hiring packet</span>
                  </li>
                </ul>
              </div>
              <div className="mt-6 pt-3 border-t border-slate-100 text-xs font-semibold text-slate-500 flex items-center justify-between">
                <span>Simulation Type</span>
                <span className="text-sky-600 font-bold">End-to-End Pipeline</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* =========================================================================
          SECTION 8: FINAL CALL TO ACTION
          ========================================================================= */}
      <section className="py-20 md:py-24 bg-gradient-to-b from-[#f8fbff] to-white relative overflow-hidden border-t border-sky-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-sky-200 text-sky-700 text-xs font-semibold mb-6 shadow-xs">
            <Sparkles className="w-4 h-4 text-sky-600" />
            <span>Zero commitment • Role-tailored preparation</span>
          </div>

          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight mb-4">
            Your Next Opportunity Starts With Preparation.
          </h2>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto mb-8 leading-relaxed">
            Build your skills, practise real interview scenarios and prepare for every stage of recruitment.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Link
              to="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-base transition-all shadow-lg shadow-sky-500/25 hover:shadow-sky-500/35"
            >
              <span>Start Preparing</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

        </div>
      </section>

      {/* =========================================================================
          SECTION 9: PROFESSIONAL FOOTER
          ========================================================================= */}
      <footer className="w-full bg-[#f8fbff] border-t border-sky-100 pt-16 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 pb-12 border-b border-sky-100">
            
            {/* Branding Column */}
            <div className="md:col-span-2 space-y-4">
              <BrandLogo size={30} linkTo="/" />
              <p className="text-xs sm:text-sm text-slate-600 max-w-sm leading-relaxed">
                Salary-wise and role-oriented interview preparation platform powered by structured roadmaps and voice simulation.
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-sky-200 text-sky-700 text-xs font-semibold shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>All Platform Services Operational</span>
              </div>
            </div>

            {/* Column 2: Platform */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Platform
              </div>
              <ul className="space-y-2 text-xs sm:text-sm">
                <li>
                  <a href="#features" className="text-slate-600 hover:text-sky-600 transition-colors">
                    Learning Roadmaps
                  </a>
                </li>
                <li>
                  <a href="#features" className="text-slate-600 hover:text-sky-600 transition-colors">
                    Hands-on Practice
                  </a>
                </li>
                <li>
                  <a href="#features" className="text-slate-600 hover:text-sky-600 transition-colors">
                    Aptitude Preparation
                  </a>
                </li>
                <li>
                  <a href="#simulation-modes" className="text-slate-600 hover:text-sky-600 transition-colors">
                    Voice Simulations
                  </a>
                </li>
                <li>
                  <Link to="/experiences" className="text-slate-600 hover:text-sky-600 transition-colors">
                    Peer Experiences
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Company / Information */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Company
              </div>
              <ul className="space-y-2 text-xs sm:text-sm">
                <li>
                  <Link to="/about" className="text-slate-600 hover:text-sky-600 transition-colors">
                    About InterviewPrep
                  </Link>
                </li>
                <li>
                  <a href="#how-it-works" className="text-slate-600 hover:text-sky-600 transition-colors">
                    How It Works
                  </a>
                </li>
                <li>
                  <a href="#salary-wise" className="text-slate-600 hover:text-sky-600 transition-colors">
                    Salary-Wise Model
                  </a>
                </li>
                <li>
                  <Link to="/contact" className="text-slate-600 hover:text-sky-600 transition-colors">
                    Contact &amp; Support
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 4: Legal & Trust */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Legal &amp; Trust
              </div>
              <ul className="space-y-2 text-xs sm:text-sm">
                <li>
                  <Link to="/terms" className="text-slate-600 hover:text-sky-600 transition-colors">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link to="/privacy" className="text-slate-600 hover:text-sky-600 transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/security" className="text-slate-600 hover:text-sky-600 transition-colors">
                    Platform Security
                  </Link>
                </li>
              </ul>
            </div>

          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <p>&copy; {new Date().getFullYear()} InterviewPrep. All rights reserved.</p>
            <p className="text-[11px] text-slate-400">
              Salary-wise recruitment preparation standard • Not affiliated with any specific company.
            </p>
          </div>

        </div>
      </footer>

    </div>
  );
}
