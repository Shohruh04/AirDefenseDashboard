import React, { useRef, useEffect, useState } from "react";
import { useFrame, ThreeEvent } from "@react-three/fiber";
import { Text, Billboard } from "@react-three/drei";
import * as THREE from "three";
import type { Aircraft } from "../../lib/simulation";
import { getThreatLevelColor, getThreatLevelLabel } from "../../lib/simulation";

interface AircraftModelProps {
  aircraft: Aircraft;
  isSelected?: boolean;
  onSelect?: (aircraft: Aircraft) => void;
}

const AircraftModel: React.FC<AircraftModelProps> = ({ aircraft, isSelected, onSelect }) => {
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef<THREE.Group>(null);
  const previousPosition = useRef({
    lat: aircraft.position.lat,
    lng: aircraft.position.lng,
  });

  // Convert lat/lng to 3D coordinates (simplified projection)
  const lat = aircraft.position.lat;
  const lng = aircraft.position.lng;
  const x = (lng - 10) * 2; // Center around 10° longitude
  const z = -(lat - 50) * 2; // Center around 50° latitude, invert Z
  const y = (aircraft.position.altitude / 1000) * 0.1; // Scale altitude

  useEffect(() => {
    if (meshRef.current) {
      // Set initial position
      meshRef.current.position.set(x, y, z);

      // Calculate rotation based on heading
      const headingRad = (aircraft.heading * Math.PI) / 180;
      meshRef.current.rotation.y = headingRad;
    }
  }, []);

  useFrame((state, delta) => {
    if (meshRef.current) {
      // Smooth interpolation to new position
      const targetPosition = new THREE.Vector3(x, y, z);
      meshRef.current.position.lerp(targetPosition, delta * 2);

      // Update rotation based on heading
      const targetRotation = (aircraft.heading * Math.PI) / 180;
      meshRef.current.rotation.y = THREE.MathUtils.lerp(
        meshRef.current.rotation.y,
        targetRotation,
        delta * 3
      );
    }
  });

  // Aircraft color based on threat level
  const aircraftColor = getThreatLevelColor(aircraft.threatLevel);

  // Scale effect for selection/hover
  const scale = isSelected ? 1.3 : hovered ? 1.15 : 1;

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (onSelect) {
      onSelect(aircraft);
    }
  };

  return (
    <group
      ref={meshRef}
      onClick={handleClick}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default'; }}
      scale={scale}
    >
      {/* Selection ring */}
      {isSelected && (
        <mesh position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[2, 2.3, 32]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.8} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Aircraft body */}
      <mesh position={[0, 0, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.5, 2, 8]} />
        <meshLambertMaterial color={aircraftColor} emissive={isSelected ? aircraftColor : "#000000"} emissiveIntensity={isSelected ? 0.3 : 0} />
      </mesh>

      {/* Wings */}
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[3, 0.1, 0.5]} />
        <meshLambertMaterial color={aircraftColor} emissive={isSelected ? aircraftColor : "#000000"} emissiveIntensity={isSelected ? 0.3 : 0} />
      </mesh>

      {/* Tail */}
      <mesh position={[0, 0.3, -0.8]} castShadow>
        <boxGeometry args={[0.1, 0.6, 0.3]} />
        <meshLambertMaterial color={aircraftColor} emissive={isSelected ? aircraftColor : "#000000"} emissiveIntensity={isSelected ? 0.3 : 0} />
      </mesh>

      {/* Aircraft label */}
      <Billboard>
        <Text
          position={[0, 1.5, 0]}
          fontSize={0.3}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          {aircraft.callsign}
        </Text>
      </Billboard>

      {/* Threat level indicator */}
      <Billboard>
        <Text
          position={[0, 1.1, 0]}
          fontSize={0.15}
          color={aircraftColor}
          anchorX="center"
          anchorY="middle"
        >
          {getThreatLevelLabel(aircraft.threatLevel)}
        </Text>
      </Billboard>

      {/* Info text */}
      <Billboard>
        <Text
          position={[0, 0.7, 0]}
          fontSize={0.12}
          color="#cccccc"
          anchorX="center"
          anchorY="middle"
        >
          {`${aircraft.position.altitude}m • ${aircraft.speed}km/h`}
        </Text>
      </Billboard>

      {/* Trail effect */}
      <mesh position={[0, 0, 1]}>
        <cylinderGeometry args={[0.05, 0.05, 1, 4]} />
        <meshBasicMaterial color={aircraftColor} transparent opacity={0.3} />
      </mesh>
    </group>
  );
};

export default AircraftModel;
