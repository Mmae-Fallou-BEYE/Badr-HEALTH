// Generated with AI assistance (Antigravity). Reviewed by the team.
import React, { useState } from 'react';
import {
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Bookmark,
  Volume2,
  Brain,
  Eye,
  Heart,
  Wind,
  Apple,
  Bone,
  Dumbbell,
} from 'lucide-react';
import { useAppStore } from '../../data/store';
import { HRP_RISKS, HRPRisk } from '../../content/risks';
import { InfoTooltip } from '../../components/InfoTooltip';

export const BodyMapPage: React.FC = () => {
  const { latestReadings } = useAppStore();
  const [selectedRegionKey, setSelectedRegionKey] = useState<string>('lungs');
  const [activeSystemFilter, setActiveSystemFilter] = useState<string>('all');
  const [completedActions, setCompletedActions] = useState<Record<string, boolean>>({});
  const [isSpeaking, setIsSpeaking] = useState(false);

  interface AnatomicalRegion {
    id: string;
    label: string;
    organ: string;
    system: 'cardiovascular' | 'respiratory' | 'neuro' | 'musculoskeletal' | 'metabolic' | 'radiation';
    icon: any;
    riskId: string;
    coordinates: { x: number; y: number };
    getLiveMetrics: () => Array<{ name: string; value: string; status: 'green' | 'orange' | 'red'; unit?: string }>;
  }

  const anatomicalRegions: Record<string, AnatomicalRegion> = {
    brain: {
      id: 'brain',
      label: 'Brain & Cranial Cavity',
      organ: 'Cerebrospinal & Central Nervous System',
      system: 'neuro',
      icon: Brain,
      riskId: 'behavioural',
      coordinates: { x: 100, y: 38 },
      getLiveMetrics: () => [
        { name: 'Psychological Well-being', value: `${latestReadings.mood?.value ?? 4.4}`, unit: '/5', status: latestReadings.mood?.status ?? 'green' },
        { name: 'Restorative Sleep Rest', value: `${latestReadings.sleep_hours?.value ?? 7.6}`, unit: 'h', status: latestReadings.sleep_hours?.status ?? 'green' },
      ],
    },
    eyes: {
      id: 'eyes',
      label: 'Ocular Apparatus',
      organ: 'Optic Nerve & Retina (SANS Target)',
      system: 'neuro',
      icon: Eye,
      riskId: 'sans',
      coordinates: { x: 100, y: 46 },
      getLiveMetrics: () => [
        { name: 'Optic Coherence Tomography (OCT)', value: 'Nominal', unit: 'No Papilledema', status: 'green' },
        { name: 'Visual Acuity Snellen', value: '20/20', unit: 'Refraction', status: 'green' },
      ],
    },
    heart: {
      id: 'heart',
      label: 'Cardiovascular Complex',
      organ: 'Heart & Systemic Arterial Vasculature',
      system: 'cardiovascular',
      icon: Heart,
      riskId: 'cardiovascular',
      coordinates: { x: 108, y: 114 },
      getLiveMetrics: () => [
        { name: 'Resting Heart Rate', value: `${latestReadings.heart_rate?.value ?? 68}`, unit: 'bpm', status: latestReadings.heart_rate?.status ?? 'green' },
        { name: 'Arterial Blood Pressure', value: `${latestReadings.blood_pressure_sys?.value ?? 118}/${latestReadings.blood_pressure_dia?.value ?? 76}`, unit: 'mmHg', status: latestReadings.blood_pressure_sys?.status ?? 'green' },
      ],
    },
    lungs: {
      id: 'lungs',
      label: 'Pulmonary Respiratory Loop',
      organ: 'Lungs & Alveolar Gas Exchange',
      system: 'respiratory',
      icon: Wind,
      riskId: 'hypoxia',
      coordinates: { x: 92, y: 118 },
      getLiveMetrics: () => [
        { name: 'Peripheral Oxygen (SpO₂)', value: `${latestReadings.spo2?.value ?? 98}`, unit: '%', status: latestReadings.spo2?.status ?? 'green' },
        { name: 'Cabin CO₂ Concentration', value: `${latestReadings.cabin_co2?.value ?? 1250}`, unit: 'ppm', status: latestReadings.cabin_co2?.status ?? 'green' },
      ],
    },
    gut: {
      id: 'gut',
      label: 'Gastrointestinal & Metabolic',
      organ: 'Intestinal Microbiome & Endocrine Regulators',
      system: 'metabolic',
      icon: Apple,
      riskId: 'nutrition',
      coordinates: { x: 100, y: 164 },
      getLiveMetrics: () => [
        { name: 'Fasting Blood Glucose', value: `${latestReadings.glucose?.value ?? 88}`, unit: 'mg/dL', status: latestReadings.glucose?.status ?? 'green' },
        { name: 'Nutritional Energy Target', value: '2800', unit: 'kcal / Day', status: 'green' },
      ],
    },
    bones: {
      id: 'bones',
      label: 'Skeletal Spine & Bones',
      organ: 'Vertebral Column & Weight-Bearing Bones',
      system: 'musculoskeletal',
      icon: Bone,
      riskId: 'bone_changes',
      coordinates: { x: 100, y: 136 },
      getLiveMetrics: () => [
        { name: 'Spinal Elongation (Zero-G)', value: '+3.2', unit: 'cm nominal', status: 'green' },
        { name: 'BMD Mineral Loss Rate', value: '0.9%', unit: 'per month', status: 'green' },
      ],
    },
    muscles: {
      id: 'muscles',
      label: 'Musculoskeletal Locomotor System',
      organ: 'Postural Soleus & Quadriceps Muscles',
      system: 'musculoskeletal',
      icon: Dumbbell,
      riskId: 'reduced_fitness',
      coordinates: { x: 130, y: 225 },
      getLiveMetrics: () => [
        { name: 'Daily Resistance Training (ARED)', value: '65', unit: '/ 90 min done', status: 'green' },
        { name: 'Cycle Ergometry (T2)', value: '85%', unit: 'VO₂ max target', status: 'green' },
      ],
    },
  };

  const currentRegion = anatomicalRegions[selectedRegionKey] || anatomicalRegions.lungs;
  const currentRisk: HRPRisk = HRP_RISKS[currentRegion.riskId] || HRP_RISKS.hypoxia;
  const liveMetrics = currentRegion.getLiveMetrics();

  const isAnyMetricRed = liveMetrics.some((m) => m.status === 'red');
  const isAnyMetricOrange = liveMetrics.some((m) => m.status === 'orange');
  const overallRegionStatus = isAnyMetricRed ? 'red' : isAnyMetricOrange ? 'orange' : 'green';

  const toggleAction = (idx: number) => {
    const key = `${selectedRegionKey}-${idx}`;
    setCompletedActions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Text-to-speech audio briefing for hand-free astronaut assistance
  const playAudioBriefing = () => {
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const text = `Medical status briefing for ${currentRegion.label}. Status is ${overallRegionStatus}. Primary metrics: ${liveMetrics.map((m) => `${m.name}: ${m.value} ${m.unit || ''}`).join(', ')}. NASA Countermeasure recommendations: ${currentRisk.actions.slice(0, 2).join('. ')}.`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } catch {}
  };

  // Filter regions by system
  const visibleRegions = Object.values(anatomicalRegions).filter((r) => {
    if (activeSystemFilter === 'all') return true;
    return r.system === activeSystemFilter;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-ink">Interactive Anatomical Body Map</h2>
            <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-mint-light text-primary border border-mint">
              Flagship Telemetry Hub
            </span>
          </div>
          <p className="text-xs text-muted mt-0.5">
            Click any holographic organ node to inspect zero-gravity physiological adaptations and NASA clinical countermeasures.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={playAudioBriefing}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              isSpeaking
                ? 'bg-primary text-white border-primary shadow-soft animate-pulse'
                : 'bg-surface hover:bg-canvas text-primary border-border shadow-sm'
            }`}
            title="Listen to hands-free audio medical briefing"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>{isSpeaking ? 'Playing Audio Briefing...' : 'Audio Medical Briefing'}</span>
          </button>

          <span className="text-xs bg-panel text-primary font-bold px-3 py-1.5 rounded-xl border border-border">
            NASA HRP Evidence Books
          </span>
        </div>
      </div>

      {/* System Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {[
          { id: 'all', label: 'All Physiological Systems' },
          { id: 'cardiovascular', label: 'Cardiovascular (Heart & Arteries)' },
          { id: 'respiratory', label: 'Respiratory (Lungs & O₂ Loop)' },
          { id: 'neuro', label: 'Neuro-Ocular & Brain (SANS)' },
          { id: 'musculoskeletal', label: 'Musculoskeletal (Spine & ARED)' },
          { id: 'metabolic', label: 'Metabolic & Digestive' },
        ].map((sys) => (
          <button
            key={sys.id}
            onClick={() => setActiveSystemFilter(sys.id)}
            className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all border ${
              activeSystemFilter === sys.id
                ? 'bg-primary text-white border-primary shadow-soft'
                : 'bg-surface hover:bg-canvas text-muted hover:text-ink border-border shadow-sm'
            }`}
          >
            {sys.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* SVG INTERACTIVE HUMAN BODY FIGURE (col-span-6) */}
        <div className="lg:col-span-6 bg-surface rounded-3xl p-6 border border-border shadow-soft flex flex-col items-center justify-between relative min-h-[580px] overflow-hidden">
          {/* Subtle scanning laser line effect */}
          <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-mint to-transparent opacity-40 animate-pulse pointer-events-none top-8" />

          <div className="w-full flex items-center justify-between z-10 mb-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-status-green animate-ping" />
              <span className="text-[11px] font-bold text-primary uppercase tracking-wider">
                Active Holographic Sensor Mesh
              </span>
            </div>
            <InfoTooltip text="Interactive 3D anatomical projection with multi-sensor telemetry hotspots." />
          </div>

          {/* SVG Container */}
          <div className="relative w-80 h-[450px] flex items-center justify-center my-2">
            <svg
              viewBox="0 0 200 400"
              className="w-full h-full filter drop-shadow-md select-none"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Silhouette outline */}
              {/* Head */}
              <circle
                cx="100"
                cy="42"
                r="26"
                onClick={() => setSelectedRegionKey('brain')}
                className={`cursor-pointer transition-all ${
                  selectedRegionKey === 'brain'
                    ? 'fill-mint stroke-primary stroke-[3]'
                    : 'fill-panel hover:fill-mint-light stroke-border stroke-2'
                }`}
              />

              {/* Eyes region */}
              <ellipse
                cx="100"
                cy="40"
                rx="14"
                ry="6"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedRegionKey('eyes');
                }}
                className={`cursor-pointer transition-all ${
                  selectedRegionKey === 'eyes'
                    ? 'fill-primary stroke-white stroke-2'
                    : 'fill-primary/60 hover:fill-primary'
                }`}
              />

              {/* Neck & Torso background */}
              <path
                d="M86 68 L114 68 L128 95 L124 195 L76 195 L72 95 Z"
                className="fill-panel stroke-border stroke-2"
              />

              {/* Heart Region */}
              <circle
                cx="108"
                cy="114"
                r="15"
                onClick={() => setSelectedRegionKey('heart')}
                className={`cursor-pointer transition-all ${
                  selectedRegionKey === 'heart'
                    ? 'fill-rose-500 stroke-white stroke-[2.5] shadow-lg'
                    : latestReadings.heart_rate?.status === 'red'
                    ? 'fill-status-red animate-pulse'
                    : 'fill-rose-400 hover:fill-rose-500'
                }`}
              />

              {/* Lungs Region */}
              <path
                d="M84 102 C80 118 80 135 90 145 C98 145 98 120 95 102 Z"
                onClick={() => setSelectedRegionKey('lungs')}
                className={`cursor-pointer transition-all ${
                  selectedRegionKey === 'lungs'
                    ? 'fill-mint stroke-primary stroke-2'
                    : latestReadings.spo2?.status === 'red'
                    ? 'fill-status-red animate-pulse'
                    : 'fill-mint/70 hover:fill-mint'
                }`}
              />
              <path
                d="M116 102 C120 118 120 135 110 145 C102 145 102 120 105 102 Z"
                onClick={() => setSelectedRegionKey('lungs')}
                className={`cursor-pointer transition-all ${
                  selectedRegionKey === 'lungs'
                    ? 'fill-mint stroke-primary stroke-2'
                    : latestReadings.spo2?.status === 'red'
                    ? 'fill-status-red animate-pulse'
                    : 'fill-mint/70 hover:fill-mint'
                }`}
              />

              {/* Gut / Abdomen */}
              <ellipse
                cx="100"
                cy="164"
                rx="19"
                ry="14"
                onClick={() => setSelectedRegionKey('gut')}
                className={`cursor-pointer transition-all ${
                  selectedRegionKey === 'gut'
                    ? 'fill-amber-400 stroke-amber-700 stroke-2'
                    : 'fill-amber-200 hover:fill-amber-300'
                }`}
              />

              {/* Arms / Musculoskeletal */}
              <path
                d="M72 95 L44 155 L36 215 L46 217 L54 168 L76 115 Z"
                onClick={() => setSelectedRegionKey('muscles')}
                className={`cursor-pointer transition-all ${
                  selectedRegionKey === 'muscles' ? 'fill-primary/80 stroke-primary stroke-2' : 'fill-panel hover:fill-mint-light stroke-border stroke-1'
                }`}
              />
              <path
                d="M128 95 L156 155 L164 215 L154 217 L146 168 L124 115 Z"
                onClick={() => setSelectedRegionKey('muscles')}
                className={`cursor-pointer transition-all ${
                  selectedRegionKey === 'muscles' ? 'fill-primary/80 stroke-primary stroke-2' : 'fill-panel hover:fill-mint-light stroke-border stroke-1'
                }`}
              />

              {/* Spine Line */}
              <line
                x1="100"
                y1="70"
                x2="100"
                y2="195"
                strokeWidth="4"
                strokeDasharray="4 2"
                onClick={() => setSelectedRegionKey('bones')}
                className={`cursor-pointer transition-all ${
                  selectedRegionKey === 'bones' ? 'stroke-primary stroke-[5]' : 'stroke-muted/60 hover:stroke-primary'
                }`}
              />

              {/* Pelvis & Legs */}
              <path
                d="M78 195 L68 280 L62 370 L78 370 L86 285 L94 198 Z"
                onClick={() => setSelectedRegionKey('bones')}
                className={`cursor-pointer transition-all ${
                  selectedRegionKey === 'bones' ? 'fill-mint/80' : 'fill-panel hover:fill-mint-light stroke-border stroke-1'
                }`}
              />
              <path
                d="M122 195 L132 280 L138 370 L122 370 L114 285 L106 198 Z"
                onClick={() => setSelectedRegionKey('bones')}
                className={`cursor-pointer transition-all ${
                  selectedRegionKey === 'bones' ? 'fill-mint/80' : 'fill-panel hover:fill-mint-light stroke-border stroke-1'
                }`}
              />

              {/* Interactive glowing hotspot indicators */}
              {Object.values(anatomicalRegions).map((reg) => {
                const isSelected = selectedRegionKey === reg.id;
                const mList = reg.getLiveMetrics();
                const hasRed = mList.some((m) => m.status === 'red');
                const hasOrange = mList.some((m) => m.status === 'orange');
                const pulseColor = hasRed ? '#E5484D' : hasOrange ? '#F2A33A' : '#2FA36B';

                return (
                  <g key={reg.id} onClick={() => setSelectedRegionKey(reg.id)} className="cursor-pointer">
                    <circle
                      cx={reg.coordinates.x}
                      cy={reg.coordinates.y}
                      r={isSelected ? 10 : 6}
                      fill={pulseColor}
                      stroke="#FFFFFF"
                      strokeWidth={isSelected ? 2.5 : 1.5}
                      className="transition-all duration-200"
                    />
                    {isSelected && (
                      <circle
                        cx={reg.coordinates.x}
                        cy={reg.coordinates.y}
                        r={16}
                        fill="none"
                        stroke={pulseColor}
                        strokeWidth="1.5"
                        strokeDasharray="2 2"
                        className="animate-spin"
                      />
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Region selector pills */}
          <div className="flex flex-wrap justify-center gap-1.5 mt-2 z-10">
            {visibleRegions.map((reg) => {
              const isSelected = selectedRegionKey === reg.id;
              return (
                <button
                  key={reg.id}
                  onClick={() => setSelectedRegionKey(reg.id)}
                  className={`text-[11px] px-3 py-1 rounded-xl capitalize font-semibold transition-all ${
                    isSelected
                      ? 'bg-primary text-white shadow-soft ring-2 ring-mint/60'
                      : 'bg-canvas text-muted hover:text-ink border border-border'
                  }`}
                >
                  {reg.label.split(' ')[0]}
                </button>
              );
            })}
          </div>
        </div>

        {/* SIDE DETAIL PANEL WITH ACTION STEPS & HRP EVIDENCE (col-span-6) */}
        <div className="lg:col-span-6 bg-surface rounded-3xl p-6 border border-border shadow-soft flex flex-col justify-between">
          <div>
            {/* Region Title & Status Badge */}
            <div className="flex items-start justify-between pb-4 border-b border-border">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary">Anatomical System Target</span>
                  {!currentRisk.verified && (
                    <span className="text-[10px] bg-sand text-ink px-2 py-0.5 rounded-full font-medium border border-amber-300">
                      Standard Reference
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-bold text-ink mt-0.5">{currentRegion.label}</h3>
                <p className="text-xs text-muted">{currentRegion.organ}</p>
              </div>

              {/* Status Chip */}
              <div
                className={`px-3 py-1 rounded-full text-xs font-bold capitalize flex items-center gap-1.5 border shadow-sm ${
                  overallRegionStatus === 'green'
                    ? 'bg-emerald-50 text-status-green border-emerald-200'
                    : overallRegionStatus === 'orange'
                    ? 'bg-amber-50 text-status-orange border-amber-200'
                    : 'bg-rose-50 text-status-red border-rose-200 animate-pulse'
                }`}
              >
                {overallRegionStatus === 'green' ? (
                  <ShieldCheck className="w-3.5 h-3.5" />
                ) : overallRegionStatus === 'orange' ? (
                  <AlertTriangle className="w-3.5 h-3.5" />
                ) : (
                  <AlertOctagon className="w-3.5 h-3.5" />
                )}
                <span>{overallRegionStatus === 'green' ? 'Nominal' : overallRegionStatus === 'orange' ? 'Attention' : 'Critical'}</span>
              </div>
            </div>

            <div className="my-5 space-y-4 text-xs">
              {/* Associated Live Indicators */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-ink uppercase tracking-wider text-[11px]">Live Telemetry Indicators</h4>
                  <span className="text-[10px] text-muted">Continuous biometric stream</span>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  {liveMetrics.map((m, i) => (
                    <div key={i} className="p-3 rounded-2xl bg-canvas border border-border flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-muted block line-clamp-1">{m.name}</span>
                        <div className="flex items-baseline gap-1 mt-0.5">
                          <span className="text-base font-extrabold text-ink">{m.value}</span>
                          {m.unit && <span className="text-[10px] text-muted font-normal">{m.unit}</span>}
                        </div>
                      </div>
                      <span
                        className={`w-3 h-3 rounded-full ${
                          m.status === 'green'
                            ? 'bg-status-green'
                            : m.status === 'orange'
                            ? 'bg-status-orange'
                            : 'bg-status-red animate-ping'
                        }`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* NASA HRP Risk Detail Card */}
              <div className="p-4 rounded-2xl bg-panel/70 border border-border">
                <div className="flex items-center gap-1.5 text-primary font-bold text-xs mb-1">
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>NASA Human Research Program: {currentRisk.name}</span>
                </div>
                <p className="text-muted leading-relaxed text-[11px] mb-2">{currentRisk.summary}</p>
                <div className="p-2.5 rounded-xl bg-surface/90 border border-border/80">
                  <span className="text-[10px] font-bold text-ink uppercase tracking-wider block mb-0.5">Spaceflight Mechanism</span>
                  <p className="text-ink text-[11px] font-medium leading-relaxed">{currentRisk.why_it_matters_in_space}</p>
                </div>
              </div>

              {/* Interactive Countermeasure Action Checklist */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-ink uppercase tracking-wider text-[11px]">
                    Prescribed Countermeasure Checklist
                  </h4>
                  <span className="text-[10px] text-primary font-medium">Click to check off</span>
                </div>

                <div className="space-y-1.5">
                  {currentRisk.actions.map((act, i) => {
                    const isDone = !!completedActions[`${selectedRegionKey}-${i}`];
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => toggleAction(i)}
                        className={`w-full flex items-start gap-2.5 p-2.5 rounded-xl border text-left transition-all ${
                          isDone
                            ? 'bg-emerald-50/60 border-emerald-200 text-status-green font-medium'
                            : 'bg-canvas hover:bg-panel border-border text-ink'
                        }`}
                      >
                        <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${isDone ? 'text-status-green' : 'text-muted'}`} />
                        <span className={`text-[11px] leading-tight ${isDone ? 'line-through opacity-80' : ''}`}>
                          {act}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Quick links & action buttons */}
          <div className="pt-3 border-t border-border flex gap-3">
            <button
              onClick={playAudioBriefing}
              className="flex-1 py-2.5 rounded-xl bg-panel hover:bg-canvas text-primary text-xs font-semibold border border-border transition-colors flex items-center justify-center gap-1.5"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Listen Protocol</span>
            </button>

            <a
              href={currentRisk.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-white text-xs font-semibold shadow-soft hover:bg-primary-hover transition-colors"
            >
              <span>NASA HRP Evidence</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
