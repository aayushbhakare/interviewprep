/**
 * AudioManager handles real-time voice interactions:
 * - Speech-to-Text via browser Web Speech Recognition
 * - Text-to-Speech via browser SpeechSynthesis
 * - Silence detection & manual interruption controls
 */

export class AudioManager {
  constructor({ onTranscriptChange, onSpeechEnd, onStatusChange, onError }) {
    this.onTranscriptChange = onTranscriptChange || (() => {});
    this.onSpeechEnd = onSpeechEnd || (() => {});
    this.onStatusChange = onStatusChange || (() => {});
    this.onError = onError || (() => {});

    this.recognition = null;
    this.isListening = false;
    this.silenceTimer = null;
    this.silenceTimeoutMs = 1800; // 1.8s of silence triggers end of turn
    this.accumulatedTranscript = '';

    this._initSpeechRecognition();
  }

  _initSpeechRecognition() {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition ||
      null;

    if (!SpeechRecognition) {
      this.hasRecognitionSupport = false;
      return;
    }

    this.hasRecognitionSupport = true;
    try {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onstart = () => {
        this.isListening = true;
        this.onStatusChange('listening');
      };

      this.recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' ';
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        if (finalTranscript) {
          this.accumulatedTranscript += finalTranscript;
        }

        const currentText = (this.accumulatedTranscript + interimTranscript).trim();
        this.onTranscriptChange(currentText);

        // Reset silence timer on every spoken syllable
        this._resetSilenceTimer();
      };

      this.recognition.onerror = (event) => {
        if (event.error !== 'no-speech') {
          this.onError(event.error);
        }
      };

      this.recognition.onend = () => {
        if (this.isListening) {
          try {
            this.recognition.start();
          } catch {
            // Restart if continuously listening
          }
        }
      };
    } catch (err) {
      this.hasRecognitionSupport = false;
      this.onError('Failed to initialize speech recognition: ' + err.message);
    }
  }

  _resetSilenceTimer() {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
    }

    this.silenceTimer = setTimeout(() => {
      const trimmed = this.accumulatedTranscript.trim();
      if (trimmed.length > 0) {
        this.stopListening();
        this.onSpeechEnd(trimmed);
        this.accumulatedTranscript = '';
      }
    }, this.silenceTimeoutMs);
  }

  startListening() {
    this.accumulatedTranscript = '';
    this.cancelSpeech(); // Interrupt interviewer if speaking

    if (this.recognition && this.hasRecognitionSupport) {
      try {
        this.isListening = true;
        this.recognition.start();
      } catch {
        // Recognition may already be active
      }
    } else {
      this.isListening = true;
      this.onStatusChange('listening');
    }
  }

  stopListening() {
    this.isListening = false;
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }

    if (this.recognition && this.hasRecognitionSupport) {
      try {
        this.recognition.stop();
      } catch {
        // Safe ignore
      }
    }
    this.onStatusChange('thinking');
  }

  /**
   * Speaks interviewer text aloud using natural browser SpeechSynthesis.
   */
  speak(text, onComplete) {
    this.cancelSpeech();

    if (!('speechSynthesis' in window)) {
      if (onComplete) onComplete();
      return;
    }

    this.onStatusChange('speaking');
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.lang = 'en-US';

    // Pick a natural English voice if available
    const voices = window.speechSynthesis.getVoices();
    const naturalVoice = voices.find(
      (v) => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha'))
    );
    if (naturalVoice) {
      utterance.voice = naturalVoice;
    }

    utterance.onend = () => {
      this.onStatusChange('listening');
      if (onComplete) onComplete();
    };

    utterance.onerror = (e) => {
      if (e.error !== 'interrupted' && e.error !== 'canceled') {
        this.onError('Speech synthesis error: ' + e.error);
      }
      this.onStatusChange('listening');
      if (onComplete) onComplete();
    };

    window.speechSynthesis.speak(utterance);
  }

  /**
   * Manual interruption control: immediately cancels interviewer voice.
   */
  cancelSpeech() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  destroy() {
    this.stopListening();
    this.cancelSpeech();
    this.recognition = null;
  }
}
