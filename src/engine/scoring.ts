// Generated with AI assistance (Antigravity). Reviewed by the team.
import { MetricKey, AlertLevel, HealthScoreBreakdown, Environment } from '../data/types';
import { METRIC_THRESHOLDS } from '../config/thresholds';
import { MetricBaseline, DEFAULT_ASTRONAUT_BASELINES } from './baseline';
import { ENVIRONMENTS } from '../config/environments';

export interface MetricScoringResult {
  metric: MetricKey;
  value: number;
  status: AlertLevel;
  z: number;
  rule_id: string;
  reason: string;
  layerWon: 'layer1_personal_zscore' | 'layer2_nasa_safety_rails' | 'nominal';
}

/**
 * Computes robust modified z-score:
 * z = 0.6745 * (x - median) / MAD
 */
export function calculateRobustZScore(value: number, baseline: MetricBaseline): number {
  if (!baseline || baseline.mad === 0) return 0;
  return Number(((0.6745 * (value - baseline.median)) / baseline.mad).toFixed(2));
}

/**
 * Two-layer scoring function:
 * Layer 1: Personal baseline robust z-score (|z| >= 2 orange, |z| >= 3.5 red)
 * Layer 2: Absolute safety rails from NASA HRP / Clinical thresholds
 * The more severe status wins.
 */
export function scoreMetricValue(
  metric: MetricKey,
  value: number,
  customBaseline?: MetricBaseline
): MetricScoringResult {
  const baseline = customBaseline || DEFAULT_ASTRONAUT_BASELINES[metric];
  const threshold = METRIC_THRESHOLDS[metric];

  // 1. LAYER 1: ROBUST Z-SCORE AGAINST PERSONAL BASELINE
  const z = baseline ? calculateRobustZScore(value, baseline) : 0;
  let layer1Status: AlertLevel = 'green';
  let layer1Reason = `Within personal baseline (z = ${z})`;

  const absZ = Math.abs(z);
  if (absZ >= 3.5) {
    layer1Status = 'red';
    layer1Reason = `Extreme deviation from personal baseline (z = ${z}, |z| ≥ 3.5)`;
  } else if (absZ >= 2.0) {
    layer1Status = 'orange';
    layer1Reason = `Significant deviation from personal baseline (z = ${z}, |z| ≥ 2.0)`;
  }

  // 2. LAYER 2: ABSOLUTE NASA SAFETY RAILS
  let layer2Status: AlertLevel = 'green';
  let layer2Reason = 'Within terrestrial and spaceflight physiological rails';
  let layer2Rule = 'RULE_PHYSIO_NOMINAL';

  if (threshold) {
    if (metric === 'spo2') {
      if (value < 92) {
        layer2Status = 'red';
        layer2Reason = `SpO₂ ${value}% below critical hypoxia threshold (< 92%)`;
        layer2Rule = 'RULE_HYPOXIA_CRITICAL';
      } else if (value <= 94) {
        layer2Status = 'orange';
        layer2Reason = `SpO₂ ${value}% in sub-optimal hypoxia caution zone (92–94%)`;
        layer2Rule = 'RULE_HYPOXIA_WARNING';
      }
    } else if (metric === 'heart_rate') {
      if (value > 110 || value < 40) {
        layer2Status = 'red';
        layer2Reason = `Resting heart rate ${value} bpm outside safe bounds (>110 or <40 bpm)`;
        layer2Rule = 'RULE_CARDIO_CRITICAL';
      } else if (value > 90 || value < 50) {
        layer2Status = 'orange';
        layer2Reason = `Resting heart rate ${value} bpm in observation window`;
        layer2Rule = 'RULE_CARDIO_OBSERVE';
      }
    } else if (metric === 'blood_pressure_sys') {
      if (value >= 140) {
        layer2Status = 'red';
        layer2Reason = `Systolic pressure ${value} mmHg indicates acute hypertension`;
        layer2Rule = 'RULE_BP_HYPERTENSION';
      } else if (value >= 130) {
        layer2Status = 'orange';
        layer2Reason = `Systolic pressure ${value} mmHg in pre-hypertensive drift zone`;
        layer2Rule = 'RULE_BP_DRIFT_WARN';
      }
    } else if (metric === 'radiation_dose_rate') {
      if (value >= 60) {
        layer2Status = 'red';
        layer2Reason = `Radiation dose rate ${value} µSv/h exceeds SPE emergency threshold`;
        layer2Rule = 'RULE_RADIATION_SPE_CRITICAL';
      } else if (value >= 25) {
        layer2Status = 'orange';
        layer2Reason = `Radiation dose rate ${value} µSv/h elevated above nominal GCR background`;
        layer2Rule = 'RULE_RADIATION_ELEVATED';
      }
    } else if (metric === 'cabin_co2') {
      if (value >= 5000) {
        layer2Status = 'red';
        layer2Reason = `Cabin CO₂ ${value} ppm exceeded maximum scrubber limit`;
        layer2Rule = 'RULE_CO2_CRITICAL';
      } else if (value >= 3000) {
        layer2Status = 'orange';
        layer2Reason = `Cabin CO₂ ${value} ppm approaching scrubber saturation`;
        layer2Rule = 'RULE_CO2_WARNING';
      }
    } else if (metric === 'sleep_hours') {
      if (value < 5.5) {
        layer2Status = 'red';
        layer2Reason = `Sleep ${value}h critically insufficient for cognitive retention`;
        layer2Rule = 'RULE_SLEEP_CRITICAL';
      } else if (value < 7.0) {
        layer2Status = 'orange';
        layer2Reason = `Sleep ${value}h below recommended crew rest target`;
        layer2Rule = 'RULE_SLEEP_SUBTARGET';
      }
    } else if (metric === 'mood') {
      if (value < 2.0) {
        layer2Status = 'red';
        layer2Reason = `Psychological rating ${value}/5 indicates severe stress`;
        layer2Rule = 'RULE_PSYCH_CRITICAL';
      } else if (value < 3.0) {
        layer2Status = 'orange';
        layer2Reason = `Psychological rating ${value}/5 in caution bracket`;
        layer2Rule = 'RULE_PSYCH_CAUTION';
      }
    }
  }

  // 3. WORSE OF THE TWO LAYERS WINS
  const severityRank: Record<AlertLevel, number> = { green: 1, orange: 2, red: 3 };

  if (severityRank[layer2Status] > severityRank[layer1Status]) {
    return {
      metric,
      value,
      status: layer2Status,
      z,
      rule_id: layer2Rule,
      reason: layer2Reason,
      layerWon: 'layer2_nasa_safety_rails',
    };
  } else if (severityRank[layer1Status] > severityRank[layer2Status]) {
    return {
      metric,
      value,
      status: layer1Status,
      z,
      rule_id: `RULE_${metric.toUpperCase()}_BASELINE_ZSCORE`,
      reason: layer1Reason,
      layerWon: 'layer1_personal_zscore',
    };
  } else {
    return {
      metric,
      value,
      status: layer1Status,
      z,
      rule_id: layer2Status !== 'green' ? layer2Rule : 'RULE_PHYSIO_NOMINAL',
      reason: layer2Status !== 'green' ? layer2Reason : layer1Reason,
      layerWon: layer1Status === 'green' ? 'nominal' : 'layer1_personal_zscore',
    };
  }
}

/**
 * Computes composite Health Score (0-100) based on metric statuses,
 * environmental hazard weights, and countermeasure exercise compliance.
 */
export function computeCompositeHealthScore(
  metricResults: MetricScoringResult[],
  environment: Environment = 'station',
  exerciseMinutes = 65,
  targetExerciseMinutes = 90
): HealthScoreBreakdown {
  const envCfg = ENVIRONMENTS[environment];
  let baseScore = 98;

  // Penalties from metric statuses
  metricResults.forEach((res) => {
    if (res.status === 'red') baseScore -= 18;
    else if (res.status === 'orange') baseScore -= 7;
  });

  // Environmental weighting adaptation
  const radMetric = metricResults.find((r) => r.metric === 'radiation_dose_rate');
  if (radMetric && radMetric.status !== 'green') {
    baseScore -= envCfg.hazard_weights.radiation * (radMetric.status === 'red' ? 12 : 5);
  }

  // Exercise countermeasure adherence (90 min NASA target)
  const exerciseAdherence = Math.min(100, Math.round((exerciseMinutes / targetExerciseMinutes) * 100));
  if (exerciseAdherence < 50) baseScore -= 5;

  const score = Math.max(15, Math.min(99, Math.round(baseScore)));
  let status: AlertLevel = 'green';
  if (score < 65) status = 'red';
  else if (score < 82) status = 'orange';

  return {
    score,
    trend: score >= 85 ? 'improving' : score >= 70 ? 'stable' : 'declining',
    change24h: score >= 85 ? +2 : score >= 70 ? -1 : -8,
    status,
    components: {
      vitals_stability: Math.max(20, Math.min(100, Math.round(score * 1.05))),
      hazard_resilience: Math.max(25, Math.min(100, 100 - Math.round(envCfg.hazard_weights.radiation * 50))),
      countermeasure_adherence: exerciseAdherence,
      sleep_restoration: 88,
    },
  };
}
