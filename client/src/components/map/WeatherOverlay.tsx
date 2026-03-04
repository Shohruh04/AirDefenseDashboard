import React from "react";
import { Circle, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import type { WeatherGridPoint } from "../../lib/stores/useWeather";

interface WeatherOverlayProps {
  gridPoints: WeatherGridPoint[];
  showWindArrows: boolean;
  showWeather: boolean;
}

// Create a wind arrow icon rotated to wind direction
function createWindArrowIcon(point: WeatherGridPoint): L.DivIcon {
  const speed = point.windSpeed;
  const dir = point.windDirection;
  const size = Math.min(40, 16 + speed * 0.4);

  // Color based on wind speed (km/h)
  let color = "#4ade80"; // green: light wind
  if (speed > 50) color = "#ef4444"; // red: strong
  else if (speed > 30) color = "#f59e0b"; // yellow: moderate
  else if (speed > 15) color = "#3b82f6"; // blue: mild

  const html = `<svg width="${size}" height="${size}" viewBox="0 0 24 24"
    style="transform:rotate(${dir}deg);opacity:0.7;">
    <path d="M12 2 L8 14 L12 11 L16 14 Z" fill="${color}" stroke="rgba(255,255,255,0.5)" stroke-width="0.5"/>
    <text x="12" y="22" text-anchor="middle" fill="${color}" font-size="6" font-family="monospace">${Math.round(speed)}</text>
  </svg>`;

  return L.divIcon({
    className: "wind-arrow-icon",
    html,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

// Visibility circle color
function getVisibilityColor(visibility: number): string {
  if (visibility >= 10000) return "#22c55e"; // excellent
  if (visibility >= 5000) return "#3b82f6"; // good
  if (visibility >= 1000) return "#f59e0b"; // moderate
  return "#ef4444"; // poor
}

function getWeatherLabel(code: number): string {
  if (code === 0) return "Clear";
  if (code <= 3) return "Cloudy";
  if (code <= 48) return "Fog";
  if (code <= 57) return "Drizzle";
  if (code <= 67) return "Rain";
  if (code <= 77) return "Snow";
  if (code <= 82) return "Showers";
  if (code >= 95) return "Thunder";
  return "";
}

const WeatherOverlay: React.FC<WeatherOverlayProps> = ({ gridPoints, showWindArrows, showWeather }) => {
  if (gridPoints.length === 0) return null;

  return (
    <>
      {gridPoints.map((point, i) => (
        <React.Fragment key={`weather-${i}`}>
          {/* Visibility/cloud cover circle */}
          {showWeather && (
            <Circle
              center={[point.lat, point.lng]}
              radius={60000} // 60km radius per grid point
              pathOptions={{
                color: getVisibilityColor(point.visibility),
                weight: 1,
                opacity: 0.3,
                fillColor: getVisibilityColor(point.visibility),
                fillOpacity: Math.min(0.15, point.cloudCover / 500),
              }}
            />
          )}

          {/* Wind direction arrows */}
          {showWindArrows && point.windSpeed > 5 && (
            <Marker
              position={[point.lat, point.lng]}
              icon={createWindArrowIcon(point)}
            >
              <Popup>
                <div style={{ fontSize: 12, color: "#fff", minWidth: 120 }}>
                  <div style={{ fontWeight: "bold", marginBottom: 4 }}>
                    {getWeatherLabel(point.weatherCode)}
                  </div>
                  <div>Wind: {Math.round(point.windSpeed)} km/h</div>
                  <div>Direction: {Math.round(point.windDirection)}°</div>
                  <div>Cloud: {point.cloudCover}%</div>
                  <div>Visibility: {(point.visibility / 1000).toFixed(1)} km</div>
                  {point.precipitation > 0 && (
                    <div>Rain: {point.precipitation} mm</div>
                  )}
                </div>
              </Popup>
            </Marker>
          )}
        </React.Fragment>
      ))}
    </>
  );
};

export default React.memo(WeatherOverlay);
