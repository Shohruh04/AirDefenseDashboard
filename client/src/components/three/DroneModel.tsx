import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { Aircraft } from "../../lib/simulation";
import { getThreatLevelColor, toWorldCoords } from "../../lib/simulation";

interface DroneModelProps {
  aircraft: Aircraft;
  isSelected?: boolean;
  onSelect?: () => void;
  onDeselect?: () => void;
}

const DroneModel: React.FC<DroneModelProps> = React.memo(({
  aircraft,
  isSelected = false,
  onSelect,
  onDeselect,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const prop1Ref = useRef<THREE.Mesh>(null);
  const prop2Ref = useRef<THREE.Mesh>(null);
  const prop3Ref = useRef<THREE.Mesh>(null);
  const prop4Ref = useRef<THREE.Mesh>(null);

  const position = useMemo(() => {
    const [x, y, z] = toWorldCoords(aircraft.position.lat, aircraft.position.lng, aircraft.position.altitude);
    return new THREE.Vector3(x, y, z);
  }, [aircraft.position]);

  const color = useMemo(() => getThreatLevelColor(aircraft.threatLevel), [aircraft.threatLevel]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // Smooth position interpolation (frame-rate independent)
    const lerpFactor = 1 - Math.pow(0.001, delta);
    groupRef.current.position.lerp(position, lerpFactor);

    // Heading
    const headingRad = (aircraft.heading * Math.PI) / 180;
    groupRef.current.rotation.y = -headingRad + Math.PI / 2;

    // Hovering oscillation
    groupRef.current.position.y += Math.sin(state.clock.elapsedTime * 3) * 0.005;

    // Spin propellers
    const spinSpeed = 25;
    const t = state.clock.elapsedTime * spinSpeed;
    if (prop1Ref.current) prop1Ref.current.rotation.y = t;
    if (prop2Ref.current) prop2Ref.current.rotation.y = -t;
    if (prop3Ref.current) prop3Ref.current.rotation.y = t;
    if (prop4Ref.current) prop4Ref.current.rotation.y = -t;
  });

  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    if (isSelected && onDeselect) onDeselect();
    else if (onSelect) onSelect();
  };

  const armPositions: [number, number, number][] = [
    [0.4, 0, 0.4],
    [-0.4, 0, 0.4],
    [-0.4, 0, -0.4],
    [0.4, 0, -0.4],
  ];

  const propRefs = [prop1Ref, prop2Ref, prop3Ref, prop4Ref];

  return (
    <group ref={groupRef} onClick={handleClick}>
      {/* Center body */}
      <mesh castShadow>
        <boxGeometry args={[0.3, 0.12, 0.3]} />
        <meshStandardMaterial color="#333" metalness={0.5} roughness={0.4} />
      </mesh>

      {/* Camera/sensor dome */}
      <mesh position={[0, -0.08, 0.05]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshPhysicalMaterial color="#111" metalness={0.3} roughness={0.1} clearcoat={1} />
      </mesh>

      {/* Arms and propellers */}
      {armPositions.map((pos, i) => (
        <group key={i}>
          {/* Arm */}
          <mesh position={[pos[0] / 2, 0, pos[2] / 2]} castShadow>
            <boxGeometry args={[
              Math.abs(pos[0]) > 0 ? 0.45 : 0.04,
              0.04,
              Math.abs(pos[2]) > 0 ? 0.45 : 0.04,
            ]} />
            <meshStandardMaterial color="#444" metalness={0.4} roughness={0.5} />
          </mesh>

          {/* Motor housing */}
          <mesh position={pos} castShadow>
            <cylinderGeometry args={[0.06, 0.06, 0.06, 8]} />
            <meshStandardMaterial color="#222" metalness={0.6} roughness={0.3} />
          </mesh>

          {/* Propeller disc */}
          <mesh ref={propRefs[i]} position={[pos[0], 0.05, pos[2]]}>
            <boxGeometry args={[0.3, 0.01, 0.04]} />
            <meshStandardMaterial color="#666" metalness={0.3} roughness={0.5} transparent opacity={0.7} />
          </mesh>
        </group>
      ))}

      {/* Navigation lights */}
      {/* Front green */}
      <mesh position={[0, 0, 0.2]}>
        <sphereGeometry args={[0.02, 6, 6]} />
        <meshBasicMaterial color="#00ff00" />
      </mesh>
      {/* Rear red */}
      <mesh position={[0, 0, -0.2]}>
        <sphereGeometry args={[0.02, 6, 6]} />
        <meshBasicMaterial color="#ff0000" />
      </mesh>

      {/* Threat color indicator strip */}
      <mesh position={[0, 0.07, 0]}>
        <boxGeometry args={[0.32, 0.01, 0.05]} />
        <meshBasicMaterial color={color} />
      </mesh>

      {/* Selection ring */}
      {isSelected && (
        <mesh position={[0, -0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.6, 0.8, 16]} />
          <meshBasicMaterial color={color} transparent opacity={0.6} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Label */}
      {isSelected && (
        <Html position={[0, 0.5, 0]} center distanceFactor={15}>
          <div style={{
            background: "rgba(0,0,0,0.8)",
            color,
            padding: "2px 6px",
            borderRadius: 4,
            fontSize: 10,
            fontFamily: "monospace",
            whiteSpace: "nowrap",
            border: `1px solid ${color}`,
          }}>
            {aircraft.callsign} [DRONE]
          </div>
        </Html>
      )}
    </group>
  );
});

DroneModel.displayName = "DroneModel";

export default DroneModel;
