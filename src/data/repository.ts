// Generated with AI assistance (Antigravity). Reviewed by the team.
import { MetricKey, Reading, Alert } from './types';
import { supabase, isSupabaseConfigured } from './supabaseClient';

export interface HealthRepository {
  getLatest(astronautId: string, metric: MetricKey): Promise<Reading | null>;
  getSeries(astronautId: string, metric: MetricKey, limit?: number): Promise<Reading[]>;
  insertReading(reading: Omit<Reading, 'id'>): Promise<Reading>;
  insertReadings(readings: Omit<Reading, 'id'>[]): Promise<Reading[]>;
  insertAlerts(alerts: Omit<Alert, 'id'>[]): Promise<Alert[]>;
  insertDailyCheckin(checkin: DailyCheckin): Promise<void>;
  subscribe(
    astronautId: string,
    onReading: (reading: Reading) => void,
    onAlert: (alert: Alert) => void
  ): () => void;
  listAlerts(astronautId: string, includeAck?: boolean): Promise<Alert[]>;
  ackAlert(alertId: string): Promise<void>;
  isRemote(): boolean;
}

export interface DailyCheckin {
  astronaut_id: string;
  mood?: number;
  sleep_hours?: number;
  exercise_mins: number;
  note?: string;
  recorded_at: string;
}

/**
 * 1. SUPABASE REPOSITORY (Remote PostgreSQL + Realtime WebSockets)
 */
export class SupabaseRepository implements HealthRepository {
  isRemote(): boolean {
    return true;
  }

  async getLatest(astronautId: string, metric: MetricKey): Promise<Reading | null> {
    if (!supabase) throw new Error('Supabase client not initialized');
    const { data, error } = await supabase
      .from('readings')
      .select('*')
      .eq('astronaut_id', astronautId)
      .eq('metric', metric)
      .order('recorded_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;
    return {
      ...data,
      status: data.status || 'green',
    };
  }

  async getSeries(astronautId: string, metric: MetricKey, limit = 50): Promise<Reading[]> {
    if (!supabase) throw new Error('Supabase client not initialized');
    const { data, error } = await supabase
      .from('readings')
      .select('*')
      .eq('astronaut_id', astronautId)
      .eq('metric', metric)
      .order('recorded_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    if (!data) return [];
    return data.reverse();
  }

  async insertReading(reading: Omit<Reading, 'id'>): Promise<Reading> {
    if (!supabase) throw new Error('Supabase client not initialized');
    const { data, error } = await supabase
      .from('readings')
      .insert({
        ...reading,
        source: reading.source || 'simulated',
      })
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }

  async insertReadings(readings: Omit<Reading, 'id'>[]): Promise<Reading[]> {
    if (!supabase) throw new Error('Supabase client not initialized');
    if (readings.length === 0) return [];

    const { data, error } = await supabase
      .from('readings')
      .insert(readings)
      .select('*');

    if (error) throw error;
    return data ?? [];
  }

  async insertAlerts(alerts: Omit<Alert, 'id'>[]): Promise<Alert[]> {
    if (!supabase) throw new Error('Supabase client not initialized');
    if (alerts.length === 0) return [];

    const { data, error } = await supabase
      .from('alerts')
      .insert(alerts)
      .select('*');

    if (error) throw error;
    return data ?? [];
  }

  async insertDailyCheckin(checkin: DailyCheckin): Promise<void> {
    if (!supabase) throw new Error('Supabase client not initialized');
    const { error } = await supabase.from('daily_checkins').insert(checkin);
    if (error) throw error;
  }

  subscribe(
    astronautId: string,
    onReading: (reading: Reading) => void,
    onAlert: (alert: Alert) => void
  ): () => void {
    if (!supabase) throw new Error('Supabase client not initialized');

    const channel = supabase
      .channel(`astronaut-${astronautId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'readings', filter: `astronaut_id=eq.${astronautId}` },
        (payload) => onReading(payload.new as Reading)
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'alerts', filter: `astronaut_id=eq.${astronautId}` },
        (payload) => onAlert(payload.new as Alert)
      )
      .subscribe();

    return () => {
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };
  }

  async listAlerts(astronautId: string, includeAck = false): Promise<Alert[]> {
    if (!supabase) throw new Error('Supabase client not initialized');
    let query = supabase
      .from('alerts')
      .select('*')
      .eq('astronaut_id', astronautId)
      .order('created_at', { ascending: false });

    if (!includeAck) {
      query = query.is('acknowledged_at', null);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  }

  async ackAlert(alertId: string): Promise<void> {
    if (!supabase) throw new Error('Supabase client not initialized');
    const { error } = await supabase
      .from('alerts')
      .update({ acknowledged_at: new Date().toISOString() })
      .eq('id', alertId);
    if (error) throw error;
  }
}

/**
 * 2. LOCAL IN-MEMORY REPOSITORY (Resilient Offline Fallback with zero configuration)
 */
export class InMemoryRepository implements HealthRepository {
  private readings: Reading[] = [];
  private alerts: Alert[] = [];
  private dailyCheckins: DailyCheckin[] = [];
  private readingListeners: ((reading: Reading) => void)[] = [];
  private alertListeners: ((alert: Alert) => void)[] = [];

  constructor() {
    this.seedInitial();
  }

  isRemote(): boolean {
    return false;
  }

  private seedInitial() {
    const now = Date.now();
    const metrics: MetricKey[] = ['heart_rate', 'spo2', 'blood_pressure_sys', 'body_temp', 'sleep_hours', 'cabin_co2', 'radiation_dose_rate'];
    const baselines: Record<MetricKey, number> = {
      heart_rate: 68,
      spo2: 98,
      blood_pressure_sys: 118,
      blood_pressure_dia: 76,
      body_temp: 36.8,
      glucose: 88,
      sleep_hours: 7.6,
      mood: 4.4,
      cabin_co2: 1200,
      radiation_dose_rate: 22.0,
    };

    metrics.forEach((m) => {
      for (let i = 24; i >= 0; i--) {
        this.readings.push({
          id: `seed-${m}-${i}`,
          astronaut_id: 'ast-01',
          metric: m,
          value: Number((baselines[m] * (1 + (Math.random() - 0.5) * 0.05)).toFixed(1)),
          unit: m === 'spo2' ? '%' : m === 'heart_rate' ? 'bpm' : 'unit',
          recorded_at: new Date(now - i * 3600000).toISOString(),
          source: 'simulated',
          status: 'green',
        });
      }
    });
  }

  async getLatest(astronautId: string, metric: MetricKey): Promise<Reading | null> {
    const filtered = this.readings
      .filter((r) => r.astronaut_id === astronautId && r.metric === metric)
      .sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime());
    return filtered[0] || null;
  }

  async getSeries(astronautId: string, metric: MetricKey, limit = 50): Promise<Reading[]> {
    return this.readings
      .filter((r) => r.astronaut_id === astronautId && r.metric === metric)
      .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime())
      .slice(-limit);
  }

  async insertReading(readingData: Omit<Reading, 'id'>): Promise<Reading> {
    const reading: Reading = {
      ...readingData,
      id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      source: readingData.source || 'simulated',
    };
    this.readings.push(reading);
    this.readingListeners.forEach((l) => l(reading));
    return reading;
  }

  async insertReadings(readings: Omit<Reading, 'id'>[]): Promise<Reading[]> {
    const inserted: Reading[] = [];
    for (const reading of readings) {
      inserted.push(await this.insertReading(reading));
    }
    return inserted;
  }

  async insertAlerts(alerts: Omit<Alert, 'id'>[]): Promise<Alert[]> {
    return alerts.map((alert, index) => {
      const inserted = {
        ...alert,
        id: `local-alert-${Date.now()}-${index}`,
      };
      this.pushAlert(inserted);
      return inserted;
    });
  }

  async insertDailyCheckin(checkin: DailyCheckin): Promise<void> {
    this.dailyCheckins.push(checkin);
  }

  subscribe(
    astronautId: string,
    onReading: (reading: Reading) => void,
    onAlert: (alert: Alert) => void
  ): () => void {
    const rListener = (r: Reading) => {
      if (r.astronaut_id === astronautId) onReading(r);
    };
    const aListener = (a: Alert) => {
      if (a.astronaut_id === astronautId) onAlert(a);
    };

    this.readingListeners.push(rListener);
    this.alertListeners.push(aListener);

    return () => {
      this.readingListeners = this.readingListeners.filter((l) => l !== rListener);
      this.alertListeners = this.alertListeners.filter((l) => l !== aListener);
    };
  }

  async listAlerts(astronautId: string, includeAck = false): Promise<Alert[]> {
    return this.alerts
      .filter((a) => a.astronaut_id === astronautId && (includeAck || !a.acknowledged_at))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  async ackAlert(alertId: string): Promise<void> {
    this.alerts = this.alerts.map((a) =>
      a.id === alertId ? { ...a, acknowledged_at: new Date().toISOString() } : a
    );
  }

  pushAlert(alert: Alert) {
    this.alerts.unshift(alert);
    this.alertListeners.forEach((l) => l(alert));
  }
}

// FACTORY: Automatically selects repository based on environment
export function createHealthRepository(): HealthRepository {
  if (isSupabaseConfigured && supabase) {
    return new SupabaseRepository();
  }
  return new InMemoryRepository();
}

export const repository = createHealthRepository();
