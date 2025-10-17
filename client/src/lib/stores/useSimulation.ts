import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { generateRandomAircraft, generateRandomAlert, type Aircraft, type Alert } from '../simulation';

interface SimulationState {
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
  isRunning: boolean;
  
  // Actions
  startSimulation: () => void;
  stopSimulation: () => void;
  updateAircraft: (aircraft: Aircraft[]) => void;
  addAlert: (alert: Alert) => void;
  updateSystemStatus: () => void;
  updateAnalytics: () => void;
}

let simulationInterval: NodeJS.Timeout | null = null;
let alertInterval: NodeJS.Timeout | null = null;
let analyticsInterval: NodeJS.Timeout | null = null;

export const useSimulation = create<SimulationState>()(
  subscribeWithSelector((set, get) => ({
    aircraft: [],
    alerts: [],
    systemStatus: {
      radarUptime: 98.7,
      aircraftCount: 0,
      threatLevel: 'LOW',
      systemReadiness: 95.2,
    },
    analytics: {
      detectionsPerMinute: Array(20).fill(0).map(() => Math.floor(Math.random() * 15) + 5),
      altitudeDistribution: [
        { altitude: 1000, count: Math.floor(Math.random() * 20) + 10 },
        { altitude: 3000, count: Math.floor(Math.random() * 30) + 15 },
        { altitude: 5000, count: Math.floor(Math.random() * 25) + 20 },
        { altitude: 7000, count: Math.floor(Math.random() * 20) + 10 },
        { altitude: 9000, count: Math.floor(Math.random() * 15) + 5 },
        { altitude: 11000, count: Math.floor(Math.random() * 10) + 2 },
      ],
      systemLoad: Array(20).fill(0).map(() => Math.floor(Math.random() * 40) + 30),
    },
    isRunning: false,

    startSimulation: () => {
      const state = get();
      if (state.isRunning) return;

      set({ isRunning: true });

      // Generate initial aircraft
      const initialAircraft = Array(8).fill(0).map(() => generateRandomAircraft());
      set({ aircraft: initialAircraft });

      // Update aircraft positions every 2 seconds
      simulationInterval = setInterval(() => {
        const currentState = get();
        const updatedAircraft = currentState.aircraft.map(aircraft => {
          // Update position based on speed and direction
          const speed = aircraft.speed / 3600; // Convert km/h to km/s
          const deltaTime = 2; // 2 seconds
          
          const newLat = aircraft.position.lat + (speed * deltaTime * Math.cos(aircraft.heading * Math.PI / 180)) / 111;
          const newLng = aircraft.position.lng + (speed * deltaTime * Math.sin(aircraft.heading * Math.PI / 180)) / (111 * Math.cos(aircraft.position.lat * Math.PI / 180));
          
          // Keep aircraft in bounds (roughly Europe area)
          const boundedLat = Math.max(35, Math.min(70, newLat));
          const boundedLng = Math.max(-10, Math.min(40, newLng));
          
          return {
            ...aircraft,
            position: { lat: boundedLat, lng: boundedLng },
            lastUpdate: Date.now(),
          };
        });

        // Occasionally add new aircraft or remove old ones
        let finalAircraft = updatedAircraft;
        if (Math.random() < 0.1 && finalAircraft.length < 12) {
          finalAircraft.push(generateRandomAircraft());
        } else if (Math.random() < 0.05 && finalAircraft.length > 3) {
          finalAircraft = finalAircraft.slice(1);
        }

        set({ aircraft: finalAircraft });
        get().updateSystemStatus();
      }, 2000);

      // Generate alerts every 5-15 seconds
      alertInterval = setInterval(() => {
        if (Math.random() < 0.7) { // 70% chance to generate alert
          const alert = generateRandomAlert();
          get().addAlert(alert);
        }
      }, Math.random() * 10000 + 5000);

      // Update analytics every 10 seconds
      analyticsInterval = setInterval(() => {
        get().updateAnalytics();
      }, 10000);
    },

    stopSimulation: () => {
      set({ isRunning: false });
      
      if (simulationInterval) {
        clearInterval(simulationInterval);
        simulationInterval = null;
      }
      if (alertInterval) {
        clearInterval(alertInterval);
        alertInterval = null;
      }
      if (analyticsInterval) {
        clearInterval(analyticsInterval);
        analyticsInterval = null;
      }
    },

    updateAircraft: (aircraft) => set({ aircraft }),

    addAlert: (alert) => set((state) => ({
      alerts: [alert, ...state.alerts.slice(0, 99)] // Keep last 100 alerts
    })),

    updateSystemStatus: () => {
      const state = get();
      const aircraftCount = state.aircraft.length;
      const threatLevel = aircraftCount > 10 ? 'HIGH' : aircraftCount > 6 ? 'MEDIUM' : 'LOW';
      
      set((currentState) => ({
        systemStatus: {
          ...currentState.systemStatus,
          aircraftCount,
          threatLevel,
          radarUptime: Math.max(95, currentState.systemStatus.radarUptime + (Math.random() - 0.5) * 0.1),
          systemReadiness: Math.max(90, Math.min(100, currentState.systemStatus.systemReadiness + (Math.random() - 0.5) * 2)),
        }
      }));
    },

    updateAnalytics: () => {
      set((state) => {
        const newDetection = Math.floor(Math.random() * 15) + 5;
        const newSystemLoad = Math.floor(Math.random() * 40) + 30;
        
        return {
          analytics: {
            ...state.analytics,
            detectionsPerMinute: [...state.analytics.detectionsPerMinute.slice(1), newDetection],
            systemLoad: [...state.analytics.systemLoad.slice(1), newSystemLoad],
            altitudeDistribution: state.analytics.altitudeDistribution.map(item => ({
              ...item,
              count: Math.max(0, item.count + Math.floor(Math.random() * 6) - 3)
            }))
          }
        };
      });
    },
  }))
);
