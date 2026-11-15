// Generated with AI assistance (Antigravity). Reviewed by the team.
import { Environment } from '../data/types';

export interface EnvironmentConfig {
  id: Environment;
  name: string;
  tagline: string;
  gravity_g: number;
  comms_delay_s: number;
  radiation_baseline_usv_h: number;
  hazard_weights: {
    radiation: number;
    isolation: number;
    distance: number;
    gravity: number;
    closed_env: number;
  };
  operational_notes: string;
}

export const ENVIRONMENTS: Record<Environment, EnvironmentConfig> = {
  station: {
    id: 'station',
    name: 'Space Station (LEO)',
    tagline: 'Low Earth Orbit (400 km)',
    gravity_g: 0.0,
    comms_delay_s: 0.6,
    radiation_baseline_usv_h: 22.0,
    hazard_weights: {
      radiation: 0.20,
      isolation: 0.15,
      distance: 0.10,
      gravity: 0.35, // High bone/muscle deconditioning concern
      closed_env: 0.20,
    },
    operational_notes: 'Protected by Earth magnetosphere. Real-time ground telemetry with Houston & Tsukuba.',
  },
  spacecraft: {
    id: 'spacecraft',
    name: 'Deep Space Transit',
    tagline: 'Cislunar / Mars Trajectory',
    gravity_g: 0.0,
    comms_delay_s: 145.0, // High delay triggers autonomous protocol mode
    radiation_baseline_usv_h: 65.0,
    hazard_weights: {
      radiation: 0.35, // Supreme radiation hazard outside magnetosphere
      isolation: 0.25,
      distance: 0.20, // Autonomy is vital
      gravity: 0.10,
      closed_env: 0.10,
    },
    operational_notes: 'Autonomous protocol active: high communications latency requires on-board decision-making.',
  },
  moon: {
    id: 'moon',
    name: 'Lunar Surface Base',
    tagline: 'South Pole Shackleton Rim',
    gravity_g: 0.165, // ~1/6th Earth gravity
    comms_delay_s: 1.3,
    radiation_baseline_usv_h: 54.0,
    hazard_weights: {
      radiation: 0.30,
      isolation: 0.15,
      distance: 0.15,
      gravity: 0.20,
      closed_env: 0.20, // Regolith dust abrasive toxicity and habitat sealing
    },
    operational_notes: '1/6g partial gravity biomechanics. Lunar regolith dust filtration monitored.',
  },
};
