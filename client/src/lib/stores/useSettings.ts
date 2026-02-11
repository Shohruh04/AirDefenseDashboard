import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  isSimulationRunning: boolean;
  refreshRate: number; // in seconds (1-10)
  viewMode: '2D' | '3D';
  isDayMode: boolean;
  aiEnabled: boolean;
  anomalySensitivity: number; // 1-10
  predictionHorizon: number; // 10-120 seconds
  country: string; // country config id (e.g. "germany", "uzbekistan")
  dataSource: 'simulation' | 'live' | 'hybrid';
  liveApiProvider: 'airplanes-live' | 'opensky';

  // Actions
  toggleSimulation: () => void;
  setRefreshRate: (rate: number) => void;
  setViewMode: (mode: '2D' | '3D') => void;
  toggleDayMode: () => void;
  setAiEnabled: (enabled: boolean) => void;
  setAnomalySensitivity: (sensitivity: number) => void;
  setPredictionHorizon: (horizon: number) => void;
  setCountry: (country: string) => void;
  setDataSource: (source: 'simulation' | 'live' | 'hybrid') => void;
  setLiveApiProvider: (provider: 'airplanes-live' | 'opensky') => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      isSimulationRunning: true,
      refreshRate: 2,
      viewMode: '3D',
      isDayMode: true,
      aiEnabled: true,
      anomalySensitivity: 5,
      predictionHorizon: 50,
      country: 'germany',
      dataSource: 'hybrid',
      liveApiProvider: 'airplanes-live',

      toggleSimulation: () => set((state) => ({
        isSimulationRunning: !state.isSimulationRunning
      })),

      setRefreshRate: (rate) => set({ refreshRate: rate }),

      setViewMode: (mode) => set({ viewMode: mode }),

      toggleDayMode: () => set((state) => ({
        isDayMode: !state.isDayMode
      })),

      setAiEnabled: (enabled) => set({ aiEnabled: enabled }),

      setAnomalySensitivity: (sensitivity) => set({ anomalySensitivity: sensitivity }),

      setPredictionHorizon: (horizon) => set({ predictionHorizon: horizon }),

      setCountry: (country) => set({ country }),

      setDataSource: (source) => set({ dataSource: source }),

      setLiveApiProvider: (provider) => set({ liveApiProvider: provider }),
    }),
    {
      name: 'air-defense-settings',
    }
  )
);
