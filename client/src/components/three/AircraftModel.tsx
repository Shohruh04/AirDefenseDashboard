import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Aircraft } from "../../lib/simulation";
import { getThreatLevelColor, toWorldCoords } from "../../lib/simulation";

interface AircraftModelProps {
  aircraft: Aircraft;
  isSelected?: boolean;
  onSelect?: () => void;
  onDeselect?: () => void;
}

// Military/Fighter Aircraft - PBR materials
const MilitaryAircraft: React.FC<{ color: string }> = ({ color }) => (
  <group>
    <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
      <cylinderGeometry args={[0.15, 0.08, 1.4, 12]} />
      <meshStandardMaterial color="#606060" metalness={0.7} roughness={0.25} />
    </mesh>
    <mesh position={[0, 0, 0.8]} rotation={[Math.PI / 2, 0, 0]} castShadow>
      <coneGeometry args={[0.08, 0.4, 12]} />
      <meshStandardMaterial color="#505050" metalness={0.7} roughness={0.25} />
    </mesh>
    <mesh position={[0, 0.1, 0.3]} castShadow>
      <sphereGeometry args={[0.1, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
      <meshPhysicalMaterial color="#1a1a3a" transmission={0.3} roughness={0.1} />
    </mesh>
    <mesh position={[0, 0, 0]} castShadow>
      <boxGeometry args={[1.4, 0.03, 0.4]} />
      <meshStandardMaterial color={color} metalness={0.6} roughness={0.3} />
    </mesh>
    <mesh position={[0, 0.15, -0.5]} castShadow>
      <boxGeometry args={[0.03, 0.3, 0.25]} />
      <meshStandardMaterial color={color} metalness={0.6} roughness={0.3} />
    </mesh>
    <mesh position={[0, 0, -0.75]}>
      <sphereGeometry args={[0.06, 8, 8]} />
      <meshBasicMaterial color="#ff6600" />
    </mesh>
  </group>
);

// Commercial Airliner - PBR materials
const CommercialAircraft: React.FC<{ color: string }> = ({ color }) => (
  <group>
    <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
      <cylinderGeometry args={[0.18, 0.18, 2, 12]} />
      <meshStandardMaterial color="#e0e0e0" metalness={0.5} roughness={0.35} />
    </mesh>
    <mesh position={[0, 0, 1.1]} rotation={[Math.PI / 2, 0, 0]} castShadow>
      <sphereGeometry args={[0.18, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
      <meshStandardMaterial color="#d0d0d0" metalness={0.5} roughness={0.35} />
    </mesh>
    <mesh position={[0, 0.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.19, 0.19, 1.8, 12]} />
      <meshStandardMaterial color={color} metalness={0.4} roughness={0.4} />
    </mesh>
    <mesh position={[0, -0.05, 0.2]} castShadow>
      <boxGeometry args={[2.2, 0.04, 0.5]} />
      <meshStandardMaterial color="#d0d0d0" metalness={0.5} roughness={0.35} />
    </mesh>
    <mesh position={[0, 0.25, -0.85]} castShadow>
      <boxGeometry args={[0.04, 0.5, 0.35]} />
      <meshStandardMaterial color={color} metalness={0.5} roughness={0.35} />
    </mesh>
    <mesh position={[0, 0.05, -0.9]} castShadow>
      <boxGeometry args={[0.7, 0.03, 0.2]} />
      <meshStandardMaterial color="#d0d0d0" metalness={0.5} roughness={0.35} />
    </mesh>
    {[-0.5, 0.5].map((x, i) => (
      <mesh key={i} position={[x, -0.12, 0.1]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.1, 0.35, 12]} />
        <meshStandardMaterial color="#505050" metalness={0.6} roughness={0.3} />
      </mesh>
    ))}
  </group>
);

// Private/Small Aircraft - PBR materials
const PrivateAircraft: React.FC<{ color: string }> = ({ color }) => (
  <group>
    <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
      <cylinderGeometry args={[0.12, 0.1, 1, 12]} />
      <meshStandardMaterial color="#f0f0f0" metalness={0.4} roughness={0.4} />
    </mesh>
    <mesh position={[0, 0, 0.6]} rotation={[Math.PI / 2, 0, 0]} castShadow>
      <coneGeometry args={[0.1, 0.3, 12]} />
      <meshStandardMaterial color="#d0d0d0" metalness={0.4} roughness={0.4} />
    </mesh>
    <mesh position={[0, 0.02, 0]} castShadow>
      <boxGeometry args={[1.4, 0.02, 0.2]} />
      <meshStandardMaterial color={color} metalness={0.4} roughness={0.4} />
    </mesh>
    <mesh position={[0, 0.12, -0.45]} castShadow>
      <boxGeometry args={[0.02, 0.2, 0.15]} />
      <meshStandardMaterial color={color} metalness={0.4} roughness={0.4} />
    </mesh>
    <mesh position={[0, 0.02, -0.45]} castShadow>
      <boxGeometry args={[0.4, 0.02, 0.1]} />
      <meshStandardMaterial color="#d0d0d0" metalness={0.4} roughness={0.4} />
    </mesh>
  </group>
);

// Unknown/UAV Aircraft - PBR materials
const UnknownAircraft: React.FC<{ color: string }> = ({ color }) => (
  <group>
    <mesh castShadow>
      <boxGeometry args={[0.3, 0.15, 0.8]} />
      <meshStandardMaterial color="#505050" metalness={0.5} roughness={0.4} />
    </mesh>
    <mesh position={[0, 0, 0.5]} rotation={[Math.PI / 2, 0, 0]} castShadow>
      <coneGeometry args={[0.1, 0.3, 8]} />
      <meshStandardMaterial color="#404040" metalness={0.5} roughness={0.4} />
    </mesh>
    <mesh position={[0, 0.02, 0]} castShadow>
      <boxGeometry args={[1.6, 0.02, 0.25]} />
      <meshStandardMaterial color={color} metalness={0.5} roughness={0.4} />
    </mesh>
    {[-0.15, 0.15].map((x, i) => (
      <mesh key={i} position={[x, 0.1, -0.35]} rotation={[0, 0, i === 0 ? -0.4 : 0.4]} castShadow>
        <boxGeometry args={[0.02, 0.2, 0.15]} />
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.4} />
      </mesh>
    ))}
    <mesh position={[0, -0.1, 0.2]}>
      <sphereGeometry args={[0.06, 8, 8]} />
      <meshPhysicalMaterial color="#111" metalness={0.3} roughness={0.1} clearcoat={1} />
    </mesh>
  </group>
);

// Navigation lights component
const NavigationLights: React.FC = () => {
  const strobeRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (strobeRef.current) {
      // 1Hz strobe blink
      const on = Math.sin(state.clock.elapsedTime * Math.PI * 2) > 0.7;
      (strobeRef.current.material as THREE.MeshBasicMaterial).opacity = on ? 1 : 0;
    }
  });

  return (
    <>
      {/* Red - port (left wing) */}
      <mesh position={[-0.7, 0, 0]}>
        <sphereGeometry args={[0.03, 6, 6]} />
        <meshBasicMaterial color="#ff0000" />
      </mesh>
      <pointLight position={[-0.7, 0, 0]} color="#ff0000" intensity={0.3} distance={2} />

      {/* Green - starboard (right wing) */}
      <mesh position={[0.7, 0, 0]}>
        <sphereGeometry args={[0.03, 6, 6]} />
        <meshBasicMaterial color="#00ff00" />
      </mesh>
      <pointLight position={[0.7, 0, 0]} color="#00ff00" intensity={0.3} distance={2} />

      {/* White strobe - tail */}
      <mesh ref={strobeRef} position={[0, 0.1, -0.6]}>
        <sphereGeometry args={[0.03, 6, 6]} />
        <meshBasicMaterial color="#ffffff" transparent />
      </mesh>
    </>
  );
};

const AircraftModel: React.FC<AircraftModelProps> = React.memo(({
  aircraft,
  isSelected = false,
  onSelect,
  onDeselect,
}) => {
  const groupRef = useRef<THREE.Group>(null);

  const position = useMemo(() => {
    const [x, y, z] = toWorldCoords(aircraft.position.lat, aircraft.position.lng, aircraft.position.altitude);
    return new THREE.Vector3(x, y, z);
  }, [aircraft.position]);

  const color = useMemo(() => getThreatLevelColor(aircraft.threatLevel), [aircraft.threatLevel]);

  useFrame((_state, delta) => {
    if (!groupRef.current) return;

    // Frame-rate independent smooth interpolation
    const lerpFactor = 1 - Math.pow(0.001, delta);
    groupRef.current.position.lerp(position, lerpFactor);

    // Set heading rotation
    const headingRad = (aircraft.heading * Math.PI) / 180;
    groupRef.current.rotation.y = -headingRad + Math.PI / 2;
  });

  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    if (isSelected && onDeselect) onDeselect();
    else if (onSelect) onSelect();
  };

  const renderAircraft = () => {
    switch (aircraft.type) {
      case "Military": return <MilitaryAircraft color={color} />;
      case "Commercial": return <CommercialAircraft color={color} />;
      case "Private": return <PrivateAircraft color={color} />;
      case "Unknown": return <UnknownAircraft color={color} />;
      default: return <CommercialAircraft color={color} />;
    }
  };

  return (
    <group ref={groupRef} onClick={handleClick}>
      {renderAircraft()}
      <NavigationLights />

      {/* Selection indicator */}
      {isSelected && (
        <mesh position={[0, -0.3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.8, 1, 16]} />
          <meshBasicMaterial color={color} transparent opacity={0.6} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Aircraft label sprite */}
      <sprite position={[0, 0.6, 0]} scale={[1.5, 0.4, 1]}>
        <spriteMaterial color={color} transparent opacity={0.8} />
      </sprite>
    </group>
  );
});

AircraftModel.displayName = "AircraftModel";

export default AircraftModel;
