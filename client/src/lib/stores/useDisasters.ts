import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export interface Earthquake {
  id: string;
  magnitude: number;
  place: string;
  time: number;
  lat: number;
  lng: number;
  depth: number;
  type: string;
  tsunami: boolean;
  url: string;
}

export interface NaturalEvent {
  id: string;
  title: string;
  category: string;
  lat: number;
  lng: number;
  date: string;
  source: string;
  sourceUrl: string;
  magnitudeValue?: number;
  magnitudeUnit?: string;
}

interface DisasterState {
  earthquakes: Earthquake[];
  naturalEvents: NaturalEvent[];
  isLoading: boolean;
  lastFetch: number;
  error: string | null;

  fetchDisasters: () => Promise<void>;
  startPolling: () => void;
  stopPolling: () => void;
}

let pollInterval: ReturnType<typeof setInterval> | null = null;

export const useDisasters = create<DisasterState>()(
  subscribeWithSelector((set, get) => ({
    earthquakes: [],
    naturalEvents: [],
    isLoading: false,
    lastFetch: 0,
    error: null,

    fetchDisasters: async () => {
      set({ isLoading: true, error: null });
      try {
        const res = await fetch('/api/disasters/summary');
        const data = await res.json();
        if (data.error && data.totalCount === 0) {
          set({ error: data.error, isLoading: false });
        } else {
          set({
            earthquakes: data.earthquakes || [],
            naturalEvents: data.naturalEvents || [],
            lastFetch: Date.now(),
            isLoading: false,
          });
        }
      } catch {
        set({ error: 'Failed to fetch disaster data', isLoading: false });
      }
    },

    startPolling: () => {
      get().stopPolling();
      get().fetchDisasters();
      // Poll every 5 minutes
      pollInterval = setInterval(() => {
        get().fetchDisasters();
      }, 300000);
    },

    stopPolling: () => {
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
    },
  }))
);
