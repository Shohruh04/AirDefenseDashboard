import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const RadarSweep: React.FC = () => {
  const dishRef = useRef<THREE.Group>(null);
  const sweepBeamRef = useRef<THREE.Group>(null);
  const pulseRingRef = useRef<THREE.Mesh>(null);

  // Create sweep geometry
  const sweepGeometry = useMemo(() => {
    return new THREE.CylinderGeometry(0, 70, 0.2, 32, 1, false, 0, Math.PI / 4);
  }, []);

  useFrame((state) => {
    const time = state.clock.elapsedTime;

    // Rotate radar dish
    if (dishRef.current) {
      dishRef.current.rotation.y = time * 0.5;
    }

    // Rotate sweep beam
    if (sweepBeamRef.current) {
      sweepBeamRef.current.rotation.y = time * 0.6;
    }

    // Pulse ring expansion
    if (pulseRingRef.current) {
      const pulse = (time * 0.4) % 1;
      const scale = 1 + pulse * 70;
      pulseRingRef.current.scale.set(scale, scale, 1);
      (pulseRingRef.current.material as THREE.MeshBasicMaterial).opacity = 0.25 * (1 - pulse);
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* === RADAR STATION BASE === */}

      {/* Ground Platform */}
      <mesh position={[0, 0.1, 0]} receiveShadow>
        <cylinderGeometry args={[5, 6, 0.3, 16]} />
        <meshLambertMaterial color="#404040" />
      </mesh>

      {/* Main Tower */}
      <mesh position={[0, 2.5, 0]} castShadow>
        <cylinderGeometry args={[1, 1.5, 5, 8]} />
        <meshLambertMaterial color="#2a2a2a" />
      </mesh>

      {/* Tower Top */}
      <mesh position={[0, 5.5, 0]} castShadow>
        <cylinderGeometry args={[0.6, 1, 1, 8]} />
        <meshLambertMaterial color="#333333" />
      </mesh>

      {/* === ROTATING RADAR DISH === */}
      <group ref={dishRef} position={[0, 6.5, 0]}>
        {/* Dish mount */}
        <mesh castShadow>
          <cylinderGeometry args={[0.4, 0.6, 0.8, 8]} />
          <meshLambertMaterial color="#444444" />
        </mesh>

        {/* Radar dish */}
        <mesh position={[0, 0.6, 0.5]} rotation={[0.3, 0, 0]} castShadow>
          <cylinderGeometry args={[0.2, 2.5, 1, 16]} />
          <meshStandardMaterial color="#505050" metalness={0.8} roughness={0.2} side={THREE.DoubleSide} />
        </mesh>

        {/* Feed horn */}
        <mesh position={[0, 1.5, 1]} rotation={[-0.2, 0, 0]} castShadow>
          <coneGeometry args={[0.2, 0.8, 8]} />
          <meshLambertMaterial color="#222222" />
        </mesh>
      </group>

      {/* === BEACON LIGHT === */}
      <mesh position={[0, 8, 0]}>
        <sphereGeometry args={[0.2, 8, 8]} />
        <meshBasicMaterial color="#ff0000" />
      </mesh>

      {/* === SWEEP EFFECTS === */}

      {/* Main Radar Sweep Beam */}
      <group ref={sweepBeamRef} position={[0, 0.3, 0]}>
        <mesh geometry={sweepGeometry}>
          <meshBasicMaterial
            color="#00ff88"
            transparent
            opacity={0.2}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>

      {/* Pulse ring effect */}
      <mesh ref={pulseRingRef} position={[0, 0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.8, 1, 32]} />
        <meshBasicMaterial
          color="#00ff88"
          transparent
          opacity={0.25}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* === RANGE RINGS === */}

      {/* 50km Ring */}
      <mesh position={[0, 0.15, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[48, 50, 48]} />
        <meshBasicMaterial color="#00ff88" transparent opacity={0.12} side={THREE.DoubleSide} />
      </mesh>

      {/* 100km Ring */}
      <mesh position={[0, 0.15, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[98, 100, 48]} />
        <meshBasicMaterial color="#ffaa00" transparent opacity={0.08} side={THREE.DoubleSide} />
      </mesh>

      {/* 150km Ring */}
      <mesh position={[0, 0.15, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[148, 150, 48]} />
        <meshBasicMaterial color="#ff4444" transparent opacity={0.06} side={THREE.DoubleSide} />
      </mesh>

      {/* Cardinal direction markers */}
      {[0, 90, 180, 270].map((angle, i) => (
        <group key={`marker-${i}`} rotation={[0, (angle * Math.PI) / 180, 0]}>
          <mesh position={[70, 0.15, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[1.5, 0.2]} />
            <meshBasicMaterial color="#00ff88" transparent opacity={0.25} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}

      {/* Ambient radar glow */}
      <pointLight position={[0, 3, 0]} color="#00ff88" intensity={0.3} distance={15} />
    </group>
  );
};

export default RadarSweep;
