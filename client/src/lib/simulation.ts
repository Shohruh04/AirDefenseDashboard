export interface Aircraft {
  id: string;
  position: {
    lat: number;
    lng: number;
    altitude: number; // in meters
  };
  speed: number; // km/h
  heading: number; // degrees
  type: "Commercial" | "Military" | "Private" | "Drone" | "Unknown";
  callsign: string;
  lastUpdate: number;
  threatLevel: "FRIENDLY" | "NEUTRAL" | "SUSPECT" | "HOSTILE";
}

export interface Alert {
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

export interface Missile {
  id: string;
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
  speed: number; // km/h
  active: boolean;
}

const AIRCRAFT_TYPES = [
  "Commercial",
  "Military",
  "Private",
  "Drone",
  "Unknown",
] as const;
const CALLSIGN_PREFIXES = ["AIR", "SKY", "FLT", "UAV", "MIL", "PVT"];

export function generateRandomAircraft(): Aircraft {
  const id = `AC${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  const type =
    AIRCRAFT_TYPES[Math.floor(Math.random() * AIRCRAFT_TYPES.length)];
  const prefix =
    CALLSIGN_PREFIXES[Math.floor(Math.random() * CALLSIGN_PREFIXES.length)];
  const number = Math.floor(Math.random() * 999) + 100;

  // Generate position within European airspace (rough bounds)
  const lat = Math.random() * 35 + 35; // 35-70 degrees North
  const lng = Math.random() * 50 - 10; // -10 to 40 degrees East

  // Determine threat level based on aircraft type and behavior
  let threatLevel: Aircraft["threatLevel"];
  const random = Math.random();

  if (type === "Commercial") {
    threatLevel = random < 0.9 ? "FRIENDLY" : "NEUTRAL";
  } else if (type === "Military") {
    threatLevel =
      random < 0.5 ? "FRIENDLY" : random < 0.8 ? "NEUTRAL" : "SUSPECT";
  } else if (type === "Drone") {
    threatLevel =
      random < 0.3 ? "NEUTRAL" : random < 0.7 ? "SUSPECT" : "HOSTILE";
  } else if (type === "Unknown") {
    threatLevel =
      random < 0.3 ? "NEUTRAL" : random < 0.7 ? "SUSPECT" : "HOSTILE";
  } else {
    threatLevel = random < 0.8 ? "FRIENDLY" : "NEUTRAL";
  }

  const isDrone = type === "Drone";

  return {
    id,
    position: {
      lat,
      lng,
      altitude: isDrone
        ? Math.floor(Math.random() * 3000) + 100
        : Math.floor(Math.random() * 12000) + 1000,
    },
    speed: isDrone
      ? Math.floor(Math.random() * 150) + 50
      : Math.floor(Math.random() * 600) + 200,
    heading: Math.floor(Math.random() * 360), // 0-359 degrees
    type,
    callsign: `${prefix}${number}`,
    lastUpdate: Date.now(),
    threatLevel,
  };
}

export function generateRandomAlert(): Alert {
  const alertTypes: Array<{
    type: Alert["type"];
    priority: Alert["priority"];
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
      type: "THREAT",
      priority: "HIGH",
      messages: [
        "Multiple unidentified contacts detected",
        "High-speed aircraft on intercept course",
        "Emergency: Aircraft not responding to communications",
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

  const alertCategory =
    alertTypes[Math.floor(Math.random() * alertTypes.length)];
  const message =
    alertCategory.messages[
      Math.floor(Math.random() * alertCategory.messages.length)
    ];

  const alert: Alert = {
    id: `ALT${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
    timestamp: Date.now(),
    type: alertCategory.type,
    priority: alertCategory.priority,
    message,
  };

  // Add position for detection and threat alerts
  if (alertCategory.type === "DETECTION" || alertCategory.type === "THREAT") {
    alert.position = {
      lat: Math.random() * 35 + 35,
      lng: Math.random() * 50 - 10,
    };
  }

  return alert;
}

export function toWorldCoords(lat: number, lng: number, altitude: number): [number, number, number] {
  const x = (lng - 10) * 2;
  const z = -(lat - 50) * 2;
  const y = (altitude / 1000) * 0.15 + 0.5;
  return [x, y, z];
}

export function interpolatePosition(
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

export function calculateDistance(
  pos1: { lat: number; lng: number },
  pos2: { lat: number; lng: number }
): number {
  const R = 6371; // Earth's radius in km
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

export function getThreatLevelColor(
  threatLevel: Aircraft["threatLevel"]
): string {
  switch (threatLevel) {
    case "FRIENDLY":
      return "#10b981"; // Green
    case "NEUTRAL":
      return "#3b82f6"; // Blue
    case "SUSPECT":
      return "#f59e0b"; // Orange
    case "HOSTILE":
      return "#ef4444"; // Red
    default:
      return "#6b7280"; // Gray
  }
}

export function getThreatLevelLabel(
  threatLevel: Aircraft["threatLevel"]
): string {
  return threatLevel.charAt(0) + threatLevel.slice(1).toLowerCase();
}
