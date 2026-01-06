import React, { useMemo } from "react";
import * as THREE from "three";

interface SkyProps {
  isDayMode: boolean;
}

const Sky: React.FC<SkyProps> = ({ isDayMode }) => {
  const skyColor = isDayMode ? "#87CEEB" : "#0a0a1a";
  const horizonColor = isDayMode ? "#b0d4f1" : "#1a1a2e";

  // Pre-calculate star positions
  const starPositions = useMemo(() => {
    const positions = new Float32Array(200 * 3);
    for (let i = 0; i < 200; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 0.8 + 0.2);
      const r = 350;
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi);
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    return positions;
  }, []);

  return (
    <group>
      {/* Sky dome */}
      <mesh>
        <sphereGeometry args={[400, 16, 8]} />
        <meshBasicMaterial color={skyColor} side={THREE.BackSide} />
      </mesh>

      {/* Sun/Moon */}
      <mesh position={isDayMode ? [150, 120, -100] : [-100, 80, 150]}>
        <sphereGeometry args={[isDayMode ? 12 : 6, 12, 12]} />
        <meshBasicMaterial color={isDayMode ? "#ffffd0" : "#e8e8f0"} />
      </mesh>

      {/* Sun glow (day only) */}
      {isDayMode && (
        <mesh position={[150, 120, -100]}>
          <sphereGeometry args={[20, 12, 12]} />
          <meshBasicMaterial color="#ffffa0" transparent opacity={0.3} />
        </mesh>
      )}

      {/* Stars (night only) */}
      {!isDayMode && (
        <points>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={200}
              array={starPositions}
              itemSize={3}
            />
          </bufferGeometry>
          <pointsMaterial color="#ffffff" size={1.5} sizeAttenuation={false} />
        </points>
      )}

      {/* Clouds (day only) */}
      {isDayMode && (
        <group>
          <mesh position={[80, 60, -50]} scale={[30, 1, 15]}>
            <boxGeometry args={[1, 0.3, 1]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.6} />
          </mesh>
          <mesh position={[-60, 70, 40]} scale={[25, 1, 12]}>
            <boxGeometry args={[1, 0.3, 1]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.6} />
          </mesh>
          <mesh position={[20, 55, 80]} scale={[20, 1, 10]}>
            <boxGeometry args={[1, 0.3, 1]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.6} />
          </mesh>
        </group>
      )}
    </group>
  );
};

export default Sky;
