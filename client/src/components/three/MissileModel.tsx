import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Line, Sparkles } from "@react-three/drei";
import * as THREE from "three";
import type { Missile } from "../../lib/simulation";
import { toWorldCoords } from "../../lib/simulation";

interface MissileModelProps {
  missile: Missile;
}

const MissileModel: React.FC<MissileModelProps> = React.memo(({ missile }) => {
  const groupRef = useRef<THREE.Group>(null);
  const exhaustRef = useRef<THREE.Mesh>(null);

  const currentPos = useMemo(() => {
    const [x, y, z] = toWorldCoords(missile.currentPosition.lat, missile.currentPosition.lng, missile.currentPosition.altitude);
    return new THREE.Vector3(x, y, z);
  }, [missile.currentPosition]);

  const startPos = useMemo(() => {
    const [x, y, z] = toWorldCoords(missile.startPosition.lat, missile.startPosition.lng, missile.startPosition.altitude);
    return new THREE.Vector3(x, y, z);
  }, [missile.startPosition]);

  const targetPos = useMemo(() => {
    const [x, y, z] = toWorldCoords(missile.targetPosition.lat, missile.targetPosition.lng, missile.targetPosition.altitude);
    return new THREE.Vector3(x, y + 1.5, z);
  }, [missile.targetPosition]);

  const direction = useMemo(
    () => new THREE.Vector3().subVectors(targetPos, currentPos).normalize(),
    [currentPos, targetPos]
  );

  const trailPoints = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const numPoints = 15;
    for (let i = 0; i < numPoints; i++) {
      const t = i / numPoints;
      points.push(new THREE.Vector3(
        startPos.x + (currentPos.x - startPos.x) * t,
        startPos.y + (currentPos.y - startPos.y) * t,
        startPos.z + (currentPos.z - startPos.z) * t,
      ));
    }
    points.push(currentPos.clone());
    return points;
  }, [startPos, currentPos]);

  useFrame((state, delta) => {
    if (!groupRef.current || !missile.active) return;

    groupRef.current.position.lerp(currentPos, delta * 8);

    const lookAt = new THREE.Vector3().addVectors(currentPos, direction);
    groupRef.current.lookAt(lookAt);
    groupRef.current.rotateX(Math.PI / 2);

    if (exhaustRef.current) {
      const flicker = 0.9 + Math.sin(state.clock.elapsedTime * 50) * 0.1;
      exhaustRef.current.scale.setScalar(flicker);
    }
  });

  if (!missile.active) return null;

  return (
    <group>
      {/* Trail */}
      <Line points={trailPoints} color="#ff6600" lineWidth={3} transparent opacity={0.6} />
      <Line points={trailPoints} color="#888888" lineWidth={6} transparent opacity={0.2} />

      {/* Missile Body */}
      <group ref={groupRef}>
        {/* Body - PBR metallic */}
        <mesh castShadow>
          <cylinderGeometry args={[0.05, 0.08, 0.8, 12]} />
          <meshStandardMaterial color="#c0c0c0" metalness={0.8} roughness={0.2} />
        </mesh>

        {/* Warhead */}
        <mesh position={[0, 0.5, 0]} castShadow>
          <coneGeometry args={[0.05, 0.25, 12]} />
          <meshStandardMaterial color="#404040" metalness={0.7} roughness={0.25} />
        </mesh>

        {/* Fins */}
        {[0, 90, 180, 270].map((angle, i) => (
          <mesh key={i} position={[0, -0.3, 0]} rotation={[0, (angle * Math.PI) / 180, 0]}>
            <boxGeometry args={[0.1, 0.15, 0.01]} />
            <meshStandardMaterial color="#505050" metalness={0.6} roughness={0.3} />
          </mesh>
        ))}

        {/* Exhaust inner glow */}
        <mesh ref={exhaustRef} position={[0, -0.55, 0]}>
          <coneGeometry args={[0.04, 0.3, 8]} />
          <meshBasicMaterial color="#ffff00" transparent opacity={0.9} />
        </mesh>
        {/* Exhaust outer glow */}
        <mesh position={[0, -0.65, 0]}>
          <coneGeometry args={[0.06, 0.35, 8]} />
          <meshBasicMaterial color="#ff6600" transparent opacity={0.6} />
        </mesh>

        {/* Exhaust particles */}
        <Sparkles
          count={20}
          scale={[0.3, 0.6, 0.3]}
          position={[0, -0.7, 0]}
          size={2}
          speed={3}
          color="#ff6600"
          opacity={0.6}
        />

        {/* Engine light */}
        <pointLight position={[0, -0.5, 0]} color="#ff6600" intensity={2} distance={5} />
      </group>

      {/* Target indicator */}
      <group position={targetPos}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1, 1.3, 16]} />
          <meshBasicMaterial color="#ff0000" transparent opacity={0.4} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* Launch point */}
      <group position={startPos}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.3, 0.5, 12]} />
          <meshBasicMaterial color="#00ff00" transparent opacity={0.5} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
});

MissileModel.displayName = "MissileModel";

export default MissileModel;
