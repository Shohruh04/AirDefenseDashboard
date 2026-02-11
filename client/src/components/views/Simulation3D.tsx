import React, { Suspense, useState, useEffect, useCallback, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  PerspectiveCamera,
  AdaptiveDpr,
  Environment,
  Line,
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
import ExplosionEffect from "../three/ExplosionEffect";
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
  Brain,
  TrendingUp,
  TrendingDown,
  Minus,
  Shield,
} from "lucide-react";
import { useSimulation } from "../../lib/stores/useSimulation";
import type { Aircraft } from "../../lib/simulation";
import { getThreatLevelColor, getThreatLevelLabel, toWorldCoords } from "../../lib/simulation";

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

// Prediction line for 3D view
const PredictionLine: React.FC<{ aircraft: Aircraft }> = ({ aircraft }) => {
  const path = aircraft.aiClassification?.predictedPath;
  if (!path || path.length === 0) return null;

  const points = useMemo(() => [
    new THREE.Vector3(...toWorldCoords(aircraft.position.lat, aircraft.position.lng, aircraft.position.altitude)),
    ...path.map(p => new THREE.Vector3(...toWorldCoords(p.lat, p.lng, p.altitude))),
  ], [aircraft.position.lat, aircraft.position.lng, aircraft.position.altitude, path]);

  return (
    <Line
      points={points}
      color={getThreatLevelColor(aircraft.threatLevel)}
      lineWidth={1}
      dashed
      dashScale={2}
      dashSize={0.5}
      gapSize={0.3}
      transparent
      opacity={0.35}
    />
  );
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
    engagementQueue,
    aiMetrics,
    explosions,
  } = useSimulation();
  const [webglError, setWebglError] = useState(false);
  const [selectedAircraft, setSelectedAircraft] = useState<Aircraft | null>(null);
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

  const getAiRecommendation = (ac: Aircraft) => {
    switch (ac.threatLevel) {
      case "HOSTILE": return { text: "ENGAGE — High confidence threat", color: "text-red-500" };
      case "SUSPECT": return { text: "MONITOR — Elevated risk factors", color: "text-orange-500" };
      case "NEUTRAL": return { text: "TRACK — Standard monitoring", color: "text-blue-500" };
      case "FRIENDLY": return { text: "CLEAR — No threat indicators", color: "text-green-500" };
    }
  };

  const getTrend = (scores: number[]) => {
    if (scores.length < 2) return "stable";
    const last = scores[scores.length - 1];
    const prev = scores[scores.length - 2];
    if (last > prev + 2) return "up";
    if (last < prev - 2) return "down";
    return "stable";
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
                  <h3 className="text-xl font-semibold mb-2">3D Visualization Unavailable</h3>
                  <p className="text-muted-foreground">
                    WebGL is not available. The 3D simulation requires WebGL support for hardware-accelerated graphics.
                  </p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">Alternative: Use the 2D Map View</p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Use the 2D Map view from the sidebar for interactive aircraft tracking and radar zones.
                  </p>
                </div>
                <Badge variant="outline" className="text-sm">Active Aircraft: {aircraft.length}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const aiClassification = selectedAircraft?.aiClassification;
  const recommendation = selectedAircraft ? getAiRecommendation(selectedAircraft) : null;
  const trend = aiClassification ? getTrend(aiClassification.previousScores) : "stable";

  return (
    <div className="w-full h-full relative">
      {/* Controls Overlay */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={isRunning ? "destructive" : "default"}
            size="sm"
            onClick={isRunning ? stopSimulation : startSimulation}
            className="bg-background/80 backdrop-blur"
          >
            {isRunning ? <><Square className="h-4 w-4 mr-1" />Stop</> : <><Play className="h-4 w-4 mr-1" />Start</>}
          </Button>
          <Badge variant="outline" className="bg-background/80 backdrop-blur">{aircraft.length} Aircraft</Badge>
          <Badge variant="outline" className="bg-background/80 backdrop-blur">{missiles.filter((m) => m.active).length} Missiles</Badge>
          <Badge variant="outline" className="bg-background/80 backdrop-blur gap-1 border-purple-500/50">
            <Brain className="h-3 w-3 text-purple-500" />
            <span className="text-purple-600 dark:text-purple-400 font-mono text-xs">AI {aiMetrics.modelAccuracy.toFixed(1)}%</span>
          </Badge>
          <Button variant="outline" size="sm" onClick={toggleDayMode} className="bg-background/80 backdrop-blur">
            {isDayMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
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

      {/* AI Reasoning Panel — Selected Aircraft */}
      {selectedAircraft && (
        <div className="absolute top-4 right-4 z-10 w-80 max-h-[calc(100vh-120px)] overflow-y-auto">
          <Card className="bg-background/95 backdrop-blur border-2" style={{ borderColor: getThreatLevelColor(selectedAircraft.threatLevel) }}>
            <CardContent className="p-4">
              {/* Header */}
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Plane className="h-5 w-5" style={{ color: getThreatLevelColor(selectedAircraft.threatLevel) }} />
                    <span className="font-bold text-lg">{selectedAircraft.callsign}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">{selectedAircraft.model}</div>
                </div>
                <Button variant="ghost" size="sm" onClick={handleDeselectAircraft} className="h-6 w-6 p-0">
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* AI Threat Assessment */}
              <div className="mb-3 p-2 rounded bg-muted/50">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="h-3.5 w-3.5 text-purple-500" />
                  <span className="text-xs font-semibold uppercase tracking-wide">AI Threat Assessment</span>
                </div>
                <div className="flex items-center justify-between mb-1.5">
                  <Badge variant="outline" style={{
                    borderColor: getThreatLevelColor(selectedAircraft.threatLevel),
                    color: getThreatLevelColor(selectedAircraft.threatLevel),
                  }}>
                    {getThreatLevelLabel(selectedAircraft.threatLevel)}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">Confidence:</span>
                    <span className="font-mono text-sm font-bold">{aiClassification?.confidenceScore?.toFixed(1) ?? '--'}%</span>
                    {trend === "up" && <TrendingUp className="h-3 w-3 text-red-500" />}
                    {trend === "down" && <TrendingDown className="h-3 w-3 text-green-500" />}
                    {trend === "stable" && <Minus className="h-3 w-3 text-muted-foreground" />}
                  </div>
                </div>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${aiClassification?.confidenceScore ?? 0}%`,
                      backgroundColor: getThreatLevelColor(selectedAircraft.threatLevel),
                    }}
                  />
                </div>
              </div>

              {/* Risk Factor Analysis */}
              {aiClassification && aiClassification.riskFactors.length > 0 && (
                <div className="mb-3">
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Risk Factor Analysis</div>
                  <div className="space-y-1">
                    {[...aiClassification.riskFactors].sort((a, b) => b.weighted - a.weighted).map((factor) => (
                      <div key={factor.name} className="flex items-center gap-1.5 text-[10px]">
                        <span className="w-[70px] truncate text-muted-foreground">{factor.name}</span>
                        <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{
                            width: `${Math.min(100, factor.score)}%`,
                            backgroundColor: factor.score > 60 ? "#ef4444" : factor.score > 30 ? "#f59e0b" : "#10b981",
                          }} />
                        </div>
                        <span className="w-6 text-right font-mono">{Math.round(factor.score)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sparkline trend */}
              {aiClassification && aiClassification.previousScores.length > 1 && (
                <div className="mb-3">
                  <div className="text-[10px] text-muted-foreground mb-1">Threat Score Trend</div>
                  <div className="flex items-end gap-0.5 h-5">
                    {aiClassification.previousScores.map((score, i) => (
                      <div key={i} className="flex-1 rounded-sm transition-all duration-300" style={{
                        height: `${Math.max(10, score)}%`,
                        backgroundColor: score > 65 ? "#ef4444" : score > 45 ? "#f59e0b" : score > 25 ? "#3b82f6" : "#10b981",
                        opacity: 0.5 + (i / aiClassification.previousScores.length) * 0.5,
                      }} />
                    ))}
                  </div>
                </div>
              )}

              {/* AI Recommendation */}
              {recommendation && (
                <div className={`text-xs font-medium mb-3 p-1.5 rounded bg-muted/30 ${recommendation.color}`}>
                  <Shield className="h-3 w-3 inline mr-1" />
                  {recommendation.text}
                </div>
              )}

              {/* Flight data */}
              <div className="space-y-1 text-xs mb-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">IFF Status:</span>
                  <span className={`font-medium ${aiClassification?.iffResponding ? "text-green-500" : "text-red-500"}`}>
                    {aiClassification?.iffResponding ? "Responding" : "No Response"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Altitude:</span>
                  <span className="font-medium">{selectedAircraft.position.altitude.toLocaleString()}m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Speed:</span>
                  <span className="font-medium">{selectedAircraft.speed} km/h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Heading:</span>
                  <span className="font-medium">{selectedAircraft.heading}°</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Position:</span>
                  <span className="font-medium text-[10px]">
                    {selectedAircraft.position.lat.toFixed(2)}°N, {selectedAircraft.position.lng.toFixed(2)}°E
                  </span>
                </div>
                {(aiClassification?.anomalyScore ?? 0) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Anomaly Score:</span>
                    <span className={`font-mono font-medium ${(aiClassification?.anomalyScore ?? 0) > 50 ? "text-red-500" : "text-orange-500"}`}>
                      {aiClassification?.anomalyScore?.toFixed(0)}%
                    </span>
                  </div>
                )}
              </div>

              {/* Launch button */}
              {(selectedAircraft.threatLevel === "HOSTILE" || selectedAircraft.threatLevel === "SUSPECT") && (
                <Button className="w-full" variant="destructive" onClick={handleLaunchMissile} disabled={isLaunching || systemStatus.missileReady <= 0}>
                  <Target className="h-4 w-4 mr-2" />
                  {isLaunching ? "Launching..." : `Launch Missile (${systemStatus.missileReady} ready)`}
                </Button>
              )}
              {selectedAircraft.threatLevel === "FRIENDLY" && (
                <div className="text-center text-xs text-green-600 dark:text-green-400">
                  <Crosshair className="h-3 w-3 inline mr-1" />Friendly — No action required
                </div>
              )}
              {selectedAircraft.threatLevel === "NEUTRAL" && (
                <div className="text-center text-xs text-blue-600 dark:text-blue-400">
                  <Crosshair className="h-3 w-3 inline mr-1" />Neutral — Monitoring
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* AI Engagement Priority Queue */}
      <div className="absolute bottom-4 right-4 z-10 w-72">
        <Card className="bg-background/90 backdrop-blur border-purple-500/30">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="h-3.5 w-3.5 text-purple-500" />
              <span className="text-xs font-semibold">AI Engagement Priority</span>
              <span className="ml-auto text-[10px] text-muted-foreground font-mono">{engagementQueue.length} targets</span>
            </div>
            <div className="space-y-1 max-h-36 overflow-y-auto">
              {engagementQueue.slice(0, 5).map((target, index) => (
                <div
                  key={target.aircraft.id}
                  className="flex items-center gap-1.5 text-[10px] p-1 rounded bg-muted/40 cursor-pointer hover:bg-muted/70"
                  onClick={() => handleSelectAircraft(target.aircraft)}
                >
                  <span className="font-mono text-muted-foreground w-4">#{index + 1}</span>
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: getThreatLevelColor(target.aircraft.threatLevel) }} />
                  <div className="flex flex-col min-w-0">
                    <span className="font-mono font-bold">{target.aircraft.callsign}</span>
                    <span className="text-[8px] text-muted-foreground truncate">{target.aircraft.model}</span>
                  </div>
                  <span className="ml-auto font-mono text-orange-500 shrink-0">{target.engagementScore.toFixed(0)}</span>
                  <Badge variant="outline" className="text-[8px] px-1 py-0 h-3.5 shrink-0" style={{
                    borderColor: target.recommendation === "ENGAGE" ? "#ef4444" : target.recommendation === "TRACK" ? "#f59e0b" : "#3b82f6",
                    color: target.recommendation === "ENGAGE" ? "#ef4444" : target.recommendation === "TRACK" ? "#f59e0b" : "#3b82f6",
                  }}>
                    {target.recommendation}
                  </Badge>
                </div>
              ))}
              {engagementQueue.length === 0 && (
                <div className="text-[10px] text-muted-foreground text-center py-2">No active threats detected</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

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
        onCreated={(state) => { state.gl.setClearColor(isDayMode ? "#87CEEB" : "#050510"); }}
        onError={(error) => { console.error("WebGL Error:", error); setWebglError(true); }}
      >
        <AdaptiveDpr pixelated />
        <PerspectiveCamera makeDefault position={[0, 60, 120]} fov={55} near={0.5} far={1500} />
        <OrbitControls enablePan enableZoom enableRotate minDistance={20} maxDistance={500} maxPolarAngle={Math.PI / 2.05} enableDamping dampingFactor={0.05} />

        <hemisphereLight args={[isDayMode ? "#87CEEB" : "#1a1a3a", isDayMode ? "#3d5a3d" : "#0a0a0f", isDayMode ? 0.5 : 0.15]} />
        <directionalLight position={isDayMode ? [120, 100, 60] : [50, 70, 30]} intensity={isDayMode ? 1.5 : 0.2} color={isDayMode ? "#fff5e6" : "#4466aa"} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} shadow-camera-far={400} shadow-camera-left={-120} shadow-camera-right={120} shadow-camera-top={120} shadow-camera-bottom={-120} shadow-bias={-0.0005} />
        <directionalLight position={isDayMode ? [-80, 40, -60] : [-30, 20, -40]} intensity={isDayMode ? 0.3 : 0.05} color={isDayMode ? "#b0c4de" : "#223355"} />
        {isDayMode && <pointLight position={[0, -5, 0]} intensity={0.15} color="#c4a882" distance={200} />}
        <fog attach="fog" args={[isDayMode ? "#b8d4e8" : "#050510", 100, 600]} />

        <Suspense fallback={null}>
          <Environment preset={isDayMode ? "sunset" : "night"} background={false} />
          <Sky isDayMode={isDayMode} />
          <Terrain isDayMode={isDayMode} />
          <RadarSweep isDayMode={isDayMode} />
          <RadarParticles />

          {/* Aircraft */}
          {aircraft.map((ac) =>
            ac.type === "Drone" ? (
              <DroneModel key={ac.id} aircraft={ac} isSelected={selectedAircraft?.id === ac.id} onSelect={() => handleSelectAircraft(ac)} onDeselect={handleDeselectAircraft} />
            ) : (
              <AircraftModel key={ac.id} aircraft={ac} isDayMode={isDayMode} isSelected={selectedAircraft?.id === ac.id} onSelect={() => handleSelectAircraft(ac)} onDeselect={handleDeselectAircraft} />
            ),
          )}

          {/* Prediction Lines */}
          {aircraft.map((ac) => (
            <PredictionLine key={`pred-${ac.id}`} aircraft={ac} />
          ))}

          {/* Missiles */}
          {missiles.map((missile) => (
            <MissileModel key={missile.id} missile={missile} />
          ))}

          {/* Explosions */}
          {explosions.map((explosion) => (
            <ExplosionEffect key={explosion.id} explosion={explosion} />
          ))}

          <EffectComposer>
            <Bloom luminanceThreshold={isDayMode ? 0.9 : 0.6} luminanceSmoothing={0.4} intensity={isDayMode ? 0.3 : 0.8} mipmapBlur />
            <Vignette offset={0.3} darkness={isDayMode ? 0.3 : 0.6} blendFunction={BlendFunction.NORMAL} />
          </EffectComposer>
        </Suspense>
      </Canvas>
    </div>
  );
};

export default Simulation3D;
