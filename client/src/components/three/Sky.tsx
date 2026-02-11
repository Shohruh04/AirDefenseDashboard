import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface SkyProps {
  isDayMode: boolean;
}

const Sky: React.FC<SkyProps> = ({ isDayMode }) => {
  const starRef = useRef<THREE.Points>(null);
  const sunGlowRef = useRef<THREE.Mesh>(null);

  // Gradient sky dome shader
  const skyMaterial = useMemo(() => {
    const topColor = isDayMode ? new THREE.Color("#4a90d9") : new THREE.Color("#020210");
    const midColor = isDayMode ? new THREE.Color("#87CEEB") : new THREE.Color("#0a0a2a");
    const botColor = isDayMode ? new THREE.Color("#c8dff0") : new THREE.Color("#121225");

    return new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: topColor },
        midColor: { value: midColor },
        bottomColor: { value: botColor },
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 midColor;
        uniform vec3 bottomColor;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition).y;
          vec3 color;
          if (h > 0.0) {
            color = mix(midColor, topColor, smoothstep(0.0, 0.6, h));
          } else {
            color = mix(midColor, bottomColor, smoothstep(0.0, -0.3, h));
          }
          gl_FragColor = vec4(color, 1.0);
        }
      `,
      side: THREE.BackSide,
      depthWrite: false,
    });
  }, [isDayMode]);

  // Star positions with varying brightness
  const { starPositions, starSizes, starCount } = useMemo(() => {
    const count = 600;
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 0.85 + 0.15);
      const r = 380;
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi);
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      sizes[i] = 0.5 + Math.random() * 2.0;
    }
    return { starPositions: positions, starSizes: sizes, starCount: count };
  }, []);

  // Cloud positions
  const cloudData = useMemo(() => [
    { pos: [80, 65, -50] as [number, number, number], scale: [35, 1.5, 18] as [number, number, number], opacity: 0.5 },
    { pos: [-70, 72, 40] as [number, number, number], scale: [28, 1.2, 14] as [number, number, number], opacity: 0.45 },
    { pos: [25, 58, 85] as [number, number, number], scale: [22, 1, 12] as [number, number, number], opacity: 0.4 },
    { pos: [-40, 68, -80] as [number, number, number], scale: [30, 1.3, 16] as [number, number, number], opacity: 0.35 },
    { pos: [100, 75, 60] as [number, number, number], scale: [25, 1, 13] as [number, number, number], opacity: 0.3 },
  ], []);

  // Twinkling stars
  useFrame((state) => {
    if (starRef.current && !isDayMode) {
      const sizes = starRef.current.geometry.attributes.size.array as Float32Array;
      const time = state.clock.elapsedTime;
      for (let i = 0; i < starCount; i++) {
        const base = 0.5 + (i % 7) * 0.25;
        sizes[i] = base + Math.sin(time * (1.5 + (i % 5) * 0.3) + i * 0.7) * 0.4;
      }
      starRef.current.geometry.attributes.size.needsUpdate = true;
    }

    // Sun glow pulse
    if (sunGlowRef.current && isDayMode) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
      sunGlowRef.current.scale.setScalar(pulse);
    }
  });

  return (
    <group>
      {/* Gradient sky dome */}
      <mesh material={skyMaterial}>
        <sphereGeometry args={[400, 32, 16]} />
      </mesh>

      {/* Sun */}
      {isDayMode && (
        <group position={[150, 120, -100]}>
          {/* Sun core */}
          <mesh>
            <sphereGeometry args={[10, 16, 16]} />
            <meshBasicMaterial color="#fff8e0" />
          </mesh>
          {/* Inner glow */}
          <mesh ref={sunGlowRef}>
            <sphereGeometry args={[16, 16, 16]} />
            <meshBasicMaterial color="#ffffa0" transparent opacity={0.25} />
          </mesh>
          {/* Outer halo */}
          <mesh>
            <sphereGeometry args={[25, 16, 16]} />
            <meshBasicMaterial color="#ffcc66" transparent opacity={0.08} />
          </mesh>
          <pointLight color="#fff5e0" intensity={0.4} distance={300} />
        </group>
      )}

      {/* Moon */}
      {!isDayMode && (
        <group position={[-100, 90, 150]}>
          <mesh>
            <sphereGeometry args={[5, 16, 16]} />
            <meshStandardMaterial
              color="#e8e8f0"
              emissive="#aaaacc"
              emissiveIntensity={0.3}
              metalness={0.1}
              roughness={0.8}
            />
          </mesh>
          {/* Moon glow */}
          <mesh>
            <sphereGeometry args={[8, 16, 16]} />
            <meshBasicMaterial color="#8888aa" transparent opacity={0.08} />
          </mesh>
          <pointLight color="#8888cc" intensity={0.15} distance={200} />
        </group>
      )}

      {/* Stars (night only) — twinkling */}
      {!isDayMode && (
        <points ref={starRef}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={starCount}
              array={starPositions}
              itemSize={3}
            />
            <bufferAttribute
              attach="attributes-size"
              count={starCount}
              array={starSizes}
              itemSize={1}
            />
          </bufferGeometry>
          <pointsMaterial
            color="#ffffff"
            size={1.5}
            sizeAttenuation={false}
            transparent
            opacity={0.9}
            blending={THREE.AdditiveBlending}
          />
        </points>
      )}

      {/* Clouds (day only) — soft ellipsoid shapes */}
      {isDayMode && cloudData.map((cloud, i) => (
        <group key={`cloud-${i}`} position={cloud.pos}>
          <mesh scale={cloud.scale}>
            <sphereGeometry args={[1, 12, 8]} />
            <meshStandardMaterial
              color="#ffffff"
              transparent
              opacity={cloud.opacity}
              roughness={1}
              metalness={0}
            />
          </mesh>
          {/* Secondary puff */}
          <mesh
            position={[cloud.scale[0] * 0.25, 0.2, cloud.scale[2] * 0.15]}
            scale={[cloud.scale[0] * 0.7, cloud.scale[1] * 0.8, cloud.scale[2] * 0.7]}
          >
            <sphereGeometry args={[1, 10, 6]} />
            <meshStandardMaterial color="#ffffff" transparent opacity={cloud.opacity * 0.8} roughness={1} metalness={0} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

export default Sky;
