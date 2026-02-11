# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Air Defense Dashboard — a real-time aircraft tracking and threat monitoring simulation with 2D map (Leaflet) and 3D (Three.js/React Three Fiber) visualization modes. Built with React 18, Zustand, Express, and PostgreSQL (Drizzle ORM).

## Development Commands

```bash
npm run dev          # Start dev server with Vite HMR (port 5000)
npm run build        # Build client (Vite → dist/public/) + server (esbuild → dist/index.js)
npm start            # Run production build (NODE_ENV=production)
npm run check        # TypeScript type-check (no emit)
npm run db:push      # Push Drizzle schema to PostgreSQL
```

Requires `DATABASE_URL` env var — see `.env.example`. Docker Compose available via `docker-compose.yml` for local PostgreSQL.

## Architecture

### Monorepo Layout

- `client/` — React frontend (Vite, entry: `client/src/main.tsx`)
- `server/` — Express backend (entry: `server/index.ts`, port 5000 hardcoded)
- `shared/` — Drizzle ORM schemas + Zod validation (`shared/schema.ts`)

### Path Aliases

- `@/` → `client/src/`
- `@shared/` → `shared/`

Configured in both `vite.config.ts` and `tsconfig.json`.

### Client-Side Navigation

**Tab-based, not URL-routed.** `Layout.tsx` holds `activeTab` state and renders views via a switch statement. No browser history or back-button support.

Tab types: `2D_MAP`, `3D_SIMULATION`, `SYSTEM_STATUS`, `ANALYTICS`, `ALERTS`, `SETTINGS`, `ABOUT`

View components live in `client/src/components/views/`.

### State Management (Zustand)

All stores use `subscribeWithSelector` middleware. Key stores:

| Store | File | Purpose |
|-------|------|---------|
| `useSimulation` | `client/src/lib/stores/useSimulation.ts` | Aircraft, alerts, missiles, system status, analytics. Runs 5 concurrent intervals. |
| `usePlayback` | `client/src/lib/stores/usePlayback.ts` | Time-travel: pause/rewind with snapshot history (max 100). |
| `useSettings` | `client/src/lib/stores/useSettings.ts` | Persisted to localStorage (`air-defense-settings`). Controls day/night, refresh rate, view mode. |
| `useAudio` | `client/src/lib/stores/useAudio.tsx` | Sound effects via Howler.js. Starts muted. |

### Simulation Intervals (when running)

| Interval | Rate | What it does |
|----------|------|-------------|
| Aircraft position | 2s | Updates positions, randomly adds/removes aircraft |
| Alert generation | 5–15s | 70% chance to create random alert |
| Analytics | 10s | Detection rate and system load data |
| Missile movement | 100ms | Smooth interpolation toward target |
| Auto-launch | 8–15s | Launches at HOSTILE/SUSPECT aircraft (60% chance) |

### Dual Simulation Architecture

Both client (`useSimulation` store) and server (`server/routes.ts`) run **independent** simulation loops. The server is the source of truth when connected via WebSocket (`/ws`). The client simulation enables offline operation. There is no real sync mechanism between them.

### Server API

All routes prefixed with `/api`. Key endpoints:

- `GET /api/aircraft` / `GET /api/aircraft/:id`
- `GET /api/alerts` / `DELETE /api/alerts`
- `GET /api/missiles` / `GET /api/missiles/active` / `POST /api/missiles/launch`
- `GET /api/system/status`
- `POST /api/simulation/start` / `POST /api/simulation/stop`
- `GET /api/health`

WebSocket at `/ws` handles: `start_simulation`, `stop_simulation`, `launch_missile`, `get_state`.

### Storage Layer

`server/storage.ts` defines an `IStorage` interface with `MemStorage` implementation (in-memory only). The Drizzle schema in `shared/schema.ts` defines tables (`users`, `aircraftTable`, `alertsTable`, `missilesTable`, `systemStatusTable`) but runtime uses `MemStorage` — all data is lost on server restart.

### 3D Visualization

Components in `client/src/components/three/`. Must be inside `<Canvas>` from React Three Fiber.

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

Threat assignment varies by aircraft type (e.g., Commercial = 90% FRIENDLY; Unknown = 30% HOSTILE).

### Coordinate System

European airspace: Lat 35–70°N, Lng -10–40°E. Altitude 1000–13000m. Speed in km/h. Heading in degrees (0–359). Radar center at 50°N, 10°E.

## Key Patterns

### Adding API Routes
1. Add handler in `server/routes.ts` with `/api` prefix
2. Use `storage` interface for data operations
3. Update `IStorage` + `MemStorage` in `server/storage.ts` if new CRUD methods needed

### Adding Zustand Stores
- Use `subscribeWithSelector` middleware
- Define state interface with data + action methods
- Clean up intervals/timers in stop/cleanup actions

### Styling
- Tailwind CSS with shadcn/ui (Radix primitives) in `client/src/components/ui/`
- Dark mode via `next-themes` with class strategy (`dark:` prefix)
- Theme CSS variables (HSL) defined in `client/src/index.css`

### Missile System
- Starts with 12 missiles (`missileReady` count)
- Each launch decrements count — no restock mechanism
- Radar launch origin: 50°N, 10°E
