import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Slider } from '../ui/slider';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { 
  Play, 
  Pause, 
  Settings as SettingsIcon, 
  RefreshCw,
  Monitor,
  Sun,
  Moon,
  Info
} from 'lucide-react';
import { useSettings } from '../../lib/stores/useSettings';
import { useSimulation } from '../../lib/stores/useSimulation';

const Settings: React.FC = () => {
  const { 
    isSimulationRunning, 
    refreshRate, 
    viewMode, 
    isDayMode,
    toggleSimulation, 
    setRefreshRate, 
    setViewMode, 
    toggleDayMode 
  } = useSettings();
  
  const { startSimulation, stopSimulation, isRunning } = useSimulation();

  const handleToggleSimulation = () => {
    toggleSimulation();
    if (isSimulationRunning && isRunning) {
      stopSimulation();
    } else if (!isSimulationRunning && !isRunning) {
      startSimulation();
    }
  };

  const handleRefreshRateChange = (value: number[]) => {
    setRefreshRate(value[0]);
  };

  return (
    <div className="w-full h-full p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-2">System Settings</h2>
          <p className="text-muted-foreground">
            Configure simulation parameters and display preferences
          </p>
        </div>

        {/* Simulation Control */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              Simulation Control
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base font-medium">Simulation Status</Label>
                <p className="text-sm text-muted-foreground">
                  Control the main simulation engine
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge 
                  variant={isRunning ? "default" : "secondary"}
                  className="px-3 py-1"
                >
                  {isRunning ? 'Running' : 'Stopped'}
                </Badge>
                <Button
                  onClick={handleToggleSimulation}
                  className="flex items-center gap-2"
                  variant={isRunning ? "destructive" : "default"}
                >
                  {isRunning ? (
                    <>
                      <Pause className="h-4 w-4" />
                      Stop Simulation
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      Start Simulation
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">
                  Data Refresh Rate: {refreshRate}s
                </Label>
                <Badge variant="outline">{refreshRate === 1 ? 'Real-time' : 'Standard'}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                How frequently simulation data is updated (1-10 seconds)
              </p>
              <div className="px-2">
                <Slider
                  value={[refreshRate]}
                  onValueChange={handleRefreshRateChange}
                  max={10}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>1s (Fast)</span>
                  <span>10s (Slow)</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Display Settings */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Display Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base font-medium">Primary View Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Choose between 2D map or 3D simulation view
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === '2D' ? 'default' : 'outline'}
                  onClick={() => setViewMode('2D')}
                  size="sm"
                >
                  2D Map
                </Button>
                <Button
                  variant={viewMode === '3D' ? 'default' : 'outline'}
                  onClick={() => setViewMode('3D')}
                  size="sm"
                >
                  3D View
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base font-medium">3D Scene Lighting</Label>
                <p className="text-sm text-muted-foreground">
                  Toggle between day and night mode for 3D visualization
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Sun className="h-4 w-4 text-yellow-500" />
                  <Switch
                    checked={isDayMode}
                    onCheckedChange={toggleDayMode}
                  />
                  <Moon className="h-4 w-4 text-blue-500" />
                </div>
                <Badge variant="outline">
                  {isDayMode ? 'Day Mode' : 'Night Mode'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              System Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-medium">Performance Settings</Label>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Render Quality:</span>
                    <span className="text-muted-foreground">High</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Animation Frame Rate:</span>
                    <span className="text-muted-foreground">60 FPS</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Data Processing:</span>
                    <span className="text-muted-foreground">Real-time</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="font-medium">Simulation Parameters</Label>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Max Aircraft:</span>
                    <span className="text-muted-foreground">12</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Radar Range:</span>
                    <span className="text-muted-foreground">300km</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Update Interval:</span>
                    <span className="text-muted-foreground">{refreshRate}s</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reset and Actions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Reset & Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={() => {
                  setRefreshRate(2);
                  setViewMode('3D');
                  // Reset to defaults
                }}
              >
                <RefreshCw className="h-4 w-4" />
                Reset to Defaults
              </Button>
              
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={() => {
                  // Clear all data and restart
                  stopSimulation();
                  setTimeout(() => startSimulation(), 1000);
                }}
              >
                <Play className="h-4 w-4" />
                Restart Simulation
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Educational Notice */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-md">
              <Info className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-blue-800 dark:text-blue-200 mb-1">
                  Educational Simulation Settings
                </p>
                <p className="text-blue-700 dark:text-blue-300">
                  This is a simulated educational environment. All settings control artificially generated data 
                  and do not affect real air defense systems. The simulation is designed for learning purposes only.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
