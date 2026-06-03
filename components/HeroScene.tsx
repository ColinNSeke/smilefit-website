"use client";

import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";

const FIGURE = "/hero-figure.png";

/* ── Figure plane with rim-light tint + dissolution shader ── */
function Figure({
  progressRef,
  mouse,
  paused,
}: {
  progressRef: React.MutableRefObject<number>;
  mouse: React.MutableRefObject<{ x: number; y: number; lx: number; ly: number }>;
  paused: boolean;
}) {
  const tex = useTexture(FIGURE);
  const group = useRef<THREE.Group>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const { camera } = useThree();
  const baseZ = useRef((camera as THREE.PerspectiveCamera).position.z);

  const uniforms = useMemo(
    () => ({
      uTex: { value: tex },
      uTime: { value: 0 },
      uDissolve: { value: 0 },
      uKey: { value: new THREE.Color("#fff4e6") },
      uRim: { value: new THREE.Color("#5B2E9E") },
    }),
    [tex],
  );

  useFrame((state, delta) => {
    const p = progressRef.current;

    // mouse lerp
    mouse.current.lx += (mouse.current.x - mouse.current.lx) * 0.08;
    mouse.current.ly += (mouse.current.y - mouse.current.ly) * 0.08;

    if (group.current) {
      const scrollRotY = THREE.MathUtils.degToRad(15) * p;
      const scrollY = -1.2 * p; // ~translate up
      group.current.rotation.y = THREE.MathUtils.degToRad(4) * mouse.current.lx + scrollRotY;
      group.current.rotation.x = THREE.MathUtils.degToRad(-2) * mouse.current.ly;
      group.current.position.y = scrollY;
    }

    // camera dolly in ~8%
    (camera as THREE.PerspectiveCamera).position.z = baseZ.current * (1 - 0.08 * p);

    if (matRef.current) {
      if (!paused) matRef.current.uniforms.uTime.value += delta;
      // dissolution in final 30% of hero scroll
      const d = THREE.MathUtils.clamp((p - 0.7) / 0.3, 0, 1);
      matRef.current.uniforms.uDissolve.value = d;
    }
  });

  // plane sized to image aspect (1672x941)
  const aspect = 1672 / 941;
  const h = 4.6;
  const w = h * aspect;

  return (
    <group ref={group} position={[1.6, 0, 0]}>
      <mesh>
        <planeGeometry args={[w, h]} />
        <shaderMaterial
          ref={matRef}
          transparent
          uniforms={uniforms}
          vertexShader={/* glsl */ `
            varying vec2 vUv;
            void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
          `}
          fragmentShader={/* glsl */ `
            precision highp float;
            varying vec2 vUv;
            uniform sampler2D uTex;
            uniform float uTime;
            uniform float uDissolve;
            uniform vec3 uKey;
            uniform vec3 uRim;
            float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
            float noise(vec2 p){
              vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.0-2.0*f);
              return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x),u.y);
            }
            void main(){
              vec4 c = texture2D(uTex, vUv);
              if(c.a < 0.04) discard;

              // fake key (warm, top-right) + rim (cool purple, back-left)
              float key = smoothstep(0.2, 1.0, vUv.x) * smoothstep(0.0, 1.0, vUv.y);
              float rim = smoothstep(0.35, 0.0, vUv.x);
              vec3 col = c.rgb;
              col += uKey * key * 0.10;
              col += uRim * rim * 0.35;

              // dissolution: noise threshold rises, burning purple edge
              float n = noise(vUv * 18.0 + uTime * 0.2);
              float edge = uDissolve;
              if(n < edge) discard;
              float burn = smoothstep(edge, edge + 0.08, n);
              col = mix(uRim * 1.6, col, burn);

              float alpha = c.a * (1.0 - smoothstep(0.0, 0.95, uDissolve) * (1.0 - burn));
              gl_FragColor = vec4(col, alpha);
            }
          `}
        />
      </mesh>
    </group>
  );
}

function Lights() {
  return (
    <>
      <ambientLight intensity={0.25} />
      <directionalLight position={[5, 6, 4]} intensity={0.8} color="#fff4e6" />
      <directionalLight position={[-6, 2, -3]} intensity={0.5} color="#5B2E9E" />
    </>
  );
}

export default function HeroScene({
  progressRef,
  paused = false,
}: {
  progressRef: React.MutableRefObject<number>;
  paused?: boolean;
}) {
  const mouse = useRef({ x: 0, y: 0, lx: 0, ly: 0 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!isMobile && !reduce) window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0, 7], fov: 35 }}
      gl={{ antialias: true, alpha: true }}
      style={{ position: "absolute", inset: 0 }}
    >
      <Lights />
      <Figure progressRef={progressRef} mouse={mouse} paused={paused} />
    </Canvas>
  );
}
