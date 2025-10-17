import React from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Menu, Shield, WifiOff, Wifi } from "lucide-react";
import { useSimulation } from "../lib/stores/useSimulation";
import { useSettings } from "../lib/stores/useSettings";
import ThemeToggle from "./ThemeToggle";
import type { TabType } from "./Layout";

interface NavbarProps {
  activeTab: TabType;
  onToggleSidebar: () => void;
}

const tabTitles: Record<TabType, string> = {
  "2D_MAP": "2D Map View",
  "3D_SIMULATION": "3D Air Defense Simulation",
  SYSTEM_STATUS: "System Status",
  ANALYTICS: "Analytics Dashboard",
  ALERTS: "Alerts & Events Log",
  SETTINGS: "System Settings",
  ABOUT: "About This Project",
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
                3D Air Defense Simulation Dashboard
              </h1>
              <p className="text-sm text-muted-foreground">
                {tabTitles[activeTab]} • Educational Project
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
          </div>

          {/* Theme Toggle */}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};

export default Navbar;
