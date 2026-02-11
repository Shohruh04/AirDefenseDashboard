import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { useSettings } from './useSettings';
import { getCountryConfig } from '@shared/countryConfigs';
import type { Aircraft } from '../simulation';

interface LiveAircraftState {
  liveAircraft: Aircraft[];
  isLoading: boolean;
  error: string | null;
  lastFetch: number;
  pollInterval: NodeJS.Timeout | null;

  // Actions
  fetchAircraft: () => Promise<void>;
  startPolling: () => void;
  stopPolling: () => void;
}

export const useLiveAircraft = create<LiveAircraftState>()(
  subscribeWithSelector((set, get) => ({
    liveAircraft: [],
    isLoading: false,
    error: null,
    lastFetch: 0,
    pollInterval: null,

    fetchAircraft: async () => {
      const { country, liveApiProvider } = useSettings.getState();
      const config = getCountryConfig(country);
      const { radarCenter } = config;

      set({ isLoading: true, error: null });

      try {
        const url = `/api/live/aircraft?lat=${radarCenter.lat}&lng=${radarCenter.lng}&radius=200&provider=${liveApiProvider}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`API returned ${res.status}`);
        const json = await res.json();

        const aircraft: Aircraft[] = (json.aircraft || []).map((raw: any) => ({
          id: raw.id,
          callsign: raw.callsign || raw.hex || 'Unknown',
          type: raw.type || 'Unknown',
          model: raw.model || 'Unknown',
          position: {
            lat: raw.position.lat,
            lng: raw.position.lng,
            altitude: raw.position.altitude,
          },
          speed: raw.speed,
          heading: raw.heading,
          threatLevel: 'NEUTRAL' as const,
          lastUpdate: Date.now(),
        }));

        set({
          liveAircraft: aircraft,
          isLoading: false,
          lastFetch: Date.now(),
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        set({ isLoading: false, error: message });
      }
    },

    startPolling: () => {
      const state = get();
      if (state.pollInterval) return; // Already polling

      // Fetch immediately
      get().fetchAircraft();

      // Then poll every 5 seconds
      const interval = setInterval(() => {
        get().fetchAircraft();
      }, 5000);

      set({ pollInterval: interval });
    },

    stopPolling: () => {
      const { pollInterval } = get();
      if (pollInterval) {
        clearInterval(pollInterval);
        set({ pollInterval: null, liveAircraft: [] });
      }
    },
  }))
);
