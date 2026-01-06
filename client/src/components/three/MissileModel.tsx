import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import * as THREE from "three";
import type { Missile } from "../../lib/simulation";

interface MissileModelProps {
  missile: Missile;
}

const MissileModel: React.FC<MissileModelProps> = ({ missile }) => {
  const groupRef = useRef<THREE.Group>(null);
  const exhaustRef = useRef<THREE.Mesh>(null);

  // Convert positions to 3D coordinates
  const currentPos = useMemo(() => {
    const x = (missile.currentPosition.lng - 10) * 2;
    const z = -(missile.currentPosition.lat - 50) * 2;
    const y = (missile.currentPosition.altitude / 1000) * 0.15 + 0.5;
    return new THREE.Vector3(x, y, z);
  }, [missile.currentPosition]);

  const startPos = useMemo(() => {
    const x = (missile.startPosition.lng - 10) * 2;
    const z = -(missile.startPosition.lat - 50) * 2;
    const y = (missile.startPosition.altitude / 1000) * 0.15 + 0.5;
    return new THREE.Vector3(x, y, z);
  }, [missile.startPosition]);

  const targetPos = useMemo(() => {
    const x = (missile.targetPosition.lng - 10) * 2;
    const z = -(missile.targetPosition.lat - 50) * 2;
    const y = (missile.targetPosition.altitude / 1000) * 0.15 + 2;
    return new THREE.Vector3(x, y, z);
  }, [missile.targetPosition]);

  // Calculate direction
  const direction = useMemo(() => {
    return new THREE.Vector3().subVectors(targetPos, currentPos).normalize();
  }, [currentPos, targetPos]);

  // Trail points
  const trailPoints = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const numPoints = 15;
    for (let i = 0; i < numPoints; i++) {
      const t = i / numPoints;
      const x = startPos.x + (currentPos.x - startPos.x) * t;
      const y = startPos.y + (currentPos.y - startPos.y) * t;
      const z = startPos.z + (currentPos.z - startPos.z) * t;
      points.push(new THREE.Vector3(x, y, z));
    }
    points.push(currentPos.clone());
    return points;
  }, [startPos, currentPos]);

  // Animate missile
  useFrame((state, delta) => {
    if (groupRef.current && missile.active) {
      groupRef.current.position.lerp(currentPos, delta * 8);

      const lookAt = new THREE.Vector3().addVectors(currentPos, direction);
      groupRef.current.lookAt(lookAt);
      groupRef.current.rotateX(Math.PI / 2);

      // Exhaust flicker
      if (exhaustRef.current) {
        const flicker = 0.9 + Math.sin(state.clock.elapsedTime * 50) * 0.1;
        exhaustRef.current.scale.setScalar(flicker);
      }
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
        {/* Body */}
        <mesh castShadow>
          <cylinderGeometry args={[0.05, 0.08, 0.8, 8]} />
          <meshLambertMaterial color="#d0d0d0" />
        </mesh>

        {/* Warhead */}
        <mesh position={[0, 0.5, 0]} castShadow>
          <coneGeometry args={[0.05, 0.25, 8]} />
          <meshLambertMaterial color="#404040" />
        </mesh>

        {/* Fins */}
        {[0, 90, 180, 270].map((angle, i) => (
          <mesh key={i} position={[0, -0.3, 0]} rotation={[0, (angle * Math.PI) / 180, 0]}>
            <boxGeometry args={[0.1, 0.15, 0.01]} />
            <meshLambertMaterial color="#606060" />
          </mesh>
        ))}

        {/* Exhaust */}
        <mesh ref={exhaustRef} position={[0, -0.55, 0]}>
          <coneGeometry args={[0.04, 0.3, 8]} />
          <meshBasicMaterial color="#ffff00" transparent opacity={0.9} />
        </mesh>
        <mesh position={[0, -0.65, 0]}>
          <coneGeometry args={[0.06, 0.35, 8]} />
          <meshBasicMaterial color="#ff6600" transparent opacity={0.6} />
        </mesh>

        {/* Engine light */}
        <pointLight position={[0, -0.5, 0]} color="#ff6600" intensity={1} distance={5} />
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
};

export default MissileModel;
