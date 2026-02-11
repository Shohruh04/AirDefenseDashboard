import React, { Suspense, useState, useEffect, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  PerspectiveCamera,
  AdaptiveDpr,
  Environment,
} from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import * as THREE from "three";
import { useSettings } from "../../lib/stores/useSettings";
import AircraftModel from "../three/AircraftModel";
import DroneModel from "../three/DroneModel";
import RadarSweep from "../three/RadarSweep";
import RadarParticles from "../three/RadarParticles";
import MissileModel from "../three/MissileModel";
import Terrain from "../three/Terrain";
import Sky from "../three/Sky";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import {
  Sun,
  Moon,
  AlertCircle,
  Target,
  X,
  Crosshair,
  Plane,
  Play,
  Square,
} from "lucide-react";
import { useSimulation } from "../../lib/stores/useSimulation";
import type { Aircraft } from "../../lib/simulation";
import { getThreatLevelColor, getThreatLevelLabel } from "../../lib/simulation";

const checkWebGLSupport = (): boolean => {
  try {
    const canvas = document.createElement("canvas");
    return !!(
      canvas.getContext("webgl") || canvas.getContext("experimental-webgl")
    );
  } catch {
    return false;
  }
};

const Simulation3D: React.FC = () => {
  const { isDayMode, toggleDayMode } = useSettings();
  const {
    aircraft,
    missiles,
    launchMissile,
    systemStatus,
    isRunning,
    startSimulation,
    stopSimulation,
  } = useSimulation();
  const [webglError, setWebglError] = useState(false);
  const [selectedAircraft, setSelectedAircraft] = useState<Aircraft | null>(
    null,
  );
  const [isLaunching, setIsLaunching] = useState(false);
  const [showPerf, setShowPerf] = useState(false);

  useEffect(() => {
    if (!checkWebGLSupport()) setWebglError(true);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "p") {
        e.preventDefault();
        setShowPerf((s) => !s);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (selectedAircraft) {
      const updated = aircraft.find((ac) => ac.id === selectedAircraft.id);
      if (updated) setSelectedAircraft(updated);
      else setSelectedAircraft(null);
    }
  }, [aircraft, selectedAircraft?.id]);

  const handleSelectAircraft = useCallback(
    (ac: Aircraft) => setSelectedAircraft(ac),
    [],
  );
  const handleDeselectAircraft = useCallback(
    () => setSelectedAircraft(null),
    [],
  );

  const handleLaunchMissile = async () => {
    if (!selectedAircraft || isLaunching) return;
    setIsLaunching(true);
    try {
      const response = await fetch("/api/missiles/launch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId: selectedAircraft.id }),
      });
      if (response.ok) {
        console.log("Missile launched at", selectedAircraft.callsign);
      }
    } catch (error) {
      console.error("Failed to launch missile:", error);
    } finally {
      setIsLaunching(false);
    }
  };

  if (webglError) {
    return (
      <div className="w-full h-full p-6 flex items-center justify-center bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
        <Card className="max-w-2xl">
          <CardContent className="p-8">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-8 w-8 text-yellow-500 mt-1 shrink-0" />
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold mb-2">
                    3D Visualization Unavailable
                  </h3>
                  <p className="text-muted-foreground">
                    WebGL is not available. The 3D simulation requires WebGL
                    support for hardware-accelerated graphics.
                  </p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                    Alternative: Use the 2D Map View
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Use the 2D Map view from the sidebar for interactive
                    aircraft tracking and radar zones.
                  </p>
                </div>
                <Badge variant="outline" className="text-sm">
                  Active Aircraft: {aircraft.length}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      {/* Controls Overlay */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <div className="flex gap-2">
          <Button
            variant={isRunning ? "destructive" : "default"}
            size="sm"
            onClick={isRunning ? stopSimulation : startSimulation}
            className="bg-background/80 backdrop-blur"
          >
            {isRunning ? (
              <>
                <Square className="h-4 w-4 mr-1" />
                Stop
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-1" />
                Start
              </>
            )}
          </Button>
          <Badge variant="outline" className="bg-background/80 backdrop-blur">
            {aircraft.length} Aircraft
          </Badge>
          <Badge variant="outline" className="bg-background/80 backdrop-blur">
            {missiles.filter((m) => m.active).length} Missiles
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleDayMode}
            className="bg-background/80 backdrop-blur"
          >
            {isDayMode ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
            {isDayMode ? "Night" : "Day"}
          </Button>
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 left-4 z-10 bg-background/80 backdrop-blur rounded p-3 text-sm">
        <div className="font-semibold mb-2">Controls:</div>
        <div>Left Click + Drag: Rotate | Right Click: Pan | Scroll: Zoom</div>
        <div>Click Aircraft: Select | Ctrl+P: Performance Monitor</div>
      </div>

      {/* Selected Aircraft Panel */}
      {selectedAircraft && (
        <div className="absolute top-4 right-4 z-10 w-72">
          <Card
            className="bg-background/95 backdrop-blur border-2"
            style={{
              borderColor: getThreatLevelColor(selectedAircraft.threatLevel),
            }}
          >
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <Plane
                    className="h-5 w-5"
                    style={{
                      color: getThreatLevelColor(selectedAircraft.threatLevel),
                    }}
                  />
                  <span className="font-bold text-lg">
                    {selectedAircraft.callsign}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDeselectAircraft}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <span className="font-medium">{selectedAircraft.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Threat Level:</span>
                  <Badge
                    variant="outline"
                    style={{
                      borderColor: getThreatLevelColor(
                        selectedAircraft.threatLevel,
                      ),
                      color: getThreatLevelColor(selectedAircraft.threatLevel),
                    }}
                  >
                    {getThreatLevelLabel(selectedAircraft.threatLevel)}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Altitude:</span>
                  <span className="font-medium">
                    {selectedAircraft.position.altitude.toLocaleString()}m
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Speed:</span>
                  <span className="font-medium">
                    {selectedAircraft.speed} km/h
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Heading:</span>
                  <span className="font-medium">
                    {selectedAircraft.heading}°
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Position:</span>
                  <span className="font-medium text-xs">
                    {selectedAircraft.position.lat.toFixed(2)}°N,{" "}
                    {selectedAircraft.position.lng.toFixed(2)}°E
                  </span>
                </div>
              </div>

              {(selectedAircraft.threatLevel === "HOSTILE" ||
                selectedAircraft.threatLevel === "SUSPECT") && (
                <Button
                  className="w-full"
                  variant="destructive"
                  onClick={handleLaunchMissile}
                  disabled={isLaunching || systemStatus.missileReady <= 0}
                >
                  <Target className="h-4 w-4 mr-2" />
                  {isLaunching
                    ? "Launching..."
                    : `Launch Missile (${systemStatus.missileReady} ready)`}
                </Button>
              )}
              {selectedAircraft.threatLevel === "FRIENDLY" && (
                <div className="text-center text-sm text-green-600 dark:text-green-400">
                  <Crosshair className="h-4 w-4 inline mr-1" />
                  Friendly - No action required
                </div>
              )}
              {selectedAircraft.threatLevel === "NEUTRAL" && (
                <div className="text-center text-sm text-blue-600 dark:text-blue-400">
                  <Crosshair className="h-4 w-4 inline mr-1" />
                  Neutral - Monitoring
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* 3D Canvas */}
      <Canvas
        className="w-full h-full"
        shadows="soft"
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
          failIfMajorPerformanceCaveat: false,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: isDayMode ? 1.2 : 0.8,
        }}
        frameloop="always"
        dpr={[1, 2]}
        onCreated={(state) => {
          state.gl.setClearColor(isDayMode ? "#87CEEB" : "#050510");
        }}
        onError={(error) => {
          console.error("WebGL Error:", error);
          setWebglError(true);
        }}
      >
        <AdaptiveDpr pixelated />

        <PerspectiveCamera
          makeDefault
          position={[0, 60, 120]}
          fov={55}
          near={0.5}
          far={1500}
        />

        <OrbitControls
          enablePan
          enableZoom
          enableRotate
          minDistance={20}
          maxDistance={500}
          maxPolarAngle={Math.PI / 2.05}
          enableDamping
          dampingFactor={0.05}
        />

        {/* Multi-light setup for realism */}
        {/* Hemisphere light: sky color from above, ground bounce from below */}
        <hemisphereLight
          args={[
            isDayMode ? "#87CEEB" : "#1a1a3a",
            isDayMode ? "#3d5a3d" : "#0a0a0f",
            isDayMode ? 0.5 : 0.15,
          ]}
        />

        {/* Main directional (sun/moon) */}
        <directionalLight
          position={isDayMode ? [120, 100, 60] : [50, 70, 30]}
          intensity={isDayMode ? 1.5 : 0.2}
          color={isDayMode ? "#fff5e6" : "#4466aa"}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={400}
          shadow-camera-left={-120}
          shadow-camera-right={120}
          shadow-camera-top={120}
          shadow-camera-bottom={-120}
          shadow-bias={-0.0005}
        />

        {/* Fill light from opposite side */}
        <directionalLight
          position={isDayMode ? [-80, 40, -60] : [-30, 20, -40]}
          intensity={isDayMode ? 0.3 : 0.05}
          color={isDayMode ? "#b0c4de" : "#223355"}
        />

        {/* Warm ground bounce for day */}
        {isDayMode && (
          <pointLight
            position={[0, -5, 0]}
            intensity={0.15}
            color="#c4a882"
            distance={200}
          />
        )}

        {/* Scene fog for atmospheric depth */}
        <fog
          attach="fog"
          args={[isDayMode ? "#b8d4e8" : "#050510", 100, 600]}
        />

        <Suspense fallback={null}>
          {/* Environment map for PBR reflections */}
          <Environment
            preset={isDayMode ? "sunset" : "night"}
            background={false}
          />

          <Sky isDayMode={isDayMode} />
          <Terrain isDayMode={isDayMode} />
          <RadarSweep isDayMode={isDayMode} />
          <RadarParticles />

          {/* Aircraft */}
          {aircraft.map((ac) =>
            ac.type === "Drone" ? (
              <DroneModel
                key={ac.id}
                aircraft={ac}
                isSelected={selectedAircraft?.id === ac.id}
                onSelect={() => handleSelectAircraft(ac)}
                onDeselect={handleDeselectAircraft}
              />
            ) : (
              <AircraftModel
                key={ac.id}
                aircraft={ac}
                isDayMode={isDayMode}
                isSelected={selectedAircraft?.id === ac.id}
                onSelect={() => handleSelectAircraft(ac)}
                onDeselect={handleDeselectAircraft}
              />
            ),
          )}

          {/* Missiles */}
          {missiles.map((missile) => (
            <MissileModel key={missile.id} missile={missile} />
          ))}

          {/* Postprocessing */}
          <EffectComposer>
            <Bloom
              luminanceThreshold={isDayMode ? 0.9 : 0.6}
              luminanceSmoothing={0.4}
              intensity={isDayMode ? 0.3 : 0.8}
              mipmapBlur
            />
            <Vignette
              offset={0.3}
              darkness={isDayMode ? 0.3 : 0.6}
              blendFunction={BlendFunction.NORMAL}
            />
          </EffectComposer>
        </Suspense>
      </Canvas>
    </div>
  );
};

export default Simulation3D;
