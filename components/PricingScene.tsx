"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment } from "@react-three/drei";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import * as THREE from "three";
import { isMobile, prefersReducedMotion } from "@/lib/lenis";

function easeOutBack(value: number) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(value - 1, 3) + c1 * Math.pow(value - 1, 2);
}

function Plate({
  x,
  radius = 0.9,
  width = 0.18,
  scaleRef,
  initialScale = 1,
}: {
  x: number;
  radius?: number;
  width?: number;
  scaleRef?: React.MutableRefObject<number>;
  initialScale?: number;
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (ref.current && scaleRef) {
      const target = scaleRef.current;
      const s = ref.current.scale.x + (target - ref.current.scale.x) * 0.12;
      ref.current.scale.setScalar(THREE.MathUtils.clamp(s, 0.0001, 1.12));
    }
  });
  return (
    <group
      ref={ref}
      position={[x, 0, 0]}
      rotation={[0, 0, Math.PI / 2]}
      scale={scaleRef ? initialScale : 1}
    >
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[radius, radius, width, 64]} />
        <meshStandardMaterial color="#171720" metalness={0.62} roughness={0.3} />
      </mesh>
      <mesh position={[0, width / 2 + 0.006, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius * 0.72, 0.018, 12, 64]} />
        <meshStandardMaterial color="#24242d" metalness={0.72} roughness={0.32} />
      </mesh>
      <mesh position={[0, width / 2 + 0.008, 0]}>
        <cylinderGeometry args={[0.22, 0.22, 0.012, 48]} />
        <meshStandardMaterial color="#15151c" metalness={0.68} roughness={0.36} />
      </mesh>
    </group>
  );
}

function Barbell({
  progressRef,
  paused,
}: {
  progressRef: React.MutableRefObject<number>;
  paused: boolean;
}) {
  const spinner = useRef<THREE.Group>(null);
  const outer = useRef(paused ? 1 : 0);

  useFrame((state, delta) => {
    const p = progressRef.current;
    const plateProgress = THREE.MathUtils.clamp((p - 0.33) / 0.22, 0, 1);
    outer.current = paused ? 1 : easeOutBack(plateProgress);

    if (spinner.current && !paused) {
      spinner.current.rotation.x += delta * ((Math.PI * 2) / 25);
    }

    const cam = state.camera as THREE.PerspectiveCamera;
    const first = THREE.MathUtils.clamp(p / 0.33, 0, 1);
    const middle = THREE.MathUtils.clamp((p - 0.33) / 0.33, 0, 1);
    const last = THREE.MathUtils.clamp((p - 0.66) / 0.34, 0, 1);
    const targetZ = p < 0.33 ? THREE.MathUtils.lerp(9, 6.4, first) : THREE.MathUtils.lerp(6.4, 9, last);
    const targetX = p < 0.33 ? -0.35 : p < 0.66 ? THREE.MathUtils.lerp(-0.35, 1.35, middle) : THREE.MathUtils.lerp(1.35, 0.1, last);
    cam.position.z += (targetZ - cam.position.z) * 0.07;
    cam.position.x += (targetX - cam.position.x) * 0.07;
    cam.position.y += (0.55 - cam.position.y) * 0.07;
    cam.lookAt(0, -0.08, 0);
  });

  return (
    <group position={[-1.4, 1.3, 0.8]} rotation={[0.16, 0.58, -0.12]}>
      <group ref={spinner}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.075, 0.075, 8.8, 48]} />
          <meshPhysicalMaterial
            color="#c7ccd4"
            metalness={1}
            roughness={0.22}
            anisotropy={0.8}
            anisotropyRotation={Math.PI / 2}
          />
        </mesh>

        {[-2.75, 2.75].map((x) => (
          <group key={x}>
            <mesh position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.14, 0.14, 1.35, 48]} />
              <meshStandardMaterial color="#9aa0a8" metalness={0.98} roughness={0.28} />
            </mesh>
            <mesh position={[x + Math.sign(x) * -0.58, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.22, 0.22, 0.12, 48]} />
              <meshStandardMaterial color="#777d86" metalness={0.96} roughness={0.3} />
            </mesh>
          </group>
        ))}

        <Plate x={-2.08} radius={0.96} width={0.2} />
        <Plate x={2.08} radius={0.96} width={0.2} />
        <Plate x={-2.32} radius={0.86} width={0.16} />
        <Plate x={2.32} radius={0.86} width={0.16} />
        <Plate x={-2.58} radius={0.78} width={0.15} scaleRef={outer} initialScale={paused ? 1 : 0.0001} />
        <Plate x={2.58} radius={0.78} width={0.15} scaleRef={outer} initialScale={paused ? 1 : 0.0001} />
      </group>
    </group>
  );
}

function Lights() {
  return (
    <>
      <ambientLight intensity={0.08} />
      <directionalLight
        position={[5.5, 7.5, 4.5]}
        intensity={2.2}
        color="#fff7ed"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight position={[-5, 2.5, -4]} intensity={0.85} color="#7a4cff" />
      <pointLight position={[1.5, 3.5, 3]} intensity={0.9} color="#d8cbff" />
    </>
  );
}

export default function PricingScene({
  progressRef,
}: {
  progressRef: React.MutableRefObject<number>;
}) {
  const root = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(true);
  const [paused] = useState(() => prefersReducedMotion() || isMobile());

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    if (!root.current) return;
    const trigger = ScrollTrigger.create({
      trigger: root.current,
      start: "top bottom",
      end: "bottom top",
      onEnter: () => setVisible(true),
      onEnterBack: () => setVisible(true),
      onLeave: () => setVisible(false),
      onLeaveBack: () => setVisible(false),
    });
    return () => trigger.kill();
  }, []);

  return (
    <div ref={root} className="absolute inset-0">
      <Canvas
        dpr={[1, 2]}
        shadows
        frameloop={paused || !visible ? "demand" : "always"}
        camera={{ position: [-0.35, 0.55, 9], fov: 32 }}
        gl={{ antialias: true, alpha: true }}
        performance={{ min: 0.5 }}
        onCreated={({ gl }) => gl.setClearColor("#07060b", 0)}
        style={{ position: "absolute", inset: 0 }}
      >
        <Suspense fallback={null}>
          <Environment preset="warehouse" environmentIntensity={0.3} />
        </Suspense>
        <Lights />
        <Barbell progressRef={progressRef} paused={paused} />
        <ContactShadows
          position={[0, -1.18, 0]}
          opacity={0.62}
          scale={12}
          blur={2.8}
          far={4}
          frames={1}
          color="#000000"
        />
      </Canvas>
    </div>
  );
}
