import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface RangeIndicatorProps {
  radius: number;
  color: string;
  opacity?: number;
}

const RangeIndicator: React.FC<RangeIndicatorProps> = ({
  radius,
  color,
  opacity = 0.1,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      // Subtle pulsing animation
      const pulse = Math.sin(state.clock.elapsedTime * 0.8) * 0.05 + 1;
      meshRef.current.scale.setScalar(pulse);
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[radius - 2, radius, 64]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={opacity}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

export default RangeIndicator;
