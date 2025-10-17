import React, { Suspense, useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Stars } from "@react-three/drei";
import { useSettings } from "../../lib/stores/useSettings";
import AircraftModel from "../three/AircraftModel";
import RadarSweep from "../three/RadarSweep";
import RadarParticles from "../three/RadarParticles";
import MissileModel from "../three/MissileModel";
import Terrain from "../three/Terrain";
import RangeIndicator from "../three/RangeIndicator";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Sun, Moon, AlertCircle } from "lucide-react";
import { useSimulation } from "../../lib/stores/useSimulation";

// Check if WebGL is available
const checkWebGLSupport = (): boolean => {
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    return !!gl;
  } catch (e) {
    return false;
  }
};

const Simulation3D: React.FC = () => {
  const { isDayMode, toggleDayMode } = useSettings();
  const { aircraft, missiles } = useSimulation();
  const [webglError, setWebglError] = useState(false);
  const [webglSupported, setWebglSupported] = useState(true);

  useEffect(() => {
    const supported = checkWebGLSupport();
    setWebglSupported(supported);
    if (!supported) {
      setWebglError(true);
    }
  }, []);

  // Fallback 2D visualization when WebGL fails
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
                    WebGL is not available in this environment. The 3D
                    simulation requires WebGL support for hardware-accelerated
                    graphics.
                  </p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                    Alternative: Use the 2D Map View
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    You can still visualize aircraft tracking and radar zones
                    using the 2D Map view from the sidebar. This provides all
                    the simulation data in an interactive map format.
                  </p>
                </div>
                <div className="pt-4">
                  <Badge variant="outline" className="text-sm">
                    Active Aircraft: {aircraft.length}
                  </Badge>
                </div>
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
          <Badge variant="outline" className="bg-background/80 backdrop-blur">
            {aircraft.length} Aircraft
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

      {/* Instructions Overlay */}
      <div className="absolute bottom-4 left-4 z-10 bg-background/80 backdrop-blur rounded p-3 text-sm">
        <div className="font-semibold mb-2">Controls:</div>
        <div>• Left Click + Drag: Rotate view</div>
        <div>• Right Click + Drag: Pan</div>
        <div>• Scroll: Zoom in/out</div>
      </div>

      {/* 3D Canvas */}
      <Canvas
        className="w-full h-full"
        gl={{
          antialias: false,
          alpha: false,
          powerPreference: "default",
          failIfMajorPerformanceCaveat: false,
        }}
        onCreated={(state) => {
          state.gl.setClearColor("#87CEEB");
        }}
        onError={(error) => {
          console.error("WebGL Error:", error);
          setWebglError(true);
        }}
      >
        <PerspectiveCamera
          makeDefault
          position={[0, 50, 100]}
          fov={60}
          near={0.1}
          far={2000}
        />

        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={20}
          maxDistance={500}
          maxPolarAngle={Math.PI / 2.2}
        />

        {/* Lighting */}
        {isDayMode ? (
          <>
            <ambientLight intensity={0.6} />
            <directionalLight
              position={[100, 100, 50]}
              intensity={1}
              castShadow
              shadow-mapSize-width={2048}
              shadow-mapSize-height={2048}
            />
          </>
        ) : (
          <>
            <ambientLight intensity={0.2} color="#404080" />
            <directionalLight
              position={[50, 80, 30]}
              intensity={0.3}
              color="#8080ff"
            />
            <pointLight
              position={[0, 20, 0]}
              intensity={0.5}
              color="#ff8080"
              distance={200}
            />
          </>
        )}

        {/* Background */}
        {isDayMode ? (
          <color attach="background" args={["#87CEEB"]} />
        ) : (
          <>
            <color attach="background" args={["#000011"]} />
            <Stars
              radius={300}
              depth={60}
              count={1000}
              factor={7}
              saturation={0}
              fade={true}
            />
          </>
        )}

        <Suspense fallback={null}>
          {/* Terrain */}
          <Terrain isDayMode={isDayMode} />

          {/* Radar range indicators */}
          <RangeIndicator radius={50} color="#3b82f6" opacity={0.1} />
          <RangeIndicator radius={100} color="#f59e0b" opacity={0.08} />
          <RangeIndicator radius={150} color="#ef4444" opacity={0.06} />

          {/* Radar sweep */}
          <RadarSweep />

          {/* Radar particles effect */}
          <RadarParticles />

          {/* Aircraft */}
          {aircraft.map((ac) => (
            <AircraftModel key={ac.id} aircraft={ac} />
          ))}

          {/* Missiles */}
          {missiles.map((missile) => (
            <MissileModel key={missile.id} missile={missile} />
          ))}
        </Suspense>
      </Canvas>
    </div>
  );
};

export default Simulation3D;
