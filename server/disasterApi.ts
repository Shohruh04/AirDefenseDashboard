import { Router, type Request, type Response } from "express";

const router = Router();

// Cache
interface CacheEntry {
  data: any;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const DISASTER_CACHE_TTL = 300000; // 5 minutes

function getCached(key: string): any | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < DISASTER_CACHE_TTL) {
    return entry.data;
  }
  return null;
}

function setCache(key: string, data: any): void {
  cache.set(key, { data, timestamp: Date.now() });
}

// ─── USGS Earthquakes ────────────────────────────────────────────────────────

export interface Earthquake {
  id: string;
  magnitude: number;
  place: string;
  time: number;
  lat: number;
  lng: number;
  depth: number;
  type: string;
  tsunami: boolean;
  url: string;
}

router.get("/earthquakes", async (req: Request, res: Response) => {
  const days = Math.min(30, parseInt(req.query.days as string) || 7);
  const minMagnitude = parseFloat(req.query.minMagnitude as string) || 4.5;

  const cacheKey = `earthquakes:${days}:${minMagnitude}`;
  const cached = getCached(cacheKey);
  if (cached) return res.json(cached);

  try {
    const endTime = new Date().toISOString().split("T")[0];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startTime = startDate.toISOString().split("T")[0];

    const url = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=${startTime}&endtime=${endTime}&minmagnitude=${minMagnitude}&orderby=time`;

    const response = await fetch(url, {
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) throw new Error(`USGS returned ${response.status}`);
    const json = await response.json();

    const earthquakes: Earthquake[] = (json.features || [])
      .filter((f: any) =>
        f?.properties?.mag != null &&
        Array.isArray(f?.geometry?.coordinates) &&
        f.geometry.coordinates.length >= 2
      )
      .map((f: any) => ({
        id: f.id,
        magnitude: f.properties.mag,
        place: f.properties.place,
        time: f.properties.time,
        lat: f.geometry.coordinates[1],
        lng: f.geometry.coordinates[0],
        depth: f.geometry.coordinates[2] ?? 0,
        type: f.properties.type,
        tsunami: f.properties.tsunami === 1,
        url: f.properties.url,
      }));

    const result = { earthquakes, count: earthquakes.length, timestamp: Date.now() };
    setCache(cacheKey, result);
    res.json(result);
  } catch (err) {
    console.error("USGS earthquake fetch error:", err);
    const fallback = getCached(cacheKey);
    if (fallback) return res.json(fallback);
    res.json({ earthquakes: [], count: 0, timestamp: Date.now(), error: "Fetch failed" });
  }
});

// ─── NASA EONET Events ───────────────────────────────────────────────────────

export interface NaturalEvent {
  id: string;
  title: string;
  category: string;
  lat: number;
  lng: number;
  date: string;
  source: string;
  sourceUrl: string;
  magnitudeValue?: number;
  magnitudeUnit?: string;
}

router.get("/events", async (req: Request, res: Response) => {
  const days = Math.min(60, parseInt(req.query.days as string) || 30);
  const status = (req.query.status as string) || "open";

  const cacheKey = `eonet:${days}:${status}`;
  const cached = getCached(cacheKey);
  if (cached) return res.json(cached);

  try {
    const url = `https://eonet.gsfc.nasa.gov/api/v3/events?days=${days}&status=${status}`;

    const response = await fetch(url, {
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) throw new Error(`NASA EONET returned ${response.status}`);
    const json = await response.json();

    const events: NaturalEvent[] = (json.events || [])
      .filter((e: any) => e.geometry?.length > 0)
      .map((e: any) => {
        const latestGeo = e.geometry[e.geometry.length - 1];
        const coords = latestGeo.coordinates;
        return {
          id: e.id,
          title: e.title,
          category: e.categories?.[0]?.title ?? "Unknown",
          lat: coords[1],
          lng: coords[0],
          date: latestGeo.date,
          source: e.sources?.[0]?.id ?? "NASA",
          sourceUrl: e.sources?.[0]?.url ?? "",
          magnitudeValue: latestGeo.magnitudeValue,
          magnitudeUnit: latestGeo.magnitudeUnit,
        };
      });

    const result = { events, count: events.length, timestamp: Date.now() };
    setCache(cacheKey, result);
    res.json(result);
  } catch (err) {
    console.error("NASA EONET fetch error:", err);
    const fallback = getCached(cacheKey);
    if (fallback) return res.json(fallback);
    res.json({ events: [], count: 0, timestamp: Date.now(), error: "Fetch failed" });
  }
});

// ─── Combined disasters summary ──────────────────────────────────────────────

router.get("/summary", async (req: Request, res: Response) => {
  const cacheKey = "disaster-summary";
  const cached = getCached(cacheKey);
  if (cached) return res.json(cached);

  try {
    // Fetch earthquakes and EONET events in parallel
    const [eqResponse, eonetResponse] = await Promise.allSettled([
      fetch(
        `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=${getDateDaysAgo(7)}&minmagnitude=4.5&orderby=time`,
        { signal: AbortSignal.timeout(10000) }
      ),
      fetch(
        `https://eonet.gsfc.nasa.gov/api/v3/events?days=14&status=open`,
        { signal: AbortSignal.timeout(10000) }
      ),
    ]);

    let earthquakes: Earthquake[] = [];
    let events: NaturalEvent[] = [];

    if (eqResponse.status === "fulfilled" && eqResponse.value.ok) {
      const json = await eqResponse.value.json();
      earthquakes = (json.features || [])
        .filter((f: any) =>
          f?.properties?.mag != null &&
          Array.isArray(f?.geometry?.coordinates) &&
          f.geometry.coordinates.length >= 2
        )
        .slice(0, 50)
        .map((f: any) => ({
          id: f.id,
          magnitude: f.properties.mag,
          place: f.properties.place,
          time: f.properties.time,
          lat: f.geometry.coordinates[1],
          lng: f.geometry.coordinates[0],
          depth: f.geometry.coordinates[2] ?? 0,
          type: f.properties.type,
          tsunami: f.properties.tsunami === 1,
          url: f.properties.url,
        }));
    }

    if (eonetResponse.status === "fulfilled" && eonetResponse.value.ok) {
      const json = await eonetResponse.value.json();
      events = (json.events || [])
        .filter((e: any) => e.geometry?.length > 0)
        .slice(0, 50)
        .map((e: any) => {
          const latestGeo = e.geometry[e.geometry.length - 1];
          const coords = latestGeo.coordinates;
          return {
            id: e.id,
            title: e.title,
            category: e.categories?.[0]?.title ?? "Unknown",
            lat: coords[1],
            lng: coords[0],
            date: latestGeo.date,
            source: e.sources?.[0]?.id ?? "NASA",
            sourceUrl: e.sources?.[0]?.url ?? "",
            magnitudeValue: latestGeo.magnitudeValue,
            magnitudeUnit: latestGeo.magnitudeUnit,
          };
        });
    }

    const result = {
      earthquakes,
      naturalEvents: events,
      totalCount: earthquakes.length + events.length,
      timestamp: Date.now(),
    };

    setCache(cacheKey, result);
    res.json(result);
  } catch (err) {
    console.error("Disaster summary error:", err);
    res.json({
      earthquakes: [],
      naturalEvents: [],
      totalCount: 0,
      timestamp: Date.now(),
      error: "Fetch failed",
    });
  }
});

function getDateDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0];
}

export { router as disasterRouter };
