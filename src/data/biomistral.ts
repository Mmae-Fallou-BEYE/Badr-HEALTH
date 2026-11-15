// Generated with AI assistance; integrates the supplied BioMistral package.
import type { MetricKey, Reading } from './types';

export interface BioMistralInput {
  mission_day: number;
  temperature_c?: number;
  heart_rate_bpm?: number;
  blood_pressure?: { systolic: number; diastolic: number };
  spo2_pct?: number;
  sleep_hours?: number;
  mood?: string;
  exercise_minutes?: number;
  radiation_cumulative_msv?: number;
}

export interface BioMistralSnapshot {
  data: BioMistralInput;
  hasSimulatedData: boolean;
}

export interface BioMistralReport {
  schema_version: string;
  generated_at: string;
  model: { name: string | null; prompt_version: string };
  input: { hash: string; missing_fields: string[] };
  red_flags: {
    highest_severity: string;
    flags: Array<{
      code: string;
      severity: string;
      field: string;
      observed: string;
      unit: string;
      threshold: string;
      message: string;
    }>;
    note: string;
  } | null;
  report: {
    overall_assessment: string;
    detected_abnormalities: Array<{
      parameter: string;
      observed: string;
      interpretation: string;
      evidence: { field: string; value: string };
    }>;
    possible_risks: Array<{
      risk: string;
      basis: Array<{ field: string; value: string }>;
      uncertainty: string;
    }>;
    recommendations: string[];
    risk_level: string;
    contact_flight_surgeon: { decision: string; reason: string };
  };
  validation: { attempts: number; warnings: string[]; needs_review: boolean };
  disclaimer: string;
}

export interface BioMistralHealth {
  ok: boolean;
  model_available: boolean;
  model?: string;
  error?: { code: string; message: string };
}

interface IntakeDetails {
  symptom: string;
  duration: string;
  intensity: number | null;
}

const API_BASE_URL = 'http://127.0.0.1:8765/api';

function isReading(value: Reading | undefined): value is Reading {
  return value !== undefined && Number.isFinite(value.value);
}

export function createBioMistralSnapshot(
  readings: Partial<Record<MetricKey, Reading>>,
  missionDay: number,
  exerciseMinutes: number,
  radiationCumulativeMsv: number,
  isOfflineDemo: boolean,
): BioMistralSnapshot {
  const data: BioMistralInput = { mission_day: missionDay };
  let hasSimulatedData = isOfflineDemo;

  const addReading = (
    metric: MetricKey,
    assign: (value: number) => void,
  ) => {
    const reading = readings[metric];
    if (!isReading(reading)) return;
    assign(reading.value);
    if (reading.source === 'simulated') hasSimulatedData = true;
  };

  addReading('heart_rate', (value) => { data.heart_rate_bpm = value; });
  addReading('body_temp', (value) => { data.temperature_c = value; });
  addReading('spo2', (value) => { data.spo2_pct = value; });
  addReading('sleep_hours', (value) => { data.sleep_hours = value; });

  const systolic = readings.blood_pressure_sys;
  const diastolic = readings.blood_pressure_dia;
  if (isReading(systolic) && isReading(diastolic)) {
    data.blood_pressure = {
      systolic: systolic.value,
      diastolic: diastolic.value,
    };
    if (systolic.source === 'simulated' || diastolic.source === 'simulated') {
      hasSimulatedData = true;
    }
  }

  addReading('mood', (value) => { data.mood = `Crew-reported mood score: ${value}/5`; });
  if (Number.isFinite(exerciseMinutes)) data.exercise_minutes = exerciseMinutes;

  if (isReading(readings.radiation_dose_rate) && Number.isFinite(radiationCumulativeMsv)) {
    data.radiation_cumulative_msv = radiationCumulativeMsv;
    if (readings.radiation_dose_rate.source === 'simulated') hasSimulatedData = true;
  }

  return { data, hasSimulatedData };
}

async function requestJson<T>(path: string, body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: body === undefined ? 'GET' : 'POST',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new Error('BioMistral service is unreachable. Start the local AI service and try again.');
  }

  let responseBody: unknown;
  try {
    responseBody = await response.json();
  } catch {
    throw new Error(`BioMistral service returned an invalid response (${response.status}).`);
  }

  if (!response.ok) {
    const message =
      typeof responseBody === 'object' &&
      responseBody !== null &&
      'error' in responseBody &&
      typeof responseBody.error === 'object' &&
      responseBody.error !== null &&
      'message' in responseBody.error &&
      typeof responseBody.error.message === 'string'
        ? responseBody.error.message
        : `BioMistral request failed (${response.status}).`;
    throw new Error(message);
  }
  return responseBody as T;
}

export function checkBioMistralHealth(): Promise<BioMistralHealth> {
  return requestJson<BioMistralHealth>('/health');
}

export function analyzeBioMistral(
  data: BioMistralInput,
  intake?: IntakeDetails,
): Promise<BioMistralReport> {
  if (intake) {
    return requestJson<BioMistralReport>('/intake/analyze', { data, ...intake });
  }
  return requestJson<BioMistralReport>('/analyze', { data });
}
