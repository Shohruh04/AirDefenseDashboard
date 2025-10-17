import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const RadarSweep: React.FC = () => {
  const sweepRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (sweepRef.current) {
      sweepRef.current.rotation.y = state.clock.elapsedTime * 0.5;
    }
    if (ringRef.current) {
      // Pulsing effect
      const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.1 + 1;
      ringRef.current.scale.setScalar(pulse);
    }
    if (glowRef.current) {
      // Glow pulsing
      const glow = Math.sin(state.clock.elapsedTime * 3) * 0.3 + 0.7;
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity = glow * 0.4;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Radar sweep beam */}
      <mesh ref={sweepRef} position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0, 150, 0.5, 3, 1, false, 0, Math.PI / 6]} />
        <meshBasicMaterial
          color="#00ff88"
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Radar center */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[2, 2, 1, 8]} />
        <meshLambertMaterial color="#333333" />
      </mesh>

      {/* Radar dish */}
      <mesh position={[0, 1, 0]}>
        <cylinderGeometry args={[3, 2, 0.5, 16]} />
        <meshLambertMaterial color="#666666" />
      </mesh>

      {/* Range rings */}
      <mesh ref={ringRef} position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[48, 52, 32]} />
        <meshBasicMaterial
          color="#00ff88"
          transparent
          opacity={0.2}
          side={THREE.DoubleSide}
        />
      </mesh>

      <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[98, 102, 32]} />
        <meshBasicMaterial
          color="#ffaa00"
          transparent
          opacity={0.1}
          side={THREE.DoubleSide}
        />
      </mesh>

      <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[148, 152, 32]} />
        <meshBasicMaterial
          color="#ff4444"
          transparent
          opacity={0.1}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Glow effect around radar */}
      <mesh ref={glowRef} position={[0, 1.5, 0]}>
        <sphereGeometry args={[4, 16, 16]} />
        <meshBasicMaterial
          color="#00ff88"
          transparent
          opacity={0.4}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
};

export default RadarSweep;
