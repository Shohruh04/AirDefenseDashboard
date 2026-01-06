import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const RadarSweep: React.FC = () => {
  const sweepRef = useRef<THREE.Group>(null);
  const dishRef = useRef<THREE.Group>(null);
  const secondarySweepRef = useRef<THREE.Mesh>(null);
  const pulseRingRef = useRef<THREE.Mesh>(null);
  const beaconRef = useRef<THREE.PointLight>(null);

  // Create sweep geometry with gradient
  const sweepGeometry = useMemo(() => {
    const geo = new THREE.CylinderGeometry(0, 80, 0.3, 64, 1, false, 0, Math.PI / 4);
    return geo;
  }, []);

  useFrame((state) => {
    const time = state.clock.elapsedTime;

    // Main radar sweep rotation
    if (sweepRef.current) {
      sweepRef.current.rotation.y = time * 0.8;
    }

    // Secondary sweep (faster)
    if (secondarySweepRef.current) {
      secondarySweepRef.current.rotation.y = time * 1.2;
    }

    // Dish rotation (slower wobble)
    if (dishRef.current) {
      dishRef.current.rotation.y = time * 0.3;
      dishRef.current.rotation.x = Math.sin(time * 0.5) * 0.1;
    }

    // Pulse ring expansion
    if (pulseRingRef.current) {
      const pulse = (time * 0.5) % 1;
      const scale = 1 + pulse * 80;
      pulseRingRef.current.scale.set(scale, scale, 1);
      (pulseRingRef.current.material as THREE.MeshBasicMaterial).opacity = 0.3 * (1 - pulse);
    }

    // Beacon light flashing
    if (beaconRef.current) {
      beaconRef.current.intensity = Math.sin(time * 4) > 0.7 ? 2 : 0.2;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* === RADAR STATION BASE === */}

      {/* Ground Platform */}
      <mesh position={[0, 0.1, 0]} receiveShadow>
        <cylinderGeometry args={[6, 7, 0.3, 32]} />
        <meshStandardMaterial color="#404040" metalness={0.3} roughness={0.7} />
      </mesh>

      {/* Concrete Foundation */}
      <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[4, 5, 0.5, 16]} />
        <meshStandardMaterial color="#606060" metalness={0.2} roughness={0.8} />
      </mesh>

      {/* Main Tower Base */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <cylinderGeometry args={[1.5, 2, 2, 8]} />
        <meshStandardMaterial color="#2a2a2a" metalness={0.6} roughness={0.4} />
      </mesh>

      {/* Tower Middle Section */}
      <mesh position={[0, 3.5, 0]} castShadow>
        <cylinderGeometry args={[1.2, 1.5, 3, 8]} />
        <meshStandardMaterial color="#333333" metalness={0.6} roughness={0.4} />
      </mesh>

      {/* Tower Upper Section */}
      <mesh position={[0, 6, 0]} castShadow>
        <cylinderGeometry args={[0.8, 1.2, 2, 8]} />
        <meshStandardMaterial color="#3a3a3a" metalness={0.6} roughness={0.4} />
      </mesh>

      {/* Equipment Box */}
      <mesh position={[2, 1, 0]} castShadow>
        <boxGeometry args={[2, 1.5, 1.5]} />
        <meshStandardMaterial color="#2d3436" metalness={0.4} roughness={0.6} />
      </mesh>

      {/* Equipment Box 2 */}
      <mesh position={[-2, 1, 1]} castShadow>
        <boxGeometry args={[1.5, 1.2, 1.2]} />
        <meshStandardMaterial color="#2d3436" metalness={0.4} roughness={0.6} />
      </mesh>

      {/* === RADAR DISH ASSEMBLY === */}
      <group ref={dishRef} position={[0, 7.5, 0]}>
        {/* Dish Mount */}
        <mesh position={[0, 0, 0]} castShadow>
          <cylinderGeometry args={[0.5, 0.8, 1, 8]} />
          <meshStandardMaterial color="#444444" metalness={0.7} roughness={0.3} />
        </mesh>

        {/* Main Radar Dish - Parabolic shape */}
        <mesh position={[0, 0.8, 0]} rotation={[0.2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.3, 3.5, 1.5, 32, 1, false]} />
          <meshStandardMaterial
            color="#505050"
            metalness={0.9}
            roughness={0.1}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Dish Back Support */}
        <mesh position={[0, 0.5, -0.3]} rotation={[0.2, 0, 0]} castShadow>
          <coneGeometry args={[2.5, 1.2, 16]} />
          <meshStandardMaterial color="#3a3a3a" metalness={0.6} roughness={0.4} />
        </mesh>

        {/* Feed Horn (center of dish) */}
        <mesh position={[0, 2.2, 0.8]} rotation={[-0.3, 0, 0]} castShadow>
          <coneGeometry args={[0.3, 1, 8]} />
          <meshStandardMaterial color="#222222" metalness={0.8} roughness={0.2} />
        </mesh>

        {/* Support Struts */}
        {[0, 120, 240].map((angle, i) => (
          <mesh
            key={i}
            position={[
              Math.cos((angle * Math.PI) / 180) * 1.2,
              1.5,
              Math.sin((angle * Math.PI) / 180) * 1.2 + 0.3,
            ]}
            rotation={[0.4, (angle * Math.PI) / 180, 0]}
            castShadow
          >
            <cylinderGeometry args={[0.05, 0.05, 2, 6]} />
            <meshStandardMaterial color="#666666" metalness={0.7} roughness={0.3} />
          </mesh>
        ))}
      </group>

      {/* === ROTATING RADAR ARRAY === */}
      <group position={[0, 10, 0]}>
        {/* Rotating Platform */}
        <mesh castShadow>
          <cylinderGeometry args={[1.5, 1.5, 0.3, 16]} />
          <meshStandardMaterial color="#2a2a2a" metalness={0.7} roughness={0.3} />
        </mesh>

        {/* Flat Panel Radar Arrays */}
        <group ref={sweepRef}>
          {[0, 90, 180, 270].map((angle, i) => (
            <mesh
              key={i}
              position={[
                Math.cos((angle * Math.PI) / 180) * 2,
                0.5,
                Math.sin((angle * Math.PI) / 180) * 2,
              ]}
              rotation={[0, (angle * Math.PI) / 180, 0]}
              castShadow
            >
              <boxGeometry args={[0.2, 1.5, 2]} />
              <meshStandardMaterial
                color="#1a1a1a"
                metalness={0.9}
                roughness={0.1}
                emissive="#003300"
                emissiveIntensity={0.2}
              />
            </mesh>
          ))}
        </group>
      </group>

      {/* === BEACON LIGHT === */}
      <mesh position={[0, 11.5, 0]}>
        <sphereGeometry args={[0.3, 12, 12]} />
        <meshBasicMaterial color="#ff0000" />
      </mesh>
      <pointLight
        ref={beaconRef}
        position={[0, 11.5, 0]}
        color="#ff0000"
        intensity={2}
        distance={30}
      />

      {/* === SWEEP EFFECTS === */}

      {/* Main Radar Sweep Beam */}
      <group ref={sweepRef} position={[0, 0.5, 0]}>
        <mesh geometry={sweepGeometry}>
          <meshBasicMaterial
            color="#00ff88"
            transparent
            opacity={0.25}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {/* Sweep leading edge glow */}
        <mesh position={[0, 0, 0]} rotation={[0, Math.PI / 8, 0]}>
          <cylinderGeometry args={[0, 80, 0.1, 3, 1, false, 0, 0.02]} />
          <meshBasicMaterial
            color="#00ffaa"
            transparent
            opacity={0.6}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>

      {/* Secondary sweep (shorter range) */}
      <mesh ref={secondarySweepRef} position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0, 40, 0.2, 32, 1, false, 0, Math.PI / 6]} />
        <meshBasicMaterial
          color="#00ccff"
          transparent
          opacity={0.15}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Pulse ring effect */}
      <mesh ref={pulseRingRef} position={[0, 0.3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.9, 1, 64]} />
        <meshBasicMaterial
          color="#00ff88"
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* === RANGE RINGS === */}

      {/* Short Range Ring (50km) */}
      <mesh position={[0, 0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[49, 51, 64]} />
        <meshBasicMaterial
          color="#00ff88"
          transparent
          opacity={0.15}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Medium Range Ring (100km) */}
      <mesh position={[0, 0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[99, 101, 64]} />
        <meshBasicMaterial
          color="#ffaa00"
          transparent
          opacity={0.1}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Long Range Ring (150km) */}
      <mesh position={[0, 0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[149, 151, 64]} />
        <meshBasicMaterial
          color="#ff4444"
          transparent
          opacity={0.08}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Range markers - cardinal directions */}
      {[0, 90, 180, 270].map((angle, i) => (
        <group key={i} rotation={[0, (angle * Math.PI) / 180, 0]}>
          <mesh position={[75, 0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[2, 0.3]} />
            <meshBasicMaterial color="#00ff88" transparent opacity={0.3} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}

      {/* === AMBIENT GLOW === */}
      <pointLight position={[0, 5, 0]} color="#00ff88" intensity={0.5} distance={20} />
      <pointLight position={[0, 2, 0]} color="#00aa66" intensity={0.3} distance={15} />
    </group>
  );
};

export default RadarSweep;
