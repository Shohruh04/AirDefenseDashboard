import React from "react";
import { Circle, Marker, Popup, Rectangle, Polygon } from "react-leaflet";
import L from "leaflet";
import type { GdeltEvent } from "../../lib/stores/useIntelligence";
import type { ConvergenceZone } from "../../lib/stores/useConvergence";
import { CONFLICT_ZONES, type ConflictZone as ConflictZoneData } from "@shared/conflictZones";

interface ConflictZonesProps {
  events: GdeltEvent[];
  convergenceZones: ConvergenceZone[];
  showConflicts: boolean;
  showConvergence: boolean;
}

// Conflict event category colors
function getCategoryColor(category: string): string {
  switch (category) {
    case "Armed Conflict": return "#dc2626";
    case "Political Crisis": return "#f97316";
    case "Tensions": return "#eab308";
    case "Protest/Unrest": return "#a855f7";
    case "Security Incident": return "#ef4444";
    case "Cooperation": return "#22c55e";
    default: return "#6b7280";
  }
}

function createConflictIcon(event: GdeltEvent): L.DivIcon {
  const color = getCategoryColor(event.category);
  const html = `<div style="
    width:10px;height:10px;border-radius:50%;
    background:${color};
    border:2px solid ${color}80;
    box-shadow:0 0 6px ${color}60;
  "></div>`;

  return L.divIcon({
    className: "conflict-icon",
    html,
    iconSize: [10, 10],
    iconAnchor: [5, 5],
  });
}

// Convergence zone severity colors
function getConvergenceSeverityColor(severity: number): string {
  if (severity >= 70) return "#dc2626";
  if (severity >= 50) return "#f97316";
  if (severity >= 30) return "#eab308";
  return "#6366f1";
}

// Intensity colors for conflict zone polygons
function getIntensityColor(intensity: string): string {
  switch (intensity) {
    case 'high': return '#ef4444';
    case 'medium': return '#f97316';
    case 'low': return '#eab308';
    default: return '#ef4444';
  }
}

const ConflictZones: React.FC<ConflictZonesProps> = ({
  events,
  convergenceZones,
  showConflicts,
  showConvergence,
}) => {
  return (
    <>
      {/* Active conflict zone polygons */}
      {showConflicts && CONFLICT_ZONES.map((zone) => {
        const color = getIntensityColor(zone.intensity);
        // Convert [lng, lat] to [lat, lng] for Leaflet
        const positions: [number, number][] = zone.coords.map(([lng, lat]) => [lat, lng]);
        const center: [number, number] = [zone.center[1], zone.center[0]];

        return (
          <React.Fragment key={zone.id}>
            <Polygon
              positions={positions}
              pathOptions={{
                color,
                weight: 2,
                opacity: 0.8,
                fillColor: color,
                fillOpacity: 0.12,
                dashArray: zone.intensity === 'high' ? undefined : '8 4',
              }}
            >
              <Popup maxWidth={320} autoClose={true} closeOnClick={true}>
                <div style={{ fontSize: 12, minWidth: 250 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid #ddd' }}>
                    <span style={{ fontWeight: 'bold', fontSize: 15 }}>{zone.name}</span>
                    <span style={{
                      fontSize: 10, fontWeight: 'bold', padding: '2px 8px', borderRadius: 4,
                      background: color + '20', color, textTransform: 'uppercase',
                    }}>{zone.intensity}</span>
                  </div>
                  <div style={{ display: 'grid', gap: 4, marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#888' }}>Started:</span>
                      <span style={{ fontWeight: 500 }}>{zone.startDate}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#888' }}>Casualties:</span>
                      <span style={{ color: '#dc2626', fontWeight: 500 }}>{zone.casualties}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#888' }}>Displaced:</span>
                      <span style={{ color: '#f97316', fontWeight: 500 }}>{zone.displaced}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#888' }}>Location:</span>
                      <span>{zone.location}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: '#555', marginBottom: 8, lineHeight: 1.4 }}>{zone.description}</div>
                  <div style={{ marginBottom: 6 }}>
                    <div style={{ fontSize: 10, color: '#888', fontWeight: 'bold', marginBottom: 4 }}>BELLIGERENTS</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {zone.parties.map(p => (
                        <span key={p} style={{ fontSize: 10, padding: '1px 6px', borderRadius: 3, background: '#f3f4f6', color: '#374151' }}>{p}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: '#888', fontWeight: 'bold', marginBottom: 4 }}>KEY DEVELOPMENTS</div>
                    <ul style={{ margin: 0, paddingLeft: 16, fontSize: 11, color: '#555' }}>
                      {zone.keyDevelopments.map(d => <li key={d}>{d}</li>)}
                    </ul>
                  </div>
                </div>
              </Popup>
            </Polygon>
            {/* Pulsing center marker for high-intensity zones */}
            {zone.intensity === 'high' && (
              <Circle
                center={center}
                radius={30000}
                pathOptions={{
                  color,
                  weight: 1.5,
                  opacity: 0.5,
                  fillColor: color,
                  fillOpacity: 0.08,
                }}
              />
            )}
          </React.Fragment>
        );
      })}

      {/* GDELT conflict event markers */}
      {showConflicts &&
        events.map((event) => (
          <React.Fragment key={event.id}>
            <Marker
              position={[event.lat, event.lng]}
              icon={createConflictIcon(event)}
            >
              <Popup autoClose={true} closeOnClick={true}>
                <div style={{ fontSize: 12, minWidth: 180, maxWidth: 250 }}>
                  <div style={{ fontWeight: "bold", color: getCategoryColor(event.category), marginBottom: 4 }}>
                    {event.category}
                  </div>
                  <div style={{ marginBottom: 4, lineHeight: 1.3 }}>
                    {event.title.length > 120 ? event.title.substring(0, 120) + "..." : event.title}
                  </div>
                  <div style={{ color: "#aaa", fontSize: 10 }}>
                    Tone: {event.tone.toFixed(1)} | Goldstein: {event.goldsteinScale.toFixed(1)}
                  </div>
                  <div style={{ color: "#aaa", fontSize: 10 }}>
                    {event.domain}
                  </div>
                </div>
              </Popup>
            </Marker>
            {/* Small impact ring for negative events */}
            {event.goldsteinScale < -3 && (
              <Circle
                center={[event.lat, event.lng]}
                radius={20000}
                pathOptions={{
                  color: getCategoryColor(event.category),
                  weight: 1,
                  opacity: 0.3,
                  fillOpacity: 0.05,
                }}
              />
            )}
          </React.Fragment>
        ))}

      {/* Convergence zone rectangles */}
      {showConvergence &&
        convergenceZones.map((zone) => {
          const color = getConvergenceSeverityColor(zone.severity);
          const gridSize = 1; // 1 degree
          const bounds: [[number, number], [number, number]] = [
            [zone.cellLat - gridSize / 2, zone.cellLng - gridSize / 2],
            [zone.cellLat + gridSize / 2, zone.cellLng + gridSize / 2],
          ];

          return (
            <React.Fragment key={zone.id}>
              <Rectangle
                bounds={bounds}
                pathOptions={{
                  color,
                  weight: 2,
                  opacity: 0.7,
                  fillColor: color,
                  fillOpacity: 0.15,
                  dashArray: "6 4",
                }}
              >
                <Popup autoClose={true} closeOnClick={true}>
                  <div style={{ fontSize: 12, minWidth: 180 }}>
                    <div style={{ fontWeight: "bold", color, marginBottom: 4 }}>
                      CONVERGENCE ZONE
                    </div>
                    <div>Severity: {zone.severity}/100</div>
                    <div style={{ marginTop: 4 }}>
                      Event types:
                      <ul style={{ margin: "4px 0", paddingLeft: 16 }}>
                        {zone.eventTypes.map((t) => (
                          <li key={t} style={{ color: "#aaa" }}>
                            {t.replace(/_/g, " ")}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div style={{ color: "#aaa", fontSize: 10 }}>
                      {zone.events.length} events detected
                    </div>
                  </div>
                </Popup>
              </Rectangle>
              {/* Pulsing center marker for high severity */}
              {zone.severity >= 50 && (
                <Circle
                  center={[zone.cellLat, zone.cellLng]}
                  radius={15000}
                  pathOptions={{
                    color,
                    weight: 2,
                    opacity: 0.8,
                    fillColor: color,
                    fillOpacity: 0.2,
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
    </>
  );
};

export default React.memo(ConflictZones);
