import { Router, type Request, type Response } from "express";

const router = Router();

// ─── Types ───────────────────────────────────────────────────────────────────

type EventType = "military_aircraft" | "conflict" | "disaster" | "anomalous_flight" | "weather_disruption";

interface GridEvent {
  type: EventType;
  lat: number;
  lng: number;
  timestamp: number;
  description: string;
  severity: number; // 0-10
}

interface ConvergenceZone {
  id: string;
  cellLat: number; // Grid cell center latitude
  cellLng: number; // Grid cell center longitude
  eventTypes: EventType[];
  events: GridEvent[];
  severity: number; // 0-100
  detectedAt: number;
  lastUpdated: number;
}

// ─── In-memory event store ───────────────────────────────────────────────────

const eventStore: GridEvent[] = [];
const MAX_EVENTS = 5000;
let convergenceZones: ConvergenceZone[] = [];

// Configurable thresholds
let config = {
  gridSizeDegrees: 1, // 1° x 1° cells
  timeWindowMs: 24 * 60 * 60 * 1000, // 24 hours
  minEventTypes: 3, // Minimum distinct event types to trigger convergence
  demoMode: false,
};

// ─── Event ingestion ─────────────────────────────────────────────────────────

export function ingestEvent(event: GridEvent) {
  eventStore.push(event);
  // Trim old events
  if (eventStore.length > MAX_EVENTS) {
    eventStore.splice(0, eventStore.length - MAX_EVENTS);
  }
}

// Batch ingest from external sources
export function ingestEvents(events: GridEvent[]) {
  events.forEach((e) => ingestEvent(e));
}

// ─── Convergence detection ───────────────────────────────────────────────────

function getGridKey(lat: number, lng: number): string {
  const cellLat = Math.floor(lat / config.gridSizeDegrees) * config.gridSizeDegrees;
  const cellLng = Math.floor(lng / config.gridSizeDegrees) * config.gridSizeDegrees;
  return `${cellLat}:${cellLng}`;
}

function getCellCenter(key: string): { lat: number; lng: number } {
  const [lat, lng] = key.split(":").map(Number);
  return {
    lat: lat + config.gridSizeDegrees / 2,
    lng: lng + config.gridSizeDegrees / 2,
  };
}

export function detectConvergence(): ConvergenceZone[] {
  const now = Date.now();
  const timeWindow = config.demoMode ? 60 * 60 * 1000 : config.timeWindowMs; // 1h in demo mode
  const minTypes = config.demoMode ? 1 : config.minEventTypes;

  // Filter events within time window
  const recentEvents = eventStore.filter((e) => now - e.timestamp < timeWindow);

  // Group events by grid cell
  const cells = new Map<string, GridEvent[]>();
  for (const event of recentEvents) {
    const key = getGridKey(event.lat, event.lng);
    const existing = cells.get(key) || [];
    existing.push(event);
    cells.set(key, existing);
  }

  // Detect convergence in each cell
  const zones: ConvergenceZone[] = [];
  cells.forEach((cellEvents, key) => {
    const typeSet = new Set<EventType>();
    cellEvents.forEach((e: GridEvent) => typeSet.add(e.type));
    const eventTypes = Array.from(typeSet);
    if (eventTypes.length >= minTypes) {
      const center = getCellCenter(key);
      const avgSeverity = cellEvents.reduce((s: number, e: GridEvent) => s + e.severity, 0) / cellEvents.length;
      const typeDiversity = eventTypes.length / 5; // Normalize by max types
      const severity = Math.min(100, Math.round(avgSeverity * 10 * typeDiversity * (eventTypes.length / minTypes)));

      zones.push({
        id: `CZ_${key.replace(":", "_")}`,
        cellLat: center.lat,
        cellLng: center.lng,
        eventTypes,
        events: cellEvents,
        severity,
        detectedAt: Math.min(...cellEvents.map((e: GridEvent) => e.timestamp)),
        lastUpdated: Math.max(...cellEvents.map((e: GridEvent) => e.timestamp)),
      });
    }
  });

  // Sort by severity descending
  zones.sort((a, b) => b.severity - a.severity);
  convergenceZones = zones;
  return zones;
}

// ─── Routes ──────────────────────────────────────────────────────────────────

// Get active convergence zones
router.get("/zones", (req: Request, res: Response) => {
  const zones = detectConvergence();
  res.json({
    zones,
    count: zones.length,
    config: {
      gridSizeDegrees: config.gridSizeDegrees,
      timeWindowHours: config.timeWindowMs / 3600000,
      minEventTypes: config.minEventTypes,
      demoMode: config.demoMode,
    },
    timestamp: Date.now(),
  });
});

// Ingest events from client/other sources
router.post("/events", (req: Request, res: Response) => {
  const events = req.body.events;
  if (!Array.isArray(events)) {
    return res.status(400).json({ error: "events array is required" });
  }

  const validated: GridEvent[] = events
    .filter((e: any) => e.type && typeof e.lat === "number" && typeof e.lng === "number")
    .map((e: any) => ({
      type: e.type,
      lat: e.lat,
      lng: e.lng,
      timestamp: e.timestamp || Date.now(),
      description: e.description || "",
      severity: Math.min(10, Math.max(0, e.severity || 5)),
    }));

  ingestEvents(validated);
  res.json({ ingested: validated.length, totalEvents: eventStore.length });
});

// Update configuration (for demo mode)
router.post("/config", (req: Request, res: Response) => {
  const body = req.body;
  if (typeof body.demoMode === "boolean") config.demoMode = body.demoMode;
  if (typeof body.minEventTypes === "number") {
    config.minEventTypes = Math.max(1, Math.min(5, body.minEventTypes));
  }
  if (typeof body.gridSizeDegrees === "number") {
    config.gridSizeDegrees = Math.max(0.5, Math.min(5, body.gridSizeDegrees));
  }
  if (typeof body.timeWindowHours === "number") {
    config.timeWindowMs = Math.max(1, Math.min(168, body.timeWindowHours)) * 3600000;
  }
  res.json({ config, timestamp: Date.now() });
});

// Get current stats
router.get("/stats", (req: Request, res: Response) => {
  const now = Date.now();
  const recentEvents = eventStore.filter((e) => now - e.timestamp < config.timeWindowMs);
  const byType: Record<string, number> = {};
  for (const e of recentEvents) {
    byType[e.type] = (byType[e.type] || 0) + 1;
  }
  res.json({
    totalEvents: eventStore.length,
    recentEvents: recentEvents.length,
    byType,
    activeZones: convergenceZones.length,
    config,
    timestamp: Date.now(),
  });
});

export { router as convergenceRouter };
