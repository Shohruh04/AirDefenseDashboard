import React, { useMemo } from "react";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Download, FileText } from "lucide-react";
import { useSimulation } from "../../lib/stores/useSimulation";
import { exportToCSV, exportAnalyticsToPDF } from "../../lib/exportUtils";

const Analytics: React.FC = () => {
  const { analytics, aircraft } = useSimulation();

  // Transform data for recharts
  const detectionData = useMemo(
    () => analytics.detectionsPerMinute.map((value, i) => ({ time: `${i + 1}m`, value })),
    [analytics.detectionsPerMinute]
  );

  const altitudeData = useMemo(
    () => analytics.altitudeDistribution.map((item) => ({
      altitude: `${item.altitude}m`,
      count: item.count,
    })),
    [analytics.altitudeDistribution]
  );

  const systemLoadData = useMemo(
    () => analytics.systemLoad.map((value, i) => ({ time: `${i + 1}m`, value })),
    [analytics.systemLoad]
  );

  const avgAltitude = useMemo(
    () => aircraft.length > 0 ? Math.round(aircraft.reduce((sum, ac) => sum + ac.position.altitude, 0) / aircraft.length) : 0,
    [aircraft]
  );

  const avgSpeed = useMemo(
    () => aircraft.length > 0 ? Math.round(aircraft.reduce((sum, ac) => sum + ac.speed, 0) / aircraft.length) : 0,
    [aircraft]
  );

  const typeDistribution = useMemo(() => {
    const types = ["Commercial", "Military", "Private", "Drone", "Unknown"] as const;
    return types.map((type) => {
      const count = aircraft.filter((ac) => ac.type === type).length;
      const percentage = aircraft.length > 0 ? (count / aircraft.length) * 100 : 0;
      return { type, count, percentage };
    });
  }, [aircraft]);

  const handleExportCSV = () => {
    const exportData = [
      ...analytics.detectionsPerMinute.map((value, index) => ({
        Metric: "Detections per Minute",
        TimePoint: `${index + 1}m`,
        Value: value,
      })),
      ...analytics.systemLoad.map((value, index) => ({
        Metric: "System Load %",
        TimePoint: `${index + 1}m`,
        Value: value,
      })),
      ...analytics.altitudeDistribution.map((item) => ({
        Metric: "Altitude Distribution",
        Altitude: item.altitude,
        Count: item.count,
      })),
    ];
    exportToCSV(exportData, "air_defense_analytics");
  };

  const handleExportPDF = () => {
    exportAnalyticsToPDF({
      detectionsPerMinute: analytics.detectionsPerMinute,
      altitudeDistribution: analytics.altitudeDistribution,
      systemLoad: analytics.systemLoad,
      aircraft,
    });
  };

  return (
    <div className="w-full h-full p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Analytics Dashboard</h2>
            <p className="text-muted-foreground">Performance metrics and tracking statistics</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportCSV} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportPDF} className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Export PDF
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {analytics.detectionsPerMinute[analytics.detectionsPerMinute.length - 1]}
                </div>
                <p className="text-sm text-muted-foreground">Current Detections/min</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{avgAltitude}m</div>
                <p className="text-sm text-muted-foreground">Avg Altitude</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {analytics.systemLoad[analytics.systemLoad.length - 1]}%
                </div>
                <p className="text-sm text-muted-foreground">System Load</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{avgSpeed}</div>
                <p className="text-sm text-muted-foreground">Avg Speed (km/h)</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Aircraft Detections per Minute</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={detectionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }}
                    />
                    <Area type="monotone" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Altitude Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={altitudeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="altitude" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }}
                    />
                    <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>System Load Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={systemLoadData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }}
                    />
                    <Line type="monotone" dataKey="value" stroke="#f59e0b" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Analytics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Aircraft Type Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {typeDistribution.map(({ type, count, percentage }) => (
                  <div key={type} className="flex justify-between items-center">
                    <span className="text-sm">{type}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-muted rounded-full">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${percentage}%` }} />
                      </div>
                      <span className="text-sm font-mono w-8">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm">Processing Rate</span>
                  <span className="font-mono">2.1 kHz</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Response Time</span>
                  <span className="font-mono">12ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Detection Range</span>
                  <span className="font-mono">300km</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Track Accuracy</span>
                  <span className="font-mono">98.7%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">False Alarm Rate</span>
                  <span className="font-mono">0.03%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
