-- Public shared access is intended only for fictional demo data.
-- Run after schema.sql (and after any earlier private-access migration).
BEGIN;

ALTER TABLE public.missions
  ADD COLUMN IF NOT EXISTS mission_day INTEGER NOT NULL DEFAULT 1;
ALTER TABLE public.readings
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'green';
ALTER TABLE public.alerts
  ADD COLUMN IF NOT EXISTS autonomous_protocol TEXT,
  ADD COLUMN IF NOT EXISTS source_url TEXT;

CREATE TABLE IF NOT EXISTS public.daily_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  astronaut_id TEXT NOT NULL REFERENCES public.astronauts(id) ON DELETE CASCADE,
  mood NUMERIC(2, 1) CHECK (mood BETWEEN 1 AND 5),
  sleep_hours NUMERIC(4, 2) CHECK (sleep_hours >= 0),
  exercise_mins INTEGER NOT NULL DEFAULT 0 CHECK (exercise_mins >= 0),
  note TEXT,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.astronauts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sensors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cabin_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.radiation_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mood_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hazard_scores ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE
  public.missions,
  public.astronauts,
  public.sensors,
  public.readings,
  public.cabin_readings,
  public.radiation_log,
  public.mood_logs,
  public.exercise_logs,
  public.daily_checkins,
  public.alerts,
  public.hazard_scores
FROM PUBLIC, anon, authenticated;

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON TABLE
  public.missions,
  public.astronauts,
  public.sensors,
  public.readings,
  public.cabin_readings,
  public.radiation_log,
  public.mood_logs,
  public.exercise_logs,
  public.daily_checkins,
  public.alerts,
  public.hazard_scores
TO anon, authenticated;
GRANT INSERT ON TABLE public.readings, public.alerts, public.daily_checkins
TO anon, authenticated;
GRANT UPDATE ON TABLE public.alerts TO anon, authenticated;

DO $$
DECLARE
  policy_row RECORD;
BEGIN
  FOR policy_row IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = ANY (ARRAY[
        'missions', 'astronauts', 'sensors', 'readings', 'cabin_readings',
        'radiation_log', 'mood_logs', 'exercise_logs', 'daily_checkins',
        'alerts', 'hazard_scores'
      ])
  LOOP
    EXECUTE format(
      'DROP POLICY %I ON %I.%I',
      policy_row.policyname,
      policy_row.schemaname,
      policy_row.tablename
    );
  END LOOP;
END;
$$;

CREATE POLICY "public_demo_read_missions"
  ON public.missions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_demo_read_astronauts"
  ON public.astronauts FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_demo_read_sensors"
  ON public.sensors FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_demo_read_readings"
  ON public.readings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_demo_insert_readings"
  ON public.readings FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "public_demo_read_cabin_readings"
  ON public.cabin_readings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_demo_read_radiation_log"
  ON public.radiation_log FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_demo_read_mood_logs"
  ON public.mood_logs FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_demo_read_exercise_logs"
  ON public.exercise_logs FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_demo_read_daily_checkins"
  ON public.daily_checkins FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_demo_insert_daily_checkins"
  ON public.daily_checkins FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "public_demo_read_alerts"
  ON public.alerts FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_demo_insert_alerts"
  ON public.alerts FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "public_demo_update_alerts"
  ON public.alerts FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "public_demo_read_hazard_scores"
  ON public.hazard_scores FOR SELECT TO anon, authenticated USING (true);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'readings'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.readings;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'alerts'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts;
    END IF;
  END IF;
END;
$$;

COMMIT;
