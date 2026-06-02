"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import * as THREE from "three";

const HERO_IMAGE = "/hero%20site%20new";
const NAV = ["Programme", "Über uns", "Mitgliedschaft", "Coaching", "Kontakt"] as const;

export default function CinematicHero() {
  const root = useRef<HTMLElement | null>(null);
  const cta = useRef<HTMLAnchorElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  /* =========================================================
     THREE.JS — particle energy field
  ========================================================= */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof window === "undefined") return;

    const W = canvas.offsetWidth || window.innerWidth;
    const H = canvas.offsetHeight || window.innerHeight;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 200);
    camera.position.set(0, 0, 7);

    /* --- Particle geometry --- */
    const COUNT = window.innerWidth < 768 ? 2500 : 6000;
    const positions = new Float32Array(COUNT * 3);
    const colors    = new Float32Array(COUNT * 3);
    const sizes     = new Float32Array(COUNT);

    // Purple energy palette
    const palette = [
      new THREE.Color("#7a4cff"),
      new THREE.Color("#7a4cff"),
      new THREE.Color("#5f30c3"),
      new THREE.Color("#5f30c3"),
      new THREE.Color("#c9b8ff"),
      new THREE.Color("#c9b8ff"),
      new THREE.Color("#a07fff"),
      new THREE.Color("#ffffff"),
    ];

    for (let i = 0; i < COUNT; i++) {
      // Spread wide across the viewport, clustered toward center
      const spread = i < COUNT * 0.7 ? 14 : 22;
      positions[i * 3]     = (Math.random() - 0.5) * spread;
      positions[i * 3 + 1] = (Math.random() - 0.5) * spread * 0.65;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 12;

      const c = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3]     = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;

      // Mix of micro dots and larger glowing orbs
      const roll = Math.random();
      sizes[i] = roll < 0.6 ? Math.random() * 0.8 + 0.2
               : roll < 0.9 ? Math.random() * 2.0 + 0.8
               :               Math.random() * 4.0 + 2.0;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aColor",   new THREE.BufferAttribute(colors, 3));
    geo.setAttribute("aSize",    new THREE.BufferAttribute(sizes, 1));

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime:   { value: 0 },
        uMouse:  { value: new THREE.Vector2(0, 0) },
        uScroll: { value: 0 },
      },
      vertexShader: `
        attribute vec3 aColor;
        attribute float aSize;
        uniform float uTime;
        uniform vec2 uMouse;
        uniform float uScroll;
        varying vec3 vColor;
        varying float vDist;

        void main() {
          vColor = aColor;
          vec3 p = position;

          // Organic drift — layered sin/cos
          float t = uTime * 0.35;
          p.x += sin(p.y * 0.42 + t * 1.1) * 0.55
               + cos(p.z * 0.3  + t * 0.7) * 0.35;
          p.y += cos(p.x * 0.38 + t * 0.9) * 0.45
               + sin(p.z * 0.25 + t * 0.6) * 0.3;
          p.z += sin(p.x * 0.3  + t * 0.8) * 0.25;

          // Mouse parallax — particles react to cursor
          p.x += uMouse.x * (1.5 - abs(position.z) * 0.12);
          p.y += uMouse.y * (1.0 - abs(position.z) * 0.12);

          // Scroll: camera pushes forward into the field
          p.z -= uScroll * 5.5;

          vec4 mvPos = modelViewMatrix * vec4(p, 1.0);
          vDist = clamp(1.0 - length(mvPos.xyz) / 14.0, 0.0, 1.0);

          gl_PointSize = clamp(aSize * (160.0 / max(-mvPos.z, 1.0)), 1.0, 80.0);
          gl_Position  = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vDist;

        void main() {
          vec2 uv = gl_PointCoord - 0.5;
          float r  = length(uv);
          if (r > 0.5) discard;

          // Soft glow falloff
          float core = 1.0 - smoothstep(0.0, 0.28, r);
          float halo = 1.0 - smoothstep(0.28, 0.5,  r);
          float alpha = (core * 0.95 + halo * 0.45) * vDist;

          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      vertexColors: false,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const points = new THREE.Points(geo, mat);
    scene.add(points);

    /* --- Mouse --- */
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    const onMouse = (e: MouseEvent) => {
      mouse.tx = (e.clientX / window.innerWidth  - 0.5) * 2.2;
      mouse.ty = -(e.clientY / window.innerHeight - 0.5) * 1.4;
    };
    window.addEventListener("mousemove", onMouse);

    /* --- Scroll --- */
    let scrollVal = 0;
    const onScroll = () => {
      scrollVal = Math.min(window.scrollY / window.innerHeight, 1);
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    /* --- Resize --- */
    const onResize = () => {
      const w = canvas.offsetWidth, h = canvas.offsetHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    /* --- Loop --- */
    let rafId: number;
    const clock = new THREE.Clock();
    const animate = () => {
      rafId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      mouse.x += (mouse.tx - mouse.x) * 0.04;
      mouse.y += (mouse.ty - mouse.y) * 0.04;

      mat.uniforms.uTime.value   = t;
      mat.uniforms.uMouse.value.set(mouse.x, mouse.y);
      mat.uniforms.uScroll.value = scrollVal;

      // Slow rotation — gives a living, breathing feel
      points.rotation.y = t * 0.018 + mouse.x * 0.08;
      points.rotation.x = Math.sin(t * 0.012) * 0.08 + mouse.y * 0.04;

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      geo.dispose();
      mat.dispose();
    };
  }, []);

  /* =========================================================
     GSAP — hero text + scroll
  ========================================================= */
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cleanups: Array<() => void> = [];

    const ctx = gsap.context(() => {
      /* ---- Reduced motion: show everything ---- */
      if (reduce) {
        gsap.set("[data-rv]", { opacity: 1, y: 0, scale: 1, clipPath: "inset(0% 0%)" });
        gsap.set("[data-line]", { clipPath: "inset(0% 0%)", yPercent: 0 });
        gsap.set("[data-textglow]", { opacity: 1, scale: 1 });
        return;
      }

      /* ---- Initial states ---- */
      gsap.set("[data-line]", { clipPath: "inset(0% 0% 100% 0%)", yPercent: 140, scale: 1.2, filter: "blur(28px)" });
      gsap.set("[data-textglow]", { opacity: 0, scale: 0.4 });
      gsap.set("[data-eyebrow]", { opacity: 0, y: 30, filter: "blur(12px)" });
      gsap.set("[data-cta]", { opacity: 0, y: 50, filter: "blur(12px)" });
      gsap.set("[data-brandmark]", { opacity: 0, y: -20 });
      gsap.set("[data-navitem]", { opacity: 0, y: -16 });
      gsap.set("[data-scrollcue]", { opacity: 0 });
      gsap.set("[data-burst]", { scale: 1.22, opacity: 0 });

      /* ---- Load-in sequence ---- */
      const tl = gsap.timeline({ delay: 0.1 });
      tl
        // Background image scales into place
        .to("[data-burst]", { scale: 1, opacity: 1, duration: 2.4, ease: "power2.out" }, 0)
        // Nav
        .to("[data-brandmark]", { opacity: 1, y: 0, duration: 0.9, ease: "power3.out" }, 0.2)
        .to("[data-navitem]", { opacity: 1, y: 0, duration: 0.8, ease: "power3.out", stagger: 0.07 }, 0.25)
        // Purple glow blooms — big and obvious
        .to("[data-textglow]", { opacity: 1, scale: 1, duration: 1.8, ease: "power2.out" }, 0.5)
        // Eyebrow
        .to("[data-eyebrow]", { opacity: 1, y: 0, filter: "blur(0px)", duration: 1.0, ease: "power3.out" }, 0.7)
        // HEADLINE — cinematic line reveal with massive blur clearing
        .to("[data-line]", {
          clipPath: "inset(0% 0% 0% 0%)",
          yPercent: 0,
          scale: 1,
          filter: "blur(0px)",
          duration: 1.4,
          ease: "expo.out",
          stagger: 0.2,
          onComplete: () => gsap.set("[data-line]", { clearProps: "filter" }),
        }, 0.85)
        // CTA
        .to("[data-cta]", { opacity: 1, y: 0, filter: "blur(0px)", duration: 1.0, ease: "expo.out",
          onComplete: () => gsap.set("[data-cta]", { clearProps: "filter" })
        }, 1.6)
        // Scroll cue
        .to("[data-scrollcue]", { opacity: 1, duration: 0.8 }, 2.1);

      /* ---- Scroll parallax on hero ---- */
      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: "bottom top",
          scrub: 0.5,
        },
      });
      scrollTl
        .to("[data-burst]",    { yPercent: 20, scale: 1.08, ease: "none" }, 0)
        .to("[data-copy]",     { yPercent: -14, opacity: 0, ease: "none" }, 0)
        .to("[data-textglow]", { yPercent: -20, opacity: 0, ease: "none" }, 0)
        .to("[data-vignette]", { opacity: 1, ease: "none" }, 0);

      /* ---- Pointer parallax ---- */
      const hover = window.matchMedia("(hover: hover)").matches;
      if (hover && root.current) {
        const rootEl = root.current;
        const qBX = gsap.quickTo("[data-burst]", "x", { duration: 1.0, ease: "power3.out" });
        const qBY = gsap.quickTo("[data-burst]", "y", { duration: 1.0, ease: "power3.out" });
        const qGX = gsap.quickTo("[data-textglow]", "x", { duration: 0.9, ease: "power3.out" });
        const qGY = gsap.quickTo("[data-textglow]", "y", { duration: 0.9, ease: "power3.out" });
        const onMove = (e: MouseEvent) => {
          const r  = rootEl.getBoundingClientRect();
          const nx = (e.clientX - r.left) / r.width  - 0.5;
          const ny = (e.clientY - r.top)  / r.height - 0.5;
          qBX(nx * -32);
          qBY(ny * -20);
          qGX(nx * 28);
          qGY(ny * 18);
        };
        rootEl.addEventListener("mousemove", onMove);
        cleanups.push(() => rootEl.removeEventListener("mousemove", onMove));
      }

      /* ---- CTA magnetic hover ---- */
      if (hover && cta.current) {
        const btn = cta.current;
        const onMove = (e: MouseEvent) => {
          const r  = btn.getBoundingClientRect();
          const dx = (e.clientX - (r.left + r.width  / 2)) * 0.38;
          const dy = (e.clientY - (r.top  + r.height / 2)) * 0.38;
          gsap.to(btn, { x: dx, y: dy, duration: 0.35, ease: "power2.out",
            boxShadow: "0 0 36px rgba(122,76,255,0.65)" });
        };
        const onLeave = () => {
          gsap.to(btn, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1, 0.5)",
            boxShadow: "0 0 0px rgba(122,76,255,0)" });
        };
        btn.addEventListener("mousemove", onMove);
        btn.addEventListener("mouseleave", onLeave);
        cleanups.push(() => {
          btn.removeEventListener("mousemove", onMove);
          btn.removeEventListener("mouseleave", onLeave);
        });
      }
    }, root);

    const refreshT = setTimeout(() => ScrollTrigger.refresh(), 700);
    if (document.fonts?.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());

    return () => {
      clearTimeout(refreshT);
      cleanups.forEach((c) => c());
      ctx.revert();
    };
  }, []);

  return (
    <section
      ref={root}
      className="relative h-screen min-h-[640px] w-full overflow-hidden bg-[#050308] text-[#f4f1f7]"
    >
      {/* Background image */}
      <div
        data-burst
        className="absolute inset-0 z-0"
        style={{ willChange: "transform, opacity" }}
      >
        <div
          className="absolute inset-0 bg-cover md:bg-[position:72%_50%]"
          style={{ backgroundImage: `url('${HERO_IMAGE}')`, backgroundPosition: "center" }}
        />
      </div>

      {/* Left gradient — masks baked reference text */}
      <div
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background:
            "linear-gradient(90deg, #050308 0%, #050308 40%, rgba(5,3,8,0.90) 52%, rgba(5,3,8,0.50) 66%, rgba(5,3,8,0.14) 78%, transparent 90%)",
        }}
      />
      {/* Top/bottom grade */}
      <div
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background:
            "linear-gradient(180deg, rgba(5,3,8,0.65) 0%, transparent 22%, transparent 65%, rgba(5,3,8,0.88) 100%)",
        }}
      />

      {/* THREE.JS CANVAS — energy particle field */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 z-[3]"
        style={{
          width: "100%",
          height: "100%",
          mixBlendMode: "screen",
          willChange: "transform",
        }}
      />

      {/* Purple glow bloom behind the headline — visible, strong */}
      <div
        data-textglow
        aria-hidden
        className="pointer-events-none absolute z-[4]"
        style={{
          left: "-10%",
          top: "50%",
          transform: "translateY(-50%)",
          width: "72vw",
          height: "70vh",
          background:
            "radial-gradient(ellipse at 30% 50%, rgba(122,76,255,0.65) 0%, rgba(95,48,195,0.30) 30%, rgba(95,48,195,0.08) 60%, transparent 75%)",
          filter: "blur(28px)",
          willChange: "transform, opacity",
        }}
      />

      {/* Vignette */}
      <div
        data-vignette
        className="pointer-events-none absolute inset-0 z-[5] opacity-40"
        style={{
          background:
            "radial-gradient(130% 100% at 62% 44%, transparent 38%, rgba(0,0,0,0.55) 72%, rgba(0,0,0,0.90) 100%)",
        }}
      />

      {/* Grain */}
      <div
        className="pointer-events-none absolute inset-0 z-[6] opacity-[0.05] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.5'/></svg>\")",
          backgroundSize: "180px 180px",
        }}
      />

      {/* NAV */}
      <header className="absolute inset-x-0 top-0 z-[20] flex items-center justify-between px-6 py-7 md:px-12 md:py-8">
        <a
          data-brandmark
          href="#"
          className="font-display text-[#f4f1f7]"
          style={{ fontSize: "clamp(18px,1.8vw,24px)", letterSpacing: "0.02em", lineHeight: 1 }}
        >
          SMILEFIT
        </a>
        <nav className="hidden items-center gap-9 md:flex" style={{ fontFamily: "Helvetica Neue,Helvetica,Arial,sans-serif" }}>
          {NAV.map((item) => (
            <a
              key={item}
              data-navitem
              href="#"
              className="text-[11px] font-[600] uppercase tracking-[0.20em] text-[#f4f1f7]/70 transition-colors hover:text-[#f4f1f7]"
            >
              {item}
            </a>
          ))}
          <span data-navitem className="ml-1 flex flex-col gap-[5px]">
            <span className="block h-[1.5px] w-6 bg-[#f4f1f7]/80" />
            <span className="block h-[1.5px] w-6 bg-[#f4f1f7]/80" />
          </span>
        </nav>
        <button data-navitem aria-label="Menu" className="flex flex-col gap-[5px] md:hidden">
          <span className="block h-[1.5px] w-6 bg-[#f4f1f7]/80" />
          <span className="block h-[1.5px] w-6 bg-[#f4f1f7]/80" />
        </button>
      </header>

      {/* COPY BLOCK */}
      <div
        data-copy
        className="absolute inset-y-0 left-0 z-[10] flex max-w-[860px] flex-col justify-center px-6 md:px-12 lg:px-20"
        style={{ willChange: "transform, opacity" }}
      >
        <p
          data-eyebrow
          className="mb-7 flex items-center gap-3"
          style={{
            fontFamily: "Helvetica Neue,Helvetica,Arial,sans-serif",
            fontSize: "clamp(10px,1.0vw,13px)",
            letterSpacing: "0.28em",
            fontWeight: 600,
            color: "rgba(244,241,247,0.80)",
          }}
        >
          <span className="inline-block h-px w-8" style={{ background: "rgba(122,76,255,0.8)" }} />
          BRING BACK YOUR PRIME, ONE MORE TIME.
        </p>

        <h1
          className="font-display"
          style={{
            fontSize: "clamp(52px,8.5vw,124px)",
            lineHeight: 0.88,
            letterSpacing: "-0.03em",
            color: "#f7f4fb",
          }}
        >
          <span className="block overflow-hidden">
            <span data-line className="block whitespace-nowrap" style={{ willChange: "transform, filter" }}>
              You&rsquo;re not
            </span>
          </span>
          <span className="block overflow-hidden">
            <span data-line className="block whitespace-nowrap" style={{ willChange: "transform, filter" }}>
              done yet.
            </span>
          </span>
        </h1>

        <div data-cta className="mt-11 flex items-center gap-6 md:mt-14" style={{ willChange: "transform, opacity" }}>
          <a
            ref={cta}
            href="#mitgliedschaft"
            className="group relative inline-flex items-center gap-4 overflow-hidden border px-9 py-5"
            style={{
              fontFamily: "Helvetica Neue,Helvetica,Arial,sans-serif",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.24em",
              textTransform: "uppercase",
              color: "#f4f1f7",
              borderColor: "rgba(244,241,247,0.55)",
              willChange: "transform, box-shadow",
            }}
          >
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(100% 120% at 50% 110%, rgba(122,76,255,0.45), transparent 65%)",
              }}
            />
            <span className="relative">Starte deine Reise</span>
            <span aria-hidden className="relative transition-transform duration-500 group-hover:translate-x-2">→</span>
          </a>
        </div>
      </div>

      {/* Scroll cue */}
      <div
        data-scrollcue
        className="absolute bottom-8 left-1/2 z-[10] hidden -translate-x-1/2 flex-col items-center gap-2 md:flex"
        style={{ fontFamily: "Helvetica Neue,Helvetica,Arial,sans-serif", color: "rgba(244,241,247,0.45)" }}
      >
        <span style={{ fontSize: "9px", letterSpacing: "0.32em", textTransform: "uppercase" }}>Scroll</span>
        <span className="relative block h-10 w-px overflow-hidden" style={{ background: "rgba(244,241,247,0.12)" }}>
          <span className="animate-scroll-cue absolute inset-x-0 top-0 h-1/3 bg-[#f4f1f7]" />
        </span>
      </div>
    </section>
  );
}
