import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Download, FileText } from 'lucide-react';
import { useSimulation } from '../../lib/stores/useSimulation';
import { exportToCSV, exportAnalyticsToPDF } from '../../lib/exportUtils';

// Chart.js types
declare global {
  interface Window {
    Chart: any;
  }
}

const Analytics: React.FC = () => {
  const { analytics, aircraft } = useSimulation();
  const detectionChartRef = useRef<HTMLCanvasElement>(null);
  const altitudeChartRef = useRef<HTMLCanvasElement>(null);
  const systemLoadChartRef = useRef<HTMLCanvasElement>(null);
  
  const detectionChartInstance = useRef<any>(null);
  const altitudeChartInstance = useRef<any>(null);
  const systemLoadChartInstance = useRef<any>(null);

  useEffect(() => {
    const Chart = window.Chart;
    if (!Chart) return;

    // Detection per minute chart
    if (detectionChartRef.current && !detectionChartInstance.current) {
      detectionChartInstance.current = new Chart(detectionChartRef.current, {
        type: 'line',
        data: {
          labels: Array.from({ length: 20 }, (_, i) => `${i + 1}m`),
          datasets: [{
            label: 'Detections per Minute',
            data: analytics.detectionsPerMinute,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                color: 'rgba(0, 0, 0, 0.1)'
              }
            },
            x: {
              grid: {
                color: 'rgba(0, 0, 0, 0.1)'
              }
            }
          }
        }
      });
    }

    // Altitude distribution chart
    if (altitudeChartRef.current && !altitudeChartInstance.current) {
      altitudeChartInstance.current = new Chart(altitudeChartRef.current, {
        type: 'bar',
        data: {
          labels: analytics.altitudeDistribution.map(item => `${item.altitude}m`),
          datasets: [{
            label: 'Aircraft Count',
            data: analytics.altitudeDistribution.map(item => item.count),
            backgroundColor: [
              '#ef4444',
              '#f59e0b',
              '#10b981',
              '#3b82f6',
              '#8b5cf6',
              '#ec4899'
            ]
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                color: 'rgba(0, 0, 0, 0.1)'
              }
            },
            x: {
              grid: {
                color: 'rgba(0, 0, 0, 0.1)'
              }
            }
          }
        }
      });
    }

    // System load chart
    if (systemLoadChartRef.current && !systemLoadChartInstance.current) {
      systemLoadChartInstance.current = new Chart(systemLoadChartRef.current, {
        type: 'line',
        data: {
          labels: Array.from({ length: 20 }, (_, i) => `${i + 1}m`),
          datasets: [{
            label: 'System Load %',
            data: analytics.systemLoad,
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            fill: true,
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              grid: {
                color: 'rgba(0, 0, 0, 0.1)'
              }
            },
            x: {
              grid: {
                color: 'rgba(0, 0, 0, 0.1)'
              }
            }
          }
        }
      });
    }

    return () => {
      if (detectionChartInstance.current) {
        detectionChartInstance.current.destroy();
        detectionChartInstance.current = null;
      }
      if (altitudeChartInstance.current) {
        altitudeChartInstance.current.destroy();
        altitudeChartInstance.current = null;
      }
      if (systemLoadChartInstance.current) {
        systemLoadChartInstance.current.destroy();
        systemLoadChartInstance.current = null;
      }
    };
  }, []);

  useEffect(() => {
    // Update charts when data changes
    if (detectionChartInstance.current) {
      detectionChartInstance.current.data.datasets[0].data = analytics.detectionsPerMinute;
      detectionChartInstance.current.update();
    }

    if (altitudeChartInstance.current) {
      altitudeChartInstance.current.data.datasets[0].data = analytics.altitudeDistribution.map(item => item.count);
      altitudeChartInstance.current.update();
    }

    if (systemLoadChartInstance.current) {
      systemLoadChartInstance.current.data.datasets[0].data = analytics.systemLoad;
      systemLoadChartInstance.current.update();
    }
  }, [analytics]);

  const handleExportCSV = () => {
    const exportData = [
      ...analytics.detectionsPerMinute.map((value, index) => ({
        Metric: 'Detections per Minute',
        TimePoint: `${index + 1}m`,
        Value: value,
      })),
      ...analytics.systemLoad.map((value, index) => ({
        Metric: 'System Load %',
        TimePoint: `${index + 1}m`,
        Value: value,
      })),
      ...analytics.altitudeDistribution.map(item => ({
        Metric: 'Altitude Distribution',
        Altitude: item.altitude,
        Count: item.count,
      })),
    ];
    exportToCSV(exportData, 'air_defense_analytics');
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
            <p className="text-muted-foreground">
              Performance metrics and tracking statistics
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPDF}
              className="flex items-center gap-2"
            >
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
                <div className="text-2xl font-bold text-green-600">
                  {aircraft.reduce((sum, ac) => sum + ac.position.altitude, 0) / aircraft.length || 0}m
                </div>
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
                <div className="text-2xl font-bold text-purple-600">
                  {aircraft.reduce((sum, ac) => sum + ac.speed, 0) / aircraft.length || 0}
                </div>
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
              <div className="h-64 relative">
                <canvas ref={detectionChartRef} className="absolute inset-0" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Altitude Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 relative">
                <canvas ref={altitudeChartRef} className="absolute inset-0" />
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>System Load Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 relative">
                <canvas ref={systemLoadChartRef} className="absolute inset-0" />
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
                {['Commercial', 'Military', 'Private', 'Unknown'].map(type => {
                  const count = aircraft.filter(ac => ac.type === type).length;
                  const percentage = aircraft.length > 0 ? (count / aircraft.length) * 100 : 0;
                  return (
                    <div key={type} className="flex justify-between items-center">
                      <span className="text-sm">{type}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-muted rounded-full">
                          <div 
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-sm font-mono w-8">{count}</span>
                      </div>
                    </div>
                  );
                })}
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
