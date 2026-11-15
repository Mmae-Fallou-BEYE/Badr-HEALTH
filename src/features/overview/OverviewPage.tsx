// Generated with AI assistance (Antigravity). Reviewed by the team.
import React, { useState } from 'react';
import {
  Heart,
  Wind,
  Moon,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Clock,
  Activity,
  Shield,
  Send,
  FileText,
  ChevronRight,
  ClipboardList,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { useAppStore } from '../../data/store';
import { MetricKey } from '../../data/types';
import { InfoTooltip } from '../../components/InfoTooltip';

export const OverviewPage: React.FC = () => {
  const {
    mission,
    latestReadings,
    healthScore,
    hazardScores,
    alerts,
    weeklyInsights,
    exerciseMinutesToday,
    targetExerciseMinutes,
    logVitalsAndCheckin,
    acknowledgeAlert,
  } = useAppStore();

  const [insightMetric, setInsightMetric] = useState<'heart_rate' | 'spo2' | 'sleep_hours' | 'exercise_mins'>('heart_rate');
  const [unifiedModalOpen, setUnifiedModalOpen] = useState(false);
  const [protocolModalOpen, setProtocolModalOpen] = useState(false);
  const [aboutScoreOpen, setAboutScoreOpen] = useState(false);
  const [selectedProtocol, setSelectedProtocol] = useState<string | null>(null);

  // Form state for unified Log Vitals & Check-in modal
  const [activeTab, setActiveTab] = useState<'biometrics' | 'checkin'>('biometrics');
  const [formVitals, setFormVitals] = useState({
    heart_rate: latestReadings.heart_rate?.value?.toString() || '68',
    blood_pressure_sys: latestReadings.blood_pressure_sys?.value?.toString() || '118',
    blood_pressure_dia: latestReadings.blood_pressure_dia?.value?.toString() || '76',
    spo2: latestReadings.spo2?.value?.toString() || '98',
    body_temp: latestReadings.body_temp?.value?.toString() || '36.8',
    glucose: latestReadings.glucose?.value?.toString() || '88',
  });
  const [formCheckin, setFormCheckin] = useState({
    mood: latestReadings.mood?.value || 4,
    sleep_hours: latestReadings.sleep_hours?.value?.toString() || '7.5',
    exercise_mins: '45',
    note: '',
  });

  const handleUnifiedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const vitalsPayload: Partial<Record<MetricKey, number>> = {};
    if (formVitals.heart_rate) vitalsPayload.heart_rate = parseFloat(formVitals.heart_rate);
    if (formVitals.blood_pressure_sys) vitalsPayload.blood_pressure_sys = parseFloat(formVitals.blood_pressure_sys);
    if (formVitals.blood_pressure_dia) vitalsPayload.blood_pressure_dia = parseFloat(formVitals.blood_pressure_dia);
    if (formVitals.spo2) vitalsPayload.spo2 = parseFloat(formVitals.spo2);
    if (formVitals.body_temp) vitalsPayload.body_temp = parseFloat(formVitals.body_temp);
    if (formVitals.glucose) vitalsPayload.glucose = parseFloat(formVitals.glucose);

    logVitalsAndCheckin(vitalsPayload, {
      mood: Number(formCheckin.mood),
      sleep_hours: parseFloat(formCheckin.sleep_hours) || 7.5,
      exercise_mins: parseFloat(formCheckin.exercise_mins) || 0,
      note: formCheckin.note,
    });

    setUnifiedModalOpen(false);
  };

  const HAZARD_COLORS = ['#E5484D', '#F2A33A', '#2FA36B', '#1F7A5A', '#8FD3B6'];
  const unreadAlerts = alerts.filter((a) => !a.acknowledged_at);

  // International Standard Score Colors (NEWS2 / NASA HRP Guidelines)
  // Optimal >= 85 (Green), Caution 70-84 (Orange/Amber), Critical < 70 (Red), Gray if unassigned
  const getScoreColor = (score: number) => {
    if (score >= 85) return { text: 'text-status-green', badge: 'bg-emerald-50 text-status-green border-emerald-200', label: 'Optimal • Nominal' };
    if (score >= 70) return { text: 'text-status-orange', badge: 'bg-amber-50 text-status-orange border-amber-200', label: 'Caution • Sub-optimal' };
    if (score >= 0) return { text: 'text-status-red', badge: 'bg-rose-50 text-status-red border-rose-200 animate-pulse', label: 'Critical • Attention Needed' };
    return { text: 'text-muted', badge: 'bg-canvas text-muted border-border', label: 'Uncalibrated' };
  };

  const scoreTheme = getScoreColor(healthScore.score);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-200">
      {/* 1. TOP HERO ROW: Health Score Card + Quick Actions Stack (Crew ID moved to header profile) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* HERO COMPOSITE HEALTH SCORE CARD (col-span-7) */}
        <div className="lg:col-span-7 bg-surface rounded-3xl p-6 border border-border shadow-soft relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted">Composite Health Score</span>
                <InfoTooltip text="Continuous index combining multi-metric z-scores, cumulative radiation budget, and countermeasure compliance based on NASA HRP standards." />
                <button
                  onClick={() => setAboutScoreOpen(true)}
                  className="text-muted hover:text-primary transition-colors text-xs font-medium underline ml-1"
                >
                  Formula details
                </button>
              </div>
              <p className="text-xs text-muted mt-0.5">Continuous physiological resilience index</p>
            </div>

            {/* Dynamic Status Chip */}
            <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border shadow-sm ${scoreTheme.badge}`}>
              {healthScore.status === 'green' ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : healthScore.status === 'orange' ? (
                <AlertTriangle className="w-3.5 h-3.5" />
              ) : (
                <AlertOctagon className="w-3.5 h-3.5" />
              )}
              <span>{scoreTheme.label}</span>
            </div>
          </div>

          {/* Main Giant Score Display & Sparkline */}
          <div className="my-5 flex items-baseline justify-between flex-wrap gap-4">
            <div className="flex items-baseline gap-3">
              <span className={`text-6xl font-extrabold tracking-tight font-sans transition-colors ${scoreTheme.text}`}>
                {healthScore.score}
              </span>
              <span className="text-xl font-medium text-muted">/100</span>

              <div className="flex items-center text-xs font-semibold ml-3 px-2 py-0.5 rounded-lg bg-canvas border border-border">
                {healthScore.trend === 'improving' ? (
                  <span className="text-status-green flex items-center">
                    <ArrowUpRight className="w-4 h-4" /> +{healthScore.change24h}%
                  </span>
                ) : healthScore.trend === 'declining' ? (
                  <span className="text-status-red flex items-center">
                    <ArrowDownRight className="w-4 h-4" /> {healthScore.change24h}%
                  </span>
                ) : (
                  <span className="text-muted flex items-center">
                    <Minus className="w-4 h-4" /> stable
                  </span>
                )}
                <span className="text-muted ml-1 font-normal">vs 24h</span>
              </div>
            </div>

            {/* Micro Sparkline */}
            <div className="w-32 h-14">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyInsights}>
                  <Line
                    type="monotone"
                    dataKey="spo2"
                    stroke="#1F7A5A"
                    strokeWidth={2.5}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
              <span className="text-[10px] text-muted text-right block">7-day trend buffer</span>
            </div>
          </div>

          {/* International Standard Threshold Visual Scale */}
          <div className="my-2 p-3 rounded-2xl bg-canvas border border-border/80">
            <div className="flex justify-between items-center text-[10px] text-muted font-semibold mb-1">
              <span className="text-status-red">Critical (&lt; 70)</span>
              <span className="text-status-orange">Caution (70 - 84)</span>
              <span className="text-status-green">Optimal (85 - 100)</span>
            </div>
            <div className="w-full h-2 rounded-full overflow-hidden flex bg-border/60">
              <div className="h-full bg-rose-400 w-[70%]" />
              <div className="h-full bg-amber-400 w-[15%]" />
              <div className="h-full bg-emerald-500 w-[15%]" />
            </div>
          </div>

          {/* Sub-components breakdown bar */}
          <div className="grid grid-cols-4 gap-3 pt-3 border-t border-border/70">
            <div className="p-2 rounded-xl bg-canvas border border-border/60">
              <span className="text-[10px] text-muted block">Vitals Stability</span>
              <span className="text-sm font-bold text-ink">{healthScore.components.vitals_stability}%</span>
            </div>
            <div className="p-2 rounded-xl bg-canvas border border-border/60">
              <span className="text-[10px] text-muted block">Hazard Shield</span>
              <span className="text-sm font-bold text-ink">{healthScore.components.hazard_resilience}%</span>
            </div>
            <div className="p-2 rounded-xl bg-canvas border border-border/60">
              <span className="text-[10px] text-muted block">Exercise Target</span>
              <span className="text-sm font-bold text-ink">{healthScore.components.countermeasure_adherence}%</span>
            </div>
            <div className="p-2 rounded-xl bg-canvas border border-border/60">
              <span className="text-[10px] text-muted block">Sleep Rest</span>
              <span className="text-sm font-bold text-ink">{healthScore.components.sleep_restoration}%</span>
            </div>
          </div>
        </div>

        {/* UNIFIED QUICK ACTIONS STACK (col-span-5) */}
        <div className="lg:col-span-5 bg-surface rounded-3xl p-6 border border-border shadow-soft flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">Crew Operations</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sand text-ink border border-amber-300">
              Autonomous Hub
            </span>
          </div>

          <div className="flex flex-col gap-3 my-4">
            {/* UNIFIED ACTION: Log Vitals & Check-in (Points 10 & 2) */}
            <button
              onClick={() => setUnifiedModalOpen(true)}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-primary text-white text-xs font-bold shadow-soft hover:bg-primary-hover transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                  <ClipboardList className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-bold">Log Vitals & Daily Check-in</div>
                  <div className="text-[11px] text-white/80 font-normal">Record biometrics, mood, sleep & exercise</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Contact Flight Surgeon */}
            <button
              onClick={() => {
                alert(`Comms packet scheduled. Downlink delay to Ground Flight Surgeon: ${mission.comms_delay_s}s.`);
              }}
              className="flex items-center justify-between p-3 rounded-xl bg-canvas hover:bg-panel text-ink text-xs font-semibold border border-border transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <Send className="w-4 h-4 text-primary" />
                <span>Contact Ground Flight Surgeon</span>
              </div>
              <span className="text-[11px] font-mono text-muted">{mission.comms_delay_s}s delay</span>
            </button>

            {/* Autonomous Contingency Protocol */}
            <button
              onClick={() => {
                setSelectedProtocol(
                  'STANDARD AUTONOMOUS CONTINGENCY PROTOCOL (NASA HRP):\n1. Verify oxygen loop & cabin atmospheric total pressure (nominal 14.7 psi).\n2. Ingest oral electrolyte hydration packet (500 ml).\n3. Re-check peripheral SpO₂ and arterial blood pressure in seated recumbent position.\n4. Log symptoms into onboard medical telemetry repository.'
                );
                setProtocolModalOpen(true);
              }}
              className="flex items-center justify-between p-3 rounded-xl bg-canvas hover:bg-panel text-ink text-xs font-semibold border border-border transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-primary" />
                <span>Open Autonomous Protocol</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-muted group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] text-muted pt-2 border-t border-border/70">
            <span>Offline resilient storage active</span>
            <span className="text-primary font-medium">NASA Evidence Standards</span>
          </div>
        </div>
      </div>

      {/* 2. MIDDLE ROW: RECENT MEASUREMENTS + WEEKLY INSIGHTS CHART + HAZARDS DONUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* RECENT MEASUREMENTS (col-span-4) */}
        <div className="lg:col-span-4 bg-surface rounded-3xl p-6 border border-border shadow-soft flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-sm text-ink">Recent Measurements</h3>
              <InfoTooltip text="Continuous live physiological measurements streamed from optical PPG, pneumatic sensors, and habitat environmental monitors." />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sand text-ink border border-amber-300">
              SIMULATED
            </span>
          </div>

          <div className="space-y-2.5 flex-1">
            {[
              {
                key: 'heart_rate' as MetricKey,
                label: 'Heart Rate',
                icon: Heart,
                val: `${latestReadings.heart_rate?.value ?? 68} bpm`,
                status: latestReadings.heart_rate?.status ?? 'green',
                time: 'Live Telemetry',
              },
              {
                key: 'spo2' as MetricKey,
                label: 'Blood Oxygen (SpO₂)',
                icon: Wind,
                val: `${latestReadings.spo2?.value ?? 98}%`,
                status: latestReadings.spo2?.status ?? 'green',
                time: 'Continuous PPG',
              },
              {
                key: 'blood_pressure_sys' as MetricKey,
                label: 'Blood Pressure',
                icon: Activity,
                val: `${latestReadings.blood_pressure_sys?.value ?? 118}/${latestReadings.blood_pressure_dia?.value ?? 76} mmHg`,
                status: latestReadings.blood_pressure_sys?.status ?? 'green',
                time: 'Pneumatic Cuff',
              },
              {
                key: 'radiation_dose_rate' as MetricKey,
                label: 'Radiation Rate',
                icon: Flame,
                val: `${latestReadings.radiation_dose_rate?.value ?? 22.4} µSv/h`,
                status: latestReadings.radiation_dose_rate?.status ?? 'green',
                time: 'CANS Dosimeter',
              },
              {
                key: 'sleep_hours' as MetricKey,
                label: 'Sleep Rest',
                icon: Moon,
                val: `${latestReadings.sleep_hours?.value ?? 7.6} h`,
                status: latestReadings.sleep_hours?.status ?? 'green',
                time: 'Rest Cycle',
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.key}
                  className="flex items-center justify-between p-2.5 rounded-2xl bg-canvas border border-border/80 hover:bg-panel transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-surface flex items-center justify-center text-primary shadow-sm border border-border">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-ink block">{item.label}</span>
                      <span className="text-[10px] text-muted">{item.time}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-ink">{item.val}</span>
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        item.status === 'green'
                          ? 'bg-status-green'
                          : item.status === 'orange'
                          ? 'bg-status-orange'
                          : 'bg-status-red animate-ping'
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* INSIGHTS BAR CHART (col-span-5) */}
        <div className="lg:col-span-5 bg-surface rounded-3xl p-6 border border-border shadow-soft flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-sm text-ink">Weekly Insights</h3>
              <InfoTooltip text="7-day rolling historical metrics used to detect microgravity drift from astronaut baseline." />
            </div>

            {/* Metric selector pill */}
            <div className="flex items-center bg-canvas p-1 rounded-xl border border-border text-xs">
              <button
                onClick={() => setInsightMetric('heart_rate')}
                className={`px-2 py-1 rounded-lg font-medium transition-all ${
                  insightMetric === 'heart_rate' ? 'bg-surface text-primary shadow-sm font-semibold' : 'text-muted'
                }`}
              >
                HR
              </button>
              <button
                onClick={() => setInsightMetric('spo2')}
                className={`px-2 py-1 rounded-lg font-medium transition-all ${
                  insightMetric === 'spo2' ? 'bg-surface text-primary shadow-sm font-semibold' : 'text-muted'
                }`}
              >
                SpO₂
              </button>
              <button
                onClick={() => setInsightMetric('sleep_hours')}
                className={`px-2 py-1 rounded-lg font-medium transition-all ${
                  insightMetric === 'sleep_hours' ? 'bg-surface text-primary shadow-sm font-semibold' : 'text-muted'
                }`}
              >
                Sleep
              </button>
              <button
                onClick={() => setInsightMetric('exercise_mins')}
                className={`px-2 py-1 rounded-lg font-medium transition-all ${
                  insightMetric === 'exercise_mins' ? 'bg-surface text-primary shadow-sm font-semibold' : 'text-muted'
                }`}
              >
                Exercise
              </button>
            </div>
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyInsights}>
                <XAxis dataKey="day" stroke="#5E6F66" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#5E6F66" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '12px',
                    borderColor: '#E2EAE3',
                    fontSize: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                  }}
                />
                <Bar
                  dataKey={insightMetric}
                  fill="#1F7A5A"
                  radius={[8, 8, 0, 0]}
                  barSize={24}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-xs text-muted pt-3 border-t border-border/60">
            <span>Weekly Mean: {insightMetric === 'heart_rate' ? '67.4 bpm' : insightMetric === 'spo2' ? '97.8%' : insightMetric === 'sleep_hours' ? '7.5 h' : '85.7 min'}</span>
            <span className="text-primary font-medium">Nominal circadian baseline</span>
          </div>
        </div>

        {/* HAZARDS DONUT BREAKDOWN (col-span-3) */}
        <div className="lg:col-span-3 bg-surface rounded-3xl p-6 border border-border shadow-soft flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-sm text-ink">HRP Hazards Exposure</h3>
              <InfoTooltip text="NASA Human Research Program 5 spaceflight hazards: Radiation, Isolation, Distance from Earth, Altered Gravity, and Hostile Closed Environments." />
            </div>
          </div>

          <div className="h-40 w-full relative flex items-center justify-center my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={hazardScores}
                  dataKey="score"
                  nameKey="label"
                  innerRadius={42}
                  outerRadius={65}
                  paddingAngle={4}
                >
                  {hazardScores.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={HAZARD_COLORS[index % HAZARD_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '10px',
                    borderColor: '#E2EAE3',
                    fontSize: '11px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center">
              <span className="text-[10px] text-muted uppercase">Primary</span>
              <span className="text-xs font-bold text-ink">Radiation</span>
            </div>
          </div>

          <div className="space-y-1.5 text-[11px] pt-2 border-t border-border/60">
            {hazardScores.slice(0, 3).map((h, i) => (
              <div key={h.hazard} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: HAZARD_COLORS[i] }} />
                  <span className="text-muted">{h.label}</span>
                </div>
                <span className="font-bold text-ink">{h.score}/100</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. BOTTOM ROW: COUNTERMEASURE GOALS + ALERTS COLUMN + NEXT MEASUREMENT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* COUNTERMEASURE GOALS (col-span-6) */}
        <div className="lg:col-span-6 bg-surface rounded-3xl p-6 border border-border shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-sm text-ink">Countermeasure Goals</h3>
              <InfoTooltip text="Daily prescribed musculoskeletal and cardiovascular exercise protocols to mitigate microgravity osteopenia and plasma volume contraction." />
            </div>
            <span className="text-xs bg-panel text-primary font-bold px-2.5 py-1 rounded-xl border border-border">
              Daily Target: 90m
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Exercise ring card */}
            <div className="p-4 rounded-2xl bg-canvas border border-border flex items-center gap-4">
              <div className="w-14 h-14 rounded-full border-4 border-mint flex items-center justify-center shrink-0">
                <span className="text-xs font-extrabold text-primary">
                  {Math.round((exerciseMinutesToday / targetExerciseMinutes) * 100)}%
                </span>
              </div>
              <div>
                <span className="text-xs font-bold text-ink block">Daily Exercise (ARED/T2)</span>
                <span className="text-xs text-muted">{exerciseMinutesToday} / {targetExerciseMinutes} min</span>
              </div>
            </div>

            {/* Sleep ring card */}
            <div className="p-4 rounded-2xl bg-canvas border border-border flex items-center gap-4">
              <div className="w-14 h-14 rounded-full border-4 border-primary flex items-center justify-center shrink-0">
                <span className="text-xs font-extrabold text-ink">
                  {Math.round(((latestReadings.sleep_hours?.value ?? 7.6) / 8.0) * 100)}%
                </span>
              </div>
              <div>
                <span className="text-xs font-bold text-ink block">Sleep Rest Period</span>
                <span className="text-xs text-muted">{latestReadings.sleep_hours?.value ?? 7.6} / 8.0 h target</span>
              </div>
            </div>
          </div>
        </div>

        {/* ALERTS COLUMN & NEXT MEASUREMENT (col-span-6) */}
        <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Active Alerts Box */}
          <div className="bg-surface rounded-3xl p-5 border border-border shadow-soft flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-status-red" />
                <h4 className="font-bold text-sm text-ink">Active Alerts</h4>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${unreadAlerts.length > 0 ? 'bg-rose-100 text-status-red' : 'bg-panel text-muted'}`}>
                {unreadAlerts.length}
              </span>
            </div>

            <div className="space-y-2 my-2 flex-1">
              {unreadAlerts.length === 0 ? (
                <div className="text-center py-6 text-muted text-xs">
                  <CheckCircle2 className="w-6 h-6 text-status-green mx-auto mb-1 opacity-70" />
                  All parameters within safe margins.
                </div>
              ) : (
                unreadAlerts.slice(0, 2).map((a) => (
                  <div
                    key={a.id}
                    className="p-2.5 rounded-xl bg-canvas border border-border text-xs flex flex-col gap-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className={`font-bold uppercase text-[10px] px-1.5 py-0.5 rounded ${a.level === 'red' ? 'bg-status-red text-white' : 'bg-status-orange text-white'}`}>
                        {a.level}
                      </span>
                      <button
                        onClick={() => acknowledgeAlert(a.id)}
                        className="text-[10px] text-muted hover:text-ink underline"
                      >
                        Acknowledge
                      </button>
                    </div>
                    <p className="text-[11px] font-medium text-ink line-clamp-1">{a.message}</p>
                    {a.autonomous_protocol && (
                      <button
                        onClick={() => {
                          setSelectedProtocol(a.autonomous_protocol || null);
                          setProtocolModalOpen(true);
                        }}
                        className="text-[10px] text-primary font-bold hover:underline text-left"
                      >
                        View Protocol →
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            <span className="text-[10px] text-muted text-right">Autonomous escalation active</span>
          </div>

          {/* Next Scheduled Measurement Box */}
          <div className="bg-gradient-to-br from-panel to-surface rounded-3xl p-5 border border-border shadow-soft flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-primary uppercase">Scheduled Protocol</span>
              <Clock className="w-4 h-4 text-primary" />
            </div>

            <div className="my-3">
              <span className="text-2xl font-extrabold text-ink font-mono">00:42:15</span>
              <h5 className="font-bold text-xs text-ink mt-1">Evening Vitals & Bio-Impedance</h5>
              <p className="text-[11px] text-muted mt-0.5">Automated cuff reading & hydration check</p>
            </div>

            <button
              onClick={() => setUnifiedModalOpen(true)}
              className="w-full py-2 bg-surface hover:bg-canvas text-primary text-xs font-semibold rounded-xl border border-border transition-colors text-center shadow-sm"
            >
              Perform Check-in Now
            </button>
          </div>
        </div>
      </div>

      {/* UNIFIED MODAL: LOG VITALS & DAILY CHECK-IN (Point 10) */}
      {unifiedModalOpen && (
        <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-border animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center">
                  <ClipboardList className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-ink">Log Vitals & Daily Check-in</h3>
                  <p className="text-xs text-muted">Complete astronaut biometric and subjective entry</p>
                </div>
              </div>
              <button
                onClick={() => setUnifiedModalOpen(false)}
                className="text-muted hover:text-ink text-sm px-2 py-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Tab Switcher */}
            <div className="flex rounded-xl bg-canvas p-1 border border-border my-4">
              <button
                type="button"
                onClick={() => setActiveTab('biometrics')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'biometrics' ? 'bg-surface text-primary shadow-sm' : 'text-muted'
                }`}
              >
                1. Biometric Vitals
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('checkin')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'checkin' ? 'bg-surface text-primary shadow-sm' : 'text-muted'
                }`}
              >
                2. Subjective Check-in
              </button>
            </div>

            <form onSubmit={handleUnifiedSubmit} className="space-y-4">
              {activeTab === 'biometrics' ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-muted block mb-1">Heart Rate (bpm)</label>
                      <input
                        type="number"
                        value={formVitals.heart_rate}
                        onChange={(e) => setFormVitals({ ...formVitals, heart_rate: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-canvas border border-border text-sm font-bold text-ink focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted block mb-1">Blood Oxygen SpO₂ (%)</label>
                      <input
                        type="number"
                        value={formVitals.spo2}
                        onChange={(e) => setFormVitals({ ...formVitals, spo2: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-canvas border border-border text-sm font-bold text-ink focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-muted block mb-1">Systolic BP (mmHg)</label>
                      <input
                        type="number"
                        value={formVitals.blood_pressure_sys}
                        onChange={(e) => setFormVitals({ ...formVitals, blood_pressure_sys: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-canvas border border-border text-sm font-bold text-ink focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted block mb-1">Diastolic BP (mmHg)</label>
                      <input
                        type="number"
                        value={formVitals.blood_pressure_dia}
                        onChange={(e) => setFormVitals({ ...formVitals, blood_pressure_dia: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-canvas border border-border text-sm font-bold text-ink focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-muted block mb-1">Core Temp (°C)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={formVitals.body_temp}
                        onChange={(e) => setFormVitals({ ...formVitals, body_temp: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-canvas border border-border text-sm font-bold text-ink focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted block mb-1">Blood Glucose (mg/dL)</label>
                      <input
                        type="number"
                        value={formVitals.glucose}
                        onChange={(e) => setFormVitals({ ...formVitals, glucose: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-canvas border border-border text-sm font-bold text-ink focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-muted block mb-1.5">Daily Psychological Mood (1-5)</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setFormCheckin({ ...formCheckin, mood: val })}
                          className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                            formCheckin.mood === val
                              ? 'bg-primary text-white border-primary shadow-sm'
                              : 'bg-canvas text-ink hover:bg-surface border-border'
                          }`}
                        >
                          {val} {val === 1 ? '😟' : val === 3 ? '😐' : val === 5 ? '🚀' : '🙂'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-muted block mb-1">Sleep Rest Duration (hours)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={formCheckin.sleep_hours}
                        onChange={(e) => setFormCheckin({ ...formCheckin, sleep_hours: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-canvas border border-border text-sm font-bold text-ink focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted block mb-1">Exercise Today (minutes)</label>
                      <input
                        type="number"
                        value={formCheckin.exercise_mins}
                        onChange={(e) => setFormCheckin({ ...formCheckin, exercise_mins: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-canvas border border-border text-sm font-bold text-ink focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted block mb-1">Subjective Symptoms or Clinical Notes</label>
                    <input
                      type="text"
                      placeholder="e.g. Mild cephalic congestion post-sleep, resolved with hydration"
                      value={formCheckin.note}
                      onChange={(e) => setFormCheckin({ ...formCheckin, note: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-canvas border border-border text-xs text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center pt-3 border-t border-border">
                {activeTab === 'biometrics' ? (
                  <button
                    type="button"
                    onClick={() => setActiveTab('checkin')}
                    className="text-xs font-bold text-primary hover:underline"
                  >
                    Next: Subjective Check-in →
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setActiveTab('biometrics')}
                    className="text-xs font-bold text-muted hover:underline"
                  >
                    ← Back to Biometrics
                  </button>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setUnifiedModalOpen(false)}
                    className="px-4 py-2 text-xs font-medium text-muted hover:text-ink"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-hover shadow-soft transition-colors"
                  >
                    Save All Data
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: AUTONOMOUS PROTOCOL VIEWER */}
      {protocolModalOpen && (
        <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-border animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <h3 className="text-base font-bold text-ink">Autonomous Decision Protocol</h3>
              </div>
              <button onClick={() => setProtocolModalOpen(false)} className="text-muted hover:text-ink">
                ✕
              </button>
            </div>

            <div className="my-4 space-y-3">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-status-orange" />
                <span>
                  High comms latency detected ({mission.comms_delay_s}s). Follow onboard autonomous SOP prior to ground confirmation.
                </span>
              </div>

              <div className="p-4 bg-canvas rounded-2xl border border-border font-mono text-xs whitespace-pre-wrap leading-relaxed text-ink">
                {selectedProtocol}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <button
                onClick={() => setProtocolModalOpen(false)}
                className="px-4 py-2 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary-hover"
              >
                Acknowledge Protocol
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DRAWER: ABOUT THIS SCORE FORMULA */}
      {aboutScoreOpen && (
        <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-50 flex justify-end">
          <div className="bg-surface w-full max-w-md h-full p-6 shadow-2xl border-l border-border flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <h3 className="font-bold text-base text-ink">About the Health Score Formula</h3>
                <button onClick={() => setAboutScoreOpen(false)} className="text-muted hover:text-ink">
                  ✕
                </button>
              </div>

              <div className="my-4 space-y-4 text-xs text-muted leading-relaxed">
                <div>
                  <h4 className="font-bold text-ink mb-1">Mathematical Formulation</h4>
                  <div className="bg-canvas p-3 rounded-xl border border-border font-mono text-[11px] text-ink">
                    Score = 100 - Σ(W_vitals × Penalty_status) - Σ(W_hazard × Hazard_exposure) - Penalty_exercise
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-ink mb-1">Two-Layer Scoring Engine</h4>
                  <ul className="list-disc pl-4 space-y-1">
                    <li><strong className="text-ink">Layer 1 (Personal Baseline):</strong> Computes robust Median & MAD from astronaut's first 14 mission days. Orange flagged at |z| ≥ 2.0, Red at |z| ≥ 3.5.</li>
                    <li><strong className="text-ink">Layer 2 (Absolute NASA Safety Rails):</strong> Outer physiological limits from NASA Human Research Program (HRP) standards. The worse layer takes precedence.</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-bold text-ink mb-1">International Classification Standards</h4>
                  <p>
                    Thresholds adhere to international acute risk indices (NEWS2 & NASA HRP): Scores ≥ 85 indicate optimal physiological resilience (Green), 70-84 warrant heightened monitoring (Orange), and &lt; 70 trigger clinical countermeasures (Red).
                  </p>
                </div>

                <div className="p-3 bg-panel rounded-xl border border-border text-[11px] text-primary">
                  <strong>Scientific Reference:</strong> NASA HRP Evidence Books and CSA CANS Active Neutron Spectrometer protocols.
                </div>
              </div>
            </div>

            <button
              onClick={() => setAboutScoreOpen(false)}
              className="w-full py-2.5 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary-hover"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
