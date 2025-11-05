import React from "react";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";

interface TerrainProps {
  isDayMode: boolean;
}

const Terrain: React.FC<TerrainProps> = ({ isDayMode }) => {
  const grassTexture = useTexture("/textures/grass.png");

  // Configure texture
  grassTexture.wrapS = grassTexture.wrapT = THREE.RepeatWrapping;
  grassTexture.repeat.set(20, 20);

  return (
    <group>
      {/* Main terrain plane */}
      <mesh
        position={[0, -0.5, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[400, 400]} />
        <meshLambertMaterial
          map={grassTexture}
          color={isDayMode ? "#ffffff" : "#404040"}
        />
      </mesh>

      {/* Additional terrain features */}
      <mesh position={[50, 0, 30]} castShadow>
        <cylinderGeometry args={[8, 12, 5, 8]} />
        <meshLambertMaterial color={isDayMode ? "#8B4513" : "#2D1810"} />
      </mesh>

      <mesh position={[-40, 0, -20]} castShadow>
        <cylinderGeometry args={[6, 10, 3, 8]} />
        <meshLambertMaterial color={isDayMode ? "#8B4513" : "#2D1810"} />
      </mesh>

      <mesh position={[30, 0, -50]} castShadow>
        <cylinderGeometry args={[4, 8, 2, 8]} />
        <meshLambertMaterial color={isDayMode ? "#8B4513" : "#2D1810"} />
      </mesh>

      {/* Water feature */}
      <mesh position={[-60, -0.4, 40]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[20, 15]} />
        <meshBasicMaterial
          color={isDayMode ? "#4FC3F7" : "#1565C0"}
          transparent
          opacity={0.7}
        />
      </mesh>

      {/* Roads/paths */}
      <mesh position={[0, -0.45, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[400, 4]} />
        <meshBasicMaterial color={isDayMode ? "#555555" : "#333333"} />
      </mesh>

      <mesh position={[0, -0.45, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
        <planeGeometry args={[400, 4]} />
        <meshBasicMaterial color={isDayMode ? "#555555" : "#333333"} />
      </mesh>
    </group>
  );
};

export default Terrain;
