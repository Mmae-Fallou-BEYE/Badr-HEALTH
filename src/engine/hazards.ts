// Generated with AI assistance (Antigravity). Reviewed by the team.
import { Environment, HazardScore, MetricKey, Reading } from '../data/types';
import { ENVIRONMENTS } from '../config/environments';

/**
 * Calculates the five NASA HRP hazard scores (0-100) dynamically
 * mapped to environmental context and physiological indicators.
 */
export function calculateHazardScores(
  environment: Environment,
  readings: Record<MetricKey, Reading>
): HazardScore[] {
  const envCfg = ENVIRONMENTS[environment];

  const radVal = readings.radiation_dose_rate?.value ?? 22.0;
  const spo2Val = readings.spo2?.value ?? 98.0;
  const co2Val = readings.cabin_co2?.value ?? 1200.0;
  const sleepVal = readings.sleep_hours?.value ?? 7.6;
  const hrVal = readings.heart_rate?.value ?? 68.0;

  // 1. SPACE RADIATION (0-100)
  // Base environmental background + dosimeter rate
  const envRadMultiplier = environment === 'spacecraft' ? 1.6 : environment === 'moon' ? 1.3 : 1.0;
  const radScore = Math.min(
    100,
    Math.round(((radVal / 60.0) * 60.0 + (environment === 'spacecraft' ? 25 : 5)) * envRadMultiplier)
  );

  // 2. ISOLATION & CONFINEMENT (0-100)
  // Driven by sleep debt, psych status, and mission duration
  const sleepDebtPenalty = Math.max(0, (7.5 - sleepVal) * 15);
  const isolationBase = environment === 'spacecraft' ? 45 : environment === 'moon' ? 35 : 20;
  const isolationScore = Math.min(100, Math.round(isolationBase + sleepDebtPenalty));

  // 3. DISTANCE FROM EARTH (0-100)
  // Determined by radio latency and evacuation timeline
  const distanceScore = environment === 'spacecraft' ? 85 : environment === 'moon' ? 48 : 15;

  // 4. GRAVITY FIELDS (0-100)
  // Microgravity cephalad shift and cardiovascular deconditioning vs partial 1/6g
  const gravityBase = environment === 'station' ? 72 : environment === 'spacecraft' ? 75 : 38;
  const cardioDriftPenalty = hrVal > 85 ? (hrVal - 85) * 0.5 : 0;
  const gravityScore = Math.min(100, Math.round(gravityBase + cardioDriftPenalty));

  // 5. HOSTILE / CLOSED ENVIRONMENTS (0-100)
  // Driven by cabin CO2, SpO2 margins, and lunar dust abrasiveness
  const co2Ratio = (co2Val / 5000.0) * 55;
  const spo2Penalty = Math.max(0, (95 - spo2Val) * 6);
  const regolithDust = environment === 'moon' ? 22 : 5;
  const closedScore = Math.min(100, Math.round(co2Ratio + spo2Penalty + regolithDust));

  return [
    {
      hazard: 'radiation',
      label: 'Space Radiation',
      score: radScore,
      weight: envCfg.hazard_weights.radiation,
      trend: radVal > 35 ? 'up' : 'stable',
      primary_driver: `${radVal} µSv/h (Neutron + GCR flux)`,
    },
    {
      hazard: 'isolation',
      label: 'Isolation & Confinement',
      score: isolationScore,
      weight: envCfg.hazard_weights.isolation,
      trend: sleepVal < 6 ? 'up' : 'stable',
      primary_driver: `Sleep restoration (${sleepVal}h) & circadian status`,
    },
    {
      hazard: 'distance',
      label: 'Distance from Earth',
      score: distanceScore,
      weight: envCfg.hazard_weights.distance,
      trend: 'stable',
      primary_driver: `${envCfg.comms_delay_s}s downlink latency to ground`,
    },
    {
      hazard: 'gravity',
      label: 'Altered Gravity Fields',
      score: gravityScore,
      weight: envCfg.hazard_weights.gravity,
      trend: 'stable',
      primary_driver: environment === 'moon' ? '0.165 g partial gravity biomechanics' : 'Microgravity fluid shift & bone loss',
    },
    {
      hazard: 'closed_env',
      label: 'Hostile Closed Environment',
      score: closedScore,
      weight: envCfg.hazard_weights.closed_env,
      trend: co2Val > 3000 ? 'up' : 'stable',
      primary_driver: `Cabin CO₂ ${co2Val} ppm & SpO₂ ${spo2Val}%`,
    },
  ];
}
