// Generated with AI assistance (Antigravity). Reviewed by the team.
import { describe, it, expect } from 'vitest';
import { calculateMedian, calculateMAD, fitRobustBaseline } from '../baseline';
import { scoreMetricValue, calculateRobustZScore, computeCompositeHealthScore } from '../scoring';
import { analyzeMetricTrend } from '../trends';
import { calculateHazardScores } from '../hazards';
import { generateAlertsFromScoring } from '../alerts';
import { MetricKey, Reading } from '../../data/types';

describe('Badr Health Engine — Baseline Module', () => {
  it('correctly calculates median on odd and even length arrays', () => {
    expect(calculateMedian([1, 3, 5])).toBe(3);
    expect(calculateMedian([1, 2, 3, 4])).toBe(2.5);
    expect(calculateMedian([10])).toBe(10);
    expect(calculateMedian([])).toBe(0);
  });

  it('correctly calculates Median Absolute Deviation (MAD)', () => {
    // Array: [1, 2, 3, 4, 5, 6, 7] -> median = 4
    // Deviations from 4: [3, 2, 1, 0, 1, 2, 3] -> sorted: [0, 1, 1, 2, 2, 3, 3] -> median deviation = 2
    expect(calculateMAD([1, 2, 3, 4, 5, 6, 7])).toBe(2);
  });

  it('fits a robust baseline on sample biometric data', () => {
    const heartRates = [66, 68, 67, 70, 65, 69, 68];
    const baseline = fitRobustBaseline('heart_rate', heartRates);
    expect(baseline.metric).toBe('heart_rate');
    expect(baseline.median).toBe(68);
    expect(baseline.mad).toBeGreaterThan(0);
  });
});

describe('Badr Health Engine — Two-Layer Scoring Module', () => {
  it('calculates robust modified z-score accurately', () => {
    const baseline = {
      metric: 'heart_rate' as MetricKey,
      median: 70,
      mad: 4,
      n: 50,
      fitted_at: '2026-10-01',
    };
    // z = 0.6745 * (78 - 70) / 4 = 0.6745 * 2 = 1.35
    expect(calculateRobustZScore(78, baseline)).toBe(1.35);
  });

  it('evaluates hypoxia SpO2 accurately through two layers', () => {
    // Nominal SpO2
    const nominal = scoreMetricValue('spo2', 98);
    expect(nominal.status).toBe('green');

    // Warning SpO2 (92-94%) with wider physiological baseline MAD
    const customBaseline = {
      metric: 'spo2' as MetricKey,
      median: 97.0,
      mad: 1.2,
      n: 50,
      fitted_at: '2026-10-01',
    };
    const warning = scoreMetricValue('spo2', 94, customBaseline);
    expect(warning.status).toBe('orange');
    expect(warning.rule_id).toBe('RULE_HYPOXIA_WARNING');

    // Critical SpO2 (< 92%)
    const critical = scoreMetricValue('spo2', 88);
    expect(critical.status).toBe('red');
    expect(critical.rule_id).toBe('RULE_HYPOXIA_CRITICAL');
  });

  it('computes composite Health Score with environmental weighting and penalties', () => {
    const nominalResults = [
      scoreMetricValue('spo2', 98),
      scoreMetricValue('heart_rate', 68),
      scoreMetricValue('radiation_dose_rate', 22),
    ];
    const nominalScore = computeCompositeHealthScore(nominalResults, 'station', 85, 90);
    expect(nominalScore.score).toBeGreaterThanOrEqual(90);
    expect(nominalScore.status).toBe('green');

    // Hypoxia event simulation
    const hypoxiaResults = [
      scoreMetricValue('spo2', 88), // red
      scoreMetricValue('heart_rate', 115), // red
      scoreMetricValue('radiation_dose_rate', 22),
    ];
    const criticalScore = computeCompositeHealthScore(hypoxiaResults, 'station', 60, 90);
    expect(criticalScore.score).toBeLessThan(70);
    expect(criticalScore.status).toBe('red');
  });
});

describe('Badr Health Engine — Trends Module', () => {
  it('detects upward drift toward warning rails', () => {
    const now = Date.now();
    // Simulate systolic BP creeping up over 5 days: 120 -> 123 -> 126 -> 129
    const points = [
      { time: now - 4 * 86400000, value: 120 },
      { time: now - 3 * 86400000, value: 123 },
      { time: now - 2 * 86400000, value: 126 },
      { time: now - 1 * 86400000, value: 129 },
    ];

    const result = analyzeMetricTrend('blood_pressure_sys', points);
    expect(result.slopePerDay).toBeGreaterThan(0);
    expect(result.projectedValue72h).toBeGreaterThanOrEqual(130);
    expect(result.isDriftingToWarning).toBe(true);
  });
});

describe('Badr Health Engine — Hazards Module', () => {
  it('adapts hazard weights and radiation scores by environment', () => {
    const readings: Record<MetricKey, Reading> = {
      radiation_dose_rate: { id: '1', astronaut_id: 'a', metric: 'radiation_dose_rate', value: 70, unit: 'uSv/h', recorded_at: '', source: 'simulated', status: 'red' },
      spo2: { id: '2', astronaut_id: 'a', metric: 'spo2', value: 98, unit: '%', recorded_at: '', source: 'simulated', status: 'green' },
      cabin_co2: { id: '3', astronaut_id: 'a', metric: 'cabin_co2', value: 1200, unit: 'ppm', recorded_at: '', source: 'simulated', status: 'green' },
      sleep_hours: { id: '4', astronaut_id: 'a', metric: 'sleep_hours', value: 7.5, unit: 'h', recorded_at: '', source: 'simulated', status: 'green' },
      heart_rate: { id: '5', astronaut_id: 'a', metric: 'heart_rate', value: 68, unit: 'bpm', recorded_at: '', source: 'simulated', status: 'green' },
    } as any;

    const stationHazards = calculateHazardScores('station', readings);
    const deepSpaceHazards = calculateHazardScores('spacecraft', readings);

    const stationRad = stationHazards.find((h) => h.hazard === 'radiation');
    const spaceRad = deepSpaceHazards.find((h) => h.hazard === 'radiation');

    expect(spaceRad!.score).toBeGreaterThan(stationRad!.score);
    expect(spaceRad!.weight).toBe(0.35); // 35% radiation weight in deep space
  });
});

describe('Badr Health Engine — Alerts Module', () => {
  it('deduplicates alerts within the 30-minute window', () => {
    const scoring = [scoreMetricValue('spo2', 89)]; // red alert
    const existing = [
      {
        id: 'old-1',
        astronaut_id: 'ast-01',
        metric: 'spo2' as MetricKey,
        level: 'red' as const,
        rule_id: 'RULE_HYPOXIA_CRITICAL',
        message: 'SpO2 critical',
        created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 min ago
      },
    ];

    const alerts = generateAlertsFromScoring(scoring, {
      astronautId: 'ast-01',
      commsDelaySeconds: 145,
      existingAlerts: existing,
    });

    expect(alerts.length).toBe(0); // Deduplicated!
  });

  it('performs compound escalation from orange to red when related warnings persist > 2h', () => {
    // Current warning: systolic blood pressure elevated into orange (130 mmHg, z ~ 2.7)
    const customBpBaseline = {
      metric: 'blood_pressure_sys' as MetricKey,
      median: 120,
      mad: 3.5,
      n: 50,
      fitted_at: '2026-10-01',
    };
    const scoring = [scoreMetricValue('blood_pressure_sys', 131, customBpBaseline)]; // orange (z ~ 2.11)
    expect(scoring[0].status).toBe('orange');

    // Related warning that has persisted for 2.5 hours: elevated heart rate
    const existing = [
      {
        id: 'cardio-warn-1',
        astronaut_id: 'ast-01',
        metric: 'heart_rate' as MetricKey,
        level: 'orange' as const,
        rule_id: 'RULE_CARDIO_OBSERVE',
        message: 'HR elevated',
        created_at: new Date(Date.now() - 2.5 * 3600 * 1000).toISOString(), // 2.5 h ago
      },
    ];

    const alerts = generateAlertsFromScoring(scoring, {
      astronautId: 'ast-01',
      commsDelaySeconds: 145,
      existingAlerts: existing,
    });

    expect(alerts.length).toBe(1);
    expect(alerts[0].level).toBe('red'); // Escalated to red!
    expect(alerts[0].message).toContain('[COMPOUND ESCALATION]');
  });
});
