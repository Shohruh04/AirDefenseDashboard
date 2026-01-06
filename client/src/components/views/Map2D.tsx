import React, { useEffect, useRef, useState } from "react";
import { useSimulation } from "../../lib/stores/useSimulation";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { getThreatLevelColor, getThreatLevelLabel } from "../../lib/simulation";
import { Play, Square, Radar, Crosshair, Plane, Zap } from "lucide-react";

declare global {
  interface Window {
    L: any;
  }
}

const Map2D: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const missileMarkersRef = useRef<any[]>([]);
  const radarZonesRef = useRef<any[]>([]);
  const radarSweepRef = useRef<any>(null);
  const animationRef = useRef<number | null>(null);

  const { aircraft, missiles, isRunning, startSimulation, stopSimulation, systemStatus } = useSimulation();
  const [selectedAircraft, setSelectedAircraft] = useState<string | null>(null);

  // Radar center coordinates
  const RADAR_CENTER: [number, number] = [50.0, 10.0];

  // Aircraft icon SVG generator
  const createAircraftIcon = (heading: number, color: string, type: string, isSelected: boolean) => {
    const size = isSelected ? 32 : 24;
    const rotation = heading - 90; // Adjust for SVG orientation

    let iconPath = '';
    if (type === 'Military') {
      // Fighter jet shape
      iconPath = 'M12 2 L8 8 L4 8 L4 10 L8 10 L10 14 L6 18 L8 18 L12 14 L16 18 L18 18 L14 14 L16 10 L20 10 L20 8 L16 8 Z';
    } else if (type === 'Commercial') {
      // Airliner shape
      iconPath = 'M12 2 L10 6 L4 8 L4 10 L10 9 L11 14 L6 18 L8 18 L12 15 L16 18 L18 18 L13 14 L14 9 L20 10 L20 8 L14 6 Z';
    } else {
      // Drone/Unknown shape
      iconPath = 'M12 4 L8 8 L2 8 L2 10 L8 10 L8 14 L4 18 L6 18 L12 12 L18 18 L20 18 L16 14 L16 10 L22 10 L22 8 L16 8 Z';
    }

    return `
      <svg width="${size}" height="${size}" viewBox="0 0 24 24"
           style="transform: rotate(${rotation}deg); filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));">
        <path d="${iconPath}" fill="${color}" stroke="#ffffff" stroke-width="1"/>
        ${isSelected ? `<circle cx="12" cy="12" r="14" fill="none" stroke="${color}" stroke-width="2" stroke-dasharray="4,4">
          <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="2s" repeatCount="indefinite"/>
        </circle>` : ''}
      </svg>
    `;
  };

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return;

    const L = window.L;
    if (!L) return;

    // Initialize map with dark theme
    const map = L.map(mapRef.current, {
      zoomControl: false,
    }).setView(RADAR_CENTER, 6);

    leafletMapRef.current = map;

    // Add zoom control to top right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Dark tile layer for tactical look
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap, © CARTO',
      maxZoom: 19,
    }).addTo(map);

    // Add radar center marker
    const radarIcon = L.divIcon({
      className: 'radar-center',
      html: `
        <div style="position: relative; width: 40px; height: 40px;">
          <div style="
            position: absolute;
            width: 40px; height: 40px;
            border: 3px solid #00ff88;
            border-radius: 50%;
            animation: pulse-ring 2s infinite;
          "></div>
          <div style="
            position: absolute;
            top: 50%; left: 50%;
            transform: translate(-50%, -50%);
            width: 16px; height: 16px;
            background: #00ff88;
            border-radius: 50%;
            box-shadow: 0 0 20px #00ff88;
          "></div>
          <div style="
            position: absolute;
            top: 50%; left: 50%;
            transform: translate(-50%, -50%);
            width: 8px; height: 8px;
            background: #ffffff;
            border-radius: 50%;
          "></div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });

    L.marker(RADAR_CENTER, { icon: radarIcon }).addTo(map);

    // Add radar coverage zones with better styling
    const ranges = [
      { radius: 50000, color: '#00ff88', label: '50km' },
      { radius: 100000, color: '#00ccff', label: '100km' },
      { radius: 150000, color: '#ffaa00', label: '150km' },
      { radius: 200000, color: '#ff6600', label: '200km' },
      { radius: 300000, color: '#ff3333', label: '300km' },
    ];

    ranges.forEach((range) => {
      const circle = L.circle(RADAR_CENTER, {
        radius: range.radius,
        fillColor: range.color,
        fillOpacity: 0.03,
        color: range.color,
        weight: 1,
        opacity: 0.5,
      }).addTo(map);
      radarZonesRef.current.push(circle);
    });

    // Add grid lines for tactical look
    for (let i = -5; i <= 5; i++) {
      // Horizontal lines
      L.polyline([[RADAR_CENTER[0] + i, RADAR_CENTER[1] - 8], [RADAR_CENTER[0] + i, RADAR_CENTER[1] + 8]], {
        color: '#00ff88',
        weight: 0.5,
        opacity: 0.15,
      }).addTo(map);
      // Vertical lines
      L.polyline([[RADAR_CENTER[0] - 5, RADAR_CENTER[1] + i * 1.5], [RADAR_CENTER[0] + 5, RADAR_CENTER[1] + i * 1.5]], {
        color: '#00ff88',
        weight: 0.5,
        opacity: 0.15,
      }).addTo(map);
    }

    // Add radar sweep line (animated)
    const sweepLine = L.polyline([[RADAR_CENTER[0], RADAR_CENTER[1]], [RADAR_CENTER[0] + 3, RADAR_CENTER[1]]], {
      color: '#00ff88',
      weight: 2,
      opacity: 0.8,
    }).addTo(map);
    radarSweepRef.current = sweepLine;

    // Animate radar sweep
    let sweepAngle = 0;
    const animateSweep = () => {
      sweepAngle += 0.02;
      const radius = 3;
      const endLat = RADAR_CENTER[0] + radius * Math.cos(sweepAngle);
      const endLng = RADAR_CENTER[1] + radius * Math.sin(sweepAngle) * 1.5;
      if (radarSweepRef.current) {
        radarSweepRef.current.setLatLngs([RADAR_CENTER, [endLat, endLng]]);
      }
      animationRef.current = requestAnimationFrame(animateSweep);
    };
    animateSweep();

    // Add CSS for animations
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse-ring {
        0% { transform: scale(0.8); opacity: 1; }
        100% { transform: scale(1.5); opacity: 0; }
      }
      @keyframes blink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.3; }
      }
      .threat-hostile { animation: blink 0.5s infinite; }
      .leaflet-popup-content-wrapper {
        background: rgba(20, 20, 30, 0.95);
        color: #ffffff;
        border: 1px solid #00ff88;
        border-radius: 8px;
      }
      .leaflet-popup-tip {
        background: rgba(20, 20, 30, 0.95);
        border: 1px solid #00ff88;
      }
      .leaflet-popup-content {
        margin: 12px;
      }
    `;
    document.head.appendChild(style);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  // Update aircraft markers
  useEffect(() => {
    if (!leafletMapRef.current) return;

    const L = window.L;
    const map = leafletMapRef.current;

    // Clear existing markers
    markersRef.current.forEach((marker) => map.removeLayer(marker));
    markersRef.current = [];

    // Add aircraft markers
    aircraft.forEach((ac) => {
      const color = getThreatLevelColor(ac.threatLevel);
      const isSelected = selectedAircraft === ac.id;

      // Create custom aircraft icon
      const icon = L.divIcon({
        className: `aircraft-marker ${ac.threatLevel === 'HOSTILE' ? 'threat-hostile' : ''}`,
        html: createAircraftIcon(ac.heading, color, ac.type, isSelected),
        iconSize: [isSelected ? 32 : 24, isSelected ? 32 : 24],
        iconAnchor: [isSelected ? 16 : 12, isSelected ? 16 : 12],
      });

      const marker = L.marker([ac.position.lat, ac.position.lng], { icon });

      // Popup content
      const popupContent = `
        <div style="min-width: 180px;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.2);">
            <div style="width: 12px; height: 12px; background: ${color}; border-radius: 50%;"></div>
            <span style="font-size: 16px; font-weight: bold; color: ${color};">${ac.callsign}</span>
          </div>
          <div style="display: grid; gap: 4px; font-size: 12px;">
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #888;">Type:</span>
              <span style="color: #fff;">${ac.type}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #888;">Threat:</span>
              <span style="color: ${color}; font-weight: bold;">${getThreatLevelLabel(ac.threatLevel)}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #888;">Altitude:</span>
              <span style="color: #00ff88;">${ac.position.altitude.toLocaleString()}m</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #888;">Speed:</span>
              <span style="color: #00ccff;">${ac.speed} km/h</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #888;">Heading:</span>
              <span style="color: #fff;">${ac.heading}°</span>
            </div>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.on('click', () => setSelectedAircraft(ac.id));
      marker.addTo(map);
      markersRef.current.push(marker);

      // Add flight path prediction (dashed line showing future path)
      const predictionDistance = ac.speed / 1000; // km based on speed
      const predPath = L.polyline([
        [ac.position.lat, ac.position.lng],
        [
          ac.position.lat + predictionDistance * Math.cos((ac.heading * Math.PI) / 180),
          ac.position.lng + predictionDistance * Math.sin((ac.heading * Math.PI) / 180) * 1.5,
        ],
      ], {
        color: color,
        weight: 1,
        opacity: 0.4,
        dashArray: '4, 8',
      }).addTo(map);
      markersRef.current.push(predPath);

      // Add altitude indicator ring for high-flying aircraft
      if (ac.position.altitude > 10000) {
        const altRing = L.circleMarker([ac.position.lat, ac.position.lng], {
          radius: 18,
          fillColor: 'transparent',
          color: color,
          weight: 1,
          opacity: 0.3,
          dashArray: '2, 4',
        }).addTo(map);
        markersRef.current.push(altRing);
      }
    });
  }, [aircraft, selectedAircraft]);

  // Update missile markers
  useEffect(() => {
    if (!leafletMapRef.current) return;

    const L = window.L;
    const map = leafletMapRef.current;

    // Clear existing missile markers
    missileMarkersRef.current.forEach((marker) => map.removeLayer(marker));
    missileMarkersRef.current = [];

    // Add active missiles
    missiles.filter((m) => m.active).forEach((missile) => {
      // Calculate rotation
      const dx = missile.targetPosition.lng - missile.currentPosition.lng;
      const dy = missile.targetPosition.lat - missile.currentPosition.lat;
      const rotation = Math.atan2(dx, dy) * (180 / Math.PI);

      // Missile trail
      const trail = L.polyline([
        [missile.startPosition.lat, missile.startPosition.lng],
        [missile.currentPosition.lat, missile.currentPosition.lng],
      ], {
        color: '#ff6600',
        weight: 3,
        opacity: 0.8,
      }).addTo(map);
      missileMarkersRef.current.push(trail);

      // Trajectory prediction
      const trajectory = L.polyline([
        [missile.currentPosition.lat, missile.currentPosition.lng],
        [missile.targetPosition.lat, missile.targetPosition.lng],
      ], {
        color: '#ff3333',
        weight: 1,
        opacity: 0.5,
        dashArray: '6, 6',
      }).addTo(map);
      missileMarkersRef.current.push(trajectory);

      // Missile icon
      const missileIcon = L.divIcon({
        className: 'missile-marker',
        html: `
          <svg width="20" height="20" viewBox="0 0 24 24" style="transform: rotate(${rotation}deg); filter: drop-shadow(0 0 6px #ff6600);">
            <path d="M12 2 L8 10 L10 10 L10 18 L8 18 L12 22 L16 18 L14 18 L14 10 L16 10 Z" fill="#ff6600" stroke="#ffffff" stroke-width="1"/>
            <circle cx="12" cy="6" r="2" fill="#ffff00"/>
          </svg>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      const missileMarker = L.marker([missile.currentPosition.lat, missile.currentPosition.lng], { icon: missileIcon });
      missileMarker.addTo(map);
      missileMarkersRef.current.push(missileMarker);

      // Target lock indicator
      const targetLock = L.circleMarker([missile.targetPosition.lat, missile.targetPosition.lng], {
        radius: 15,
        fillColor: 'transparent',
        color: '#ff3333',
        weight: 2,
        opacity: 0.8,
        dashArray: '4, 4',
      }).addTo(map);
      missileMarkersRef.current.push(targetLock);

      // Inner target
      const targetInner = L.circleMarker([missile.targetPosition.lat, missile.targetPosition.lng], {
        radius: 6,
        fillColor: '#ff3333',
        color: '#ff3333',
        weight: 1,
        opacity: 0.6,
        fillOpacity: 0.3,
      }).addTo(map);
      missileMarkersRef.current.push(targetInner);
    });
  }, [missiles]);

  return (
    <div className="w-full h-full flex flex-col bg-gray-900">
      {/* Header */}
      <div className="p-3 border-b border-gray-700 bg-gray-800/80">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Radar className="h-5 w-5 text-green-400" />
            <div>
              <h2 className="text-lg font-semibold text-white">Tactical Radar Display</h2>
              <p className="text-xs text-gray-400">Real-time air defense monitoring</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={isRunning ? "destructive" : "default"}
              size="sm"
              onClick={isRunning ? stopSimulation : startSimulation}
            >
              {isRunning ? <Square className="h-4 w-4 mr-1" /> : <Play className="h-4 w-4 mr-1" />}
              {isRunning ? "Stop" : "Start"}
            </Button>
            <Badge variant="outline" className="bg-green-900/50 text-green-400 border-green-700">
              <Plane className="h-3 w-3 mr-1" />
              {aircraft.length} Tracked
            </Badge>
            {missiles.filter((m) => m.active).length > 0 && (
              <Badge variant="destructive" className="bg-red-900/50 text-red-400 border-red-700">
                <Zap className="h-3 w-3 mr-1" />
                {missiles.filter((m) => m.active).length} Missiles
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative">
        <div ref={mapRef} className="absolute inset-0 z-10" />

        {/* Status Panel */}
        <Card className="absolute bottom-4 left-4 z-20 bg-gray-900/90 border-gray-700 w-56">
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
                  systemStatus.threatLevel === 'HIGH' ? 'text-red-400' :
                  systemStatus.threatLevel === 'MEDIUM' ? 'text-yellow-400' : 'text-green-400'
                }`}>{systemStatus.threatLevel}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Legend */}
        <Card className="absolute top-4 left-4 z-20 bg-gray-900/90 border-gray-700">
          <CardContent className="p-3">
            <div className="text-xs text-gray-400 mb-2 font-medium">THREAT CLASSIFICATION</div>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-gray-300">Friendly</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-gray-300">Neutral</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span className="text-gray-300">Suspect</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
                <span className="text-gray-300">Hostile</span>
              </div>
            </div>
            <div className="text-xs text-gray-400 mt-3 mb-2 font-medium">RANGE RINGS</div>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-green-400"></div>
                <span className="text-gray-300">50km / 100km</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-yellow-400"></div>
                <span className="text-gray-300">150km / 200km</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-red-400"></div>
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
