-- Generated with AI assistance (Antigravity). Reviewed by the team.
-- Badr Health — Supabase Database Schema (NASA Space Apps Challenge Dakar 2026)

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. MISSIONS TABLE
CREATE TABLE IF NOT EXISTS missions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    environment TEXT NOT NULL CHECK (environment IN ('station', 'spacecraft', 'moon')),
    gravity_g NUMERIC(5, 3) NOT NULL DEFAULT 0.0,
    comms_delay_s NUMERIC(6, 1) NOT NULL DEFAULT 0.6,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. ASTRONAUTS TABLE
CREATE TABLE IF NOT EXISTS astronauts (
    id TEXT PRIMARY KEY,
    callsign TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    role TEXT NOT NULL,
    mission_id TEXT REFERENCES missions(id) ON DELETE SET NULL,
    baseline_fitted_at TIMESTAMPTZ,
    baseline JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. SENSORS TABLE
CREATE TABLE IF NOT EXISTS sensors (
    id TEXT PRIMARY KEY,
    astronaut_id TEXT REFERENCES astronauts(id) ON DELETE CASCADE,
    kind TEXT NOT NULL,
    device_key TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'online',
    last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. READINGS TABLE (BIOMETRICS)
CREATE TABLE IF NOT EXISTS readings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    astronaut_id TEXT NOT NULL REFERENCES astronauts(id) ON DELETE CASCADE,
    sensor_id TEXT REFERENCES sensors(id) ON DELETE SET NULL,
    metric TEXT NOT NULL,
    value NUMERIC(10, 2) NOT NULL,
    unit TEXT NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    source TEXT NOT NULL CHECK (source IN ('sensor', 'manual', 'simulated'))
);

CREATE INDEX IF NOT EXISTS idx_readings_astro_metric_time 
    ON readings (astronaut_id, metric, recorded_at DESC);

-- 6. CABIN ENVIRONMENTAL READINGS
CREATE TABLE IF NOT EXISTS cabin_readings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mission_id TEXT NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
    metric TEXT NOT NULL,
    value NUMERIC(10, 2) NOT NULL,
    unit TEXT NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    source TEXT NOT NULL CHECK (source IN ('sensor', 'manual', 'simulated'))
);

CREATE INDEX IF NOT EXISTS idx_cabin_readings_mission_time 
    ON cabin_readings (mission_id, metric, recorded_at DESC);

-- 7. RADIATION DOSIMETRY LOG
CREATE TABLE IF NOT EXISTS radiation_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    astronaut_id TEXT NOT NULL REFERENCES astronauts(id) ON DELETE CASCADE,
    dose_rate_usv_h NUMERIC(8, 2) NOT NULL,
    cumulative_msv NUMERIC(8, 3) NOT NULL,
    neutron_share NUMERIC(4, 3) NOT NULL DEFAULT 0.30, -- 30% per CSA CANS research
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    source TEXT NOT NULL CHECK (source IN ('sensor', 'manual', 'simulated'))
);

CREATE INDEX IF NOT EXISTS idx_radiation_astro_time 
    ON radiation_log (astronaut_id, recorded_at DESC);

-- 8. MOOD & BEHAVIORAL LOGS
CREATE TABLE IF NOT EXISTS mood_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    astronaut_id TEXT NOT NULL REFERENCES astronauts(id) ON DELETE CASCADE,
    mood INTEGER NOT NULL CHECK (mood BETWEEN 1 AND 5),
    stress INTEGER NOT NULL CHECK (stress BETWEEN 1 AND 5),
    note TEXT,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. EXERCISE COUNTERMEASURES LOGS
CREATE TABLE IF NOT EXISTS exercise_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    astronaut_id TEXT NOT NULL REFERENCES astronauts(id) ON DELETE CASCADE,
    kind TEXT NOT NULL CHECK (kind IN ('ARED_resistive', 'T2_cycle_ergometer', 'T2_treadmill')),
    minutes INTEGER NOT NULL CHECK (minutes >= 0),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. ALERTS TABLE
CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    astronaut_id TEXT NOT NULL REFERENCES astronauts(id) ON DELETE CASCADE,
    metric TEXT NOT NULL,
    level TEXT NOT NULL CHECK (level IN ('green', 'orange', 'red')),
    rule_id TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    acknowledged_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_alerts_astro_time 
    ON alerts (astronaut_id, created_at DESC);

-- 11. HAZARD SCORES TABLE
CREATE TABLE IF NOT EXISTS hazard_scores (
    astronaut_id TEXT NOT NULL REFERENCES astronauts(id) ON DELETE CASCADE,
    hazard TEXT NOT NULL CHECK (hazard IN ('radiation', 'isolation', 'distance', 'gravity', 'closed_env')),
    score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
    computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (astronaut_id, hazard)
);

-- ROW LEVEL SECURITY (RLS) POLICIES
-- NOTE: For the NASA Space Apps Challenge demo, permissive public read/write is enabled
-- so judges and evaluators can view the live dashboard without authentication barriers.
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE astronauts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensors ENABLE ROW LEVEL SECURITY;
ALTER TABLE readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE cabin_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE radiation_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE hazard_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Demo Permissive Access for Missions" ON missions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Demo Permissive Access for Astronauts" ON astronauts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Demo Permissive Access for Sensors" ON sensors FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Demo Permissive Access for Readings" ON readings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Demo Permissive Access for Cabin Readings" ON cabin_readings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Demo Permissive Access for Radiation Log" ON radiation_log FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Demo Permissive Access for Mood Logs" ON mood_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Demo Permissive Access for Exercise Logs" ON exercise_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Demo Permissive Access for Alerts" ON alerts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Demo Permissive Access for Hazard Scores" ON hazard_scores FOR ALL USING (true) WITH CHECK (true);
