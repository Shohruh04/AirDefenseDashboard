# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Air Defense Dashboard — a real-time aircraft tracking and threat monitoring simulation with 2D map (Leaflet) and 3D (Three.js/React Three Fiber) visualization modes. Built with React 18, Zustand, Express, and PostgreSQL (Drizzle ORM).

## Development Commands

```bash
npm run dev          # Start dev server (tsx runs server/index.ts with Vite HMR middleware, port 5000)
npm run build        # Build client (Vite → dist/public/) + server (esbuild → dist/index.js)
npm start            # Run production build (NODE_ENV=production node dist/index.js)
npm run check        # TypeScript type-check only (tsc --noEmit)
npm run db:push      # Push Drizzle schema to PostgreSQL
```

Requires `DATABASE_URL` env var (PostgreSQL connection string). Optional: `OPENSKY_CLIENT_ID` + `OPENSKY_CLIENT_SECRET` for authenticated OpenSky API access. Docker Compose available via `docker-compose.yml` for local PostgreSQL.

No test runner, linter, or CI pipeline is configured.

## Architecture

### Monorepo Layout

- `client/` — React frontend (Vite, entry: `client/src/main.tsx`)
- `server/` — Express backend (entry: `server/index.ts`, port 5000 hardcoded)
- `shared/` — Drizzle ORM schemas + Zod validation (`shared/schema.ts`)

### Path Aliases

- `@/` → `client/src/`
- `@shared/` → `shared/`

Configured in both `vite.config.ts` and `tsconfig.json`.

### Dev Server Pipeline

`npm run dev` → `tsx server/index.ts` → Express app starts → `server/vite.ts` sets up Vite dev middleware with HMR. In production, Express serves static files from `dist/public/`. Vite config includes GLSL shader plugin (`vite-plugin-glsl`) and asset support for `.gltf`, `.glb`, `.mp3`, `.ogg`, `.wav`.

### Client-Side Navigation

**Tab-based, not URL-routed.** `Layout.tsx` holds `activeTab` state and renders views via a switch statement. No browser history or back-button support.

Tab types: `2D_MAP`, `3D_SIMULATION`, `SYSTEM_STATUS`, `ANALYTICS`, `ALERTS`, `SETTINGS`, `ABOUT`

View components live in `client/src/components/views/`.

### State Management (Zustand)

All stores use `subscribeWithSelector` middleware. Key stores:

| Store | File | Purpose |
|-------|------|---------|
| `useSimulation` | `client/src/lib/stores/useSimulation.ts` | Aircraft, alerts, missiles, system status, analytics. Runs 5 concurrent intervals. |
| `usePlayback` | `client/src/lib/stores/usePlayback.ts` | Time-travel: pause/rewind with snapshot history (max 100). No UI controls wired up yet. |
| `useSettings` | `client/src/lib/stores/useSettings.ts` | Persisted to localStorage (`air-defense-settings`). Controls day/night, refresh rate, view mode. |
| `useAudio` | `client/src/lib/stores/useAudio.tsx` | Sound effects via HTMLAudioElement (not Howler.js despite the dependency). Starts muted. |
| `useLiveAircraft` | `client/src/lib/stores/useLiveAircraft.ts` | Polls `/api/live/aircraft` every 5s for real ADS-B data. Maps to same `Aircraft` type as simulation. |

### Dual Simulation Architecture

Both client (`useSimulation` store) and server (`server/routes.ts`) run **independent** simulation loops. The server broadcasts state via WebSocket (`/ws`). The client simulation enables offline operation. There is no real sync mechanism — they diverge.

**Key differences between client and server simulations:**

| Aspect | Client | Server |
|--------|--------|--------|
| Initial missiles | 30 | 12 |
| Missile restock | +1 on intercept (max 30) | No restock |
| Drone threat (HOSTILE) | 55% | 30% |
| Commercial threat (FRIENDLY) | 70% | 90% |
| Alert generation chance | 85% every 3-8s | 70% every 5-15s |
| Auto-launch chance | 80% every 3-6s | 60% every 8-15s |
| Initial aircraft | 15 | 8 |
| Aircraft spawn bounds | 44-56°N, 4-16°E (tighter) | 35-70°N, -10-40°E (full) |

### Simulation Intervals (when running)

| Interval | Rate | What it does |
|----------|------|-------------|
| Aircraft position | 2s | Updates positions, randomly adds/removes aircraft |
| Alert generation | 3-8s (client) / 5-15s (server) | Generates random alerts |
| Analytics | 10s | Detection rate and system load data |
| Missile movement | 100ms | Smooth interpolation toward target |
| Auto-launch | 3-6s (client) / 8-15s (server) | Launches at HOSTILE/SUSPECT aircraft |

### Server API

All routes prefixed with `/api`. Key endpoints:

- `GET /api/aircraft` / `GET /api/aircraft/:id`
- `GET /api/alerts?limit=N` (default 100) / `DELETE /api/alerts`
- `GET /api/missiles` / `GET /api/missiles/active` / `POST /api/missiles/launch`
- `GET /api/system/status`
- `POST /api/simulation/start` / `POST /api/simulation/stop` / `GET /api/simulation/status`
- `GET /api/health`
- `GET /api/live/aircraft?lat=&lng=&radius=&provider=` (real ADS-B data)
- `GET /api/live/military` (military aircraft via airplanes.live)

WebSocket at `/ws` handles: `start_simulation`, `stop_simulation`, `launch_missile`, `get_state`.

Broadcast events: `aircraft_update`, `new_alert`, `missile_launch`, `missile_impact`, `missiles_update`, `system_status`, `simulation_started`, `simulation_stopped`, `alerts_cleared`.

### Live Aircraft Tracking

`server/liveAircraft.ts` provides real ADS-B data via two providers:
- **airplanes.live** (default) — free, no auth, `GET /api/live/aircraft?lat=&lng=&radius=&provider=airplanes-live`
- **OpenSky Network** — optional auth via `OPENSKY_CLIENT_ID`/`OPENSKY_CLIENT_SECRET`, `provider=opensky`
- **Military endpoint** — `GET /api/live/military` (airplanes.live only)

All responses are normalized to the same `Aircraft` shape. Server-side caching with 3s TTL to respect rate limits. Live aircraft IDs are prefixed with `LIVE_`.

### Country Configuration System

`shared/countryConfigs.ts` defines per-country settings (radar center, map bounds, spawn bounds, defense systems, aircraft models, air bases). Currently configured: **Germany** (default) and **Uzbekistan**. Selected via `country` setting in `useSettings`. Used by both simulation and live tracking to determine coordinates and available systems.

### Data Source Modes

`useSettings` has a `dataSource` field: `simulation` (client-generated), `live` (real ADS-B), or `hybrid` (both). Also configurable: `liveApiProvider` (`airplanes-live` or `opensky`).

### AI Classification Settings

`useSettings` stores `aiEnabled`, `anomalySensitivity` (1-10), and `predictionHorizon` (10-120s) for the classification engine in `client/src/lib/simulation.ts`.

### Storage Layer

`server/storage.ts` defines an `IStorage` interface with `MemStorage` implementation (in-memory only). The Drizzle schema in `shared/schema.ts` defines tables (`users`, `aircraftTable`, `alertsTable`, `missilesTable`, `systemStatusTable`) but runtime uses `MemStorage` — all data is lost on server restart.

### 3D Visualization

Components in `client/src/components/three/`. Must be inside `<Canvas>` from React Three Fiber.

All 3D components use **Physically Based Rendering (PBR)** materials (metalness, roughness). Key components:
- `Terrain.tsx` — Military base with buildings, runway, missile launchers, mountains, trees, watchtowers, vehicles
- `AircraftModel.tsx` — 4 aircraft types (Military, Commercial, Private, Unknown) with navigation lights
- `DroneModel.tsx` — Quadcopter with spinning propellers and hovering animation
- `MissileModel.tsx` — Missile body with exhaust glow, smoke trail, target indicator
- `RadarSweep.tsx` — Rotating dish, sweep beam, range rings (50/100/150km)
- `RadarParticles.tsx` — 1000 floating green particles
- `Sky.tsx` — Shader-based gradient dome, sun/moon, stars, clouds

**Coordinate conversion** (lat/lng to 3D world, centered on 50°N 10°E):
- `x = (lng - 10) * 2`
- `z = -(lat - 50) * 2`
- `y = (altitude / 1000) * 0.15 + 0.5`

WebGL detection with fallback UI when unavailable.

### Threat Level System

| Level | Color | Behavior |
|-------|-------|----------|
| `FRIENDLY` | `#10b981` (green) | No action |
| `NEUTRAL` | `#3b82f6` (blue) | Monitored |
| `SUSPECT` | `#f59e0b` (orange) | May be targeted |
| `HOSTILE` | `#ef4444` (red) | Auto-targeted by missiles |

### Coordinate System

European airspace: Lat 35–70°N, Lng -10–40°E. Altitude 1000–13000m (drones: 100–3000m). Speed in km/h. Heading in degrees (0–359). Radar center at 50°N, 10°E. Missiles travel at 3000–3600 km/h.

## Key Patterns

### Adding API Routes
1. Add handler in `server/routes.ts` with `/api` prefix
2. Use `storage` interface for data operations
3. Update `IStorage` + `MemStorage` in `server/storage.ts` if new CRUD methods needed
4. Add Zod validation for request bodies

### Adding Zustand Stores
- Use `subscribeWithSelector` middleware
- Define state interface with data + action methods
- Clean up intervals/timers in stop/cleanup actions

### Styling
- Tailwind CSS with shadcn/ui (Radix primitives) in `client/src/components/ui/`
- Dark mode via `next-themes` with class strategy (`dark:` prefix)
- Theme CSS variables (HSL) defined in `client/src/index.css`

### Missile System
- Client: Starts with 30 missiles, restocks +1 on successful intercept (max 30)
- Server: Starts with 12 missiles, no restock mechanism
- Radar launch origin: 50°N, 10°E

### Export Utilities
`client/src/lib/exportUtils.ts` provides `exportToCSV()`, `exportAlertsToPDF()`, and `exportAnalyticsToPDF()` — PDF export uses HTML generation + browser print dialog.

### Docker Deployment
`Dockerfile` uses multi-stage build. `docker-compose.yml` runs app (port 5001→5000) + PostgreSQL 15 with health check on `/api/health`.
