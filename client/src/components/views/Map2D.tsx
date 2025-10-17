import React, { useEffect, useRef } from 'react';
import { useSimulation } from '../../lib/stores/useSimulation';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { getThreatLevelColor, getThreatLevelLabel } from '../../lib/simulation';

// Leaflet types
declare global {
  interface Window {
    L: any;
  }
}

const Map2D: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const radarZonesRef = useRef<any[]>([]);
  
  const { aircraft } = useSimulation();

  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return;

    const L = window.L;
    if (!L) return;

    // Initialize map
    const map = L.map(mapRef.current).setView([50.0, 10.0], 5);
    leafletMapRef.current = map;

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Add radar coverage zones
    const radarCenter = [50.0, 10.0];
    
    // Short range (50km)
    const shortRange = L.circle(radarCenter, {
      radius: 50000,
      fillColor: '#3b82f6',
      fillOpacity: 0.1,
      color: '#3b82f6',
      weight: 2,
      dashArray: '5, 5'
    }).addTo(map);
    
    // Medium range (150km)
    const mediumRange = L.circle(radarCenter, {
      radius: 150000,
      fillColor: '#f59e0b',
      fillOpacity: 0.1,
      color: '#f59e0b',
      weight: 2,
      dashArray: '5, 5'
    }).addTo(map);
    
    // Long range (300km)
    const longRange = L.circle(radarCenter, {
      radius: 300000,
      fillColor: '#ef4444',
      fillOpacity: 0.1,
      color: '#ef4444',
      weight: 2,
      dashArray: '5, 5'
    }).addTo(map);

    radarZonesRef.current = [shortRange, mediumRange, longRange];

    // Add radar coverage legend
    const radarLegend = L.control({ position: 'bottomright' });
    radarLegend.onAdd = function() {
      const div = L.DomUtil.create('div', 'info legend');
      div.style.background = 'rgba(255, 255, 255, 0.9)';
      div.style.padding = '10px';
      div.style.borderRadius = '5px';
      div.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
      div.innerHTML = `
        <h4 style="margin: 0 0 8px 0; font-weight: bold;">Radar Coverage</h4>
        <div style="margin: 4px 0;"><span style="color: #3b82f6;">●</span> Short Range (50km)</div>
        <div style="margin: 4px 0;"><span style="color: #f59e0b;">●</span> Medium Range (150km)</div>
        <div style="margin: 4px 0;"><span style="color: #ef4444;">●</span> Long Range (300km)</div>
      `;
      return div;
    };
    radarLegend.addTo(map);

    // Add threat level legend
    const threatLegend = L.control({ position: 'topleft' });
    threatLegend.onAdd = function() {
      const div = L.DomUtil.create('div', 'info legend');
      div.style.background = 'rgba(255, 255, 255, 0.9)';
      div.style.padding = '10px';
      div.style.borderRadius = '5px';
      div.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
      div.innerHTML = `
        <h4 style="margin: 0 0 8px 0; font-weight: bold;">Threat Levels</h4>
        <div style="margin: 4px 0;"><span style="color: #10b981;">●</span> Friendly</div>
        <div style="margin: 4px 0;"><span style="color: #3b82f6;">●</span> Neutral</div>
        <div style="margin: 4px 0;"><span style="color: #f59e0b;">●</span> Suspect</div>
        <div style="margin: 4px 0;"><span style="color: #ef4444;">●</span> Hostile</div>
      `;
      return div;
    };
    threatLegend.addTo(map);

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!leafletMapRef.current) return;

    const L = window.L;
    const map = leafletMapRef.current;

    // Clear existing aircraft markers
    markersRef.current.forEach(marker => map.removeLayer(marker));
    markersRef.current = [];

    // Add new aircraft markers
    aircraft.forEach(ac => {
      const iconColor = getThreatLevelColor(ac.threatLevel);
      
      const marker = L.circleMarker([ac.position.lat, ac.position.lng], {
        radius: 6,
        fillColor: iconColor,
        color: '#ffffff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8
      });

      const popupContent = `
        <div style="font-family: monospace;">
          <h4 style="margin: 0 0 8px 0; color: ${iconColor};">${ac.callsign}</h4>
          <div><strong>Type:</strong> ${ac.type}</div>
          <div><strong>Threat Level:</strong> <span style="color: ${iconColor}; font-weight: bold;">${getThreatLevelLabel(ac.threatLevel)}</span></div>
          <div><strong>Altitude:</strong> ${(ac.position?.altitude ?? 0).toLocaleString()}m</div>
          <div><strong>Speed:</strong> ${ac.speed} km/h</div>
          <div><strong>Heading:</strong> ${ac.heading}°</div>
          <div><strong>Position:</strong> ${ac.position.lat.toFixed(4)}°, ${ac.position.lng.toFixed(4)}°</div>
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.addTo(map);
      markersRef.current.push(marker);

      // Add heading indicator
      const headingLine = L.polyline([
        [ac.position.lat, ac.position.lng],
        [
          ac.position.lat + 0.5 * Math.cos(ac.heading * Math.PI / 180),
          ac.position.lng + 0.5 * Math.sin(ac.heading * Math.PI / 180)
        ]
      ], {
        color: iconColor,
        weight: 2,
        opacity: 0.7
      }).addTo(map);
      
      markersRef.current.push(headingLine);
    });
  }, [aircraft]);

  return (
    <div className="w-full h-full flex flex-col">
      <div className="p-4 border-b border-border">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">2D Map View</h2>
            <p className="text-sm text-muted-foreground">
              Real-time aircraft tracking with radar coverage zones
            </p>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline">
              {aircraft.length} Aircraft Tracked
            </Badge>
          </div>
        </div>
      </div>
      
      <div className="flex-1 relative">
        <div ref={mapRef} className="absolute inset-0 z-10" />
      </div>
    </div>
  );
};

export default Map2D;
