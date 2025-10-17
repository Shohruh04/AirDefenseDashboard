import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import Map2D from "./views/Map2D";
import Simulation3D from "./views/Simulation3D";
import SystemStatus from "./views/SystemStatus";
import Analytics from "./views/Analytics";
import AlertsLog from "./views/AlertsLog";
import Settings from "./views/Settings";
import About from "./views/About";

export type TabType =
  | "2D_MAP"
  | "3D_SIMULATION"
  | "SYSTEM_STATUS"
  | "ANALYTICS"
  | "ALERTS"
  | "SETTINGS"
  | "ABOUT";

const Layout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>("2D_MAP");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case "2D_MAP":
        return <Map2D />;
      case "3D_SIMULATION":
        return <Simulation3D />;
      case "SYSTEM_STATUS":
        return <SystemStatus />;
      case "ANALYTICS":
        return <Analytics />;
      case "ALERTS":
        return <AlertsLog />;
      case "SETTINGS":
        return <Settings />;
      case "ABOUT":
        return <About />;
      default:
        return <Simulation3D />;
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <div className="flex-1 flex flex-col">
        <Navbar
          activeTab={activeTab}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        <main className="flex-1 overflow-hidden">{renderContent()}</main>
      </div>
    </div>
  );
};

export default Layout;
