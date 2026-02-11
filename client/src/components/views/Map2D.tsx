import React, { useMemo, useCallback } from "react";
import { MapContainer, TileLayer, Circle, Polyline, Marker, Popup, useMap, LayersControl } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useSimulation } from "../../lib/stores/useSimulation";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { getThreatLevelColor, getThreatLevelLabel } from "../../lib/simulation";
import type { Aircraft, Missile, Explosion } from "../../lib/simulation";
import { Play, Square, Radar, Plane, Zap, Brain } from "lucide-react";

// Radar center coordinates
const RADAR_CENTER: [number, number] = [50.0, 10.0];

// Radar range ring definitions
const RADAR_RANGES = [
  { radius: 50000, color: "#00ff88", label: "50km", dash: "8 4" },
  { radius: 100000, color: "#00ccff", label: "100km", dash: "8 4" },
  { radius: 150000, color: "#ffaa00", label: "150km", dash: "12 6" },
  { radius: 200000, color: "#ff6600", label: "200km", dash: "12 6" },
  { radius: 300000, color: "#ff3333", label: "300km", dash: "16 8" },
];

// Create SVG aircraft icon based on type and threat level
function createAircraftDivIcon(ac: Aircraft, isSelected: boolean): L.DivIcon {
  const color = getThreatLevelColor(ac.threatLevel);
  const size = isSelected ? 32 : 24;
  const rotation = ac.heading - 90;

  let iconPath: string;
  switch (ac.type) {
    case "Military":
      iconPath = "M12 2 L8 8 L4 8 L4 10 L8 10 L10 14 L6 18 L8 18 L12 14 L16 18 L18 18 L14 14 L16 10 L20 10 L20 8 L16 8 Z";
      break;
    case "Commercial":
      iconPath = "M12 2 L10 6 L4 8 L4 10 L10 9 L11 14 L6 18 L8 18 L12 15 L16 18 L18 18 L13 14 L14 9 L20 10 L20 8 L14 6 Z";
      break;
    case "Drone":
      iconPath = "M12 6 L6 12 L12 18 L18 12 Z M8 8 L4 4 M16 8 L20 4 M8 16 L4 20 M16 16 L20 20";
      break;
    default:
      iconPath = "M12 4 L8 8 L2 8 L2 10 L8 10 L8 14 L4 18 L6 18 L12 12 L18 18 L20 18 L16 14 L16 10 L22 10 L22 8 L16 8 Z";
  }

  const selectionRing = isSelected
    ? `<circle cx="12" cy="12" r="14" fill="none" stroke="${color}" stroke-width="2" stroke-dasharray="4,4">
        <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="2s" repeatCount="indefinite"/>
      </circle>`
    : "";

  const hostile = ac.threatLevel === "HOSTILE" ? "animation:blink .5s infinite;" : "";

  const html = `<svg width="${size}" height="${size}" viewBox="0 0 24 24"
    style="transform:rotate(${rotation}deg);filter:drop-shadow(0 2px 4px rgba(0,0,0,.6));${hostile}">
    <path d="${iconPath}" fill="${color}" stroke="#fff" stroke-width="1"/>
    ${selectionRing}
  </svg>`;

  return L.divIcon({
    className: "aircraft-icon",
    html,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
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
    .aircraft-icon,.missile-icon,.radar-center-icon { background:none!important; border:none!important; }
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
  const icon = useMemo(() => createAircraftDivIcon(ac, isSelected), [ac.heading, ac.threatLevel, ac.type, isSelected]);
  const color = getThreatLevelColor(ac.threatLevel);
  const position: [number, number] = [ac.position.lat, ac.position.lng];

  // Flight path prediction line
  const predictionDistance = ac.speed / 1000;
  const headingRad = (ac.heading * Math.PI) / 180;
  const predEnd: [number, number] = [
    ac.position.lat + predictionDistance * Math.cos(headingRad),
    ac.position.lng + predictionDistance * Math.sin(headingRad) * 1.5,
  ];

  return (
    <>
      <Marker position={position} icon={icon} eventHandlers={{ click: () => onSelect(ac.id) }}>
        <Popup>
          <div style={{ minWidth: 200 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, paddingBottom: 8, borderBottom: "1px solid rgba(255,255,255,.2)" }}>
              <div style={{ width: 12, height: 12, background: color, borderRadius: "50%" }} />
              <span style={{ fontSize: 16, fontWeight: "bold", color }}>{ac.callsign}</span>
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

const Map2D: React.FC = () => {
  const { aircraft, missiles, isRunning, startSimulation, stopSimulation, systemStatus, engagementQueue, explosions } = useSimulation();
  const [selectedAircraft, setSelectedAircraft] = React.useState<string | null>(null);

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
          {RADAR_RANGES.map((range) => (
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

          {/* Aircraft markers */}
          {aircraft.map((ac) => (
            <AircraftMarker key={ac.id} ac={ac} isSelected={selectedAircraft === ac.id} onSelect={handleSelect} />
          ))}

          {/* Active missiles */}
          {activeMissiles.map((missile) => (
            <MissileTrack key={missile.id} missile={missile} />
          ))}

          {/* Explosions */}
          {explosions.map((explosion) => (
            <ExplosionMarker key={explosion.id} explosion={explosion} />
          ))}
        </MapContainer>

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
                      <span className="text-gray-200 flex-1 truncate">{target.aircraft.callsign}</span>
                      <span className="text-purple-400 font-mono">{target.engagementScore.toFixed(0)}</span>
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
            <div className="text-xs text-gray-400 mb-2 font-medium">AI THREAT CLASSIFICATION</div>
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
