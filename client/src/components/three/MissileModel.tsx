import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Line } from "@react-three/drei";
import { type Missile } from "../../lib/simulation";

interface MissileModelProps {
  missile: Missile;
}

const MissileModel: React.FC<MissileModelProps> = ({ missile }) => {
  const groupRef = useRef<THREE.Group>(null);
  const trailPointsRef = useRef<THREE.Vector3[]>([]);
  const [, forceUpdate] = React.useReducer((x) => x + 1, 0);

  // Convert lat/lng to 3D coordinates
  const x = (missile.currentPosition.lng - 10) * 3;
  const z = -(missile.currentPosition.lat - 50) * 3;
  const y = missile.currentPosition.altitude / 1000;

  const targetX = (missile.targetPosition.lng - 10) * 3;
  const targetZ = -(missile.targetPosition.lat - 50) * 3;
  const targetY = missile.targetPosition.altitude / 1000;

  useFrame(() => {
    if (groupRef.current) {
      // Rotate missile to face target
      groupRef.current.lookAt(new THREE.Vector3(targetX, targetY, targetZ));

      // Update trail
      const currentPos = new THREE.Vector3(x, y, z);
      trailPointsRef.current.push(currentPos.clone());

      // Keep only last 20 points
      if (trailPointsRef.current.length > 20) {
        trailPointsRef.current.shift();
      }

      // Force re-render to update Line component
      if (trailPointsRef.current.length > 1 && Math.random() < 0.3) {
        forceUpdate();
      }
    }
  });

  // Create fresh array for Line component to detect changes
  const trailPoints = [...trailPointsRef.current];

  return (
    <group ref={groupRef} position={[x, y, z]}>
      {/* Missile body */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.1, 0.1, 1, 8]} />
        <meshStandardMaterial
          color="#ff4444"
          emissive="#ff0000"
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* Missile warhead (cone) */}
      <mesh position={[0.6, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.1, 0.4, 8]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#ff6666"
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* Fins */}
      {[0, 1, 2, 3].map((i) => (
        <mesh
          key={i}
          position={[-0.3, 0, 0]}
          rotation={[0, 0, (Math.PI / 2) * i]}
        >
          <boxGeometry args={[0.05, 0.3, 0.02]} />
          <meshStandardMaterial color="#444444" />
        </mesh>
      ))}

      {/* Flame/exhaust */}
      <mesh position={[-0.6, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <coneGeometry args={[0.08, 0.4, 6]} />
        <meshBasicMaterial color="#ffaa00" transparent opacity={0.8} />
      </mesh>

      {/* Glow effect */}
      <pointLight
        position={[0, 0, 0]}
        color="#ff4444"
        intensity={2}
        distance={5}
      />

      {/* Trail using drei Line component */}
      {trailPoints.length > 1 && (
        <Line
          points={trailPoints}
          color="#ff6666"
          lineWidth={2}
          transparent
          opacity={0.6}
        />
      )}
    </group>
  );
};

export default MissileModel;
