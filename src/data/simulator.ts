// Generated with AI assistance (Antigravity). Reviewed by the team.
import { MetricKey, Reading, Scenario, Alert, Environment } from './types';
import { METRIC_THRESHOLDS } from '../config/thresholds';

export interface SimulatedState {
  step: number;
  scenario: Scenario;
  environment: Environment;
  values: Record<MetricKey, number>;
  radiation_cumulative_msv: number;
}

export function createInitialSimulatedState(environment: Environment = 'station'): SimulatedState {
  return {
    step: 0,
    scenario: 'nominal',
    environment,
    values: {
      heart_rate: 68,
      spo2: 98,
      body_temp: 36.8,
      blood_pressure_sys: 118,
      blood_pressure_dia: 76,
      glucose: 88,
      sleep_hours: 7.8,
      mood: 4.5,
      cabin_co2: 1250,
      radiation_dose_rate: 22.4,
    },
    radiation_cumulative_msv: 42.15,
  };
}

export function stepSimulation(current: SimulatedState): {
  nextState: SimulatedState;
  newReadings: Reading[];
  newAlerts: Alert[];
} {
  const step = current.step + 1;
  const values = { ...current.values };
  const now = new Date().toISOString();
  let cumulativeRadiation = current.radiation_cumulative_msv;

  // Add subtle natural noise
  const noise = (amplitude: number) => (Math.random() - 0.5) * 2 * amplitude;

  // Evolve metrics according to active scenario
  switch (current.scenario) {
    case 'nominal':
      values.heart_rate = Math.round(68 + Math.sin(step / 6) * 4 + noise(2));
      values.spo2 = Math.min(100, Math.round(98 + noise(0.8)));
      values.body_temp = Number((36.75 + Math.sin(step / 10) * 0.15 + noise(0.05)).toFixed(1));
      values.blood_pressure_sys = Math.round(118 + noise(2));
      values.blood_pressure_dia = Math.round(76 + noise(1.5));
      values.glucose = Math.round(90 + noise(3));
      values.sleep_hours = 7.6;
      values.mood = 4.4;
      values.cabin_co2 = Math.round(1200 + noise(40));
      values.radiation_dose_rate = Number((21.5 + noise(1.2)).toFixed(1));
      break;

    case 'hypoxia_event':
      // SpO2 steadily drops over 10-15 steps into dangerous territory
      const dropAmount = Math.min(14, step * 0.9);
      values.spo2 = Math.max(84, Math.round(98 - dropAmount + noise(0.5)));
      // Compensatory tachycardia
      values.heart_rate = Math.min(125, Math.round(70 + dropAmount * 3.2 + noise(2)));
      values.body_temp = Number((36.8 + noise(0.05)).toFixed(1));
      values.blood_pressure_sys = Math.round(124 + dropAmount * 1.5);
      values.blood_pressure_dia = Math.round(80 + dropAmount * 0.8);
      values.cabin_co2 = Math.round(2800 + step * 120);
      values.radiation_dose_rate = 22.0;
      break;

    case 'solar_particle_event':
      // Radiation spikes drastically
      const spike = Math.min(280, step * 25);
      values.radiation_dose_rate = Number((22.0 + spike + noise(5)).toFixed(1));
      cumulativeRadiation += (values.radiation_dose_rate / 1000) * (2.5 / 3600);
      values.heart_rate = Math.round(76 + noise(3));
      values.spo2 = 97;
      values.body_temp = Number((36.9 + (spike > 150 ? 0.3 : 0)).toFixed(1));
      break;

    case 'poor_sleep_streak':
      values.sleep_hours = Number(Math.max(4.2, 7.5 - step * 0.25).toFixed(1));
      values.mood = Number(Math.max(1.8, 4.5 - step * 0.25).toFixed(1));
      values.heart_rate = Math.round(82 + noise(3));
      values.blood_pressure_sys = Math.round(126 + noise(2));
      break;

    case 'bp_drift':
      // Systolic arterial pressure steadily rises
      const drift = Math.min(35, step * 2.2);
      values.blood_pressure_sys = Math.round(118 + drift + noise(1.5));
      values.blood_pressure_dia = Math.round(76 + drift * 0.5 + noise(1));
      values.heart_rate = Math.round(74 + noise(2));
      break;

    case 'high_co2':
      // Cabin scrubber saturation
      values.cabin_co2 = Math.min(6200, Math.round(1200 + step * 350 + noise(50)));
      values.heart_rate = Math.round(75 + Math.min(25, step * 2));
      values.body_temp = 36.9;
      break;
  }

  // Generate Reading objects with status evaluation
  const newReadings: Reading[] = (Object.keys(values) as MetricKey[]).map((metric) => {
    const val = values[metric];
    const threshold = METRIC_THRESHOLDS[metric];
    let status: 'green' | 'orange' | 'red' = 'green';

    if (threshold) {
      if (metric === 'spo2') {
        if (val < 92) status = 'red';
        else if (val <= 94) status = 'orange';
      } else if (metric === 'heart_rate') {
        if (val > 110 || val < 40) status = 'red';
        else if (val > 90 || val < 50) status = 'orange';
      } else if (metric === 'blood_pressure_sys') {
        if (val >= 140) status = 'red';
        else if (val >= 130) status = 'orange';
      } else if (metric === 'radiation_dose_rate') {
        if (val >= 60) status = 'red';
        else if (val >= 25) status = 'orange';
      } else if (metric === 'cabin_co2') {
        if (val >= 5000) status = 'red';
        else if (val >= 3000) status = 'orange';
      } else if (metric === 'sleep_hours') {
        if (val < 5.5) status = 'red';
        else if (val < 7.0) status = 'orange';
      } else if (metric === 'mood') {
        if (val < 2.0) status = 'red';
        else if (val < 3.0) status = 'orange';
      }
    }

    return {
      id: `sim-${metric}-${step}-${Date.now()}`,
      astronaut_id: 'ast-01',
      metric,
      value: val,
      unit: threshold?.unit || '',
      recorded_at: now,
      source: 'simulated',
      status,
    };
  });

  // Evaluate alerts
  const newAlerts: Alert[] = [];
  const spo2Reading = newReadings.find((r) => r.metric === 'spo2');
  if (spo2Reading && spo2Reading.status === 'red') {
    newAlerts.push({
      id: `alert-spo2-${step}`,
      astronaut_id: 'ast-01',
      metric: 'spo2',
      level: 'red',
      rule_id: 'RULE_HYPOXIA_CRITICAL',
      message: `Critical SpO₂ drop detected (${spo2Reading.value}%). Acute hypoxia risk in cabin.`,
      created_at: now,
      autonomous_protocol: '1. Don emergency O2 mask immediately. 2. Verify cabin O2 partial pressure. 3. Check suit seal if in EVA prep.',
      source_url: 'https://www.nasa.gov/hrp/risks/',
    });
  } else if (spo2Reading && spo2Reading.status === 'orange') {
    newAlerts.push({
      id: `alert-spo2-warn-${step}`,
      astronaut_id: 'ast-01',
      metric: 'spo2',
      level: 'orange',
      rule_id: 'RULE_HYPOXIA_WARNING',
      message: `Sub-optimal SpO₂ (${spo2Reading.value}%). Monitor breathing and ventilation loop.`,
      created_at: now,
      source_url: 'https://www.nasa.gov/hrp/risks/',
    });
  }

  const radReading = newReadings.find((r) => r.metric === 'radiation_dose_rate');
  if (radReading && radReading.status === 'red') {
    newAlerts.push({
      id: `alert-rad-${step}`,
      astronaut_id: 'ast-01',
      metric: 'radiation_dose_rate',
      level: 'red',
      rule_id: 'RULE_RADIATION_SPE',
      message: `Solar Particle Event (SPE) alert: dose rate elevated (${radReading.value} µSv/h).`,
      created_at: now,
      autonomous_protocol: '1. Retreat to storm shelter module immediately. 2. Position water bags around sleep quarters. 3. Power down non-critical exterior avionics.',
      source_url: 'https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp',
    });
  }

  const bpReading = newReadings.find((r) => r.metric === 'blood_pressure_sys');
  if (bpReading && bpReading.status === 'red') {
    newAlerts.push({
      id: `alert-bp-${step}`,
      astronaut_id: 'ast-01',
      metric: 'blood_pressure_sys',
      level: 'red',
      rule_id: 'RULE_CARDIO_HYPERTENSION',
      message: `Elevated systolic pressure (${bpReading.value} mmHg). Cephalad fluid adaptation review needed.`,
      created_at: now,
      autonomous_protocol: '1. Rest in recumbent posture. 2. Repeat manual cuff measurement in 15 min. 3. Log headache or visual acuity symptoms.',
      source_url: 'https://www.nasa.gov/hrp/risks/',
    });
  }

  const co2Reading = newReadings.find((r) => r.metric === 'cabin_co2');
  if (co2Reading && co2Reading.status === 'red') {
    newAlerts.push({
      id: `alert-co2-${step}`,
      astronaut_id: 'ast-01',
      metric: 'cabin_co2',
      level: 'red',
      rule_id: 'RULE_CABIN_CO2_LIMIT',
      message: `Cabin CO₂ exceeded 5000 ppm (${co2Reading.value} ppm). Environmental scrubber saturation risk.`,
      created_at: now,
      autonomous_protocol: '1. Inspect CDRA / Metox absorption beds. 2. Switch to backup scrubber loop. 3. Increase cabin air circulation fans.',
      source_url: 'https://www.nasa.gov/hrp/hazards/',
    });
  }

  return {
    nextState: {
      step,
      scenario: current.scenario,
      environment: current.environment,
      values,
      radiation_cumulative_msv: Number(cumulativeRadiation.toFixed(3)),
    },
    newReadings,
    newAlerts,
  };
}
