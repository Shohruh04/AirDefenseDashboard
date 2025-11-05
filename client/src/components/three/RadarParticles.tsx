import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const RadarParticles: React.FC = () => {
  const particlesRef = useRef<THREE.Points>(null);

  // Create particle geometry
  const particleCount = 1000;
  const particles = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const radius = Math.random() * 150;
      const theta = Math.random() * Math.PI * 2;

      positions[i3] = Math.cos(theta) * radius;
      positions[i3 + 1] = Math.random() * 2; // Height
      positions[i3 + 2] = Math.sin(theta) * radius;

      // Green radar color
      colors[i3] = 0.0;
      colors[i3 + 1] = 1.0;
      colors[i3 + 2] = 0.5;

      sizes[i] = Math.random() * 2 + 0.5;
    }

    return { positions, colors, sizes };
  }, []);

  useFrame((state) => {
    if (particlesRef.current) {
      const positions = particlesRef.current.geometry.attributes.position
        .array as Float32Array;

      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        const currentY = positions[i3 + 1];

        // Animate particles upward
        positions[i3 + 1] = currentY + 0.05;

        // Reset particles that go too high
        if (positions[i3 + 1] > 10) {
          positions[i3 + 1] = 0;

          // Randomize position again
          const radius = Math.random() * 150;
          const theta = Math.random() * Math.PI * 2;
          positions[i3] = Math.cos(theta) * radius;
          positions[i3 + 2] = Math.sin(theta) * radius;
        }
      }

      particlesRef.current.geometry.attributes.position.needsUpdate = true;
      particlesRef.current.rotation.y += 0.002;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={particles.positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={particleCount}
          array={particles.colors}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={particleCount}
          array={particles.sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        size={1}
        vertexColors
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

export default RadarParticles;
