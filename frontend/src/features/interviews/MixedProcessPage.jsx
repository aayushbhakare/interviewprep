import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Layers,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Play,
  Lock,
  LogOut,
  AlertCircle,
  FileText,
  Code2,
  Users,
  Award,
} from 'lucide-react';
import { interviewService } from '../../services/interviewService';

export default function MixedProcessPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [evaluatingAptitude, setEvaluatingAptitude] = useState(false);
  const [abandonModalOpen, setAbandonModalOpen] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  const loadSession = async () => {
    setLoading(true);
    try {
      const res = await interviewService.getSessionDetail(sessionId);
      const data = res.data;
      setSession(data);

      if (data.status === 'completed') {
        navigate(`/practice/interviews/${sessionId}/results`);
      }
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to load mixed recruitment session.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteAptitudeRound = async () => {
    setError(null);
    setEvaluatingAptitude(true);
    try {
      const res = await interviewService.completeMixedAptitudeStage(sessionId);
      const data = res.data;
      if (data.is_passed) {
        // Reload session to reflect unlocked Round 2
        await loadSession();
      } else {
        // Failed: navigate to results to view feedback & cooling
        navigate(`/practice/interviews/${sessionId}/results`);
      }
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          'Aptitude stage is still in progress. Please submit the test before verifying.'
      );
    } finally {
      setEvaluatingAptitude(false);
    }
  };

  const handleAbandon = async () => {
    try {
      await interviewService.abandonSession(sessionId);
      navigate('/practice');
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to abandon session.');
      setAbandonModalOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-slate-500">
        <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-medium">Loading mixed recruitment process pipeline...</p>
      </div>
    );
  }

  const rounds = session?.rounds || [];
  const activeRound = rounds.find((r) => r.status === 'in_progress');

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-8 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
            Mixed Recruitment Process
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1.5">
            {session?.role} Recruitment Pipeline
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Target Tier: <span className="font-semibold text-slate-800">{session?.salary_range}</span> •{' '}
            Experience: <span className="font-semibold text-slate-800">{session?.experience_level}</span>
          </p>
        </div>

        <button
          onClick={() => setAbandonModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition shrink-0"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Abandon Simulation</span>
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Sequential Rounds Stepper */}
      <div className="space-y-4 mb-8">
        {rounds.map((r) => {
          const isAptitude = r.round_type === 'aptitude';
          const isHr = r.round_type === 'hr';
          const isCompleted = r.status === 'completed';
          const isInProgress = r.status === 'in_progress';
          const isNotAttempted = r.status === 'not_attempted';
          const isPending = r.status === 'pending';

          const roundIcon = isAptitude ? (
            <FileText className="w-5 h-5 text-indigo-600" />
          ) : isHr ? (
            <Users className="w-5 h-5 text-emerald-600" />
          ) : (
            <Code2 className="w-5 h-5 text-purple-600" />
          );

          return (
            <div
              key={r.round_id}
              className={`rounded-2xl border p-5 transition ${
                isInProgress
                  ? 'bg-white border-brand-500 ring-2 ring-brand-500/10 shadow-md'
                  : isCompleted && r.result === 'pass'
                  ? 'bg-slate-50 border-emerald-200'
                  : isCompleted && r.result === 'fail'
                  ? 'bg-rose-50/50 border-rose-200'
                  : 'bg-slate-50/70 border-slate-200 opacity-75'
              }`}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isInProgress
                        ? 'bg-brand-50 text-brand-600'
                        : isCompleted && r.result === 'pass'
                        ? 'bg-emerald-50 text-emerald-600'
                        : isCompleted && r.result === 'fail'
                        ? 'bg-rose-50 text-rose-600'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {isCompleted && r.result === 'pass' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : isCompleted && r.result === 'fail' ? (
                      <XCircle className="w-5 h-5 text-rose-600" />
                    ) : (
                      roundIcon
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">{r.round_name}</h3>
                      {isInProgress && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-brand-100 text-brand-800">
                          Active Round
                        </span>
                      )}
                      {isCompleted && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            r.result === 'pass'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {r.result}
                        </span>
                      )}
                      {isNotAttempted && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-200 text-slate-600">
                          Not Attempted
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1 max-w-xl leading-relaxed">
                      {r.round_description}
                    </p>
                  </div>
                </div>

                {/* Round Actions */}
                <div className="shrink-0 self-end sm:self-center">
                  {isInProgress && isAptitude && (
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/practice/aptitude/${r.aptitude_session_id}/take`}
                        className="inline-flex items-center gap-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Launch Aptitude Stage</span>
                      </Link>
                      <button
                        onClick={handleCompleteAptitudeRound}
                        disabled={evaluatingAptitude}
                        className="inline-flex items-center gap-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{evaluatingAptitude ? 'Verifying...' : 'Verify & Advance'}</span>
                      </button>
                    </div>
                  )}

                  {isInProgress && !isAptitude && (
                    <Link
                      to={`/practice/interviews/${sessionId}/active`}
                      className="inline-flex items-center gap-1 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Enter Voice Interview</span>
                    </Link>
                  )}

                  {isPending && (
                    <span className="inline-flex items-center gap-1 text-xs text-slate-400 font-medium">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Unlock with earlier round pass</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Abandon Confirmation Modal */}
      {abandonModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-2">
              Abandon Mixed Recruitment Process?
            </h3>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Exiting will cancel this mixed simulation session. Abandoned simulations are not counted as failures and do not incur a cooling period.
            </p>
            <div className="flex justify-end gap-2.5">
              <button
                onClick={() => setAbandonModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition"
              >
                Continue Process
              </button>
              <button
                onClick={handleAbandon}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-sm transition"
              >
                Confirm Abandon
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
