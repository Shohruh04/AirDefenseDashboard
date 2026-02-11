// ─── AI Classification Types ───────────────────────────────────────────────

export interface RiskFactor {
  name: string;
  weight: number;       // 0-1
  score: number;        // 0-100 raw
  weighted: number;     // weight * score
  description: string;  // Human-readable, e.g. "No IFF transponder response (+20%)"
}

export interface PredictedPosition {
  lat: number;
  lng: number;
  altitude: number;
  timestamp: number;    // future time
  uncertainty: number;  // 0-1, grows with distance
}

export interface ThreatAssessment {
  threatLevel: Aircraft["threatLevel"];
  confidenceScore: number;          // 0-100
  riskFactors: RiskFactor[];
  totalScore: number;               // 0-100
  previousScores: number[];         // last 5 for sparkline
  iffResponding: boolean;
  anomalyScore: number;             // 0-100
  predictedPath: PredictedPosition[];
  lastClassificationTime: number;
}

export interface PriorityTarget {
  aircraft: Aircraft;
  engagementScore: number;
  distanceToBase: number;
  closingSpeed: number;
  estimatedTimeToImpact: number;  // seconds
  recommendation: "ENGAGE" | "TRACK" | "MONITOR" | "CLEAR";
}

// ─── Core Types ────────────────────────────────────────────────────────────

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
  model: string; // Real-world aircraft model (e.g. "F-16C Fighting Falcon")
  callsign: string;
  lastUpdate: number;
  threatLevel: "FRIENDLY" | "NEUTRAL" | "SUSPECT" | "HOSTILE";
  aiClassification?: ThreatAssessment;
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
  designation: string; // Real SAM system name (e.g. "MIM-104 Patriot PAC-3")
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

export interface Explosion {
  id: string;
  position: { lat: number; lng: number; altitude: number };
  timestamp: number;
  callsign: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────

export const RADAR_BASE = { lat: 50.0, lng: 10.0 };

const AIRCRAFT_TYPE_WEIGHTS: { type: Aircraft["type"]; weight: number }[] = [
  { type: "Drone", weight: 35 },
  { type: "Military", weight: 30 },
  { type: "Unknown", weight: 15 },
  { type: "Commercial", weight: 12 },
  { type: "Private", weight: 8 },
];

const IFF_RESPONSE_PROBABILITY: Record<Aircraft["type"], number> = {
  Commercial: 0.95,
  Military: 0.70,
  Private: 0.90,
  Unknown: 0.20,
  Drone: 0.30,
};

const TYPE_BASELINE_SCORE: Record<Aircraft["type"], number> = {
  Commercial: 10,
  Private: 25,
  Military: 50,
  Unknown: 65,
  Drone: 70,
};

const NORMAL_SPEED_RANGE: Record<Aircraft["type"], { min: number; max: number }> = {
  Commercial: { min: 400, max: 900 },
  Military: { min: 300, max: 900 },
  Private: { min: 150, max: 400 },
  Drone: { min: 30, max: 200 },
  Unknown: { min: 200, max: 700 },
};

// ─── Real-World Aircraft Models ───────────────────────────────────────────

interface AircraftModelDef {
  model: string;
  callsignPrefix: string;
}

const COMMERCIAL_MODELS: AircraftModelDef[] = [
  { model: "Boeing 737-800", callsignPrefix: "DLH" },
  { model: "Boeing 777-300ER", callsignPrefix: "BAW" },
  { model: "Airbus A320neo", callsignPrefix: "AFR" },
  { model: "Airbus A330-300", callsignPrefix: "KLM" },
  { model: "Boeing 747-8", callsignPrefix: "SWR" },
  { model: "Airbus A380-800", callsignPrefix: "UAE" },
  { model: "Boeing 787-9 Dreamliner", callsignPrefix: "SAS" },
  { model: "Airbus A350-900", callsignPrefix: "THY" },
  { model: "Embraer E195-E2", callsignPrefix: "AUA" },
  { model: "Boeing 767-300ER", callsignPrefix: "DAL" },
];

const MILITARY_MODELS: AircraftModelDef[] = [
  { model: "F-16C Fighting Falcon", callsignPrefix: "VIPER" },
  { model: "F-35A Lightning II", callsignPrefix: "LIGHT" },
  { model: "Su-35S Flanker-E", callsignPrefix: "FLANKER" },
  { model: "MiG-29 Fulcrum", callsignPrefix: "FULCRUM" },
  { model: "Eurofighter Typhoon", callsignPrefix: "TYPHOON" },
  { model: "F-22 Raptor", callsignPrefix: "RAPTOR" },
  { model: "Rafale C", callsignPrefix: "RAFALE" },
  { model: "Su-57 Felon", callsignPrefix: "FELON" },
  { model: "F-15E Strike Eagle", callsignPrefix: "EAGLE" },
  { model: "Tornado GR4", callsignPrefix: "TORNADO" },
  { model: "Su-34 Fullback", callsignPrefix: "FULLBACK" },
  { model: "JAS 39 Gripen", callsignPrefix: "GRIPEN" },
];

const PRIVATE_MODELS: AircraftModelDef[] = [
  { model: "Cessna Citation X", callsignPrefix: "N" },
  { model: "Gulfstream G650", callsignPrefix: "N" },
  { model: "Bombardier Global 7500", callsignPrefix: "C-G" },
  { model: "Beechcraft King Air 350", callsignPrefix: "D-I" },
  { model: "Learjet 75 Liberty", callsignPrefix: "N" },
  { model: "Dassault Falcon 8X", callsignPrefix: "F-H" },
  { model: "Pilatus PC-12", callsignPrefix: "HB-" },
  { model: "Cessna 172 Skyhawk", callsignPrefix: "N" },
];

const DRONE_MODELS: AircraftModelDef[] = [
  { model: "MQ-9 Reaper", callsignPrefix: "REAPER" },
  { model: "RQ-4 Global Hawk", callsignPrefix: "HAWK" },
  { model: "TB2 Bayraktar", callsignPrefix: "BAYRAKTAR" },
  { model: "MQ-1C Gray Eagle", callsignPrefix: "GEAGLE" },
  { model: "Shahed-136", callsignPrefix: "SHAHED" },
  { model: "Orlan-10", callsignPrefix: "ORLAN" },
  { model: "IAI Heron TP", callsignPrefix: "HERON" },
  { model: "HESA Mohajer-6", callsignPrefix: "MOHAJER" },
  { model: "Wing Loong II", callsignPrefix: "WLOONG" },
  { model: "RQ-170 Sentinel", callsignPrefix: "SENTINEL" },
];

const UNKNOWN_MODELS: AircraftModelDef[] = [
  { model: "Unidentified Fixed-Wing", callsignPrefix: "UNK" },
  { model: "Unidentified Rotorcraft", callsignPrefix: "UNK" },
  { model: "Unidentified Low-RCS", callsignPrefix: "UNK" },
  { model: "Unidentified High-Speed", callsignPrefix: "UNK" },
];

const MODEL_POOLS: Record<Aircraft["type"], AircraftModelDef[]> = {
  Commercial: COMMERCIAL_MODELS,
  Military: MILITARY_MODELS,
  Private: PRIVATE_MODELS,
  Drone: DRONE_MODELS,
  Unknown: UNKNOWN_MODELS,
};

// Real-world surface-to-air missile systems
export const SAM_SYSTEMS = [
  { designation: "MIM-104 Patriot PAC-3", speed: 5000 },
  { designation: "S-400 Triumf (40N6E)", speed: 4800 },
  { designation: "IRIS-T SLM", speed: 3600 },
  { designation: "NASAMS AIM-120", speed: 4000 },
  { designation: "Aster 30 SAMP/T", speed: 4200 },
  { designation: "Buk-M3 (9M317MA)", speed: 3400 },
  { designation: "SAMP/T Mamba", speed: 4100 },
  { designation: "David's Sling (Stunner)", speed: 4600 },
];

// ─── Helpers ───────────────────────────────────────────────────────────────

function pickWeightedType(): Aircraft["type"] {
  const total = AIRCRAFT_TYPE_WEIGHTS.reduce((s, w) => s + w.weight, 0);
  let r = Math.random() * total;
  for (const entry of AIRCRAFT_TYPE_WEIGHTS) {
    r -= entry.weight;
    if (r <= 0) return entry.type;
  }
  return "Drone";
}

function bearingBetween(from: { lat: number; lng: number }, to: { lat: number; lng: number }): number {
  const dLng = ((to.lng - from.lng) * Math.PI) / 180;
  const lat1 = (from.lat * Math.PI) / 180;
  const lat2 = (to.lat * Math.PI) / 180;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

function angleDifference(a: number, b: number): number {
  let diff = Math.abs(a - b) % 360;
  if (diff > 180) diff = 360 - diff;
  return diff;
}

// ─── Aircraft Generation ───────────────────────────────────────────────────

function pickRandomModel(type: Aircraft["type"]): AircraftModelDef {
  const pool = MODEL_POOLS[type];
  return pool[Math.floor(Math.random() * pool.length)];
}

function generateCallsign(type: Aircraft["type"], modelDef: AircraftModelDef): string {
  switch (type) {
    case "Commercial": {
      // Airline ICAO code + 3-4 digit flight number (e.g., DLH482, BAW1179)
      const num = Math.floor(Math.random() * 9000) + 100;
      return `${modelDef.callsignPrefix}${num}`;
    }
    case "Military": {
      // Tactical callsign + 2-digit flight (e.g., VIPER-01, RAPTOR-12)
      const num = String(Math.floor(Math.random() * 30) + 1).padStart(2, "0");
      return `${modelDef.callsignPrefix}-${num}`;
    }
    case "Private": {
      // Civil registration (e.g., N421GX, D-IABC, HB-FXE)
      const suffix = Math.random().toString(36).substr(2, 3).toUpperCase();
      if (modelDef.callsignPrefix === "N") {
        const num = Math.floor(Math.random() * 900) + 100;
        return `N${num}${suffix.substring(0, 2)}`;
      }
      return `${modelDef.callsignPrefix}${suffix}`;
    }
    case "Drone": {
      // Tactical RPA designator (e.g., REAPER-04, BAYRAKTAR-11)
      const num = String(Math.floor(Math.random() * 20) + 1).padStart(2, "0");
      return `${modelDef.callsignPrefix}-${num}`;
    }
    case "Unknown":
    default: {
      const num = Math.floor(Math.random() * 999) + 100;
      return `UNK${num}`;
    }
  }
}

export function generateRandomAircraft(): Aircraft {
  const id = `AC${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  const type = pickWeightedType();
  const modelDef = pickRandomModel(type);
  const callsign = generateCallsign(type, modelDef);

  const lat = 44 + Math.random() * 12;
  const lng = 4 + Math.random() * 12;

  const isDrone = type === "Drone";
  const iffResponding = Math.random() < IFF_RESPONSE_PROBABILITY[type];

  const aircraft: Aircraft = {
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
    heading: Math.floor(Math.random() * 360),
    type,
    model: modelDef.model,
    callsign,
    lastUpdate: Date.now(),
    threatLevel: "NEUTRAL", // temporary — overridden by AI classification on first tick
    aiClassification: {
      threatLevel: "NEUTRAL",
      confidenceScore: 50,
      riskFactors: [],
      totalScore: 35,
      previousScores: [],
      iffResponding,
      anomalyScore: 0,
      predictedPath: [],
      lastClassificationTime: Date.now(),
    },
  };

  // Run initial classification
  const assessment = classifyAircraftThreat(aircraft, 0);
  aircraft.threatLevel = assessment.threatLevel;
  aircraft.aiClassification = assessment;

  return aircraft;
}

export function pickRandomSAM(): { designation: string; speed: number } {
  return SAM_SYSTEMS[Math.floor(Math.random() * SAM_SYSTEMS.length)];
}

// ─── AI Threat Classification Engine ───────────────────────────────────────

export function classifyAircraftThreat(
  aircraft: Aircraft,
  headingDelta: number,
  existingAnomaly: number = 0,
): ThreatAssessment {
  const iffResponding = aircraft.aiClassification?.iffResponding ??
    (Math.random() < IFF_RESPONSE_PROBABILITY[aircraft.type]);
  const previousScores = aircraft.aiClassification?.previousScores ?? [];

  const factors: RiskFactor[] = [];

  // 1. Aircraft Type Baseline
  const typeScore = TYPE_BASELINE_SCORE[aircraft.type];
  factors.push({
    name: "Aircraft Type",
    weight: 0.15,
    score: typeScore,
    weighted: 0.15 * typeScore,
    description: `${aircraft.type} aircraft baseline risk (${typeScore}%)`,
  });

  // 2. IFF Response
  const iffScore = iffResponding ? 0 : 100;
  factors.push({
    name: "IFF Response",
    weight: 0.20,
    score: iffScore,
    weighted: 0.20 * iffScore,
    description: iffResponding
      ? "IFF transponder responding normally"
      : "No IFF transponder response detected",
  });

  // 3. Proximity to Base
  const distanceToBase = calculateDistance(aircraft.position, RADAR_BASE);
  const proximityScore = Math.min(100, Math.max(0, 100 - (distanceToBase / 3)));
  factors.push({
    name: "Proximity",
    weight: 0.15,
    score: Math.round(proximityScore),
    weighted: 0.15 * proximityScore,
    description: `${distanceToBase.toFixed(0)}km from base (${proximityScore < 30 ? "safe distance" : proximityScore < 60 ? "monitoring range" : "close proximity"})`,
  });

  // 4. Heading Toward Base
  const bearingToBase = bearingBetween(aircraft.position, RADAR_BASE);
  const headingAngleDiff = angleDifference(aircraft.heading, bearingToBase);
  let headingScore: number;
  if (headingAngleDiff < 30) headingScore = 100;
  else if (headingAngleDiff < 60) headingScore = 70;
  else if (headingAngleDiff < 90) headingScore = 40;
  else headingScore = 10;
  factors.push({
    name: "Approach Vector",
    weight: 0.15,
    score: headingScore,
    weighted: 0.15 * headingScore,
    description: headingScore >= 70
      ? "Direct approach course toward base"
      : headingScore >= 40
      ? "Partial approach vector detected"
      : "Non-threatening flight path",
  });

  // 5. Speed Anomaly
  const normalRange = NORMAL_SPEED_RANGE[aircraft.type];
  let speedScore = 0;
  if (aircraft.speed < normalRange.min) {
    speedScore = Math.min(100, ((normalRange.min - aircraft.speed) / normalRange.min) * 150);
  } else if (aircraft.speed > normalRange.max) {
    speedScore = Math.min(100, ((aircraft.speed - normalRange.max) / normalRange.max) * 150);
  }
  factors.push({
    name: "Speed Analysis",
    weight: 0.10,
    score: Math.round(speedScore),
    weighted: 0.10 * speedScore,
    description: speedScore < 20
      ? "Speed within normal parameters"
      : speedScore < 60
      ? "Unusual speed detected"
      : "Abnormal speed — evasive or aggressive",
  });

  // 6. Altitude Anomaly
  let altScore = 0;
  if (aircraft.type !== "Drone" && aircraft.position.altitude < 2000) {
    altScore = 80; // low altitude non-drone is suspicious
  } else if (aircraft.type === "Unknown" && aircraft.position.altitude > 12000) {
    altScore = 70;
  } else if (aircraft.type === "Drone" && aircraft.position.altitude > 3000) {
    altScore = 60;
  } else {
    altScore = 15;
  }
  factors.push({
    name: "Altitude Profile",
    weight: 0.10,
    score: altScore,
    weighted: 0.10 * altScore,
    description: altScore < 30
      ? "Altitude within normal range"
      : altScore < 60
      ? "Unusual altitude for aircraft type"
      : "Suspicious altitude — potential threat profile",
  });

  // 7. Flight Pattern Stability
  const stabilityScore = Math.min(100, Math.max(0, headingDelta * 6.67)); // 15° change → 100
  factors.push({
    name: "Flight Pattern",
    weight: 0.15,
    score: Math.round(stabilityScore),
    weighted: 0.15 * stabilityScore,
    description: stabilityScore < 20
      ? "Stable flight trajectory"
      : stabilityScore < 50
      ? "Minor course corrections detected"
      : "Erratic flight pattern — evasive maneuvers suspected",
  });

  // Calculate total score
  let totalScore = factors.reduce((sum, f) => sum + f.weighted, 0);

  // Anomaly escalation
  if (existingAnomaly > 50) {
    totalScore += existingAnomaly * 0.15;
  }
  totalScore = Math.min(100, Math.max(0, totalScore));

  // Score to threat level
  let threatLevel: Aircraft["threatLevel"];
  let confidence: number;
  if (totalScore <= 25) {
    threatLevel = "FRIENDLY";
    confidence = Math.max(60, 100 - totalScore * 1.5);
  } else if (totalScore <= 45) {
    threatLevel = "NEUTRAL";
    confidence = Math.max(55, 80 - Math.abs(totalScore - 35) * 1.5);
  } else if (totalScore <= 65) {
    threatLevel = "SUSPECT";
    confidence = Math.max(55, 80 - Math.abs(totalScore - 55) * 1.5);
  } else {
    threatLevel = "HOSTILE";
    confidence = Math.max(60, 50 + totalScore * 0.45);
  }

  // Small jitter to feel alive
  confidence = Math.min(99, Math.max(45, confidence + (Math.random() - 0.5) * 6));

  // Track previous scores (keep last 5)
  const newPreviousScores = [...previousScores, totalScore].slice(-5);

  return {
    threatLevel,
    confidenceScore: Math.round(confidence * 10) / 10,
    riskFactors: factors,
    totalScore: Math.round(totalScore * 10) / 10,
    previousScores: newPreviousScores,
    iffResponding,
    anomalyScore: existingAnomaly,
    predictedPath: calculatePredictedPath(aircraft),
    lastClassificationTime: Date.now(),
  };
}

// ─── Predicted Flight Path ─────────────────────────────────────────────────

export function calculatePredictedPath(
  aircraft: Aircraft,
  steps: number = 5,
  intervalSec: number = 10,
): PredictedPosition[] {
  const positions: PredictedPosition[] = [];
  const headingRad = (aircraft.heading * Math.PI) / 180;
  const latRad = (aircraft.position.lat * Math.PI) / 180;

  for (let i = 1; i <= steps; i++) {
    const distKm = (aircraft.speed / 3600) * (i * intervalSec);
    const futureLat = aircraft.position.lat + (distKm * Math.cos(headingRad)) / 111;
    const futureLng = aircraft.position.lng + (distKm * Math.sin(headingRad)) / (111 * Math.cos(latRad));

    positions.push({
      lat: futureLat,
      lng: futureLng,
      altitude: aircraft.position.altitude,
      timestamp: Date.now() + i * intervalSec * 1000,
      uncertainty: Math.min(1.0, 0.05 * i),
    });
  }

  return positions;
}

// ─── Anomaly Detection ─────────────────────────────────────────────────────

export function detectAnomaly(
  aircraft: Aircraft,
  previousPredictions: Map<string, PredictedPosition[]>,
): number {
  const prevPredictions = previousPredictions.get(aircraft.id);
  if (!prevPredictions || prevPredictions.length === 0) return 0;

  // Find the prediction closest to "now"
  const now = Date.now();
  let closest: PredictedPosition | null = null;
  let minTimeDiff = Infinity;
  for (const pred of prevPredictions) {
    const diff = Math.abs(pred.timestamp - now);
    if (diff < minTimeDiff) {
      minTimeDiff = diff;
      closest = pred;
    }
  }

  if (!closest) return 0;

  const deviationKm = calculateDistance(aircraft.position, { lat: closest.lat, lng: closest.lng });
  // 5km deviation → score 100
  return Math.min(100, deviationKm * 20);
}

// ─── Smart Alert Generator ─────────────────────────────────────────────────

export function generateSmartAlert(aircraft: Aircraft[]): Alert {
  const id = `ALT${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
  const generators: (() => Alert | null)[] = [];

  // Threat escalation alerts
  const hostiles = aircraft.filter(ac => ac.threatLevel === "HOSTILE");
  const suspects = aircraft.filter(ac => ac.threatLevel === "SUSPECT");

  if (hostiles.length > 0) {
    generators.push(() => {
      const ac = hostiles[Math.floor(Math.random() * hostiles.length)];
      const conf = ac.aiClassification?.confidenceScore ?? 85;
      return {
        id, timestamp: Date.now(), type: "THREAT", priority: "HIGH",
        message: `AI classified ${ac.callsign} (${ac.model}) as HOSTILE (confidence: ${conf.toFixed(1)}%) — ${ac.position.altitude.toFixed(0)}m`,
        position: { lat: ac.position.lat, lng: ac.position.lng },
      };
    });
  }

  if (suspects.length > 0) {
    generators.push(() => {
      const ac = suspects[Math.floor(Math.random() * suspects.length)];
      const topFactor = ac.aiClassification?.riskFactors
        .sort((a, b) => b.weighted - a.weighted)[0];
      return {
        id, timestamp: Date.now(), type: "THREAT", priority: "MEDIUM",
        message: `AI monitoring ${ac.callsign} (${ac.model}): threat score ${ac.aiClassification?.totalScore.toFixed(0) ?? "?"} — ${topFactor?.description ?? "multiple risk factors"}`,
        position: { lat: ac.position.lat, lng: ac.position.lng },
      };
    });
  }

  // IFF alerts
  const noIff = aircraft.filter(ac => ac.aiClassification && !ac.aiClassification.iffResponding);
  if (noIff.length > 0) {
    generators.push(() => {
      const ac = noIff[Math.floor(Math.random() * noIff.length)];
      return {
        id, timestamp: Date.now(), type: "DETECTION", priority: "MEDIUM",
        message: `AI alert: No IFF response from ${ac.callsign} — ${ac.model} — threat assessment in progress`,
        position: { lat: ac.position.lat, lng: ac.position.lng },
      };
    });
  }

  // Proximity alerts
  const nearBase = aircraft.filter(ac => {
    const dist = calculateDistance(ac.position, RADAR_BASE);
    return dist < 150 && ac.threatLevel !== "FRIENDLY";
  });
  if (nearBase.length > 0) {
    generators.push(() => {
      const ac = nearBase[Math.floor(Math.random() * nearBase.length)];
      const dist = calculateDistance(ac.position, RADAR_BASE);
      return {
        id, timestamp: Date.now(), type: "DETECTION", priority: dist < 80 ? "HIGH" : "MEDIUM",
        message: `AI tracking: ${ac.callsign} (${ac.model}) at ${dist.toFixed(0)}km — ${ac.threatLevel}`,
        position: { lat: ac.position.lat, lng: ac.position.lng },
      };
    });
  }

  // Anomaly alerts
  const anomalous = aircraft.filter(ac => (ac.aiClassification?.anomalyScore ?? 0) > 40);
  if (anomalous.length > 0) {
    generators.push(() => {
      const ac = anomalous[Math.floor(Math.random() * anomalous.length)];
      return {
        id, timestamp: Date.now(), type: "THREAT", priority: "MEDIUM",
        message: `AI anomaly: ${ac.callsign} (${ac.model}) deviated from predicted path — anomaly score: ${ac.aiClassification?.anomalyScore.toFixed(0) ?? 0}%`,
        position: { lat: ac.position.lat, lng: ac.position.lng },
      };
    });
  }

  // System summary alert
  generators.push(() => {
    const totalTracked = aircraft.length;
    const hostileCount = hostiles.length;
    const suspectCount = suspects.length;
    const avgConf = aircraft.reduce((s, ac) => s + (ac.aiClassification?.confidenceScore ?? 50), 0) / Math.max(1, totalTracked);
    return {
      id, timestamp: Date.now(), type: "SYSTEM", priority: "LOW",
      message: `AI classification engine: tracking ${totalTracked} contacts — ${hostileCount} hostile, ${suspectCount} suspect — avg confidence ${avgConf.toFixed(1)}%`,
    };
  });

  // AI processing status
  generators.push(() => ({
    id, timestamp: Date.now(), type: "INFO", priority: "LOW",
    message: `AI neural classifier operational — ${aircraft.length * 7} factor assessments processed, predictive models updated`,
  }));

  // Weight toward more interesting alerts
  const weights = generators.map((_, i) => {
    if (i < 2) return 3; // threat alerts weighted higher
    if (i < 4) return 2; // IFF/proximity
    return 1;            // system/info
  });
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let pick = Math.random() * totalWeight;
  for (let i = 0; i < generators.length; i++) {
    pick -= weights[i];
    if (pick <= 0) {
      const result = generators[i]();
      if (result) return result;
    }
  }

  // Fallback
  return {
    id, timestamp: Date.now(), type: "INFO", priority: "LOW",
    message: `AI monitoring: ${aircraft.length} aircraft in tracked airspace — all systems nominal`,
  };
}

// ─── Engagement Priority Queue ─────────────────────────────────────────────

export function calculateEngagementPriority(aircraft: Aircraft): number {
  // Threat level weight (0.30)
  const threatMap: Record<Aircraft["threatLevel"], number> = {
    HOSTILE: 100, SUSPECT: 60, NEUTRAL: 20, FRIENDLY: 0,
  };
  const threatScore = threatMap[aircraft.threatLevel] * 0.30;

  // Distance to base (0.25) — closer = higher priority
  const dist = calculateDistance(aircraft.position, RADAR_BASE);
  const distScore = Math.min(100, Math.max(0, 100 - dist / 3)) * 0.25;

  // Closing speed (0.20) — velocity component toward base
  const bearingToBase = bearingBetween(aircraft.position, RADAR_BASE);
  const angleDiff = angleDifference(aircraft.heading, bearingToBase);
  const closingComponent = Math.cos((angleDiff * Math.PI) / 180);
  const closingSpeed = Math.max(0, aircraft.speed * closingComponent);
  const closingScore = Math.min(100, closingSpeed / 10) * 0.20;

  // Time to impact (0.15) — lower = higher priority
  const timeToImpact = closingSpeed > 0 ? (dist / closingSpeed) * 3600 : 99999; // seconds
  const timeScore = Math.min(100, Math.max(0, 100 - (timeToImpact / 6))) * 0.15;

  // AI Confidence (0.10)
  const confScore = (aircraft.aiClassification?.confidenceScore ?? 50) * 0.10;

  return threatScore + distScore + closingScore + timeScore + confScore;
}

export function buildPriorityQueue(aircraft: Aircraft[]): PriorityTarget[] {
  return aircraft
    .filter(ac => ac.threatLevel === "HOSTILE" || ac.threatLevel === "SUSPECT")
    .map(ac => {
      const engagementScore = calculateEngagementPriority(ac);
      const dist = calculateDistance(ac.position, RADAR_BASE);
      const bearingToBase = bearingBetween(ac.position, RADAR_BASE);
      const angleDiff = angleDifference(ac.heading, bearingToBase);
      const closingSpeed = Math.max(0, ac.speed * Math.cos((angleDiff * Math.PI) / 180));
      const eta = closingSpeed > 0 ? (dist / closingSpeed) * 3600 : 99999;

      let recommendation: PriorityTarget["recommendation"];
      if (engagementScore > 60) recommendation = "ENGAGE";
      else if (engagementScore > 40) recommendation = "TRACK";
      else if (engagementScore > 20) recommendation = "MONITOR";
      else recommendation = "CLEAR";

      return {
        aircraft: ac,
        engagementScore: Math.round(engagementScore * 10) / 10,
        distanceToBase: Math.round(dist),
        closingSpeed: Math.round(closingSpeed),
        estimatedTimeToImpact: Math.round(eta),
        recommendation,
      };
    })
    .sort((a, b) => b.engagementScore - a.engagementScore);
}

// ─── Keep original generateRandomAlert for server compatibility ────────────

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

  if (alertCategory.type === "DETECTION" || alertCategory.type === "THREAT") {
    alert.position = {
      lat: Math.random() * 35 + 35,
      lng: Math.random() * 50 - 10,
    };
  }

  return alert;
}

// ─── Utility Functions ─────────────────────────────────────────────────────

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

export function getThreatLevelColor(
  threatLevel: Aircraft["threatLevel"]
): string {
  switch (threatLevel) {
    case "FRIENDLY":
      return "#10b981";
    case "NEUTRAL":
      return "#3b82f6";
    case "SUSPECT":
      return "#f59e0b";
    case "HOSTILE":
      return "#ef4444";
    default:
      return "#6b7280";
  }
}

export function getThreatLevelLabel(
  threatLevel: Aircraft["threatLevel"]
): string {
  return threatLevel.charAt(0) + threatLevel.slice(1).toLowerCase();
}
