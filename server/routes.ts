import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { z } from "zod";
import { storage, type SimulationAircraft, type SimulationMissile, type SimulationAlert } from "./storage";

// Zod schemas for WebSocket message validation
const wsMessageSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("start_simulation") }),
  z.object({ type: z.literal("stop_simulation") }),
  z.object({ type: z.literal("launch_missile"), targetId: z.string().min(1) }),
  z.object({ type: z.literal("get_state") }),
]);

// Zod schemas for REST input validation
const launchMissileBodySchema = z.object({
  targetId: z.string().min(1, "targetId is required"),
});

const limitQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(1000).optional().default(100),
});

// WebSocket clients set
const wsClients = new Set<WebSocket>();

// Broadcast to all connected clients
function broadcast(type: string, data: any) {
  const message = JSON.stringify({ type, data, timestamp: Date.now() });
  wsClients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(message);
      } catch (err) {
        console.error("WebSocket send error, removing client:", err);
        wsClients.delete(client);
      }
    }
  });
}

// Simulation intervals
let simulationIntervals: NodeJS.Timeout[] = [];

function startServerSimulation() {
  if (simulationIntervals.length > 0) return;

  // Update aircraft positions every 2 seconds
  const aircraftInterval = setInterval(() => {
    const aircraft = storage.getAircraft();
    aircraft.forEach((ac) => {
      // Update position based on heading and speed
      const speedKmPerSecond = ac.speed / 3600;
      const distance = speedKmPerSecond * 2; // 2 second interval
      const headingRad = (ac.heading * Math.PI) / 180;

      const newLat = ac.position.lat + (distance / 111) * Math.cos(headingRad);
      const newLng = ac.position.lng + (distance / (111 * Math.cos(ac.position.lat * Math.PI / 180))) * Math.sin(headingRad);

      // Keep within bounds or generate new aircraft
      if (newLat < 35 || newLat > 70 || newLng < -10 || newLng > 40) {
        storage.removeAircraft(ac.id);
        // Generate new aircraft
        const newAc = generateRandomAircraft();
        storage.addAircraft(newAc);
      } else {
        storage.updateAircraft(ac.id, {
          position: {
            ...ac.position,
            lat: newLat,
            lng: newLng,
          },
          // Slight heading variation
          heading: (ac.heading + (Math.random() * 6 - 3) + 360) % 360,
        });
      }
    });

    // Broadcast updated aircraft
    broadcast("aircraft_update", storage.getAircraft());
  }, 2000);

  // Generate alerts every 5-15 seconds
  const alertInterval = setInterval(() => {
    const alert = generateRandomAlert();
    storage.addAlert(alert);
    broadcast("new_alert", alert);
  }, Math.random() * 10000 + 5000);

  // Update missile positions every 100ms
  const missileInterval = setInterval(() => {
    const missiles = storage.getActiveMissiles();
    missiles.forEach((missile) => {
      const elapsed = Date.now() - missile.launchTime;
      const totalDistance = calculateDistance(missile.startPosition, missile.targetPosition);
      const missileSpeedKmPerMs = missile.speed / 3600000;
      const distanceTraveled = elapsed * missileSpeedKmPerMs;
      const progress = Math.min(distanceTraveled / totalDistance, 1);

      if (progress >= 1) {
        // Missile reached target
        storage.updateMissile(missile.id, { active: false });

        // Remove targeted aircraft
        storage.removeAircraft(missile.targetId);

        // Create alert
        const alert: SimulationAlert = {
          id: `ALT${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
          timestamp: Date.now(),
          type: "THREAT",
          priority: "HIGH",
          message: `${missile.designation} intercepted target — confirmed kill`,
          position: missile.targetPosition,
        };
        storage.addAlert(alert);
        broadcast("new_alert", alert);
        broadcast("missile_impact", { missileId: missile.id, targetId: missile.targetId });
      } else {
        // Update missile position
        const currentPosition = interpolatePosition(
          missile.startPosition,
          missile.targetPosition,
          progress
        );
        storage.updateMissile(missile.id, { currentPosition });
      }
    });

    if (missiles.length > 0) {
      broadcast("missiles_update", storage.getMissiles());
    }

    // Periodically clean up old inactive missiles
    storage.cleanupInactiveMissiles(30000);
  }, 100);

  // Auto-launch missiles at hostile/suspect aircraft every 8-15 seconds
  const launchInterval = setInterval(() => {
    const aircraft = storage.getAircraft();
    const threats = aircraft.filter(
      (ac) => ac.threatLevel === "HOSTILE" || ac.threatLevel === "SUSPECT"
    );

    // Check if there are missiles already targeting threats
    const activeMissiles = storage.getActiveMissiles();
    const targetedIds = new Set(activeMissiles.map((m) => m.targetId));

    const untargetedThreats = threats.filter((t) => !targetedIds.has(t.id));

    if (untargetedThreats.length > 0 && storage.getSystemStatus().missileReady > 0) {
      const target = untargetedThreats[0];
      const missile = launchMissileAt(target);
      storage.addMissile(missile);
      storage.updateSystemStatus({
        missileReady: storage.getSystemStatus().missileReady - 1,
      });

      const alert: SimulationAlert = {
        id: `ALT${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
        timestamp: Date.now(),
        type: "THREAT",
        priority: "HIGH",
        message: `${missile.designation} launched at ${target.callsign} (${target.model})`,
        position: target.position,
      };
      storage.addAlert(alert);

      broadcast("missile_launch", missile);
      broadcast("new_alert", alert);
    }
  }, Math.random() * 7000 + 8000);

  // Update system status every 10 seconds
  const statusInterval = setInterval(() => {
    const status = storage.getSystemStatus();
    storage.updateSystemStatus({
      systemLoad: Math.min(100, Math.max(20, status.systemLoad + (Math.random() * 10 - 5))),
    });
    broadcast("system_status", storage.getSystemStatus());
  }, 10000);

  simulationIntervals = [aircraftInterval, alertInterval, missileInterval, launchInterval, statusInterval];
  storage.startSimulation();
}

export function stopServerSimulation() {
  simulationIntervals.forEach((interval) => clearInterval(interval));
  simulationIntervals = [];
  storage.stopSimulation();
}

// Real-world model pools for server-side generation
const SERVER_MODELS: Record<SimulationAircraft["type"], { model: string; prefix: string }[]> = {
  Commercial: [
    { model: "Boeing 737-800", prefix: "DLH" },
    { model: "Boeing 777-300ER", prefix: "BAW" },
    { model: "Airbus A320neo", prefix: "AFR" },
    { model: "Airbus A330-300", prefix: "KLM" },
    { model: "Boeing 747-8", prefix: "SWR" },
    { model: "Airbus A380-800", prefix: "UAE" },
    { model: "Boeing 787-9 Dreamliner", prefix: "SAS" },
  ],
  Military: [
    { model: "F-16C Fighting Falcon", prefix: "VIPER" },
    { model: "F-35A Lightning II", prefix: "LIGHT" },
    { model: "Su-35S Flanker-E", prefix: "FLANKER" },
    { model: "Eurofighter Typhoon", prefix: "TYPHOON" },
    { model: "F-22 Raptor", prefix: "RAPTOR" },
    { model: "F-15E Strike Eagle", prefix: "EAGLE" },
    { model: "Rafale C", prefix: "RAFALE" },
    { model: "Su-57 Felon", prefix: "FELON" },
  ],
  Private: [
    { model: "Cessna Citation X", prefix: "N" },
    { model: "Gulfstream G650", prefix: "N" },
    { model: "Bombardier Global 7500", prefix: "C-G" },
    { model: "Beechcraft King Air 350", prefix: "D-I" },
    { model: "Learjet 75 Liberty", prefix: "N" },
  ],
  Drone: [
    { model: "MQ-9 Reaper", prefix: "REAPER" },
    { model: "RQ-4 Global Hawk", prefix: "HAWK" },
    { model: "TB2 Bayraktar", prefix: "BAYRAKTAR" },
    { model: "Shahed-136", prefix: "SHAHED" },
    { model: "MQ-1C Gray Eagle", prefix: "GEAGLE" },
    { model: "Orlan-10", prefix: "ORLAN" },
    { model: "IAI Heron TP", prefix: "HERON" },
  ],
  Unknown: [
    { model: "Unidentified Fixed-Wing", prefix: "UNK" },
    { model: "Unidentified Rotorcraft", prefix: "UNK" },
    { model: "Unidentified Low-RCS", prefix: "UNK" },
  ],
};

const SERVER_SAM_SYSTEMS = [
  { designation: "MIM-104 Patriot PAC-3", speed: 5000 },
  { designation: "S-400 Triumf (40N6E)", speed: 4800 },
  { designation: "IRIS-T SLM", speed: 3600 },
  { designation: "NASAMS AIM-120", speed: 4000 },
  { designation: "Aster 30 SAMP/T", speed: 4200 },
  { designation: "Buk-M3 (9M317MA)", speed: 3400 },
];

// Helper functions
function generateRandomAircraft(): SimulationAircraft {
  const types: SimulationAircraft["type"][] = ["Commercial", "Military", "Private", "Drone", "Unknown"];
  const type = types[Math.floor(Math.random() * types.length)];
  const pool = SERVER_MODELS[type];
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

  return {
    id: `AC${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
    position: {
      lat: Math.random() * 35 + 35,
      lng: Math.random() * 50 - 10,
      altitude: isDrone ? Math.floor(Math.random() * 3000) + 100 : Math.floor(Math.random() * 12000) + 1000,
    },
    speed: isDrone ? Math.floor(Math.random() * 150) + 50 : Math.floor(Math.random() * 600) + 200,
    heading: Math.floor(Math.random() * 360),
    type,
    model: modelDef.model,
    callsign,
    lastUpdate: Date.now(),
    threatLevel,
  };
}

function generateRandomAlert(): SimulationAlert {
  const alertTypes: Array<{
    type: SimulationAlert["type"];
    priority: SimulationAlert["priority"];
    messages: string[];
  }> = [
    {
      type: "DETECTION",
      priority: "LOW",
      messages: [
        "New aircraft detected in sector Alpha-7",
        "Contact established with commercial flight",
        "Civilian aircraft entering monitored airspace",
      ],
    },
    {
      type: "THREAT",
      priority: "MEDIUM",
      messages: [
        "Unidentified aircraft detected - altitude 8500m",
        "Aircraft deviating from assigned flight path",
        "Unknown contact - IFF not responding",
        "Unauthorized drone detected in restricted airspace",
        "UAV swarm activity detected - sector Charlie-5",
      ],
    },
    {
      type: "SYSTEM",
      priority: "LOW",
      messages: [
        "Radar system performing scheduled calibration",
        "Communication link restored to sector control",
        "System diagnostics completed successfully",
      ],
    },
    {
      type: "INFO",
      priority: "LOW",
      messages: [
        "Weather update: Clear skies, visibility 15km",
        "Airspace restriction lifted for sector Bravo-3",
        "Training exercise scheduled for 14:00-16:00",
      ],
    },
  ];

  const alertCategory = alertTypes[Math.floor(Math.random() * alertTypes.length)];
  const message = alertCategory.messages[Math.floor(Math.random() * alertCategory.messages.length)];

  const alert: SimulationAlert = {
    id: `ALT${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
    timestamp: Date.now(),
    type: alertCategory.type,
    priority: alertCategory.priority,
    message,
  };

  if (alertCategory.type === "DETECTION" || alertCategory.type === "THREAT") {
    alert.position = {
      lat: Math.random() * 35 + 35,
      lng: Math.random() * 50 - 10,
    };
  }

  return alert;
}

function launchMissileAt(target: SimulationAircraft): SimulationMissile {
  const radarPosition = { lat: 50.0, lng: 10.0, altitude: 0 };
  const sam = SERVER_SAM_SYSTEMS[Math.floor(Math.random() * SERVER_SAM_SYSTEMS.length)];

  return {
    id: `MSL${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
    designation: sam.designation,
    startPosition: radarPosition,
    targetPosition: target.position,
    currentPosition: { ...radarPosition },
    targetId: target.id,
    launchTime: Date.now(),
    speed: sam.speed,
    active: true,
  };
}

function calculateDistance(
  pos1: { lat: number; lng: number },
  pos2: { lat: number; lng: number }
): number {
  const R = 6371;
  const dLat = ((pos2.lat - pos1.lat) * Math.PI) / 180;
  const dLng = ((pos2.lng - pos1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((pos1.lat * Math.PI) / 180) *
      Math.cos((pos2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function interpolatePosition(
  start: { lat: number; lng: number; altitude: number },
  end: { lat: number; lng: number; altitude: number },
  t: number
) {
  return {
    lat: start.lat + (end.lat - start.lat) * t,
    lng: start.lng + (end.lng - start.lng) * t,
    altitude: start.altitude + (end.altitude - start.altitude) * t,
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Setup WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  wss.on("connection", (ws) => {
    wsClients.add(ws);
    console.log("WebSocket client connected. Total clients:", wsClients.size);

    // Send initial state
    ws.send(
      JSON.stringify({
        type: "initial_state",
        data: {
          aircraft: storage.getAircraft(),
          alerts: storage.getAlerts(),
          missiles: storage.getMissiles(),
          systemStatus: storage.getSystemStatus(),
          simulationRunning: storage.isSimulationRunning(),
        },
        timestamp: Date.now(),
      })
    );

    ws.on("message", (message) => {
      try {
        const data = JSON.parse(message.toString());
        handleWebSocketMessage(ws, data);
      } catch (e) {
        console.error("WebSocket message parse error:", e);
        try {
          ws.send(JSON.stringify({ type: "error", data: { message: "Invalid JSON message" }, timestamp: Date.now() }));
        } catch {
          // Client already disconnected
          wsClients.delete(ws);
        }
      }
    });

    ws.on("close", () => {
      wsClients.delete(ws);
      console.log("WebSocket client disconnected. Total clients:", wsClients.size);
    });
  });

  // REST API Routes

  // Get all aircraft
  app.get("/api/aircraft", (req, res) => {
    res.json(storage.getAircraft());
  });

  // Get single aircraft
  app.get("/api/aircraft/:id", (req, res) => {
    const aircraft = storage.getAircraftById(req.params.id);
    if (aircraft) {
      res.json(aircraft);
    } else {
      res.status(404).json({ error: "Aircraft not found" });
    }
  });

  // Get all alerts
  app.get("/api/alerts", (req, res) => {
    const parsed = limitQuerySchema.safeParse(req.query);
    const limit = parsed.success ? parsed.data.limit! : 100;
    const alerts = storage.getAlerts().slice(0, limit);
    res.json(alerts);
  });

  // Clear alerts
  app.delete("/api/alerts", (req, res) => {
    storage.clearAlerts();
    broadcast("alerts_cleared", {});
    res.json({ success: true });
  });

  // Get all missiles
  app.get("/api/missiles", (req, res) => {
    res.json(storage.getMissiles());
  });

  // Get active missiles only
  app.get("/api/missiles/active", (req, res) => {
    res.json(storage.getActiveMissiles());
  });

  // Launch missile at target
  app.post("/api/missiles/launch", (req, res) => {
    const parsed = launchMissileBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten().fieldErrors });
    }

    const { targetId } = parsed.data;

    const target = storage.getAircraftById(targetId);
    if (!target) {
      return res.status(404).json({ error: "Target aircraft not found" });
    }

    const status = storage.getSystemStatus();
    if (status.missileReady <= 0) {
      return res.status(400).json({ error: "No missiles available" });
    }

    const missile = launchMissileAt(target);
    storage.addMissile(missile);
    storage.updateSystemStatus({ missileReady: status.missileReady - 1 });

    const alert: SimulationAlert = {
      id: `ALT${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
      timestamp: Date.now(),
      type: "THREAT",
      priority: "HIGH",
      message: `${missile.designation} launched at ${target.callsign} (${target.model})`,
      position: target.position,
    };
    storage.addAlert(alert);

    broadcast("missile_launch", missile);
    broadcast("new_alert", alert);

    res.json({ success: true, missile });
  });

  // Get system status
  app.get("/api/system/status", (req, res) => {
    res.json(storage.getSystemStatus());
  });

  // Simulation control
  app.get("/api/simulation/status", (req, res) => {
    res.json({ running: storage.isSimulationRunning() });
  });

  app.post("/api/simulation/start", (req, res) => {
    if (!storage.isSimulationRunning()) {
      startServerSimulation();
      broadcast("simulation_started", {});
    }
    res.json({ success: true, running: true });
  });

  app.post("/api/simulation/stop", (req, res) => {
    if (storage.isSimulationRunning()) {
      stopServerSimulation();
      broadcast("simulation_stopped", {});
    }
    res.json({ success: true, running: false });
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({
      status: "healthy",
      timestamp: Date.now(),
      simulationRunning: storage.isSimulationRunning(),
      connectedClients: wsClients.size,
    });
  });

  return httpServer;
}

// Handle WebSocket commands from clients
function handleWebSocketMessage(ws: WebSocket, data: unknown) {
  const result = wsMessageSchema.safeParse(data);
  if (!result.success) {
    ws.send(JSON.stringify({
      type: "error",
      data: { message: "Invalid message format", errors: result.error.flatten().fieldErrors },
      timestamp: Date.now(),
    }));
    return;
  }

  const msg = result.data;

  switch (msg.type) {
    case "start_simulation":
      if (!storage.isSimulationRunning()) {
        startServerSimulation();
        broadcast("simulation_started", {});
      }
      break;

    case "stop_simulation":
      if (storage.isSimulationRunning()) {
        stopServerSimulation();
        broadcast("simulation_stopped", {});
      }
      break;

    case "launch_missile": {
      const target = storage.getAircraftById(msg.targetId);
      if (target && storage.getSystemStatus().missileReady > 0) {
        const missile = launchMissileAt(target);
        storage.addMissile(missile);
        storage.updateSystemStatus({
          missileReady: storage.getSystemStatus().missileReady - 1,
        });
        broadcast("missile_launch", missile);
      }
      break;
    }

    case "get_state":
      ws.send(
        JSON.stringify({
          type: "state_update",
          data: {
            aircraft: storage.getAircraft(),
            alerts: storage.getAlerts(),
            missiles: storage.getMissiles(),
            systemStatus: storage.getSystemStatus(),
          },
          timestamp: Date.now(),
        })
      );
      break;
  }
}
