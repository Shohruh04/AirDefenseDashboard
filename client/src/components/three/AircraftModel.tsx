import React, { useRef, useState, useMemo } from "react";
import { useFrame, ThreeEvent } from "@react-three/fiber";
import { Text, Billboard, Trail } from "@react-three/drei";
import * as THREE from "three";
import type { Aircraft } from "../../lib/simulation";
import { getThreatLevelColor, getThreatLevelLabel } from "../../lib/simulation";

interface AircraftModelProps {
  aircraft: Aircraft;
  isSelected?: boolean;
  onSelect?: (aircraft: Aircraft) => void;
}

// Realistic Fighter Jet Component
const FighterJet: React.FC<{ color: string; isSelected: boolean }> = ({ color, isSelected }) => {
  const emissiveIntensity = isSelected ? 0.4 : 0;
  const emissiveColor = isSelected ? color : "#000000";

  return (
    <group>
      {/* Main Fuselage - sleek body */}
      <mesh position={[0, 0, 0]} castShadow>
        <capsuleGeometry args={[0.15, 1.8, 8, 16]} />
        <meshStandardMaterial
          color={color}
          metalness={0.7}
          roughness={0.3}
          emissive={emissiveColor}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Nose Cone */}
      <mesh position={[0, 0, 1.2]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <coneGeometry args={[0.15, 0.6, 16]} />
        <meshStandardMaterial
          color={color}
          metalness={0.8}
          roughness={0.2}
          emissive={emissiveColor}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Cockpit Glass */}
      <mesh position={[0, 0.12, 0.5]} rotation={[0.3, 0, 0]} castShadow>
        <sphereGeometry args={[0.12, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color="#1a1a2e"
          metalness={0.9}
          roughness={0.1}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Main Wings - Delta shape */}
      <mesh position={[0, -0.02, -0.2]} castShadow>
        <boxGeometry args={[2.4, 0.04, 0.8]} />
        <meshStandardMaterial
          color={color}
          metalness={0.6}
          roughness={0.4}
          emissive={emissiveColor}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Wing Tips - angled */}
      <mesh position={[1.3, 0, -0.1]} rotation={[0, 0, -0.2]} castShadow>
        <boxGeometry args={[0.3, 0.03, 0.5]} />
        <meshStandardMaterial color={color} metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[-1.3, 0, -0.1]} rotation={[0, 0, 0.2]} castShadow>
        <boxGeometry args={[0.3, 0.03, 0.5]} />
        <meshStandardMaterial color={color} metalness={0.6} roughness={0.4} />
      </mesh>

      {/* Horizontal Stabilizers (Tail Wings) */}
      <mesh position={[0, 0, -1.0]} castShadow>
        <boxGeometry args={[1.0, 0.03, 0.35]} />
        <meshStandardMaterial
          color={color}
          metalness={0.6}
          roughness={0.4}
          emissive={emissiveColor}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Vertical Stabilizer (Tail Fin) */}
      <mesh position={[0, 0.25, -0.9]} castShadow>
        <boxGeometry args={[0.04, 0.5, 0.5]} />
        <meshStandardMaterial
          color={color}
          metalness={0.6}
          roughness={0.4}
          emissive={emissiveColor}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Twin Engines */}
      <mesh position={[0.2, -0.05, -0.8]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.12, 0.6, 12]} />
        <meshStandardMaterial color="#2d2d2d" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[-0.2, -0.05, -0.8]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.12, 0.6, 12]} />
        <meshStandardMaterial color="#2d2d2d" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Engine Exhaust Glow */}
      <mesh position={[0.2, -0.05, -1.15]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshBasicMaterial color="#ff6600" transparent opacity={0.8} />
      </mesh>
      <mesh position={[-0.2, -0.05, -1.15]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshBasicMaterial color="#ff6600" transparent opacity={0.8} />
      </mesh>

      {/* Engine Glow Light */}
      <pointLight position={[0, -0.05, -1.2]} color="#ff4400" intensity={0.5} distance={3} />
    </group>
  );
};

// Commercial Airliner Component
const Airliner: React.FC<{ color: string; isSelected: boolean }> = ({ color, isSelected }) => {
  const emissiveIntensity = isSelected ? 0.4 : 0;
  const emissiveColor = isSelected ? color : "#000000";

  return (
    <group scale={1.2}>
      {/* Main Fuselage - long cylinder */}
      <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <capsuleGeometry args={[0.2, 2.5, 8, 16]} />
        <meshStandardMaterial
          color="#ffffff"
          metalness={0.5}
          roughness={0.4}
          emissive={emissiveColor}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Color Stripe */}
      <mesh position={[0, 0.05, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <capsuleGeometry args={[0.21, 2.4, 8, 16]} />
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.4} />
      </mesh>

      {/* Nose Cone */}
      <mesh position={[0, 0, 1.5]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <coneGeometry args={[0.2, 0.5, 16]} />
        <meshStandardMaterial color="#ffffff" metalness={0.5} roughness={0.4} />
      </mesh>

      {/* Cockpit Windows */}
      <mesh position={[0, 0.1, 1.3]} rotation={[0.4, 0, 0]}>
        <boxGeometry args={[0.15, 0.08, 0.2]} />
        <meshStandardMaterial color="#1a1a3a" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Main Wings */}
      <mesh position={[0, -0.05, 0]} castShadow>
        <boxGeometry args={[3.5, 0.05, 0.6]} />
        <meshStandardMaterial
          color="#ffffff"
          metalness={0.5}
          roughness={0.4}
          emissive={emissiveColor}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Wing Engines */}
      <mesh position={[0.8, -0.15, 0.1]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 0.4, 12]} />
        <meshStandardMaterial color="#404040" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[-0.8, -0.15, 0.1]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 0.4, 12]} />
        <meshStandardMaterial color="#404040" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Tail Section */}
      <mesh position={[0, 0.3, -1.3]} castShadow>
        <boxGeometry args={[0.05, 0.6, 0.4]} />
        <meshStandardMaterial color="#ffffff" metalness={0.5} roughness={0.4} />
      </mesh>

      {/* Horizontal Tail */}
      <mesh position={[0, 0.05, -1.3]} castShadow>
        <boxGeometry args={[1.0, 0.04, 0.3]} />
        <meshStandardMaterial color="#ffffff" metalness={0.5} roughness={0.4} />
      </mesh>
    </group>
  );
};

// Drone/UAV Component
const Drone: React.FC<{ color: string; isSelected: boolean }> = ({ color, isSelected }) => {
  const emissiveIntensity = isSelected ? 0.5 : 0;
  const emissiveColor = isSelected ? color : "#000000";

  return (
    <group scale={0.8}>
      {/* Main Body */}
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[0.4, 0.15, 1.2]} />
        <meshStandardMaterial
          color="#303030"
          metalness={0.6}
          roughness={0.4}
          emissive={emissiveColor}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Nose Sensor */}
      <mesh position={[0, -0.05, 0.7]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <sphereGeometry args={[0.1, 12, 12]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Long Wings */}
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[3.0, 0.03, 0.3]} />
        <meshStandardMaterial
          color="#404040"
          metalness={0.5}
          roughness={0.5}
          emissive={emissiveColor}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* V-Tail */}
      <mesh position={[0.15, 0.1, -0.6]} rotation={[0, 0, 0.5]} castShadow>
        <boxGeometry args={[0.03, 0.3, 0.25]} />
        <meshStandardMaterial color="#404040" metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh position={[-0.15, 0.1, -0.6]} rotation={[0, 0, -0.5]} castShadow>
        <boxGeometry args={[0.03, 0.3, 0.25]} />
        <meshStandardMaterial color="#404040" metalness={0.5} roughness={0.5} />
      </mesh>

      {/* Propeller */}
      <mesh position={[0, 0, -0.7]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.1, 8]} />
        <meshStandardMaterial color="#202020" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Status Light */}
      <mesh position={[0, 0.1, 0.3]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <pointLight position={[0, 0.1, 0.3]} color={color} intensity={0.3} distance={2} />
    </group>
  );
};

const AircraftModel: React.FC<AircraftModelProps> = ({ aircraft, isSelected = false, onSelect }) => {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  // Convert lat/lng to 3D coordinates
  const position = useMemo(() => {
    const x = (aircraft.position.lng - 10) * 2;
    const z = -(aircraft.position.lat - 50) * 2;
    const y = (aircraft.position.altitude / 1000) * 0.15 + 2;
    return new THREE.Vector3(x, y, z);
  }, [aircraft.position]);

  // Aircraft color based on threat level
  const aircraftColor = getThreatLevelColor(aircraft.threatLevel);

  // Smooth position and rotation updates
  useFrame((state, delta) => {
    if (groupRef.current) {
      // Smooth position interpolation
      groupRef.current.position.lerp(position, delta * 3);

      // Update rotation based on heading (aircraft points in direction of travel)
      const targetRotation = -(aircraft.heading * Math.PI) / 180 + Math.PI / 2;
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        targetRotation,
        delta * 3
      );

      // Slight banking animation based on heading change
      const bankAngle = Math.sin(state.clock.elapsedTime * 2) * 0.05;
      groupRef.current.rotation.z = bankAngle;
    }
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (onSelect) onSelect(aircraft);
  };

  // Scale based on selection/hover
  const scale = isSelected ? 1.4 : hovered ? 1.2 : 1;

  // Choose aircraft model based on type
  const AircraftComponent = useMemo(() => {
    switch (aircraft.type) {
      case "Commercial":
        return <Airliner color={aircraftColor} isSelected={isSelected} />;
      case "Military":
        return <FighterJet color={aircraftColor} isSelected={isSelected} />;
      case "Unknown":
        return <Drone color={aircraftColor} isSelected={isSelected} />;
      default:
        return <FighterJet color={aircraftColor} isSelected={isSelected} />;
    }
  }, [aircraft.type, aircraftColor, isSelected]);

  return (
    <group
      ref={groupRef}
      onClick={handleClick}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default'; }}
      scale={scale}
    >
      {/* Selection Ring */}
      {isSelected && (
        <mesh position={[0, -0.3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.8, 2.2, 32]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.6} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Hover Highlight */}
      {hovered && !isSelected && (
        <mesh position={[0, -0.3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.5, 1.8, 32]} />
          <meshBasicMaterial color={aircraftColor} transparent opacity={0.4} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Aircraft Model */}
      {AircraftComponent}

      {/* Callsign Label */}
      <Billboard position={[0, 1.5, 0]}>
        <Text
          fontSize={0.35}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#000000"
        >
          {aircraft.callsign}
        </Text>
      </Billboard>

      {/* Threat Level Badge */}
      <Billboard position={[0, 1.1, 0]}>
        <mesh>
          <planeGeometry args={[0.8, 0.25]} />
          <meshBasicMaterial color={aircraftColor} transparent opacity={0.9} />
        </mesh>
        <Text
          position={[0, 0, 0.01]}
          fontSize={0.15}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          fontWeight="bold"
        >
          {getThreatLevelLabel(aircraft.threatLevel).toUpperCase()}
        </Text>
      </Billboard>

      {/* Info Text */}
      <Billboard position={[0, 0.75, 0]}>
        <Text
          fontSize={0.12}
          color="#cccccc"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.01}
          outlineColor="#000000"
        >
          {`ALT: ${(aircraft.position.altitude / 1000).toFixed(1)}km | SPD: ${aircraft.speed}km/h`}
        </Text>
      </Billboard>

      {/* Navigation Lights */}
      <pointLight position={[1.2, 0, 0]} color="#00ff00" intensity={0.3} distance={2} />
      <pointLight position={[-1.2, 0, 0]} color="#ff0000" intensity={0.3} distance={2} />
      <pointLight position={[0, 0, -1]} color="#ffffff" intensity={0.2} distance={1.5} />
    </group>
  );
};

export default AircraftModel;
