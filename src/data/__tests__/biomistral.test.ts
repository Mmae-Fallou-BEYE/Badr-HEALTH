// Generated with AI assistance; tests the BioMistral input mapping.
import { describe, expect, it } from 'vitest';
import { createBioMistralSnapshot } from '../biomistral';
import type { MetricKey, Reading } from '../types';

function reading(metric: MetricKey, value: number, source: Reading['source'] = 'sensor'): Reading {
  return {
    id: `${metric}-1`,
    astronaut_id: 'ast-01',
    metric,
    value,
    unit: '',
    recorded_at: '2026-11-15T00:00:00.000Z',
    source,
    status: 'green',
  };
}

describe('createBioMistralSnapshot', () => {
  it('maps only available readings and labels simulated inputs', () => {
    const snapshot = createBioMistralSnapshot(
      {
        heart_rate: reading('heart_rate', 81, 'simulated'),
        blood_pressure_sys: reading('blood_pressure_sys', 121),
      },
      42,
      65,
      42.15,
      false,
    );

    expect(snapshot.data).toEqual({ mission_day: 42, heart_rate_bpm: 81, exercise_minutes: 65 });
    expect(snapshot.hasSimulatedData).toBe(true);
  });

  it('combines blood pressure only when both values are present', () => {
    const snapshot = createBioMistralSnapshot(
      {
        blood_pressure_sys: reading('blood_pressure_sys', 120),
        blood_pressure_dia: reading('blood_pressure_dia', 80),
        spo2: reading('spo2', 98),
      },
      3,
      0,
      0,
      false,
    );

    expect(snapshot.data.blood_pressure).toEqual({ systolic: 120, diastolic: 80 });
    expect(snapshot.data.spo2_pct).toBe(98);
    expect(snapshot.hasSimulatedData).toBe(false);
  });

  it('marks demo-mode snapshots as simulated even when a value was manually entered', () => {
    const snapshot = createBioMistralSnapshot(
      { heart_rate: reading('heart_rate', 72, 'manual') },
      1,
      0,
      0,
      true,
    );

    expect(snapshot.hasSimulatedData).toBe(true);
  });
});
