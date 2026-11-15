// Generated with AI assistance (Antigravity). Reviewed by the team.
import { create } from 'zustand';
import {
  Mission,
  Environment,
  Scenario,
  Reading,
  MetricKey,
  Alert,
  HazardScore,
  HealthScoreBreakdown,
} from './types';
import { ENVIRONMENTS } from '../config/environments';
import { createInitialSimulatedState, stepSimulation, SimulatedState } from './simulator';
import { CREW_MEMBERS, CrewMemberProfile } from './crew';
import { DailyCheckin, repository } from './repository';

export type ConnectionStatus = 'offline' | 'connecting' | 'connected' | 'error';

export interface AppStore {
  astronaut: CrewMemberProfile;
  crew: CrewMemberProfile[];
  mission: Mission;
  environment: Environment;
  scenario: Scenario;
  isOfflineDemo: boolean;
  connectionStatus: ConnectionStatus;
  connectionError: string | null;
  isSimulating: boolean;
  latestReadings: Record<MetricKey, Reading>;
  historySeries: Record<MetricKey, Array<{ time: string; value: number; status: 'green' | 'orange' | 'red' }>>;
  weeklyInsights: Array<{ day: string; heart_rate: number; spo2: number; sleep_hours: number; exercise_mins: number }>;
  alerts: Alert[];
  hazardScores: HazardScore[];
  healthScore: HealthScoreBreakdown;
  radiationCumulativeMsv: number;
  exerciseMinutesToday: number;
  targetExerciseMinutes: number;
  simState: SimulatedState;

  // Actions
  setEnvironment: (env: Environment) => void;
  setScenario: (scen: Scenario) => void;
  tick: () => void;
  acknowledgeAlert: (alertId: string) => void;
  addManualReading: (metric: MetricKey, value: number, unit?: string) => void;
  logVitalsAndCheckin: (
    vitals: Partial<Record<MetricKey, number>>,
    checkin?: { mood?: number; sleep_hours?: number; exercise_mins?: number; note?: string }
  ) => void;
  toggleSimulation: () => void;
  switchAstronaut: (astronautId: string) => void;
  initializeRemoteData: (astronautId: string) => Promise<void>;
  receiveRemoteReading: (reading: Reading) => void;
  receiveRemoteAlert: (alert: Alert) => void;
}

const INITIAL_ASTRONAUT: CrewMemberProfile = CREW_MEMBERS[0];

const INITIAL_MISSION: Mission = {
  id: 'mis-artemis-4',
  name: 'Artemis Deep Exploration Alpha',
  environment: 'station',
  gravity_g: 0.0,
  comms_delay_s: 0.6,
  started_at: '2026-10-04T00:00:00Z',
  mission_day: 42,
};

function computeHazardScores(env: Environment, latest: Record<MetricKey, Reading>): HazardScore[] {
  const envCfg = ENVIRONMENTS[env];
  const radVal = latest.radiation_dose_rate?.value ?? 22;
  const spo2Val = latest.spo2?.value ?? 98;
  const co2Val = latest.cabin_co2?.value ?? 1200;
  const sleepVal = latest.sleep_hours?.value ?? 7.5;

  // Calculate scores (0-100, higher means greater danger)
  const radScore = Math.min(100, Math.round((radVal / 100) * 85 + (env === 'spacecraft' ? 20 : 5)));
  const isolationScore = Math.min(100, Math.round((9 - sleepVal) * 12 + (env === 'spacecraft' ? 25 : 10)));
  const distanceScore = env === 'spacecraft' ? 82 : env === 'moon' ? 45 : 12;
  const gravityScore = env === 'station' ? 70 : env === 'spacecraft' ? 75 : 40; // microgravity bone loss vs partial 1/6g
  const closedScore = Math.min(100, Math.round((co2Val / 5000) * 60 + (100 - spo2Val) * 2 + (env === 'moon' ? 18 : 5)));

  return [
    {
      hazard: 'radiation',
      label: 'Space Radiation',
      score: radScore,
      weight: envCfg.hazard_weights.radiation,
      trend: radVal > 40 ? 'up' : 'stable',
      primary_driver: `${radVal} µSv/h (GCR + SPE monitoring)`,
    },
    {
      hazard: 'isolation',
      label: 'Isolation & Confinement',
      score: isolationScore,
      weight: envCfg.hazard_weights.isolation,
      trend: sleepVal < 6 ? 'up' : 'stable',
      primary_driver: `Sleep regularity (${sleepVal}h) & team psych`,
    },
    {
      hazard: 'distance',
      label: 'Distance from Earth',
      score: distanceScore,
      weight: envCfg.hazard_weights.distance,
      trend: 'stable',
      primary_driver: `${envCfg.comms_delay_s}s radio delay to ground`,
    },
    {
      hazard: 'gravity',
      label: 'Altered Gravity Fields',
      score: gravityScore,
      weight: envCfg.hazard_weights.gravity,
      trend: 'stable',
      primary_driver: env === 'moon' ? '0.165 g (lunar partial gravity)' : 'Microgravity cephalad shift',
    },
    {
      hazard: 'closed_env',
      label: 'Hostile Closed Environment',
      score: closedScore,
      weight: envCfg.hazard_weights.closed_env,
      trend: co2Val > 3000 ? 'up' : 'stable',
      primary_driver: `Cabin CO₂ ${co2Val} ppm & SpO₂ ${spo2Val}%`,
    },
  ];
}

function computeHealthScore(
  readings: Record<MetricKey, Reading>,
  hazards: HazardScore[],
  exerciseMinutes: number
): HealthScoreBreakdown {
  let score = 98;

  // Penalize by out-of-range vitals
  Object.values(readings).forEach((r) => {
    if (r.status === 'red') score -= 18;
    else if (r.status === 'orange') score -= 7;
  });

  // Factor in severe hazards
  hazards.forEach((h) => {
    if (h.score > 60) score -= (h.score - 60) * 0.15 * h.weight;
  });

  // Factor in exercise countermeasure adherence (90 min daily NASA target)
  const adherence = Math.min(100, Math.round((exerciseMinutes / 90) * 100));
  if (adherence < 50) score -= 4;

  const finalScore = Math.max(18, Math.min(99, Math.round(score)));
  let status: 'green' | 'orange' | 'red' = 'green';
  if (finalScore < 70) status = 'red';
  else if (finalScore < 85) status = 'orange';

  return {
    score: finalScore,
    trend: finalScore >= 85 ? 'improving' : finalScore >= 70 ? 'stable' : 'declining',
    change24h: finalScore >= 85 ? +2 : finalScore >= 70 ? -1 : -8,
    status,
    components: {
      vitals_stability: Math.max(20, Math.min(100, Math.round(finalScore * 1.05))),
      hazard_resilience: Math.max(25, Math.min(100, 100 - Math.round(hazards[0].score * 0.5))),
      countermeasure_adherence: adherence,
      sleep_restoration: Math.min(100, Math.round(((readings.sleep_hours?.value ?? 7.5) / 8) * 100)),
    },
  };
}

function toReadingPayload(reading: Reading): Omit<Reading, 'id'> {
  return {
    astronaut_id: reading.astronaut_id,
    sensor_id: reading.sensor_id,
    metric: reading.metric,
    value: reading.value,
    unit: reading.unit,
    recorded_at: reading.recorded_at,
    source: reading.source,
    status: reading.status,
  };
}

function toAlertPayload(alert: Alert): Omit<Alert, 'id'> {
  return {
    astronaut_id: alert.astronaut_id,
    metric: alert.metric,
    level: alert.level,
    rule_id: alert.rule_id,
    message: alert.message,
    created_at: alert.created_at,
    acknowledged_at: alert.acknowledged_at,
    autonomous_protocol: alert.autonomous_protocol,
    source_url: alert.source_url,
  };
}

function reportRepositoryError(error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  console.error('Supabase operation failed:', error);
  useAppStore.setState({ connectionStatus: 'error', connectionError: message });
}

function persistReadings(readings: Reading[]): void {
  if (!repository.isRemote() || readings.length === 0) return;
  void repository.insertReadings(readings.map(toReadingPayload))
    .then(() => useAppStore.setState({ connectionStatus: 'connected', connectionError: null }))
    .catch(reportRepositoryError);
}

function persistAlerts(alerts: Alert[]): void {
  if (!repository.isRemote() || alerts.length === 0) return;
  void repository.insertAlerts(alerts.map(toAlertPayload))
    .then((savedAlerts) => {
      const currentAlerts = useAppStore.getState().alerts;
      savedAlerts.forEach((saved) => {
        const current = currentAlerts.find(
          (item) => item.rule_id === saved.rule_id && item.created_at === saved.created_at
        );
        if (current?.acknowledged_at) {
          void repository.ackAlert(saved.id).catch(reportRepositoryError);
        }
      });
      useAppStore.setState((state) => ({
        connectionStatus: 'connected',
        connectionError: null,
        alerts: state.alerts.map((current) => {
          const saved = savedAlerts.find(
            (item) => item.rule_id === current.rule_id && item.created_at === current.created_at
          );
          return saved ? { ...saved, acknowledged_at: current.acknowledged_at } : current;
        }),
      }));
    })
    .catch(reportRepositoryError);
}

function persistDailyCheckin(checkin: DailyCheckin): void {
  if (!repository.isRemote()) return;
  void repository.insertDailyCheckin(checkin)
    .then(() => useAppStore.setState({ connectionStatus: 'connected', connectionError: null }))
    .catch(reportRepositoryError);
}

const initialSimState = createInitialSimulatedState('station');
const initialStepResult = stepSimulation(initialSimState);

const initialLatestReadings: Record<MetricKey, Reading> = {} as any;
const initialHistorySeries: Record<MetricKey, Array<{ time: string; value: number; status: 'green' | 'orange' | 'red' }>> = {} as any;

initialStepResult.newReadings.forEach((r) => {
  initialLatestReadings[r.metric] = r;
  // Seed with 10 synthetic historical points
  const points = [];
  for (let i = 9; i >= 0; i--) {
    const d = new Date(Date.now() - i * 180000);
    const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    points.push({
      time: timeStr,
      value: Number((r.value * (1 + (Math.random() - 0.5) * 0.04)).toFixed(1)),
      status: r.status,
    });
  }
  initialHistorySeries[r.metric] = points;
});

const initialHazards = computeHazardScores('station', initialLatestReadings);
const initialHealth = computeHealthScore(initialLatestReadings, initialHazards, 65);

export const useAppStore = create<AppStore>((set, get) => ({
  astronaut: INITIAL_ASTRONAUT,
  crew: CREW_MEMBERS,
  mission: INITIAL_MISSION,
  environment: 'station',
  scenario: 'nominal',
  isOfflineDemo: !repository.isRemote(),
  connectionStatus: repository.isRemote() ? 'connecting' : 'offline',
  connectionError: null,
  isSimulating: true,
  latestReadings: initialLatestReadings,
  historySeries: initialHistorySeries,
  weeklyInsights: [
    { day: 'Mon', heart_rate: 66, spo2: 98, sleep_hours: 7.8, exercise_mins: 85 },
    { day: 'Tue', heart_rate: 68, spo2: 97, sleep_hours: 7.2, exercise_mins: 90 },
    { day: 'Wed', heart_rate: 67, spo2: 98, sleep_hours: 8.0, exercise_mins: 75 },
    { day: 'Thu', heart_rate: 70, spo2: 98, sleep_hours: 7.4, exercise_mins: 90 },
    { day: 'Fri', heart_rate: 65, spo2: 99, sleep_hours: 7.9, exercise_mins: 95 },
    { day: 'Sat', heart_rate: 69, spo2: 97, sleep_hours: 7.1, exercise_mins: 80 },
    { day: 'Sun', heart_rate: 68, spo2: 98, sleep_hours: 7.6, exercise_mins: 65 },
  ],
  alerts: initialStepResult.newAlerts,
  hazardScores: initialHazards,
  healthScore: initialHealth,
  radiationCumulativeMsv: 42.15,
  exerciseMinutesToday: 65,
  targetExerciseMinutes: 90,
  simState: initialStepResult.nextState,

  initializeRemoteData: async (astronautId: string) => {
    if (!repository.isRemote()) {
      set({ connectionStatus: 'offline', connectionError: null, isOfflineDemo: true });
      return;
    }

    set({ connectionStatus: 'connecting', connectionError: null, isOfflineDemo: false });
    try {
      const metrics = Object.keys(get().latestReadings) as MetricKey[];
      const series = await Promise.all(
        metrics.map(async (metric) => ({
          metric,
          readings: await repository.getSeries(astronautId, metric, 25),
        }))
      );
      const alerts = await repository.listAlerts(astronautId, true);

      set((state) => {
        if (state.astronaut.id !== astronautId) return state;

        const latestReadings = { ...state.latestReadings };
        const historySeries = { ...state.historySeries };
        series.forEach(({ metric, readings }) => {
          if (readings.length === 0) return;
          const latest = readings[readings.length - 1];
          latestReadings[metric] = latest;
          historySeries[metric] = readings.map((reading) => ({
            time: new Date(reading.recorded_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
            value: reading.value,
            status: reading.status,
          }));
        });

        const hazardScores = computeHazardScores(state.environment, latestReadings);
        return {
          latestReadings,
          historySeries,
          alerts,
          hazardScores,
          healthScore: computeHealthScore(latestReadings, hazardScores, state.exerciseMinutesToday),
          connectionStatus: 'connected',
          connectionError: null,
        };
      });
    } catch (error) {
      reportRepositoryError(error);
    }
  },

  receiveRemoteReading: (reading: Reading) => {
    set((state) => {
      if (reading.astronaut_id !== state.astronaut.id) return state;
      const latestReadings = { ...state.latestReadings, [reading.metric]: reading };
      const history = [...(state.historySeries[reading.metric] ?? [])];
      history.push({
        time: new Date(reading.recorded_at).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        value: reading.value,
        status: reading.status,
      });
      if (history.length > 25) history.shift();
      const historySeries = { ...state.historySeries, [reading.metric]: history };
      const hazardScores = computeHazardScores(state.environment, latestReadings);
      return {
        latestReadings,
        historySeries,
        hazardScores,
        healthScore: computeHealthScore(latestReadings, hazardScores, state.exerciseMinutesToday),
      };
    });
  },

  receiveRemoteAlert: (alert: Alert) => {
    set((state) => {
      const matchingIndex = state.alerts.findIndex(
        (current) =>
          current.id === alert.id ||
          (current.rule_id === alert.rule_id && current.created_at === alert.created_at)
      );
      if (matchingIndex < 0) return { alerts: [alert, ...state.alerts] };

      const alerts = [...state.alerts];
      alerts[matchingIndex] = {
        ...alert,
        acknowledged_at: alerts[matchingIndex].acknowledged_at ?? alert.acknowledged_at,
      };
      return { alerts };
    });
  },

  setEnvironment: (env: Environment) => {
    const envCfg = ENVIRONMENTS[env];
    set((state) => {
      const nextMission = {
        ...state.mission,
        environment: env,
        gravity_g: envCfg.gravity_g,
        comms_delay_s: envCfg.comms_delay_s,
      };
      const nextSimState = {
        ...state.simState,
        environment: env,
      };
      const nextHazards = computeHazardScores(env, state.latestReadings);
      const nextHealth = computeHealthScore(state.latestReadings, nextHazards, state.exerciseMinutesToday);
      return {
        environment: env,
        mission: nextMission,
        simState: nextSimState,
        hazardScores: nextHazards,
        healthScore: nextHealth,
      };
    });
  },

  setScenario: (scen: Scenario) => {
    set((state) => ({
      scenario: scen,
      simState: {
        ...state.simState,
        step: 0,
        scenario: scen,
      },
    }));
  },

  tick: () => {
    const state = get();
    if (!state.isSimulating) return;

    const { nextState, newReadings, newAlerts } = stepSimulation(state.simState);
    const astronautReadings = newReadings.map((reading) => ({
      ...reading,
      astronaut_id: state.astronaut.id,
    }));
    const astronautAlerts = newAlerts.map((alert) => ({
      ...alert,
      astronaut_id: state.astronaut.id,
    }));
    const updatedLatest = { ...state.latestReadings };
    const updatedHistory = { ...state.historySeries };
    const nowTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    astronautReadings.forEach((r) => {
      updatedLatest[r.metric] = r;
      const history = updatedHistory[r.metric] ? [...updatedHistory[r.metric]] : [];
      history.push({ time: nowTimeStr, value: r.value, status: r.status });
      if (history.length > 25) history.shift();
      updatedHistory[r.metric] = history;
    });

    const nextHazards = computeHazardScores(state.environment, updatedLatest);
    const nextHealth = computeHealthScore(updatedLatest, nextHazards, state.exerciseMinutesToday);

    // Merge alerts without spamming duplicates
    const existingRuleIds = new Set(state.alerts.map((a) => a.rule_id));
    const mergedAlerts = [...state.alerts];
    const alertsToPersist: Alert[] = [];
    astronautAlerts.forEach((a) => {
      if (!existingRuleIds.has(a.rule_id)) {
        mergedAlerts.unshift(a);
        alertsToPersist.push(a);
      }
    });

    set({
      simState: nextState,
      latestReadings: updatedLatest,
      historySeries: updatedHistory,
      alerts: mergedAlerts,
      hazardScores: nextHazards,
      healthScore: nextHealth,
      radiationCumulativeMsv: nextState.radiation_cumulative_msv,
    });
    persistAlerts(alertsToPersist);
  },

  acknowledgeAlert: (alertId: string) => {
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.id === alertId ? { ...a, acknowledged_at: new Date().toISOString() } : a
      ),
    }));
    if (repository.isRemote() && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(alertId)) {
      void repository.ackAlert(alertId).then(
        () => useAppStore.setState({ connectionStatus: 'connected', connectionError: null }),
        reportRepositoryError
      );
    }
  },

  addManualReading: (metric: MetricKey, value: number, unit?: string) => {
    const state = get();
    const reading: Reading = {
      id: `manual-${metric}-${Date.now()}`,
      astronaut_id: state.astronaut.id,
      metric,
      value,
      unit: unit || state.latestReadings[metric]?.unit || '',
      recorded_at: new Date().toISOString(),
      source: 'manual',
      status: 'green',
    };

    const updatedLatest = { ...state.latestReadings, [metric]: reading };
    const nextHazards = computeHazardScores(state.environment, updatedLatest);
    const nextHealth = computeHealthScore(updatedLatest, nextHazards, state.exerciseMinutesToday);

    set({
      latestReadings: updatedLatest,
      hazardScores: nextHazards,
      healthScore: nextHealth,
    });
    persistReadings([reading]);
  },

  toggleSimulation: () => {
    set((state) => ({ isSimulating: !state.isSimulating }));
  },

  logVitalsAndCheckin: (
    vitals: Partial<Record<MetricKey, number>>,
    checkin?: { mood?: number; sleep_hours?: number; exercise_mins?: number; note?: string }
  ) => {
    const state = get();
    const updatedLatest = { ...state.latestReadings };
    const nowIso = new Date().toISOString();
    const createdReadings: Reading[] = [];

    // Process vitals
    (Object.keys(vitals) as MetricKey[]).forEach((metric) => {
      const val = vitals[metric];
      if (val !== undefined && !isNaN(val)) {
        const reading: Reading = {
          id: `manual-${metric}-${Date.now()}`,
          astronaut_id: state.astronaut.id,
          metric,
          value: val,
          unit: state.latestReadings[metric]?.unit || '',
          recorded_at: nowIso,
          source: 'manual',
          status: 'green',
        };
        updatedLatest[metric] = reading;
        createdReadings.push(reading);
      }
    });

    // Process check-in fields
    if (checkin?.mood !== undefined) {
      const reading: Reading = {
        id: `checkin-mood-${Date.now()}`,
        astronaut_id: state.astronaut.id,
        metric: 'mood',
        value: checkin.mood,
        unit: '/5',
        recorded_at: nowIso,
        source: 'manual',
        status: checkin.mood >= 3 ? 'green' : checkin.mood >= 2 ? 'orange' : 'red',
      };
      updatedLatest.mood = reading;
      createdReadings.push(reading);
    }

    if (checkin?.sleep_hours !== undefined) {
      const reading: Reading = {
        id: `checkin-sleep-${Date.now()}`,
        astronaut_id: state.astronaut.id,
        metric: 'sleep_hours',
        value: checkin.sleep_hours,
        unit: 'h',
        recorded_at: nowIso,
        source: 'manual',
        status: checkin.sleep_hours >= 7 ? 'green' : checkin.sleep_hours >= 5.5 ? 'orange' : 'red',
      };
      updatedLatest.sleep_hours = reading;
      createdReadings.push(reading);
    }

    const nextExercise = checkin?.exercise_mins !== undefined
      ? state.exerciseMinutesToday + checkin.exercise_mins
      : state.exerciseMinutesToday;

    const nextHazards = computeHazardScores(state.environment, updatedLatest);
    const nextHealth = computeHealthScore(updatedLatest, nextHazards, nextExercise);

    set({
      latestReadings: updatedLatest,
      exerciseMinutesToday: nextExercise,
      hazardScores: nextHazards,
      healthScore: nextHealth,
    });
    persistReadings(createdReadings);
    if (checkin && Object.values(checkin).some((value) => value !== undefined)) {
      persistDailyCheckin({
        astronaut_id: state.astronaut.id,
        mood: checkin.mood,
        sleep_hours: checkin.sleep_hours,
        exercise_mins: checkin.exercise_mins ?? 0,
        note: checkin.note,
        recorded_at: nowIso,
      });
    }
  },

  switchAstronaut: (astronautId: string) => {
    const state = get();
    const targetAstronaut = state.crew.find((c) => c.id === astronautId);
    if (!targetAstronaut) return;

    // Apply personal baseline modifiers for each astronaut
    const updatedLatest = { ...state.latestReadings };
    if (astronautId === 'ast-02') {
      // Elena Rostova (CMO - excellent vitals)
      if (updatedLatest.heart_rate) updatedLatest.heart_rate.value = 62;
      if (updatedLatest.spo2) updatedLatest.spo2.value = 99;
      if (updatedLatest.blood_pressure_sys) updatedLatest.blood_pressure_sys.value = 114;
      if (updatedLatest.blood_pressure_dia) updatedLatest.blood_pressure_dia.value = 72;
      if (updatedLatest.mood) updatedLatest.mood.value = 4.8;
      if (updatedLatest.sleep_hours) updatedLatest.sleep_hours.value = 8.1;
    } else if (astronautId === 'ast-03') {
      // Marcus Vance (EVA Specialist - high physical exertion)
      if (updatedLatest.heart_rate) updatedLatest.heart_rate.value = 74;
      if (updatedLatest.spo2) updatedLatest.spo2.value = 97;
      if (updatedLatest.blood_pressure_sys) updatedLatest.blood_pressure_sys.value = 124;
      if (updatedLatest.blood_pressure_dia) updatedLatest.blood_pressure_dia.value = 78;
      if (updatedLatest.mood) updatedLatest.mood.value = 4.2;
      if (updatedLatest.sleep_hours) updatedLatest.sleep_hours.value = 6.8;
    } else if (astronautId === 'ast-04') {
      // Amina Diop (Habitat Engineer - steady metrics)
      if (updatedLatest.heart_rate) updatedLatest.heart_rate.value = 66;
      if (updatedLatest.spo2) updatedLatest.spo2.value = 98;
      if (updatedLatest.blood_pressure_sys) updatedLatest.blood_pressure_sys.value = 116;
      if (updatedLatest.blood_pressure_dia) updatedLatest.blood_pressure_dia.value = 74;
      if (updatedLatest.mood) updatedLatest.mood.value = 4.5;
      if (updatedLatest.sleep_hours) updatedLatest.sleep_hours.value = 7.7;
    } else {
      // Tariq Al-Battani (Commander)
      if (updatedLatest.heart_rate) updatedLatest.heart_rate.value = 68;
      if (updatedLatest.spo2) updatedLatest.spo2.value = 98;
      if (updatedLatest.blood_pressure_sys) updatedLatest.blood_pressure_sys.value = 118;
      if (updatedLatest.blood_pressure_dia) updatedLatest.blood_pressure_dia.value = 76;
      if (updatedLatest.mood) updatedLatest.mood.value = 4.4;
      if (updatedLatest.sleep_hours) updatedLatest.sleep_hours.value = 7.6;
    }

    const nextHazards = computeHazardScores(state.environment, updatedLatest);
    const nextHealth = computeHealthScore(updatedLatest, nextHazards, state.exerciseMinutesToday);

    set({
      astronaut: targetAstronaut,
      latestReadings: updatedLatest,
      hazardScores: nextHazards,
      healthScore: nextHealth,
    });
  },
}));
