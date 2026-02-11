import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface RadarSweepProps {
  isDayMode: boolean;
}

const RadarSweep: React.FC<RadarSweepProps> = React.memo(({ isDayMode }) => {
  const dishRef = useRef<THREE.Group>(null);
  const sweepBeamRef = useRef<THREE.Group>(null);
  const pulseRingRef = useRef<THREE.Mesh>(null);
  const beaconRef = useRef<THREE.Mesh>(null);

  const sweepColor = isDayMode ? "#00cc66" : "#00ff88";
  const sweepOpacity = isDayMode ? 0.15 : 0.22;

  const sweepGeometry = useMemo(() => {
    return new THREE.CylinderGeometry(0, 70, 0.2, 32, 1, false, 0, Math.PI / 4);
  }, []);

  useFrame((state) => {
    const time = state.clock.elapsedTime;

    if (dishRef.current) {
      dishRef.current.rotation.y = time * 0.5;
    }

    if (sweepBeamRef.current) {
      sweepBeamRef.current.rotation.y = time * 0.6;
    }

    if (pulseRingRef.current) {
      const pulse = (time * 0.4) % 1;
      const scale = 1 + pulse * 70;
      pulseRingRef.current.scale.set(scale, scale, 1);
      (pulseRingRef.current.material as THREE.MeshBasicMaterial).opacity = 0.25 * (1 - pulse);
    }

    // Beacon blink
    if (beaconRef.current) {
      const on = Math.sin(time * Math.PI * 2) > 0.6;
      (beaconRef.current.material as THREE.MeshBasicMaterial).opacity = on ? 1 : 0.2;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Ground Platform — PBR concrete */}
      <mesh position={[0, 0.1, 0]} receiveShadow>
        <cylinderGeometry args={[5, 6, 0.3, 16]} />
        <meshStandardMaterial color={isDayMode ? "#555" : "#404040"} metalness={0.2} roughness={0.85} />
      </mesh>

      {/* Main Tower — PBR metal */}
      <mesh position={[0, 2.5, 0]} castShadow>
        <cylinderGeometry args={[1, 1.5, 5, 12]} />
        <meshStandardMaterial color="#2a2a2a" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Tower Top */}
      <mesh position={[0, 5.5, 0]} castShadow>
        <cylinderGeometry args={[0.6, 1, 1, 12]} />
        <meshStandardMaterial color="#333333" metalness={0.6} roughness={0.35} />
      </mesh>

      {/* Rotating Radar Dish */}
      <group ref={dishRef} position={[0, 6.5, 0]}>
        {/* Dish mount */}
        <mesh castShadow>
          <cylinderGeometry args={[0.4, 0.6, 0.8, 8]} />
          <meshStandardMaterial color="#444444" metalness={0.7} roughness={0.25} />
        </mesh>

        {/* Radar dish — reflective metal */}
        <mesh position={[0, 0.6, 0.5]} rotation={[0.3, 0, 0]} castShadow>
          <cylinderGeometry args={[0.2, 2.5, 1, 16]} />
          <meshStandardMaterial
            color="#606060"
            metalness={0.9}
            roughness={0.15}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Feed horn */}
        <mesh position={[0, 1.5, 1]} rotation={[-0.2, 0, 0]} castShadow>
          <coneGeometry args={[0.2, 0.8, 8]} />
          <meshStandardMaterial color="#222222" metalness={0.6} roughness={0.3} />
        </mesh>
      </group>

      {/* Beacon Light — blinks */}
      <mesh ref={beaconRef} position={[0, 8, 0]}>
        <sphereGeometry args={[0.2, 8, 8]} />
        <meshBasicMaterial color="#ff0000" transparent />
      </mesh>
      <pointLight position={[0, 8, 0]} color="#ff0000" intensity={isDayMode ? 0.1 : 0.4} distance={10} />

      {/* Sweep Beam */}
      <group ref={sweepBeamRef} position={[0, 0.3, 0]}>
        <mesh geometry={sweepGeometry}>
          <meshBasicMaterial
            color={sweepColor}
            transparent
            opacity={sweepOpacity}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>

      {/* Pulse ring */}
      <mesh ref={pulseRingRef} position={[0, 0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.8, 1, 32]} />
        <meshBasicMaterial
          color={sweepColor}
          transparent
          opacity={0.25}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Range Rings */}
      {/* 50km */}
      <mesh position={[0, 0.15, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[48, 50, 48]} />
        <meshBasicMaterial color={sweepColor} transparent opacity={isDayMode ? 0.08 : 0.12} side={THREE.DoubleSide} />
      </mesh>
      {/* 100km */}
      <mesh position={[0, 0.15, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[98, 100, 48]} />
        <meshBasicMaterial color="#ffaa00" transparent opacity={isDayMode ? 0.06 : 0.08} side={THREE.DoubleSide} />
      </mesh>
      {/* 150km */}
      <mesh position={[0, 0.15, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[148, 150, 48]} />
        <meshBasicMaterial color="#ff4444" transparent opacity={isDayMode ? 0.04 : 0.06} side={THREE.DoubleSide} />
      </mesh>

      {/* Cardinal direction markers */}
      {[0, 90, 180, 270].map((angle, i) => (
        <group key={`marker-${i}`} rotation={[0, (angle * Math.PI) / 180, 0]}>
          <mesh position={[70, 0.15, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[1.5, 0.2]} />
            <meshBasicMaterial color={sweepColor} transparent opacity={0.25} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}

      {/* Ambient radar glow */}
      <pointLight position={[0, 3, 0]} color={sweepColor} intensity={isDayMode ? 0.15 : 0.3} distance={15} />
    </group>
  );
});

RadarSweep.displayName = "RadarSweep";

export default RadarSweep;
