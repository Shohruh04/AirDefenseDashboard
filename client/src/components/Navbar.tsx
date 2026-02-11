import React from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Menu, Shield, WifiOff, Wifi, Brain } from "lucide-react";
import { useSimulation } from "../lib/stores/useSimulation";
import { useSettings } from "../lib/stores/useSettings";
import ThemeToggle from "./ThemeToggle";
import type { TabType } from "./Layout";

interface NavbarProps {
  activeTab: TabType;
  onToggleSidebar: () => void;
}

const tabTitles: Record<TabType, string> = {
  "2D_MAP": "AI Tactical Map",
  "3D_SIMULATION": "AI-Powered 3D Simulation",
  SYSTEM_STATUS: "AI System Status",
  ANALYTICS: "AI Analytics Dashboard",
  ALERTS: "AI Alerts & Events",
  SETTINGS: "AI System Settings",
  ABOUT: "About AI Defense",
};

const Navbar: React.FC<NavbarProps> = ({ activeTab, onToggleSidebar }) => {
  const { systemStatus, isRunning, aircraft } = useSimulation();
  const { isSimulationRunning } = useSettings();

  return (
    <header className="bg-card border-b border-border px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleSidebar}
            className="md:hidden"
          >
            <Menu className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-lg font-semibold text-foreground">
                AI-Powered Air Defense System
              </h1>
              <p className="text-sm text-muted-foreground">
                {tabTitles[activeTab]} • AI Simulation
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* System Status Indicators */}
          <div className="hidden sm:flex items-center gap-3">
            <div className="flex items-center gap-2">
              {isRunning && isSimulationRunning ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm">
                {isRunning && isSimulationRunning ? "Online" : "Offline"}
              </span>
            </div>

            <Badge variant="outline" className="gap-1">
              <span className="text-xs">Aircraft:</span>
              <span className="font-mono">{aircraft.length}</span>
            </Badge>

            <Badge
              variant={
                systemStatus.threatLevel === "HIGH"
                  ? "destructive"
                  : systemStatus.threatLevel === "MEDIUM"
                  ? "default"
                  : "secondary"
              }
            >
              {systemStatus.threatLevel}
            </Badge>

            <Badge variant="outline" className="gap-1">
              <span className="text-xs">Uptime:</span>
              <span className="font-mono">
                {systemStatus.radarUptime.toFixed(1)}%
              </span>
            </Badge>

            <Badge variant="outline" className="gap-1 border-purple-500 text-purple-600 dark:text-purple-400">
              <Brain className="h-3 w-3" />
              <span className="text-xs">AI:</span>
              <span className="font-mono">Active</span>
            </Badge>
          </div>

          {/* Theme Toggle */}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};

export default Navbar;
