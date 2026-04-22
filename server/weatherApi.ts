import { Router, type Request, type Response } from "express";

const router = Router();

// Cache with configurable TTL
interface CacheEntry {
  data: any;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const WEATHER_CACHE_TTL = 60000; // 60 seconds

function getCached(key: string): any | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < WEATHER_CACHE_TTL) {
    return entry.data;
  }
  return null;
}

function setCache(key: string, data: any): void {
  cache.set(key, { data, timestamp: Date.now() });
}

// Open-Meteo current weather for a single point
router.get("/current", async (req: Request, res: Response) => {
  const lat = parseFloat(req.query.lat as string);
  const lng = parseFloat(req.query.lng as string);

  if (isNaN(lat) || isNaN(lng)) {
    return res.status(400).json({ error: "lat and lng are required" });
  }

  const cacheKey = `weather:${lat.toFixed(2)}:${lng.toFixed(2)}`;
  const cached = getCached(cacheKey);
  if (cached) return res.json(cached);

  try {
    const params = new URLSearchParams({
      latitude: lat.toString(),
      longitude: lng.toString(),
      current: [
        "temperature_2m",
        "relative_humidity_2m",
        "apparent_temperature",
        "precipitation",
        "rain",
        "snowfall",
        "cloud_cover",
        "wind_speed_10m",
        "wind_direction_10m",
        "wind_gusts_10m",
        "visibility",
        "weather_code",
      ].join(","),
      wind_speed_unit: "kmh",
      timezone: "auto",
    });

    const url = `https://api.open-meteo.com/v1/forecast?${params}`;
    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) throw new Error(`Open-Meteo returned ${response.status}`);
    const json = await response.json();

    const current = json.current;
    const result = {
      temperature: current.temperature_2m ?? 0,
      humidity: current.relative_humidity_2m ?? 0,
      apparentTemperature: current.apparent_temperature ?? 0,
      precipitation: current.precipitation ?? 0,
      rain: current.rain ?? 0,
      snowfall: current.snowfall ?? 0,
      cloudCover: current.cloud_cover ?? 0,
      windSpeed: current.wind_speed_10m ?? 0,
      windDirection: current.wind_direction_10m ?? 0,
      windGusts: current.wind_gusts_10m ?? 0,
      visibility: current.visibility ?? 10000,
      weatherCode: current.weather_code ?? 0,
      weatherDescription: getWeatherDescription(current.weather_code ?? 0),
      timestamp: Date.now(),
      location: { lat, lng },
      // Operational impact assessment
      operationalImpact: assessOperationalImpact(current),
    };

    setCache(cacheKey, result);
    res.json(result);
  } catch (err) {
    console.error("Weather API error:", err);
    const fallback = getCached(cacheKey);
    if (fallback) return res.json(fallback);
    res.json({ error: "Weather fetch failed", timestamp: Date.now() });
  }
});

// Grid weather data for map overlay (multiple points)
router.get("/grid", async (req: Request, res: Response) => {
  const latMin = parseFloat(req.query.latMin as string);
  const latMax = parseFloat(req.query.latMax as string);
  const lngMin = parseFloat(req.query.lngMin as string);
  const lngMax = parseFloat(req.query.lngMax as string);
  const requestedStep = parseFloat(req.query.step as string) || 2; // degrees between grid points

  if (isNaN(latMin) || isNaN(latMax) || isNaN(lngMin) || isNaN(lngMax)) {
    return res.status(400).json({ error: "latMin, latMax, lngMin, lngMax are required" });
  }

  // Auto-grow step so the grid never exceeds the cap, instead of failing the request.
  const MAX_POINTS = 25;
  const buildGrid = (s: number) => {
    const lats: number[] = [];
    const lngs: number[] = [];
    for (let lat = latMin; lat <= latMax; lat += s) lats.push(parseFloat(lat.toFixed(2)));
    for (let lng = lngMin; lng <= lngMax; lng += s) lngs.push(parseFloat(lng.toFixed(2)));
    return { lats, lngs };
  };
  let step = requestedStep;
  let { lats, lngs } = buildGrid(step);
  while (lats.length * lngs.length > MAX_POINTS && step < 30) {
    step += 0.5;
    ({ lats, lngs } = buildGrid(step));
  }

  const cacheKey = `weather-grid:${latMin.toFixed(1)}:${latMax.toFixed(1)}:${lngMin.toFixed(1)}:${lngMax.toFixed(1)}:${step}`;
  const cached = getCached(cacheKey);
  if (cached) return res.json(cached);

  try {

    // Fetch weather for each grid point in parallel
    const points: any[] = [];
    const fetches = lats.flatMap((lat) =>
      lngs.map(async (lng) => {
        const params = new URLSearchParams({
          latitude: lat.toString(),
          longitude: lng.toString(),
          current: "wind_speed_10m,wind_direction_10m,cloud_cover,visibility,weather_code,precipitation",
          wind_speed_unit: "kmh",
        });
        try {
          const resp = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, {
            signal: AbortSignal.timeout(8000),
          });
          if (!resp.ok) return;
          const json = await resp.json();
          const c = json.current;
          points.push({
            lat,
            lng,
            windSpeed: c.wind_speed_10m ?? 0,
            windDirection: c.wind_direction_10m ?? 0,
            cloudCover: c.cloud_cover ?? 0,
            visibility: c.visibility ?? 10000,
            weatherCode: c.weather_code ?? 0,
            precipitation: c.precipitation ?? 0,
          });
        } catch {
          // Skip failed points
        }
      })
    );

    await Promise.all(fetches);

    const result = { points, timestamp: Date.now() };
    setCache(cacheKey, result);
    res.json(result);
  } catch (err) {
    console.error("Weather grid API error:", err);
    res.json({ points: [], timestamp: Date.now(), error: "Fetch failed" });
  }
});

// WMO weather code to description
function getWeatherDescription(code: number): string {
  const descriptions: Record<number, string> = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Foggy",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    66: "Light freezing rain",
    67: "Heavy freezing rain",
    71: "Slight snowfall",
    73: "Moderate snowfall",
    75: "Heavy snowfall",
    77: "Snow grains",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    85: "Slight snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail",
  };
  return descriptions[code] ?? "Unknown";
}

// Assess how weather conditions impact air defense operations
function assessOperationalImpact(current: any): {
  radarEffectiveness: number; // 0-100
  visibilityRating: string;
  flightConditions: string;
  missileGuidance: string;
} {
  const visibility = current.visibility ?? 10000;
  const windSpeed = current.wind_speed_10m ?? 0;
  const cloudCover = current.cloud_cover ?? 0;
  const precipitation = current.precipitation ?? 0;
  const weatherCode = current.weather_code ?? 0;

  // Radar effectiveness (precipitation and fog degrade it)
  let radarEffectiveness = 100;
  if (precipitation > 0) radarEffectiveness -= Math.min(30, precipitation * 10);
  if (weatherCode >= 95) radarEffectiveness -= 20; // Thunderstorms
  if (weatherCode === 45 || weatherCode === 48) radarEffectiveness -= 15; // Fog
  if (cloudCover > 80) radarEffectiveness -= 5;
  radarEffectiveness = Math.max(20, radarEffectiveness);

  // Visibility rating
  let visibilityRating: string;
  if (visibility >= 10000) visibilityRating = "Excellent";
  else if (visibility >= 5000) visibilityRating = "Good";
  else if (visibility >= 1000) visibilityRating = "Moderate";
  else visibilityRating = "Poor";

  // Flight conditions
  let flightConditions: string;
  if (windSpeed > 80 || weatherCode >= 95 || visibility < 500) {
    flightConditions = "Dangerous";
  } else if (windSpeed > 50 || precipitation > 5 || visibility < 2000) {
    flightConditions = "Difficult";
  } else if (windSpeed > 30 || cloudCover > 70 || precipitation > 0) {
    flightConditions = "Fair";
  } else {
    flightConditions = "Optimal";
  }

  // Missile guidance impact
  let missileGuidance: string;
  if (weatherCode >= 95 || precipitation > 10 || visibility < 1000) {
    missileGuidance = "Degraded";
  } else if (precipitation > 2 || windSpeed > 60) {
    missileGuidance = "Reduced";
  } else {
    missileGuidance = "Nominal";
  }

  return { radarEffectiveness, visibilityRating, flightConditions, missileGuidance };
}

export { router as weatherRouter };
