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

  // Actions
  toggleSimulation: () => void;
  setRefreshRate: (rate: number) => void;
  setViewMode: (mode: '2D' | '3D') => void;
  toggleDayMode: () => void;
  setAiEnabled: (enabled: boolean) => void;
  setAnomalySensitivity: (sensitivity: number) => void;
  setPredictionHorizon: (horizon: number) => void;
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
    }),
    {
      name: 'air-defense-settings',
    }
  )
);
