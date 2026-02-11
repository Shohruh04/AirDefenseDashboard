import React, { useMemo } from "react";
import * as THREE from "three";

interface TerrainProps {
  isDayMode: boolean;
}

const seededRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

const Terrain: React.FC<TerrainProps> = ({ isDayMode }) => {
  const colors = useMemo(
    () => ({
      ground: isDayMode ? "#3d5a3d" : "#1a2518",
      concrete: isDayMode ? "#707070" : "#404040",
      concreteDark: isDayMode ? "#505050" : "#303030",
      asphalt: isDayMode ? "#3a3a3a" : "#1a1a1a",
      building: isDayMode ? "#5d5d5d" : "#2d2d2d",
      buildingDark: isDayMode ? "#4a4a4a" : "#222222",
      metal: isDayMode ? "#606060" : "#404040",
      mountain: isDayMode ? "#5a4a3f" : "#3a3028",
      mountainSnow: isDayMode ? "#f0f0f0" : "#888888",
      tree: isDayMode ? "#1e4d1e" : "#0a200a",
      runway: isDayMode ? "#2a2a2a" : "#151515",
      marking: isDayMode ? "#e0e0e0" : "#555555",
      fence: isDayMode ? "#4a4a4a" : "#2a2a2a",
      gridColor: isDayMode ? "#00bb66" : "#00ff88",
      gridOpacity: isDayMode ? 0.06 : 0.12,
    }),
    [isDayMode]
  );

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

  const mountainData = useMemo(() => [
    { pos: [-140, 0, -110] as [number, number, number], radius: 35, height: 22 },
    { pos: [-170, 0, -70] as [number, number, number], radius: 28, height: 16 },
    { pos: [150, 0, -130] as [number, number, number], radius: 40, height: 28 },
    { pos: [130, 0, -170] as [number, number, number], radius: 32, height: 20 },
    { pos: [170, 0, 140] as [number, number, number], radius: 35, height: 18 },
  ], []);

  return (
    <group>
      {/* Main Ground */}
      <mesh position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[500, 500]} />
        <meshLambertMaterial color={colors.ground} />
      </mesh>

      {/* Tactical Grid */}
      <group position={[0, -0.48, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        {[-150, -75, 0, 75, 150].map((pos, i) => (
          <React.Fragment key={`grid-${i}`}>
            <mesh position={[pos, 0, 0.01]}>
              <planeGeometry args={[0.3, 300]} />
              <meshBasicMaterial color={colors.gridColor} transparent opacity={colors.gridOpacity} />
            </mesh>
            <mesh position={[0, pos, 0.01]}>
              <planeGeometry args={[300, 0.3]} />
              <meshBasicMaterial color={colors.gridColor} transparent opacity={colors.gridOpacity} />
            </mesh>
          </React.Fragment>
        ))}
      </group>

      {/* Military Base — concrete pad */}
      <mesh position={[0, -0.45, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[45, 32]} />
        <meshStandardMaterial color={colors.concrete} roughness={0.9} metalness={0.05} />
      </mesh>

      {/* Helipad */}
      <group position={[-12, -0.44, -12]} rotation={[-Math.PI / 2, 0, 0]}>
        <mesh>
          <ringGeometry args={[3, 4, 24]} />
          <meshBasicMaterial color={colors.marking} />
        </mesh>
        <mesh>
          <planeGeometry args={[6, 0.8]} />
          <meshBasicMaterial color={colors.marking} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <planeGeometry args={[6, 0.8]} />
          <meshBasicMaterial color={colors.marking} />
        </mesh>
      </group>

      {/* Perimeter fence */}
      <mesh position={[0, 0.6, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[44, 44.3, 48]} />
        <meshBasicMaterial color={colors.fence} />
      </mesh>
      <mesh position={[0, 1.0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[44, 44.2, 48]} />
        <meshBasicMaterial color={colors.fence} />
      </mesh>

      {/* Command Center — PBR */}
      <group position={[18, 0, -18]}>
        <mesh position={[0, 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[10, 4, 7]} />
          <meshStandardMaterial color={colors.building} roughness={0.8} metalness={0.1} />
        </mesh>
        <mesh position={[0, 4.2, 0]} castShadow>
          <boxGeometry args={[11, 0.4, 8]} />
          <meshStandardMaterial color={colors.buildingDark} roughness={0.7} metalness={0.15} />
        </mesh>
        {[-3, 0, 3].map((x, i) => (
          <mesh key={`cmd-win-${i}`} position={[x, 2.5, 3.51]}>
            <planeGeometry args={[1.5, 1.2]} />
            <meshBasicMaterial color={isDayMode ? "#6ba3d6" : "#ffaa44"} transparent opacity={0.8} />
          </mesh>
        ))}
        {/* Antenna */}
        <mesh position={[3.5, 5.5, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.08, 3, 6]} />
          <meshStandardMaterial color={colors.metal} metalness={0.7} roughness={0.3} />
        </mesh>
        {/* Satellite dish */}
        <mesh position={[-3, 4.8, 2]} rotation={[0.3, 0.4, 0]} castShadow>
          <coneGeometry args={[1.2, 0.6, 12]} />
          <meshStandardMaterial color={colors.metal} metalness={0.8} roughness={0.2} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* Barracks — PBR */}
      <group position={[-22, 0, -12]}>
        <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
          <boxGeometry args={[6, 3, 12]} />
          <meshStandardMaterial color={colors.building} roughness={0.8} metalness={0.1} />
        </mesh>
        <mesh position={[0, 3.1, 0]} castShadow>
          <boxGeometry args={[7, 0.3, 13]} />
          <meshStandardMaterial color={colors.buildingDark} roughness={0.7} metalness={0.15} />
        </mesh>
        {[-4, -1.5, 1, 3.5].map((z, i) => (
          <mesh key={`bar-win-${i}`} position={[3.01, 1.5, z]}>
            <planeGeometry args={[0.8, 1]} />
            <meshBasicMaterial color={isDayMode ? "#6ba3d6" : "#ffaa44"} transparent opacity={0.7} />
          </mesh>
        ))}
      </group>

      {/* Hangar — PBR */}
      <group position={[22, 0, 14]}>
        <mesh position={[0, 2.5, 0]} castShadow receiveShadow>
          <boxGeometry args={[14, 5, 10]} />
          <meshStandardMaterial color={colors.buildingDark} roughness={0.75} metalness={0.15} />
        </mesh>
        <mesh position={[0, 2, 5.01]}>
          <planeGeometry args={[10, 4]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.9} metalness={0.05} />
        </mesh>
        <mesh position={[0, 5.3, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[5.5, 5.5, 14, 16, 1, false, 0, Math.PI]} />
          <meshStandardMaterial color={colors.metal} metalness={0.6} roughness={0.35} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* Runway */}
      <group position={[75, 0, 0]} rotation={[0, Math.PI / 8, 0]}>
        <mesh position={[0, -0.44, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[20, 120]} />
          <meshStandardMaterial color={colors.runway} roughness={0.95} metalness={0} />
        </mesh>
        {Array.from({ length: 10 }, (_, i) => (
          <mesh key={`cl-${i}`} position={[0, -0.43, -55 + i * 12]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.4, 6]} />
            <meshBasicMaterial color={colors.marking} />
          </mesh>
        ))}
        {[-7, -5, -3, 3, 5, 7].map((x, i) => (
          <mesh key={`th-${i}`} position={[x, -0.43, -57]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[1.2, 6]} />
            <meshBasicMaterial color={colors.marking} />
          </mesh>
        ))}
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

      {/* Taxiway */}
      <mesh position={[45, -0.44, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[6, 60]} />
        <meshStandardMaterial color={colors.asphalt} roughness={0.95} metalness={0} />
      </mesh>
      <mesh position={[48, -0.43, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.2, 60]} />
        <meshBasicMaterial color="#ffaa00" />
      </mesh>
      <mesh position={[42, -0.43, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.2, 60]} />
        <meshBasicMaterial color="#ffaa00" />
      </mesh>

      {/* Missile Launcher Pads — PBR */}
      {[
        { pos: [-45, 0, 40] as [number, number, number], rot: 0 },
        { pos: [-60, 0, 15] as [number, number, number], rot: Math.PI / 5 },
        { pos: [-50, 0, -35] as [number, number, number], rot: -Math.PI / 6 },
      ].map((pad, i) => (
        <group key={`pad-${i}`} position={pad.pos} rotation={[0, pad.rot, 0]}>
          <mesh position={[0, -0.44, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[10, 10]} />
            <meshStandardMaterial color={colors.concreteDark} roughness={0.9} metalness={0.05} />
          </mesh>
          <mesh position={[0, 0.4, 0]} castShadow>
            <cylinderGeometry args={[1.5, 2, 0.8, 8]} />
            <meshStandardMaterial color={colors.metal} metalness={0.6} roughness={0.4} />
          </mesh>
          <mesh position={[0, 1.5, 0.8]} rotation={[-Math.PI / 4, 0, 0]} castShadow>
            <boxGeometry args={[1.2, 2.5, 0.8]} />
            <meshStandardMaterial color="#3a4a3a" metalness={0.4} roughness={0.5} />
          </mesh>
          <mesh position={[0.35, 2.1, 1.6]} rotation={[-Math.PI / 4, 0, 0]} castShadow>
            <cylinderGeometry args={[0.2, 0.2, 2, 8]} />
            <meshStandardMaterial color="#2a2a2a" metalness={0.5} roughness={0.4} />
          </mesh>
          <mesh position={[-0.35, 2.1, 1.6]} rotation={[-Math.PI / 4, 0, 0]} castShadow>
            <cylinderGeometry args={[0.2, 0.2, 2, 8]} />
            <meshStandardMaterial color="#2a2a2a" metalness={0.5} roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.9, 0]}>
            <sphereGeometry args={[0.15, 8, 8]} />
            <meshBasicMaterial color="#00ff00" />
          </mesh>
        </group>
      ))}

      {/* Mountains */}
      {mountainData.map((m, i) => (
        <group key={`mt-${i}`} position={m.pos}>
          <mesh position={[0, m.height / 2, 0]} castShadow receiveShadow>
            <coneGeometry args={[m.radius, m.height, 8]} />
            <meshStandardMaterial color={colors.mountain} roughness={0.9} metalness={0} />
          </mesh>
          {m.height > 18 && (
            <mesh position={[0, m.height * 0.82, 0]} castShadow>
              <coneGeometry args={[m.radius * 0.25, m.height * 0.25, 8]} />
              <meshStandardMaterial color={colors.mountainSnow} roughness={0.8} metalness={0} />
            </mesh>
          )}
        </group>
      ))}

      {/* Trees */}
      {treeData.map((tree, i) => (
        <group key={`tree-${i}`} position={tree.position} scale={tree.scale}>
          <mesh position={[0, 1.5, 0]} castShadow>
            <cylinderGeometry args={[0.15, 0.25, 3, 6]} />
            <meshStandardMaterial color="#4a3728" roughness={0.9} metalness={0} />
          </mesh>
          <mesh position={[0, 4, 0]} castShadow>
            <coneGeometry args={[1.8, 5, 6]} />
            <meshStandardMaterial color={colors.tree} roughness={0.85} metalness={0} />
          </mesh>
        </group>
      ))}

      {/* Perimeter road */}
      <mesh position={[0, -0.44, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[48, 52, 48]} />
        <meshStandardMaterial color={colors.asphalt} roughness={0.95} metalness={0} />
      </mesh>

      {/* Watch Towers — PBR */}
      {([
        [35, 0, 35],
        [-35, 0, 35],
        [35, 0, -35],
        [-35, 0, -35],
      ] as [number, number, number][]).map((pos, i) => (
        <group key={`wt-${i}`} position={pos}>
          <mesh position={[0, 3, 0]} castShadow>
            <boxGeometry args={[0.6, 6, 0.6]} />
            <meshStandardMaterial color={colors.metal} metalness={0.6} roughness={0.35} />
          </mesh>
          <mesh position={[0, 6, 0]} castShadow>
            <boxGeometry args={[2.5, 0.2, 2.5]} />
            <meshStandardMaterial color={colors.metal} metalness={0.5} roughness={0.4} />
          </mesh>
          <mesh position={[0, 7, 0]} castShadow>
            <boxGeometry args={[2, 1.8, 2]} />
            <meshStandardMaterial color={colors.building} roughness={0.8} metalness={0.1} />
          </mesh>
          <mesh position={[0, 8.1, 0]} castShadow>
            <coneGeometry args={[1.6, 0.6, 4]} />
            <meshStandardMaterial color={colors.buildingDark} roughness={0.75} metalness={0.1} />
          </mesh>
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

      {/* Military Vehicles — PBR */}
      {([
        [12, 4],
        [15, 7],
        [-18, 4],
      ] as [number, number][]).map((pos, i) => (
        <group key={`veh-${i}`} position={[pos[0], 0, pos[1]]}>
          <mesh position={[0, 0.5, 0]} castShadow>
            <boxGeometry args={[1.8, 0.7, 3.5]} />
            <meshStandardMaterial color="#3a4a3a" metalness={0.3} roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.9, -0.8]} castShadow>
            <boxGeometry args={[1.6, 0.5, 1.2]} />
            <meshStandardMaterial color="#2a3a2a" metalness={0.3} roughness={0.6} />
          </mesh>
        </group>
      ))}

      {/* Fuel Tanks — metallic PBR */}
      <group position={[-30, 0, 18]}>
        <mesh position={[0, 2.5, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[2.5, 2.5, 8, 16]} />
          <meshStandardMaterial color="#d0d0d0" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[6, 2.5, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[2.5, 2.5, 8, 16]} />
          <meshStandardMaterial color="#d0d0d0" metalness={0.7} roughness={0.3} />
        </mesh>
        {[-3, 3, 3 + 6, 9].map((x, i) => (
          <mesh key={`leg-${i}`} position={[x % 6 === 0 ? x - 6 : x, 1, 0]} castShadow>
            <boxGeometry args={[0.3, 2, 0.3]} />
            <meshStandardMaterial color={colors.metal} metalness={0.5} roughness={0.4} />
          </mesh>
        ))}
      </group>

      {/* Communication Tower — metallic PBR */}
      <group position={[30, 0, -30]}>
        <mesh position={[0, 10, 0]} castShadow>
          <cylinderGeometry args={[0.3, 0.8, 20, 8]} />
          <meshStandardMaterial color={colors.metal} metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[1.5, 15, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <coneGeometry args={[1, 0.5, 12]} />
          <meshStandardMaterial color="#e0e0e0" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[-1.2, 12, 0]} rotation={[0, 0, -Math.PI / 2]} castShadow>
          <coneGeometry args={[0.8, 0.4, 12]} />
          <meshStandardMaterial color="#e0e0e0" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[0, 20.2, 0]}>
          <sphereGeometry args={[0.25, 8, 8]} />
          <meshBasicMaterial color="#ff0000" />
        </mesh>
        {!isDayMode && (
          <pointLight position={[0, 20.2, 0]} color="#ff0000" intensity={0.5} distance={15} />
        )}
      </group>

      {/* Base Lighting (Night only) */}
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
