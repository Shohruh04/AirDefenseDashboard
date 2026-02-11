import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import {
  generateRandomAircraft,
  generateSmartAlert,
  classifyAircraftThreat,
  detectAnomaly,
  buildPriorityQueue,
  pickRandomSAM,
  type Aircraft,
  type Alert,
  type Missile,
  type Explosion,
  type PredictedPosition,
  type PriorityTarget,
} from '../simulation';
import { usePlayback } from './usePlayback';
import { useAudio } from './useAudio';

export interface AiMetrics {
  classificationsPerSecond: number;
  averageConfidence: number;
  modelAccuracy: number;
  anomaliesDetected: number;
  threatDistribution: Record<Aircraft["threatLevel"], number>;
}

interface SimulationState {
  aircraft: Aircraft[];
  alerts: Alert[];
  missiles: Missile[];
  systemStatus: {
    radarUptime: number;
    aircraftCount: number;
    threatLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    systemReadiness: number;
    missileReady: number;
  };
  analytics: {
    detectionsPerMinute: number[];
    altitudeDistribution: { altitude: number; count: number }[];
    systemLoad: number[];
  };
  isRunning: boolean;
  aiMetrics: AiMetrics;
  engagementQueue: PriorityTarget[];
  explosions: Explosion[];

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

// Module-level maps for AI classification tracking
const previousHeadings = new Map<string, number>();
const previousPredictions = new Map<string, PredictedPosition[]>();

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
      missileReady: 30,
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
    aiMetrics: {
      classificationsPerSecond: 0,
      averageConfidence: 0,
      modelAccuracy: 96.4,
      anomaliesDetected: 0,
      threatDistribution: { FRIENDLY: 0, NEUTRAL: 0, SUSPECT: 0, HOSTILE: 0 },
    },
    engagementQueue: [],
    explosions: [],

    startSimulation: () => {
      const state = get();
      if (state.isRunning) return;

      // Clear any stale intervals to prevent stacking
      if (simulationInterval) { clearInterval(simulationInterval); simulationInterval = null; }
      if (alertInterval) { clearInterval(alertInterval); alertInterval = null; }
      if (analyticsInterval) { clearInterval(analyticsInterval); analyticsInterval = null; }
      if (missileInterval) { clearInterval(missileInterval); missileInterval = null; }
      if (missileLaunchInterval) { clearInterval(missileLaunchInterval); missileLaunchInterval = null; }

      // Clear AI tracking maps
      previousHeadings.clear();
      previousPredictions.clear();

      set({ isRunning: true });

      // Generate initial aircraft — start with a packed airspace
      const initialAircraft = Array(15).fill(0).map(() => generateRandomAircraft());
      set({ aircraft: initialAircraft });

      // Update aircraft positions every 2 seconds + AI reclassification
      simulationInterval = setInterval(() => {
        const currentState = get();
        const playbackState = usePlayback.getState();

        // Skip updates if paused or rewinding
        if (playbackState.isPaused || playbackState.isRewinding) {
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
          const speed = aircraft.speed / 3600;
          const deltaTime = 2;

          const newLat = aircraft.position.lat + (speed * deltaTime * Math.cos(aircraft.heading * Math.PI / 180)) / 111;
          const newLng = aircraft.position.lng + (speed * deltaTime * Math.sin(aircraft.heading * Math.PI / 180)) / (111 * Math.cos(aircraft.position.lat * Math.PI / 180));

          const boundedLat = Math.max(35, Math.min(70, newLat));
          const boundedLng = Math.max(-10, Math.min(40, newLng));

          return {
            ...aircraft,
            position: { lat: boundedLat, lng: boundedLng, altitude: aircraft.position.altitude },
            lastUpdate: Date.now(),
          };
        });

        // ─── AI Classification Pass ───────────────────────────────────
        let anomalyCount = 0;
        const reclassifiedAircraft = updatedAircraft.map(aircraft => {
          // Calculate heading delta for flight pattern stability
          const prevHeading = previousHeadings.get(aircraft.id) ?? aircraft.heading;
          let headingDelta = Math.abs(aircraft.heading - prevHeading) % 360;
          if (headingDelta > 180) headingDelta = 360 - headingDelta;
          previousHeadings.set(aircraft.id, aircraft.heading);

          // Detect anomaly from previous predictions
          const anomalyScore = detectAnomaly(aircraft, previousPredictions);
          if (anomalyScore > 40) anomalyCount++;

          // Classify threat
          const assessment = classifyAircraftThreat(aircraft, headingDelta, anomalyScore);

          // Store current predictions for next tick's anomaly detection
          previousPredictions.set(aircraft.id, assessment.predictedPath);

          return {
            ...aircraft,
            threatLevel: assessment.threatLevel,
            aiClassification: assessment,
          };
        });

        // Clean up tracking maps for removed aircraft
        const activeIds = new Set(reclassifiedAircraft.map(ac => ac.id));
        Array.from(previousHeadings.keys()).forEach(id => {
          if (!activeIds.has(id)) previousHeadings.delete(id);
        });
        Array.from(previousPredictions.keys()).forEach(id => {
          if (!activeIds.has(id)) previousPredictions.delete(id);
        });

        // Build engagement priority queue
        const queue = buildPriorityQueue(reclassifiedAircraft);

        // Aggressively spawn new aircraft to keep things busy
        let finalAircraft: Aircraft[] = reclassifiedAircraft;
        if (Math.random() < 0.35 && finalAircraft.length < 20) {
          finalAircraft = [...finalAircraft, generateRandomAircraft()];
        }
        if (Math.random() < 0.15 && finalAircraft.length < 20) {
          finalAircraft = [...finalAircraft, generateRandomAircraft()];
        }
        if (Math.random() < 0.08 && finalAircraft.length > 6) {
          finalAircraft = finalAircraft.slice(1);
        }

        // Update AI metrics
        const totalAircraft = finalAircraft.length;
        const avgConf = totalAircraft > 0
          ? finalAircraft.reduce((s, ac) => s + (ac.aiClassification?.confidenceScore ?? 50), 0) / totalAircraft
          : 0;
        const distribution: Record<Aircraft["threatLevel"], number> = { FRIENDLY: 0, NEUTRAL: 0, SUSPECT: 0, HOSTILE: 0 };
        finalAircraft.forEach(ac => { distribution[ac.threatLevel]++; });

        set({
          aircraft: finalAircraft,
          engagementQueue: queue,
          aiMetrics: {
            classificationsPerSecond: totalAircraft * 7, // 7 factors per aircraft
            averageConfidence: Math.round(avgConf * 10) / 10,
            modelAccuracy: Math.max(93, Math.min(99, 96.4 + (Math.random() - 0.5) * 2)),
            anomaliesDetected: anomalyCount,
            threatDistribution: distribution,
          },
        });
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

      // Generate smart alerts every 3-8 seconds
      alertInterval = setInterval(() => {
        if (Math.random() < 0.85) {
          const currentState = get();
          const alert = generateSmartAlert(currentState.aircraft);
          get().addAlert(alert);
        }
      }, Math.random() * 5000 + 3000);

      // Update analytics every 10 seconds
      analyticsInterval = setInterval(() => {
        get().updateAnalytics();
      }, 10000);

      // Update missiles every 100ms for smooth animation
      missileInterval = setInterval(() => {
        get().updateMissiles();
      }, 100);

      // AI-optimized auto-launch missiles every 3-6 seconds
      missileLaunchInterval = setInterval(() => {
        const currentState = get();
        if (currentState.systemStatus.missileReady <= 0) return;

        const queue = currentState.engagementQueue
          .filter(pt => !currentState.missiles.some(m => m.targetId === pt.aircraft.id && m.active));

        if (queue.length > 0 && Math.random() < 0.8) {
          const topTarget = queue[0];
          get().launchMissile(topTarget.aircraft.id);

          // AI-contextual launch alert
          get().addAlert({
            id: `ALT${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
            timestamp: Date.now(),
            type: 'SYSTEM',
            priority: 'HIGH',
            message: `AI targeting: engaged ${topTarget.aircraft.callsign} (${topTarget.aircraft.model}) — priority: ${topTarget.engagementScore.toFixed(0)}, ETA: ${topTarget.estimatedTimeToImpact < 99999 ? topTarget.estimatedTimeToImpact + 's' : 'N/A'}`,
            position: { lat: topTarget.aircraft.position.lat, lng: topTarget.aircraft.position.lng },
          });
        }
      }, Math.random() * 3000 + 3000);
    },

    stopSimulation: () => {
      set({ isRunning: false });

      if (simulationInterval) { clearInterval(simulationInterval); simulationInterval = null; }
      if (alertInterval) { clearInterval(alertInterval); alertInterval = null; }
      if (analyticsInterval) { clearInterval(analyticsInterval); analyticsInterval = null; }
      if (missileInterval) { clearInterval(missileInterval); missileInterval = null; }
      if (missileLaunchInterval) { clearInterval(missileLaunchInterval); missileLaunchInterval = null; }

      // Clear AI tracking maps
      previousHeadings.clear();
      previousPredictions.clear();
      set({ explosions: [] });
    },

    updateAircraft: (aircraft) => set({ aircraft }),

    addAlert: (alert) => set((state) => ({
      alerts: [alert, ...state.alerts.slice(0, 99)]
    })),

    updateSystemStatus: () => {
      const state = get();
      const aircraftCount = state.aircraft.length;
      const hostileCount = state.aircraft.filter(ac => ac.threatLevel === 'HOSTILE').length;
      const suspectCount = state.aircraft.filter(ac => ac.threatLevel === 'SUSPECT').length;
      const threatLevel = hostileCount > 2 || suspectCount > 4 ? 'HIGH' :
                          hostileCount > 0 || suspectCount > 2 ? 'MEDIUM' : 'LOW';

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
      if (state.systemStatus.missileReady <= 0) return;

      const radarPosition = { lat: 50.0, lng: 10.0, altitude: 0 };
      const sam = pickRandomSAM();

      const missile: Missile = {
        id: `MSL${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        designation: sam.designation,
        startPosition: { ...radarPosition },
        targetPosition: { ...target.position },
        currentPosition: { ...radarPosition },
        targetId,
        launchTime: Date.now(),
        speed: sam.speed,
        active: true
      };

      set((state) => ({
        missiles: [...state.missiles, missile],
        systemStatus: {
          ...state.systemStatus,
          missileReady: state.systemStatus.missileReady - 1,
        }
      }));

      const alert: Alert = {
        id: `ALT${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
        timestamp: Date.now(),
        type: 'SYSTEM',
        message: `${sam.designation} launched at ${target.callsign} (${target.model}) — confidence: ${target.aiClassification?.confidenceScore?.toFixed(1) ?? '?'}%`,
        priority: 'HIGH',
        position: { lat: radarPosition.lat, lng: radarPosition.lng }
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

          missile.targetPosition = { ...target.position };

          const dx = missile.targetPosition.lat - missile.currentPosition.lat;
          const dy = missile.targetPosition.lng - missile.currentPosition.lng;
          const dz = missile.targetPosition.altitude - missile.currentPosition.altitude;
          const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (distance < 0.1) {
            const currentAircraft = get().aircraft;
            set({
              aircraft: currentAircraft.filter(ac => ac.id !== missile.targetId),
            });
            get().addAlert({
              id: `ALT${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
              timestamp: Date.now(),
              type: 'THREAT',
              priority: 'HIGH',
              message: `AI confirmed: ${target.callsign} (${target.model}) neutralized by ${missile.designation} — threat eliminated`,
              position: { lat: target.position.lat, lng: target.position.lng },
            });
            // Create explosion at impact point
            const explosion: Explosion = {
              id: `EXP${Date.now()}_${missile.id}`,
              position: { ...target.position },
              timestamp: Date.now(),
              callsign: target.callsign,
            };
            set((s) => ({
              systemStatus: { ...s.systemStatus, missileReady: Math.min(30, s.systemStatus.missileReady + 1) },
              explosions: [...s.explosions, explosion],
            }));
            // Play hit sound
            try { useAudio.getState().playHit(); } catch (_) { /* audio may not be ready */ }
            return { ...missile, active: false };
          }

          const speed = missile.speed / 3600;
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
        .filter(missile => missile.active || Date.now() - missile.launchTime < 10000);

      set({ missiles: updatedMissiles });

      // Clean up expired explosions (older than 2s)
      const now = Date.now();
      set((s) => ({
        explosions: s.explosions.filter(e => now - e.timestamp < 2000),
      }));
    },
  }))
);
