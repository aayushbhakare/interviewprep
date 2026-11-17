import React, { useState, useEffect, useRef } from 'react';
import { Mic, Volume2, X, Play, Square, CheckCircle2, AlertCircle } from 'lucide-react';
import { AudioManager } from './services/audioManager';

export default function VoicePoCModal({ isOpen, onClose }) {
  const [status, setStatus] = useState('idle');
  const [transcript, setTranscript] = useState('');
  const [lastSpeech, setLastSpeech] = useState('');
  const [synthText, setSynthText] = useState('Welcome! This is a real-time voice verification test for AI interview simulations.');
  const [micPermission, setMicPermission] = useState('unknown');
  const [errorMsg, setErrorMsg] = useState(null);

  const audioManagerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      if (audioManagerRef.current) {
        audioManagerRef.current.destroy();
        audioManagerRef.current = null;
      }
      return;
    }

    // Check mic permission
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          setMicPermission('granted');
          // Release test stream
          stream.getTracks().forEach((track) => track.stop());
        })
        .catch((err) => {
          setMicPermission('denied');
          setErrorMsg('Microphone access denied: ' + err.message);
        });
    }

    audioManagerRef.current = new AudioManager({
      onTranscriptChange: (text) => setTranscript(text),
      onSpeechEnd: (text) => {
        setLastSpeech(text);
        setStatus('idle');
      },
      onStatusChange: (newStatus) => setStatus(newStatus),
      onError: (err) => setErrorMsg(String(err)),
    });

    return () => {
      if (audioManagerRef.current) {
        audioManagerRef.current.destroy();
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStartListening = () => {
    setErrorMsg(null);
    setTranscript('');
    audioManagerRef.current?.startListening();
  };

  const handleStopListening = () => {
    audioManagerRef.current?.stopListening();
  };

  const handleSpeak = () => {
    setErrorMsg(null);
    audioManagerRef.current?.speak(synthText, () => {
      setStatus('idle');
    });
  };

  const handleInterrupt = () => {
    audioManagerRef.current?.cancelSpeech();
    setStatus('idle');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2 text-brand-600 font-bold">
            <Mic className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base text-slate-900">Voice Hardware & Interaction PoC</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 rounded-lg p-1 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="space-y-4 my-5">
          {/* Permission status */}
          <div className="flex items-center justify-between text-xs p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="font-medium text-slate-700">Microphone Permission:</span>
            <span className={`font-bold flex items-center gap-1 ${micPermission === 'granted' ? 'text-emerald-600' : 'text-amber-600'}`}>
              <CheckCircle2 className="w-3.5 h-3.5" />
              {micPermission === 'granted' ? 'Allowed & Verified' : micPermission}
            </span>
          </div>

          {/* Current State indicator */}
          <div className="flex items-center justify-between text-xs p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="font-medium text-slate-700">Active State:</span>
            <span
              className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[10.5px] ${
                status === 'listening'
                  ? 'bg-emerald-100 text-emerald-800 animate-pulse'
                  : status === 'speaking'
                  ? 'bg-indigo-100 text-indigo-800 animate-pulse'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {status}
            </span>
          </div>

          {/* Speech Synthesis test */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
              <Volume2 className="w-3.5 h-3.5 text-indigo-600" />
              Test Interviewer Audio Output:
            </label>
            <input
              type="text"
              value={synthText}
              onChange={(e) => setSynthText(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={handleSpeak}
                disabled={status === 'speaking'}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
              >
                <Play className="w-3 h-3" /> Speak Text
              </button>
              <button
                onClick={handleInterrupt}
                disabled={status !== 'speaking'}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
              >
                <Square className="w-3 h-3" /> Interrupt Audio
              </button>
            </div>
          </div>

          {/* Speech-to-text test */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
              <Mic className="w-3.5 h-3.5 text-emerald-600" />
              Test Candidate Spoken Input (Live STT):
            </label>
            <div className="min-h-16 max-h-24 overflow-y-auto p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800">
              {transcript || (status === 'listening' ? 'Listening for speech...' : 'Press "Start Microphone" to speak...')}
            </div>
            {lastSpeech && (
              <p className="text-[11px] text-slate-500">
                Last captured utterance: <span className="text-slate-800 font-semibold">{lastSpeech}</span>
              </p>
            )}
            <div className="flex items-center gap-2">
              <button
                onClick={handleStartListening}
                disabled={status === 'listening'}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
              >
                <Mic className="w-3 h-3" /> Start Microphone
              </button>
              <button
                onClick={handleStopListening}
                disabled={status !== 'listening'}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
              >
                <Square className="w-3 h-3" /> Done Speaking
              </button>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition"
          >
            Close Diagnostics
          </button>
        </div>
      </div>
    </div>
  );
}
