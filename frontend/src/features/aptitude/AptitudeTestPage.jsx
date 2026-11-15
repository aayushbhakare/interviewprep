import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Send,
  Flag,
} from 'lucide-react';
import aptitudeService from '../../services/aptitudeService';
import AptitudeLeaveModal from './AptitudeLeaveModal';
import AptitudeSubmitModal from './AptitudeSubmitModal';
import AptitudeReportModal from './AptitudeReportModal';

export default function AptitudeTestPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Timer state
  const [timeLeft, setTimeLeft] = useState(60 * 60);

  // Local answers state: { [questionId]: selectedOptionIndex }
  const [localAnswers, setLocalAnswers] = useState({});
  const localAnswersRef = useRef({});
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved' | 'saving' | 'error'

  // Modals
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [isAbandoning, setIsAbandoning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const autosaveTimerRef = useRef(null);
  const autoSubmittedRef = useRef(false);

  useEffect(() => {
    localAnswersRef.current = localAnswers;
  }, [localAnswers]);

  // Load session detail
  useEffect(() => {
    setLoading(true);
    aptitudeService
      .getSessionDetail(sessionId)
      .then((res) => {
        const sess = res.data?.data;
        if (!sess) {
          navigate('/practice/aptitude');
          return;
        }

        if (sess.status === 'submitted') {
          navigate(`/practice/aptitude/${sessionId}/results`);
          return;
        }

        if (sess.status === 'abandoned') {
          navigate('/practice/aptitude');
          return;
        }

        setSession(sess);
        const qList = sess.questions || [];
        setQuestions(qList);
        setTimeLeft(sess.remaining_seconds || 60 * 60);

        // Pre-fill local answers from server
        const initialAnswers = {};
        qList.forEach((q) => {
          if (q.selected_option_index !== null && q.selected_option_index !== undefined) {
            initialAnswers[q.question_id] = q.selected_option_index;
          }
        });
        setLocalAnswers(initialAnswers);
      })
      .catch((err) => {
        setError(err?.response?.data?.detail || 'Failed to load test session.');
      })
      .finally(() => setLoading(false));
  }, [sessionId, navigate]);

  // Debounced Autosave
  const triggerAutosave = useCallback(
    async (answersToSave) => {
      if (!sessionId) return false;
      setSaveStatus('saving');

      const payload = Object.entries(answersToSave).map(([qid, optIndex]) => ({
        question_id: qid,
        selected_option_index: optIndex,
      }));

      try {
        const res = await aptitudeService.autosaveAnswers(sessionId, payload);
        if (res.data?.data?.is_expired) {
          navigate(`/practice/aptitude/${sessionId}/results`);
          return false;
        }
        setSaveStatus('saved');
        return true;
      } catch {
        setSaveStatus('error');
        return false;
      }
    },
    [sessionId, navigate]
  );

  const handleSelectOption = (questionId, optionIndex) => {
    setLocalAnswers((prev) => {
      const updated = {
        ...prev,
        [questionId]: optionIndex,
      };

      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = setTimeout(() => {
        triggerAutosave(updated);
      }, 600);

      return updated;
    });
  };

  // Timer countdown
  useEffect(() => {
    if (loading || !session) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [loading, session]);

  const handleAutoSubmit = useCallback(async () => {
    if (!sessionId || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await triggerAutosave(localAnswersRef.current);
      await aptitudeService.submitSession(sessionId);
      navigate(`/practice/aptitude/${sessionId}/results`);
    } catch {
      navigate('/practice/aptitude');
    }
  }, [sessionId, isSubmitting, navigate, triggerAutosave]);

  // Auto-submit when timer expires
  useEffect(() => {
    if (timeLeft === 0 && sessionId && !autoSubmittedRef.current && !loading) {
      autoSubmittedRef.current = true;
      handleAutoSubmit();
    }
  }, [timeLeft, sessionId, loading, handleAutoSubmit]);

  const handleManualSubmit = async () => {
    if (!sessionId || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await triggerAutosave(localAnswersRef.current);
      await aptitudeService.submitSession(sessionId);
      setSubmitModalOpen(false);
      navigate(`/practice/aptitude/${sessionId}/results`);
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to submit test.');
      setIsSubmitting(false);
    }
  };

  const handleConfirmAbandon = async () => {
    if (!sessionId || isAbandoning) return;
    setIsAbandoning(true);
    try {
      await aptitudeService.abandonSession(sessionId);
      setLeaveModalOpen(false);
      navigate('/practice/aptitude');
    } catch {
      navigate('/practice/aptitude');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-500">
        Loading test questions...
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(localAnswers).length;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const isTimeCritical = timeLeft < 300; // < 5 mins

  const categoryBadges = {
    quantitative: 'bg-purple-100 text-purple-800 border-purple-200',
    logical: 'bg-blue-100 text-blue-800 border-blue-200',
    verbal: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  };

  const categoryLabels = {
    quantitative: 'Quantitative Aptitude',
    logical: 'Logical Reasoning',
    verbal: 'Verbal Ability',
  };

  const optionLetters = ['A', 'B', 'C', 'D'];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm px-4 sm:px-6 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-sm font-bold text-slate-900 tracking-tight">
              Aptitude Practice Test
            </span>
            <span className="text-xs text-slate-400 hidden sm:inline">•</span>
            <span className="text-xs font-medium text-slate-500 hidden sm:inline">
              Q{currentIndex + 1} of {totalQuestions}
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                saveStatus === 'saving'
                  ? 'bg-amber-50 text-amber-600'
                  : saveStatus === 'error'
                  ? 'bg-rose-50 text-rose-600'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'error' ? 'Save error' : 'Answers saved'}
            </span>
          </div>

          <div className="flex items-center space-x-4">
            {/* Live Timer */}
            <div
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border font-mono text-sm font-bold ${
                isTimeCritical
                  ? 'bg-rose-50 text-rose-700 border-rose-300 animate-pulse'
                  : 'bg-slate-100 text-slate-800 border-slate-200'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>{timeFormatted}</span>
            </div>

            <button
              onClick={() => setLeaveModalOpen(true)}
              className="text-xs text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition"
            >
              <LogOut className="w-3.5 h-3.5 mr-1 inline" />
              Leave
            </button>

            <button
              onClick={() => setSubmitModalOpen(true)}
              className="inline-flex items-center px-4 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
            >
              <Send className="w-3.5 h-3.5 mr-1.5" />
              Submit Test
            </button>
          </div>
        </div>
      </header>

      {/* Main Test Body */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex-1 flex flex-col lg:flex-row gap-6">
        {/* Left Column: Current Question */}
        <div className="flex-1 flex flex-col bg-white border border-slate-200 rounded-xl shadow-sm p-6 sm:p-8">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-xs text-rose-700 rounded-lg">
              {error}
            </div>
          )}

          {currentQ ? (
            <div className="flex-1 flex flex-col justify-between">
              <div>
                {/* Badges & Actions */}
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                        categoryBadges[currentQ.category] || 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {categoryLabels[currentQ.category] || currentQ.category}
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      {currentQ.topic}
                    </span>
                    <span className="text-xs text-slate-400 capitalize hidden sm:inline">
                      • {currentQ.difficulty}
                    </span>
                  </div>

                  <button
                    onClick={() => setReportModalOpen(true)}
                    className="text-xs text-slate-400 hover:text-amber-600 flex items-center transition"
                  >
                    <Flag className="w-3.5 h-3.5 mr-1" />
                    Report
                  </button>
                </div>

                {/* Question Statement */}
                <div className="mb-6">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Question {currentIndex + 1}
                  </span>
                  <h2 className="text-base sm:text-lg font-medium text-slate-900 leading-relaxed whitespace-pre-line">
                    {currentQ.question_text}
                  </h2>
                </div>

                {/* 4 Options Selection */}
                <div className="space-y-3 mb-8">
                  {currentQ.options?.map((opt, optIdx) => {
                    const isSelected = localAnswers[currentQ.question_id] === optIdx;
                    return (
                      <button
                        key={optIdx}
                        type="button"
                        onClick={() => handleSelectOption(currentQ.question_id, optIdx)}
                        className={`w-full text-left p-4 rounded-xl border transition flex items-center space-x-3.5 ${
                          isSelected
                            ? 'bg-brand-50/70 border-brand-500 ring-1 ring-brand-400 shadow-sm'
                            : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition ${
                            isSelected
                              ? 'bg-brand-600 text-white'
                              : 'bg-slate-100 text-slate-600 border border-slate-300'
                          }`}
                        >
                          {optionLetters[optIdx]}
                        </div>
                        <span className={`text-sm ${isSelected ? 'font-semibold text-brand-950' : 'text-slate-800'}`}>
                          {opt}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Question Controls */}
              <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentIndex === 0}
                  className="inline-flex items-center px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 transition disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </button>

                <span className="text-xs text-slate-400">
                  {currentIndex + 1} of {totalQuestions}
                </span>

                <button
                  type="button"
                  onClick={() => setCurrentIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
                  disabled={currentIndex === totalQuestions - 1}
                  className="inline-flex items-center px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-medium hover:bg-slate-800 transition disabled:opacity-40"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400">No question data found.</div>
          )}
        </div>

        {/* Right Column: Question Navigation Palette */}
        <aside className="w-full lg:w-80 bg-white border border-slate-200 rounded-xl shadow-sm p-6 flex flex-col shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Question Palette
            </h3>
            <span className="text-xs font-semibold text-emerald-600">
              {answeredCount} / {totalQuestions} Answered
            </span>
          </div>

          {/* Palette Legend */}
          <div className="flex items-center justify-between text-[11px] text-slate-600 mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-full bg-brand-600" />
              <span>Current</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-100 border border-emerald-400" />
              <span>Answered</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-full bg-slate-100 border border-slate-300" />
              <span>Unanswered</span>
            </div>
          </div>

          {/* 45-Button Grid */}
          <div className="grid grid-cols-5 gap-2 overflow-y-auto max-h-96 pr-1">
            {questions.map((q, idx) => {
              const isCurrent = idx === currentIndex;
              const isAnswered = localAnswers[q.question_id] !== undefined;

              let btnClass = 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200';
              if (isCurrent) {
                btnClass = 'bg-brand-600 text-white font-bold ring-2 ring-brand-300 border-brand-600';
              } else if (isAnswered) {
                btnClass = 'bg-emerald-100 text-emerald-900 font-semibold border border-emerald-300';
              }

              return (
                <button
                  key={q.question_id}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-9 rounded-lg text-xs transition flex items-center justify-center ${btnClass}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {/* Submit Action */}
          <div className="pt-6 mt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setSubmitModalOpen(true)}
              className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
            >
              Submit Test ({answeredCount}/{totalQuestions})
            </button>
          </div>
        </aside>
      </main>

      {/* Leave Modal */}
      <AptitudeLeaveModal
        isOpen={leaveModalOpen}
        onClose={() => setLeaveModalOpen(false)}
        onConfirm={handleConfirmAbandon}
        isAbandoning={isAbandoning}
      />

      {/* Submit Modal */}
      <AptitudeSubmitModal
        isOpen={submitModalOpen}
        onClose={() => setSubmitModalOpen(false)}
        onConfirm={handleManualSubmit}
        totalQuestions={totalQuestions}
        answeredCount={answeredCount}
        isSubmitting={isSubmitting}
      />

      {/* Report Modal */}
      <AptitudeReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        questionId={currentQ?.question_id}
        questionText={currentQ?.question_text}
      />
    </div>
  );
}
