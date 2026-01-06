import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage, type SimulationAircraft, type SimulationMissile, type SimulationAlert } from "./storage";

// WebSocket clients set
const wsClients = new Set<WebSocket>();

// Broadcast to all connected clients
function broadcast(type: string, data: any) {
  const message = JSON.stringify({ type, data, timestamp: Date.now() });
  wsClients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
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
          message: `Missile ${missile.id} intercepted target`,
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
        message: `Missile launched at ${target.callsign}`,
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

function stopServerSimulation() {
  simulationIntervals.forEach((interval) => clearInterval(interval));
  simulationIntervals = [];
  storage.stopSimulation();
}

// Helper functions
function generateRandomAircraft(): SimulationAircraft {
  const types: SimulationAircraft["type"][] = ["Commercial", "Military", "Private", "Unknown"];
  const prefixes = ["AIR", "SKY", "FLT", "UAV", "MIL", "PVT"];

  const type = types[Math.floor(Math.random() * types.length)];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const number = Math.floor(Math.random() * 899) + 100;

  let threatLevel: SimulationAircraft["threatLevel"];
  const random = Math.random();

  if (type === "Commercial") {
    threatLevel = random < 0.9 ? "FRIENDLY" : "NEUTRAL";
  } else if (type === "Military") {
    threatLevel = random < 0.5 ? "FRIENDLY" : random < 0.8 ? "NEUTRAL" : "SUSPECT";
  } else if (type === "Unknown") {
    threatLevel = random < 0.3 ? "NEUTRAL" : random < 0.7 ? "SUSPECT" : "HOSTILE";
  } else {
    threatLevel = random < 0.8 ? "FRIENDLY" : "NEUTRAL";
  }

  return {
    id: `AC${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
    position: {
      lat: Math.random() * 35 + 35,
      lng: Math.random() * 50 - 10,
      altitude: Math.floor(Math.random() * 12000) + 1000,
    },
    speed: Math.floor(Math.random() * 600) + 200,
    heading: Math.floor(Math.random() * 360),
    type,
    callsign: `${prefix}${number}`,
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

  return {
    id: `MSL${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
    startPosition: radarPosition,
    targetPosition: target.position,
    currentPosition: { ...radarPosition },
    targetId: target.id,
    launchTime: Date.now(),
    speed: 3600, // Mach 3 approximately
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
        console.error("WebSocket message error:", e);
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
    const limit = parseInt(req.query.limit as string) || 100;
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
    const { targetId } = req.body;

    if (!targetId) {
      return res.status(400).json({ error: "targetId is required" });
    }

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
      message: `Manual missile launch at ${target.callsign}`,
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
function handleWebSocketMessage(ws: WebSocket, data: any) {
  switch (data.type) {
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

    case "launch_missile":
      const target = storage.getAircraftById(data.targetId);
      if (target && storage.getSystemStatus().missileReady > 0) {
        const missile = launchMissileAt(target);
        storage.addMissile(missile);
        storage.updateSystemStatus({
          missileReady: storage.getSystemStatus().missileReady - 1,
        });
        broadcast("missile_launch", missile);
      }
      break;

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

    default:
      console.log("Unknown WebSocket message type:", data.type);
  }
}
