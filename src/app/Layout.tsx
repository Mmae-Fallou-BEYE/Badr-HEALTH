// Generated with AI assistance (Antigravity). Reviewed by the team.
import React, { useEffect, useState, useRef } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Activity,
  User,
  HeartPulse,
  Flame,
  Compass,
  BookOpen,
  Bell,
  Settings,
  Radio,
  Globe2,
  SlidersHorizontal,
  ShieldAlert,
  LockKeyhole,
  Play,
  Pause,
  Mic,
  MoreHorizontal,
  ChevronDown,
  CheckCircle2,
  Users,
  Sparkles,
} from 'lucide-react';
import { useAppStore } from '../data/store';
import { ENVIRONMENTS } from '../config/environments';
import { Environment, Scenario } from '../data/types';
import { VoiceAssistantModal } from '../components/VoiceAssistantModal';

export const Layout: React.FC = () => {
  const {
    astronaut,
    crew,
    switchAstronaut,
    mission,
    environment,
    setEnvironment,
    scenario,
    setScenario,
    isOfflineDemo,
    isSimulating,
    toggleSimulation,
    tick,
    alerts,
  } = useAppStore();

  const [scenarioModalOpen, setScenarioModalOpen] = useState(false);
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [crewRosterOpen, setCrewRosterOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const crewRosterRef = useRef<HTMLDivElement>(null);

  // Real-time simulation ticker every 3 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      tick();
    }, 3000);
    return () => clearInterval(timer);
  }, [tick]);

  // Global hotkey Shift+D to open scenario drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && (e.key === 'D' || e.key === 'd')) {
        e.preventDefault();
        setScenarioModalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close popovers on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setMoreMenuOpen(false);
      }
      if (crewRosterRef.current && !crewRosterRef.current.contains(e.target as Node)) {
        setCrewRosterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadAlertsCount = alerts.filter((a) => !a.acknowledged_at).length;
  const currentEnv = ENVIRONMENTS[environment];

  // Primary windows for the slim sidebar
  const primaryNavItems = [
    { to: '/', label: 'Overview', icon: Activity },
    { to: '/body-map', label: 'Body Map', icon: User },
    { to: '/vitals', label: 'Vitals', icon: HeartPulse },
    {
      to: '/alerts',
      label: 'Alerts',
      icon: Bell,
      badge: unreadAlertsCount > 0 ? unreadAlertsCount : undefined,
    },
  ];

  // Secondary windows grouped under "Other"
  const secondaryNavItems = [
    { to: '/hazards', label: 'Hazards & Radiation', icon: Flame, desc: 'NASA 5 Spaceflight Risks & Dosimetry' },
    { to: '/mission', label: 'Mission Architecture', icon: Compass, desc: 'Sensor Ingestion Bus & Flight Gravity' },
    { to: '/guides', label: 'Clinical Guides', icon: BookOpen, desc: 'Protocols & NASA HRP Evidence' },
    { to: '/settings', label: 'System Configuration', icon: Settings, desc: 'Telemetry Stress Scenarios' },
    { to: '/assistant', label: 'BioMistral AI Review', icon: Sparkles, desc: 'Local structured medical review' },
  ];

  const isSecondaryActive = secondaryNavItems.some((item) => location.pathname === item.to);

  const scenarios: { id: Scenario; label: string; desc: string; color: string }[] = [
    { id: 'nominal', label: 'Nominal Baseline', desc: 'Optimal vitals with circadian rhythm', color: 'text-status-green' },
    { id: 'hypoxia_event', label: 'Hypoxia Event', desc: 'SpO₂ falls below 92%, tachycardia warning', color: 'text-status-red' },
    { id: 'solar_particle_event', label: 'Solar Particle Event', desc: 'Radiation dosimeter spikes > 250 µSv/h', color: 'text-status-red' },
    { id: 'poor_sleep_streak', label: 'Sleep Deprivation', desc: 'Sleep < 5h, mood decline, high fatigue', color: 'text-status-orange' },
    { id: 'bp_drift', label: 'Blood Pressure Drift', desc: 'Hypertension drift over several days', color: 'text-status-orange' },
    { id: 'high_co2', label: 'High Cabin CO₂', desc: 'CO₂ exceeds 5000 ppm scrubber threshold', color: 'text-status-red' },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-canvas text-ink font-sans">
      {/* 1. SLIM ICON SIDEBAR */}
      <aside className="w-20 bg-surface border-r border-border flex flex-col items-center py-6 justify-between select-none z-30 shrink-0">
        <div className="flex flex-col items-center gap-8 w-full">
          {/* Logo badge */}
          <div
            onClick={() => navigate('/')}
            className="relative group cursor-pointer"
            title="Badr Health — Spacecrew Telemetry & Decision Support"
          >
            <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center font-bold text-xl shadow-soft group-hover:scale-105 transition-all">
              BH
            </div>
            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-mint border-2 border-surface rounded-full" />
          </div>

          {/* Primary Navigation Icons */}
          <nav className="flex flex-col items-center gap-3 w-full px-2">
            {primaryNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 group ${
                      isActive
                        ? 'bg-panel text-primary font-semibold shadow-soft'
                        : 'text-muted hover:text-ink hover:bg-canvas'
                    }`
                  }
                  title={item.label}
                >
                  <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                  {item.badge !== undefined && (
                    <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-red opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-status-red"></span>
                    </span>
                  )}
                  {/* Tooltip on hover */}
                  <span className="absolute left-16 bg-ink text-white text-xs px-2.5 py-1.5 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-md z-50">
                    {item.label}
                  </span>
                </NavLink>
              );
            })}

            {/* "Other / More" Group Button */}
            <div className="relative" ref={moreMenuRef}>
              <button
                type="button"
                onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                className={`relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 group ${
                  isSecondaryActive || moreMenuOpen
                    ? 'bg-panel text-primary font-semibold shadow-soft'
                    : 'text-muted hover:text-ink hover:bg-canvas'
                }`}
                title="Other Systems (Hazards, Mission, Guides, Settings)"
              >
                <MoreHorizontal className={`w-5 h-5 transition-transform group-hover:scale-110 ${isSecondaryActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                {isSecondaryActive && (
                  <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-primary" />
                )}
                <span className="absolute left-16 bg-ink text-white text-xs px-2.5 py-1.5 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-md z-50">
                  Other Systems
                </span>
              </button>

              {/* Floating Popover Menu for Secondary Pages */}
              {moreMenuOpen && (
                <div className="absolute left-16 top-0 w-64 bg-surface rounded-2xl shadow-xl border border-border p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted px-3 py-1.5 border-b border-border/70 mb-1">
                    Other Mission Systems
                  </div>
                  <div className="space-y-1">
                    {secondaryNavItems.map((sec) => {
                      const SecIcon = sec.icon;
                      const isSecActive = location.pathname === sec.to;
                      return (
                        <NavLink
                          key={sec.to}
                          to={sec.to}
                          onClick={() => setMoreMenuOpen(false)}
                          className={`flex items-start gap-2.5 p-2 rounded-xl transition-all ${
                            isSecActive
                              ? 'bg-panel text-primary font-semibold'
                              : 'text-ink hover:bg-canvas'
                          }`}
                        >
                          <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${isSecActive ? 'bg-mint-light text-primary' : 'bg-panel text-muted'}`}>
                            <SecIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-semibold leading-tight">{sec.label}</div>
                            <div className="text-[10px] text-muted line-clamp-1">{sec.desc}</div>
                          </div>
                        </NavLink>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </nav>
        </div>

        {/* Bottom controls: Simulator Scenarios Switcher */}
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={() => setScenarioModalOpen(true)}
            className="w-11 h-11 rounded-2xl bg-canvas hover:bg-panel flex items-center justify-center text-muted hover:text-primary transition-all border border-border/80 shadow-sm group relative"
            title="Mission Simulation Scenarios (Shift+D)"
          >
            <SlidersHorizontal className="w-4 h-4 transition-transform group-hover:rotate-45" />
            <span className="absolute left-16 bg-ink text-white text-xs px-2.5 py-1.5 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-md z-50">
              Scenarios (Shift+D)
            </span>
          </button>
        </div>
      </aside>

      {/* 2. MAIN APPLICATION WORKSPACE */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* TOP GREETING & CONTEXT HEADER */}
        <header className="h-20 bg-surface border-b border-border px-8 flex items-center justify-between z-20 shrink-0 gap-4 flex-wrap">
          {/* Top-Left: Crew Profile & Mission Crew Roster Switcher */}
          <div className="relative" ref={crewRosterRef}>
            <button
              type="button"
              onClick={() => setCrewRosterOpen(!crewRosterOpen)}
              className="flex items-center gap-3.5 p-2 rounded-2xl hover:bg-canvas transition-all border border-transparent hover:border-border text-left group"
              title="Click to switch astronaut profile"
            >
              {/* Profile Avatar Badge */}
              <div className="w-11 h-11 rounded-2xl bg-primary text-white flex items-center justify-center font-extrabold text-sm shadow-sm ring-2 ring-mint/50 group-hover:ring-primary transition-all">
                {astronaut.avatar_initials || 'BH'}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm font-bold text-ink group-hover:text-primary transition-colors">
                    {astronaut.display_name}
                  </h1>
                  <span className="text-[10px] font-mono font-bold bg-panel text-primary px-2 py-0.5 rounded-md border border-border">
                    {astronaut.callsign}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-muted transition-transform duration-200 ${crewRosterOpen ? 'rotate-180 text-primary' : ''}`} />
                </div>
                <p className="text-[11px] text-muted">
                  {astronaut.role} • <span className="text-primary font-medium">Day {mission.mission_day}</span>
                </p>
              </div>
            </button>

            {/* MISSION CREW ROSTER DROPDOWN */}
            {crewRosterOpen && (
              <div className="absolute left-0 top-full mt-2 w-80 bg-surface rounded-3xl shadow-2xl border border-border p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    <span className="text-xs font-bold text-ink">Mission Crew Roster</span>
                  </div>
                  <span className="text-[10px] bg-emerald-100 text-status-green font-bold px-2 py-0.5 rounded-full">
                    {crew.length} Astronauts
                  </span>
                </div>

                <div className="space-y-2">
                  {crew.map((member) => {
                    const isSelected = member.id === astronaut.id;
                    return (
                      <button
                        key={member.id}
                        type="button"
                        onClick={() => {
                          switchAstronaut(member.id);
                          setCrewRosterOpen(false);
                        }}
                        className={`w-full p-3 rounded-2xl text-left transition-all flex items-center justify-between border ${
                          isSelected
                            ? 'bg-panel border-primary shadow-soft'
                            : 'bg-surface hover:bg-canvas border-border/80'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                            isSelected ? 'bg-primary text-white shadow-sm' : 'bg-panel text-primary'
                          }`}>
                            {member.avatar_initials}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-xs text-ink">{member.display_name}</span>
                              {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-primary" />}
                            </div>
                            <span className="text-[10px] text-muted block line-clamp-1">{member.role}</span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-canvas border text-muted">
                            {member.callsign}
                          </span>
                          <span className="text-[10px] font-bold text-primary block mt-0.5">
                            {member.health_score ?? 94}% Fit
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="pt-3 mt-3 border-t border-border flex items-center justify-between text-[11px] text-muted">
                  <span>Artemis IV Deep Space</span>
                  <span className="text-primary font-medium">Click to switch telemetry</span>
                </div>
              </div>
            )}
          </div>

          {/* Context chips: Voice Assistant, Telemetry State, Environment, Gravity, Comms Delay */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={() => {
                sessionStorage.removeItem('badr-health-session');
                navigate('/access', { replace: true });
              }}
              className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:border-primary hover:text-primary"
              title="Lock terminal and switch crew"
            >
              <LockKeyhole className="h-3.5 w-3.5" />
              <span>Lock terminal</span>
            </button>

            {/* Voice Assistant Trigger */}
            <button
              onClick={() => setVoiceModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-panel hover:bg-mint-light text-primary text-xs font-semibold border border-border shadow-soft transition-all group"
              title="Voice Assistant & Speech Commands"
            >
              <Mic className="w-3.5 h-3.5 group-hover:scale-110 transition-transform text-primary" />
              <span>Voice Control</span>
            </button>

            {/* Environment selector */}
            <div className="flex items-center bg-canvas rounded-2xl p-1 border border-border">
              {(['station', 'spacecraft', 'moon'] as Environment[]).map((envKey) => {
                const active = environment === envKey;
                const envData = ENVIRONMENTS[envKey];
                return (
                  <button
                    key={envKey}
                    onClick={() => setEnvironment(envKey)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                      active
                        ? 'bg-surface text-primary shadow-soft font-semibold'
                        : 'text-muted hover:text-ink'
                    }`}
                  >
                    {envData.name.split(' ')[0]}
                  </button>
                );
              })}
            </div>

            {/* Gravity Chip */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-panel text-primary text-xs font-semibold border border-border">
              <Globe2 className="w-3.5 h-3.5" />
              <span>{currentEnv.gravity_g === 0 ? '0.00 g (Microgravity)' : `${currentEnv.gravity_g} g (Lunar)`}</span>
            </div>

            {/* Comms Delay Chip */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                currentEnv.comms_delay_s > 60
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-panel text-muted border-border'
              }`}
              title={currentEnv.comms_delay_s > 60 ? 'Autonomous decision mode engaged due to high latency' : 'Near real-time downlink'}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Delay: {currentEnv.comms_delay_s}s</span>
            </div>

            {/* SIMULATION TELEMETRY BADGE & PAUSE / RESUME TOGGLE BUTTON */}
            <div className="flex items-center gap-1.5 bg-canvas p-1 rounded-2xl border border-border">
              <span className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider px-2.5 py-1 rounded-xl bg-surface text-ink border border-border shadow-sm">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isSimulating ? 'bg-status-green animate-pulse' : 'bg-status-orange'
                  }`}
                />
                {isSimulating ? 'LIVE' : 'PAUSED'}
              </span>

              <button
                type="button"
                onClick={toggleSimulation}
                className={`p-1.5 rounded-xl transition-all ${
                  isSimulating
                    ? 'hover:bg-panel text-muted hover:text-ink'
                    : 'bg-status-green text-white hover:bg-emerald-600 shadow-sm'
                }`}
                title={isSimulating ? 'Pause live telemetry simulation' : 'Resume live telemetry simulation'}
              >
                {isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              </button>

              {isOfflineDemo && (
                <span className="text-[10px] text-muted font-medium px-2 py-0.5 rounded-lg bg-panel border" title="Operating with resilient in-memory simulated cache">
                  Offline Demo
                </span>
              )}
            </div>
          </div>
        </header>

        {/* SCROLLABLE MAIN CONTENT AREA */}
        <main className="flex-1 overflow-y-auto px-8 py-6 bg-canvas">
          <Outlet />
        </main>

        {/* PERSISTENT FOOTER DISCLAIMER */}
        <footer className="h-10 bg-surface border-t border-border px-8 flex items-center justify-between text-[11px] text-muted shrink-0 select-none">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-3.5 h-3.5 text-primary" />
            <span className="font-medium text-ink">
              Clinical decision-support tool. It does not replace a flight surgeon and does not provide medical diagnoses.
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span>NASA Space Apps Challenge Dakar 2026</span>
            <span>•</span>
            <span>NASA HRP & CSA Scientific Data Standards</span>
          </div>
        </footer>
      </div>

      {/* QUICK SCENARIO MODAL (Shift+D) */}
      {scenarioModalOpen && (
        <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-border animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div>
                <h3 className="text-lg font-bold text-ink">Mission Simulation Scenarios</h3>
                <p className="text-xs text-muted">Test dynamic astronaut responses to spaceflight hazards</p>
              </div>
              <button
                onClick={() => setScenarioModalOpen(false)}
                className="text-muted hover:text-ink text-sm px-2 py-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2.5 my-4">
              {scenarios.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setScenario(s.id);
                    setScenarioModalOpen(false);
                  }}
                  className={`p-3.5 rounded-2xl text-left border transition-all flex items-start justify-between ${
                    scenario === s.id
                      ? 'bg-panel border-primary shadow-soft'
                      : 'bg-surface hover:bg-canvas border-border'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-ink">{s.label}</span>
                      {scenario === s.id && (
                        <span className="text-[10px] bg-primary text-white px-2 py-0.5 rounded-full font-bold">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted mt-0.5">{s.desc}</p>
                  </div>
                  <span className={`text-xs font-bold ${s.color}`}>•</span>
                </button>
              ))}
            </div>

            <div className="flex justify-between items-center text-xs text-muted pt-2 border-t border-border">
              <span>Shortcut: <kbd className="bg-panel px-1.5 py-0.5 rounded text-[10px] font-mono border">Shift+D</kbd></span>
              <button
                onClick={() => setScenarioModalOpen(false)}
                className="px-4 py-2 bg-primary text-white font-medium rounded-xl hover:bg-primary-hover transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VOICE ASSISTANT MODAL */}
      <VoiceAssistantModal
        isOpen={voiceModalOpen}
        onClose={() => setVoiceModalOpen(false)}
      />
    </div>
  );
};
