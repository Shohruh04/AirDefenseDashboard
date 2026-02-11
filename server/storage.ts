import { users, type User, type InsertUser } from "@shared/schema";
import { getCountryConfig, getModelPools, DEFAULT_COUNTRY } from "@shared/countryConfigs";

// Simulation data types (matching client-side types)
export interface SimulationAircraft {
  id: string;
  position: {
    lat: number;
    lng: number;
    altitude: number;
  };
  speed: number;
  heading: number;
  type: "Commercial" | "Military" | "Private" | "Drone" | "Unknown";
  model: string;
  callsign: string;
  lastUpdate: number;
  threatLevel: "FRIENDLY" | "NEUTRAL" | "SUSPECT" | "HOSTILE";
}

export interface SimulationAlert {
  id: string;
  timestamp: number;
  type: "DETECTION" | "THREAT" | "SYSTEM" | "INFO";
  message: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  position?: {
    lat: number;
    lng: number;
  };
}

export interface SimulationMissile {
  id: string;
  designation: string;
  startPosition: {
    lat: number;
    lng: number;
    altitude: number;
  };
  targetPosition: {
    lat: number;
    lng: number;
    altitude: number;
  };
  currentPosition: {
    lat: number;
    lng: number;
    altitude: number;
  };
  targetId: string;
  launchTime: number;
  speed: number;
  active: boolean;
}

export interface SystemStatus {
  radarStatus: "ONLINE" | "OFFLINE" | "DEGRADED";
  radarUptime: number;
  activeThreats: number;
  aircraftTracked: number;
  systemLoad: number;
  missileReady: number;
  lastUpdate: number;
}

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Aircraft methods
  getAircraft(): SimulationAircraft[];
  getAircraftById(id: string): SimulationAircraft | undefined;
  addAircraft(aircraft: SimulationAircraft): void;
  updateAircraft(id: string, updates: Partial<SimulationAircraft>): void;
  removeAircraft(id: string): void;

  // Alert methods
  getAlerts(): SimulationAlert[];
  addAlert(alert: SimulationAlert): void;
  clearAlerts(): void;

  // Missile methods
  getMissiles(): SimulationMissile[];
  getActiveMissiles(): SimulationMissile[];
  addMissile(missile: SimulationMissile): void;
  updateMissile(id: string, updates: Partial<SimulationMissile>): void;
  removeMissile(id: string): void;
  cleanupInactiveMissiles(maxAgeMs?: number): void;

  // System status methods
  getSystemStatus(): SystemStatus;
  updateSystemStatus(updates: Partial<SystemStatus>): void;

  // Simulation control
  isSimulationRunning(): boolean;
  startSimulation(): void;
  stopSimulation(): void;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private aircraft: Map<string, SimulationAircraft>;
  private alerts: SimulationAlert[];
  private missiles: Map<string, SimulationMissile>;
  private systemStatus: SystemStatus;
  private simulationRunning: boolean;
  private currentUserId: number;

  constructor() {
    this.users = new Map();
    this.aircraft = new Map();
    this.alerts = [];
    this.missiles = new Map();
    this.currentUserId = 1;
    this.simulationRunning = false;

    this.systemStatus = {
      radarStatus: "ONLINE",
      radarUptime: 99.7,
      activeThreats: 0,
      aircraftTracked: 0,
      systemLoad: 45,
      missileReady: 12,
      lastUpdate: Date.now(),
    };

    // Initialize with some aircraft
    this.initializeDefaultAircraft();
  }

  private initializeDefaultAircraft(): void {
    const defaultAircraft = this.generateInitialAircraft(8);
    defaultAircraft.forEach(ac => this.aircraft.set(ac.id, ac));
    this.systemStatus.aircraftTracked = this.aircraft.size;
  }

  private static getModelPools(): Record<SimulationAircraft["type"], { model: string; prefix: string }[]> {
    const config = getCountryConfig(DEFAULT_COUNTRY);
    const pools = getModelPools(config);
    const result: Record<string, { model: string; prefix: string }[]> = {};
    for (const [type, models] of Object.entries(pools)) {
      result[type] = models.map(m => ({ model: m.model, prefix: m.callsignPrefix }));
    }
    return result as Record<SimulationAircraft["type"], { model: string; prefix: string }[]>;
  }

  private generateInitialAircraft(count: number): SimulationAircraft[] {
    const types: SimulationAircraft["type"][] = ["Commercial", "Military", "Private", "Drone", "Unknown"];
    const aircraft: SimulationAircraft[] = [];

    for (let i = 0; i < count; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      const pools = MemStorage.getModelPools();
      const pool = pools[type];
      const modelDef = pool[Math.floor(Math.random() * pool.length)];

      let callsign: string;
      if (type === "Commercial") {
        callsign = `${modelDef.prefix}${Math.floor(Math.random() * 9000) + 100}`;
      } else if (type === "Military") {
        callsign = `${modelDef.prefix}-${String(Math.floor(Math.random() * 30) + 1).padStart(2, "0")}`;
      } else if (type === "Private") {
        const suffix = Math.random().toString(36).substr(2, 3).toUpperCase();
        callsign = modelDef.prefix === "N"
          ? `N${Math.floor(Math.random() * 900) + 100}${suffix.substring(0, 2)}`
          : `${modelDef.prefix}${suffix}`;
      } else if (type === "Drone") {
        callsign = `${modelDef.prefix}-${String(Math.floor(Math.random() * 20) + 1).padStart(2, "0")}`;
      } else {
        callsign = `UNK${Math.floor(Math.random() * 999) + 100}`;
      }

      let threatLevel: SimulationAircraft["threatLevel"];
      const random = Math.random();

      if (type === "Commercial") {
        threatLevel = random < 0.9 ? "FRIENDLY" : "NEUTRAL";
      } else if (type === "Military") {
        threatLevel = random < 0.5 ? "FRIENDLY" : random < 0.8 ? "NEUTRAL" : "SUSPECT";
      } else if (type === "Drone") {
        threatLevel = random < 0.3 ? "NEUTRAL" : random < 0.7 ? "SUSPECT" : "HOSTILE";
      } else if (type === "Unknown") {
        threatLevel = random < 0.3 ? "NEUTRAL" : random < 0.7 ? "SUSPECT" : "HOSTILE";
      } else {
        threatLevel = random < 0.8 ? "FRIENDLY" : "NEUTRAL";
      }

      const isDrone = type === "Drone";
      const altitude = isDrone
        ? Math.floor(Math.random() * 3000) + 100
        : Math.floor(Math.random() * 12000) + 1000;
      const speed = isDrone
        ? Math.floor(Math.random() * 150) + 50
        : Math.floor(Math.random() * 600) + 200;

      const storageConfig = getCountryConfig(DEFAULT_COUNTRY);
      const { spawnBounds } = storageConfig;

      aircraft.push({
        id: `AC${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        position: {
          lat: spawnBounds.latMin + Math.random() * (spawnBounds.latMax - spawnBounds.latMin),
          lng: spawnBounds.lngMin + Math.random() * (spawnBounds.lngMax - spawnBounds.lngMin),
          altitude,
        },
        speed,
        heading: Math.floor(Math.random() * 360),
        type,
        model: modelDef.model,
        callsign,
        lastUpdate: Date.now(),
        threatLevel,
      });
    }

    return aircraft;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Aircraft methods
  getAircraft(): SimulationAircraft[] {
    return Array.from(this.aircraft.values());
  }

  getAircraftById(id: string): SimulationAircraft | undefined {
    return this.aircraft.get(id);
  }

  addAircraft(aircraft: SimulationAircraft): void {
    this.aircraft.set(aircraft.id, aircraft);
    this.systemStatus.aircraftTracked = this.aircraft.size;
  }

  updateAircraft(id: string, updates: Partial<SimulationAircraft>): void {
    const existing = this.aircraft.get(id);
    if (existing) {
      this.aircraft.set(id, { ...existing, ...updates, lastUpdate: Date.now() });
    }
  }

  removeAircraft(id: string): void {
    this.aircraft.delete(id);
    this.systemStatus.aircraftTracked = this.aircraft.size;
  }

  // Alert methods
  getAlerts(): SimulationAlert[] {
    return [...this.alerts].sort((a, b) => b.timestamp - a.timestamp);
  }

  addAlert(alert: SimulationAlert): void {
    this.alerts.push(alert);
    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }
  }

  clearAlerts(): void {
    this.alerts = [];
  }

  // Missile methods
  getMissiles(): SimulationMissile[] {
    return Array.from(this.missiles.values());
  }

  getActiveMissiles(): SimulationMissile[] {
    return Array.from(this.missiles.values()).filter(m => m.active);
  }

  addMissile(missile: SimulationMissile): void {
    this.missiles.set(missile.id, missile);
  }

  updateMissile(id: string, updates: Partial<SimulationMissile>): void {
    const existing = this.missiles.get(id);
    if (existing) {
      this.missiles.set(id, { ...existing, ...updates });
    }
  }

  removeMissile(id: string): void {
    this.missiles.delete(id);
  }

  cleanupInactiveMissiles(maxAgeMs: number = 30000): void {
    const now = Date.now();
    this.missiles.forEach((missile, id) => {
      if (!missile.active && now - missile.launchTime > maxAgeMs) {
        this.missiles.delete(id);
      }
    });
  }

  // System status methods
  getSystemStatus(): SystemStatus {
    const threats = this.getAircraft().filter(
      ac => ac.threatLevel === "HOSTILE" || ac.threatLevel === "SUSPECT"
    ).length;

    return {
      ...this.systemStatus,
      activeThreats: threats,
      aircraftTracked: this.aircraft.size,
      lastUpdate: Date.now(),
    };
  }

  updateSystemStatus(updates: Partial<SystemStatus>): void {
    this.systemStatus = { ...this.systemStatus, ...updates, lastUpdate: Date.now() };
  }

  // Simulation control
  isSimulationRunning(): boolean {
    return this.simulationRunning;
  }

  startSimulation(): void {
    this.simulationRunning = true;
  }

  stopSimulation(): void {
    this.simulationRunning = false;
  }
}

export const storage = new MemStorage();
