// Generated with AI assistance (Antigravity). Reviewed by the team.

export type Environment = 'station' | 'spacecraft' | 'moon';

export type MetricKey =
  | 'heart_rate'
  | 'spo2'
  | 'body_temp'
  | 'blood_pressure_sys'
  | 'blood_pressure_dia'
  | 'glucose'
  | 'sleep_hours'
  | 'mood'
  | 'cabin_co2'
  | 'radiation_dose_rate';

export type AlertLevel = 'green' | 'orange' | 'red';

export type ReadingSource = 'sensor' | 'manual' | 'simulated';

export type Scenario =
  | 'nominal'
  | 'poor_sleep_streak'
  | 'solar_particle_event'
  | 'hypoxia_event'
  | 'bp_drift'
  | 'high_co2';

export interface Astronaut {
  id: string;
  callsign: string;
  display_name: string;
  role: string;
  mission_id: string;
  baseline_fitted_at?: string;
  avatar_seed?: string;
  avatar_initials?: string;
  status?: string;
  health_score?: number;
  blood_type?: string;
  specialization?: string;
}

export interface Mission {
  id: string;
  name: string;
  environment: Environment;
  gravity_g: number;
  comms_delay_s: number;
  started_at: string;
  mission_day: number;
}

export interface Reading {
  id: string;
  astronaut_id: string;
  sensor_id?: string | null;
  metric: MetricKey;
  value: number;
  unit: string;
  recorded_at: string;
  source: ReadingSource;
  status: AlertLevel;
}

export interface CabinReading {
  id: string;
  mission_id: string;
  metric: string;
  value: number;
  unit: string;
  recorded_at: string;
  source: ReadingSource;
}

export interface RadiationLog {
  id: string;
  astronaut_id: string;
  dose_rate_usv_h: number;
  cumulative_msv: number;
  neutron_share: number; // e.g. 0.30 (30% per CSA CANS instrument)
  recorded_at: string;
  source: ReadingSource;
}

export interface MoodLog {
  id: string;
  astronaut_id: string;
  mood: number; // 1 to 5
  stress: number; // 1 to 5
  note?: string;
  recorded_at: string;
}

export interface ExerciseLog {
  id: string;
  astronaut_id: string;
  kind: 'ARED_resistive' | 'T2_cycle_ergometer' | 'T2_treadmill';
  minutes: number;
  recorded_at: string;
}

export interface Alert {
  id: string;
  astronaut_id: string;
  metric: MetricKey;
  level: AlertLevel;
  rule_id: string;
  message: string;
  created_at: string;
  acknowledged_at?: string | null;
  autonomous_protocol?: string;
  source_url?: string;
}

export interface HazardScore {
  hazard: 'radiation' | 'isolation' | 'distance' | 'gravity' | 'closed_env';
  label: string;
  score: number; // 0 to 100
  weight: number;
  trend: 'up' | 'down' | 'stable';
  primary_driver: string;
}

export interface HealthScoreBreakdown {
  score: number; // 0 to 100
  trend: 'improving' | 'stable' | 'declining';
  change24h: number;
  status: AlertLevel;
  components: {
    vitals_stability: number; // 0-100
    hazard_resilience: number; // 0-100
    countermeasure_adherence: number; // 0-100
    sleep_restoration: number; // 0-100
  };
}

export interface MetricThreshold {
  metric: MetricKey;
  label: string;
  unit: string;
  green: [number, number];
  orange: [number, number];
  red: [number, number];
  source_url: string;
  source_label: string;
  verified: boolean;
  description: string;
}
