// Generated with AI assistance (Antigravity). Reviewed by the team.
import { Alert, AlertLevel, MetricKey } from '../data/types';
import { MetricScoringResult } from './scoring';

export interface AlertGenerationContext {
  astronautId: string;
  commsDelaySeconds: number;
  existingAlerts: Alert[];
}

// Related metrics mapping for compound escalation:
// e.g. elevated heart rate + elevated blood pressure, or low SpO2 + elevated CO2
const RELATED_METRIC_CLUSTERS: Record<MetricKey, MetricKey[]> = {
  heart_rate: ['blood_pressure_sys', 'spo2'],
  blood_pressure_sys: ['heart_rate', 'blood_pressure_dia'],
  blood_pressure_dia: ['blood_pressure_sys'],
  spo2: ['cabin_co2', 'heart_rate'],
  cabin_co2: ['spo2', 'heart_rate'],
  radiation_dose_rate: ['body_temp'],
  body_temp: ['radiation_dose_rate', 'heart_rate'],
  sleep_hours: ['mood'],
  mood: ['sleep_hours'],
  glucose: [],
};

const AUTONOMOUS_PROTOCOLS: Partial<Record<MetricKey, string>> = {
  spo2: '1. Don emergency quick-don O₂ mask immediately.\n2. Confirm cabin total pressure (nominal 14.7 psi) and ppO₂.\n3. If in EVA suit, verify umbilical line flow and seal integrity.',
  radiation_dose_rate: '1. Sound storm shelter alert to crew.\n2. Retreat to designated radiation storm shelter module.\n3. Position auxiliary polyethylene and water wall ballast.',
  blood_pressure_sys: '1. Cease physical countermeasure exertion.\n2. Assume supine posture with legs lowered.\n3. Repeat manual cuff measurement in 15 minutes; report visual artifacts.',
  cabin_co2: '1. Inspect habitat CDRA (Carbon Dioxide Removal Assembly) beds.\n2. Engage backup Metox absorption loop.\n3. Deploy portable ventilation ducts to eliminate microgravity CO₂ stagnation pockets.',
};

/**
 * Evaluates scoring results and produces deduplicated, compound-escalated alerts
 */
export function generateAlertsFromScoring(
  scoringResults: MetricScoringResult[],
  context: AlertGenerationContext
): Alert[] {
  const generatedAlerts: Alert[] = [];
  const now = new Date();
  const thirtyMinutesAgo = now.getTime() - 30 * 60 * 1000;
  const twoHoursAgo = now.getTime() - 2 * 60 * 60 * 1000;

  // Build lookup of active orange alerts that have persisted for more than 2 hours (up to 24 hours)
  const twentyFourHoursAgo = now.getTime() - 24 * 60 * 60 * 1000;
  const recentOrangeAlerts = context.existingAlerts.filter((a) => {
    const alertTime = new Date(a.created_at).getTime();
    return a.level === 'orange' && alertTime <= twoHoursAgo && alertTime >= twentyFourHoursAgo && !a.acknowledged_at;
  });

  scoringResults.forEach((result) => {
    if (result.status === 'green') return;

    // Check 30-min deduplication for same rule
    const isDuplicate = context.existingAlerts.some((existing) => {
      const existingTime = new Date(existing.created_at).getTime();
      return (
        existing.rule_id === result.rule_id &&
        existing.metric === result.metric &&
        existingTime >= thirtyMinutesAgo &&
        !existing.acknowledged_at
      );
    });

    if (isDuplicate) return;

    let finalLevel: AlertLevel = result.status;
    let message = result.reason;

    // Compound escalation rule:
    // If current is orange, check if a related metric has had an active orange alert for > 2 hours
    if (result.status === 'orange') {
      const relatedMetrics = RELATED_METRIC_CLUSTERS[result.metric] || [];
      const hasPersistingRelatedOrange = recentOrangeAlerts.some((recent) =>
        relatedMetrics.includes(recent.metric)
      );

      if (hasPersistingRelatedOrange) {
        finalLevel = 'red';
        message = `[COMPOUND ESCALATION] ${result.reason}. Multiple related physiological warnings persisted > 2 hours.`;
      }
    }

    const autonomousProtocol = AUTONOMOUS_PROTOCOLS[result.metric];

    generatedAlerts.push({
      id: `alert-${result.metric}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      astronaut_id: context.astronautId,
      metric: result.metric,
      level: finalLevel,
      rule_id: result.rule_id,
      message,
      created_at: now.toISOString(),
      autonomous_protocol: autonomousProtocol,
      source_url: 'https://www.nasa.gov/hrp/risks/',
    });
  });

  return generatedAlerts;
}
