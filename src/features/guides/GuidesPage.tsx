// Generated with AI assistance (Antigravity). Reviewed by the team.
import React, { useState } from 'react';
import {
  Search,
  ExternalLink,
  Heart,
  Wind,
  Thermometer,
  Activity,
  Droplet,
  Moon,
  Smile,
  Flame,
  CloudFog,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { GUIDES_CONTENT, GuideContent } from '../../content/guides';
import { MetricKey } from '../../data/types';

export const GuidesPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const guideList = Object.values(GUIDES_CONTENT);
  const [selectedGuide, setSelectedGuide] = useState<GuideContent>(guideList[0]);

  const metricIcons: Record<MetricKey, any> = {
    spo2: Wind,
    heart_rate: Heart,
    blood_pressure_sys: Activity,
    blood_pressure_dia: Activity,
    body_temp: Thermometer,
    glucose: Droplet,
    sleep_hours: Moon,
    mood: Smile,
    cabin_co2: CloudFog,
    radiation_dose_rate: Flame,
  };

  const filteredGuides = guideList.filter(
    (g) =>
      g.title.toLowerCase().includes(search.toLowerCase()) ||
      g.category.toLowerCase().includes(search.toLowerCase()) ||
      g.what.toLowerCase().includes(search.toLowerCase()) ||
      g.why_in_space.toLowerCase().includes(search.toLowerCase())
  );

  const CurrentIcon = metricIcons[selectedGuide.metric] || Activity;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-in fade-in duration-200">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-ink">Clinical & Operational Guides Library</h2>
          <p className="text-xs text-muted">
            Plain-language biomedical protocols, measurement procedures, and official NASA/CSA citations.
          </p>
        </div>
        <div className="relative w-72">
          <Search className="w-4 h-4 text-muted absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search guides, metrics, or protocols..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface border border-border text-xs text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LIST OF GUIDES (col-span-5) */}
        <div className="lg:col-span-5 space-y-2.5">
          {filteredGuides.map((guide) => {
            const Icon = metricIcons[guide.metric] || Activity;
            const isSelected = selectedGuide.metric === guide.metric;

            return (
              <button
                key={guide.metric}
                onClick={() => setSelectedGuide(guide)}
                className={`w-full p-4 rounded-2xl text-left border transition-all flex items-center justify-between ${
                  isSelected
                    ? 'bg-surface border-primary ring-2 ring-primary/20 shadow-soft'
                    : 'bg-surface hover:bg-canvas border-border shadow-sm'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-panel flex items-center justify-center text-primary">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-xs text-ink">{guide.title}</h4>
                      {!guide.verified && (
                        <span className="text-[9px] bg-sand text-ink px-1.5 py-0.2 rounded font-medium border border-amber-300">
                          Ref
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-muted block capitalize">{guide.category} • {guide.frequency}</span>
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-primary' : 'text-muted'}`} />
              </button>
            );
          })}
        </div>

        {/* DETAILED GUIDE VIEW (col-span-7) */}
        <div className="lg:col-span-7 bg-surface rounded-3xl p-8 border border-border shadow-soft flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between pb-4 border-b border-border">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-panel text-primary flex items-center justify-center shadow-sm">
                  <CurrentIcon className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-primary">{selectedGuide.category}</span>
                    {!selectedGuide.verified && (
                      <span className="text-[10px] bg-sand text-ink px-2 py-0.5 rounded-full font-medium border border-amber-300">
                        Reference value (Verify with Flight Surgeon)
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-ink mt-0.5">{selectedGuide.title}</h3>
                </div>
              </div>

              <span className="text-[11px] bg-panel text-primary font-bold px-3 py-1 rounded-xl border border-border">
                {selectedGuide.frequency}
              </span>
            </div>

            <div className="my-6 space-y-5 text-xs">
              <div>
                <h4 className="font-bold text-ink uppercase tracking-wider text-[11px] mb-1">What is it?</h4>
                <p className="text-muted leading-relaxed">{selectedGuide.what}</p>
              </div>

              <div>
                <h4 className="font-bold text-ink uppercase tracking-wider text-[11px] mb-1">Why does it matter in space?</h4>
                <p className="text-muted leading-relaxed">{selectedGuide.why_in_space}</p>
              </div>

              <div>
                <h4 className="font-bold text-ink uppercase tracking-wider text-[11px] mb-1">How to measure onboard:</h4>
                <div className="p-3.5 rounded-2xl bg-canvas border border-border text-ink leading-relaxed">
                  {selectedGuide.how_to_measure}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 mb-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Target Range</span>
                  </div>
                  <span className="text-xs font-semibold text-emerald-950 block">{selectedGuide.normal_range}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200">
                  <span className="text-[11px] font-bold text-rose-800 block mb-1">When to Alert / Escalate</span>
                  <span className="text-xs font-semibold text-rose-950 block">{selectedGuide.when_to_alert}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-border mt-4 flex items-center justify-between">
            <span className="text-xs text-muted">Source: <strong className="text-ink">{selectedGuide.source_name}</strong></span>
            <a
              href={selectedGuide.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-canvas hover:bg-panel text-primary text-xs font-semibold border border-border transition-colors"
            >
              <span>Verify Official Agency Source</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
