import React, { useMemo, useCallback, useEffect, useState } from "react";
import { MapContainer, TileLayer, Circle, Polyline, Marker, Popup, useMap, LayersControl } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useSimulation } from "../../lib/stores/useSimulation";
import { useSettings } from "../../lib/stores/useSettings";
import { useWeather } from "../../lib/stores/useWeather";
import { useDisasters } from "../../lib/stores/useDisasters";
import { useIntelligence } from "../../lib/stores/useIntelligence";
import { useConvergence } from "../../lib/stores/useConvergence";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { getThreatLevelColor, getThreatLevelLabel } from "../../lib/simulation";
import type { Aircraft, Missile, Explosion } from "../../lib/simulation";
import { Play, Square, Radar, Plane, Zap, Brain } from "lucide-react";
import { getCountryConfig } from "@shared/countryConfigs";
import { MILITARY_BASES_EXPANDED, OPERATOR_COLORS, type MilitaryBase } from "@shared/militaryBases";
import LayerControl, { type LayerVisibility } from "../map/LayerControl";
import WeatherOverlay from "../map/WeatherOverlay";
import DisasterMarkers from "../map/DisasterMarkers";
import ConflictZones from "../map/ConflictZones";

// Radar range ring definitions
const RADAR_RANGES = [
  { radius: 50000, color: "#00ff88", label: "50km", dash: "8 4" },
  { radius: 100000, color: "#00ccff", label: "100km", dash: "8 4" },
  { radius: 150000, color: "#ffaa00", label: "150km", dash: "12 6" },
  { radius: 200000, color: "#ff6600", label: "200km", dash: "12 6" },
  { radius: 300000, color: "#ff3333", label: "300km", dash: "16 8" },
];

// Aircraft type configs with realistic top-down silhouettes (64×64 viewBox for high detail)
// Paths modeled after real aircraft planform views (FlightRadar24 / ADS-B style)
const AIRCRAFT_CONFIG: Record<string, {
  size: number; viewBox: string; fuselage: string; wings: string;
  tail: string; extras: string; label: string;
}> = {
  Military: {
    size: 34,
    viewBox: "0 0 64 64",
    // F-16-style fighter: pointed radome, blended wing body, single vertical stab
    fuselage: `M32 2 C31 2 30.5 3 30 5 L29.5 10 L29 16 L29 38 L28.5 44 L27 50 L27 54 L29 54
               L30 52 L31 50 L32 48 L33 50 L34 52 L35 54 L37 54 L37 50 L35.5 44 L35 38
               L35 16 L34.5 10 L34 5 C33.5 3 33 2 32 2 Z`,
    // Delta wings with LERX
    wings: `M29 16 L27 18 L24 20 L14 28 L6 32 L5 33 L5.5 35 L14 32 L24 29 L29 27 Z
            M35 16 L37 18 L40 20 L50 28 L58 32 L59 33 L58.5 35 L50 32 L40 29 L35 27 Z`,
    // Horizontal stabilizers
    tail: `M28.5 44 L22 50 L20 51 L20 53 L23 52 L29 48 Z
           M35.5 44 L42 50 L44 51 L44 53 L41 52 L35 48 Z`,
    // Canopy + intake
    extras: `M32 7 C30.5 7 30 8 30 10 L30.5 14 L32 15 L33.5 14 L34 10 C34 8 33.5 7 32 7 Z`,
    label: "MIL",
  },
  Commercial: {
    size: 38,
    viewBox: "0 0 64 64",
    // Boeing 737 / A320 style: cylindrical fuselage, swept wings, underwing engines
    fuselage: `M32 1 C30.5 1 30 2.5 29.5 5 L29 10 L28.5 18 L28.5 40 L28 46 L27.5 50
               L28 52 L30 54 L32 56 L34 54 L36 52 L36.5 50 L36 46 L35.5 40 L35.5 18
               L35 10 L34.5 5 C34 2.5 33.5 1 32 1 Z`,
    // Swept wings (wide span, tapered tips)
    wings: `M28.5 22 L26 23 L18 26 L8 30 L3 32 L2 33.5 L3 34.5 L8 33 L18 30 L26 27.5
            L28.5 26.5 Z
            M35.5 22 L38 23 L46 26 L56 30 L61 32 L62 33.5 L61 34.5 L56 33 L46 30 L38 27.5
            L35.5 26.5 Z`,
    // Horizontal stabilizers + vertical tail fin
    tail: `M28 47 L22 52 L19 53.5 L19 55 L22 54 L28 50 Z
           M36 47 L42 52 L45 53.5 L45 55 L42 54 L36 50 Z
           M31 42 L31 38 L32 36 L33 38 L33 42 Z`,
    // Engine nacelles (2 underwing pods)
    extras: `M18 27 C17 27 16.5 28 16.5 29 L16.5 32 C16.5 33 17 33.5 18 33.5
             C19 33.5 19.5 33 19.5 32 L19.5 29 C19.5 28 19 27 18 27 Z
             M46 27 C45 27 44.5 28 44.5 29 L44.5 32 C44.5 33 45 33.5 46 33.5
             C47 33.5 47.5 33 47.5 32 L47.5 29 C47.5 28 47 27 46 27 Z`,
    label: "CIV",
  },
  Drone: {
    size: 28,
    viewBox: "0 0 64 64",
    // MQ-9 Reaper: detailed fuselage with sensor turret, tapered wings, V-tail, pusher prop
    fuselage: `M32 3 C31 3 30.5 4 30.5 6 L30.5 10 L30 14 L30 18 L30.5 24 L30.5 42
               L30 46 L29.5 49 L30 51 L31 53 L32 55 L33 53 L34 51 L34.5 49 L34 46
               L33.5 42 L33.5 24 L34 18 L34 14 L33.5 10 L33.5 6 C33.5 4 33 3 32 3 Z`,
    // High-aspect tapered wings with hardpoint pylons
    wings: `M30.5 22 L28 22.5 L20 24 L10 26 L4 27.5 L2 28.5 L1.5 29.5 L2.5 30
            L4 29.5 L10 28 L20 26 L28 24.5 L30.5 24 Z
            M33.5 22 L36 22.5 L44 24 L54 26 L60 27.5 L62 28.5 L62.5 29.5 L61.5 30
            L60 29.5 L54 28 L44 26 L36 24.5 L33.5 24 Z`,
    // V-tail stabilizers (inverted-V)
    tail: `M30 47 L24 53 L23 54.5 L23.5 56 L25 55 L30.5 50 Z
           M34 47 L40 53 L41 54.5 L40.5 56 L39 55 L33.5 50 Z`,
    // Sensor turret under nose + weapon pylons under wings + rear pusher prop disc
    extras: `M32 8 C30 8 29 9.5 29 11 C29 12.5 30 13.5 32 13.5 C34 13.5 35 12.5 35 11
             C35 9.5 34 8 32 8 Z
             M31.5 10 C31 10 30.5 10.5 30.5 11 C30.5 11.5 31 12 31.5 12
             C32 12 32.5 11.5 32.5 11 C32.5 10.5 32 10 31.5 10 Z
             M14 27 L13.5 28.5 L14.5 29.5 L15 28 Z
             M50 27 L49.5 28.5 L50.5 29.5 L51 28 Z
             M18 26 L17.5 27.5 L18.5 28.5 L19 27 Z
             M46 26 L45.5 27.5 L46.5 28.5 L47 27 Z`,
    label: "UAV",
  },
  Private: {
    size: 30,
    viewBox: "0 0 64 64",
    // Cessna 172 style: high straight wings, boxy fuselage, conventional tail
    fuselage: `M32 3 C30.5 3 30 4.5 30 7 L30 12 L29.5 18 L29.5 40 L29 44 L28.5 48
               L29.5 50 L31 52 L32 54 L33 52 L34.5 50 L35.5 48 L35 44 L34.5 40
               L34.5 18 L34 12 L34 7 C34 4.5 33.5 3 32 3 Z`,
    // Straight high wings (untapered, Cessna-style)
    wings: `M29.5 20 L27 20 L16 20.5 L6 21 L3 21.5 L2.5 23 L3.5 23.5 L6 23
            L16 22.5 L27 22 L29.5 22 Z
            M34.5 20 L37 20 L48 20.5 L58 21 L61 21.5 L61.5 23 L60.5 23.5 L58 23
            L48 22.5 L37 22 L34.5 22 Z`,
    // Conventional tail (horizontal + vertical stabilizer)
    tail: `M29 45 L23 49 L21 50 L21 51.5 L23.5 51 L29 48 Z
           M35 45 L41 49 L43 50 L43 51.5 L40.5 51 L35 48 Z
           M31 40 L31 36 L32 34 L33 36 L33 40 Z`,
    // Propeller disc at nose
    extras: `M32 4 C29 3.5 28 4 28 5 C28 6 29 6.5 32 6.5 C35 6.5 36 6 36 5
             C36 4 35 3.5 32 4 Z`,
    label: "PVT",
  },
  Unknown: {
    size: 28,
    viewBox: "0 0 64 64",
    // Unidentified radar return: stylized blip with question-mark feel
    fuselage: `M32 6 L29 14 L29 18 L29 40 L28 46 L29.5 50 L32 52 L34.5 50 L36 46
               L35 40 L35 18 L35 14 Z`,
    wings: `M29 22 L22 26 L12 30 L8 32 L8 34 L12 33 L22 30 L29 27 Z
            M35 22 L42 26 L52 30 L56 32 L56 34 L52 33 L42 30 L35 27 Z`,
    tail: `M28 46 L23 50 L22 52 L24 52 L29 49 Z
           M36 46 L41 50 L42 52 L40 52 L35 49 Z`,
    extras: ``,
    label: "UNK",
  },
};

// Create SVG aircraft icon based on type and threat level
function createAircraftDivIcon(ac: Aircraft, isSelected: boolean): L.DivIcon {
  const color = getThreatLevelColor(ac.threatLevel);
  const config = AIRCRAFT_CONFIG[ac.type] || AIRCRAFT_CONFIG.Unknown;
  const baseSize = config.size;
  const size = isSelected ? baseSize + 10 : baseSize;
  const rotation = ac.heading - 90;

  // Altitude-based shadow: higher altitude = larger offset & softer shadow
  const altNorm = Math.min(ac.position.altitude / 13000, 1);
  const shadowOffset = 2 + altNorm * 4;
  const shadowBlur = 3 + altNorm * 5;

  // Threat-level glow for hostile/suspect
  const glowFilter = ac.threatLevel === "HOSTILE"
    ? `drop-shadow(0 0 6px ${color}) drop-shadow(0 0 12px ${color})`
    : ac.threatLevel === "SUSPECT"
    ? `drop-shadow(0 0 4px ${color})`
    : "";

  const hostile = ac.threatLevel === "HOSTILE" ? "animation:hostile-pulse 1s ease-in-out infinite;" : "";

  // Drone: rear pusher propeller with spinning blades + exhaust glow
  const droneExtras = ac.type === "Drone"
    ? `<g opacity="0.7">
         <line x1="32" y1="51" x2="32" y2="59" stroke="${color}" stroke-width="1.2" stroke-linecap="round">
           <animateTransform attributeName="transform" type="rotate" from="0 32 55" to="360 32 55" dur="0.15s" repeatCount="indefinite"/>
         </line>
         <line x1="28" y1="55" x2="36" y2="55" stroke="${color}" stroke-width="1.2" stroke-linecap="round">
           <animateTransform attributeName="transform" type="rotate" from="0 32 55" to="360 32 55" dur="0.15s" repeatCount="indefinite"/>
         </line>
         <circle cx="32" cy="55" r="1.5" fill="${color}" opacity="0.9"/>
       </g>
       <circle cx="32" cy="57" r="3" fill="${color}" opacity="0.15">
         <animate attributeName="r" values="3;5;3" dur="1s" repeatCount="indefinite"/>
         <animate attributeName="opacity" values="0.15;0.05;0.15" dur="1s" repeatCount="indefinite"/>
       </circle>`
    : "";

  // Selection ring (centered on 64×64 viewBox)
  const selectionRing = isSelected
    ? `<circle cx="32" cy="32" r="35" fill="none" stroke="${color}" stroke-width="1.5" stroke-dasharray="5,3" opacity="0.9">
        <animateTransform attributeName="transform" type="rotate" from="0 32 32" to="360 32 32" dur="3s" repeatCount="indefinite"/>
      </circle>
      <circle cx="32" cy="32" r="38" fill="none" stroke="${color}" stroke-width="0.5" opacity="0.4">
        <animate attributeName="r" values="38;42;38" dur="1.5s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.4;0.1;0.4" dur="1.5s" repeatCount="indefinite"/>
      </circle>`
    : "";

  // Altitude label text (shows FL or meters)
  const altLabel = ac.position.altitude >= 1000
    ? `FL${Math.round(ac.position.altitude / 30.48 / 100)}`
    : `${ac.position.altitude}m`;

  // Speed in knots for display
  const speedKts = Math.round(ac.speed * 0.539957);

  // Outer container is larger to fit label + icon
  const outerW = size + 60;
  const outerH = size + 20;

  const html = `<div style="position:relative;width:${outerW}px;height:${outerH}px;pointer-events:none;">
    <svg width="${size}" height="${size}" viewBox="${config.viewBox}"
      style="position:absolute;left:${(outerW - size) / 2}px;top:0;
        transform:rotate(${rotation}deg);
        filter:drop-shadow(${shadowOffset}px ${shadowOffset}px ${shadowBlur}px rgba(0,0,0,.5)) ${glowFilter};
        ${hostile}pointer-events:auto;">
      <path d="${config.fuselage}" fill="${color}" stroke="rgba(255,255,255,0.7)" stroke-width="0.6" stroke-linejoin="round"/>
      <path d="${config.wings}" fill="${color}" stroke="rgba(255,255,255,0.5)" stroke-width="0.4" stroke-linejoin="round"/>
      <path d="${config.tail}" fill="${color}" stroke="rgba(255,255,255,0.5)" stroke-width="0.4" stroke-linejoin="round" opacity="0.9"/>
      ${config.extras ? `<path d="${config.extras}" fill="rgba(255,255,255,0.3)" stroke="none"/>` : ""}
      ${droneExtras}
      ${selectionRing}
    </svg>
    <div style="position:absolute;left:50%;bottom:-2px;transform:translateX(-50%);
      white-space:nowrap;text-align:center;pointer-events:none;
      font-family:'Courier New',monospace;line-height:1.1;">
      <div style="font-size:9px;font-weight:bold;color:${color};text-shadow:0 0 4px rgba(0,0,0,.9),0 0 2px rgba(0,0,0,.9);">
        ${ac.callsign}
      </div>
      <div style="font-size:8px;color:rgba(255,255,255,0.6);text-shadow:0 0 3px rgba(0,0,0,.9);">
        ${altLabel} ${speedKts}kt
      </div>
    </div>
  </div>`;

  return L.divIcon({
    className: "aircraft-icon",
    html,
    iconSize: [outerW, outerH],
    iconAnchor: [outerW / 2, size / 2],
  });
}

// Create missile icon
function createMissileDivIcon(rotation: number): L.DivIcon {
  const html = `<svg width="20" height="20" viewBox="0 0 24 24"
    style="transform:rotate(${rotation}deg);filter:drop-shadow(0 0 6px #ff6600);">
    <path d="M12 2 L8 10 L10 10 L10 18 L8 18 L12 22 L16 18 L14 18 L14 10 L16 10 Z" fill="#ff6600" stroke="#fff" stroke-width="1"/>
    <circle cx="12" cy="6" r="2" fill="#ffff00"/>
  </svg>`;
  return L.divIcon({
    className: "missile-icon",
    html,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

// Create military base icon with operator-specific SVG
function createMilitaryBaseIcon(base: MilitaryBase): L.DivIcon {
  const op = OPERATOR_COLORS[base.type] || { color: '#888888', label: base.type };
  const c = op.color;
  const statusOpacity = base.status === 'active' ? 1 : 0.6;
  const statusBorder = base.status === 'controversial' ? 'stroke-dasharray="2 1"' : '';

  // Different SVG shapes per operator
  let iconSvg = '';
  switch (base.type) {
    case 'us-nato':
      // 5-pointed star
      iconSvg = `<polygon points="10,1 12.5,7 19,7.5 14,12 15.5,19 10,15.5 4.5,19 6,12 1,7.5 7.5,7" fill="${c}" stroke="#fff" stroke-width="0.8" ${statusBorder}/>`;
      break;
    case 'russia':
      // Red star
      iconSvg = `<polygon points="10,1 12.5,7 19,7.5 14,12 15.5,19 10,15.5 4.5,19 6,12 1,7.5 7.5,7" fill="${c}" stroke="#fca5a5" stroke-width="0.8" ${statusBorder}/>`;
      break;
    case 'china':
      // Star with inner fill
      iconSvg = `<polygon points="10,2 12,7 18,7.5 13.5,11.5 15,17.5 10,14 5,17.5 6.5,11.5 2,7.5 8,7" fill="${c}" stroke="#fef08a" stroke-width="0.8" ${statusBorder}/>`;
      break;
    case 'uk':
      // Roundel (concentric circles)
      iconSvg = `<circle cx="10" cy="10" r="8" fill="${c}" stroke="#fff" stroke-width="0.8" ${statusBorder}/><circle cx="10" cy="10" r="5" fill="#1e3a5f"/><circle cx="10" cy="10" r="2.5" fill="#ef4444"/>`;
      break;
    case 'france':
      // Tricolor roundel
      iconSvg = `<circle cx="10" cy="10" r="8" fill="#3b82f6" stroke="#fff" stroke-width="0.8" ${statusBorder}/><circle cx="10" cy="10" r="5.5" fill="#fff"/><circle cx="10" cy="10" r="3" fill="#ef4444"/>`;
      break;
    case 'india':
      // Ashoka chakra style
      iconSvg = `<circle cx="10" cy="10" r="8" fill="${c}" stroke="#fff" stroke-width="0.8" ${statusBorder}/><circle cx="10" cy="10" r="4" fill="none" stroke="#fff" stroke-width="1.2"/>`;
      break;
    case 'italy':
      // Green roundel
      iconSvg = `<circle cx="10" cy="10" r="8" fill="${c}" stroke="#fff" stroke-width="0.8" ${statusBorder}/><circle cx="10" cy="10" r="5" fill="#fff"/><circle cx="10" cy="10" r="2.5" fill="#ef4444"/>`;
      break;
    case 'uae':
      // Crescent
      iconSvg = `<circle cx="10" cy="10" r="8" fill="${c}" stroke="#fff" stroke-width="0.8" ${statusBorder}/><circle cx="12" cy="10" r="6" fill="#1a1a2e"/>`;
      break;
    case 'japan':
      // Hinomaru
      iconSvg = `<circle cx="10" cy="10" r="8" fill="#fff" stroke="#ccc" stroke-width="0.6" ${statusBorder}/><circle cx="10" cy="10" r="5" fill="${c}"/>`;
      break;
    default:
      iconSvg = `<rect x="2" y="2" width="16" height="16" rx="2" fill="${c}" stroke="#fff" stroke-width="0.8" ${statusBorder}/>`;
  }

  const html = `<div style="opacity:${statusOpacity};pointer-events:auto;">
    <svg width="20" height="20" viewBox="0 0 20 20" style="filter:drop-shadow(0 0 3px ${c}80);cursor:pointer;">
      ${iconSvg}
    </svg>
  </div>`;

  return L.divIcon({
    className: 'military-base-icon',
    html,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10],
  });
}

// Radar center icon
const radarCenterIcon = L.divIcon({
  className: "radar-center-icon",
  html: `<div style="position:relative;width:40px;height:40px;">
    <div style="position:absolute;width:40px;height:40px;border:3px solid #00ff88;border-radius:50%;animation:pulse-ring 2s infinite;"></div>
    <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:16px;height:16px;background:#00ff88;border-radius:50%;box-shadow:0 0 20px #00ff88;"></div>
    <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:8px;height:8px;background:#fff;border-radius:50%;"></div>
  </div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

// Inject custom CSS once
const styleId = "map2d-custom-styles";
if (typeof document !== "undefined" && !document.getElementById(styleId)) {
  const style = document.createElement("style");
  style.id = styleId;
  style.textContent = `
    @keyframes pulse-ring { 0%{transform:scale(.8);opacity:1} 100%{transform:scale(1.5);opacity:0} }
    @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.3} }
    @keyframes hostile-pulse {
      0%,100%{opacity:1;filter:drop-shadow(0 0 6px #ef4444) drop-shadow(0 0 12px #ef4444)}
      50%{opacity:.7;filter:drop-shadow(0 0 10px #ef4444) drop-shadow(0 0 20px #ff0000)}
    }
    .aircraft-icon,.missile-icon,.radar-center-icon { background:none!important; border:none!important; }
    .aircraft-icon { transition: none; }
    .leaflet-popup-content-wrapper { background:rgba(20,20,30,.95);color:#fff;border:1px solid #00ff88;border-radius:8px; }
    .leaflet-popup-tip { background:rgba(20,20,30,.95);border:1px solid #00ff88; }
    .leaflet-popup-content { margin:12px; }
  `;
  document.head.appendChild(style);
}

// Component to render a single aircraft marker
const AircraftMarker: React.FC<{
  ac: Aircraft;
  isSelected: boolean;
  onSelect: (id: string) => void;
}> = React.memo(({ ac, isSelected, onSelect }) => {
  const icon = useMemo(
    () => createAircraftDivIcon(ac, isSelected),
    [ac.heading, ac.threatLevel, ac.type, ac.position.altitude, ac.speed, ac.callsign, isSelected]
  );
  const color = getThreatLevelColor(ac.threatLevel);
  const position: [number, number] = [ac.position.lat, ac.position.lng];

  // Speed-based heading trail (faster aircraft = longer trail)
  const headingRad = (ac.heading * Math.PI) / 180;
  const trailLength = Math.min(ac.speed / 600, 1.2); // longer for faster aircraft
  const trailEnd: [number, number] = [
    ac.position.lat - trailLength * Math.cos(headingRad),
    ac.position.lng - trailLength * Math.sin(headingRad) * 1.5,
  ];
  const trailMid: [number, number] = [
    ac.position.lat - trailLength * 0.5 * Math.cos(headingRad),
    ac.position.lng - trailLength * 0.5 * Math.sin(headingRad) * 1.5,
  ];

  // Flight path prediction line
  const predictionDistance = ac.speed / 1000;
  const predEnd: [number, number] = [
    ac.position.lat + predictionDistance * Math.cos(headingRad),
    ac.position.lng + predictionDistance * Math.sin(headingRad) * 1.5,
  ];

  return (
    <>
      <Marker position={position} icon={icon} eventHandlers={{ click: () => onSelect(ac.id) }}>
        <Popup autoClose={true} closeOnClick={true}>
          <div style={{ minWidth: 200 }}>
            <div style={{ marginBottom: 8, paddingBottom: 8, borderBottom: "1px solid rgba(255,255,255,.2)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 12, height: 12, background: color, borderRadius: "50%" }} />
                <span style={{ fontSize: 16, fontWeight: "bold", color }}>{ac.callsign}</span>
              </div>
              <div style={{ fontSize: 11, color: "#aaa", marginTop: 2, marginLeft: 20 }}>{ac.model}</div>
            </div>
            <div style={{ display: "grid", gap: 4, fontSize: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#888" }}>Type:</span>
                <span style={{ color: "#fff" }}>{ac.type}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#888" }}>Threat:</span>
                <span style={{ color, fontWeight: "bold" }}>{getThreatLevelLabel(ac.threatLevel)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#888" }}>AI Confidence:</span>
                <span style={{ color: "#c084fc", fontWeight: "bold" }}>{ac.aiClassification?.confidenceScore?.toFixed(0) ?? '—'}%</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#888" }}>IFF Status:</span>
                <span style={{ color: ac.aiClassification?.iffResponding ? "#00ff88" : "#ff4444" }}>
                  {ac.aiClassification?.iffResponding ? "Responding" : "No Response"}
                </span>
              </div>
              {ac.aiClassification?.riskFactors && ac.aiClassification.riskFactors.length > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#888" }}>Top Risk:</span>
                  <span style={{ color: "#ffaa00" }}>{ac.aiClassification.riskFactors[0].name}</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#888" }}>Altitude:</span>
                <span style={{ color: "#00ff88" }}>{ac.position.altitude.toLocaleString()}m</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#888" }}>Speed:</span>
                <span style={{ color: "#00ccff" }}>{ac.speed} km/h</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#888" }}>Heading:</span>
                <span style={{ color: "#fff" }}>{ac.heading}°</span>
              </div>
            </div>
            {ac.aiClassification && (
              <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,.2)", fontSize: 11 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#c084fc" }}>
                  <span style={{ fontWeight: "bold" }}>AI:</span>
                  <span>{
                    (ac.aiClassification.totalScore ?? 0) >= 66 ? "ENGAGE" :
                    (ac.aiClassification.totalScore ?? 0) >= 46 ? "TRACK" :
                    (ac.aiClassification.totalScore ?? 0) >= 26 ? "MONITOR" : "CLEAR"
                  }</span>
                </div>
              </div>
            )}
          </div>
        </Popup>
      </Marker>
      {/* Speed-based heading trail (fading contrail behind aircraft) */}
      <Polyline
        positions={[position, trailMid]}
        pathOptions={{ color, weight: 2.5, opacity: 0.4 }}
      />
      <Polyline
        positions={[trailMid, trailEnd]}
        pathOptions={{ color, weight: 1.5, opacity: 0.15 }}
      />
      {/* AI Predicted path */}
      {ac.aiClassification?.predictedPath && ac.aiClassification.predictedPath.length > 0 ? (
        <>
          <Polyline
            positions={[position, ...ac.aiClassification.predictedPath.map(p => [p.lat, p.lng] as [number, number])]}
            pathOptions={{ color, weight: 1.5, opacity: 0.5, dashArray: "6 6" }}
          />
          {ac.aiClassification.predictedPath.map((p, i) => (
            <Circle
              key={i}
              center={[p.lat, p.lng]}
              radius={p.uncertainty * 500}
              pathOptions={{ color, weight: 0.5, opacity: 0.2, fillColor: color, fillOpacity: 0.08 }}
            />
          ))}
        </>
      ) : (
        <Polyline positions={[position, predEnd]} pathOptions={{ color, weight: 1, opacity: 0.4, dashArray: "4 8" }} />
      )}
      {/* Anomaly pulse indicator */}
      {(ac.aiClassification?.anomalyScore ?? 0) > 50 && (
        <Circle
          center={position}
          radius={3000}
          pathOptions={{ color: "#ff6600", weight: 2, opacity: 0.7, fillColor: "#ff6600", fillOpacity: 0.15, dashArray: "4 4" }}
        />
      )}
    </>
  );
});

AircraftMarker.displayName = "AircraftMarker";

// Component to render a single missile track
const MissileTrack: React.FC<{ missile: Missile }> = React.memo(({ missile }) => {
  const dx = missile.targetPosition.lng - missile.currentPosition.lng;
  const dy = missile.targetPosition.lat - missile.currentPosition.lat;
  const rotation = Math.atan2(dx, dy) * (180 / Math.PI);

  const icon = useMemo(() => createMissileDivIcon(rotation), [rotation]);

  const currentPos: [number, number] = [missile.currentPosition.lat, missile.currentPosition.lng];
  const startPos: [number, number] = [missile.startPosition.lat, missile.startPosition.lng];
  const targetPos: [number, number] = [missile.targetPosition.lat, missile.targetPosition.lng];

  return (
    <>
      {/* Trail from start to current */}
      <Polyline positions={[startPos, currentPos]} pathOptions={{ color: "#ff6600", weight: 3, opacity: 0.8 }} />
      {/* Predicted trajectory */}
      <Polyline positions={[currentPos, targetPos]} pathOptions={{ color: "#ff3333", weight: 1, opacity: 0.5, dashArray: "6 6" }} />
      {/* Missile marker */}
      <Marker position={currentPos} icon={icon} />
      {/* Target lock circle */}
      <Circle center={targetPos} radius={1500} pathOptions={{ color: "#ff3333", weight: 2, opacity: 0.8, dashArray: "4 4", fill: false }} />
    </>
  );
});

MissileTrack.displayName = "MissileTrack";

// Explosion marker — animated expanding circles at impact point
const ExplosionMarker: React.FC<{ explosion: Explosion }> = React.memo(({ explosion }) => {
  const [, setTick] = React.useState(0);
  const position: [number, number] = [explosion.position.lat, explosion.position.lng];

  // Re-render every 100ms for animation
  React.useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 100);
    return () => clearInterval(timer);
  }, []);

  const elapsed = Date.now() - explosion.timestamp;
  const progress = Math.min(elapsed / 2000, 1);
  if (progress >= 1) return null;

  const outerRadius = 500 + progress * 8000;
  const innerRadius = 500 + progress * 3000;
  const opacity = Math.max(0, 0.7 - progress);

  return (
    <>
      {/* Outer shockwave */}
      <Circle
        center={position}
        radius={outerRadius}
        pathOptions={{ color: "#ff4400", weight: 2, opacity: opacity * 0.5, fillColor: "#ff6600", fillOpacity: opacity * 0.1 }}
      />
      {/* Inner fireball */}
      <Circle
        center={position}
        radius={innerRadius}
        pathOptions={{ color: "#ffaa00", weight: 0, fillColor: "#ff4400", fillOpacity: opacity * 0.4 }}
      />
      {/* Core flash */}
      {progress < 0.3 && (
        <Circle
          center={position}
          radius={800}
          pathOptions={{ color: "#ffffff", weight: 0, fillColor: "#ffff00", fillOpacity: 0.6 * (1 - progress / 0.3) }}
        />
      )}
    </>
  );
});

ExplosionMarker.displayName = "ExplosionMarker";

// Invalidate map size when container resizes
function MapResizeHandler() {
  const map = useMap();
  React.useEffect(() => {
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);
  return null;
}

// Cache military base icons by operator type (only 10 variants needed, not 210)
const baseIconCache = new Map<string, L.DivIcon>();
function getCachedBaseIcon(base: MilitaryBase): L.DivIcon {
  const cacheKey = `${base.type}_${base.status}`;
  if (baseIconCache.has(cacheKey)) return baseIconCache.get(cacheKey)!;
  const icon = createMilitaryBaseIcon(base);
  baseIconCache.set(cacheKey, icon);
  return icon;
}

// Viewport-aware military bases renderer — only renders bases in view
const MilitaryBasesLayer: React.FC<{ visible: boolean }> = React.memo(({ visible }) => {
  const map = useMap();
  const [visibleBases, setVisibleBases] = useState<MilitaryBase[]>([]);

  useEffect(() => {
    if (!visible) { setVisibleBases([]); return; }

    function updateVisible() {
      const bounds = map.getBounds();
      const pad = 2; // degrees of padding
      const latMin = bounds.getSouth() - pad;
      const latMax = bounds.getNorth() + pad;
      const lngMin = bounds.getWest() - pad;
      const lngMax = bounds.getEast() + pad;
      const inView = MILITARY_BASES_EXPANDED.filter(
        (b) => b.lat >= latMin && b.lat <= latMax && b.lon >= lngMin && b.lon <= lngMax
      );
      setVisibleBases(inView);
    }

    updateVisible();
    map.on("moveend", updateVisible);
    map.on("zoomend", updateVisible);
    return () => {
      map.off("moveend", updateVisible);
      map.off("zoomend", updateVisible);
    };
  }, [map, visible]);

  if (!visible) return null;

  return (
    <>
      {visibleBases.map((base) => {
        const opColor = OPERATOR_COLORS[base.type]?.color || '#888';
        return (
          <Marker
            key={base.id}
            position={[base.lat, base.lon]}
            icon={getCachedBaseIcon(base)}
          >
            <Popup autoClose={true} closeOnClick={true} autoPanPadding={[20, 20] as any}>
              <div style={{ fontFamily: 'monospace', fontSize: '12px', minWidth: '200px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '6px', color: opColor }}>{base.name}</div>
                <div style={{ color: '#666', marginBottom: '6px', paddingBottom: '6px', borderBottom: '1px solid #eee' }}>{base.country}</div>
                <div style={{ display: 'grid', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#888' }}>Branch:</span>
                    <span style={{ fontWeight: 500 }}>{base.arm}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#888' }}>Operator:</span>
                    <span style={{ color: opColor, fontWeight: 'bold' }}>{(OPERATOR_COLORS[base.type]?.label || base.type).toUpperCase()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#888' }}>Status:</span>
                    <span style={{ color: base.status === 'active' ? '#16a34a' : base.status === 'planned' ? '#ca8a04' : '#ea580c', fontWeight: 'bold' }}>{base.status.toUpperCase()}</span>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
});

MilitaryBasesLayer.displayName = "MilitaryBasesLayer";

const Map2D: React.FC = () => {
  const { aircraft, missiles, isRunning, startSimulation, stopSimulation, systemStatus, engagementQueue, explosions } = useSimulation();
  const { country, dataSource, weatherEnabled, disastersEnabled, intelligenceEnabled, convergenceEnabled } = useSettings();
  const countryConfig = useMemo(() => getCountryConfig(country), [country]);
  const RADAR_CENTER: [number, number] = useMemo(() => [countryConfig.radarCenter.lat, countryConfig.radarCenter.lng], [countryConfig]);
  const [selectedAircraft, setSelectedAircraft] = React.useState<string | null>(null);

  // Intelligence stores
  const { current: weatherData, gridPoints, fetchWeatherGrid, startPolling: startWeatherPolling, stopPolling: stopWeatherPolling } = useWeather();
  const { earthquakes, naturalEvents, startPolling: startDisasterPolling, stopPolling: stopDisasterPolling } = useDisasters();
  const { events: gdeltEvents, startPolling: startIntelPolling, stopPolling: stopIntelPolling } = useIntelligence();
  const { zones: convergenceZones, startPolling: startConvergencePolling, stopPolling: stopConvergencePolling } = useConvergence();

  // Layer visibility state
  const [layers, setLayers] = React.useState<LayerVisibility>({
    weather: true,
    windArrows: true,
    earthquakes: true,
    naturalEvents: true,
    conflictZones: true,
    convergenceZones: true,
    radarRanges: true,
    missilePaths: true,
    militaryBases: true,
  });

  const handleLayerToggle = useCallback((layer: keyof LayerVisibility) => {
    setLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
  }, []);

  // Start/stop polling based on settings
  useEffect(() => {
    if (weatherEnabled) {
      startWeatherPolling(countryConfig.radarCenter.lat, countryConfig.radarCenter.lng);
      fetchWeatherGrid({
        latMin: countryConfig.mapBounds.latMin,
        latMax: countryConfig.mapBounds.latMax,
        lngMin: countryConfig.mapBounds.lngMin,
        lngMax: countryConfig.mapBounds.lngMax,
      });
    } else {
      stopWeatherPolling();
    }
    return () => stopWeatherPolling();
  }, [weatherEnabled, countryConfig]);

  useEffect(() => {
    if (disastersEnabled) startDisasterPolling();
    else stopDisasterPolling();
    return () => stopDisasterPolling();
  }, [disastersEnabled]);

  useEffect(() => {
    if (intelligenceEnabled) startIntelPolling(countryConfig.radarCenter.lat, countryConfig.radarCenter.lng);
    else stopIntelPolling();
    return () => stopIntelPolling();
  }, [intelligenceEnabled, countryConfig]);

  useEffect(() => {
    if (convergenceEnabled) startConvergencePolling();
    else stopConvergencePolling();
    return () => stopConvergencePolling();
  }, [convergenceEnabled]);

  const handleSelect = useCallback((id: string) => setSelectedAircraft(id), []);

  const activeMissiles = useMemo(() => missiles.filter((m) => m.active), [missiles]);

  return (
    <div className="w-full h-full flex flex-col bg-gray-900">
      {/* Header */}
      <div className="p-3 border-b border-gray-700 bg-gray-800/80">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Radar className="h-5 w-5 text-green-400" />
            <div>
              <h2 className="text-lg font-semibold text-white">AI Tactical Radar Display</h2>
              <p className="text-xs text-gray-400">AI-powered real-time air defense monitoring</p>
            </div>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-purple-900/50 border border-purple-700">
              <Brain className="h-3 w-3 text-purple-400" />
              <span className="text-xs text-purple-300">AI Active</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant={isRunning ? "destructive" : "default"} size="sm" onClick={isRunning ? stopSimulation : startSimulation}>
              {isRunning ? <Square className="h-4 w-4 mr-1" /> : <Play className="h-4 w-4 mr-1" />}
              {isRunning ? "Stop" : "Start"}
            </Button>
            <Badge variant="outline" className={
              dataSource === 'live' ? "bg-blue-900/50 text-blue-400 border-blue-700" :
              dataSource === 'hybrid' ? "bg-purple-900/50 text-purple-400 border-purple-700" :
              "bg-gray-900/50 text-gray-400 border-gray-700"
            }>
              {dataSource === 'live' ? 'LIVE' : dataSource === 'hybrid' ? 'HYBRID' : 'SIM'}
            </Badge>
            <Badge variant="outline" className="bg-green-900/50 text-green-400 border-green-700">
              <Plane className="h-3 w-3 mr-1" />
              {aircraft.length} Tracked
            </Badge>
            {activeMissiles.length > 0 && (
              <Badge variant="destructive" className="bg-red-900/50 text-red-400 border-red-700">
                <Zap className="h-3 w-3 mr-1" />
                {activeMissiles.length} Missiles
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative">
        <MapContainer
          center={RADAR_CENTER}
          zoom={6}
          zoomControl={false}
          preferCanvas={true}
          closePopupOnClick={true}
          className="absolute inset-0 z-10"
          style={{ background: "#0a0a1a" }}
        >
          <MapResizeHandler />

          <LayersControl position="topright">
            <LayersControl.BaseLayer checked name="Dark (Tactical)">
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution="&copy; OpenStreetMap, &copy; CARTO"
                maxZoom={19}
              />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Satellite">
              <TileLayer
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                attribution="&copy; Esri"
                maxZoom={18}
              />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Standard">
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap contributors"
                maxZoom={19}
              />
            </LayersControl.BaseLayer>
          </LayersControl>

          {/* Radar center marker */}
          <Marker position={RADAR_CENTER} icon={radarCenterIcon} />

          {/* Radar range rings */}
          {layers.radarRanges && RADAR_RANGES.map((range) => (
            <Circle
              key={range.label}
              center={RADAR_CENTER}
              radius={range.radius}
              pathOptions={{
                fillColor: range.color,
                fillOpacity: 0.03,
                color: range.color,
                weight: 1,
                opacity: 0.5,
                dashArray: range.dash,
              }}
            />
          ))}

          {/* Weather overlay */}
          {weatherEnabled && (
            <WeatherOverlay
              gridPoints={gridPoints}
              showWindArrows={layers.windArrows}
              showWeather={layers.weather}
            />
          )}

          {/* Disaster markers */}
          {disastersEnabled && (
            <DisasterMarkers
              earthquakes={earthquakes}
              naturalEvents={naturalEvents}
              showEarthquakes={layers.earthquakes}
              showNaturalEvents={layers.naturalEvents}
            />
          )}

          {/* Conflict zones + convergence */}
          {(intelligenceEnabled || convergenceEnabled) && (
            <ConflictZones
              events={intelligenceEnabled ? gdeltEvents : []}
              convergenceZones={convergenceEnabled ? convergenceZones : []}
              showConflicts={layers.conflictZones}
              showConvergence={layers.convergenceZones}
            />
          )}

          {/* World military base markers (viewport-culled) */}
          <MilitaryBasesLayer visible={layers.militaryBases} />

          {/* Aircraft markers */}
          {aircraft.map((ac) => (
            <AircraftMarker key={ac.id} ac={ac} isSelected={selectedAircraft === ac.id} onSelect={handleSelect} />
          ))}

          {/* Active missiles */}
          {layers.missilePaths && activeMissiles.map((missile) => (
            <MissileTrack key={missile.id} missile={missile} />
          ))}

          {/* Explosions */}
          {explosions.map((explosion) => (
            <ExplosionMarker key={explosion.id} explosion={explosion} />
          ))}
        </MapContainer>

        {/* Layer Control Panel */}
        <LayerControl
          layers={layers}
          onToggle={handleLayerToggle}
          weatherEnabled={weatherEnabled}
          disastersEnabled={disastersEnabled}
          intelligenceEnabled={intelligenceEnabled}
          convergenceEnabled={convergenceEnabled}
        />

        {/* Weather Status Badge */}
        {weatherEnabled && weatherData && (
          <div className="absolute top-4 left-[280px] z-[1000]">
            <Card className="bg-gray-900/90 border-gray-700">
              <CardContent className="p-2 flex items-center gap-2 text-xs">
                <span className="text-cyan-400">{weatherData.weatherDescription}</span>
                <span className="text-gray-400">|</span>
                <span className="text-gray-300">{weatherData.temperature}°C</span>
                <span className="text-gray-400">|</span>
                <span className="text-blue-400">Wind {Math.round(weatherData.windSpeed)} km/h</span>
                <span className="text-gray-400">|</span>
                <span className={`font-mono ${
                  weatherData.operationalImpact.radarEffectiveness >= 80 ? "text-green-400" :
                  weatherData.operationalImpact.radarEffectiveness >= 60 ? "text-yellow-400" : "text-red-400"
                }`}>
                  Radar {weatherData.operationalImpact.radarEffectiveness}%
                </span>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Status Panel */}
        <Card className="absolute bottom-4 left-4 z-[1000] bg-gray-900/90 border-gray-700 w-56">
          <CardContent className="p-3">
            <div className="text-xs text-gray-400 mb-2 font-medium">SYSTEM STATUS</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Radar Uptime:</span>
                <span className="text-green-400 font-mono">{systemStatus.radarUptime.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">System Ready:</span>
                <span className="text-green-400 font-mono">{systemStatus.systemReadiness.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Missiles Ready:</span>
                <span className="text-yellow-400 font-mono">{systemStatus.missileReady}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Threat Level:</span>
                <span className={`font-mono font-bold ${
                  systemStatus.threatLevel === "HIGH" ? "text-red-400" :
                  systemStatus.threatLevel === "MEDIUM" ? "text-yellow-400" : "text-green-400"
                }`}>{systemStatus.threatLevel}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Priority Queue */}
        {engagementQueue && engagementQueue.length > 0 && (
          <Card className="absolute bottom-4 right-4 z-[1000] bg-gray-900/90 border-purple-700 w-56">
            <CardContent className="p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <Brain className="h-3.5 w-3.5 text-purple-400" />
                <span className="text-xs text-purple-300 font-medium">AI PRIORITY QUEUE</span>
              </div>
              <div className="space-y-1.5">
                {engagementQueue.slice(0, 4).map((target, i) => {
                  const tl = target.aircraft.threatLevel;
                  const threatColor =
                    tl === "HOSTILE" ? "#ef4444" :
                    tl === "SUSPECT" ? "#f59e0b" :
                    tl === "NEUTRAL" ? "#3b82f6" : "#10b981";
                  return (
                    <div key={target.aircraft.id} className="flex items-center gap-2 text-xs">
                      <span className="text-gray-500 font-mono w-4">#{i + 1}</span>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: threatColor }} />
                      <div className="flex-1 min-w-0">
                        <div className="text-gray-200 truncate">{target.aircraft.callsign}</div>
                        <div className="text-[9px] text-gray-500 truncate">{target.aircraft.model}</div>
                      </div>
                      <span className="text-purple-400 font-mono shrink-0">{target.engagementScore.toFixed(0)}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Legend */}
        <Card className="absolute top-4 left-4 z-[1000] bg-gray-900/90 border-gray-700">
          <CardContent className="p-3">
            <div className="text-xs text-gray-400 mb-2 font-medium">THREAT CLASSIFICATION</div>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-gray-300">Friendly</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-gray-300">Neutral</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="text-gray-300">Suspect</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                <span className="text-gray-300">Hostile</span>
              </div>
            </div>
            <div className="text-xs text-gray-400 mt-3 mb-2 font-medium">AIRCRAFT TYPES</div>
            <div className="space-y-1.5 text-xs">
              {Object.entries(AIRCRAFT_CONFIG).filter(([k]) => k !== "Unknown").map(([type, cfg]) => (
                <div key={type} className="flex items-center gap-2">
                  <svg width="16" height="16" viewBox={cfg.viewBox} className="shrink-0">
                    <path d={cfg.fuselage} fill="#94a3b8" stroke="rgba(255,255,255,0.5)" strokeWidth="0.5" strokeLinejoin="round"/>
                    <path d={cfg.wings} fill="#94a3b8" stroke="rgba(255,255,255,0.4)" strokeWidth="0.3" strokeLinejoin="round"/>
                    <path d={cfg.tail} fill="#94a3b8" stroke="rgba(255,255,255,0.4)" strokeWidth="0.3" strokeLinejoin="round" opacity={0.9}/>
                  </svg>
                  <span className="text-gray-300">{type}</span>
                  <span className="text-gray-500 ml-auto font-mono">{cfg.label}</span>
                </div>
              ))}
            </div>
            <div className="text-xs text-gray-400 mt-3 mb-2 font-medium">RANGE RINGS</div>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-green-400" />
                <span className="text-gray-300">50km / 100km</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-yellow-400" />
                <span className="text-gray-300">150km / 200km</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-red-400" />
                <span className="text-gray-300">300km</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Map2D;
