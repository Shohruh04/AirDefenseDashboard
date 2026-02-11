import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import * as THREE from "three";
import type { Explosion } from "../../lib/simulation";
import { toWorldCoords } from "../../lib/simulation";

interface ExplosionEffectProps {
  explosion: Explosion;
}

const ExplosionEffect: React.FC<ExplosionEffectProps> = React.memo(({ explosion }) => {
  const fireballRef = useRef<THREE.Mesh>(null);
  const shockwaveRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const groupRef = useRef<THREE.Group>(null);

  const worldPos = useMemo(() => {
    const [x, y, z] = toWorldCoords(
      explosion.position.lat,
      explosion.position.lng,
      explosion.position.altitude
    );
    return new THREE.Vector3(x, y, z);
  }, [explosion.position]);

  useFrame(() => {
    const elapsed = Date.now() - explosion.timestamp;
    const progress = Math.min(elapsed / 2000, 1); // 0→1 over 2 seconds

    if (progress >= 1) {
      if (groupRef.current) groupRef.current.visible = false;
      return;
    }

    // Fireball: expand fast then slow down, fade out
    if (fireballRef.current) {
      const scale = 0.5 + progress * 3;
      fireballRef.current.scale.setScalar(scale);
      const mat = fireballRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = Math.max(0, 1 - progress * 1.5);
      // Color shift: yellow → orange → dark red
      const r = 1;
      const g = Math.max(0, 0.6 - progress * 0.8);
      const b = 0;
      mat.color.setRGB(r, g, b);
    }

    // Shockwave ring: expand outward, fade
    if (shockwaveRef.current) {
      const ringScale = 1 + progress * 8;
      shockwaveRef.current.scale.set(ringScale, ringScale, 1);
      const mat = shockwaveRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = Math.max(0, 0.6 - progress);
    }

    // Light: bright flash then fade
    if (lightRef.current) {
      lightRef.current.intensity = Math.max(0, 8 * (1 - progress * 1.5));
    }
  });

  return (
    <group ref={groupRef} position={worldPos}>
      {/* Fireball */}
      <mesh ref={fireballRef}>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshBasicMaterial
          color="#ff6600"
          transparent
          opacity={1}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Inner bright core */}
      <mesh>
        <sphereGeometry args={[0.25, 12, 12]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
      </mesh>

      {/* Shockwave ring */}
      <mesh ref={shockwaveRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.8, 1.2, 24]} />
        <meshBasicMaterial
          color="#ff4400"
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Explosion particles */}
      <Sparkles
        count={40}
        scale={[4, 4, 4]}
        size={4}
        speed={5}
        color="#ff6600"
        opacity={0.8}
      />

      {/* Flash light */}
      <pointLight
        ref={lightRef}
        color="#ff6600"
        intensity={8}
        distance={20}
      />
    </group>
  );
});

ExplosionEffect.displayName = "ExplosionEffect";

export default ExplosionEffect;
