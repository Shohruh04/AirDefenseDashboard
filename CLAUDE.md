# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Air Defense Dashboard - a real-time aircraft tracking and threat monitoring simulation built with React, Three.js, and Express. The application provides multiple visualization modes (2D map, 3D simulation) for monitoring aircraft movements, threat levels, and missile defense systems.

## Development Commands

### Running the Application
- `npm run dev` - Start development server with hot reload (runs on port 5000)
- `npm run build` - Build both client (Vite) and server (esbuild) for production
- `npm start` - Run production build
- `npm run check` - Type check TypeScript files without emitting

### Database Commands
- `npm run db:push` - Push database schema changes to PostgreSQL using Drizzle

## Architecture

### Monorepo Structure
This is a monorepo with three main directories:
- `client/` - React frontend application
- `server/` - Express backend API server
- `shared/` - Shared TypeScript types and database schemas

### Frontend Architecture

**State Management (Zustand)**:
- `useSimulation` ([client/src/lib/stores/useSimulation.ts](client/src/lib/stores/useSimulation.ts)) - Core simulation state managing aircraft, alerts, missiles, and system status. Runs multiple intervals for updating positions, generating alerts, and tracking missiles.
- `usePlayback` ([client/src/lib/stores/usePlayback.ts](client/src/lib/stores/usePlayback.ts)) - Time-travel debugging with pause/rewind functionality. Stores snapshots of simulation state.
- `useSettings` ([client/src/lib/stores/useSettings.ts](client/src/lib/stores/useSettings.ts)) - User preferences including day/night mode and simulation settings.
- `useAudio` ([client/src/lib/stores/useAudio.tsx](client/src/lib/stores/useAudio.tsx)) - Sound effects management using Howler.js.
- `useGame` ([client/src/lib/stores/useGame.tsx](client/src/lib/stores/useGame.tsx)) - Game-like interaction state.

**Views System**:
The app uses a tab-based navigation with views defined in [client/src/components/Layout.tsx](client/src/components/Layout.tsx):
- `2D_MAP` - Leaflet-based map view
- `3D_SIMULATION` - Three.js/React Three Fiber 3D visualization
- `SYSTEM_STATUS` - Real-time system metrics
- `ANALYTICS` - Charts and data analytics
- `ALERTS` - Alert log viewer
- `SETTINGS` - User preferences
- `ABOUT` - Information page

**3D Visualization**:
Built with React Three Fiber and @react-three/drei. Key 3D components in `client/src/components/three/`:
- `AircraftModel.tsx` - 3D aircraft representations with threat-level coloring
- `MissileModel.tsx` - Missile trajectory visualization
- `RadarSweep.tsx` - Animated radar sweep effect
- `RadarParticles.tsx` - Particle system for radar visualization
- `Terrain.tsx` - Ground terrain rendering
- `RangeIndicator.tsx` - Radar range visualization

The 3D view includes WebGL support detection and fallback UI when unavailable.

**Simulation Logic**:
The simulation ([client/src/lib/simulation.ts](client/src/lib/simulation.ts)) defines core types and utilities:
- `Aircraft` - Position, speed, heading, type, callsign, threat level
- `Alert` - Timestamp, type, priority, message, optional position
- `Missile` - Launch/target/current position, speed, active state
- Helper functions: `generateRandomAircraft()`, `generateRandomAlert()`, `calculateDistance()`, `getThreatLevelColor()`

**UI Components**:
Uses shadcn/ui components (Radix UI primitives) located in `client/src/components/ui/`. The project includes a comprehensive set of pre-built components (Button, Card, Dialog, etc.) styled with Tailwind CSS.

### Backend Architecture

**Server Setup** ([server/index.ts](server/index.ts)):
- Express server on port 5000 (fixed)
- Serves both API routes and client build
- Vite dev middleware in development mode
- Request/response logging for API routes

**Routes** ([server/routes.ts](server/routes.ts)):
- Currently minimal - template for adding API endpoints with `/api` prefix
- Access database via `storage` interface

**Storage** ([server/storage.ts](server/storage.ts)):
- Abstraction layer with `IStorage` interface
- `MemStorage` implementation for in-memory data (users table)
- Designed to be swapped with database-backed implementation

**Database** ([shared/schema.ts](shared/schema.ts)):
- Drizzle ORM with PostgreSQL
- Schema defined with `drizzle-orm/pg-core`
- Zod validation schemas via `drizzle-zod`
- Currently defines `users` table with username/password

### Build System

**Vite Configuration** ([vite.config.ts](vite.config.ts)):
- React plugin with JSX support
- Runtime error overlay for development
- GLSL shader support (`vite-plugin-glsl`)
- Path aliases: `@/` → `client/src/`, `@shared/` → `shared/`
- Client root: `client/`, build output: `dist/public/`
- Asset handling for 3D models (.gltf, .glb) and audio (.mp3, .ogg, .wav)

**TypeScript Configuration** ([tsconfig.json](tsconfig.json)):
- Strict mode enabled
- Module resolution: bundler
- Path aliases match Vite config
- Includes client, server, and shared directories

**Production Build**:
- Client: Vite bundles React app to `dist/public/`
- Server: esbuild bundles `server/index.ts` to `dist/index.js` (ESM format, external packages)

## Key Technical Details

### Simulation Updates
The simulation runs multiple concurrent intervals when active:
- Aircraft position updates: every 2 seconds
- Alert generation: every 5-15 seconds (randomized)
- Analytics updates: every 10 seconds
- Missile position updates: every 100ms (smooth animation)
- Missile auto-launch at threats: every 8-15 seconds

### Coordinate System
- Latitude/Longitude for 2D positioning (European airspace: 35-70°N, -10-40°E)
- Altitude in meters (1000-13000m range)
- Speed in km/h
- Heading in degrees (0-359)

### Threat Level System
Aircraft threat levels determine color coding and missile targeting:
- `FRIENDLY` (green #10b981) - Safe, no action
- `NEUTRAL` (blue #3b82f6) - Monitored
- `SUSPECT` (orange #f59e0b) - High alert, may be targeted
- `HOSTILE` (red #ef4444) - Active threat, auto-targeted

### Environment Variables
Database connection requires `DATABASE_URL` environment variable (see [drizzle.config.ts](drizzle.config.ts)).

## Dependencies

**Frontend Key Libraries**:
- React 18 with React Router for navigation
- Three.js with React Three Fiber and @react-three/drei for 3D graphics
- Zustand for state management
- TanStack Query for server state
- Recharts for data visualization
- Leaflet (react-leaflet) for 2D maps
- Framer Motion for animations
- next-themes for theme management
- Tailwind CSS with shadcn/ui components

**Backend Key Libraries**:
- Express for HTTP server
- Drizzle ORM with PostgreSQL (@neondatabase/serverless)
- WebSocket support (ws package)

## Development Notes

### Adding New API Routes
1. Define route handlers in [server/routes.ts](server/routes.ts)
2. Prefix all routes with `/api`
3. Use `storage` interface for database operations
4. Update `IStorage` interface in [server/storage.ts](server/storage.ts) if adding new CRUD methods

### Adding New Database Tables
1. Define table schema in [shared/schema.ts](shared/schema.ts) using Drizzle syntax
2. Create Zod validation schemas with `createInsertSchema()`
3. Run `npm run db:push` to sync changes
4. Update storage interface and implementation

### Adding New Zustand Stores
Follow the pattern in existing stores:
- Use `subscribeWithSelector` middleware for cross-store subscriptions
- Define state interface with data and action methods
- Export typed hooks via `create<StateInterface>()`
- Clean up intervals/timers in stop/cleanup actions

### Working with 3D Components
- All Three.js components must be inside `<Canvas>` from React Three Fiber
- Use `<Suspense>` for lazy loading 3D assets
- Position calculations: convert lat/lng to 3D world coordinates for rendering
- Keep component files in `client/src/components/three/`

### Styling Guidelines
- Use Tailwind utility classes
- Dark mode via `dark:` prefix (managed by next-themes)
- shadcn/ui components are pre-styled but customizable
- Use CSS variables from `client/src/index.css` for theme colors
