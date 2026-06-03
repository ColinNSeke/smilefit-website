"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - addon ships JS with bundled types resolved at runtime
import { GPUComputationRenderer } from "three/examples/jsm/misc/GPUComputationRenderer.js";
import { sampleTextToPoints } from "@/lib/sampleTextToPoints";
import { prefersReducedMotion } from "@/lib/lenis";

/* ── Locked constants ── */
const WIDTH = 30; // 30 × 30 = 900 birds
const BIRDS = WIDTH * WIDTH;
const BOUNDS = 800;
const FORMATION_SCALE = 300;
const BIRD_COLOR = "#EDEAE3";
const SEPARATION = 15;
const ALIGNMENT = 20;
const COHESION = 20;

/* Shaders (inlined — Turbopack can't import .glsl; canonical source in /shaders) */
const positionShader = /* glsl */ `
  uniform float time;
  uniform float delta;
  void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec4 tmpPos = texture2D( texturePosition, uv );
    vec3 position = tmpPos.xyz;
    vec3 velocity = texture2D( textureVelocity, uv ).xyz;
    float phase = tmpPos.w;
    phase = mod( ( phase + delta + length( velocity.xz ) * delta * 3. + max( velocity.y, 0.0 ) * delta * 6. ), 62.83 );
    gl_FragColor = vec4( position + velocity * delta * 15. , phase );
  }
`;

const velocityShader = /* glsl */ `
  uniform float time;
  uniform float testing;
  uniform float delta;
  uniform float separationDistance;
  uniform float alignmentDistance;
  uniform float cohesionDistance;
  uniform float freedomFactor;
  uniform vec3  predator;
  uniform float targetWeight;
  uniform sampler2D textureTarget;

  const float PI = 3.141592653589793;
  const float PI_2 = PI * 2.0;
  const float UPPER_BOUNDS = BOUNDS;
  const float SPEED_LIMIT = 9.0;

  void main() {
    float zoneRadius = separationDistance + alignmentDistance + cohesionDistance;
    float separationThresh = separationDistance / zoneRadius;
    float alignmentThresh = ( separationDistance + alignmentDistance ) / zoneRadius;
    float zoneRadiusSquared = zoneRadius * zoneRadius;
    float width = resolution.x;
    float height = resolution.y;

    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec3 birdPosition, birdVelocity;
    vec3 selfPosition = texture2D( texturePosition, uv ).xyz;
    vec3 selfVelocity = texture2D( textureVelocity, uv ).xyz;

    float dist; vec3 dir; float distSquared; float f; float percent;
    vec3 velocity = selfVelocity;
    float limit = SPEED_LIMIT;

    dir = predator * UPPER_BOUNDS - selfPosition;
    dir.z = 0.;
    dist = length( dir ); distSquared = dist * dist;
    float preyRadius = 150.0; float preyRadiusSq = preyRadius * preyRadius;
    if ( dist < preyRadius ) {
      f = ( distSquared / preyRadiusSq - 1.0 ) * delta * 100.;
      velocity += normalize( dir ) * f; limit += 5.0;
    }

    vec3 central = vec3( 0., 0., 0. );
    dir = selfPosition - central; dir.y *= 2.5;
    velocity -= normalize( dir ) * delta * 5. * ( 1.0 - targetWeight );

    for ( float y = 0.0; y < height; y++ ) {
      for ( float x = 0.0; x < width; x++ ) {
        vec2 ref = vec2( x + 0.5, y + 0.5 ) / resolution.xy;
        birdPosition = texture2D( texturePosition, ref ).xyz;
        dir = birdPosition - selfPosition; dist = length( dir );
        if ( dist < 0.0001 ) continue;
        distSquared = dist * dist;
        if ( distSquared > zoneRadiusSquared ) continue;
        percent = distSquared / zoneRadiusSquared;
        if ( percent < separationThresh ) {
          f = ( separationThresh / percent - 1.0 ) * delta;
          velocity -= normalize( dir ) * f;
        } else if ( percent < alignmentThresh ) {
          float threshDelta = alignmentThresh - separationThresh;
          float adjustedPercent = ( percent - separationThresh ) / threshDelta;
          birdVelocity = texture2D( textureVelocity, ref ).xyz;
          f = ( 0.5 - cos( adjustedPercent * PI_2 ) * 0.5 + 0.5 ) * delta;
          velocity += normalize( birdVelocity ) * f;
        } else {
          float threshDelta = 1.0 - alignmentThresh;
          float adjustedPercent = threshDelta == 0. ? 1. : ( percent - alignmentThresh ) / threshDelta;
          f = ( 0.5 - ( cos( adjustedPercent * PI_2 ) * -0.5 + 0.5 ) ) * delta;
          velocity += normalize( dir ) * f;
        }
      }
    }

    vec3 targetPos = texture2D( textureTarget, uv ).xyz;
    vec3 toTarget = targetPos - selfPosition;
    float tdist = length( toTarget );
    if ( tdist > 0.0001 ) {
      vec3 attractionForce = normalize( toTarget ) * targetWeight * smoothstep( 0.0, 30.0, tdist );
      velocity += attractionForce * 14.0;
      if ( tdist < 6.0 ) velocity *= ( 1.0 - 0.6 * targetWeight );
    }

    if ( length( velocity ) > limit ) velocity = normalize( velocity ) * limit;
    gl_FragColor = vec4( velocity, 1.0 );
  }
`;

const birdVS = /* glsl */ `
  attribute vec2 reference;
  attribute float birdVertex;
  attribute vec3 birdColor;
  uniform sampler2D texturePosition;
  uniform sampler2D textureVelocity;
  varying vec4 vColor;
  uniform float time;
  void main() {
    vec4 tmpPos = texture2D( texturePosition, reference );
    vec3 pos = tmpPos.xyz;
    vec3 velocity = normalize( texture2D( textureVelocity, reference ).xyz );
    vec3 newPosition = position;
    if ( birdVertex == 4.0 || birdVertex == 7.0 ) {
      newPosition.y = sin( tmpPos.w ) * 5.;
    }
    newPosition = mat3( modelMatrix ) * newPosition;
    velocity.z *= -1.;
    float xz = length( velocity.xz );
    float xyz = 1.;
    float x = sqrt( 1. - velocity.y * velocity.y );
    float cosry = velocity.x / xz;
    float sinry = velocity.z / xz;
    float cosrz = x / xyz;
    float sinrz = velocity.y / xyz;
    mat3 maty = mat3( cosry, 0, -sinry, 0, 1, 0, sinry, 0, cosry );
    mat3 matz = mat3( cosrz, sinrz, 0, -sinrz, cosrz, 0, 0, 0, 1 );
    newPosition = maty * matz * newPosition;
    newPosition += pos;
    vColor = vec4( birdColor, 1.0 );
    gl_Position = projectionMatrix * viewMatrix * vec4( newPosition, 1.0 );
  }
`;

const birdFS = /* glsl */ `
  varying vec4 vColor;
  void main() {
    gl_FragColor = vec4( vColor.rgb, 0.9 );
  }
`;

/* easeInOutCubic */
function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/* scroll progress → formation weight (keyframed) */
const KEYS: [number, number][] = [
  [0.0, 0.0], [0.25, 0.1], [0.55, 0.75], [0.8, 1.0], [0.95, 1.0], [1.0, 0.0],
];
function formationWeight(p: number) {
  if (p <= KEYS[0][0]) return KEYS[0][1];
  if (p >= KEYS[KEYS.length - 1][0]) return KEYS[KEYS.length - 1][1];
  for (let i = 0; i < KEYS.length - 1; i++) {
    const [p0, w0] = KEYS[i];
    const [p1, w1] = KEYS[i + 1];
    if (p >= p0 && p <= p1) {
      const t = (p - p0) / (p1 - p0);
      return w0 + (w1 - w0) * easeInOutCubic(t);
    }
  }
  return 0;
}

/* BirdGeometry — ported from the three.js example */
function makeBirdGeometry() {
  const geo = new THREE.BufferGeometry();
  const trianglesPerBird = 3;
  const triangles = BIRDS * trianglesPerBird;
  const points = triangles * 3;
  const vertices = new THREE.BufferAttribute(new Float32Array(points * 3), 3);
  const birdColors = new THREE.BufferAttribute(new Float32Array(points * 3), 3);
  const references = new THREE.BufferAttribute(new Float32Array(points * 2), 2);
  const birdVertex = new THREE.BufferAttribute(new Float32Array(points), 1);
  geo.setAttribute("position", vertices);
  geo.setAttribute("birdColor", birdColors);
  geo.setAttribute("reference", references);
  geo.setAttribute("birdVertex", birdVertex);

  let v = 0;
  const push = (...args: number[]) => { for (const a of args) vertices.array[v++] = a; };
  const wingsSpan = 20;
  for (let f = 0; f < BIRDS; f++) {
    push(0, -0, -20, 0, 4, -20, 0, 0, 30);          // body
    push(0, 0, -15, -wingsSpan, 0, 0, 0, 0, 15);     // left wing
    push(0, 0, 15, wingsSpan, 0, 0, 0, 0, -15);      // right wing
  }
  const col = new THREE.Color(BIRD_COLOR);
  for (let i = 0; i < triangles * 3; i++) {
    const bird = Math.floor(i / 9);
    const x = (bird % WIDTH) / WIDTH;
    const y = Math.floor(bird / WIDTH) / WIDTH;
    references.array[i * 2] = x;
    references.array[i * 2 + 1] = y;
    birdVertex.array[i] = i % 9;
    birdColors.array[i * 3] = col.r;
    birdColors.array[i * 3 + 1] = col.g;
    birdColors.array[i * 3 + 2] = col.b;
  }
  geo.scale(0.2, 0.2, 0.2);
  return geo;
}

export default function BirdsLogo({ progressRef }: { progressRef: React.MutableRefObject<number> }) {
  const mount = useRef<HTMLDivElement | null>(null);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    const el = mount.current;
    if (!el) return;
    if (prefersReducedMotion()) { setFallback(true); return; }

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    } catch {
      setFallback(true);
      return;
    }
    const gl = renderer.getContext();
    if (!gl || !(gl instanceof WebGL2RenderingContext)) {
      renderer.dispose();
      setFallback(true);
      return;
    }

    const W = el.clientWidth || 600;
    const H = el.clientHeight || 240;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, W / H, 1, 3000);
    camera.position.z = 322;

    /* GPU compute */
    const gpu = new GPUComputationRenderer(WIDTH, WIDTH, renderer);
    const dtPosition = gpu.createTexture();
    const dtVelocity = gpu.createTexture();

    // init positions / velocities
    {
      const pos = dtPosition.image.data as Float32Array;
      const vel = dtVelocity.image.data as Float32Array;
      for (let i = 0; i < pos.length; i += 4) {
        pos[i] = (Math.random() - 0.5) * 600;
        pos[i + 1] = (Math.random() - 0.5) * 240;
        pos[i + 2] = (Math.random() - 0.5) * 120;
        pos[i + 3] = 1;
        vel[i] = (Math.random() - 0.5) * 10;
        vel[i + 1] = (Math.random() - 0.5) * 10;
        vel[i + 2] = (Math.random() - 0.5) * 10;
        vel[i + 3] = 1;
      }
    }

    // target texture from sampled "SmileFit"
    const pts = sampleTextToPoints("SmileFit", BIRDS);
    const targetData = new Float32Array(BIRDS * 4);
    for (let i = 0; i < BIRDS; i++) {
      targetData[i * 4] = pts[i * 3] * FORMATION_SCALE;
      targetData[i * 4 + 1] = pts[i * 3 + 1] * FORMATION_SCALE;
      targetData[i * 4 + 2] = pts[i * 3 + 2] * FORMATION_SCALE;
      targetData[i * 4 + 3] = 1;
    }
    const targetTex = new THREE.DataTexture(targetData, WIDTH, WIDTH, THREE.RGBAFormat, THREE.FloatType);
    targetTex.needsUpdate = true;

    const velVar = gpu.addVariable("textureVelocity", velocityShader, dtVelocity);
    const posVar = gpu.addVariable("texturePosition", positionShader, dtPosition);
    gpu.setVariableDependencies(velVar, [posVar, velVar]);
    gpu.setVariableDependencies(posVar, [posVar, velVar]);

    velVar.material.defines.BOUNDS = BOUNDS.toFixed(2);
    Object.assign(velVar.material.uniforms, {
      time: { value: 0 }, delta: { value: 0 }, testing: { value: 1 },
      separationDistance: { value: SEPARATION },
      alignmentDistance: { value: ALIGNMENT },
      cohesionDistance: { value: COHESION },
      freedomFactor: { value: 1 },
      predator: { value: new THREE.Vector3(10, 10, 10) },
      targetWeight: { value: 0 },
      textureTarget: { value: targetTex },
    });
    posVar.material.uniforms.time = { value: 0 };
    posVar.material.uniforms.delta = { value: 0 };

    const err = gpu.init();
    if (err) { console.error(err); renderer.dispose(); el.removeChild(renderer.domElement); setFallback(true); return; }

    /* bird mesh */
    const birdUniforms = {
      texturePosition: { value: null as THREE.Texture | null },
      textureVelocity: { value: null as THREE.Texture | null },
      time: { value: 1.0 },
      delta: { value: 0.0 },
    };
    const birdMat = new THREE.ShaderMaterial({
      uniforms: birdUniforms, vertexShader: birdVS, fragmentShader: birdFS,
      side: THREE.DoubleSide, transparent: true, depthWrite: false,
    });
    const birdMesh = new THREE.Mesh(makeBirdGeometry(), birdMat);
    birdMesh.rotation.y = Math.PI / 2;
    birdMesh.matrixAutoUpdate = false;
    birdMesh.updateMatrix();
    scene.add(birdMesh);

    /* mouse predator (only inside canvas) */
    const predator = velVar.material.uniforms.predator.value as THREE.Vector3;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      if (inside) {
        predator.set((e.clientX - r.left) / r.width - 0.5, -((e.clientY - r.top) / r.height - 0.5), 0);
      } else {
        predator.set(10, 10, 10);
      }
    };
    window.addEventListener("mousemove", onMove);

    /* pause when offscreen */
    let visible = true;
    const io = new IntersectionObserver((entries) => { visible = entries[0]?.isIntersecting ?? true; }, { threshold: 0 });
    io.observe(el);

    /* resize */
    const onResize = () => {
      const w = el.clientWidth, h = el.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);

    /* loop */
    let raf = 0;
    let last = performance.now();
    const animate = () => {
      raf = requestAnimationFrame(animate);
      const now = performance.now();
      let delta = (now - last) / 1000;
      last = now;
      if (!visible) return;
      if (delta > 1) delta = 1;

      velVar.material.uniforms.time.value = now / 1000;
      velVar.material.uniforms.delta.value = delta;
      posVar.material.uniforms.time.value = now / 1000;
      posVar.material.uniforms.delta.value = delta;
      birdUniforms.time.value = now / 1000;
      birdUniforms.delta.value = delta;

      // scroll-driven formation
      velVar.material.uniforms.targetWeight.value = formationWeight(progressRef.current);

      gpu.compute();
      birdUniforms.texturePosition.value = gpu.getCurrentRenderTarget(posVar).texture;
      birdUniforms.textureVelocity.value = gpu.getCurrentRenderTarget(velVar).texture;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", onResize);
      io.disconnect();
      renderer.dispose();
      birdMat.dispose();
      if (renderer.domElement.parentNode === el) el.removeChild(renderer.domElement);
    };
  }, [progressRef]);

  return (
    <div ref={mount} className="relative h-full w-full">
      {fallback && (
        <div className="absolute inset-0 flex items-center justify-center" aria-hidden>
          <span style={{
            fontFamily: "'Archivo Black','Arial Black',sans-serif",
            fontWeight: 900, fontSize: "clamp(40px,7vw,96px)",
            color: BIRD_COLOR, opacity: 0.55, letterSpacing: "-0.02em",
          }}>
            SmileFit
          </span>
        </div>
      )}
    </div>
  );
}
