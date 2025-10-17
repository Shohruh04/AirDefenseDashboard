import React from "react";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";
import {
  Map,
  Box,
  Activity,
  BarChart3,
  AlertTriangle,
  Settings,
  Info,
  ChevronLeft,
  ChevronRight,
  Radar,
} from "lucide-react";
import type { TabType } from "./Layout";

interface SidebarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const menuItems = [
  { id: "2D_MAP", label: "2D Map", icon: Map },
  { id: "3D_SIMULATION", label: "3D Simulation", icon: Box },
  { id: "SYSTEM_STATUS", label: "System Status", icon: Activity },
  { id: "ANALYTICS", label: "Analytics", icon: BarChart3 },
  { id: "ALERTS", label: "Alerts", icon: AlertTriangle },
  { id: "SETTINGS", label: "Settings", icon: Settings },
  { id: "ABOUT", label: "About", icon: Info },
] as const;

const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  collapsed,
  onToggleCollapse,
}) => {
  return (
    <div
      className={cn(
        "bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <Radar className="h-6 w-6 text-primary" />
              <span className="font-semibold text-sidebar-foreground">
                Air Defense
              </span>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            className="p-1.5 h-auto"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <Button
                key={item.id}
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 px-3 py-2.5",
                  collapsed && "px-3",
                  isActive && "bg-sidebar-accent text-sidebar-accent-foreground"
                )}
                onClick={() => onTabChange(item.id as TabType)}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Button>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        {!collapsed && (
          <div className="text-xs text-sidebar-foreground/60">
            Educational Simulation
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
