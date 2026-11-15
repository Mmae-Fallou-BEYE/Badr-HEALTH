// Generated with AI assistance (Antigravity). Reviewed by the team.
import React from 'react';
import {
  SlidersHorizontal,
  Database,
  Check,
} from 'lucide-react';
import { useAppStore } from '../../data/store';
import { Scenario } from '../../data/types';
import { repository } from '../../data/repository';

export const SettingsPage: React.FC = () => {
  const { scenario, setScenario, connectionStatus, connectionError } = useAppStore();
  const isRemote = repository.isRemote();

  const connectionLabel = {
    offline: 'Local fallback active',
    connecting: 'Connecting…',
    connected: 'Connected',
    error: 'Connection error',
  }[connectionStatus];

  const scenarios: { id: Scenario; label: string; desc: string; risk: string }[] = [
    {
      id: 'nominal',
      label: 'Nominal Baseline',
      desc: 'All physiological indicators stable with circadian rhythm.',
      risk: 'None • All green',
    },
    {
      id: 'hypoxia_event',
      label: 'Hypoxia Event (SpO₂ Drop)',
      desc: 'Peripheral oxygen saturation falls below 92%, compensatory tachycardia.',
      risk: 'Critical • Red Alert & Mask Protocol',
    },
    {
      id: 'solar_particle_event',
      label: 'Solar Particle Event (SPE)',
      desc: 'Dosimeter dose rate spikes to 280 µSv/h with high neutron flux.',
      risk: 'Critical • Radiation Storm Shelter',
    },
    {
      id: 'poor_sleep_streak',
      label: 'Sleep Deprivation Streak',
      desc: 'Cumulative sleep debt (< 5h/night), mood decline, neuro-fatigue.',
      risk: 'Attention • Orange Warning',
    },
    {
      id: 'bp_drift',
      label: 'Blood Pressure Drift',
      desc: 'Hypertensive upward drift over 5 days due to cephalad fluid shift.',
      risk: 'Attention • Trend Forecaster Drift',
    },
    {
      id: 'high_co2',
      label: 'Cabin CO₂ Scrubber Saturation',
      desc: 'Ambient CO₂ concentration rises past 5,000 ppm limit.',
      risk: 'Critical • Scrubber Canister Switch',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-ink">System Configuration & Scenarios</h2>
          <p className="text-xs text-muted">
            Configure telemetry inputs, trigger simulation stress tests, and review clinical algorithms.
          </p>
        </div>
        <span className="text-xs bg-panel text-primary font-bold px-3 py-1 rounded-xl border border-border">
          Runtime v1.0.0 • Space Apps 2026
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 1. SCENARIO SWITCHER (col-span-7) */}
        <div className="lg:col-span-7 bg-surface rounded-3xl p-6 border border-border shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-base text-ink">Mission Stress Scenarios</h3>
            </div>
            <span className="text-xs text-muted">Hotkey: <kbd className="bg-canvas px-1.5 py-0.5 rounded font-mono text-[10px] border">Shift+D</kbd></span>
          </div>

          <div className="space-y-3">
            {scenarios.map((s) => (
              <button
                key={s.id}
                onClick={() => setScenario(s.id)}
                className={`w-full p-4 rounded-2xl text-left border transition-all flex items-center justify-between ${
                  scenario === s.id
                    ? 'bg-panel border-primary ring-2 ring-primary/20 shadow-soft'
                    : 'bg-surface hover:bg-canvas border-border shadow-sm'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-ink">{s.label}</span>
                    {scenario === s.id && (
                      <span className="text-[10px] bg-primary text-white font-extrabold px-2 py-0.5 rounded-full">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted mt-0.5">{s.desc}</p>
                </div>
                <span className="text-xs font-semibold text-primary shrink-0 ml-4">{s.risk}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 2. DATA MODE & SYSTEM LEGEND (col-span-5) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Data Mode Card */}
          <div className="bg-surface rounded-3xl p-6 border border-border shadow-soft">
            <div className="flex items-center gap-2 mb-4">
              <Database className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-base text-ink">Data Repository Mode</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-canvas border border-border flex items-center justify-between">
                <div>
                  <span className="font-bold text-ink block">Offline In-Memory Store</span>
                  <span className="text-muted text-[11px]">Zero-config local fallback with active simulator</span>
                </div>
                {!isRemote && (
                  <span className="text-xs font-bold text-status-green flex items-center gap-1">
                    <Check className="w-4 h-4" /> Enabled
                  </span>
                )}
              </div>

              <div className="p-3.5 rounded-2xl bg-canvas border border-border flex items-center justify-between opacity-80">
                <div>
                  <span className="font-bold text-ink block">Supabase Remote Cloud</span>
                  <span className="text-muted text-[11px]">PostgreSQL & Realtime WebSocket channel</span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${connectionStatus === 'error' ? 'bg-red-100 text-red-700' : 'bg-panel text-muted'}`}>
                  {isRemote ? connectionLabel : 'Not configured'}
                </span>
              </div>
              {connectionError && (
                <p role="alert" className="text-[11px] text-red-700 break-words">
                  {connectionError}
                </p>
              )}
            </div>
          </div>

          {/* Data Source Legend & Compliance */}
          <div className="bg-surface rounded-3xl p-6 border border-border shadow-soft">
            <h4 className="font-bold text-sm text-ink mb-3">Data Integrity & Transparency</h4>
            <div className="space-y-2.5 text-xs text-muted leading-relaxed">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sand text-ink border border-amber-300">
                  SIMULATED
                </span>
                <span>Values generated by onboard mathematical simulator.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-status-green">
                  SENSOR
                </span>
                <span>Values ingested live from ESP32 / MAX30102 hardware bus.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-panel text-primary">
                  MANUAL
                </span>
                <span>Values recorded manually by astronaut or crew surgeon.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
