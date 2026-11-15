// Generated with AI assistance (Antigravity). Reviewed by the team.
import { MetricKey } from '../data/types';

export interface MetricBaseline {
  metric: MetricKey;
  median: number;
  mad: number; // Median Absolute Deviation
  n: number;
  fitted_at: string;
}

export type PersonalBaselines = Record<MetricKey, MetricBaseline>;

/**
 * Calculates the statistical median of a numeric array
 */
export function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Calculates Median Absolute Deviation (MAD):
 * MAD = median(|x_i - median(X)|)
 */
export function calculateMAD(values: number[], median?: number): number {
  if (values.length === 0) return 1.0;
  const med = median !== undefined ? median : calculateMedian(values);
  const deviations = values.map((v) => Math.abs(v - med));
  const mad = calculateMedian(deviations);
  // Prevent division by zero: minimum MAD floor of 0.001
  return mad === 0 ? 0.001 : mad;
}

/**
 * Fits a robust baseline (median and MAD) for a series of values
 */
export function fitRobustBaseline(metric: MetricKey, values: number[]): MetricBaseline {
  const median = calculateMedian(values);
  const mad = calculateMAD(values, median);
  return {
    metric,
    median: Number(median.toFixed(2)),
    mad: Number(mad.toFixed(3)),
    n: values.length,
    fitted_at: new Date().toISOString(),
  };
}

/**
 * Default fallback baselines for healthy adult astronaut in spaceflight
 */
export const DEFAULT_ASTRONAUT_BASELINES: PersonalBaselines = {
  heart_rate: { metric: 'heart_rate', median: 68.0, mad: 3.5, n: 100, fitted_at: '2026-10-01T00:00:00Z' },
  spo2: { metric: 'spo2', median: 98.0, mad: 0.8, n: 100, fitted_at: '2026-10-01T00:00:00Z' },
  body_temp: { metric: 'body_temp', median: 36.8, mad: 0.15, n: 100, fitted_at: '2026-10-01T00:00:00Z' },
  blood_pressure_sys: { metric: 'blood_pressure_sys', median: 118.0, mad: 3.0, n: 100, fitted_at: '2026-10-01T00:00:00Z' },
  blood_pressure_dia: { metric: 'blood_pressure_dia', median: 76.0, mad: 2.0, n: 100, fitted_at: '2026-10-01T00:00:00Z' },
  glucose: { metric: 'glucose', median: 88.0, mad: 4.0, n: 100, fitted_at: '2026-10-01T00:00:00Z' },
  sleep_hours: { metric: 'sleep_hours', median: 7.6, mad: 0.5, n: 14, fitted_at: '2026-10-01T00:00:00Z' },
  mood: { metric: 'mood', median: 4.4, mad: 0.4, n: 14, fitted_at: '2026-10-01T00:00:00Z' },
  cabin_co2: { metric: 'cabin_co2', median: 1250.0, mad: 80.0, n: 100, fitted_at: '2026-10-01T00:00:00Z' },
  radiation_dose_rate: { metric: 'radiation_dose_rate', median: 22.0, mad: 2.0, n: 100, fitted_at: '2026-10-01T00:00:00Z' },
};
