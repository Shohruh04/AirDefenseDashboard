import React, { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import type { Aircraft } from "../../lib/simulation";
import { getThreatLevelColor, getThreatLevelLabel } from "../../lib/simulation";

interface AircraftModelProps {
  aircraft: Aircraft;
}

const AircraftModel: React.FC<AircraftModelProps> = ({ aircraft }) => {
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

  return (
    <group ref={meshRef}>
      {/* Aircraft body */}
      <mesh position={[0, 0, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.5, 2, 8]} />
        <meshLambertMaterial color={aircraftColor} />
      </mesh>

      {/* Wings */}
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[3, 0.1, 0.5]} />
        <meshLambertMaterial color={aircraftColor} />
      </mesh>

      {/* Tail */}
      <mesh position={[0, 0.3, -0.8]} castShadow>
        <boxGeometry args={[0.1, 0.6, 0.3]} />
        <meshLambertMaterial color={aircraftColor} />
      </mesh>

      {/* Aircraft label */}
      <Text
        position={[0, 1.5, 0]}
        fontSize={0.3}
        color="white"
        anchorX="center"
        anchorY="middle"
        billboard
      >
        {aircraft.callsign}
      </Text>

      {/* Threat level indicator */}
      <Text
        position={[0, 1.1, 0]}
        fontSize={0.15}
        color={aircraftColor}
        anchorX="center"
        anchorY="middle"
        billboard
      >
        {getThreatLevelLabel(aircraft.threatLevel)}
      </Text>

      {/* Info text */}
      <Text
        position={[0, 0.7, 0]}
        fontSize={0.12}
        color="#cccccc"
        anchorX="center"
        anchorY="middle"
        billboard
      >
        {`${aircraft.position.altitude}m • ${aircraft.speed}km/h`}
      </Text>

      {/* Trail effect */}
      <mesh position={[0, 0, 1]}>
        <cylinderGeometry args={[0.05, 0.05, 1, 4]} />
        <meshBasicMaterial color={aircraftColor} transparent opacity={0.3} />
      </mesh>
    </group>
  );
};

export default AircraftModel;
