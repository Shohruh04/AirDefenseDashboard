import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { generateRandomAircraft, generateRandomAlert, type Aircraft, type Alert, type Missile } from '../simulation';
import { usePlayback } from './usePlayback';

interface SimulationState {
  aircraft: Aircraft[];
  alerts: Alert[];
  missiles: Missile[];
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
  launchMissile: (targetId: string) => void;
  updateMissiles: () => void;
}

let simulationInterval: NodeJS.Timeout | null = null;
let alertInterval: NodeJS.Timeout | null = null;
let analyticsInterval: NodeJS.Timeout | null = null;
let missileInterval: NodeJS.Timeout | null = null;
let missileLaunchInterval: NodeJS.Timeout | null = null;

export const useSimulation = create<SimulationState>()(
  subscribeWithSelector((set, get) => ({
    aircraft: [],
    alerts: [],
    missiles: [],
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
        const playbackState = usePlayback.getState();
        
        // Skip updates if paused or rewinding
        if (playbackState.isPaused || playbackState.isRewinding) {
          // If rewinding, use historical snapshot
          if (playbackState.isRewinding) {
            const snapshot = playbackState.getCurrentSnapshot();
            if (snapshot) {
              set({
                aircraft: snapshot.aircraft,
                alerts: snapshot.alerts,
                systemStatus: snapshot.systemStatus,
                analytics: snapshot.analytics,
              });
            }
          }
          return;
        }
        
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
            position: { lat: boundedLat, lng: boundedLng, altitude: aircraft.position.altitude },
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
        
        // Save snapshot to history
        const newState = get();
        playbackState.addSnapshot({
          timestamp: Date.now(),
          aircraft: newState.aircraft,
          alerts: newState.alerts,
          systemStatus: newState.systemStatus,
          analytics: newState.analytics,
        });
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

      // Update missiles every 100ms for smooth animation
      missileInterval = setInterval(() => {
        get().updateMissiles();
      }, 100);

      // Auto-launch missiles at hostile/suspect targets every 8-15 seconds
      missileLaunchInterval = setInterval(() => {
        const currentState = get();
        const threats = currentState.aircraft.filter(
          ac => (ac.threatLevel === 'HOSTILE' || ac.threatLevel === 'SUSPECT') && 
          !currentState.missiles.some(m => m.targetId === ac.id && m.active)
        );
        
        if (threats.length > 0 && Math.random() < 0.6) {
          const target = threats[Math.floor(Math.random() * threats.length)];
          get().launchMissile(target.id);
        }
      }, Math.random() * 7000 + 8000);
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
      if (missileInterval) {
        clearInterval(missileInterval);
        missileInterval = null;
      }
      if (missileLaunchInterval) {
        clearInterval(missileLaunchInterval);
        missileLaunchInterval = null;
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

    launchMissile: (targetId: string) => {
      const state = get();
      const target = state.aircraft.find(ac => ac.id === targetId);
      if (!target) return;

      // Radar center position
      const radarPosition = {
        lat: 50.0,
        lng: 10.0,
        altitude: 0
      };

      const missile: Missile = {
        id: `MSL${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        startPosition: { ...radarPosition },
        targetPosition: { ...target.position },
        currentPosition: { ...radarPosition },
        targetId,
        launchTime: Date.now(),
        speed: 3000, // 3000 km/h (very fast)
        active: true
      };

      set((state) => ({
        missiles: [...state.missiles, missile]
      }));

      // Add alert for missile launch
      const alert: Alert = {
        id: `ALT${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
        timestamp: Date.now(),
        type: 'SYSTEM',
        message: `Interceptor missile launched at ${target.callsign}`,
        priority: 'HIGH',
        position: {
          lat: radarPosition.lat,
          lng: radarPosition.lng
        }
      };
      get().addAlert(alert);
    },

    updateMissiles: () => {
      const state = get();
      const updatedMissiles = state.missiles
        .map(missile => {
          if (!missile.active) return missile;

          const target = state.aircraft.find(ac => ac.id === missile.targetId);
          if (!target) {
            return { ...missile, active: false };
          }

          // Update target position
          missile.targetPosition = { ...target.position };

          // Calculate direction vector
          const dx = missile.targetPosition.lat - missile.currentPosition.lat;
          const dy = missile.targetPosition.lng - missile.currentPosition.lng;
          const dz = missile.targetPosition.altitude - missile.currentPosition.altitude;
          const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

          // Check if missile reached target
          if (distance < 0.1) {
            return { ...missile, active: false };
          }

          // Move missile towards target
          const speed = missile.speed / 3600; // Convert km/h to km/s for 2-second intervals
          const step = speed / distance;

          return {
            ...missile,
            currentPosition: {
              lat: missile.currentPosition.lat + dx * step,
              lng: missile.currentPosition.lng + dy * step,
              altitude: missile.currentPosition.altitude + dz * step
            }
          };
        })
        .filter(missile => missile.active || Date.now() - missile.launchTime < 10000); // Keep for 10 seconds

      set({ missiles: updatedMissiles });
    },
  }))
);
