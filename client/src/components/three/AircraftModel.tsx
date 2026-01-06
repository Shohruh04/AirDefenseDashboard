import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Aircraft } from "../../lib/simulation";
import { getThreatLevelColor } from "../../lib/simulation";

interface AircraftModelProps {
  aircraft: Aircraft;
  isSelected?: boolean;
  onSelect?: () => void;
  onDeselect?: () => void;
}

// Military/Fighter Aircraft
const MilitaryAircraft: React.FC<{ color: string }> = ({ color }) => (
  <group>
    {/* Fuselage */}
    <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
      <cylinderGeometry args={[0.15, 0.08, 1.4, 8]} />
      <meshLambertMaterial color="#808080" />
    </mesh>
    {/* Nose */}
    <mesh position={[0, 0, 0.8]} rotation={[Math.PI / 2, 0, 0]} castShadow>
      <coneGeometry args={[0.08, 0.4, 8]} />
      <meshLambertMaterial color="#606060" />
    </mesh>
    {/* Cockpit */}
    <mesh position={[0, 0.1, 0.3]} castShadow>
      <sphereGeometry args={[0.1, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
      <meshBasicMaterial color="#1a1a3a" />
    </mesh>
    {/* Wings */}
    <mesh position={[0, 0, 0]} castShadow>
      <boxGeometry args={[1.4, 0.03, 0.4]} />
      <meshLambertMaterial color={color} />
    </mesh>
    {/* Tail */}
    <mesh position={[0, 0.15, -0.5]} castShadow>
      <boxGeometry args={[0.03, 0.3, 0.25]} />
      <meshLambertMaterial color={color} />
    </mesh>
    {/* Engine glow */}
    <mesh position={[0, 0, -0.75]}>
      <sphereGeometry args={[0.06, 6, 6]} />
      <meshBasicMaterial color="#ff6600" />
    </mesh>
  </group>
);

// Commercial Airliner
const CommercialAircraft: React.FC<{ color: string }> = ({ color }) => (
  <group>
    {/* Fuselage */}
    <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
      <cylinderGeometry args={[0.18, 0.18, 2, 8]} />
      <meshLambertMaterial color="#e0e0e0" />
    </mesh>
    {/* Nose */}
    <mesh position={[0, 0, 1.1]} rotation={[Math.PI / 2, 0, 0]} castShadow>
      <sphereGeometry args={[0.18, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
      <meshLambertMaterial color="#d0d0d0" />
    </mesh>
    {/* Color stripe */}
    <mesh position={[0, 0.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.19, 0.19, 1.8, 8]} />
      <meshLambertMaterial color={color} />
    </mesh>
    {/* Wings */}
    <mesh position={[0, -0.05, 0.2]} castShadow>
      <boxGeometry args={[2.2, 0.04, 0.5]} />
      <meshLambertMaterial color="#d0d0d0" />
    </mesh>
    {/* Tail */}
    <mesh position={[0, 0.25, -0.85]} castShadow>
      <boxGeometry args={[0.04, 0.5, 0.35]} />
      <meshLambertMaterial color={color} />
    </mesh>
    {/* Horizontal stabilizer */}
    <mesh position={[0, 0.05, -0.9]} castShadow>
      <boxGeometry args={[0.7, 0.03, 0.2]} />
      <meshLambertMaterial color="#d0d0d0" />
    </mesh>
    {/* Engines */}
    {[-0.5, 0.5].map((x, i) => (
      <mesh key={i} position={[x, -0.12, 0.1]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.1, 0.35, 8]} />
        <meshLambertMaterial color="#606060" />
      </mesh>
    ))}
  </group>
);

// Private/Small Aircraft
const PrivateAircraft: React.FC<{ color: string }> = ({ color }) => (
  <group>
    {/* Body */}
    <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
      <cylinderGeometry args={[0.12, 0.1, 1, 8]} />
      <meshLambertMaterial color="#f0f0f0" />
    </mesh>
    {/* Nose */}
    <mesh position={[0, 0, 0.6]} rotation={[Math.PI / 2, 0, 0]} castShadow>
      <coneGeometry args={[0.1, 0.3, 8]} />
      <meshLambertMaterial color="#d0d0d0" />
    </mesh>
    {/* Wings */}
    <mesh position={[0, 0.02, 0]} castShadow>
      <boxGeometry args={[1.4, 0.02, 0.2]} />
      <meshLambertMaterial color={color} />
    </mesh>
    {/* Tail */}
    <mesh position={[0, 0.12, -0.45]} castShadow>
      <boxGeometry args={[0.02, 0.2, 0.15]} />
      <meshLambertMaterial color={color} />
    </mesh>
    {/* Horizontal tail */}
    <mesh position={[0, 0.02, -0.45]} castShadow>
      <boxGeometry args={[0.4, 0.02, 0.1]} />
      <meshLambertMaterial color="#d0d0d0" />
    </mesh>
  </group>
);

// Unknown/UAV Aircraft
const UnknownAircraft: React.FC<{ color: string }> = ({ color }) => (
  <group>
    {/* Body */}
    <mesh castShadow>
      <boxGeometry args={[0.3, 0.15, 0.8]} />
      <meshLambertMaterial color="#505050" />
    </mesh>
    {/* Nose */}
    <mesh position={[0, 0, 0.5]} rotation={[Math.PI / 2, 0, 0]} castShadow>
      <coneGeometry args={[0.1, 0.3, 6]} />
      <meshLambertMaterial color="#404040" />
    </mesh>
    {/* Wings */}
    <mesh position={[0, 0.02, 0]} castShadow>
      <boxGeometry args={[1.6, 0.02, 0.25]} />
      <meshLambertMaterial color={color} />
    </mesh>
    {/* V-Tail */}
    {[-0.15, 0.15].map((x, i) => (
      <mesh key={i} position={[x, 0.1, -0.35]} rotation={[0, 0, i === 0 ? -0.4 : 0.4]} castShadow>
        <boxGeometry args={[0.02, 0.2, 0.15]} />
        <meshLambertMaterial color={color} />
      </mesh>
    ))}
    {/* Sensor dome */}
    <mesh position={[0, -0.1, 0.2]}>
      <sphereGeometry args={[0.06, 6, 6]} />
      <meshBasicMaterial color="#1a1a1a" />
    </mesh>
  </group>
);

const AircraftModel: React.FC<AircraftModelProps> = ({
  aircraft,
  isSelected = false,
  onSelect,
  onDeselect,
}) => {
  const groupRef = useRef<THREE.Group>(null);

  // Convert coordinates
  const position = useMemo(() => {
    const x = (aircraft.position.lng - 10) * 2;
    const z = -(aircraft.position.lat - 50) * 2;
    const y = (aircraft.position.altitude / 1000) * 0.15 + 0.5;
    return new THREE.Vector3(x, y, z);
  }, [aircraft.position]);

  // Get threat color
  const color = useMemo(() => getThreatLevelColor(aircraft.threatLevel), [aircraft.threatLevel]);

  // Animate aircraft
  useFrame(() => {
    if (groupRef.current) {
      // Smooth position interpolation
      groupRef.current.position.lerp(position, 0.1);

      // Set heading rotation
      const headingRad = (aircraft.heading * Math.PI) / 180;
      groupRef.current.rotation.y = -headingRad + Math.PI / 2;
    }
  });

  // Handle click
  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    if (isSelected && onDeselect) {
      onDeselect();
    } else if (onSelect) {
      onSelect();
    }
  };

  // Render correct aircraft type
  const renderAircraft = () => {
    switch (aircraft.type) {
      case "Military":
        return <MilitaryAircraft color={color} />;
      case "Commercial":
        return <CommercialAircraft color={color} />;
      case "Private":
        return <PrivateAircraft color={color} />;
      case "Unknown":
        return <UnknownAircraft color={color} />;
      default:
        return <CommercialAircraft color={color} />;
    }
  };

  return (
    <group ref={groupRef} onClick={handleClick}>
      {renderAircraft()}

      {/* Selection indicator */}
      {isSelected && (
        <mesh position={[0, -0.3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.8, 1, 16]} />
          <meshBasicMaterial color={color} transparent opacity={0.6} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Aircraft label */}
      <sprite position={[0, 0.6, 0]} scale={[1.5, 0.4, 1]}>
        <spriteMaterial color={color} transparent opacity={0.8} />
      </sprite>
    </group>
  );
};

export default AircraftModel;
