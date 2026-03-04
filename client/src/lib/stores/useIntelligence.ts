import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export interface GdeltEvent {
  id: string;
  title: string;
  url: string;
  sourceLang: string;
  domain: string;
  lat: number;
  lng: number;
  tone: number;
  goldsteinScale: number;
  date: string;
  imageUrl?: string;
  category: string;
}

export interface RiskScore {
  riskScore: number;
  breakdown: {
    geopolitical: number;
    military: number;
    disaster: number;
    anomaly: number;
  };
  level: string;
  nearbyEventCount: number;
  avgTone: number;
  avgGoldstein: number;
  timestamp: number;
}

interface RiskHistoryEntry {
  score: number;
  level: string;
  timestamp: number;
}

interface IntelligenceState {
  events: GdeltEvent[];
  riskScore: RiskScore | null;
  riskHistory: RiskHistoryEntry[];
  isLoading: boolean;
  lastFetch: number;
  error: string | null;

  fetchEvents: (query?: string) => Promise<void>;
  fetchRiskScore: (lat: number, lng: number, extra?: { militaryCount?: number; disasterCount?: number; anomalyCount?: number }) => Promise<void>;
  startPolling: (lat: number, lng: number) => void;
  stopPolling: () => void;
}

let pollInterval: ReturnType<typeof setInterval> | null = null;
const MAX_RISK_HISTORY = 50;

export const useIntelligence = create<IntelligenceState>()(
  subscribeWithSelector((set, get) => ({
    events: [],
    riskScore: null,
    riskHistory: [],
    isLoading: false,
    lastFetch: 0,
    error: null,

    fetchEvents: async (query?: string) => {
      set({ isLoading: true, error: null });
      try {
        const q = encodeURIComponent(query || 'conflict OR military OR protest OR attack');
        const res = await fetch(`/api/intelligence/events?query=${q}&limit=50&timespan=7d`);
        const data = await res.json();
        if (data.error && data.count === 0) {
          set({ error: data.error, isLoading: false });
        } else {
          set({ events: data.events || [], lastFetch: Date.now(), isLoading: false });
        }
      } catch {
        set({ error: 'Failed to fetch intelligence events', isLoading: false });
      }
    },

    fetchRiskScore: async (lat, lng, extra) => {
      try {
        let url = `/api/intelligence/risk-score?lat=${lat}&lng=${lng}`;
        if (extra?.militaryCount) url += `&militaryCount=${extra.militaryCount}`;
        if (extra?.disasterCount) url += `&disasterCount=${extra.disasterCount}`;
        if (extra?.anomalyCount) url += `&anomalyCount=${extra.anomalyCount}`;

        const res = await fetch(url);
        const data = await res.json();
        if (data.riskScore !== undefined) {
          const entry: RiskHistoryEntry = {
            score: data.riskScore,
            level: data.level,
            timestamp: Date.now(),
          };
          set((state) => ({
            riskScore: data,
            riskHistory: [...state.riskHistory.slice(-MAX_RISK_HISTORY + 1), entry],
          }));
        }
      } catch {
        // Silently fail for risk score
      }
    },

    startPolling: (lat, lng) => {
      get().stopPolling();
      get().fetchEvents();
      get().fetchRiskScore(lat, lng);
      // Poll every 10 minutes
      pollInterval = setInterval(() => {
        get().fetchEvents();
        get().fetchRiskScore(lat, lng);
      }, 600000);
    },

    stopPolling: () => {
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
    },
  }))
);
