import React from "react";
import { Circle, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import type { Earthquake } from "../../lib/stores/useDisasters";
import type { NaturalEvent } from "../../lib/stores/useDisasters";

interface DisasterMarkersProps {
  earthquakes: Earthquake[];
  naturalEvents: NaturalEvent[];
  showEarthquakes: boolean;
  showNaturalEvents: boolean;
}

// Earthquake icon based on magnitude
function createEarthquakeIcon(eq: Earthquake): L.DivIcon {
  const mag = typeof eq.magnitude === "number" ? eq.magnitude : 0;
  const size = Math.max(16, mag * 5);
  const color = mag >= 7 ? "#dc2626" : mag >= 6 ? "#f97316" : mag >= 5 ? "#eab308" : "#a3a3a3";

  const html = `<div style="
    width:${size}px;height:${size}px;border-radius:50%;
    background:radial-gradient(circle, ${color}80, ${color}20);
    border:2px solid ${color};
    display:flex;align-items:center;justify-content:center;
    font-size:9px;font-weight:bold;color:${color};
    font-family:monospace;
    animation:pulse-ring 2s infinite;
  ">${mag.toFixed(1)}</div>`;

  return L.divIcon({
    className: "earthquake-icon",
    html,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

// Natural event icon based on category
function createEventIcon(event: NaturalEvent): L.DivIcon {
  const category = event.category.toLowerCase();
  let emoji = "🌍";
  let color = "#f59e0b";

  if (category.includes("wildfire") || category.includes("fire")) {
    emoji = "🔥";
    color = "#ef4444";
  } else if (category.includes("storm") || category.includes("cyclone") || category.includes("hurricane")) {
    emoji = "🌀";
    color = "#6366f1";
  } else if (category.includes("volcano")) {
    emoji = "🌋";
    color = "#dc2626";
  } else if (category.includes("flood")) {
    emoji = "🌊";
    color = "#3b82f6";
  } else if (category.includes("ice") || category.includes("snow")) {
    emoji = "❄️";
    color = "#67e8f9";
  }

  const html = `<div style="
    width:28px;height:28px;border-radius:50%;
    background:${color}30;
    border:2px solid ${color};
    display:flex;align-items:center;justify-content:center;
    font-size:14px;
  ">${emoji}</div>`;

  return L.divIcon({
    className: "event-icon",
    html,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

const DisasterMarkers: React.FC<DisasterMarkersProps> = ({
  earthquakes,
  naturalEvents,
  showEarthquakes,
  showNaturalEvents,
}) => {
  return (
    <>
      {/* Earthquake markers */}
      {showEarthquakes &&
        earthquakes.map((eq) => (
          <React.Fragment key={eq.id}>
            <Marker position={[eq.lat, eq.lng]} icon={createEarthquakeIcon(eq)}>
              <Popup autoClose={true} closeOnClick={true}>
                <div style={{ fontSize: 12, color: "#fff", minWidth: 160 }}>
                  <div style={{ fontWeight: "bold", color: "#ef4444", marginBottom: 4 }}>
                    Earthquake M{(eq.magnitude ?? 0).toFixed(1)}
                  </div>
                  <div>{eq.place}</div>
                  <div style={{ color: "#aaa", marginTop: 4 }}>
                    Depth: {(eq.depth ?? 0).toFixed(1)} km
                  </div>
                  <div style={{ color: "#aaa" }}>
                    {new Date(eq.time).toLocaleDateString()}
                  </div>
                  {eq.tsunami && (
                    <div style={{ color: "#f59e0b", fontWeight: "bold", marginTop: 4 }}>
                      Tsunami Warning
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
            {/* Magnitude-based impact radius */}
            <Circle
              center={[eq.lat, eq.lng]}
              radius={Math.pow(2, eq.magnitude ?? 0) * 200}
              pathOptions={{
                color: (eq.magnitude ?? 0) >= 6 ? "#ef4444" : "#f59e0b",
                weight: 1,
                opacity: 0.4,
                fillOpacity: 0.08,
                dashArray: "4 4",
              }}
            />
          </React.Fragment>
        ))}

      {/* Natural event markers */}
      {showNaturalEvents &&
        naturalEvents.map((event) => (
          <Marker key={event.id} position={[event.lat, event.lng]} icon={createEventIcon(event)}>
            <Popup autoClose={true} closeOnClick={true}>
              <div style={{ fontSize: 12, color: "#fff", minWidth: 160 }}>
                <div style={{ fontWeight: "bold", color: "#f59e0b", marginBottom: 4 }}>
                  {event.category}
                </div>
                <div>{event.title}</div>
                <div style={{ color: "#aaa", marginTop: 4 }}>
                  Source: {event.source}
                </div>
                <div style={{ color: "#aaa" }}>
                  {new Date(event.date).toLocaleDateString()}
                </div>
                {event.magnitudeValue && (
                  <div style={{ color: "#aaa" }}>
                    Magnitude: {event.magnitudeValue} {event.magnitudeUnit}
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
    </>
  );
};

export default React.memo(DisasterMarkers);
