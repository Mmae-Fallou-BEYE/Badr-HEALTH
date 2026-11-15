// Generated with AI assistance (Antigravity). Reviewed by the team.
import { Astronaut } from './types';

export interface CrewMemberProfile extends Astronaut {
  avatar_initials: string;
  status: 'Active' | 'EVA Standby' | 'Rest Cycle';
  health_score: number;
  blood_type: string;
  specialization: string;
  mission_assignment: string;
}

export const CREW_MEMBERS: CrewMemberProfile[] = [
  {
    id: 'ast-01',
    callsign: 'CYGNUS-1',
    display_name: 'Dr. Tariq Al-Battani',
    role: 'Commander & Flight Bio-Engineer',
    mission_id: 'mis-artemis-4',
    baseline_fitted_at: '2026-10-01T08:00:00Z',
    avatar_seed: 'tariq',
    avatar_initials: 'TA',
    status: 'Active',
    health_score: 94,
    blood_type: 'A+ Rh Positive',
    specialization: 'Bio-Regenerative Life Support & Space Robotics',
    mission_assignment: 'Artemis IV Deep Space Habitat',
  },
  {
    id: 'ast-02',
    callsign: 'VEGA-2',
    display_name: 'Dr. Elena Rostova',
    role: 'Chief Medical Officer & Flight Surgeon',
    mission_id: 'mis-artemis-4',
    baseline_fitted_at: '2026-10-01T08:00:00Z',
    avatar_seed: 'elena',
    avatar_initials: 'ER',
    status: 'Active',
    health_score: 97,
    blood_type: 'O+ Rh Positive',
    specialization: 'Spaceflight Neuro-ocular Syndrome (SANS) & Critical Care',
    mission_assignment: 'Clinical Operations & Biomedical Countermeasures',
  },
  {
    id: 'ast-03',
    callsign: 'ORION-3',
    display_name: 'Marcus Vance',
    role: 'Flight Systems & Lead EVA Specialist',
    mission_id: 'mis-artemis-4',
    baseline_fitted_at: '2026-10-02T08:00:00Z',
    avatar_seed: 'marcus',
    avatar_initials: 'MV',
    status: 'EVA Standby',
    health_score: 89,
    blood_type: 'B+ Rh Positive',
    specialization: 'Extravehicular Mobility Unit (EMU) & Avionics',
    mission_assignment: 'External Habitat Maintenance & Airlock Ops',
  },
  {
    id: 'ast-04',
    callsign: 'POLARIS-4',
    display_name: 'Amina Diop',
    role: 'ECLSS & Habitat Environmental Engineer',
    mission_id: 'mis-artemis-4',
    baseline_fitted_at: '2026-10-03T08:00:00Z',
    avatar_seed: 'amina',
    avatar_initials: 'AD',
    status: 'Active',
    health_score: 92,
    blood_type: 'AB+ Rh Positive',
    specialization: 'Atmospheric Scrubbing, Closed-Loop Water & Radiation Shielding',
    mission_assignment: 'Cabin Atmospheric Quality & Consumables Recycling',
  },
];
