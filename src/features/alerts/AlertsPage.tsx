// Generated with AI assistance (Antigravity). Reviewed by the team.
import React, { useState } from 'react';
import {
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  FileText,
  Radio,
  ExternalLink,
  ShieldAlert,
  Send,
} from 'lucide-react';
import { useAppStore } from '../../data/store';
import { ENVIRONMENTS } from '../../config/environments';

export const AlertsPage: React.FC = () => {
  const { alerts, environment, acknowledgeAlert } = useAppStore();
  const currentEnv = ENVIRONMENTS[environment];
  const [selectedAlertProtocol, setSelectedAlertProtocol] = useState<string | null>(null);

  const isAutonomousMode = currentEnv.comms_delay_s > 60;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-ink">Mission Health Alerts & Escalation</h2>
          <p className="text-xs text-muted">
            Three-tier autonomous alert engine with personal baseline z-scores and NASA safety rails.
          </p>
        </div>

        {/* Autonomous mode banner if delay > 60s */}
        {isAutonomousMode ? (
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold">
            <Radio className="w-4 h-4 text-status-orange animate-pulse" />
            <span>Autonomous Mode Active (Latency: {currentEnv.comms_delay_s}s)</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-status-green" />
            <span>Near Real-time Ground Downlink ({currentEnv.comms_delay_s}s)</span>
          </div>
        )}
      </div>

      {/* Persistent Medical Disclaimer on Alert Screen */}
      <div className="p-4 rounded-2xl bg-panel border border-border flex items-center justify-between">
        <div className="flex items-center gap-2.5 text-xs text-ink font-medium">
          <ShieldAlert className="w-4 h-4 text-primary shrink-0" />
          <span>
            <strong>Medical Disclaimer:</strong> Decision-support tool. It does not replace a flight surgeon and does not provide medical diagnoses.
          </span>
        </div>
        <span className="text-[11px] text-muted">NASA HRP Bio-Safety Standard</span>
      </div>

      {/* ALERTS TIMELINE */}
      <div className="space-y-4">
        {alerts.length === 0 ? (
          <div className="p-12 text-center bg-surface rounded-3xl border border-border">
            <CheckCircle2 className="w-10 h-10 text-status-green mx-auto mb-2" />
            <h3 className="font-bold text-base text-ink">No Active Warnings or Critical Alerts</h3>
            <p className="text-xs text-muted mt-1">
              All physiological vitals and environmental metrics remain strictly within nominal thresholds.
            </p>
          </div>
        ) : (
          alerts.map((item) => {
            const isRed = item.level === 'red';
            const isAck = !!item.acknowledged_at;

            return (
              <div
                key={item.id}
                className={`p-6 rounded-3xl border transition-all ${
                  isAck
                    ? 'bg-surface/60 border-border opacity-70'
                    : isRed
                    ? 'bg-rose-50/40 border-rose-200 shadow-soft'
                    : 'bg-amber-50/40 border-amber-200 shadow-soft'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                        isRed
                          ? 'bg-rose-100 text-status-red'
                          : 'bg-amber-100 text-status-orange'
                      }`}
                    >
                      {isRed ? <AlertOctagon className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full text-white ${
                            isRed ? 'bg-status-red' : 'bg-status-orange'
                          }`}
                        >
                          Level: {item.level}
                        </span>
                        <span className="text-xs font-mono font-bold text-muted">{item.rule_id}</span>
                        <span className="text-xs text-muted">• {new Date(item.created_at).toLocaleTimeString()}</span>
                      </div>

                      <h4 className="text-base font-bold text-ink mt-1.5">{item.message}</h4>

                      {/* Autonomous action checklist */}
                      {item.autonomous_protocol && (
                        <div className="mt-3 p-3.5 rounded-2xl bg-surface border border-border text-xs leading-relaxed text-ink">
                          <strong className="text-primary block mb-1">Recommended Action Protocol:</strong>
                          <p className="whitespace-pre-line font-mono text-[11px]">{item.autonomous_protocol}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action buttons (Autonomy first if delay > 60s) */}
                  <div className="flex flex-col gap-2 shrink-0 items-end">
                    {item.autonomous_protocol && isAutonomousMode && (
                      <button
                        onClick={() => setSelectedAlertProtocol(item.autonomous_protocol || null)}
                        className="px-3.5 py-1.5 rounded-xl bg-primary text-white text-xs font-semibold shadow-soft hover:bg-primary-hover flex items-center gap-1.5"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Autonomous SOP</span>
                      </button>
                    )}

                    <button
                      onClick={() => window.alert(`Direct telemetry ping scheduled for Flight Surgeon (downlink delay: ${currentEnv.comms_delay_s}s).`)}
                      className="px-3 py-1.5 rounded-xl bg-surface hover:bg-panel text-muted hover:text-ink text-xs font-medium border border-border flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Contact Surgeon</span>
                    </button>

                    {!isAck ? (
                      <button
                        onClick={() => acknowledgeAlert(item.id)}
                        className="text-xs text-primary font-bold hover:underline mt-1"
                      >
                        Acknowledge Alert
                      </button>
                    ) : (
                      <span className="text-[11px] text-muted flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-status-green" /> Acknowledged
                      </span>
                    )}
                  </div>
                </div>

                {item.source_url && (
                  <div className="mt-4 pt-3 border-t border-border/60 flex justify-between text-xs text-muted">
                    <span>Deduplicated in 30-min window</span>
                    <a
                      href={item.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1"
                    >
                      <span>NASA Evidence Source</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* PROTOCOL MODAL */}
      {selectedAlertProtocol && (
        <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-border">
            <h3 className="text-base font-bold text-ink mb-2">Step-by-Step Autonomous SOP</h3>
            <div className="p-4 rounded-2xl bg-canvas border border-border font-mono text-xs whitespace-pre-wrap leading-relaxed text-ink my-3">
              {selectedAlertProtocol}
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setSelectedAlertProtocol(null)}
                className="px-4 py-2 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary-hover"
              >
                Close Protocol
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
