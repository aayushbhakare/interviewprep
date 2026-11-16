import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import RoadmapIntro from './RoadmapIntro';
import RoadmapWizard from './RoadmapWizard';
import RoadmapViewer from './RoadmapViewer';
import api from '../../services/api';

export default function LearnPage() {
  const { isAuthenticated } = useAuth();
  const [activeRoadmap, setActiveRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [isReplacing, setIsReplacing] = useState(false);

  const fetchActiveRoadmap = (silent = false) => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    if (!silent) {
      setLoading(true);
    }
    setError(null);
    api.get('/learning/roadmaps/active/')
      .then((res) => {
        setActiveRoadmap(res.data?.data || null);
      })
      .catch((err) => {
        if (!silent) {
          setError(err.response?.data?.detail || 'Unable to retrieve your learning roadmap.');
        }
      })
      .finally(() => {
        if (!silent) {
          setLoading(false);
        }
      });
  };

  useEffect(() => {
    fetchActiveRoadmap(false);
  }, [isAuthenticated]);

  const handleStartSetup = () => {
    setIsReplacing(false);
    setWizardOpen(true);
  };

  const handleStartReplacement = () => {
    setIsReplacing(true);
    setWizardOpen(true);
  };

  const handleWizardComplete = (newRoadmap) => {
    setActiveRoadmap(newRoadmap);
    setWizardOpen(false);
    setIsReplacing(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <RoadmapIntro onStartSetup={() => {}} />
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-2xl p-6 text-center">
          <h2 className="text-lg font-bold text-slate-900 mb-2">Sign in to generate your roadmap</h2>
          <p className="text-sm text-slate-600 mb-4 max-w-md mx-auto">
            Creating a learning roadmap requires an active student account to save your progress and topic completions.
          </p>
          <div className="flex items-center justify-center space-x-3">
            <Link
              to="/login"
              className="px-5 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-bold shadow-sm hover:bg-brand-700"
            >
              Sign In to Continue
            </Link>
            <Link
              to="/register"
              className="px-5 py-2.5 border border-slate-300 bg-white text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50"
            >
              Register Free
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {loading && (
        <div className="py-24 text-center flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-brand-600 animate-spin mb-3" />
          <p className="text-sm text-slate-500">Retrieving your learning roadmap...</p>
        </div>
      )}

      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center justify-between text-red-700 text-sm">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchActiveRoadmap}
            className="text-xs font-bold underline hover:no-underline ml-4"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && (
        <>
          {wizardOpen ? (
            <RoadmapWizard
              isReplacing={isReplacing}
              onComplete={handleWizardComplete}
              onCancel={() => setWizardOpen(false)}
            />
          ) : activeRoadmap?.status === 'preparing' ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-xl mx-auto shadow-sm">
              <Loader2 className="w-10 h-10 text-brand-600 animate-spin mx-auto mb-4" />
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                Preparing Your Personalized Roadmaps
              </h2>
              <p className="text-sm text-slate-600 mb-6">
                Our curriculum engine is synthesizing your learning phases, weekly milestones, and hands-on practice tasks tailored to your target salary tier.
              </p>
              <button
                type="button"
                onClick={() => fetchActiveRoadmap(false)}
                className="px-4 py-2 bg-brand-50 text-brand-700 font-semibold rounded-lg text-xs hover:bg-brand-100"
              >
                Refresh Status
              </button>
            </div>
          ) : activeRoadmap?.status === 'failed' ? (
            <div className="bg-white border border-red-200 rounded-2xl p-12 text-center max-w-xl mx-auto shadow-sm">
              <AlertCircle className="w-10 h-10 text-red-600 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                Roadmap Generation Failed
              </h2>
              <p className="text-sm text-slate-600 mb-6">
                {activeRoadmap.generation_error || 'An error occurred during roadmap generation. Your previous roadmap configuration has been safely preserved.'}
              </p>
              <div className="flex items-center justify-center space-x-3">
                <button
                  type="button"
                  onClick={handleStartSetup}
                  className="px-4 py-2 bg-brand-600 text-white font-bold rounded-xl text-xs hover:bg-brand-700"
                >
                  Retry Setup
                </button>
              </div>
            </div>
          ) : activeRoadmap ? (
            <RoadmapViewer
              roadmap={activeRoadmap}
              onRoadmapReplaced={handleStartReplacement}
              onRefreshRoadmap={() => fetchActiveRoadmap(true)}
            />
          ) : (
            <RoadmapIntro onStartSetup={handleStartSetup} />
          )}
        </>
      )}
    </div>
  );
}
