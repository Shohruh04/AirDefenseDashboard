# 3D Air Defense Simulation Dashboard

## Overview

This is an educational Computer Science diploma project that provides a fully simulated air defense visualization dashboard. The application generates random aircraft data and displays it through multiple views including 2D maps, 3D simulations, analytics, and system monitoring. All data is artificially generated for educational purposes only - no real defense systems or government sources are involved.

The project demonstrates modern web development practices using React, Three.js for 3D visualization, Leaflet for 2D mapping, and Chart.js for analytics dashboards.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript running on Vite for fast development and optimized builds.

**UI Component Library**: Radix UI primitives with Tailwind CSS for styling. The application uses a comprehensive set of pre-built UI components (buttons, cards, dialogs, etc.) following a consistent design system with CSS custom properties for theming.

**State Management**: Zustand stores for managing simulation state, settings, and application state. Two primary stores:
- `useSimulation`: Manages aircraft data, alerts, system status, and simulation lifecycle
- `useSettings`: Manages user preferences like simulation running state, refresh rates, and display modes

**Routing**: React Router for client-side navigation between different dashboard views (2D Map, 3D Simulation, System Status, Analytics, Alerts, Settings, About).

**3D Visualization**: Three.js via @react-three/fiber and @react-three/drei for rendering:
- Aircraft models with real-time position updates
- Radar sweep animations
- Terrain rendering with day/night modes
- Range indicators for defense systems
- Particle effects for visual enhancement

**2D Mapping**: Leaflet.js for displaying radar zones and aircraft positions on a geographic map with tooltips showing aircraft details.

**Data Visualization**: Chart.js for rendering analytics graphs including aircraft detection rates, altitude distributions, and system performance metrics.

### Backend Architecture

**Server Framework**: Express.js with TypeScript in ESM module format.

**Development Setup**: The application uses Vite middleware mode in development for hot module replacement and seamless frontend/backend integration. In production, static files are served from the built dist directory.

**API Structure**: RESTful API endpoints with `/api` prefix. The routes.ts file provides the structure for adding application-specific endpoints.

**Storage Layer**: Abstracted storage interface (IStorage) with in-memory implementation (MemStorage). The architecture supports easy swapping to database-backed storage. Currently includes a basic user schema as a foundation.

**Request Logging**: Custom middleware logs all API requests with method, path, status code, duration, and response preview for debugging.

### Data Storage Solutions

**Database ORM**: Drizzle ORM configured for PostgreSQL with:
- Schema definition in `shared/schema.ts` for type-safe database operations
- Migration support via drizzle-kit
- Neon serverless PostgreSQL driver for cloud database connectivity
- Currently includes a users table as starter schema

**Session Management**: Infrastructure includes connect-pg-simple for PostgreSQL-backed session storage (prepared for authentication features).

**Client-Side Storage**: LocalStorage utilities for persisting user preferences and settings across sessions.

### Simulation System

**Data Generation**: Custom simulation engine (`lib/simulation.ts`) that:
- Generates random aircraft with realistic attributes (position, altitude, speed, heading)
- Assigns threat levels based on aircraft type and behavior patterns
- Creates randomized alert events
- Updates aircraft positions over time to simulate movement

**Refresh Mechanism**: Configurable data refresh intervals controlled through settings, with automatic simulation lifecycle management (start/stop).

**Export Functionality**: Utility functions to export alerts and analytics data to CSV and PDF formats for analysis.

## External Dependencies

**Cloud Database**: Neon serverless PostgreSQL for data persistence (via `@neondatabase/serverless` driver).

**CDN Resources**: 
- Leaflet.js loaded from CDN for mapping functionality
- Chart.js loaded from CDN for analytics visualization
- Google Fonts (Inter) for typography

**Build Tools**:
- Vite for frontend bundling with React plugin and GLSL shader support
- esbuild for backend bundling in production
- TypeScript compiler for type checking

**3D Assets Support**: Configuration allows loading of GLTF/GLB models and audio files for enhanced visualization.

**Development Tools**:
- @replit/vite-plugin-runtime-error-modal for better error visibility during development
- PostCSS with Tailwind CSS and Autoprefixer for styling pipeline

**Design System**: Complete Radix UI component collection providing accessible, unstyled primitives that are styled with Tailwind CSS following a cohesive design token system.