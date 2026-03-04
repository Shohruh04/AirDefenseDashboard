import React, { useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import {
  Globe,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Target,
  Shield,
  Activity,
  Clock,
  Cloud,
  Zap,
} from "lucide-react";
import { useIntelligence } from "../../lib/stores/useIntelligence";
import { useDisasters } from "../../lib/stores/useDisasters";
import { useWeather } from "../../lib/stores/useWeather";
import { useConvergence } from "../../lib/stores/useConvergence";
import { useSettings } from "../../lib/stores/useSettings";
import { getCountryConfig } from "@shared/countryConfigs";

const Intelligence: React.FC = () => {
  const { events, riskScore, riskHistory, fetchEvents, fetchRiskScore } = useIntelligence();
  const { earthquakes, naturalEvents } = useDisasters();
  const { current: weather } = useWeather();
  const { zones: convergenceZones } = useConvergence();
  const { country } = useSettings();
  const countryConfig = useMemo(() => getCountryConfig(country), [country]);

  useEffect(() => {
    fetchEvents();
    fetchRiskScore(countryConfig.radarCenter.lat, countryConfig.radarCenter.lng, {
      disasterCount: earthquakes.length + naturalEvents.length,
    });
  }, [country]);

  const riskLevel = riskScore?.level || "LOW";
  const riskColor =
    riskLevel === "CRITICAL" ? "text-red-500" :
    riskLevel === "HIGH" ? "text-orange-500" :
    riskLevel === "MEDIUM" ? "text-yellow-500" : "text-green-500";

  const riskBgColor =
    riskLevel === "CRITICAL" ? "bg-red-500" :
    riskLevel === "HIGH" ? "bg-orange-500" :
    riskLevel === "MEDIUM" ? "bg-yellow-500" : "bg-green-500";

  // Categorize events
  const eventsByCategory = useMemo(() => {
    const cats: Record<string, number> = {};
    events.forEach((e) => {
      cats[e.category] = (cats[e.category] || 0) + 1;
    });
    return Object.entries(cats).sort((a, b) => b[1] - a[1]);
  }, [events]);

  return (
    <div className="w-full h-full p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Threat Intelligence Dashboard
          </h2>
          <p className="text-muted-foreground">
            Multi-source intelligence analysis powered by GDELT, USGS, NASA EONET, and convergence detection
          </p>
        </div>

        {/* Risk Score + Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Regional Risk Score */}
          <Card className="border-2" style={{ borderColor: riskLevel === "CRITICAL" ? "#dc2626" : riskLevel === "HIGH" ? "#f97316" : riskLevel === "MEDIUM" ? "#eab308" : "#22c55e" }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Regional Risk</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${riskColor}`}>
                {riskScore?.riskScore ?? 0}
                <span className="text-sm font-normal text-muted-foreground">/100</span>
              </div>
              <Badge className={`mt-2 ${riskBgColor} text-white`}>{riskLevel}</Badge>
              <Progress value={riskScore?.riskScore ?? 0} className="mt-2" />
            </CardContent>
          </Card>

          {/* GDELT Events */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Intel Events</CardTitle>
              <Globe className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{events.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                GDELT events in last 7 days
              </p>
              {riskScore && (
                <div className="text-xs text-muted-foreground mt-1">
                  Avg tone: <span className={riskScore.avgTone < -3 ? "text-red-400" : "text-green-400"}>
                    {riskScore.avgTone.toFixed(1)}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Disasters */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Disasters</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {earthquakes.length + naturalEvents.length}
              </div>
              <div className="flex gap-2 mt-1">
                <span className="text-xs text-muted-foreground">{earthquakes.length} earthquakes</span>
                <span className="text-xs text-muted-foreground">{naturalEvents.length} events</span>
              </div>
            </CardContent>
          </Card>

          {/* Convergence Zones */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Convergence</CardTitle>
              <Target className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{convergenceZones.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Active convergence zones
              </p>
              {convergenceZones.length > 0 && (
                <div className="text-xs text-muted-foreground mt-1">
                  Max severity: <span className="text-red-400">
                    {Math.max(...convergenceZones.map(z => z.severity))}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Risk Score Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-500" />
                Risk Score Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              {riskScore?.breakdown ? (
                <div className="space-y-4">
                  <RiskBar label="Geopolitical" value={riskScore.breakdown.geopolitical} color="bg-purple-500" />
                  <RiskBar label="Military Activity" value={riskScore.breakdown.military} color="bg-blue-500" />
                  <RiskBar label="Natural Disasters" value={riskScore.breakdown.disaster} color="bg-orange-500" />
                  <RiskBar label="Anomalous Flights" value={riskScore.breakdown.anomaly} color="bg-red-500" />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Loading risk data...</p>
              )}
            </CardContent>
          </Card>

          {/* Event Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-purple-500" />
                Event Categories
              </CardTitle>
            </CardHeader>
            <CardContent>
              {eventsByCategory.length > 0 ? (
                <div className="space-y-3">
                  {eventsByCategory.slice(0, 6).map(([category, count]) => (
                    <div key={category} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          category === "Armed Conflict" ? "bg-red-500" :
                          category === "Political Crisis" ? "bg-orange-500" :
                          category === "Tensions" ? "bg-yellow-500" :
                          category === "Protest/Unrest" ? "bg-purple-500" :
                          category === "Cooperation" ? "bg-green-500" : "bg-gray-500"
                        }`} />
                        <span className="text-sm">{category}</span>
                      </div>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No events loaded</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Risk History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                Risk Score History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {riskHistory.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-end gap-1 h-24">
                    {riskHistory.slice(-20).map((entry, i) => {
                      const height = Math.max(4, (entry.score / 100) * 96);
                      const color =
                        entry.score >= 70 ? "bg-red-500" :
                        entry.score >= 50 ? "bg-orange-500" :
                        entry.score >= 30 ? "bg-yellow-500" : "bg-green-500";
                      return (
                        <div
                          key={i}
                          className={`flex-1 ${color} rounded-t opacity-80 hover:opacity-100 transition-opacity`}
                          style={{ height: `${height}%` }}
                          title={`Score: ${entry.score} (${entry.level})`}
                        />
                      );
                    })}
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Older</span>
                    <span>Recent</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Risk history will appear as data accumulates
                </p>
              )}
            </CardContent>
          </Card>

          {/* Weather Impact */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cloud className="h-5 w-5 text-cyan-500" />
                Weather Impact on Operations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {weather ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Conditions</span>
                    <span className="text-sm font-medium">{weather.weatherDescription}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Radar Effectiveness</span>
                    <span className={`text-sm font-bold ${
                      weather.operationalImpact.radarEffectiveness >= 80 ? "text-green-500" :
                      weather.operationalImpact.radarEffectiveness >= 60 ? "text-yellow-500" : "text-red-500"
                    }`}>
                      {weather.operationalImpact.radarEffectiveness}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Flight Conditions</span>
                    <Badge variant={
                      weather.operationalImpact.flightConditions === "Optimal" ? "secondary" :
                      weather.operationalImpact.flightConditions === "Fair" ? "outline" : "destructive"
                    }>
                      {weather.operationalImpact.flightConditions}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Missile Guidance</span>
                    <Badge variant={
                      weather.operationalImpact.missileGuidance === "Nominal" ? "secondary" : "destructive"
                    }>
                      {weather.operationalImpact.missileGuidance}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Visibility</span>
                    <span className="text-sm">{weather.operationalImpact.visibilityRating}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Wind</span>
                    <span className="text-sm">{Math.round(weather.windSpeed)} km/h @ {Math.round(weather.windDirection)}°</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Weather data loading...</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Convergence Zones Detail */}
        {convergenceZones.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-red-500" />
                Active Convergence Zones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {convergenceZones.slice(0, 5).map((zone) => (
                  <div key={zone.id} className="p-3 rounded-md bg-muted/50 border border-muted">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${
                          zone.severity >= 70 ? "bg-red-500 animate-pulse" :
                          zone.severity >= 50 ? "bg-orange-500" :
                          zone.severity >= 30 ? "bg-yellow-500" : "bg-blue-500"
                        }`} />
                        <span className="text-sm font-medium">
                          {zone.cellLat.toFixed(1)}°N, {zone.cellLng.toFixed(1)}°E
                        </span>
                      </div>
                      <Badge variant={zone.severity >= 50 ? "destructive" : "outline"}>
                        Severity: {zone.severity}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {zone.eventTypes.map((type) => (
                        <Badge key={type} variant="secondary" className="text-xs">
                          {type.replace(/_/g, " ")}
                        </Badge>
                      ))}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {zone.events.length} events | Last: {new Date(zone.lastUpdated).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Intelligence Events Feed */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Intelligence Event Feed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {events.length > 0 ? (
                events.slice(0, 10).map((event) => (
                  <div key={event.id} className="flex items-start gap-3 p-2 rounded-md bg-muted/50">
                    <div className="flex-shrink-0 mt-1">
                      <div className={`w-2 h-2 rounded-full ${
                        event.category === "Armed Conflict" ? "bg-red-500" :
                        event.category === "Political Crisis" ? "bg-orange-500" :
                        event.category === "Protest/Unrest" ? "bg-purple-500" :
                        event.category === "Cooperation" ? "bg-green-500" : "bg-gray-500"
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground line-clamp-2">
                        {event.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge variant="outline" className="text-xs">{event.category}</Badge>
                        <span className="text-xs text-muted-foreground">{event.domain}</span>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {event.lat.toFixed(1)}°, {event.lng.toFixed(1)}°
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className={`text-xs font-mono ${event.tone < -3 ? "text-red-400" : event.tone > 3 ? "text-green-400" : "text-gray-400"}`}>
                        {event.tone > 0 ? "+" : ""}{event.tone.toFixed(1)}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Loading intelligence feed...</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Risk bar component for breakdown visualization
const RiskBar: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
  <div>
    <div className="flex justify-between text-sm mb-1">
      <span>{label}</span>
      <span className="font-mono">{value}/100</span>
    </div>
    <div className="w-full bg-muted rounded-full h-2.5">
      <div
        className={`h-2.5 rounded-full ${color}`}
        style={{ width: `${Math.min(100, value)}%` }}
      />
    </div>
  </div>
);

export default Intelligence;
