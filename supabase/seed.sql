-- Generated with AI assistance (Antigravity). Reviewed by the team.
-- Badr Health — Supabase Database Seed (NASA Space Apps Challenge Dakar 2026)

-- 1. SEED MISSIONS (3 Environments)
INSERT INTO missions (id, name, environment, gravity_g, comms_delay_s, started_at)
VALUES 
  ('mis-station-leo', 'ISS Expedition 74 (LEO)', 'station', 0.000, 0.6, NOW() - INTERVAL '42 days'),
  ('mis-deep-transit', 'Artemis Deep Space Transit', 'spacecraft', 0.000, 145.0, NOW() - INTERVAL '18 days'),
  ('mis-lunar-base', 'Shackleton Lunar Base Outpost', 'moon', 0.165, 1.3, NOW() - INTERVAL '9 days')
ON CONFLICT (id) DO NOTHING;

-- 2. SEED 4 ADULT CREW MEMBERS (Fictional Callsigns, No Real People)
INSERT INTO astronauts (id, callsign, display_name, role, mission_id, baseline_fitted_at, baseline)
VALUES
  ('ast-01', 'CYGNUS-1', 'Dr. Tariq Al-Battani', 'Mission Commander & Flight Bio-Engineer', 'mis-deep-transit', NOW() - INTERVAL '14 days', '{"heart_rate": {"median": 68, "mad": 3.5}, "spo2": {"median": 98, "mad": 0.8}}'::jsonb),
  ('ast-02', 'VEGA-2', 'Dr. Elena Rostova', 'Chief Medical Officer', 'mis-deep-transit', NOW() - INTERVAL '14 days', '{"heart_rate": {"median": 64, "mad": 3.0}, "spo2": {"median": 99, "mad": 0.6}}'::jsonb),
  ('ast-03', 'ORION-3', 'Marcus Vance', 'Flight Systems & EVA Specialist', 'mis-deep-transit', NOW() - INTERVAL '14 days', '{"heart_rate": {"median": 72, "mad": 4.2}, "spo2": {"median": 97, "mad": 1.0}}'::jsonb),
  ('ast-04', 'POLARIS-4', 'Amina Diop', 'Habitat & Life Support Engineer', 'mis-deep-transit', NOW() - INTERVAL '14 days', '{"heart_rate": {"median": 66, "mad": 3.2}, "spo2": {"median": 98, "mad": 0.7}}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- 3. SEED SENSORS
INSERT INTO sensors (id, astronaut_id, kind, device_key, status, last_seen)
VALUES
  ('sens-01', 'ast-01', 'MAX30102 Optical PPG', 'esp32-vitals-board-01', 'online', NOW()),
  ('sens-02', 'ast-01', 'BME280 Cabin Air Pod', 'esp32-cabin-board-02', 'online', NOW()),
  ('sens-03', 'ast-01', 'SCD41 CO2 Monitor', 'esp32-co2-node-03', 'online', NOW()),
  ('sens-04', 'ast-01', 'CANS Neutron Spectrometer', 'cans-dosimeter-04', 'online', NOW())
ON CONFLICT (id) DO NOTHING;

-- 4. SEED 14 DAYS OF SIMULATED BIOMETRIC HISTORY
-- Using generate_series to create 14 days of hourly readings for Heart Rate, SpO2, and Blood Pressure
INSERT INTO readings (astronaut_id, sensor_id, metric, value, unit, recorded_at, source)
SELECT 
  'ast-01',
  'sens-01',
  'heart_rate',
  ROUND((66 + 6 * sin(d * 0.26) + (random() * 4 - 2))::numeric, 1),
  'bpm',
  NOW() - (d || ' hours')::interval,
  'simulated'
FROM generate_series(1, 336) AS d;

INSERT INTO readings (astronaut_id, sensor_id, metric, value, unit, recorded_at, source)
SELECT 
  'ast-01',
  'sens-01',
  'spo2',
  LEAST(100, GREATEST(94, ROUND((98 + (random() * 2 - 1))::numeric, 1))),
  '%',
  NOW() - (d || ' hours')::interval,
  'simulated'
FROM generate_series(1, 336) AS d;

INSERT INTO readings (astronaut_id, sensor_id, metric, value, unit, recorded_at, source)
SELECT 
  'ast-01',
  'sens-01',
  'blood_pressure_sys',
  ROUND((118 + (random() * 6 - 3))::numeric, 1),
  'mmHg',
  NOW() - (d || ' hours')::interval,
  'simulated'
FROM generate_series(1, 336) AS d;

-- 5. SEED RADIATION LOGS
INSERT INTO radiation_log (astronaut_id, dose_rate_usv_h, cumulative_msv, neutron_share, recorded_at, source)
SELECT 
  'ast-01',
  ROUND((22 + (random() * 4 - 2))::numeric, 2),
  ROUND((25 + (d * 0.05))::numeric, 3),
  0.30, -- 30% CSA neutron share
  NOW() - (d || ' hours')::interval,
  'simulated'
FROM generate_series(1, 336) AS d;

-- 6. SEED MOOD & EXERCISE COUNTERMEASURES
INSERT INTO mood_logs (astronaut_id, mood, stress, note, recorded_at)
SELECT 
  'ast-01',
  4,
  2,
  'Circadian rhythm nominal. Completed sleep cycle.',
  NOW() - (d || ' days')::interval
FROM generate_series(1, 14) AS d;

INSERT INTO exercise_logs (astronaut_id, kind, minutes, recorded_at)
SELECT 
  'ast-01',
  'ARED_resistive',
  60,
  NOW() - (d || ' days')::interval
FROM generate_series(1, 14) AS d;

INSERT INTO exercise_logs (astronaut_id, kind, minutes, recorded_at)
SELECT 
  'ast-01',
  'T2_cycle_ergometer',
  35,
  NOW() - (d || ' days')::interval
FROM generate_series(1, 14) AS d;

-- 7. SEED INITIAL HAZARD SCORES
INSERT INTO hazard_scores (astronaut_id, hazard, score, computed_at)
VALUES
  ('ast-01', 'radiation', 68, NOW()),
  ('ast-01', 'isolation', 35, NOW()),
  ('ast-01', 'distance', 82, NOW()),
  ('ast-01', 'gravity', 75, NOW()),
  ('ast-01', 'closed_env', 28, NOW())
ON CONFLICT (astronaut_id, hazard) DO UPDATE SET score = EXCLUDED.score;
