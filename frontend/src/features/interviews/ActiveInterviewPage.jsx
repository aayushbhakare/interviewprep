import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Square,
  Send,
  AlertCircle,
  HelpCircle,
  LogOut,
  Sparkles,
  Bot,
  User as UserIcon,
} from 'lucide-react';
import { interviewService } from '../../services/interviewService';
import { AudioManager } from './services/audioManager';

export default function ActiveInterviewPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [interviewerStatus, setInterviewerStatus] = useState('speaking'); // 'speaking' | 'listening' | 'thinking'
  const [currentSpeechInput, setCurrentSpeechInput] = useState('');
  const [textFallbackInput, setTextFallbackInput] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [turns, setTurns] = useState([]);
  const [abandonModalOpen, setAbandonModalOpen] = useState(false);
  const [error, setError] = useState(null);

  const audioManagerRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadSession();
    return () => {
      if (audioManagerRef.current) {
        audioManagerRef.current.destroy();
      }
    };
  }, [sessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [turns, interviewerStatus]);

  const loadSession = async () => {
    setLoading(true);
    try {
      const res = await interviewService.getSessionDetail(sessionId);
      const data = res.data;
      setSession(data);
      setTurns(data.turns || []);

      if (data.status === 'completed') {
        navigate(`/practice/interviews/${sessionId}/results`);
        return;
      }

      // Initialize audio manager
      audioManagerRef.current = new AudioManager({
        onTranscriptChange: (text) => setCurrentSpeechInput(text),
        onSpeechEnd: (finalText) => handleStudentSpeechSubmit(finalText),
        onStatusChange: (status) => setInterviewerStatus(status),
        onError: (err) => console.warn('Audio error:', err),
      });

      // Play the initial interviewer question aloud if available
      const lastTurn = (data.turns || []).slice(-1)[0];
      if (lastTurn && lastTurn.role === 'interviewer') {
        setInterviewerStatus('speaking');
        audioManagerRef.current.speak(lastTurn.content, () => {
          setInterviewerStatus('listening');
          audioManagerRef.current.startListening();
        });
      } else {
        setInterviewerStatus('listening');
        audioManagerRef.current.startListening();
      }
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to load interview session.');
    } finally {
      setLoading(false);
    }
  };

  const handleStudentSpeechSubmit = async (speechText) => {
    const textToSend = (speechText || '').trim();
    if (!textToSend) return;

    audioManagerRef.current?.stopListening();
    setInterviewerStatus('thinking');
    setCurrentSpeechInput('');
    setTextFallbackInput('');

    // Optimistically update turns
    const studentTurn = {
      role: 'student',
      content: textToSend,
      timestamp: new Date().toISOString(),
    };
    setTurns((prev) => [...prev, studentTurn]);

    try {
      const res = await interviewService.sendTurn(sessionId, textToSend);
      const turnData = res.data;

      const aiTurn = {
        role: 'interviewer',
        content: turnData.interviewer_speech,
        timestamp: new Date().toISOString(),
        status: turnData.status,
      };
      setTurns((prev) => [...prev, aiTurn]);

      if (turnData.is_completed) {
        setInterviewerStatus('speaking');
        audioManagerRef.current?.speak(turnData.interviewer_speech, () => {
          navigate(`/practice/interviews/${sessionId}/results`);
        });
      } else {
        setInterviewerStatus('speaking');
        audioManagerRef.current?.speak(turnData.interviewer_speech, () => {
          setInterviewerStatus('listening');
          audioManagerRef.current?.startListening();
        });
      }
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to process turn.');
      setInterviewerStatus('listening');
      audioManagerRef.current?.startListening();
    }
  };

  const handleInterrupt = () => {
    audioManagerRef.current?.cancelSpeech();
    setInterviewerStatus('listening');
    audioManagerRef.current?.startListening();
  };

  const handleManualDoneSpeaking = () => {
    const candidateSpeech = currentSpeechInput || textFallbackInput;
    if (candidateSpeech.trim()) {
      handleStudentSpeechSubmit(candidateSpeech.trim());
    }
  };

  const handleTextFallbackSubmit = (e) => {
    e.preventDefault();
    if (textFallbackInput.trim()) {
      handleStudentSpeechSubmit(textFallbackInput.trim());
    }
  };

  const handleAbandon = async () => {
    try {
      audioManagerRef.current?.destroy();
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
        <p className="text-sm font-medium">Entering voice simulation room...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Top Session Bar */}
      <div className="bg-white border border-slate-200 rounded-xl px-5 py-3.5 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
            AI
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 capitalize">
              {session?.interview_type} Interview Simulation
            </h2>
            <p className="text-xs text-slate-500">
              {session?.role} • {session?.experience_level} • {session?.salary_range}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-slate-600" />}
          </button>

          <button
            onClick={() => setAbandonModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Leave Session</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Simulation Viewport */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Left Column: Visual AI Interviewer Avatar & State */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center text-center">
          {/* Avatar Graphic with Dynamic Pulse Rings */}
          <div className="relative mb-5">
            <div
              className={`w-28 h-28 rounded-full flex items-center justify-center transition-all duration-500 shadow-md ${
                interviewerStatus === 'speaking'
                  ? 'bg-gradient-to-br from-indigo-500 to-indigo-700 ring-8 ring-indigo-100 scale-105'
                  : interviewerStatus === 'listening'
                  ? 'bg-gradient-to-br from-emerald-500 to-emerald-700 ring-8 ring-emerald-100 animate-pulse'
                  : 'bg-gradient-to-br from-amber-500 to-amber-700 ring-8 ring-amber-100'
              }`}
            >
              <Bot className="w-14 h-14 text-white" />
            </div>

            {/* Status Badge */}
            <span
              className={`absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider shadow-sm transition-colors ${
                interviewerStatus === 'speaking'
                  ? 'bg-indigo-600 text-white'
                  : interviewerStatus === 'listening'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-amber-600 text-white'
              }`}
            >
              {interviewerStatus}
            </span>
          </div>

          <h3 className="text-base font-bold text-slate-900 mt-2">
            AI Technical Evaluator
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 mb-4">
            Voice-directed natural conversation
          </p>

          {/* Quick Verbal Hint Pill */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-left text-xs text-slate-600 space-y-1 w-full">
            <span className="font-semibold text-slate-800 flex items-center gap-1 text-[11.5px]">
              <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
              Verbal Guidelines:
            </span>
            <ul className="text-[11px] text-slate-500 space-y-0.5 list-disc pl-3.5">
              <li>Say "Repeat the question" to hear it again.</li>
              <li>Say "I don't know" to skip to the next topic.</li>
              <li>Speak clearly; pauses under 2s are recognized.</li>
            </ul>
          </div>

          {/* Interruption Control */}
          <div className="mt-5 w-full">
            <button
              onClick={handleInterrupt}
              disabled={interviewerStatus !== 'speaking'}
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Square className="w-3.5 h-3.5" />
              <span>Interrupt Interviewer</span>
            </button>
          </div>
        </div>

        {/* Right 2 Columns: Live Conversational Log */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col h-[480px]">
          {/* Header */}
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              Live Conversation Feed
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              Real-time transcript
            </span>
          </div>

          {/* Transcript Scrollbox */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
            {turns.map((turn, index) => {
              const isAi = turn.role === 'interviewer';
              return (
                <div
                  key={index}
                  className={`flex items-start gap-3 ${isAi ? '' : 'flex-row-reverse'}`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-white text-[11px] font-bold ${
                      isAi ? 'bg-indigo-600' : 'bg-slate-700'
                    }`}
                  >
                    {isAi ? <Bot className="w-4 h-4" /> : <UserIcon className="w-4 h-4" />}
                  </div>

                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-xs leading-relaxed ${
                      isAi
                        ? 'bg-slate-50 border border-slate-200 text-slate-900'
                        : 'bg-brand-600 text-white'
                    }`}
                  >
                    <p className="whitespace-pre-line text-xs font-medium">{turn.content}</p>
                    <span
                      className={`block text-[10px] mt-1.5 ${
                        isAi ? 'text-slate-400' : 'text-brand-200'
                      }`}
                    >
                      {turn.timestamp ? new Date(turn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Live interim spoken transcript */}
            {currentSpeechInput && (
              <div className="flex items-start gap-3 flex-row-reverse">
                <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center shrink-0 text-white text-[11px] animate-pulse">
                  <Mic className="w-4 h-4" />
                </div>
                <div className="max-w-[80%] rounded-2xl px-4 py-2.5 bg-emerald-50 border border-emerald-200 text-emerald-900 italic text-xs">
                  {currentSpeechInput}...
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Spoken Action Bar */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl flex flex-col sm:flex-row items-center gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleManualDoneSpeaking}
                disabled={interviewerStatus === 'thinking'}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition disabled:opacity-50"
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Done Speaking</span>
              </button>
            </div>

            {/* Text Fallback Input Bar (Supports Keyboard & Headless Playwright testing) */}
            <form onSubmit={handleTextFallbackSubmit} className="flex-1 flex items-center gap-2 w-full">
              <input
                type="text"
                value={textFallbackInput}
                onChange={(e) => setTextFallbackInput(e.target.value)}
                placeholder="Or type an answer / clarification..."
                className="flex-1 text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              />
              <button
                type="submit"
                disabled={!textFallbackInput.trim() || interviewerStatus === 'thinking'}
                className="p-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl disabled:opacity-40 transition shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Leave Modal */}
      {abandonModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-2">
              Leave Interview Practice?
            </h3>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Exiting will mark this session as abandoned. Abandoned sessions are not recorded as a failure and do not trigger a cooling period.
            </p>
            <div className="flex justify-end gap-2.5">
              <button
                onClick={() => setAbandonModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition"
              >
                Continue Practice
              </button>
              <button
                onClick={handleAbandon}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-sm transition"
              >
                Confirm Exit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
