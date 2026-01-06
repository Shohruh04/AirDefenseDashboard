import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface TerrainProps {
  isDayMode: boolean;
}

// Seeded random for consistent results
const seededRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

const Terrain: React.FC<TerrainProps> = ({ isDayMode }) => {
  const waterRef = useRef<THREE.Mesh>(null);

  // Animate water
  useFrame((state) => {
    if (waterRef.current) {
      const time = state.clock.elapsedTime;
      waterRef.current.position.y = -0.4 + Math.sin(time * 0.5) * 0.02;
    }
  });

  // Colors based on day/night mode
  const colors = useMemo(
    () => ({
      ground: isDayMode ? "#3d5a3d" : "#1a2518",
      concrete: isDayMode ? "#707070" : "#404040",
      concreteDark: isDayMode ? "#505050" : "#303030",
      asphalt: isDayMode ? "#3a3a3a" : "#1a1a1a",
      water: isDayMode ? "#2196F3" : "#0d47a1",
      building: isDayMode ? "#5d5d5d" : "#2d2d2d",
      buildingDark: isDayMode ? "#4a4a4a" : "#222222",
      metal: isDayMode ? "#606060" : "#404040",
      sand: isDayMode ? "#c2b280" : "#5a5030",
      mountain: isDayMode ? "#5a4a3f" : "#3a3028",
      mountainSnow: isDayMode ? "#f0f0f0" : "#888888",
      tree: isDayMode ? "#1e4d1e" : "#0a200a",
      treeDark: isDayMode ? "#163816" : "#081408",
      runway: isDayMode ? "#2a2a2a" : "#151515",
      marking: isDayMode ? "#e0e0e0" : "#555555",
      fence: isDayMode ? "#4a4a4a" : "#2a2a2a",
    }),
    [isDayMode]
  );

  // Pre-calculate tree positions using seeded random
  const treeData = useMemo(() => {
    const trees: Array<{ position: [number, number, number]; scale: number }> = [];
    const forests = [
      { center: [-90, 70], count: 12, seed: 1 },
      { center: [110, 90], count: 10, seed: 2 },
      { center: [-70, -90], count: 11, seed: 3 },
      { center: [90, -70], count: 8, seed: 4 },
    ];

    forests.forEach((forest) => {
      for (let i = 0; i < forest.count; i++) {
        const angle = (i / forest.count) * Math.PI * 2;
        const radius = 8 + seededRandom(forest.seed * 100 + i) * 15;
        const x = forest.center[0] + Math.cos(angle) * radius;
        const z = forest.center[1] + Math.sin(angle) * radius;
        const scale = 0.8 + seededRandom(forest.seed * 200 + i) * 0.6;
        trees.push({ position: [x, 0, z], scale });
      }
    });

    return trees;
  }, []);

  // Pre-calculate mountain data
  const mountainData = useMemo(() => [
    { pos: [-140, 0, -110] as [number, number, number], radius: 35, height: 22 },
    { pos: [-170, 0, -70] as [number, number, number], radius: 28, height: 16 },
    { pos: [150, 0, -130] as [number, number, number], radius: 40, height: 28 },
    { pos: [130, 0, -170] as [number, number, number], radius: 32, height: 20 },
    { pos: [170, 0, 140] as [number, number, number], radius: 35, height: 18 },
  ], []);

  return (
    <group>
      {/* === MAIN GROUND PLANE === */}
      <mesh position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[500, 500]} />
        <meshLambertMaterial color={colors.ground} />
      </mesh>

      {/* === TACTICAL GRID === */}
      <group position={[0, -0.48, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        {[-150, -75, 0, 75, 150].map((pos, i) => (
          <React.Fragment key={`grid-${i}`}>
            <mesh position={[pos, 0, 0.01]}>
              <planeGeometry args={[0.3, 300]} />
              <meshBasicMaterial color="#00ff88" transparent opacity={isDayMode ? 0.06 : 0.12} />
            </mesh>
            <mesh position={[0, pos, 0.01]}>
              <planeGeometry args={[300, 0.3]} />
              <meshBasicMaterial color="#00ff88" transparent opacity={isDayMode ? 0.06 : 0.12} />
            </mesh>
          </React.Fragment>
        ))}
      </group>

      {/* === MILITARY BASE === */}
      <group position={[0, 0, 0]}>
        {/* Main concrete pad */}
        <mesh position={[0, -0.45, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[45, 32]} />
          <meshLambertMaterial color={colors.concrete} />
        </mesh>

        {/* Helipad */}
        <mesh position={[-12, -0.44, -12]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[3, 4, 24]} />
          <meshBasicMaterial color={colors.marking} />
        </mesh>
        <mesh position={[-12, -0.44, -12]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[6, 0.8]} />
          <meshBasicMaterial color={colors.marking} />
        </mesh>
        <mesh position={[-12, -0.44, -12]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
          <planeGeometry args={[6, 0.8]} />
          <meshBasicMaterial color={colors.marking} />
        </mesh>

        {/* Perimeter fence - simplified */}
        <mesh position={[0, 0.6, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[44, 44.3, 48]} />
          <meshBasicMaterial color={colors.fence} />
        </mesh>
        <mesh position={[0, 1.0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[44, 44.2, 48]} />
          <meshBasicMaterial color={colors.fence} />
        </mesh>
      </group>

      {/* === COMMAND CENTER === */}
      <group position={[18, 0, -18]}>
        <mesh position={[0, 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[10, 4, 7]} />
          <meshLambertMaterial color={colors.building} />
        </mesh>
        <mesh position={[0, 4.2, 0]} castShadow>
          <boxGeometry args={[11, 0.4, 8]} />
          <meshLambertMaterial color={colors.buildingDark} />
        </mesh>
        {/* Windows */}
        {[-3, 0, 3].map((x, i) => (
          <mesh key={`cmd-win-${i}`} position={[x, 2.5, 3.51]}>
            <planeGeometry args={[1.5, 1.2]} />
            <meshBasicMaterial color={isDayMode ? "#6ba3d6" : "#ffaa44"} transparent opacity={0.8} />
          </mesh>
        ))}
        {/* Antenna */}
        <mesh position={[3.5, 5.5, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.08, 3, 6]} />
          <meshLambertMaterial color={colors.metal} />
        </mesh>
        {/* Satellite dish */}
        <mesh position={[-3, 4.8, 2]} rotation={[0.3, 0.4, 0]} castShadow>
          <coneGeometry args={[1.2, 0.6, 12]} />
          <meshStandardMaterial color={colors.metal} metalness={0.8} roughness={0.2} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* === BARRACKS === */}
      <group position={[-22, 0, -12]}>
        <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
          <boxGeometry args={[6, 3, 12]} />
          <meshLambertMaterial color={colors.building} />
        </mesh>
        <mesh position={[0, 3.1, 0]} castShadow>
          <boxGeometry args={[7, 0.3, 13]} />
          <meshLambertMaterial color={colors.buildingDark} />
        </mesh>
        {[-4, -1.5, 1, 3.5].map((z, i) => (
          <mesh key={`bar-win-${i}`} position={[3.01, 1.5, z]}>
            <planeGeometry args={[0.8, 1]} />
            <meshBasicMaterial color={isDayMode ? "#6ba3d6" : "#ffaa44"} transparent opacity={0.7} />
          </mesh>
        ))}
      </group>

      {/* === HANGAR === */}
      <group position={[22, 0, 14]}>
        <mesh position={[0, 2.5, 0]} castShadow receiveShadow>
          <boxGeometry args={[14, 5, 10]} />
          <meshLambertMaterial color={colors.buildingDark} />
        </mesh>
        {/* Hangar door */}
        <mesh position={[0, 2, 5.01]}>
          <planeGeometry args={[10, 4]} />
          <meshLambertMaterial color="#1a1a1a" />
        </mesh>
        {/* Curved roof */}
        <mesh position={[0, 5.3, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[5.5, 5.5, 14, 16, 1, false, 0, Math.PI]} />
          <meshLambertMaterial color={colors.metal} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* === RUNWAY === */}
      <group position={[75, 0, 0]} rotation={[0, Math.PI / 8, 0]}>
        <mesh position={[0, -0.44, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[20, 120]} />
          <meshLambertMaterial color={colors.runway} />
        </mesh>
        {/* Center line */}
        {Array.from({ length: 10 }, (_, i) => (
          <mesh key={`cl-${i}`} position={[0, -0.43, -55 + i * 12]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.4, 6]} />
            <meshBasicMaterial color={colors.marking} />
          </mesh>
        ))}
        {/* Threshold */}
        {[-7, -5, -3, 3, 5, 7].map((x, i) => (
          <mesh key={`th-${i}`} position={[x, -0.43, -57]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[1.2, 6]} />
            <meshBasicMaterial color={colors.marking} />
          </mesh>
        ))}
        {/* Edge lights - reduced count */}
        {Array.from({ length: 6 }, (_, i) => (
          <React.Fragment key={`rl-${i}`}>
            <mesh position={[-10.5, 0.1, -55 + i * 22]}>
              <sphereGeometry args={[0.2, 8, 8]} />
              <meshBasicMaterial color={i === 0 ? "#ff3333" : "#ffff88"} />
            </mesh>
            <mesh position={[10.5, 0.1, -55 + i * 22]}>
              <sphereGeometry args={[0.2, 8, 8]} />
              <meshBasicMaterial color={i === 0 ? "#ff3333" : "#ffff88"} />
            </mesh>
          </React.Fragment>
        ))}
      </group>

      {/* === TAXIWAY === */}
      <mesh position={[45, -0.44, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[6, 60]} />
        <meshLambertMaterial color={colors.asphalt} />
      </mesh>
      {/* Edge markings */}
      <mesh position={[48, -0.43, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.2, 60]} />
        <meshBasicMaterial color="#ffaa00" />
      </mesh>
      <mesh position={[42, -0.43, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.2, 60]} />
        <meshBasicMaterial color="#ffaa00" />
      </mesh>

      {/* === MISSILE LAUNCHER PADS === */}
      {[
        { pos: [-45, 0, 40] as [number, number, number], rot: 0 },
        { pos: [-60, 0, 15] as [number, number, number], rot: Math.PI / 5 },
        { pos: [-50, 0, -35] as [number, number, number], rot: -Math.PI / 6 },
      ].map((pad, i) => (
        <group key={`pad-${i}`} position={pad.pos} rotation={[0, pad.rot, 0]}>
          <mesh position={[0, -0.44, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[10, 10]} />
            <meshLambertMaterial color={colors.concreteDark} />
          </mesh>
          {/* Launcher */}
          <mesh position={[0, 0.4, 0]} castShadow>
            <cylinderGeometry args={[1.5, 2, 0.8, 8]} />
            <meshStandardMaterial color={colors.metal} metalness={0.6} roughness={0.4} />
          </mesh>
          <mesh position={[0, 1.5, 0.8]} rotation={[-Math.PI / 4, 0, 0]} castShadow>
            <boxGeometry args={[1.2, 2.5, 0.8]} />
            <meshLambertMaterial color="#3a4a3a" />
          </mesh>
          {/* Missile tubes */}
          <mesh position={[0.35, 2.1, 1.6]} rotation={[-Math.PI / 4, 0, 0]} castShadow>
            <cylinderGeometry args={[0.2, 0.2, 2, 8]} />
            <meshLambertMaterial color="#2a2a2a" />
          </mesh>
          <mesh position={[-0.35, 2.1, 1.6]} rotation={[-Math.PI / 4, 0, 0]} castShadow>
            <cylinderGeometry args={[0.2, 0.2, 2, 8]} />
            <meshLambertMaterial color="#2a2a2a" />
          </mesh>
          {/* Status indicator */}
          <mesh position={[0, 0.9, 0]}>
            <sphereGeometry args={[0.15, 8, 8]} />
            <meshBasicMaterial color="#00ff00" />
          </mesh>
        </group>
      ))}

      {/* === MOUNTAINS === */}
      {mountainData.map((m, i) => (
        <group key={`mt-${i}`} position={m.pos}>
          <mesh position={[0, m.height / 2, 0]} castShadow receiveShadow>
            <coneGeometry args={[m.radius, m.height, 6]} />
            <meshLambertMaterial color={colors.mountain} />
          </mesh>
          {m.height > 18 && (
            <mesh position={[0, m.height * 0.82, 0]} castShadow>
              <coneGeometry args={[m.radius * 0.25, m.height * 0.25, 6]} />
              <meshLambertMaterial color={colors.mountainSnow} />
            </mesh>
          )}
        </group>
      ))}

      {/* === TREES - Simplified === */}
      {treeData.map((tree, i) => (
        <group key={`tree-${i}`} position={tree.position} scale={tree.scale}>
          {/* Trunk */}
          <mesh position={[0, 1.5, 0]} castShadow>
            <cylinderGeometry args={[0.15, 0.25, 3, 6]} />
            <meshLambertMaterial color="#4a3728" />
          </mesh>
          {/* Foliage - single cone for performance */}
          <mesh position={[0, 4, 0]} castShadow>
            <coneGeometry args={[1.8, 5, 6]} />
            <meshLambertMaterial color={colors.tree} />
          </mesh>
        </group>
      ))}

      {/* === WATER === */}
      {/* Lake */}
      <group position={[-100, 0, 90]}>
        <mesh ref={waterRef} position={[0, -0.4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[20, 24]} />
          <meshStandardMaterial
            color={colors.water}
            transparent
            opacity={0.85}
            metalness={0.2}
            roughness={0.1}
          />
        </mesh>
        <mesh position={[0, -0.42, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[20, 23, 24]} />
          <meshLambertMaterial color={colors.sand} />
        </mesh>
      </group>

      {/* River */}
      <mesh position={[140, -0.4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[12, 180]} />
        <meshStandardMaterial color={colors.water} transparent opacity={0.8} metalness={0.15} roughness={0.15} />
      </mesh>

      {/* === ROADS === */}
      <mesh position={[0, -0.44, 55]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[5, 110]} />
        <meshLambertMaterial color={colors.asphalt} />
      </mesh>
      {/* Road markings */}
      {Array.from({ length: 10 }, (_, i) => (
        <mesh key={`rm-${i}`} position={[0, -0.43, 5 + i * 10]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.15, 4]} />
          <meshBasicMaterial color={colors.marking} />
        </mesh>
      ))}

      {/* Perimeter road */}
      <mesh position={[0, -0.44, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[48, 52, 48]} />
        <meshLambertMaterial color={colors.asphalt} />
      </mesh>

      {/* === WATCH TOWERS === */}
      {[
        [35, 0, 35],
        [-35, 0, 35],
        [35, 0, -35],
        [-35, 0, -35],
      ].map((pos, i) => (
        <group key={`wt-${i}`} position={pos as [number, number, number]}>
          {/* Tower structure - simplified */}
          <mesh position={[0, 3, 0]} castShadow>
            <boxGeometry args={[0.6, 6, 0.6]} />
            <meshLambertMaterial color={colors.metal} />
          </mesh>
          {/* Platform */}
          <mesh position={[0, 6, 0]} castShadow>
            <boxGeometry args={[2.5, 0.2, 2.5]} />
            <meshLambertMaterial color={colors.metal} />
          </mesh>
          {/* Guard box */}
          <mesh position={[0, 7, 0]} castShadow>
            <boxGeometry args={[2, 1.8, 2]} />
            <meshLambertMaterial color={colors.building} />
          </mesh>
          {/* Roof */}
          <mesh position={[0, 8.1, 0]} castShadow>
            <coneGeometry args={[1.6, 0.6, 4]} />
            <meshLambertMaterial color={colors.buildingDark} />
          </mesh>
          {/* Search light */}
          {!isDayMode && (
            <spotLight
              position={[0, 7.2, 1.2]}
              angle={Math.PI / 5}
              penumbra={0.6}
              intensity={1.5}
              distance={40}
              color="#ffffcc"
              castShadow={false}
            />
          )}
        </group>
      ))}

      {/* === VEHICLES === */}
      {[
        [12, 4],
        [15, 7],
        [-18, 4],
      ].map((pos, i) => (
        <group key={`veh-${i}`} position={[pos[0], 0, pos[1]]}>
          <mesh position={[0, 0.5, 0]} castShadow>
            <boxGeometry args={[1.8, 0.7, 3.5]} />
            <meshLambertMaterial color="#3a4a3a" />
          </mesh>
          <mesh position={[0, 0.9, -0.8]} castShadow>
            <boxGeometry args={[1.6, 0.5, 1.2]} />
            <meshLambertMaterial color="#2a3a2a" />
          </mesh>
        </group>
      ))}

      {/* === FUEL TANKS === */}
      <group position={[-30, 0, 18]}>
        <mesh position={[0, 2.5, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[2.5, 2.5, 8, 16]} />
          <meshStandardMaterial color="#d0d0d0" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[6, 2.5, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[2.5, 2.5, 8, 16]} />
          <meshStandardMaterial color="#d0d0d0" metalness={0.7} roughness={0.3} />
        </mesh>
        {/* Support legs */}
        {[-3, 3, 3 + 6, 9].map((x, i) => (
          <mesh key={`leg-${i}`} position={[x % 6 === 0 ? x - 6 : x, 1, 0]} castShadow>
            <boxGeometry args={[0.3, 2, 0.3]} />
            <meshLambertMaterial color={colors.metal} />
          </mesh>
        ))}
      </group>

      {/* === COMMUNICATION TOWER === */}
      <group position={[30, 0, -30]}>
        <mesh position={[0, 10, 0]} castShadow>
          <cylinderGeometry args={[0.3, 0.8, 20, 6]} />
          <meshStandardMaterial color={colors.metal} metalness={0.7} roughness={0.3} />
        </mesh>
        {/* Antenna dishes */}
        <mesh position={[1.5, 15, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <coneGeometry args={[1, 0.5, 12]} />
          <meshStandardMaterial color="#e0e0e0" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[-1.2, 12, 0]} rotation={[0, 0, -Math.PI / 2]} castShadow>
          <coneGeometry args={[0.8, 0.4, 12]} />
          <meshStandardMaterial color="#e0e0e0" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Red warning light */}
        <mesh position={[0, 20.2, 0]}>
          <sphereGeometry args={[0.25, 8, 8]} />
          <meshBasicMaterial color="#ff0000" />
        </mesh>
        {!isDayMode && (
          <pointLight position={[0, 20.2, 0]} color="#ff0000" intensity={0.5} distance={15} />
        )}
      </group>

      {/* === BASE LIGHTING (Night only) === */}
      {!isDayMode && (
        <>
          <pointLight position={[0, 8, 0]} color="#ffeecc" intensity={0.2} distance={60} />
          <pointLight position={[18, 4, -18]} color="#ffaa66" intensity={0.3} distance={20} />
          <pointLight position={[-22, 4, -12]} color="#ffaa66" intensity={0.2} distance={15} />
        </>
      )}
    </group>
  );
};

export default Terrain;
