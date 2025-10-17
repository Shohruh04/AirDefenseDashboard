import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  isSimulationRunning: boolean;
  refreshRate: number; // in seconds (1-10)
  viewMode: '2D' | '3D';
  isDayMode: boolean;
  
  // Actions
  toggleSimulation: () => void;
  setRefreshRate: (rate: number) => void;
  setViewMode: (mode: '2D' | '3D') => void;
  toggleDayMode: () => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      isSimulationRunning: true,
      refreshRate: 2,
      viewMode: '3D',
      isDayMode: true,
      
      toggleSimulation: () => set((state) => ({
        isSimulationRunning: !state.isSimulationRunning
      })),
      
      setRefreshRate: (rate) => set({ refreshRate: rate }),
      
      setViewMode: (mode) => set({ viewMode: mode }),
      
      toggleDayMode: () => set((state) => ({
        isDayMode: !state.isDayMode
      })),
    }),
    {
      name: 'air-defense-settings',
    }
  )
);
