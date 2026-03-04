import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export interface WeatherData {
  temperature: number;
  humidity: number;
  apparentTemperature: number;
  precipitation: number;
  rain: number;
  snowfall: number;
  cloudCover: number;
  windSpeed: number;
  windDirection: number;
  windGusts: number;
  visibility: number;
  weatherCode: number;
  weatherDescription: string;
  timestamp: number;
  location: { lat: number; lng: number };
  operationalImpact: {
    radarEffectiveness: number;
    visibilityRating: string;
    flightConditions: string;
    missileGuidance: string;
  };
}

export interface WeatherGridPoint {
  lat: number;
  lng: number;
  windSpeed: number;
  windDirection: number;
  cloudCover: number;
  visibility: number;
  weatherCode: number;
  precipitation: number;
}

interface WeatherState {
  current: WeatherData | null;
  gridPoints: WeatherGridPoint[];
  isLoading: boolean;
  lastFetch: number;
  error: string | null;

  fetchCurrentWeather: (lat: number, lng: number) => Promise<void>;
  fetchWeatherGrid: (bounds: { latMin: number; latMax: number; lngMin: number; lngMax: number }) => Promise<void>;
  startPolling: (lat: number, lng: number) => void;
  stopPolling: () => void;
}

let pollInterval: ReturnType<typeof setInterval> | null = null;

export const useWeather = create<WeatherState>()(
  subscribeWithSelector((set, get) => ({
    current: null,
    gridPoints: [],
    isLoading: false,
    lastFetch: 0,
    error: null,

    fetchCurrentWeather: async (lat: number, lng: number) => {
      set({ isLoading: true, error: null });
      try {
        const res = await fetch(`/api/weather/current?lat=${lat}&lng=${lng}`);
        const data = await res.json();
        if (data.error && !data.temperature) {
          set({ error: data.error, isLoading: false });
        } else {
          set({ current: data, lastFetch: Date.now(), isLoading: false });
        }
      } catch (err) {
        set({ error: 'Failed to fetch weather', isLoading: false });
      }
    },

    fetchWeatherGrid: async (bounds) => {
      try {
        const res = await fetch(
          `/api/weather/grid?latMin=${bounds.latMin}&latMax=${bounds.latMax}&lngMin=${bounds.lngMin}&lngMax=${bounds.lngMax}&step=2`
        );
        const data = await res.json();
        if (data.points) {
          set({ gridPoints: data.points });
        }
      } catch {
        // Silently fail for grid data
      }
    },

    startPolling: (lat: number, lng: number) => {
      get().stopPolling();
      // Fetch immediately
      get().fetchCurrentWeather(lat, lng);
      // Poll every 60 seconds
      pollInterval = setInterval(() => {
        get().fetchCurrentWeather(lat, lng);
      }, 60000);
    },

    stopPolling: () => {
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
    },
  }))
);
