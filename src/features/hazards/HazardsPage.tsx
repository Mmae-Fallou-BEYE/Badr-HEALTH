// Generated with AI assistance (Antigravity). Reviewed by the team.
import React from 'react';
import {
  Flame,
  Users,
  Compass,
  Globe2,
  ShieldAlert,
  ExternalLink,
  Info,
  Zap,
} from 'lucide-react';
import { useAppStore } from '../../data/store';
import { ENVIRONMENTS } from '../../config/environments';

export const HazardsPage: React.FC = () => {
  const { environment, hazardScores, latestReadings, radiationCumulativeMsv } = useAppStore();
  const currentEnv = ENVIRONMENTS[environment];

  const careerBudgetMsv = 600.0; // NASA lifetime astronaut exposure limit
  const percentCareerUsed = ((radiationCumulativeMsv / careerBudgetMsv) * 100).toFixed(2);

  const hazardIcons = {
    radiation: Flame,
    isolation: Users,
    distance: Compass,
    gravity: Globe2,
    closed_env: ShieldAlert,
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-ink">NASA Five Hazards of Human Spaceflight</h2>
          <p className="text-xs text-muted">
            Continuous hazard exposure evaluation adapted to mission environment: <strong className="text-primary">{currentEnv.name}</strong>.
          </p>
        </div>
        <span className="text-xs bg-panel text-primary font-bold px-3 py-1 rounded-xl border border-border">
          NASA HRP Hazard Matrix
        </span>
      </div>

      {/* 1. RADIATION PANEL FEATURING CANADIAN SPACE AGENCY (CANS) RESEARCH */}
      <div className="bg-gradient-to-r from-panel via-surface to-panel rounded-3xl p-6 border border-border shadow-soft">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-md">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-primary">Space Radiation Dosimetry</span>
              <h3 className="text-lg font-bold text-ink">Galactic Cosmic Rays & Solar Particle Monitoring</h3>
              <p className="text-xs text-muted">Active spectrometry including high-energy neutron flux</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-xs text-muted block">Current Rate</span>
              <span className="text-xl font-extrabold text-ink">
                {latestReadings.radiation_dose_rate?.value ?? 22.4} µSv/h
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs text-muted block">Mission Cumulative</span>
              <span className="text-xl font-extrabold text-primary">
                {radiationCumulativeMsv.toFixed(2)} mSv
              </span>
            </div>
          </div>
        </div>

        {/* Radiation Budget Progress Bar */}
        <div className="my-6">
          <div className="flex justify-between text-xs font-medium text-ink mb-1.5">
            <span>Career Dose Limit Budget (NASA 600 mSv Standard)</span>
            <span className="font-bold">{percentCareerUsed}% consumed ({radiationCumulativeMsv.toFixed(2)} / 600 mSv)</span>
          </div>
          <div className="w-full h-3 bg-canvas rounded-full overflow-hidden border border-border">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, parseFloat(percentCareerUsed))}%` }}
            />
          </div>
        </div>

        {/* CSA CANS NEUTRON RADIATION CITATION BOX */}
        <div className="p-4 rounded-2xl bg-surface border border-border flex items-start gap-3">
          <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <div className="flex items-center gap-2">
              <strong className="text-ink">Neutron Radiation Share: ~30% of Total Space Dose</strong>
              <span className="text-[10px] bg-mint-light text-primary font-bold px-2 py-0.5 rounded-full">
                CSA Reference
              </span>
            </div>
            <p className="text-muted mt-1">
              Per Canadian Space Agency (CSA, Feb 2026) research, secondary neutrons produced when cosmic rays hit spacecraft shielding account for ~30% of the astronaut radiation dose and carry a high biological effectiveness. Monitored in accordance with the Canadian Active Neutron Spectrometer (CANS) operational guidelines.
            </p>
            <a
              href="https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-primary font-bold hover:underline mt-2"
            >
              <span>Read CSA Radiation Article (Feb 2026)</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* 2. THE FIVE HRP HAZARD CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {hazardScores.map((h) => {
          const Icon = hazardIcons[h.hazard] || Flame;
          return (
            <div
              key={h.hazard}
              className="bg-surface rounded-3xl p-6 border border-border shadow-soft flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-panel flex items-center justify-center text-primary">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-extrabold text-ink">{h.score}</span>
                    <span className="text-xs text-muted">/100</span>
                  </div>
                </div>

                <h3 className="font-bold text-base text-ink mb-1">{h.label}</h3>
                <p className="text-xs text-muted mb-4">{h.primary_driver}</p>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-border/60">
                    <span className="text-muted">Environment Weight</span>
                    <span className="font-bold text-ink">{Math.round(h.weight * 100)}%</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/60">
                    <span className="text-muted">Trend</span>
                    <span className="font-bold capitalize text-primary">{h.trend}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-muted">NASA HRP Category</span>
                    <span className="font-semibold text-ink">Hazard {h.hazard.toUpperCase()}</span>
                  </div>
                </div>
              </div>

              <a
                href="https://www.nasa.gov/hrp/hazards/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 w-full py-2 bg-canvas hover:bg-panel text-primary text-xs font-semibold rounded-xl border border-border transition-colors mt-6"
              >
                <span>HRP Hazard Specification</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
};
