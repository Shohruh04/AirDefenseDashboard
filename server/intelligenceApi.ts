import { Router, type Request, type Response } from "express";

const router = Router();

// Cache
interface CacheEntry {
  data: any;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const INTEL_CACHE_TTL = 600000; // 10 minutes

function getCached(key: string): any | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < INTEL_CACHE_TTL) {
    return entry.data;
  }
  return null;
}

function setCache(key: string, data: any): void {
  cache.set(key, { data, timestamp: Date.now() });
}

// ─── GDELT GEO 2.0 API ──────────────────────────────────────────────────────

export interface GdeltEvent {
  id: string;
  title: string;
  url: string;
  sourceLang: string;
  domain: string;
  lat: number;
  lng: number;
  tone: number;
  goldsteinScale: number;
  date: string;
  imageUrl?: string;
  category: string; // derived from tone/goldstein
}

router.get("/events", async (req: Request, res: Response) => {
  const query = (req.query.query as string) || "conflict OR military OR protest OR attack";
  const mode = (req.query.mode as string) || "PointData";
  const maxRecords = Math.min(100, parseInt(req.query.limit as string) || 50);
  const timespan = (req.query.timespan as string) || "7d";

  const cacheKey = `gdelt:${query}:${mode}:${maxRecords}:${timespan}`;
  const cached = getCached(cacheKey);
  if (cached) return res.json(cached);

  try {
    const params = new URLSearchParams({
      query: query,
      mode: mode,
      maxrecords: maxRecords.toString(),
      timespan: timespan,
      format: "GeoJSON",
    });

    const url = `https://api.gdeltproject.org/api/v2/geo/geo?${params}`;
    const response = await fetch(url, {
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) throw new Error(`GDELT returned ${response.status}`);
    const json = await response.json();

    const events: GdeltEvent[] = (json.features || [])
      .filter((f: any) => f.geometry?.coordinates)
      .map((f: any, i: number) => {
        const props = f.properties || {};
        const coords = f.geometry.coordinates;
        const tone = parseFloat(props.toneavg) || 0;
        const goldstein = parseFloat(props.goldsteinscale) || 0;

        return {
          id: `GDELT_${i}_${Date.now()}`,
          title: props.name || props.html || "Unknown event",
          url: props.url || "",
          sourceLang: props.sourcelang || "en",
          domain: props.domain || "",
          lat: coords[1],
          lng: coords[0],
          tone,
          goldsteinScale: goldstein,
          date: props.dateadded || new Date().toISOString(),
          imageUrl: props.shareimage || undefined,
          category: categorizeEvent(tone, goldstein),
        };
      });

    const result = {
      events,
      count: events.length,
      timestamp: Date.now(),
      query,
      timespan,
    };

    setCache(cacheKey, result);
    res.json(result);
  } catch (err) {
    console.error("GDELT fetch error:", err);
    const fallback = getCached(cacheKey);
    if (fallback) return res.json(fallback);
    res.json({ events: [], count: 0, timestamp: Date.now(), error: "Fetch failed" });
  }
});

// ─── Regional Risk Score ─────────────────────────────────────────────────────

interface RiskScoreInput {
  gdeltEventCount: number;
  avgTone: number;
  avgGoldstein: number;
  militaryAircraftCount: number;
  nearbyDisasters: number;
  anomalousFlights: number;
}

router.get("/risk-score", async (req: Request, res: Response) => {
  const lat = parseFloat(req.query.lat as string);
  const lng = parseFloat(req.query.lng as string);
  const radius = parseFloat(req.query.radius as string) || 5; // degrees

  if (isNaN(lat) || isNaN(lng)) {
    return res.status(400).json({ error: "lat and lng are required" });
  }

  const cacheKey = `risk:${lat.toFixed(1)}:${lng.toFixed(1)}:${radius}`;
  const cached = getCached(cacheKey);
  if (cached) return res.json(cached);

  try {
    // Fetch GDELT events for the region
    const query = `conflict OR military OR protest OR attack OR war`;
    const params = new URLSearchParams({
      query,
      mode: "PointData",
      maxrecords: "75",
      timespan: "7d",
      format: "GeoJSON",
    });

    const response = await fetch(`https://api.gdeltproject.org/api/v2/geo/geo?${params}`, {
      signal: AbortSignal.timeout(12000),
    });

    let gdeltEvents: any[] = [];
    if (response.ok) {
      const json = await response.json();
      gdeltEvents = (json.features || []).filter((f: any) => {
        if (!f.geometry?.coordinates) return false;
        const eLat = f.geometry.coordinates[1];
        const eLng = f.geometry.coordinates[0];
        return Math.abs(eLat - lat) <= radius && Math.abs(eLng - lng) <= radius;
      });
    }

    const eventCount = gdeltEvents.length;
    const avgTone = eventCount > 0
      ? gdeltEvents.reduce((sum: number, f: any) => sum + (parseFloat(f.properties?.toneavg) || 0), 0) / eventCount
      : 0;
    const avgGoldstein = eventCount > 0
      ? gdeltEvents.reduce((sum: number, f: any) => sum + (parseFloat(f.properties?.goldsteinscale) || 0), 0) / eventCount
      : 0;

    const riskInput: RiskScoreInput = {
      gdeltEventCount: eventCount,
      avgTone,
      avgGoldstein,
      militaryAircraftCount: parseInt(req.query.militaryCount as string) || 0,
      nearbyDisasters: parseInt(req.query.disasterCount as string) || 0,
      anomalousFlights: parseInt(req.query.anomalyCount as string) || 0,
    };

    const score = computeRiskScore(riskInput);

    const result = {
      riskScore: score.total,
      breakdown: score.breakdown,
      level: score.level,
      nearbyEventCount: eventCount,
      avgTone,
      avgGoldstein,
      location: { lat, lng, radius },
      timestamp: Date.now(),
    };

    setCache(cacheKey, result);
    res.json(result);
  } catch (err) {
    console.error("Risk score error:", err);
    res.json({
      riskScore: 0,
      level: "LOW",
      breakdown: {},
      timestamp: Date.now(),
      error: "Calculation failed",
    });
  }
});

// Compute regional risk score (0-100)
function computeRiskScore(input: RiskScoreInput): {
  total: number;
  breakdown: Record<string, number>;
  level: string;
} {
  // GDELT event intensity (0-100): more events + negative tone = higher risk
  const eventIntensity = Math.min(100, input.gdeltEventCount * 3);
  const toneScore = Math.min(100, Math.max(0, (-input.avgTone) * 10 + 50));
  const goldsteinScore = Math.min(100, Math.max(0, (-input.avgGoldstein) * 5 + 50));
  const gdeltScore = (eventIntensity * 0.5 + toneScore * 0.25 + goldsteinScore * 0.25);

  // Military activity (0-100)
  const militaryScore = Math.min(100, input.militaryAircraftCount * 8);

  // Disaster proximity (0-100)
  const disasterScore = Math.min(100, input.nearbyDisasters * 20);

  // Anomalous flights (0-100)
  const anomalyScore = Math.min(100, input.anomalousFlights * 15);

  // Weighted total
  const total = Math.round(
    gdeltScore * 0.30 +
    militaryScore * 0.25 +
    disasterScore * 0.20 +
    anomalyScore * 0.25
  );

  const level = total >= 70 ? "CRITICAL" : total >= 50 ? "HIGH" : total >= 30 ? "MEDIUM" : "LOW";

  return {
    total: Math.min(100, total),
    breakdown: {
      geopolitical: Math.round(gdeltScore),
      military: Math.round(militaryScore),
      disaster: Math.round(disasterScore),
      anomaly: Math.round(anomalyScore),
    },
    level,
  };
}

// Categorize event based on tone and Goldstein scale
function categorizeEvent(tone: number, goldstein: number): string {
  if (goldstein <= -7) return "Armed Conflict";
  if (goldstein <= -4) return "Political Crisis";
  if (goldstein <= -1) return "Tensions";
  if (tone < -5) return "Protest/Unrest";
  if (tone < -2) return "Security Incident";
  if (goldstein >= 5) return "Cooperation";
  return "General";
}

export { router as intelligenceRouter };
