import { Router, type Request, type Response } from "express";

const router = Router();

// In-memory cache to respect rate limits
interface CacheEntry {
  data: any;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 3000; // 3 seconds

function getCached(key: string): any | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL_MS) {
    return entry.data;
  }
  return null;
}

function setCache(key: string, data: any): void {
  cache.set(key, { data, timestamp: Date.now() });
}

// ─── Airplanes.Live Provider ─────────────────────────────────────────────────

interface AirplanesLiveAircraft {
  hex: string;
  flight?: string;
  r?: string;       // registration
  t?: string;       // ICAO type code
  alt_baro?: number | "ground";
  gs?: number;      // ground speed in knots
  track?: number;   // heading
  lat?: number;
  lon?: number;
  category?: string; // ADS-B category
  mil?: boolean;
}

async function fetchAirplanesLive(lat: number, lng: number, radius: number): Promise<any[]> {
  const cacheKey = `apl:${lat}:${lng}:${radius}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const url = `https://api.airplanes.live/v2/point/${lat}/${lng}/${radius}`;
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error(`airplanes.live returned ${res.status}`);
    const json = await res.json();
    const aircraft = (json.ac || []).filter((ac: AirplanesLiveAircraft) =>
      ac.lat != null && ac.lon != null
    );
    const normalized = aircraft.map(normalizeAirplanesLive);
    setCache(cacheKey, normalized);
    return normalized;
  } catch (err) {
    console.error("airplanes.live fetch error:", err);
    return getCached(cacheKey) ?? [];
  }
}

function normalizeAirplanesLive(raw: AirplanesLiveAircraft) {
  const altFeet = typeof raw.alt_baro === "number" ? raw.alt_baro : 0;
  const altMeters = altFeet * 0.3048;
  const speedKnots = raw.gs ?? 0;
  const speedKmh = speedKnots * 1.852;

  let type: string = "Unknown";
  if (raw.mil) {
    type = "Military";
  } else if (raw.category) {
    if (raw.category >= "A3") type = "Commercial";
    else if (raw.category.startsWith("A")) type = "Private";
    else if (raw.category.startsWith("B")) type = "Private";
    else if (raw.category === "C0") type = "Drone";
  }

  return {
    id: `LIVE_${raw.hex}`,
    callsign: (raw.flight ?? raw.r ?? raw.hex).trim(),
    type,
    model: raw.t ?? "Unknown",
    position: {
      lat: raw.lat!,
      lng: raw.lon!,
      altitude: Math.max(100, altMeters),
    },
    speed: Math.max(50, speedKmh),
    heading: raw.track ?? 0,
    threatLevel: "NEUTRAL",
    lastUpdate: Date.now(),
    source: "airplanes-live",
    registration: raw.r ?? undefined,
    hex: raw.hex,
  };
}

// ─── OpenSky Network Provider ────────────────────────────────────────────────

interface OpenSkyState {
  // [icao24, callsign, origin_country, time_position, last_contact,
  //  longitude, latitude, baro_altitude, on_ground, velocity,
  //  true_track, vertical_rate, sensors, geo_altitude,
  //  squawk, spi, position_source, category]
  [index: number]: any;
}

async function fetchOpenSky(lat: number, lng: number, radius: number): Promise<any[]> {
  // Convert radius (nautical miles) to approximate bounding box
  const latDeg = radius * 1.852 / 111; // nm to km to degrees
  const lngDeg = latDeg / Math.cos(lat * Math.PI / 180);

  const lamin = lat - latDeg;
  const lamax = lat + latDeg;
  const lomin = lng - lngDeg;
  const lomax = lng + lngDeg;

  const cacheKey = `osky:${lamin.toFixed(1)}:${lamax.toFixed(1)}:${lomin.toFixed(1)}:${lomax.toFixed(1)}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const url = `https://opensky-network.org/api/states/all?lamin=${lamin}&lamax=${lamax}&lomin=${lomin}&lomax=${lomax}`;

    const headers: Record<string, string> = { 'Accept': 'application/json' };

    // Support optional OpenSky credentials
    const clientId = process.env.OPENSKY_CLIENT_ID;
    const clientSecret = process.env.OPENSKY_CLIENT_SECRET;
    if (clientId && clientSecret) {
      const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
      headers['Authorization'] = `Basic ${auth}`;
    }

    const res = await fetch(url, {
      headers,
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`OpenSky returned ${res.status}`);
    const json = await res.json();
    const states: OpenSkyState[] = json.states || [];
    const normalized = states
      .filter((s) => s[6] != null && s[5] != null)
      .map(normalizeOpenSky);
    setCache(cacheKey, normalized);
    return normalized;
  } catch (err) {
    console.error("OpenSky fetch error:", err);
    return getCached(cacheKey) ?? [];
  }
}

function normalizeOpenSky(state: OpenSkyState) {
  const icao24 = state[0] as string;
  const callsign = ((state[1] as string) ?? "").trim();
  const originCountry = state[2] as string;
  const longitude = state[5] as number;
  const latitude = state[6] as number;
  const baroAltitude = (state[7] as number) ?? 10000; // already in meters
  const velocity = (state[9] as number) ?? 0; // m/s
  const trueTrack = (state[10] as number) ?? 0;
  const category = state[17] as number | undefined;

  const speedKmh = velocity * 3.6;

  let type: string = "Unknown";
  if (category != null) {
    if (category >= 3) type = "Commercial";
    else if (category >= 1) type = "Private";
  }

  return {
    id: `LIVE_${icao24}`,
    callsign: callsign || icao24,
    type,
    model: "Unknown",
    position: {
      lat: latitude,
      lng: longitude,
      altitude: Math.max(100, baroAltitude),
    },
    speed: Math.max(50, speedKmh),
    heading: trueTrack,
    threatLevel: "NEUTRAL",
    lastUpdate: Date.now(),
    source: "opensky",
    originCountry,
    hex: icao24,
  };
}

// ─── Routes ──────────────────────────────────────────────────────────────────

router.get("/aircraft", async (req: Request, res: Response) => {
  const lat = parseFloat(req.query.lat as string);
  const lng = parseFloat(req.query.lng as string);
  const radius = Math.min(250, parseFloat(req.query.radius as string) || 150);
  const provider = (req.query.provider as string) || "airplanes-live";

  if (isNaN(lat) || isNaN(lng)) {
    return res.status(400).json({ error: "lat and lng are required" });
  }

  try {
    let aircraft: any[];
    if (provider === "opensky") {
      aircraft = await fetchOpenSky(lat, lng, radius);
    } else {
      aircraft = await fetchAirplanesLive(lat, lng, radius);
    }
    res.json({ aircraft, count: aircraft.length, provider, timestamp: Date.now() });
  } catch (err) {
    console.error("Live aircraft fetch error:", err);
    res.json({ aircraft: [], count: 0, provider, timestamp: Date.now(), error: "Fetch failed" });
  }
});

router.get("/military", async (_req: Request, res: Response) => {
  const cacheKey = "apl:mil";
  const cached = getCached(cacheKey);
  if (cached) {
    return res.json({ aircraft: cached, count: cached.length, timestamp: Date.now() });
  }

  try {
    const response = await fetch("https://api.airplanes.live/v2/mil", {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error(`airplanes.live /mil returned ${response.status}`);
    const json = await response.json();
    const aircraft = (json.ac || [])
      .filter((ac: AirplanesLiveAircraft) => ac.lat != null && ac.lon != null)
      .map(normalizeAirplanesLive);
    setCache(cacheKey, aircraft);
    res.json({ aircraft, count: aircraft.length, timestamp: Date.now() });
  } catch (err) {
    console.error("Military aircraft fetch error:", err);
    res.json({ aircraft: [], count: 0, timestamp: Date.now(), error: "Fetch failed" });
  }
});

export { router as liveAircraftRouter };
