// Generated with AI assistance (Antigravity). Reviewed by the team.
import React from 'react';
import {
  Users,
  CheckCircle2,
  Cpu,
} from 'lucide-react';
import { useAppStore } from '../../data/store';
import { ENVIRONMENTS } from '../../config/environments';
import { Environment } from '../../data/types';

export const MissionPage: React.FC = () => {
  const { environment, setEnvironment, mission, crew, astronaut, switchAstronaut } = useAppStore();

  const sensorInventory = [
    {
      id: 'SENS-01',
      kind: 'MAX30102 Optical PPG',
      metric: 'Heart Rate & SpO₂',
      status: 'Online',
      lastSeen: '1 sec ago',
      source: 'Sensor / Telemetry',
      deviceKey: 'esp32-vitals-board-01',
    },
    {
      id: 'SENS-02',
      kind: 'BME280 Environmental Pod',
      metric: 'Cabin Pressure, Temp & Hum',
      status: 'Online',
      lastSeen: '3 sec ago',
      source: 'Sensor / I2C Bus',
      deviceKey: 'esp32-cabin-board-02',
    },
    {
      id: 'SENS-03',
      kind: 'SCD41 NDIR Acoustic Sensor',
      metric: 'Cabin CO₂ Concentration',
      status: 'Online',
      lastSeen: '2 sec ago',
      source: 'Sensor / Telemetry',
      deviceKey: 'esp32-co2-node-03',
    },
    {
      id: 'SENS-04',
      kind: 'Silicon Dosimeter / CANS Cfg',
      metric: 'Radiation Dose Rate & Neutrons',
      status: 'Online',
      lastSeen: 'Realtime',
      source: 'Simulated / Active Spec',
      deviceKey: 'cans-dosimeter-04',
    },
    {
      id: 'SENS-05',
      kind: 'Acoustic Blood Pressure Cuff',
      metric: 'Manual Sphygmomanometer',
      status: 'Standby',
      lastSeen: '12 min ago',
      source: 'Manual Crew Log',
      deviceKey: 'crew-cuff-manual',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-ink">Mission & Environmental Architecture</h2>
          <p className="text-xs text-muted">
            Configure dynamic flight parameters, communications latency thresholds, and live sensor bus telemetry.
          </p>
        </div>
        <span className="text-xs bg-panel text-primary font-bold px-3 py-1 rounded-xl border border-border">
          Day {mission.mission_day} • Artemis Deep Space
        </span>
      </div>

      {/* 1. ENVIRONMENT SELECTOR CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {(['station', 'spacecraft', 'moon'] as Environment[]).map((envKey) => {
          const cfg = ENVIRONMENTS[envKey];
          const isSelected = environment === envKey;

          return (
            <button
              key={envKey}
              onClick={() => setEnvironment(envKey)}
              className={`p-6 rounded-3xl text-left border transition-all flex flex-col justify-between ${
                isSelected
                  ? 'bg-surface border-primary ring-2 ring-primary/20 shadow-soft'
                  : 'bg-surface hover:bg-canvas border-border shadow-sm'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary">
                    {cfg.tagline}
                  </span>
                  {isSelected && (
                    <span className="text-[10px] bg-primary text-white font-bold px-2.5 py-0.5 rounded-full">
                      ACTIVE
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-bold text-ink mb-1">{cfg.name}</h3>
                <p className="text-xs text-muted leading-relaxed mb-4">{cfg.operational_notes}</p>
              </div>

              <div className="space-y-2 pt-3 border-t border-border/60 text-xs w-full">
                <div className="flex justify-between">
                  <span className="text-muted">Gravity Constant:</span>
                  <span className="font-bold text-ink">
                    {cfg.gravity_g === 0 ? '0.00 g (Microgravity)' : `${cfg.gravity_g} g`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Comms Delay:</span>
                  <span className="font-bold text-ink">{cfg.comms_delay_s} seconds</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Lead Hazard:</span>
                  <span className="font-bold text-primary">
                    {envKey === 'spacecraft' ? 'Radiation (35%)' : envKey === 'station' ? 'Bone Loss (35%)' : 'Regolith Dust (20%)'}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* 2. CREW ROSTER & HEALTH STATUS */}
      <div className="bg-surface rounded-3xl p-6 border border-border shadow-soft">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-base text-ink">Mission Crew Roster</h3>
          </div>
          <span className="text-xs text-muted">All Crew Active & Telemetry Synced</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {crew.map((c) => {
            const isSelected = c.id === astronaut.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => switchAstronaut(c.id)}
                className={`p-4 rounded-2xl text-left transition-all border flex flex-col justify-between ${
                  isSelected
                    ? 'bg-panel border-primary ring-2 ring-primary/20 shadow-soft'
                    : 'bg-canvas hover:bg-surface border-border shadow-sm'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-primary">{c.callsign}</span>
                    <span className="text-[10px] bg-emerald-100 text-status-green font-bold px-2 py-0.5 rounded-full">
                      {c.status}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-ink">{c.display_name}</h4>
                  <p className="text-xs text-muted mt-0.5">{c.role}</p>
                </div>

                <div className="mt-4 pt-2 border-t border-border/60 flex justify-between items-center text-xs w-full">
                  <span className="text-muted">Health Index</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-ink">{c.health_score ?? 94}%</span>
                    {isSelected && (
                      <span className="text-[9px] bg-primary text-white font-bold px-1.5 py-0.2 rounded">
                        ACTIVE
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. HARDWARE SENSORS & INGESTION TELEMETRY TABLE */}
      <div className="bg-surface rounded-3xl p-6 border border-border shadow-soft">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-base text-ink">Physical & Simulated Sensor Ingestion Bus</h3>
          </div>
          <span className="text-xs text-primary font-semibold">HTTPS / REST Protocol Ready</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-muted">
                <th className="pb-3 font-semibold">Sensor ID</th>
                <th className="pb-3 font-semibold">Hardware Type</th>
                <th className="pb-3 font-semibold">Assigned Metrics</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold">Last Telemetry</th>
                <th className="pb-3 font-semibold">Ingestion Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {sensorInventory.map((s) => (
                <tr key={s.id} className="hover:bg-canvas/60 transition-colors">
                  <td className="py-3 font-mono font-bold text-ink">{s.id}</td>
                  <td className="py-3 text-ink font-medium">{s.kind}</td>
                  <td className="py-3 text-muted">{s.metric}</td>
                  <td className="py-3">
                    <span className="inline-flex items-center gap-1 font-bold text-status-green">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {s.status}
                    </span>
                  </td>
                  <td className="py-3 text-muted">{s.lastSeen}</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded-md bg-panel text-primary font-medium">
                      {s.source}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
