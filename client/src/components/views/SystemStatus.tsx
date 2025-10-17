import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { 
  Activity, 
  Plane, 
  Shield, 
  Zap,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { useSimulation } from '../../lib/stores/useSimulation';

const SystemStatus: React.FC = () => {
  const { systemStatus, aircraft, alerts, isRunning } = useSimulation();

  const recentAlerts = alerts.slice(0, 5);
  const criticalAlerts = alerts.filter(alert => alert.priority === 'HIGH').length;

  return (
    <div className="w-full h-full p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-2">System Status</h2>
          <p className="text-muted-foreground">
            Real-time monitoring of air defense system components
          </p>
        </div>

        {/* Main Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Radar Uptime</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {systemStatus.radarUptime.toFixed(1)}%
              </div>
              <Progress value={systemStatus.radarUptime} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-2">
                System operational
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aircraft Count</CardTitle>
              <Plane className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {systemStatus.aircraftCount}
              </div>
              <div className="flex items-center mt-2">
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                <span className="text-xs text-muted-foreground">
                  Active tracking
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Threat Level</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <Badge 
                  variant={
                    systemStatus.threatLevel === 'HIGH' ? 'destructive' :
                    systemStatus.threatLevel === 'MEDIUM' ? 'default' :
                    'secondary'
                  }
                  className="text-base"
                >
                  {systemStatus.threatLevel}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {criticalAlerts} critical alerts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Readiness</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {systemStatus.systemReadiness.toFixed(1)}%
              </div>
              <Progress value={systemStatus.systemReadiness} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-2">
                All systems ready
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* System Components Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                System Components
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Primary Radar</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    Online
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Secondary Radar</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    Online
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Communication Systems</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    Online
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Data Processing Unit</span>
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                    Degraded
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Missile Defense Systems</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    Ready
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Recent Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentAlerts.length > 0 ? (
                  recentAlerts.map((alert) => (
                    <div key={alert.id} className="flex items-start gap-3 p-2 rounded-md bg-muted/50">
                      <div className="flex-shrink-0 mt-0.5">
                        <div className={`w-2 h-2 rounded-full ${
                          alert.priority === 'HIGH' ? 'bg-red-500' :
                          alert.priority === 'MEDIUM' ? 'bg-yellow-500' :
                          'bg-blue-500'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          {alert.message}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {new Date(alert.timestamp).toLocaleTimeString()}
                          </span>
                          <Badge 
                            variant="outline" 
                            className="text-xs"
                          >
                            {alert.type}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No recent alerts</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Simulation Status */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Simulation Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${isRunning ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm">
                  Simulation {isRunning ? 'Running' : 'Stopped'}
                </span>
              </div>
              <Badge variant="outline">
                Educational Mode
              </Badge>
              <Badge variant="outline">
                Generated Data Only
              </Badge>
            </div>
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-md">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Disclaimer:</strong> This is a simulated educational dashboard. 
                All data displayed is artificially generated and does not represent real air defense systems or actual aircraft movements.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SystemStatus;
