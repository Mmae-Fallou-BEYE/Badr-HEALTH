// Generated with AI assistance; integrates the supplied BioMistral package.
import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CircleHelp,
  HeartPulse,
  LoaderCircle,
  MessageSquareText,
  ShieldAlert,
  Sparkles,
  Stethoscope,
} from 'lucide-react';
import {
  analyzeBioMistral,
  checkBioMistralHealth,
  createBioMistralSnapshot,
  BioMistralHealth,
  BioMistralReport,
} from '../../data/biomistral';
import { useAppStore } from '../../data/store';

type AnalysisMode = 'vitals' | 'guided';

export const AssistantPage: React.FC = () => {
  const store = useAppStore();
  const snapshot = useMemo(
    () => createBioMistralSnapshot(
      store.latestReadings,
      store.mission.mission_day,
      store.exerciseMinutesToday,
      store.radiationCumulativeMsv,
      store.isOfflineDemo,
    ),
    [
      store.latestReadings,
      store.mission.mission_day,
      store.exerciseMinutesToday,
      store.radiationCumulativeMsv,
      store.isOfflineDemo,
    ],
  );
  const [mode, setMode] = useState<AnalysisMode>('vitals');
  const [health, setHealth] = useState<BioMistralHealth | null>(null);
  const [healthError, setHealthError] = useState('');
  const [healthCheckCount, setHealthCheckCount] = useState(0);
  const [isCheckingHealth, setIsCheckingHealth] = useState(true);
  const [symptom, setSymptom] = useState('');
  const [duration, setDuration] = useState('');
  const [intensity, setIntensity] = useState<number | null>(null);
  const [report, setReport] = useState<BioMistralReport | null>(null);
  const [reportHasSimulatedData, setReportHasSimulatedData] = useState(false);
  const [error, setError] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    let active = true;
    setIsCheckingHealth(true);
    checkBioMistralHealth()
      .then((result) => {
        if (active) {
          setHealth(result);
          setHealthError('');
        }
      })
      .catch((reason: unknown) => {
        if (active) {
          setHealth(null);
          setHealthError(reason instanceof Error ? reason.message : 'AI service is unavailable.');
        }
      })
      .finally(() => {
        if (active) setIsCheckingHealth(false);
      });
    return () => { active = false; };
  }, [healthCheckCount]);

  const runAnalysis = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsAnalyzing(true);
    setError('');
    setReport(null);
    setReportHasSimulatedData(snapshot.hasSimulatedData);
    try {
      const result = mode === 'guided'
        ? await analyzeBioMistral(snapshot.data, {
            symptom: symptom.trim(),
            duration: duration.trim(),
            intensity: symptom.trim() ? intensity : null,
          })
        : await analyzeBioMistral(snapshot.data);
      setReport(result);
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : 'BioMistral analysis failed.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-10">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
            <Sparkles className="h-4 w-4" />
            On-device AI decision support
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-ink">BioMistral Medical Review</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Generate a structured review from the current crew readings, or add symptom details through a guided intake.
          </p>
        </div>
        <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold ${
          health?.ok && health.model_available
            ? 'border-status-green/30 bg-status-green/10 text-status-green'
            : 'border-status-orange/30 bg-status-orange/10 text-status-orange'
        }`}>
          <span className="h-2 w-2 rounded-full bg-current" />
          {health?.ok && health.model_available
            ? `Local model ready${health.model ? ` · ${health.model}` : ''}`
            : isCheckingHealth ? 'Checking local model…' : 'Local model unavailable'}
        </div>
        {(!health?.ok || !health.model_available) && (
          <button
            type="button"
            onClick={() => setHealthCheckCount((count) => count + 1)}
            disabled={isCheckingHealth}
            className="rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-muted hover:text-ink disabled:opacity-50"
          >
            {isCheckingHealth ? 'Checking…' : 'Check again'}
          </button>
        )}
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(260px,0.7fr)]">
        <section className="rounded-3xl border border-border bg-surface p-6 shadow-soft">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-panel text-primary">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-ink">A local, optional second look</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted">
                Measurements stay on this computer and are sent only to the local BioMistral service. AI output is informational;
                existing threshold alerts remain independent and authoritative for this dashboard.
              </p>
            </div>
          </div>
          {!health?.ok || !health.model_available ? (
            <div className="mt-4 flex gap-2 rounded-2xl border border-status-orange/30 bg-status-orange/10 p-3 text-xs leading-relaxed text-ink">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-status-orange" />
              <span>
                {healthError || health?.error?.message || 'Start Ollama and the BioMistral API to enable analysis.'}
                {' '}The regular dashboard continues to work without AI.
                {healthError.includes('not available in local Ollama') && (
                  <span className="mt-2 block">
                    The model is not installed yet. Run <code className="rounded bg-surface px-1.5 py-0.5 font-mono">ollama pull m/biomistral</code>,
                    then select “Check again”. The download needs about 4.4 GB of disk space.
                  </span>
                )}
              </span>
            </div>
          ) : null}
          {snapshot.hasSimulatedData && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-status-orange/30 bg-status-orange/10 px-3 py-1.5 text-[11px] font-bold text-status-orange">
              <Activity className="h-3.5 w-3.5" />
              SIMULATED INPUT INCLUDED
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-border bg-panel/70 p-5">
          <div className="mb-3 flex items-center gap-2 text-sm font-bold text-ink">
            <HeartPulse className="h-4 w-4 text-primary" />
            Data snapshot
          </div>
          <div className="space-y-2 text-xs text-muted">
            <p><span className="font-semibold text-ink">Crew:</span> {store.astronaut.callsign}</p>
            <p><span className="font-semibold text-ink">Mission day:</span> {store.mission.mission_day}</p>
            <p><span className="font-semibold text-ink">Available fields:</span> {Object.keys(snapshot.data).filter((key) => key !== 'mission_day').length}</p>
            <p className="border-t border-border pt-2">
              Missing values are left out and reported by the model pipeline; no reading is fabricated.
            </p>
          </div>
        </section>
      </div>

      <section className="overflow-hidden rounded-3xl border border-border bg-surface shadow-soft">
        <div className="flex flex-wrap gap-2 border-b border-border p-4">
          <button
            type="button"
            onClick={() => setMode('vitals')}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
              mode === 'vitals' ? 'bg-primary text-white' : 'bg-canvas text-muted hover:text-ink'
            }`}
          >
            <Stethoscope className="h-4 w-4" />
            Analyze current readings
          </button>
          <button
            type="button"
            onClick={() => setMode('guided')}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
              mode === 'guided' ? 'bg-primary text-white' : 'bg-canvas text-muted hover:text-ink'
            }`}
          >
            <MessageSquareText className="h-4 w-4" />
            Guided symptom intake
          </button>
        </div>

        <form onSubmit={runAnalysis} className="space-y-5 p-5 sm:p-6">
          {mode === 'guided' && (
            <div className="grid gap-4 md:grid-cols-3">
              <label className="space-y-2 text-xs font-semibold text-ink">
                What symptoms are you experiencing?
                <textarea
                  value={symptom}
                  onChange={(event) => setSymptom(event.target.value)}
                  maxLength={500}
                  rows={3}
                  placeholder="Describe one or more symptoms, or leave blank."
                  className="w-full resize-y rounded-xl border border-border bg-canvas px-3 py-2.5 text-sm font-normal text-ink outline-none focus:ring-2 focus:ring-primary"
                />
              </label>
              <label className="space-y-2 text-xs font-semibold text-ink">
                When did it start?
                <input
                  value={duration}
                  onChange={(event) => setDuration(event.target.value)}
                  maxLength={128}
                  placeholder="e.g. since this morning"
                  className="w-full rounded-xl border border-border bg-canvas px-3 py-2.5 text-sm font-normal text-ink outline-none focus:ring-2 focus:ring-primary"
                />
                <span className="flex items-center gap-1 font-normal text-muted">
                  <CircleHelp className="h-3.5 w-3.5" />
                  Optional clarification; the AI does not infer a cause.
                </span>
              </label>
              <label className="space-y-2 text-xs font-semibold text-ink">
                Symptom intensity
                <select
                  value={intensity ?? ''}
                  onChange={(event) => setIntensity(event.target.value === '' ? null : Number(event.target.value))}
                  disabled={!symptom.trim()}
                  className="w-full rounded-xl border border-border bg-canvas px-3 py-2.5 text-sm font-normal text-ink outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Not provided</option>
                  {Array.from({ length: 11 }, (_, value) => (
                    <option key={value} value={value}>{value}/10</option>
                  ))}
                </select>
                <span className="block font-normal text-muted">Only included when you choose a value.</span>
              </label>
              <p className="md:col-span-3 rounded-xl bg-canvas px-3 py-2 text-xs text-muted">
                Guided intake collects your words and optional details. It is not an open-ended chatbot; answers are included
                in the structured report request.
              </p>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <p className="max-w-xl text-xs leading-relaxed text-muted">
              This request uses a snapshot of the latest available readings. BioMistral can take time to respond on a local computer.
            </p>
            <button
              type="submit"
              disabled={isAnalyzing}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isAnalyzing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {isAnalyzing ? 'Analyzing locally…' : 'Generate medical review'}
              {!isAnalyzing && <ArrowRight className="h-4 w-4" />}
            </button>
          </div>
        </form>
      </section>

      {error && (
        <div role="alert" className="flex items-start gap-3 rounded-2xl border border-status-red/30 bg-status-red/10 p-4 text-sm text-ink">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-status-red" />
          <div>
            <p className="font-bold">Analysis was not completed</p>
            <p className="mt-1 text-muted">{error}</p>
          </div>
        </div>
      )}

      {report && <ReportCard report={report} simulated={reportHasSimulatedData} />}
    </div>
  );
};

const ReportCard: React.FC<{ report: BioMistralReport; simulated: boolean }> = ({ report, simulated }) => (
  <section className="space-y-5 rounded-3xl border border-border bg-surface p-5 shadow-soft sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
      <div>
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <h2 className="text-xl font-extrabold text-ink">Structured AI report</h2>
          {simulated && <span className="rounded-full bg-status-orange/10 px-2.5 py-1 text-[10px] font-bold text-status-orange">SIMULATED DATA</span>}
          {report.validation.needs_review && <span className="rounded-full bg-status-red/10 px-2.5 py-1 text-[10px] font-bold text-status-red">REVIEW REQUIRED</span>}
        </div>
        <p className="text-xs text-muted">
          {report.model.name || 'BioMistral'} · {new Date(report.generated_at).toLocaleString()}
        </p>
      </div>
      <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${
        report.report.risk_level.toLowerCase() === 'high'
          ? 'bg-status-red/10 text-status-red'
          : report.report.risk_level.toLowerCase() === 'moderate'
            ? 'bg-status-orange/10 text-status-orange'
            : 'bg-status-green/10 text-status-green'
      }`}>
        {report.report.risk_level} risk
      </span>
    </div>

    {report.input.missing_fields.length > 0 && (
      <div className="rounded-xl bg-panel p-3 text-xs text-muted">
        Missing core fields: {report.input.missing_fields.join(', ')}
      </div>
    )}

    <div>
      <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-primary">Overall assessment</h3>
      <p className="text-sm leading-relaxed text-ink">{report.report.overall_assessment}</p>
    </div>

    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-2xl border border-border p-4">
        <h3 className="mb-2 text-sm font-bold text-ink">Flight surgeon review</h3>
        <p className="text-sm text-ink">{report.report.contact_flight_surgeon.decision}</p>
        <p className="mt-1 text-xs leading-relaxed text-muted">{report.report.contact_flight_surgeon.reason}</p>
      </div>
      <div className="rounded-2xl border border-border p-4">
        <h3 className="mb-2 text-sm font-bold text-ink">Recommendations</h3>
        {report.report.recommendations.length ? (
          <ul className="space-y-1.5 text-xs text-muted">
            {report.report.recommendations.map((item, index) => <li key={`${index}-${item}`}>• {item}</li>)}
          </ul>
        ) : <p className="text-xs text-muted">No recommendations were returned.</p>}
      </div>
    </div>

    {report.red_flags && (
      <div className="rounded-2xl border border-status-orange/30 bg-status-orange/5 p-4">
        <h3 className="mb-2 text-sm font-bold text-ink">
          Deterministic screening flags · {report.red_flags.highest_severity}
        </h3>
        {report.red_flags.flags.length ? (
          <ul className="space-y-2 text-xs text-ink">
            {report.red_flags.flags.map((flag) => (
              <li key={flag.code}>
                <strong>{flag.severity}: {flag.message}</strong>
                <span className="ml-1 text-muted">Observed {flag.observed} {flag.unit}; threshold {flag.threshold}.</span>
              </li>
            ))}
          </ul>
        ) : <p className="text-xs text-muted">No deterministic screening flags were raised.</p>}
        <p className="mt-2 text-[11px] text-muted">{report.red_flags.note}</p>
      </div>
    )}

    {report.validation.warnings.length > 0 && (
      <div className="rounded-2xl border border-status-orange/30 bg-status-orange/5 p-4">
        <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-ink">
          <AlertTriangle className="h-4 w-4 text-status-orange" />
          Validation warnings
        </h3>
        <ul className="space-y-1 text-xs text-muted">
          {report.validation.warnings.map((warning, index) => <li key={`${index}-${warning}`}>{warning}</li>)}
        </ul>
      </div>
    )}

    {report.report.detected_abnormalities.length > 0 && (
      <div>
        <h3 className="mb-2 text-sm font-bold text-ink">Observed abnormalities</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {report.report.detected_abnormalities.map((item, index) => (
            <div key={`${item.parameter}-${index}`} className="rounded-xl bg-canvas p-3 text-xs">
              <p className="font-bold text-ink">{item.parameter}: {item.observed}</p>
              <p className="mt-1 text-muted">{item.interpretation}</p>
              <p className="mt-1 text-[10px] text-muted">Evidence: {item.evidence.field} = {item.evidence.value}</p>
            </div>
          ))}
        </div>
      </div>
    )}

    <div className="flex items-start gap-2 border-t border-border pt-4 text-xs leading-relaxed text-muted">
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <p>{report.disclaimer} This output does not replace the dashboard’s deterministic alerts or a qualified clinician.</p>
    </div>
  </section>
);
