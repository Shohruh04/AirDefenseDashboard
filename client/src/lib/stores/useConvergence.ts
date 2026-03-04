import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

type EventType = "military_aircraft" | "conflict" | "disaster" | "anomalous_flight" | "weather_disruption";

export interface ConvergenceZone {
  id: string;
  cellLat: number;
  cellLng: number;
  eventTypes: EventType[];
  events: Array<{
    type: EventType;
    lat: number;
    lng: number;
    timestamp: number;
    description: string;
    severity: number;
  }>;
  severity: number;
  detectedAt: number;
  lastUpdated: number;
}

interface ConvergenceConfig {
  gridSizeDegrees: number;
  timeWindowHours: number;
  minEventTypes: number;
  demoMode: boolean;
}

interface ConvergenceState {
  zones: ConvergenceZone[];
  config: ConvergenceConfig;
  isLoading: boolean;
  lastFetch: number;
  error: string | null;

  fetchZones: () => Promise<void>;
  updateConfig: (config: Partial<{ demoMode: boolean; minEventTypes: number; gridSizeDegrees: number; timeWindowHours: number }>) => Promise<void>;
  ingestEvents: (events: Array<{ type: EventType; lat: number; lng: number; description: string; severity: number }>) => Promise<void>;
  startPolling: () => void;
  stopPolling: () => void;
}

let pollInterval: ReturnType<typeof setInterval> | null = null;

export const useConvergence = create<ConvergenceState>()(
  subscribeWithSelector((set, get) => ({
    zones: [],
    config: {
      gridSizeDegrees: 1,
      timeWindowHours: 24,
      minEventTypes: 3,
      demoMode: false,
    },
    isLoading: false,
    lastFetch: 0,
    error: null,

    fetchZones: async () => {
      set({ isLoading: true, error: null });
      try {
        const res = await fetch('/api/convergence/zones');
        const data = await res.json();
        set({
          zones: data.zones || [],
          config: data.config || get().config,
          lastFetch: Date.now(),
          isLoading: false,
        });
      } catch {
        set({ error: 'Failed to fetch convergence zones', isLoading: false });
      }
    },

    updateConfig: async (configUpdate) => {
      try {
        const res = await fetch('/api/convergence/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(configUpdate),
        });
        const data = await res.json();
        if (data.config) {
          set({ config: data.config });
        }
        // Re-fetch zones with new config
        get().fetchZones();
      } catch {
        // Silently fail
      }
    },

    ingestEvents: async (events) => {
      try {
        await fetch('/api/convergence/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ events: events.map((e) => ({ ...e, timestamp: Date.now() })) }),
        });
      } catch {
        // Silently fail
      }
    },

    startPolling: () => {
      get().stopPolling();
      get().fetchZones();
      // Poll every 30 seconds
      pollInterval = setInterval(() => {
        get().fetchZones();
      }, 30000);
    },

    stopPolling: () => {
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
    },
  }))
);
