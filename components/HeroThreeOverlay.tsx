"use client";

import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import * as THREE from "three";

/**
 * HeroThreeOverlay — transparent Three.js layer: gym hardware + angular
 * performance frame + particles on a CSS-only background.
 *
 * Circular halo rings removed. Replaced with a segmented rectangular frame,
 * vertical violet light strips, and a reflective floor glow plane.
 *
 * WHERE TO TUNE:
 *  • Object positions / sizes ........... OBJECTS[]
 *  • Motion intensity ................... INTENSITY
 *  • Frame opacity / timing ............. render loop — "frame" block
 *  • Mouse parallax ..................... MOUSE_PARALLAX
 */

export interface HeroOverlayHandle {
  setProgress: (p: number) => void;
  pulse: () => void;
}

const INTENSITY = {
  plateSpin:     1.9,
  dumbbellTilt:  1.3,
  kettlebellSpin: 0.85,
  barbellSpin:   1.0,
  orbit:         1.0,
  drift:         0.65,
};
const MOUSE_PARALLAX = 0.42;

type ObjSpec = {
  kind: "plate" | "dumbbell" | "kettlebell" | "barbell";
  pos: [number, number, number];
  scale: number;
  rot: [number, number, number];
  depth: number;   // 0 = bg (moves least), 1 = fg (moves most)
  amp: number;
  dir: 1 | -1;
  heavy?: boolean;
};

const OBJECTS: ObjSpec[] = [
  // Foreground plates — large, partially cropped at the edges
  { kind: "plate",     pos: [-4.8, -0.5,  3.2], scale: 1.62, rot: [ 0.15,  0.50,  0.10], depth: 1.0, amp: 1.00, dir: -1 },
  { kind: "plate",     pos: [ 5.0,  0.5,  3.0], scale: 1.66, rot: [-0.10, -0.50, -0.12], depth: 1.0, amp: 0.95, dir:  1 },
  // Mid-depth dumbbells
  { kind: "dumbbell",  pos: [-3.2,  2.0, -0.6], scale: 1.02, rot: [ 0.20,  0.30,  0.50], depth: 0.55, amp: 0.90, dir:  1 },
  { kind: "dumbbell",  pos: [ 3.5, -0.4, -0.4], scale: 1.06, rot: [-0.15, -0.40, -0.35], depth: 0.55, amp: 0.90, dir: -1 },
  // Kettlebell — lower-right, heavy inertia
  { kind: "kettlebell",pos: [ 2.5, -2.5,  1.2], scale: 1.12, rot: [ 0.00,  0.20,  0.05], depth: 0.70, amp: 0.80, dir:  1, heavy: true },
  // Barbell segment — lower-left
  { kind: "barbell",   pos: [-2.2, -2.3,  0.6], scale: 1.02, rot: [ 0.10,  0.25,  0.18], depth: 0.60, amp: 0.80, dir: -1 },
  // Background depth plates — small, far back, add spatial depth
  { kind: "plate",     pos: [-3.8,  1.2, -3.6], scale: 0.68, rot: [ 0.35,  1.10,  0.15], depth: 0.14, amp: 0.34, dir:  1 },
  { kind: "plate",     pos: [ 3.6, -1.0, -4.2], scale: 0.58, rot: [-0.25, -0.90, -0.08], depth: 0.10, amp: 0.28, dir: -1 },
];

function driveFromProgress(p: number): number {
  const r = (v: number, lo: number, hi: number) =>
    Math.max(0, Math.min(1, (v - lo) / (hi - lo)));
  if (p < 0.15) return r(p, 0, 0.15) * 0.022;
  if (p < 0.35) return 0.022 + r(p, 0.15, 0.35) * 0.19;
  if (p < 0.65) return 0.21 + r(p, 0.35, 0.65) * 0.52;
  if (p < 0.9)  return 0.73 + r(p, 0.65, 0.9)  * 0.46;
  return 1.19 + r(p, 0.9, 1.0) * 0.10;
}
const ramp = (v: number, lo: number, hi: number) =>
  Math.max(0, Math.min(1, (v - lo) / (hi - lo)));
const smoothstep = (a: number, b: number, v: number) => {
  const t = Math.max(0, Math.min(1, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

// ── Material helpers ──────────────────────────────────────────────────────────
function metalMat() {
  return new THREE.MeshStandardMaterial({ color: 0x12121a, metalness: 0.93, roughness: 0.32 });
}
function rubberMat() {
  return new THREE.MeshStandardMaterial({ color: 0x0c0c10, metalness: 0.50, roughness: 0.60 });
}
function chromeMat() {
  return new THREE.MeshStandardMaterial({ color: 0x9a9aaa, metalness: 1.0, roughness: 0.16 });
}

// ── Procedural geometry builders ─────────────────────────────────────────────
function buildPlate(): THREE.Group {
  const g = new THREE.Group();
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.34, 56), rubberMat());
  disc.rotation.x = Math.PI / 2;
  g.add(disc);
  g.add(new THREE.Mesh(new THREE.TorusGeometry(1.58, 0.06, 16, 60), chromeMat()));
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.42, 40), metalMat());
  hub.rotation.x = Math.PI / 2;
  g.add(hub);
  g.add(new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.07, 14, 36), chromeMat()));
  return g;
}

function buildDumbbell(): THREE.Group {
  const g = new THREE.Group();
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 1.9, 24), chromeMat());
  handle.rotation.z = Math.PI / 2;
  g.add(handle);
  for (const x of [-1.05, 1.05]) {
    const head = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.70, 40), metalMat());
    head.rotation.z = Math.PI / 2;
    head.position.x = x;
    g.add(head);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.05, 14, 44), chromeMat());
    ring.rotation.y = Math.PI / 2;
    ring.position.x = x;
    g.add(ring);
  }
  return g;
}

function buildBarbell(): THREE.Group {
  const g = new THREE.Group();
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.10, 4.3, 24), chromeMat());
  bar.rotation.z = Math.PI / 2;
  g.add(bar);
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.18, 48), rubberMat());
  plate.rotation.z = Math.PI / 2;
  plate.position.x = 1.45;
  g.add(plate);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.045, 14, 48), chromeMat());
  rim.rotation.y = Math.PI / 2;
  rim.position.x = 1.45;
  g.add(rim);
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.32, 24), metalMat());
  collar.rotation.z = Math.PI / 2;
  collar.position.x = 1.02;
  g.add(collar);
  return g;
}

function buildKettlebell(): THREE.Group {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.95, 40, 32), metalMat());
  body.scale.y = 0.92;
  g.add(body);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.13, 18, 40, Math.PI), metalMat());
  handle.position.y = 0.78;
  handle.rotation.z = Math.PI;
  g.add(handle);
  return g;
}

// ── Angular performance frame ─────────────────────────────────────────────────
type FrameRefs = {
  group: THREE.Group;
  frameMat: THREE.LineBasicMaterial;
  cornerMat: THREE.LineBasicMaterial;
  scanMat: THREE.LineBasicMaterial;
  stripMatL: THREE.MeshBasicMaterial;
  stripMatR: THREE.MeshBasicMaterial;
  floorMat: THREE.MeshBasicMaterial;
};

function buildPerformanceFrame(
  disposables: Array<THREE.BufferGeometry | THREE.Material>
): FrameRefs {
  const group = new THREE.Group();
  group.position.z = -1.0; // behind objects, in front of bg

  const W = 2.62, H = 2.02, CS = 0.38; // half-width, half-height, corner bracket size

  // ── Main rectangular outline ──
  const rPts = new Float32Array([
    -W,  H, 0,   W,  H, 0,
     W,  H, 0,   W, -H, 0,
     W, -H, 0,  -W, -H, 0,
    -W, -H, 0,  -W,  H, 0,
  ]);
  const rGeo = new THREE.BufferGeometry();
  rGeo.setAttribute("position", new THREE.BufferAttribute(rPts, 3));
  disposables.push(rGeo);
  const frameMat = new THREE.LineBasicMaterial({
    color: 0x3e28a0, transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  disposables.push(frameMat);
  group.add(new THREE.LineSegments(rGeo, frameMat));

  // ── Corner accent brackets (L-shaped, brighter) ──
  const cPts = new Float32Array([
    // TL
    -W, H - CS, 0,  -W, H, 0,   -W, H, 0,  -W + CS, H, 0,
    // TR
     W - CS, H, 0,   W, H, 0,    W, H, 0,   W, H - CS, 0,
    // BL
    -W, -H + CS, 0, -W, -H, 0,  -W, -H, 0, -W + CS, -H, 0,
    // BR
     W - CS, -H, 0,  W, -H, 0,   W, -H, 0,  W, -H + CS, 0,
  ]);
  const cGeo = new THREE.BufferGeometry();
  cGeo.setAttribute("position", new THREE.BufferAttribute(cPts, 3));
  disposables.push(cGeo);
  const cornerMat = new THREE.LineBasicMaterial({
    color: 0x7a4cff, transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  disposables.push(cornerMat);
  group.add(new THREE.LineSegments(cGeo, cornerMat));

  // ── Horizontal scan accent lines (short segments near side edges) ──
  const sPts = new Float32Array([
    -W, H * 0.36, 0,  -W + 0.48, H * 0.36, 0,
     W - 0.48, H * 0.36, 0,   W, H * 0.36, 0,
    -W, -H * 0.36, 0, -W + 0.48, -H * 0.36, 0,
     W - 0.48, -H * 0.36, 0,  W, -H * 0.36, 0,
  ]);
  const sGeo = new THREE.BufferGeometry();
  sGeo.setAttribute("position", new THREE.BufferAttribute(sPts, 3));
  disposables.push(sGeo);
  const scanMat = new THREE.LineBasicMaterial({
    color: 0x5c38c8, transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  disposables.push(scanMat);
  group.add(new THREE.LineSegments(sGeo, scanMat));

  // ── Vertical light strips (left and right of center text) ──
  const vGeo = new THREE.PlaneGeometry(0.022, 5.0);
  disposables.push(vGeo);
  const stripMatL = new THREE.MeshBasicMaterial({
    color: 0x7a4cff, transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  });
  const stripMatR = new THREE.MeshBasicMaterial({
    color: 0x7a4cff, transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  });
  disposables.push(stripMatL, stripMatR);
  const vL = new THREE.Mesh(vGeo, stripMatL);
  const vR = new THREE.Mesh(vGeo, stripMatR);
  vL.position.set(-W, 0, 0.06);
  vR.position.set( W, 0, 0.06);
  group.add(vL, vR);

  // ── Reflective floor platform glow ──
  const fGeo = new THREE.PlaneGeometry(7.8, 0.75);
  disposables.push(fGeo);
  const floorMat = new THREE.MeshBasicMaterial({
    color: 0x3818a8, transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  });
  disposables.push(floorMat);
  const floor = new THREE.Mesh(fGeo, floorMat);
  floor.rotation.x = -Math.PI * 0.36;
  floor.position.set(0, -H - 0.55, 0.5);
  group.add(floor);

  return { group, frameMat, cornerMat, scanMat, stripMatL, stripMatR, floorMat };
}

// ─────────────────────────────────────────────────────────────────────────────

const HeroThreeOverlay = forwardRef<HeroOverlayHandle, { className?: string; style?: React.CSSProperties }>(
  function HeroThreeOverlay({ className, style }, ref) {
    const mountRef = useRef<HTMLDivElement | null>(null);
    const targetP  = useRef(0);
    const smoothP  = useRef(0);
    const heavyP   = useRef(0);
    const pulseRef = useRef(0);
    const mouse    = useRef({ x: 0, y: 0, sx: 0, sy: 0 });

    useImperativeHandle(ref, () => ({
      setProgress: (p) => { targetP.current = Math.max(0, Math.min(1, p)); },
      pulse: () => { pulseRef.current = 1; },
    }));

    useEffect(() => {
      const mount = mountRef.current;
      if (!mount) return;

      const reduce   = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const isMobile = window.matchMedia("(max-width: 767px)").matches;
      if (isMobile) return;

      let width  = mount.clientWidth  || window.innerWidth;
      let height = mount.clientHeight || window.innerHeight;

      const scene    = new THREE.Scene();
      const camera   = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
      camera.position.set(0, 0, 8);

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(width, height);
      renderer.setClearColor(0x000000, 0);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      mount.appendChild(renderer.domElement);
      renderer.domElement.style.width  = "100%";
      renderer.domElement.style.height = "100%";

      // ── Lighting — tuned for graphite objects on dark CSS bg ──────────────
      scene.add(new THREE.AmbientLight(0x38384a, 1.5));
      const key = new THREE.DirectionalLight(0xdde0ff, 3.4);
      key.position.set(4, 5, 6);
      scene.add(key);
      const fill = new THREE.DirectionalLight(0xa8aec8, 1.15);
      fill.position.set(-6, -2, 4);
      scene.add(fill);
      const rimL = new THREE.PointLight(0x7a4cff, 24, 46, 2);
      rimL.position.set(-3, 1, -5);
      scene.add(rimL);
      const rimR = new THREE.PointLight(0x7a4cff, 15, 46, 2);
      rimR.position.set(4, -2, -4);
      scene.add(rimR);
      // Back-fill so graphite objects read against pure dark
      const back = new THREE.DirectionalLight(0x4a3070, 1.0);
      back.position.set(0, -3, -8);
      scene.add(back);

      // ── Build weight objects ──────────────────────────────────────────────
      const root3 = new THREE.Group();
      scene.add(root3);

      type Tracked = { group: THREE.Group; spec: ObjSpec; base: THREE.Vector3 };
      const tracked: Tracked[] = [];
      const disposables: Array<THREE.BufferGeometry | THREE.Material> = [];

      for (const spec of OBJECTS) {
        const g =
          spec.kind === "plate"     ? buildPlate()     :
          spec.kind === "dumbbell"  ? buildDumbbell()  :
          spec.kind === "barbell"   ? buildBarbell()   :
                                      buildKettlebell();
        g.position.set(...spec.pos);
        g.rotation.set(...spec.rot);
        g.scale.setScalar(spec.scale);
        root3.add(g);
        tracked.push({ group: g, spec, base: new THREE.Vector3(...spec.pos) });
        g.traverse((o) => {
          if (o instanceof THREE.Mesh) {
            disposables.push(o.geometry);
            if (Array.isArray(o.material)) disposables.push(...o.material);
            else disposables.push(o.material);
          }
        });
      }

      // ── Angular performance frame ─────────────────────────────────────────
      const frame = buildPerformanceFrame(disposables);
      scene.add(frame.group);

      // ── Particles ────────────────────────────────────────────────────────
      const PC = 100;
      const pGeo = new THREE.BufferGeometry();
      const pPos = new Float32Array(PC * 3);
      for (let i = 0; i < PC; i++) {
        pPos[i * 3]     = (Math.random() - 0.5) * 14;
        pPos[i * 3 + 1] = (Math.random() - 0.5) * 9;
        pPos[i * 3 + 2] = (Math.random() - 0.5) * 6 - 1;
      }
      pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
      const pMat = new THREE.PointsMaterial({
        color: 0xb0a0ff, size: 0.032, transparent: true, opacity: 0,
        blending: THREE.AdditiveBlending, depthWrite: false,
      });
      const particles = new THREE.Points(pGeo, pMat);
      scene.add(particles);
      disposables.push(pGeo, pMat);

      // ── Mouse ─────────────────────────────────────────────────────────────
      const onMouse = (e: MouseEvent) => {
        mouse.current.x = (e.clientX / window.innerWidth)  * 2 - 1;
        mouse.current.y = (e.clientY / window.innerHeight) * 2 - 1;
      };
      window.addEventListener("mousemove", onMouse);

      // ── Resize ────────────────────────────────────────────────────────────
      const ro = new ResizeObserver(() => {
        width  = mount.clientWidth  || width;
        height = mount.clientHeight || height;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      });
      ro.observe(mount);

      // ── Visibility pause ──────────────────────────────────────────────────
      let visible = true;
      const io = new IntersectionObserver(
        (e) => { visible = e[0]?.isIntersecting ?? true; },
        { threshold: 0 }
      );
      io.observe(mount);

      // ── Render loop ───────────────────────────────────────────────────────
      let raf = 0;
      let t   = 0;

      const renderFrame = () => {
        smoothP.current += (targetP.current - smoothP.current) * (reduce ? 1 : 0.09);
        heavyP.current  += (targetP.current - heavyP.current)  * (reduce ? 1 : 0.05);
        mouse.current.sx += (mouse.current.x - mouse.current.sx) * 0.06;
        mouse.current.sy += (mouse.current.y - mouse.current.sy) * 0.06;
        if (pulseRef.current > 0.001) pulseRef.current *= 0.90;
        else pulseRef.current = 0;

        const p         = smoothP.current;
        const drive     = driveFromProgress(p);
        const driveH    = driveFromProgress(heavyP.current);
        const peak      = smoothstep(0.60, 0.90, p);
        const openOut   = ramp(0.90, 1.0, p);
        const breath    = reduce ? 0 : Math.sin(t * 0.7) * 0.012;
        const frozen    = 1 - smoothstep(0.0, 0.15, p);
        const vib       = pulseRef.current * Math.sin(t * 40) * 0.012;
        const driftF    = smoothstep(0.30, 0.62, p);

        // ── Weight objects ────────────────────────────────────────────────
        tracked.forEach(({ group, spec, base }, idx) => {
          const d    = spec.heavy ? driveH : drive;
          const sign = spec.dir;

          const spin =
            spec.kind === "plate"     ? d * INTENSITY.plateSpin     :
            spec.kind === "dumbbell"  ? d * INTENSITY.dumbbellTilt  :
            spec.kind === "barbell"   ? d * INTENSITY.barbellSpin   :
                                        d * INTENSITY.kettlebellSpin;

          group.rotation.z = spec.rot[2] + sign * spin + breath * frozen * spec.amp;
          group.rotation.x = spec.rot[0] + Math.sin(d * 1.3) * 0.18 * spec.amp;
          group.rotation.y = spec.rot[1] + sign * d * 0.28;

          const ph    = idx * 1.7;
          const dX    = Math.sin(d * 2.2 + ph) * INTENSITY.drift * spec.amp * driftF;
          const dY    = Math.cos(d * 1.8 + ph * 1.3) * INTENSITY.drift * 0.6 * spec.amp * driftF;
          const ang   = d * 1.4 * sign;
          const orbR  = peak * INTENSITY.orbit * spec.amp;
          const ox    = Math.cos(ang) * orbR;
          const oy    = Math.sin(ang) * orbR;
          const outX  = Math.sign(base.x || 1) * openOut * 0.7 * spec.amp;
          const outY  = Math.sign(base.y || 1) * openOut * 0.3 * spec.amp;
          const par   = MOUSE_PARALLAX * spec.depth;

          group.position.x = base.x + dX + ox + outX + mouse.current.sx * par + vib;
          group.position.y = base.y + dY + oy + outY - mouse.current.sy * par * 0.6;
          group.position.z = base.z;
        });

        // ── Angular performance frame ─────────────────────────────────────
        const fAct   = smoothstep(0.12, 0.40, p) * (1 - 0.28 * openOut);
        const fBoost = peak * 0.24 + pulseRef.current * 0.42;
        // Vertical strips flicker very gently
        const flicker = 1 + (reduce ? 0 : Math.sin(t * 2.6) * 0.035);

        frame.frameMat.opacity  = Math.min(0.50, fAct * 0.44 + fBoost * 0.48);
        frame.cornerMat.opacity = Math.min(0.82, fAct * 0.68 + fBoost * 0.85);
        frame.scanMat.opacity   = Math.min(0.52, fAct * 0.46 + fBoost * 0.38);
        frame.stripMatL.opacity = Math.min(0.58, (fAct * 0.52 + fBoost * 0.70) * flicker);
        frame.stripMatR.opacity = Math.min(0.58, (fAct * 0.52 + fBoost * 0.70) * flicker);
        frame.floorMat.opacity  = Math.min(0.44, smoothstep(0.24, 0.56, p) * 0.40 + peak * 0.09);
        // Very subtle breathing rotation (barely perceptible — premium feel)
        frame.group.rotation.z  = Math.sin(t * 0.055) * 0.003;
        frame.group.position.x  = mouse.current.sx * 0.10;
        frame.group.position.y  = -mouse.current.sy * 0.05;

        // ── Particles ─────────────────────────────────────────────────────
        pMat.opacity          = 0.16 + peak * 0.22 + pulseRef.current * 0.12;
        particles.rotation.y  = drive * 0.14 + mouse.current.sx * 0.04;
        particles.rotation.z  = t * 0.004;

        renderer.render(scene, camera);

        if (!reduce) {
          t += 0.016;
          if (visible) raf = requestAnimationFrame(renderFrame);
          else raf = requestAnimationFrame(() => {
            setTimeout(() => (raf = requestAnimationFrame(renderFrame)), 150);
          });
        }
      };

      if (reduce) {
        targetP.current = smoothP.current = heavyP.current = 0.22;
        renderFrame();
      } else {
        raf = requestAnimationFrame(renderFrame);
      }

      return () => {
        cancelAnimationFrame(raf);
        window.removeEventListener("mousemove", onMouse);
        ro.disconnect();
        io.disconnect();
        disposables.forEach((d) => d.dispose());
        renderer.dispose();
        if (renderer.domElement.parentNode === mount)
          mount.removeChild(renderer.domElement);
      };
    }, []);

    return <div ref={mountRef} className={className} style={style} aria-hidden />;
  }
);

export default HeroThreeOverlay;
