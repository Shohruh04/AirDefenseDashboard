import { create } from 'zustand';
import type { Aircraft, Alert } from '../simulation';

interface HistoricalSnapshot {
  timestamp: number;
  aircraft: Aircraft[];
  alerts: Alert[];
  systemStatus: {
    radarUptime: number;
    aircraftCount: number;
    threatLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    systemReadiness: number;
  };
  analytics: {
    detectionsPerMinute: number[];
    altitudeDistribution: { altitude: number; count: number }[];
    systemLoad: number[];
  };
}

interface PlaybackState {
  isPaused: boolean;
  isRewinding: boolean;
  history: HistoricalSnapshot[];
  currentHistoryIndex: number;
  maxHistorySize: number;
  
  // Actions
  togglePause: () => void;
  addSnapshot: (snapshot: HistoricalSnapshot) => void;
  rewind: (steps: number) => void;
  getCurrentSnapshot: () => HistoricalSnapshot | null;
  clearHistory: () => void;
}

export const usePlayback = create<PlaybackState>((set, get) => ({
  isPaused: false,
  isRewinding: false,
  history: [],
  currentHistoryIndex: -1,
  maxHistorySize: 100, // Store last 100 snapshots
  
  togglePause: () => set((state) => ({
    isPaused: !state.isPaused,
    isRewinding: false,
  })),
  
  addSnapshot: (snapshot: HistoricalSnapshot) => {
    const state = get();
    
    // Don't add snapshots while rewinding
    if (state.isRewinding) return;
    
    // Add snapshot and maintain max size
    const newHistory = [...state.history, snapshot];
    if (newHistory.length > state.maxHistorySize) {
      newHistory.shift();
    }
    
    set({
      history: newHistory,
      currentHistoryIndex: newHistory.length - 1,
    });
  },
  
  rewind: (steps: number) => {
    const state = get();
    const newIndex = Math.max(0, state.currentHistoryIndex - steps);
    
    set({
      currentHistoryIndex: newIndex,
      isRewinding: true,
      isPaused: true,
    });
  },
  
  getCurrentSnapshot: () => {
    const state = get();
    if (state.currentHistoryIndex >= 0 && state.currentHistoryIndex < state.history.length) {
      return state.history[state.currentHistoryIndex];
    }
    return null;
  },
  
  clearHistory: () => set({
    history: [],
    currentHistoryIndex: -1,
    isRewinding: false,
  }),
}));
