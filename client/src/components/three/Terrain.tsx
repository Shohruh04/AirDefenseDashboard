import React, { useMemo } from "react";
import * as THREE from "three";

interface TerrainProps {
  isDayMode: boolean;
}

const Terrain: React.FC<TerrainProps> = ({ isDayMode }) => {
  // Generate procedural terrain heights
  const terrainHeights = useMemo(() => {
    const size = 100;
    const heights: number[][] = [];
    for (let i = 0; i < size; i++) {
      heights[i] = [];
      for (let j = 0; j < size; j++) {
        const x = (i / size) * 4 - 2;
        const z = (j / size) * 4 - 2;
        const noise =
          Math.sin(x * 2) * Math.cos(z * 2) * 0.3 +
          Math.sin(x * 5 + z * 3) * 0.1 +
          Math.cos(z * 4 - x) * 0.15;
        heights[i][j] = Math.max(0, noise);
      }
    }
    return heights;
  }, []);

  // Colors based on day/night mode
  const colors = useMemo(
    () => ({
      ground: isDayMode ? "#4a6741" : "#1a2518",
      groundDark: isDayMode ? "#3d5636" : "#151e13",
      concrete: isDayMode ? "#808080" : "#404040",
      concreteDark: isDayMode ? "#606060" : "#303030",
      asphalt: isDayMode ? "#3a3a3a" : "#1a1a1a",
      water: isDayMode ? "#2196F3" : "#0d47a1",
      building: isDayMode ? "#5d5d5d" : "#2d2d2d",
      buildingDark: isDayMode ? "#4a4a4a" : "#222222",
      metal: isDayMode ? "#707070" : "#404040",
      sand: isDayMode ? "#c2b280" : "#5a5030",
      mountain: isDayMode ? "#6b5b4f" : "#3a3028",
      mountainSnow: isDayMode ? "#ffffff" : "#aaaaaa",
      tree: isDayMode ? "#2d5a27" : "#152810",
      runway: isDayMode ? "#2a2a2a" : "#151515",
      marking: isDayMode ? "#ffffff" : "#666666",
      fence: isDayMode ? "#4a4a4a" : "#2a2a2a",
      light: isDayMode ? "#ffee88" : "#ffaa44",
    }),
    [isDayMode]
  );

  return (
    <group>
      {/* === MAIN GROUND PLANE === */}
      <mesh position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[500, 500, 100, 100]} />
        <meshStandardMaterial
          color={colors.ground}
          roughness={0.9}
          metalness={0.1}
        />
      </mesh>

      {/* === TACTICAL GRID OVERLAY === */}
      <group position={[0, -0.48, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        {/* Major grid lines */}
        {[-200, -150, -100, -50, 0, 50, 100, 150, 200].map((pos, i) => (
          <React.Fragment key={`grid-${i}`}>
            <mesh position={[pos, 0, 0.01]}>
              <planeGeometry args={[0.5, 400]} />
              <meshBasicMaterial
                color="#00ff88"
                transparent
                opacity={isDayMode ? 0.08 : 0.15}
              />
            </mesh>
            <mesh position={[0, pos, 0.01]}>
              <planeGeometry args={[400, 0.5]} />
              <meshBasicMaterial
                color="#00ff88"
                transparent
                opacity={isDayMode ? 0.08 : 0.15}
              />
            </mesh>
          </React.Fragment>
        ))}
      </group>

      {/* === MILITARY BASE COMPOUND === */}
      <group position={[0, 0, 0]}>
        {/* Main concrete pad */}
        <mesh position={[0, -0.45, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[60, 60]} />
          <meshStandardMaterial color={colors.concrete} roughness={0.8} />
        </mesh>

        {/* Helipad markings */}
        <mesh position={[-15, -0.44, -15]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[4, 5, 32]} />
          <meshBasicMaterial color={colors.marking} />
        </mesh>
        <mesh position={[-15, -0.44, -15]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[8, 1]} />
          <meshBasicMaterial color={colors.marking} />
        </mesh>
        <mesh position={[-15, -0.44, -15]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
          <planeGeometry args={[8, 1]} />
          <meshBasicMaterial color={colors.marking} />
        </mesh>

        {/* Perimeter fence posts */}
        {Array.from({ length: 24 }, (_, i) => {
          const angle = (i / 24) * Math.PI * 2;
          const radius = 35;
          return (
            <mesh
              key={`fence-${i}`}
              position={[Math.cos(angle) * radius, 0.5, Math.sin(angle) * radius]}
              castShadow
            >
              <cylinderGeometry args={[0.1, 0.1, 2, 6]} />
              <meshStandardMaterial color={colors.fence} metalness={0.6} roughness={0.4} />
            </mesh>
          );
        })}

        {/* Fence wire (horizontal rings) */}
        {[0.3, 0.8, 1.3].map((height, i) => (
          <mesh key={`wire-${i}`} position={[0, height, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[35, 0.02, 4, 48]} />
            <meshStandardMaterial color={colors.fence} metalness={0.7} />
          </mesh>
        ))}
      </group>

      {/* === COMMAND BUILDINGS === */}
      <group position={[20, 0, -20]}>
        {/* Main Command Center */}
        <mesh position={[0, 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[12, 4, 8]} />
          <meshStandardMaterial color={colors.building} roughness={0.7} metalness={0.2} />
        </mesh>
        {/* Roof */}
        <mesh position={[0, 4.3, 0]} castShadow>
          <boxGeometry args={[13, 0.6, 9]} />
          <meshStandardMaterial color={colors.buildingDark} roughness={0.6} metalness={0.3} />
        </mesh>
        {/* Windows */}
        {[-4, -2, 0, 2, 4].map((x, i) => (
          <mesh key={`window-${i}`} position={[x, 2.5, 4.01]}>
            <planeGeometry args={[1.2, 1.5]} />
            <meshBasicMaterial
              color={isDayMode ? "#87ceeb" : "#ffaa44"}
              transparent
              opacity={isDayMode ? 0.5 : 0.8}
            />
          </mesh>
        ))}
        {/* Antenna array */}
        <mesh position={[4, 5.5, 0]} castShadow>
          <cylinderGeometry args={[0.1, 0.1, 2.5, 8]} />
          <meshStandardMaterial color={colors.metal} metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[4, 7, 0]} castShadow>
          <boxGeometry args={[2, 0.3, 0.1]} />
          <meshStandardMaterial color={colors.metal} metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Satellite dish */}
        <mesh position={[-4, 5, 2]} rotation={[0.3, 0.5, 0]} castShadow>
          <cylinderGeometry args={[0.1, 1.5, 0.8, 16]} />
          <meshStandardMaterial
            color={colors.metal}
            metalness={0.9}
            roughness={0.1}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {/* Barracks Building */}
      <group position={[-25, 0, -15]}>
        <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
          <boxGeometry args={[8, 3, 15]} />
          <meshStandardMaterial color={colors.building} roughness={0.7} metalness={0.2} />
        </mesh>
        <mesh position={[0, 3.2, 0]} castShadow>
          <boxGeometry args={[9, 0.4, 16]} />
          <meshStandardMaterial color={colors.buildingDark} roughness={0.6} />
        </mesh>
        {/* Windows row */}
        {[-5, -2.5, 0, 2.5, 5].map((z, i) => (
          <mesh key={`barrack-window-${i}`} position={[4.01, 1.5, z]}>
            <planeGeometry args={[1, 1.2]} />
            <meshBasicMaterial
              color={isDayMode ? "#87ceeb" : "#ffaa44"}
              transparent
              opacity={isDayMode ? 0.5 : 0.6}
            />
          </mesh>
        ))}
      </group>

      {/* Equipment Storage */}
      <group position={[25, 0, 15]}>
        <mesh position={[0, 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[10, 4, 6]} />
          <meshStandardMaterial color={colors.buildingDark} roughness={0.8} metalness={0.3} />
        </mesh>
        {/* Large doors */}
        <mesh position={[0, 1.5, 3.01]}>
          <planeGeometry args={[6, 3]} />
          <meshStandardMaterial color="#2a2a2a" metalness={0.5} roughness={0.5} />
        </mesh>
        {/* Door frame */}
        <mesh position={[0, 1.5, 3.02]}>
          <planeGeometry args={[6.5, 3.3]} />
          <meshBasicMaterial color={colors.marking} wireframe />
        </mesh>
      </group>

      {/* === RUNWAY === */}
      <group position={[80, 0, 0]} rotation={[0, Math.PI / 6, 0]}>
        {/* Main runway */}
        <mesh position={[0, -0.44, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[25, 150]} />
          <meshStandardMaterial color={colors.runway} roughness={0.6} />
        </mesh>
        {/* Center line */}
        {Array.from({ length: 15 }, (_, i) => (
          <mesh
            key={`centerline-${i}`}
            position={[0, -0.43, -70 + i * 10]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <planeGeometry args={[0.5, 6]} />
            <meshBasicMaterial color={colors.marking} />
          </mesh>
        ))}
        {/* Threshold markings */}
        {[-10, -8, -6, -4, 4, 6, 8, 10].map((x, i) => (
          <mesh
            key={`threshold-${i}`}
            position={[x, -0.43, -72]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <planeGeometry args={[1, 8]} />
            <meshBasicMaterial color={colors.marking} />
          </mesh>
        ))}
        {/* Runway edge lights */}
        {Array.from({ length: 16 }, (_, i) => (
          <React.Fragment key={`light-${i}`}>
            <pointLight
              position={[-13, 0.2, -75 + i * 10]}
              color={i < 3 ? "#ff0000" : colors.light}
              intensity={isDayMode ? 0.1 : 0.5}
              distance={5}
            />
            <pointLight
              position={[13, 0.2, -75 + i * 10]}
              color={i < 3 ? "#ff0000" : colors.light}
              intensity={isDayMode ? 0.1 : 0.5}
              distance={5}
            />
          </React.Fragment>
        ))}
      </group>

      {/* === TAXIWAY === */}
      <mesh position={[50, -0.44, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[8, 80]} />
        <meshStandardMaterial color={colors.asphalt} roughness={0.7} />
      </mesh>
      {/* Taxiway edge markings */}
      <mesh position={[54, -0.43, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.3, 80]} />
        <meshBasicMaterial color="#ffaa00" />
      </mesh>
      <mesh position={[46, -0.43, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.3, 80]} />
        <meshBasicMaterial color="#ffaa00" />
      </mesh>

      {/* === MISSILE LAUNCHER PADS === */}
      {[
        { pos: [-50, 0, 50], rot: 0 },
        { pos: [-70, 0, 20], rot: Math.PI / 4 },
        { pos: [-60, 0, -40], rot: -Math.PI / 6 },
      ].map((pad, i) => (
        <group key={`launcher-pad-${i}`} position={pad.pos as [number, number, number]} rotation={[0, pad.rot, 0]}>
          {/* Concrete pad */}
          <mesh position={[0, -0.44, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[12, 12]} />
            <meshStandardMaterial color={colors.concreteDark} roughness={0.85} />
          </mesh>
          {/* Launcher base */}
          <mesh position={[0, 0.3, 0]} castShadow>
            <cylinderGeometry args={[2, 2.5, 0.6, 8]} />
            <meshStandardMaterial color={colors.metal} metalness={0.7} roughness={0.3} />
          </mesh>
          {/* Launcher arm */}
          <mesh position={[0, 1.5, 1]} rotation={[-Math.PI / 4, 0, 0]} castShadow>
            <boxGeometry args={[1.5, 3, 1]} />
            <meshStandardMaterial color="#3a5a3a" metalness={0.5} roughness={0.5} />
          </mesh>
          {/* Missile tubes */}
          {[0.4, -0.4].map((x, j) => (
            <mesh
              key={`tube-${j}`}
              position={[x, 2.2, 2]}
              rotation={[-Math.PI / 4, 0, 0]}
              castShadow
            >
              <cylinderGeometry args={[0.25, 0.25, 2.5, 12]} />
              <meshStandardMaterial color="#2a2a2a" metalness={0.6} roughness={0.4} />
            </mesh>
          ))}
          {/* Status light */}
          <pointLight
            position={[0, 0.8, 0]}
            color="#00ff00"
            intensity={isDayMode ? 0.3 : 1}
            distance={5}
          />
        </group>
      ))}

      {/* === MOUNTAINS/HILLS === */}
      {[
        { pos: [-150, 0, -120], scale: [40, 25, 35] },
        { pos: [-180, 0, -80], scale: [30, 18, 28] },
        { pos: [-130, 0, -150], scale: [25, 15, 22] },
        { pos: [160, 0, -140], scale: [45, 30, 40] },
        { pos: [140, 0, -180], scale: [35, 22, 30] },
        { pos: [180, 0, 150], scale: [38, 20, 32] },
      ].map((mountain, i) => (
        <group key={`mountain-${i}`} position={mountain.pos as [number, number, number]}>
          {/* Mountain base */}
          <mesh position={[0, mountain.scale[1] / 2, 0]} castShadow receiveShadow>
            <coneGeometry args={[mountain.scale[0], mountain.scale[1], 8]} />
            <meshStandardMaterial color={colors.mountain} roughness={0.9} />
          </mesh>
          {/* Snow cap */}
          {mountain.scale[1] > 20 && (
            <mesh position={[0, mountain.scale[1] * 0.85, 0]} castShadow>
              <coneGeometry args={[mountain.scale[0] * 0.3, mountain.scale[1] * 0.3, 8]} />
              <meshStandardMaterial color={colors.mountainSnow} roughness={0.7} />
            </mesh>
          )}
        </group>
      ))}

      {/* === FOREST CLUSTERS === */}
      {[
        { center: [-100, 60], count: 20 },
        { center: [120, 80], count: 15 },
        { center: [-80, -100], count: 18 },
        { center: [100, -80], count: 12 },
        { center: [-140, 0], count: 25 },
      ].map((forest, fi) => (
        <group key={`forest-${fi}`}>
          {Array.from({ length: forest.count }, (_, i) => {
            const angle = (i / forest.count) * Math.PI * 2 + Math.random() * 0.5;
            const radius = 5 + Math.random() * 20;
            const x = forest.center[0] + Math.cos(angle) * radius;
            const z = forest.center[1] + Math.sin(angle) * radius;
            const height = 3 + Math.random() * 4;
            const width = 1.5 + Math.random() * 1;
            return (
              <group key={`tree-${fi}-${i}`} position={[x, 0, z]}>
                {/* Tree trunk */}
                <mesh position={[0, height / 4, 0]} castShadow>
                  <cylinderGeometry args={[0.2, 0.3, height / 2, 6]} />
                  <meshStandardMaterial color="#4a3728" roughness={0.9} />
                </mesh>
                {/* Tree foliage - layered cones */}
                <mesh position={[0, height * 0.5, 0]} castShadow>
                  <coneGeometry args={[width, height * 0.4, 8]} />
                  <meshStandardMaterial color={colors.tree} roughness={0.8} />
                </mesh>
                <mesh position={[0, height * 0.7, 0]} castShadow>
                  <coneGeometry args={[width * 0.7, height * 0.35, 8]} />
                  <meshStandardMaterial color={colors.tree} roughness={0.8} />
                </mesh>
                <mesh position={[0, height * 0.9, 0]} castShadow>
                  <coneGeometry args={[width * 0.4, height * 0.25, 8]} />
                  <meshStandardMaterial color={colors.tree} roughness={0.8} />
                </mesh>
              </group>
            );
          })}
        </group>
      ))}

      {/* === WATER BODIES === */}
      {/* Lake */}
      <group position={[-120, 0, 100]}>
        <mesh position={[0, -0.4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[25, 32]} />
          <meshStandardMaterial
            color={colors.water}
            transparent
            opacity={0.85}
            metalness={0.3}
            roughness={0.1}
          />
        </mesh>
        {/* Shore */}
        <mesh position={[0, -0.42, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[25, 28, 32]} />
          <meshStandardMaterial color={colors.sand} roughness={0.9} />
        </mesh>
      </group>

      {/* River */}
      <group position={[150, 0, 0]}>
        <mesh position={[0, -0.4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[15, 200]} />
          <meshStandardMaterial
            color={colors.water}
            transparent
            opacity={0.8}
            metalness={0.2}
            roughness={0.2}
          />
        </mesh>
      </group>

      {/* === ROADS === */}
      {/* Main access road */}
      <mesh position={[0, -0.44, 60]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[6, 140]} />
        <meshStandardMaterial color={colors.asphalt} roughness={0.7} />
      </mesh>
      {/* Road markings */}
      {Array.from({ length: 14 }, (_, i) => (
        <mesh
          key={`road-mark-${i}`}
          position={[0, -0.43, -10 + i * 10]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[0.2, 4]} />
          <meshBasicMaterial color={colors.marking} />
        </mesh>
      ))}

      {/* Perimeter road */}
      <mesh position={[0, -0.44, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[42, 46, 64]} />
        <meshStandardMaterial color={colors.asphalt} roughness={0.7} />
      </mesh>

      {/* === WATCH TOWERS === */}
      {[
        [40, 0, 40],
        [-40, 0, 40],
        [40, 0, -40],
        [-40, 0, -40],
      ].map((pos, i) => (
        <group key={`tower-${i}`} position={pos as [number, number, number]}>
          {/* Tower legs */}
          {[
            [0.8, 0.8],
            [-0.8, 0.8],
            [0.8, -0.8],
            [-0.8, -0.8],
          ].map((leg, j) => (
            <mesh key={`leg-${j}`} position={[leg[0], 3, leg[1]]} castShadow>
              <cylinderGeometry args={[0.15, 0.15, 6, 6]} />
              <meshStandardMaterial color={colors.metal} metalness={0.7} roughness={0.3} />
            </mesh>
          ))}
          {/* Platform */}
          <mesh position={[0, 6, 0]} castShadow receiveShadow>
            <boxGeometry args={[3, 0.3, 3]} />
            <meshStandardMaterial color={colors.metal} metalness={0.6} roughness={0.4} />
          </mesh>
          {/* Guard house */}
          <mesh position={[0, 7, 0]} castShadow>
            <boxGeometry args={[2.5, 2, 2.5]} />
            <meshStandardMaterial color={colors.building} roughness={0.7} />
          </mesh>
          {/* Roof */}
          <mesh position={[0, 8.2, 0]} castShadow>
            <coneGeometry args={[2, 0.8, 4]} />
            <meshStandardMaterial color={colors.buildingDark} roughness={0.6} />
          </mesh>
          {/* Spotlight */}
          <spotLight
            position={[0, 7.5, 1.5]}
            angle={Math.PI / 4}
            penumbra={0.5}
            intensity={isDayMode ? 0 : 2}
            distance={50}
            color="#ffffcc"
            target-position={[0, 0, 30]}
            castShadow
          />
        </group>
      ))}

      {/* === VEHICLES (parked) === */}
      {[
        [15, 5],
        [18, 8],
        [12, 8],
        [-20, 5],
      ].map((pos, i) => (
        <group key={`vehicle-${i}`} position={[pos[0], 0, pos[1]]}>
          {/* Vehicle body */}
          <mesh position={[0, 0.6, 0]} castShadow>
            <boxGeometry args={[2, 0.8, 4]} />
            <meshStandardMaterial color="#3a4a3a" roughness={0.7} />
          </mesh>
          {/* Cabin */}
          <mesh position={[0, 1.1, -1]} castShadow>
            <boxGeometry args={[1.8, 0.6, 1.5]} />
            <meshStandardMaterial color="#2a3a2a" roughness={0.6} />
          </mesh>
          {/* Wheels */}
          {[
            [0.9, -1.2],
            [-0.9, -1.2],
            [0.9, 1.2],
            [-0.9, 1.2],
          ].map((wheel, j) => (
            <mesh key={`wheel-${j}`} position={[wheel[0], 0.3, wheel[1]]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.3, 0.3, 0.2, 12]} />
              <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
            </mesh>
          ))}
        </group>
      ))}

      {/* === AMBIENT ENVIRONMENT LIGHTS === */}
      {!isDayMode && (
        <>
          {/* Base area lights */}
          <pointLight position={[0, 10, 0]} color="#ffeecc" intensity={0.3} distance={80} />
          <pointLight position={[20, 5, -20]} color="#ffaa66" intensity={0.5} distance={30} />
          <pointLight position={[-25, 5, -15]} color="#ffaa66" intensity={0.4} distance={25} />
          <pointLight position={[25, 5, 15]} color="#ffaa66" intensity={0.4} distance={25} />
        </>
      )}
    </group>
  );
};

export default Terrain;
