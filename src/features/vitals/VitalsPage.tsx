// Generated with AI assistance (Antigravity). Reviewed by the team.
import React, { useState } from 'react';
import {
  Heart,
  Wind,
  Thermometer,
  Activity,
  Droplet,
  Moon,
  Smile,
  Flame,
  CloudFog,
  PlusCircle,
  ExternalLink,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { useAppStore } from '../../data/store';
import { MetricKey } from '../../data/types';
import { METRIC_THRESHOLDS } from '../../config/thresholds';
import { InfoTooltip } from '../../components/InfoTooltip';

export const VitalsPage: React.FC = () => {
  const { latestReadings, historySeries, addManualReading } = useAppStore();
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>('spo2');
  const [modalOpen, setModalOpen] = useState(false);
  const [manualVal, setManualVal] = useState('98');

  const metricList: { key: MetricKey; icon: any }[] = [
    { key: 'spo2', icon: Wind },
    { key: 'heart_rate', icon: Heart },
    { key: 'blood_pressure_sys', icon: Activity },
    { key: 'body_temp', icon: Thermometer },
    { key: 'glucose', icon: Droplet },
    { key: 'sleep_hours', icon: Moon },
    { key: 'mood', icon: Smile },
    { key: 'cabin_co2', icon: CloudFog },
    { key: 'radiation_dose_rate', icon: Flame },
  ];

  const currentReading = latestReadings[selectedMetric];
  const currentThreshold = METRIC_THRESHOLDS[selectedMetric];
  const chartData = historySeries[selectedMetric] || [];

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = parseFloat(manualVal);
    if (!isNaN(v)) {
      addManualReading(selectedMetric, v);
      setModalOpen(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-ink">Astronaut Biometric Vitals</h2>
            <InfoTooltip text="Continuous physiological telemetry, baseline scoring, and clinical safety rails based on NASA Human Research Program parameters." />
          </div>
          <p className="text-xs text-muted">Continuous physiological telemetry, baseline scoring, and clinical safety rails.</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary-hover shadow-soft transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Manual Entry</span>
        </button>
      </div>

      {/* 1. METRICS SUMMARY GRID */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {metricList.map(({ key, icon: Icon }) => {
          const reading = latestReadings[key];
          const threshold = METRIC_THRESHOLDS[key];
          const isSelected = selectedMetric === key;
          const status = reading?.status ?? 'green';

          return (
            <button
              key={key}
              onClick={() => setSelectedMetric(key)}
              className={`p-4 rounded-3xl text-left border transition-all flex flex-col justify-between ${
                isSelected
                  ? 'bg-surface border-primary ring-2 ring-primary/20 shadow-soft'
                  : 'bg-surface hover:bg-canvas border-border shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div className="w-8 h-8 rounded-xl bg-panel flex items-center justify-center text-primary">
                  <Icon className="w-4 h-4" />
                </div>
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    status === 'green'
                      ? 'bg-status-green'
                      : status === 'orange'
                      ? 'bg-status-orange'
                      : 'bg-status-red animate-pulse'
                  }`}
                />
              </div>

              <div className="my-2">
                <span className="text-[11px] text-muted block line-clamp-1">{threshold?.label || key}</span>
                <span className="text-xl font-extrabold text-ink">
                  {reading?.value ?? '--'} <span className="text-xs font-normal text-muted">{threshold?.unit}</span>
                </span>
              </div>

              <div className="flex items-center justify-between text-[10px] text-muted border-t border-border/60 pt-1.5 w-full">
                <span className="capitalize">{status}</span>
                <span className="text-primary font-medium">SIMULATED</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* 2. DETAILED METRIC FOCUS & INTERACTIVE TIME SERIES CHART */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-surface rounded-3xl p-6 border border-border shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-ink">{currentThreshold?.label}</h3>
                <span className="text-[10px] bg-panel text-primary font-bold px-2 py-0.5 rounded-md">
                  Real-time Buffer
                </span>
              </div>
              <p className="text-xs text-muted">{currentThreshold?.description}</p>
            </div>

            <div className="text-right">
              <span className="text-2xl font-extrabold text-ink">
                {currentReading?.value} <span className="text-sm font-normal text-muted">{currentThreshold?.unit}</span>
              </span>
              <span className="text-[11px] block text-muted">Current Live Value</span>
            </div>
          </div>

          {/* Time Series Chart */}
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="time" stroke="#5E6F66" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#5E6F66"
                  fontSize={11}
                  tickLine={false}
                  domain={['auto', 'auto']}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '12px',
                    borderColor: '#E2EAE3',
                    fontSize: '12px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#1F7A5A"
                  strokeWidth={3}
                  dot={{ r: 3, fill: '#1F7A5A' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-xs text-muted pt-3 border-t border-border mt-2">
            <span>Historical window: 25 observations</span>
            <span className="text-primary font-medium">Personal baseline: fitted</span>
          </div>
        </div>

        {/* THRESHOLD RAILS & SOURCE CITATION (col-span-4) */}
        <div className="lg:col-span-4 bg-surface rounded-3xl p-6 border border-border shadow-soft flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-sm text-ink mb-1">Safety Rails & Thresholds</h4>
            <p className="text-xs text-muted mb-4">Clinical reference ranges and spaceflight risk brackets.</p>

            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-800">
                  <span>Nominal (Green)</span>
                  <span>{currentThreshold?.green[0]} – {currentThreshold?.green[1]} {currentThreshold?.unit}</span>
                </div>
                <p className="text-[11px] text-emerald-700 mt-0.5">Optimal crew physiological operating range.</p>
              </div>

              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200">
                <div className="flex items-center justify-between text-xs font-bold text-amber-800">
                  <span>Warning / Drift (Orange)</span>
                  <span>{currentThreshold?.orange[0]} – {currentThreshold?.orange[1]} {currentThreshold?.unit}</span>
                </div>
                <p className="text-[11px] text-amber-700 mt-0.5">Prompt checklist review or repeat measurement.</p>
              </div>

              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200">
                <div className="flex items-center justify-between text-xs font-bold text-rose-800">
                  <span>Critical Action (Red)</span>
                  <span>≥ {currentThreshold?.red[0]} {currentThreshold?.unit}</span>
                </div>
                <p className="text-[11px] text-rose-700 mt-0.5">Immediate autonomous emergency protocol trigger.</p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-border mt-4">
            <span className="text-[10px] text-muted uppercase font-bold block mb-1">Source & Scientific Basis</span>
            <p className="text-xs text-ink font-medium">{currentThreshold?.source_label}</p>
            <a
              href={currentThreshold?.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-primary font-bold hover:underline mt-2"
            >
              <span>NASA HRP Scientific Reference</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* MODAL MANUAL ENTRY */}
      {modalOpen && (
        <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-border">
            <h3 className="text-base font-bold text-ink mb-1">Add Manual Reading</h3>
            <p className="text-xs text-muted mb-4">{currentThreshold?.label} ({currentThreshold?.unit})</p>

            <form onSubmit={handleManualSubmit} className="space-y-4">
              <input
                type="number"
                step="any"
                value={manualVal}
                onChange={(e) => setManualVal(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-canvas border border-border text-base font-bold text-ink focus:outline-none focus:ring-2 focus:ring-primary"
                autoFocus
                required
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-muted hover:text-ink"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary-hover"
                >
                  Save Reading
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
