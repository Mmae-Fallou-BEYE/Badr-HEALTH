// Generated with AI assistance (Antigravity). Reviewed by the team.
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mic,
  Volume2,
  VolumeX,
  X,
  Sparkles,
  Radio,
} from 'lucide-react';
import { useAppStore } from '../data/store';

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const {
    astronaut,
    switchAstronaut,
    healthScore,
    latestReadings,
    alerts,
    setScenario,
    toggleSimulation,
    isSimulating,
  } = useAppStore();

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [responseMessage, setResponseMessage] = useState<string>(
    'Awaiting your voice command. Say "Status report", "Go to body map", "Check vitals", or "Switch profile".'
  );
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition if available
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript('Listening for command...');
    };

    recognition.onresult = (event: any) => {
      const current = event.resultIndex;
      const text = event.results[current][0].transcript;
      setTranscript(text);
      if (event.results[current].isFinal) {
        processCommand(text);
      }
    };

    recognition.onerror = (event: any) => {
      console.warn('Speech recognition error:', event.error);
      setIsListening(false);
      if (event.error === 'not-allowed') {
        setResponseMessage('Microphone access denied. Click any suggested command below to test.');
      } else {
        setResponseMessage(`Voice recognition halted (${event.error}). Try again or click a command below.`);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, []);

  const speak = (text: string) => {
    if (!speechEnabled || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
    }
  };

  const startListening = () => {
    if (!recognitionRef.current) {
      setResponseMessage('Speech recognition is not supported in this browser. Use the quick voice commands below.');
      return;
    }
    try {
      recognitionRef.current.start();
    } catch (e) {
      try {
        recognitionRef.current.abort();
        recognitionRef.current.start();
      } catch {}
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsListening(false);
  };

  const processCommand = (rawText: string) => {
    const text = rawText.toLowerCase().trim();

    // 1. Status / Health Report
    if (text.includes('status') || text.includes('report') || text.includes('how am i') || text.includes('health')) {
      const hr = latestReadings.heart_rate?.value ?? 68;
      const spo2 = latestReadings.spo2?.value ?? 98;
      const unreadAlerts = alerts.filter((a) => !a.acknowledged_at).length;
      const msg = `Astronaut ${astronaut.callsign}: Composite Health Score is ${healthScore.score} out of 100, status ${healthScore.status}. Heart rate is ${hr} beats per minute. Blood oxygen is ${spo2} percent. ${unreadAlerts > 0 ? `${unreadAlerts} active alerts require attention.` : 'All primary vitals within nominal limits.'}`;
      setResponseMessage(msg);
      speak(msg);
      return;
    }

    // 2. Navigation: Body Map
    if (text.includes('body') || text.includes('map') || text.includes('anatomy')) {
      navigate('/body-map');
      const msg = 'Navigating to Interactive Anatomical Body Map.';
      setResponseMessage(msg);
      speak(msg);
      onClose();
      return;
    }

    // 3. Navigation: Vitals
    if (text.includes('vital') || text.includes('metric') || text.includes('telemetry')) {
      navigate('/vitals');
      const msg = 'Opening Astronaut Biometric Vitals telemetry buffer.';
      setResponseMessage(msg);
      speak(msg);
      onClose();
      return;
    }

    // 4. Navigation: Alerts
    if (text.includes('alert') || text.includes('warning') || text.includes('alarm')) {
      navigate('/alerts');
      const unread = alerts.filter((a) => !a.acknowledged_at).length;
      const msg = `Opening alerts center. There are currently ${unread} active notifications.`;
      setResponseMessage(msg);
      speak(msg);
      onClose();
      return;
    }

    // 5. Navigation: Overview / Dashboard
    if (text.includes('overview') || text.includes('dashboard') || text.includes('home')) {
      navigate('/');
      const msg = 'Navigating to Mission Health Overview dashboard.';
      setResponseMessage(msg);
      speak(msg);
      onClose();
      return;
    }

    // 6. Navigation: Mission Architecture
    if (text.includes('mission') || text.includes('gravity') || text.includes('sensor')) {
      navigate('/mission');
      const msg = 'Displaying Mission Architecture and Sensor Ingestion telemetry.';
      setResponseMessage(msg);
      speak(msg);
      onClose();
      return;
    }

    // 7. Navigation: Clinical Guides
    if (text.includes('guide') || text.includes('protocol') || text.includes('library')) {
      navigate('/guides');
      const msg = 'Opening Clinical & Operational Guides Library.';
      setResponseMessage(msg);
      speak(msg);
      onClose();
      return;
    }

    // 8. Crew Member Profile Switching
    if (text.includes('elena') || text.includes('rostova')) {
      switchAstronaut('ast-02');
      const msg = 'Active profile switched to Chief Medical Officer Dr. Elena Rostova.';
      setResponseMessage(msg);
      speak(msg);
      return;
    }

    if (text.includes('marcus') || text.includes('vance')) {
      switchAstronaut('ast-03');
      const msg = 'Active profile switched to EVA Specialist Marcus Vance.';
      setResponseMessage(msg);
      speak(msg);
      return;
    }

    if (text.includes('amina') || text.includes('diop')) {
      switchAstronaut('ast-04');
      const msg = 'Active profile switched to ECLSS Engineer Amina Diop.';
      setResponseMessage(msg);
      speak(msg);
      return;
    }

    if (text.includes('tariq') || text.includes('cygnus')) {
      switchAstronaut('ast-01');
      const msg = 'Active profile switched to Mission Commander Dr. Tariq Al-Battani.';
      setResponseMessage(msg);
      speak(msg);
      return;
    }

    // 9. Simulation Controls
    if (text.includes('pause')) {
      if (isSimulating) toggleSimulation();
      const msg = 'Live telemetry simulation paused.';
      setResponseMessage(msg);
      speak(msg);
      return;
    }

    if (text.includes('resume') || text.includes('start simulation') || text.includes('play')) {
      if (!isSimulating) toggleSimulation();
      const msg = 'Live telemetry simulation resumed.';
      setResponseMessage(msg);
      speak(msg);
      return;
    }

    if (text.includes('hypoxia')) {
      setScenario('hypoxia_event');
      const msg = 'Simulation scenario set to Hypoxia Event. Oxygen saturation dropping.';
      setResponseMessage(msg);
      speak(msg);
      return;
    }

    if (text.includes('solar') || text.includes('radiation')) {
      setScenario('solar_particle_event');
      const msg = 'Simulation scenario set to Solar Particle Event. Dosimeter rate spiking.';
      setResponseMessage(msg);
      speak(msg);
      return;
    }

    if (text.includes('nominal') || text.includes('baseline')) {
      setScenario('nominal');
      const msg = 'Simulation scenario restored to Nominal Baseline.';
      setResponseMessage(msg);
      speak(msg);
      return;
    }

    // Fallback: command not recognized
    const fallbackMsg = `Command "${rawText}" received. Say "Status report", "Go to body map", "Check vitals", or click a quick command below.`;
    setResponseMessage(fallbackMsg);
    speak(fallbackMsg);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-border animate-in fade-in zoom-in-95 duration-150 flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-mint-light text-primary flex items-center justify-center">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-ink">Badr Aerospace Voice Assistant</h3>
              <p className="text-xs text-muted">Hands-free biometric telemetry & crew command system</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSpeechEnabled(!speechEnabled)}
              className={`p-2 rounded-xl transition-colors ${
                speechEnabled ? 'bg-panel text-primary' : 'bg-canvas text-muted'
              }`}
              title={speechEnabled ? 'Mute voice feedback' : 'Enable voice feedback'}
            >
              {speechEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-muted hover:text-ink hover:bg-canvas transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Center Mic & Sound Wave Animation */}
        <div className="flex flex-col items-center justify-center py-4 bg-canvas rounded-2xl border border-border/80 relative overflow-hidden">
          {/* Animated sound wave bars when listening */}
          {isListening && (
            <div className="flex items-center justify-center gap-1.5 mb-3 h-8">
              <span className="w-1 h-3 bg-primary rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-1 h-6 bg-primary rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-1 h-8 bg-mint rounded-full animate-bounce [animation-delay:300ms]" />
              <span className="w-1 h-5 bg-primary rounded-full animate-bounce [animation-delay:100ms]" />
              <span className="w-1 h-2 bg-primary rounded-full animate-bounce [animation-delay:200ms]" />
            </div>
          )}

          <button
            onClick={isListening ? stopListening : startListening}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-lg ${
              isListening
                ? 'bg-rose-500 text-white ring-8 ring-rose-200 animate-pulse'
                : 'bg-primary text-white hover:bg-primary-hover ring-4 ring-mint/40 hover:scale-105'
            }`}
            title={isListening ? 'Click to stop listening' : 'Click to start voice command'}
          >
            {isListening ? <Mic className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
          </button>

          <p className="text-xs font-semibold text-ink mt-3">
            {isListening ? 'Listening now... Speak your command' : 'Click microphone to speak'}
          </p>
          <span className="text-[11px] text-muted font-mono mt-0.5 max-w-xs text-center truncate px-4">
            {transcript || 'e.g. "Report health status"'}
          </span>
        </div>

        {/* Response Feedback Bubble */}
        <div className="p-4 rounded-2xl bg-panel/70 border border-border">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-primary uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Assistant Telemetry Response</span>
          </div>
          <p className="text-xs text-ink leading-relaxed font-medium">{responseMessage}</p>
        </div>

        {/* Quick Voice Command Chips */}
        <div>
          <span className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-2">
            Suggested Hands-Free Voice Commands
          </span>
          <div className="flex flex-wrap gap-2">
            {[
              { label: '📊 Status Report', cmd: 'Report health status' },
              { label: '🧍 Body Map', cmd: 'Go to body map' },
              { label: '💓 Check Vitals', cmd: 'Check vitals' },
              { label: '🚨 View Alerts', cmd: 'Check alerts' },
              { label: '👩‍🚀 Switch to Elena', cmd: 'Switch to Elena' },
              { label: '⚠️ Hypoxia Event', cmd: 'Simulate hypoxia' },
              { label: '✨ Nominal Reset', cmd: 'Nominal baseline' },
            ].map((chip) => (
              <button
                key={chip.label}
                onClick={() => {
                  setTranscript(chip.cmd);
                  processCommand(chip.cmd);
                }}
                className="px-3 py-1.5 rounded-xl bg-canvas hover:bg-surface text-ink text-xs font-medium border border-border hover:border-primary/50 transition-all shadow-sm"
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between text-[11px] text-muted pt-3 border-t border-border">
          <span>Active astronaut: <strong className="text-primary">{astronaut.callsign}</strong></span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-canvas hover:bg-panel text-ink rounded-xl border border-border font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
