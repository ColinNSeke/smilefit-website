"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import * as THREE from "three";

/**
 * HeroThreeOverlay — a transparent Three.js layer that sits ON TOP of the hero
 * video and renders procedural gym hardware (weight plates, dumbbells, a
 * kettlebell) plus two holographic rings and faint particles.
 *
 * It does NOT rebuild the athlete — the video stays the dominant visual. The
 * objects frame the athlete from the foreground / mid-depth and ACTIVATE as the
 * page scrolls. The same scroll progress that scrubs the video is pushed in via
 * the imperative `setProgress(p)` handle.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHERE TO TUNE THINGS
 *  • Object positions / sizes / depth ....... OBJECTS[] below
 *  • Per-phase motion intensity ............. driveFromProgress() + INTENSITY
 *  • Scroll progress entry point ............ setProgress() (called by hero)
 *  • Mouse parallax strength ................ MOUSE_PARALLAX
 *  • CTA pulse reaction ..................... pulse() + pulseRef
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface HeroOverlayHandle {
  /** Scroll progress 0..1 from the hero's pinned ScrollTrigger. */
  setProgress: (p: number) => void;
  /** Brief reaction when the primary CTA is hovered. */
  pulse: () => void;
}

// Global feel knobs — raise for more visible motion, lower for calmer.
const INTENSITY = {
  plateSpin: 1.0, // how far plates rotate across the scroll
  dumbbellTilt: 0.7,
  kettlebellSpin: 0.45,
  ringSpin: 1.5,
  orbit: 0.5, // peak-phase orbital drift amplitude
};
const MOUSE_PARALLAX = 0.35; // world units of sway at screen edge

// Procedural object definitions. `depth` 0 = background (moves least with
// scroll + mouse), 1 = foreground (moves most). `amp` scales scroll motion.
type ObjSpec = {
  kind: "plate" | "dumbbell" | "kettlebell";
  pos: [number, number, number];
  scale: number;
  rot: [number, number, number];
  depth: number;
  amp: number;
  dir: 1 | -1; // rotation direction
  heavy?: boolean; // extra inertia (kettlebell)
};

const OBJECTS: ObjSpec[] = [
  // Foreground plates — large, partially offscreen, close to camera.
  { kind: "plate", pos: [-5.0, -0.6, 3.2], scale: 1.5, rot: [0.15, 0.5, 0.1], depth: 1.0, amp: 1.0, dir: -1 },
  { kind: "plate", pos: [5.1, 0.4, 3.0], scale: 1.55, rot: [-0.1, -0.5, -0.12], depth: 1.0, amp: 0.95, dir: 1 },
  // Mid-depth dumbbells.
  { kind: "dumbbell", pos: [-3.4, 2.3, -1.0], scale: 0.85, rot: [0.2, 0.3, 0.5], depth: 0.5, amp: 0.7, dir: 1 },
  { kind: "dumbbell", pos: [3.7, -0.5, -0.6], scale: 0.9, rot: [-0.15, -0.4, -0.35], depth: 0.5, amp: 0.7, dir: -1 },
  // Kettlebell — lower-right, heavy inertia.
  { kind: "kettlebell", pos: [2.7, -2.7, 1.0], scale: 0.95, rot: [0.0, 0.2, 0.05], depth: 0.7, amp: 0.55, dir: 1, heavy: true },
];

/**
 * Accumulated, eased "motion phase" from scroll progress. Returns a value in
 * roughly 0..1.25 that grows non-linearly through the 5 required phases:
 *   0.00–0.15 frozen (barely moves)
 *   0.15–0.35 activation (visible unlock)
 *   0.35–0.65 clear movement
 *   0.65–0.90 peak
 *   0.90–1.00 open-up
 */
function driveFromProgress(p: number): number {
  const r = (v: number, lo: number, hi: number) =>
    Math.max(0, Math.min(1, (v - lo) / (hi - lo)));
  if (p < 0.15) return r(p, 0, 0.15) * 0.02;
  if (p < 0.35) return 0.02 + r(p, 0.15, 0.35) * 0.18;
  if (p < 0.65) return 0.2 + r(p, 0.35, 0.65) * 0.5;
  if (p < 0.9) return 0.7 + r(p, 0.65, 0.9) * 0.45;
  return 1.15 + r(p, 0.9, 1.0) * 0.1;
}
const ramp = (v: number, lo: number, hi: number) =>
  Math.max(0, Math.min(1, (v - lo) / (hi - lo)));
const smoothstep = (a: number, b: number, v: number) => {
  const t = Math.max(0, Math.min(1, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

// ── Material helpers ──────────────────────────────────────────────────────
function metalMat() {
  // Dark graphite metal; silver edge highlights come from the rim/key lights.
  return new THREE.MeshStandardMaterial({
    color: 0x14141a,
    metalness: 0.92,
    roughness: 0.34,
  });
}
function rubberMat() {
  return new THREE.MeshStandardMaterial({
    color: 0x0c0c10,
    metalness: 0.5,
    roughness: 0.6,
  });
}
function chromeMat() {
  return new THREE.MeshStandardMaterial({
    color: 0x9a9aa6,
    metalness: 1.0,
    roughness: 0.18,
  });
}

// ── Procedural geometry builders ──────────────────────────────────────────
function buildPlate(): THREE.Group {
  const g = new THREE.Group();
  const rubber = rubberMat();
  const chrome = chromeMat();
  const metal = metalMat();
  // Outer disc.
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.34, 56), rubber);
  disc.rotation.x = Math.PI / 2;
  g.add(disc);
  // Chrome rim ring (silver edge highlight).
  const rim = new THREE.Mesh(new THREE.TorusGeometry(1.58, 0.06, 16, 60), chrome);
  g.add(rim);
  // Raised inner hub.
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.42, 40), metal);
  hub.rotation.x = Math.PI / 2;
  g.add(hub);
  // Center bore ring.
  const bore = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.07, 14, 36), chrome);
  g.add(bore);
  return g;
}

function buildDumbbell(): THREE.Group {
  const g = new THREE.Group();
  const metal = metalMat();
  const chrome = chromeMat();
  // Handle.
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 1.9, 24), chrome);
  handle.rotation.z = Math.PI / 2;
  g.add(handle);
  // Two bell heads (stacked plate look via fat rounded cylinders).
  for (const x of [-1.05, 1.05]) {
    const head = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.7, 40), metal);
    head.rotation.z = Math.PI / 2;
    head.position.x = x;
    g.add(head);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.05, 14, 44), chrome);
    ring.rotation.y = Math.PI / 2;
    ring.position.x = x;
    g.add(ring);
  }
  return g;
}

function buildKettlebell(): THREE.Group {
  const g = new THREE.Group();
  const metal = metalMat();
  // Bell body.
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.95, 40, 32), metal);
  body.scale.y = 0.92;
  g.add(body);
  // Handle (torus arc on top).
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.13, 18, 40, Math.PI), metal);
  handle.position.y = 0.78;
  handle.rotation.z = Math.PI;
  g.add(handle);
  return g;
}

function buildRing(radius: number): THREE.Mesh {
  // Thin holographic ring — emissive violet, additive, translucent.
  const mat = new THREE.MeshBasicMaterial({
    color: 0x7a4cff,
    transparent: true,
    opacity: 0.0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  return new THREE.Mesh(new THREE.TorusGeometry(radius, 0.012, 12, 160), mat);
}

const HeroThreeOverlay = forwardRef<HeroOverlayHandle, { className?: string }>(
  function HeroThreeOverlay({ className }, ref) {
    const mountRef = useRef<HTMLDivElement | null>(null);

    // Scroll progress (target) + smoothed values live in refs so the imperative
    // handle and the render loop share them without re-rendering React.
    const targetP = useRef(0);
    const smoothP = useRef(0); // most objects
    const heavyP = useRef(0); // kettlebell (slower → heavier feel)
    const pulseRef = useRef(0);
    const mouse = useRef({ x: 0, y: 0, sx: 0, sy: 0 });

    useImperativeHandle(ref, () => ({
      setProgress: (p: number) => {
        targetP.current = Math.max(0, Math.min(1, p));
      },
      pulse: () => {
        pulseRef.current = 1;
      },
    }));

    useEffect(() => {
      const mount = mountRef.current;
      if (!mount) return;

      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const isMobile = window.matchMedia("(max-width: 767px)").matches;
      // Disable the overlay entirely on mobile for performance.
      if (isMobile) return;

      let width = mount.clientWidth || window.innerWidth;
      let height = mount.clientHeight || window.innerHeight;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
      camera.position.set(0, 0, 8);

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(width, height);
      renderer.setClearColor(0x000000, 0);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      mount.appendChild(renderer.domElement);
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";

      // ── Lighting: low ambient + silver key + violet rim ──────────────────
      scene.add(new THREE.AmbientLight(0x3a3a44, 0.9));
      const key = new THREE.DirectionalLight(0xdfe2ff, 2.1);
      key.position.set(4, 5, 6);
      scene.add(key);
      const fill = new THREE.DirectionalLight(0x9aa0c0, 0.7);
      fill.position.set(-6, -2, 4);
      scene.add(fill);
      const rim = new THREE.PointLight(0x7a4cff, 16, 40, 2);
      rim.position.set(-3, 1, -5);
      scene.add(rim);
      const rim2 = new THREE.PointLight(0x7a4cff, 10, 40, 2);
      rim2.position.set(4, -2, -4);
      scene.add(rim2);

      // ── Build objects ────────────────────────────────────────────────────
      const root = new THREE.Group();
      scene.add(root);

      type Tracked = { group: THREE.Group; spec: ObjSpec; base: THREE.Vector3 };
      const tracked: Tracked[] = [];
      const disposables: Array<THREE.BufferGeometry | THREE.Material> = [];

      for (const spec of OBJECTS) {
        const g =
          spec.kind === "plate"
            ? buildPlate()
            : spec.kind === "dumbbell"
              ? buildDumbbell()
              : buildKettlebell();
        g.position.set(...spec.pos);
        g.rotation.set(...spec.rot);
        g.scale.setScalar(spec.scale);
        root.add(g);
        tracked.push({ group: g, spec, base: new THREE.Vector3(...spec.pos) });
        g.traverse((o) => {
          if (o instanceof THREE.Mesh) {
            disposables.push(o.geometry);
            if (Array.isArray(o.material)) disposables.push(...o.material);
            else disposables.push(o.material);
          }
        });
      }

      // Rings around the central athlete area — lowered + tilted so they read
      // as around the torso, never across the face.
      const ringGroup = new THREE.Group();
      ringGroup.position.set(0, -0.4, 0);
      const ring1 = buildRing(2.9);
      const ring2 = buildRing(3.5);
      ring1.rotation.set(1.15, 0.0, 0);
      ring2.rotation.set(1.35, 0.4, 0);
      ringGroup.add(ring1, ring2);
      scene.add(ringGroup);
      disposables.push(ring1.geometry, ring1.material as THREE.Material);
      disposables.push(ring2.geometry, ring2.material as THREE.Material);
      const ringMat1 = ring1.material as THREE.MeshBasicMaterial;
      const ringMat2 = ring2.material as THREE.MeshBasicMaterial;

      // Faint particles.
      const particleCount = 80;
      const pGeo = new THREE.BufferGeometry();
      const pPos = new Float32Array(particleCount * 3);
      for (let i = 0; i < particleCount; i++) {
        pPos[i * 3] = (Math.random() - 0.5) * 14;
        pPos[i * 3 + 1] = (Math.random() - 0.5) * 9;
        pPos[i * 3 + 2] = (Math.random() - 0.5) * 6 - 1;
      }
      pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
      const pMat = new THREE.PointsMaterial({
        color: 0xb9aaff,
        size: 0.03,
        transparent: true,
        opacity: 0.0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const particles = new THREE.Points(pGeo, pMat);
      scene.add(particles);
      disposables.push(pGeo, pMat);

      // ── Mouse parallax (overlay only) ────────────────────────────────────
      const onMouse = (e: MouseEvent) => {
        mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.current.y = (e.clientY / window.innerHeight) * 2 - 1;
      };
      window.addEventListener("mousemove", onMouse);

      // ── Resize ───────────────────────────────────────────────────────────
      const ro = new ResizeObserver(() => {
        width = mount.clientWidth || width;
        height = mount.clientHeight || height;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      });
      ro.observe(mount);

      // ── Pause when hero is offscreen ─────────────────────────────────────
      let visible = true;
      const io = new IntersectionObserver(
        (entries) => {
          visible = entries[0]?.isIntersecting ?? true;
        },
        { threshold: 0 }
      );
      io.observe(mount);

      // ── Render loop ──────────────────────────────────────────────────────
      let raf = 0;
      let t = 0;

      const renderFrame = () => {
        // Smooth scroll → motion with inertia (heavier lag for kettlebell).
        smoothP.current += (targetP.current - smoothP.current) * (reduce ? 1 : 0.09);
        heavyP.current += (targetP.current - heavyP.current) * (reduce ? 1 : 0.05);
        // Smooth mouse.
        mouse.current.sx += (mouse.current.x - mouse.current.sx) * 0.06;
        mouse.current.sy += (mouse.current.y - mouse.current.sy) * 0.06;
        // Pulse decay.
        if (pulseRef.current > 0.001) pulseRef.current *= 0.9;
        else pulseRef.current = 0;

        const p = smoothP.current;
        const drive = driveFromProgress(p);
        const driveHeavy = driveFromProgress(heavyP.current);
        const peak = smoothstep(0.6, 0.9, p); // peak-phase factor
        const openOut = ramp(0.9, 1.0, p); // open-up outward drift
        const breath = reduce ? 0 : Math.sin(t * 0.7) * 0.012; // frozen breathing
        const frozen = 1 - smoothstep(0.0, 0.15, p);
        const vib = pulseRef.current * Math.sin(t * 40) * 0.01;

        for (const { group, spec, base } of tracked) {
          const d = spec.heavy ? driveHeavy : drive;
          const sign = spec.dir;
          // Rotation — slow, heavy, scroll-driven (no fast spin).
          const spin =
            spec.kind === "plate"
              ? d * INTENSITY.plateSpin
              : spec.kind === "dumbbell"
                ? d * INTENSITY.dumbbellTilt
                : d * INTENSITY.kettlebellSpin;
          group.rotation.z = spec.rot[2] + sign * spin + breath * frozen * spec.amp;
          group.rotation.x = spec.rot[0] + Math.sin(d * 1.3) * 0.12 * spec.amp;
          group.rotation.y = spec.rot[1] + sign * d * 0.18;

          // Peak orbit — small controlled circular drift, foreground moves more.
          const orbAng = d * 1.4 * sign;
          const orbR = peak * INTENSITY.orbit * spec.amp;
          const ox = Math.cos(orbAng) * orbR;
          const oy = Math.sin(orbAng) * orbR;
          // Open-up outward drift along the object's own direction from center.
          const outX = Math.sign(base.x || 1) * openOut * 0.6 * spec.amp;
          const outY = Math.sign(base.y || 1) * openOut * 0.25 * spec.amp;
          // Mouse parallax — foreground (depth 1) reacts more.
          const par = MOUSE_PARALLAX * spec.depth;

          group.position.x = base.x + ox + outX + mouse.current.sx * par + vib;
          group.position.y = base.y + oy + outY - mouse.current.sy * par * 0.6;
          group.position.z = base.z;
        }

        // Rings — fade in during activation, rotate more at peak.
        const ringOpacity = smoothstep(0.12, 0.32, p) * (1 - 0.3 * openOut);
        const ringBoost = peak * 0.25 + pulseRef.current * 0.5;
        ringMat1.opacity = Math.min(0.85, ringOpacity * 0.7 + ringBoost);
        ringMat2.opacity = Math.min(0.7, ringOpacity * 0.55 + ringBoost * 0.8);
        ringGroup.rotation.z = drive * INTENSITY.ringSpin;
        ring1.rotation.z = drive * 0.9;
        ring2.rotation.z = -drive * 1.1;
        // Subtle ring parallax.
        ringGroup.position.x = mouse.current.sx * 0.12;

        // Particles — barely there, a touch stronger at peak.
        pMat.opacity = 0.12 + peak * 0.16 + pulseRef.current * 0.1;
        particles.rotation.y = drive * 0.15 + mouse.current.sx * 0.05;
        particles.rotation.z = t * 0.005;

        renderer.render(scene, camera);

        if (!reduce) {
          t += 0.016;
          if (visible) raf = requestAnimationFrame(renderFrame);
          else raf = requestAnimationFrame(() => {
            // Idle low-rate poll so it resumes when scrolled back in.
            setTimeout(() => (raf = requestAnimationFrame(renderFrame)), 150);
          });
        }
      };

      if (reduce) {
        // Static resting frame at a gentle activated state.
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

    return <div ref={mountRef} className={className} aria-hidden />;
  }
);

export default HeroThreeOverlay;
