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
  const outerExhaustRef = useRef<THREE.Mesh>(null);

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

  // Calculate direction for missile orientation
  const direction = useMemo(() => {
    return new THREE.Vector3().subVectors(targetPos, currentPos).normalize();
  }, [currentPos, targetPos]);

  // Build trail points for smoke effect
  const trailPoints = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const numPoints = 25;

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
      // Smooth position update
      groupRef.current.position.lerp(currentPos, delta * 10);

      // Point missile in direction of travel
      const lookAt = new THREE.Vector3().addVectors(currentPos, direction);
      groupRef.current.lookAt(lookAt);
      groupRef.current.rotateX(Math.PI / 2);

      // Animate exhaust flicker
      if (exhaustRef.current) {
        const flicker = 0.9 + Math.sin(state.clock.elapsedTime * 60) * 0.1;
        exhaustRef.current.scale.set(flicker, 1 + Math.sin(state.clock.elapsedTime * 40) * 0.2, flicker);
      }
      if (outerExhaustRef.current) {
        const flicker = 0.8 + Math.cos(state.clock.elapsedTime * 45) * 0.2;
        outerExhaustRef.current.scale.set(flicker, 1 + Math.cos(state.clock.elapsedTime * 35) * 0.15, flicker);
      }
    }
  });

  if (!missile.active) return null;

  return (
    <group>
      {/* Missile Trail - Main smoke */}
      <Line
        points={trailPoints}
        color="#ff8800"
        lineWidth={4}
        transparent
        opacity={0.7}
      />

      {/* Secondary trail - Wider glow */}
      <Line
        points={trailPoints}
        color="#ffcc00"
        lineWidth={8}
        transparent
        opacity={0.3}
      />

      {/* Outer smoke trail */}
      <Line
        points={trailPoints}
        color="#666666"
        lineWidth={12}
        transparent
        opacity={0.15}
      />

      {/* Missile Body Group */}
      <group ref={groupRef}>
        {/* Main Body - Sleek cylindrical fuselage */}
        <mesh castShadow>
          <cylinderGeometry args={[0.06, 0.1, 1.0, 16]} />
          <meshStandardMaterial
            color="#e0e0e0"
            metalness={0.85}
            roughness={0.15}
          />
        </mesh>

        {/* Body Stripe - Military marking */}
        <mesh position={[0, 0.1, 0]}>
          <cylinderGeometry args={[0.065, 0.095, 0.15, 16]} />
          <meshStandardMaterial
            color="#cc0000"
            metalness={0.7}
            roughness={0.3}
          />
        </mesh>

        {/* Warhead - Sharp cone tip */}
        <mesh position={[0, 0.6, 0]} castShadow>
          <coneGeometry args={[0.06, 0.35, 16]} />
          <meshStandardMaterial
            color="#2a2a2a"
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>

        {/* Seeker Head - Transparent dome */}
        <mesh position={[0, 0.75, 0]}>
          <sphereGeometry args={[0.04, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial
            color="#111111"
            metalness={0.95}
            roughness={0.05}
            transparent
            opacity={0.9}
          />
        </mesh>

        {/* Guidance Ring */}
        <mesh position={[0, 0.25, 0]} castShadow>
          <torusGeometry args={[0.08, 0.015, 8, 16]} />
          <meshStandardMaterial
            color="#1a1a1a"
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>

        {/* Main Fins - 4 cruciform fins */}
        {[0, 90, 180, 270].map((angle, i) => (
          <group key={i} rotation={[0, (angle * Math.PI) / 180, 0]}>
            <mesh position={[0.1, -0.35, 0]} castShadow>
              <boxGeometry args={[0.12, 0.2, 0.015]} />
              <meshStandardMaterial
                color="#808080"
                metalness={0.7}
                roughness={0.3}
              />
            </mesh>
          </group>
        ))}

        {/* Tail Fins - Smaller angled fins */}
        {[45, 135, 225, 315].map((angle, i) => (
          <group key={`tail-${i}`} rotation={[0, (angle * Math.PI) / 180, 0]}>
            <mesh position={[0.08, -0.45, 0]} rotation={[0, 0, 0.2]} castShadow>
              <boxGeometry args={[0.08, 0.12, 0.012]} />
              <meshStandardMaterial
                color="#606060"
                metalness={0.6}
                roughness={0.4}
              />
            </mesh>
          </group>
        ))}

        {/* Engine Nozzle */}
        <mesh position={[0, -0.55, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.05, 0.12, 16]} />
          <meshStandardMaterial
            color="#1a1a1a"
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>

        {/* Inner Nozzle Ring */}
        <mesh position={[0, -0.58, 0]}>
          <torusGeometry args={[0.04, 0.01, 8, 16]} />
          <meshStandardMaterial
            color="#ff4400"
            emissive="#ff4400"
            emissiveIntensity={0.5}
          />
        </mesh>

        {/* Exhaust Flame - Inner bright core */}
        <mesh ref={exhaustRef} position={[0, -0.75, 0]}>
          <coneGeometry args={[0.06, 0.45, 12]} />
          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={0.95}
          />
        </mesh>

        {/* Exhaust Flame - Yellow layer */}
        <mesh position={[0, -0.8, 0]}>
          <coneGeometry args={[0.08, 0.55, 12]} />
          <meshBasicMaterial
            color="#ffff00"
            transparent
            opacity={0.8}
          />
        </mesh>

        {/* Exhaust Flame - Orange layer */}
        <mesh ref={outerExhaustRef} position={[0, -0.9, 0]}>
          <coneGeometry args={[0.1, 0.65, 12]} />
          <meshBasicMaterial
            color="#ff6600"
            transparent
            opacity={0.6}
          />
        </mesh>

        {/* Exhaust Flame - Red outer glow */}
        <mesh position={[0, -1.0, 0]}>
          <coneGeometry args={[0.14, 0.5, 12]} />
          <meshBasicMaterial
            color="#ff2200"
            transparent
            opacity={0.3}
          />
        </mesh>

        {/* Bright engine light */}
        <pointLight
          position={[0, -0.7, 0]}
          color="#ff8800"
          intensity={3}
          distance={12}
        />

        {/* Secondary orange glow */}
        <pointLight
          position={[0, -0.4, 0]}
          color="#ffaa00"
          intensity={1.5}
          distance={6}
        />

        {/* Missile body illumination */}
        <pointLight
          position={[0, 0, 0]}
          color="#ff4400"
          intensity={0.5}
          distance={2}
        />
      </group>

      {/* Target Lock Indicator - Pulsing rings at target */}
      <group position={targetPos}>
        {/* Inner targeting ring */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.2, 1.5, 32]} />
          <meshBasicMaterial
            color="#ff0000"
            transparent
            opacity={0.5}
            side={THREE.DoubleSide}
          />
        </mesh>
        {/* Outer warning ring */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[2.0, 2.3, 32]} />
          <meshBasicMaterial
            color="#ff0000"
            transparent
            opacity={0.25}
            side={THREE.DoubleSide}
          />
        </mesh>
        {/* Target crosshair */}
        <Line
          points={[[-2, 0, 0], [2, 0, 0]]}
          color="#ff0000"
          lineWidth={2}
          transparent
          opacity={0.4}
        />
        <Line
          points={[[0, 0, -2], [0, 0, 2]]}
          color="#ff0000"
          lineWidth={2}
          transparent
          opacity={0.4}
        />
      </group>

      {/* Launch Point Indicator */}
      <group position={startPos}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.4, 0.6, 16]} />
          <meshBasicMaterial
            color="#00ff00"
            transparent
            opacity={0.6}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.7, 0.8, 16]} />
          <meshBasicMaterial
            color="#00ff00"
            transparent
            opacity={0.3}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
    </group>
  );
};

export default MissileModel;
