"use client";

import { useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

/* A weight plate (matte black, subtle specular) */
function Plate({ x, scaleRef }: { x: number; scaleRef?: React.MutableRefObject<number> }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (ref.current && scaleRef) {
      const target = scaleRef.current;
      const s = ref.current.scale.x + (target - ref.current.scale.x) * 0.12;
      ref.current.scale.setScalar(THREE.MathUtils.clamp(s, 0.0001, 1));
    }
  });
  return (
    <mesh ref={ref} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]} scale={scaleRef ? 0.0001 : 1}>
      <cylinderGeometry args={[0.9, 0.9, 0.16, 48]} />
      <meshStandardMaterial color="#0d0d11" metalness={0.45} roughness={0.55} />
    </mesh>
  );
}

function Barbell({
  progressRef,
  paused,
}: {
  progressRef: React.MutableRefObject<number>;
  paused: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const outer = useRef(0);
  const { camera } = useThree();

  useFrame((_, delta) => {
    const p = progressRef.current;
    // outer plates appear in the 33–66% band
    outer.current = THREE.MathUtils.clamp((p - 0.33) / 0.18, 0, 1);

    if (group.current && !paused) {
      // turntable: one rotation / 25s on the long (X) axis
      group.current.rotation.x += delta * ((Math.PI * 2) / 25);
    }
    // camera: pull in (0–33), track right (33–66), pull back (66–100)
    const cam = camera as THREE.PerspectiveCamera;
    const dolly = p < 0.33 ? 8 - p * 3 : p < 0.66 ? 7 : 7 + (p - 0.66) * 4;
    cam.position.z += (dolly - cam.position.z) * 0.06;
    cam.position.x += ((p > 0.33 && p < 0.66 ? 0.8 : 0) - cam.position.x) * 0.05;
    cam.lookAt(0, 0, 0);
  });

  return (
    <group ref={group} rotation={[0.25, 0, 0]}>
      {/* bar */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.1, 0.1, 8, 32]} />
        <meshStandardMaterial color="#b9bdc6" metalness={0.95} roughness={0.32} />
      </mesh>
      {/* sleeves */}
      {[-2.6, 2.6].map((x) => (
        <mesh key={x} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.16, 0.16, 1.0, 32]} />
          <meshStandardMaterial color="#8d9098" metalness={0.9} roughness={0.4} />
        </mesh>
      ))}
      {/* inner plates (always) */}
      <Plate x={-2.15} />
      <Plate x={2.15} />
      {/* outer plates (premium step) */}
      <Plate x={-2.95} scaleRef={outer} />
      <Plate x={2.95} scaleRef={outer} />
    </group>
  );
}

function Lights() {
  return (
    <>
      <ambientLight intensity={0.2} />
      <directionalLight position={[5, 7, 5]} intensity={1.1} color="#fff6ec" castShadow />
      <directionalLight position={[-5, 3, -4]} intensity={0.4} color="#7a4cff" />
      <pointLight position={[0, 4, 3]} intensity={0.6} color="#c9b8ff" />
    </>
  );
}

export default function PricingScene({
  progressRef,
  paused = false,
}: {
  progressRef: React.MutableRefObject<number>;
  paused?: boolean;
}) {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0.4, 8], fov: 32 }}
      gl={{ antialias: true, alpha: true }}
      style={{ position: "absolute", inset: 0 }}
    >
      <Lights />
      <Barbell progressRef={progressRef} paused={paused} />
    </Canvas>
  );
}
