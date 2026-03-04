import React from "react";
import { Card, CardContent } from "../ui/card";
import { Switch } from "../ui/switch";
import {
  Cloud,
  AlertTriangle,
  Globe,
  Target,
  Plane,
  Radar,
  Zap,
  Layers,
  ChevronDown,
  ChevronUp,
  Shield,
} from "lucide-react";

export interface LayerVisibility {
  weather: boolean;
  windArrows: boolean;
  earthquakes: boolean;
  naturalEvents: boolean;
  conflictZones: boolean;
  convergenceZones: boolean;
  radarRanges: boolean;
  missilePaths: boolean;
  militaryBases: boolean;
}

interface LayerControlProps {
  layers: LayerVisibility;
  onToggle: (layer: keyof LayerVisibility) => void;
  weatherEnabled: boolean;
  disastersEnabled: boolean;
  intelligenceEnabled: boolean;
  convergenceEnabled: boolean;
}

const LayerControl: React.FC<LayerControlProps> = ({
  layers,
  onToggle,
  weatherEnabled,
  disastersEnabled,
  intelligenceEnabled,
  convergenceEnabled,
}) => {
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <Card className="absolute top-4 right-4 z-[1000] bg-gray-900/90 border-gray-700 w-52">
      <CardContent className="p-3">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-between w-full text-xs text-gray-400 font-medium mb-2"
        >
          <div className="flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5" />
            <span>MAP LAYERS</span>
          </div>
          {collapsed ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
        </button>

        {!collapsed && (
          <div className="space-y-2">
            {/* Aircraft layers - always available */}
            <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">Defense</div>
            <LayerItem
              icon={<Radar className="h-3 w-3 text-green-400" />}
              label="Radar Ranges"
              checked={layers.radarRanges}
              onChange={() => onToggle("radarRanges")}
            />
            <LayerItem
              icon={<Zap className="h-3 w-3 text-orange-400" />}
              label="Missile Paths"
              checked={layers.missilePaths}
              onChange={() => onToggle("missilePaths")}
            />
            <LayerItem
              icon={<Shield className="h-3 w-3 text-blue-400" />}
              label="Military Bases"
              checked={layers.militaryBases}
              onChange={() => onToggle("militaryBases")}
            />

            {/* Weather */}
            {weatherEnabled && (
              <>
                <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-2">Weather</div>
                <LayerItem
                  icon={<Cloud className="h-3 w-3 text-cyan-400" />}
                  label="Weather Overlay"
                  checked={layers.weather}
                  onChange={() => onToggle("weather")}
                />
                <LayerItem
                  icon={<Cloud className="h-3 w-3 text-blue-400" />}
                  label="Wind Arrows"
                  checked={layers.windArrows}
                  onChange={() => onToggle("windArrows")}
                />
              </>
            )}

            {/* Disasters */}
            {disastersEnabled && (
              <>
                <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-2">Disasters</div>
                <LayerItem
                  icon={<AlertTriangle className="h-3 w-3 text-red-400" />}
                  label="Earthquakes"
                  checked={layers.earthquakes}
                  onChange={() => onToggle("earthquakes")}
                />
                <LayerItem
                  icon={<AlertTriangle className="h-3 w-3 text-orange-400" />}
                  label="Fires & Storms"
                  checked={layers.naturalEvents}
                  onChange={() => onToggle("naturalEvents")}
                />
              </>
            )}

            {/* Intelligence */}
            {intelligenceEnabled && (
              <>
                <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-2">Intel</div>
                <LayerItem
                  icon={<Globe className="h-3 w-3 text-purple-400" />}
                  label="Conflict Zones"
                  checked={layers.conflictZones}
                  onChange={() => onToggle("conflictZones")}
                />
              </>
            )}

            {/* Convergence */}
            {convergenceEnabled && (
              <>
                <LayerItem
                  icon={<Target className="h-3 w-3 text-red-500" />}
                  label="Convergence"
                  checked={layers.convergenceZones}
                  onChange={() => onToggle("convergenceZones")}
                />
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const LayerItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  checked: boolean;
  onChange: () => void;
}> = ({ icon, label, checked, onChange }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-1.5">
      {icon}
      <span className="text-xs text-gray-300">{label}</span>
    </div>
    <Switch checked={checked} onCheckedChange={onChange} className="scale-75" />
  </div>
);

export default LayerControl;
