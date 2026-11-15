// Generated with AI assistance (Antigravity). Reviewed by the team.
import { MetricKey } from '../data/types';
import { METRIC_THRESHOLDS } from '../config/thresholds';

export interface TrendAnalysisResult {
  metric: MetricKey;
  currentValue: number;
  projectedValue72h: number;
  slopePerDay: number;
  isDriftingToWarning: boolean;
  warningHorizonHours?: number;
  message: string;
}

/**
 * Computes exponentially weighted moving slope over time series data
 */
export function calculateExponentialSlope(
  points: Array<{ time: number; value: number }>,
  alpha = 0.3
): number {
  if (points.length < 2) return 0;

  // Sort chronologically
  const sorted = [...points].sort((a, b) => a.time - b.time);
  let weightedSlope = 0;
  let weightSum = 0;

  for (let i = 1; i < sorted.length; i++) {
    const dtDays = (sorted[i].time - sorted[i - 1].time) / (1000 * 3600 * 24);
    if (dtDays > 0) {
      const instantaneousSlope = (sorted[i].value - sorted[i - 1].value) / dtDays;
      const weight = Math.pow(1 - alpha, sorted.length - 1 - i);
      weightedSlope += instantaneousSlope * weight;
      weightSum += weight;
    }
  }

  return weightSum > 0 ? weightedSlope / weightSum : 0;
}

/**
 * Analyzes whether an astronaut's metric is drifting towards an orange/warning threshold within 72 hours
 */
export function analyzeMetricTrend(
  metric: MetricKey,
  points: Array<{ time: number; value: number }>
): TrendAnalysisResult {
  if (points.length === 0) {
    return {
      metric,
      currentValue: 0,
      projectedValue72h: 0,
      slopePerDay: 0,
      isDriftingToWarning: false,
      message: 'Insufficient historical data points',
    };
  }

  const latestVal = points[points.length - 1].value;
  const slopePerDay = calculateExponentialSlope(points);
  const projected72h = Number((latestVal + slopePerDay * 3.0).toFixed(2));
  const threshold = METRIC_THRESHOLDS[metric];

  let isDriftingToWarning = false;
  let message = 'Trend stable within expected variance';

  if (threshold) {
    const [orangeMin, orangeMax] = threshold.orange;

    // Check if projecting upwards into orange
    if (slopePerDay > 0 && latestVal < orangeMin && projected72h >= orangeMin) {
      isDriftingToWarning = true;
      const hoursToCross = ((orangeMin - latestVal) / slopePerDay) * 24;
      message = `Upward drift detected: projected to cross warning rail (${orangeMin} ${threshold.unit}) in ~${Math.round(hoursToCross)} hours.`;
    }
    // Check if projecting downwards into orange
    else if (slopePerDay < 0 && latestVal > orangeMax && projected72h <= orangeMax) {
      isDriftingToWarning = true;
      const hoursToCross = ((latestVal - orangeMax) / Math.abs(slopePerDay)) * 24;
      message = `Downward drift detected: projected to cross warning rail (${orangeMax} ${threshold.unit}) in ~${Math.round(hoursToCross)} hours.`;
    }
  }

  return {
    metric,
    currentValue: latestVal,
    projectedValue72h: projected72h,
    slopePerDay: Number(slopePerDay.toFixed(2)),
    isDriftingToWarning,
    message,
  };
}
