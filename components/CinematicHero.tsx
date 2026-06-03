"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useScroll,
  useTransform,
} from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const HERO_IMAGE = "/hero%20site%20new";
const NAV = ["Programme", "Über uns", "Mitgliedschaft", "Coaching", "Kontakt"] as const;

/* ─── Split text into character spans ─── */
function SplitChars({
  text,
  baseDelay = 0,
  className = "",
}: {
  text: string;
  baseDelay?: number;
  className?: string;
}) {
  return (
    <>
      {text.split("").map((char, i) => (
        <span
          key={i}
          className="inline-block overflow-hidden"
          aria-hidden
          style={{ verticalAlign: "top" }}
        >
          <motion.span
            className={`inline-block ${className}`}
            initial={{ y: "110%" }}
            animate={{ y: "0%" }}
            transition={{
              delay: baseDelay + i * 0.025,
              duration: 0.9,
              ease: [0.22, 1, 0.36, 1],
            }}
            style={{ display: "inline-block" }}
          >
            {char === " " ? " " : char}
          </motion.span>
        </span>
      ))}
    </>
  );
}

/* ─── Custom cursor ─── */
function HeroCursor({ heroRef }: { heroRef: React.RefObject<HTMLElement | null> }) {
  const cursorRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<"default" | "cta" | "figure">("default");
  const pos = useRef({ x: -200, y: -200 });
  const lerped = useRef({ x: -200, y: -200 });
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;

    const onMove = (e: MouseEvent) => {
      pos.current = { x: e.clientX, y: e.clientY };
    };

    const loop = () => {
      lerped.current.x += (pos.current.x - lerped.current.x) * 0.15;
      lerped.current.y += (pos.current.y - lerped.current.y) * 0.15;
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate(${lerped.current.x}px, ${lerped.current.y}px) translate(-50%, -50%)`;
      }
      raf.current = requestAnimationFrame(loop);
    };

    hero.addEventListener("mousemove", onMove);

    const ctaEls = hero.querySelectorAll("[data-cursor-cta]");
    const figEls = hero.querySelectorAll("[data-cursor-figure]");

    const enterCta = () => setMode("cta");
    const enterFig = () => setMode("figure");
    const reset = () => setMode("default");

    ctaEls.forEach((el) => {
      el.addEventListener("mouseenter", enterCta);
      el.addEventListener("mouseleave", reset);
    });
    figEls.forEach((el) => {
      el.addEventListener("mouseenter", enterFig);
      el.addEventListener("mouseleave", reset);
    });

    raf.current = requestAnimationFrame(loop);

    return () => {
      hero.removeEventListener("mousemove", onMove);
      ctaEls.forEach((el) => {
        el.removeEventListener("mouseenter", enterCta);
        el.removeEventListener("mouseleave", reset);
      });
      figEls.forEach((el) => {
        el.removeEventListener("mouseenter", enterFig);
        el.removeEventListener("mouseleave", reset);
      });
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [heroRef]);

  const size =
    mode === "cta" ? 64 : mode === "figure" ? 80 : 8;
  const isRing = mode === "figure";

  return (
    <motion.div
      ref={cursorRef}
      className="pointer-events-none fixed z-[9999]"
      style={{ top: 0, left: 0 }}
      animate={{
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: isRing ? "transparent" : "#f4f1f7",
        border: isRing ? "1.5px solid #f4f1f7" : "none",
        mixBlendMode: "difference",
      }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
    />
  );
}

export default function CinematicHero() {
  const root = useRef<HTMLElement | null>(null);
  const figureRef = useRef<HTMLDivElement | null>(null);
  const cta = useRef<HTMLAnchorElement | null>(null);
  const [reveal, setReveal] = useState(false);
  const [reduced, setReduced] = useState(false);

  /* ─── Framer Motion scroll-out mask ─── */
  const { scrollYProgress } = useScroll({
    target: root,
    offset: ["start start", "end start"],
  });
  const maskHeight = useTransform(scrollYProgress, [0, 1], ["0vh", "100vh"]);

  /* ─── Mouse parallax for figure (Framer Motion springs) ─── */
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const springX = useSpring(rawX, { stiffness: 50, damping: 20 });
  const springY = useSpring(rawY, { stiffness: 50, damping: 20 });
  const figureRotateY = useTransform(springX, [-1, 1], [-3, 3]);

  /* ─── Scroll parallax for figure (translateY 0.3×) ─── */
  const figureY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);

  /* ─── Figure X from spring (derived at top level) ─── */
  const figureX = useTransform(springX, (v) => v * 8);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);

    // Trigger character reveal after mount
    const t = setTimeout(() => setReveal(true), 80);
    return () => clearTimeout(t);
  }, []);

  /* ─── Mouse parallax handler ─── */
  useEffect(() => {
    const hero = root.current;
    if (!hero) return;
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    if (isMobile || reduced) return;

    const onMove = (e: MouseEvent) => {
      const r = hero.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5;
      const ny = (e.clientY - r.top) / r.height - 0.5;
      rawX.set(nx * 2);
      rawY.set(ny * 2);
    };
    hero.addEventListener("mousemove", onMove);
    return () => hero.removeEventListener("mousemove", onMove);
  }, [rawX, rawY, reduced]);

  /* ─── GSAP: nav + eyebrow + CTA reveals + scroll parallax ─── */
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const cleanups: Array<() => void> = [];

    const ctx = gsap.context(() => {
      if (reduced) {
        gsap.set("[data-rv]", { opacity: 1, y: 0 });
        gsap.set("[data-eyebrow]", { opacity: 1, y: 0 });
        gsap.set("[data-cta]", { opacity: 1, y: 0 });
        gsap.set("[data-brandmark]", { opacity: 1, y: 0 });
        gsap.set("[data-navitem]", { opacity: 1, y: 0 });
        gsap.set("[data-scrollcue]", { opacity: 1 });
        return;
      }

      gsap.set("[data-eyebrow]", { opacity: 0, y: 24, filter: "blur(8px)" });
      gsap.set("[data-cta]", { opacity: 0, y: 40, filter: "blur(8px)" });
      gsap.set("[data-brandmark]", { opacity: 0, y: -16 });
      gsap.set("[data-navitem]", { opacity: 0, y: -12 });
      gsap.set("[data-scrollcue]", { opacity: 0 });
      gsap.set("[data-burst]", { scale: 1.18, opacity: 0 });

      const tl = gsap.timeline({ delay: 0.05 });
      tl
        .to("[data-burst]", { scale: 1, opacity: 1, duration: 2.2, ease: "power2.out" }, 0)
        .to("[data-brandmark]", { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }, 0.15)
        .to("[data-navitem]", { opacity: 1, y: 0, duration: 0.7, ease: "power3.out", stagger: 0.06 }, 0.2)
        .to("[data-eyebrow]", { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.9, ease: "power3.out",
            onComplete: () => gsap.set("[data-eyebrow]", { clearProps: "filter" }) }, 0.55)
        .to("[data-cta]", { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.9, ease: "expo.out",
            onComplete: () => gsap.set("[data-cta]", { clearProps: "filter" }) }, 1.7)
        .to("[data-scrollcue]", { opacity: 1, duration: 0.8 }, 2.2);

      /* Scroll parallax on copy block */
      gsap.timeline({
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: "bottom top",
          scrub: 0.5,
        },
      })
        .to("[data-copy]", { yPercent: -12, opacity: 0, ease: "none" }, 0)
        .to("[data-burst]", { yPercent: 18, scale: 1.06, ease: "none" }, 0);

      /* CTA magnetic hover */
      const hover = window.matchMedia("(hover: hover)").matches;
      if (hover && cta.current) {
        const btn = cta.current;
        const onMove = (e: MouseEvent) => {
          const r = btn.getBoundingClientRect();
          gsap.to(btn, {
            x: (e.clientX - (r.left + r.width / 2)) * 0.35,
            y: (e.clientY - (r.top + r.height / 2)) * 0.35,
            duration: 0.3, ease: "power2.out",
            boxShadow: "0 0 32px rgba(122,76,255,0.6)",
          });
        };
        const onLeave = () =>
          gsap.to(btn, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1,0.5)", boxShadow: "0 0 0 rgba(122,76,255,0)" });
        btn.addEventListener("mousemove", onMove);
        btn.addEventListener("mouseleave", onLeave);
        cleanups.push(() => {
          btn.removeEventListener("mousemove", onMove);
          btn.removeEventListener("mouseleave", onLeave);
        });
      }
    }, root);

    const refreshT = setTimeout(() => ScrollTrigger.refresh(), 600);
    if (document.fonts?.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());

    return () => {
      clearTimeout(refreshT);
      cleanups.forEach((c) => c());
      ctx.revert();
    };
  }, [reduced]);

  /* ─── Char reveal timing ─── */
  // line 1: "YOU'RE NOT" (10 chars), line 2: " DONE YET." (10 chars)
  const line1 = "YOU'RE NOT";
  const line2 = " DONE YET.";
  const eyebrowDelay = 0.4;
  const line1Delay = 0.75;
  const line2Delay = line1Delay + line1.length * 0.025 + 0.08;

  return (
    <section
      ref={root}
      className="relative h-screen min-h-[640px] w-full overflow-hidden bg-[#050308] text-[#f4f1f7]"
      style={{ cursor: "none" }}
    >
      {/* Custom cursor — desktop only */}
      <HeroCursor heroRef={root} />

      {/* ── Volumetric haze blobs ── */}
      <div className="pointer-events-none absolute inset-0 z-[2]" aria-hidden>
        {/* Blob A — large warm purple, drifts on Lissajous-style path */}
        <motion.div
          className="absolute"
          style={{
            width: "70vw",
            height: "70vw",
            borderRadius: "50%",
            background:
              "radial-gradient(ellipse at 50% 50%, rgba(122,76,255,0.55) 0%, rgba(95,48,195,0.22) 40%, transparent 70%)",
            filter: "blur(180px)",
            top: "-10%",
            left: "-15%",
          }}
          animate={reduced ? {} : {
            x: [0, 60, -40, 80, 0],
            y: [0, 80, 160, 60, 0],
          }}
          transition={{ duration: 40, ease: "linear", repeat: Infinity }}
        />
        {/* Blob B — cooler blue-purple, opposite phase */}
        <motion.div
          className="absolute"
          style={{
            width: "55vw",
            height: "55vw",
            borderRadius: "50%",
            background:
              "radial-gradient(ellipse at 50% 50%, rgba(160,127,255,0.38) 0%, rgba(122,76,255,0.14) 45%, transparent 70%)",
            filter: "blur(180px)",
            bottom: "-15%",
            right: "-10%",
          }}
          animate={reduced ? {} : {
            x: [0, -70, 40, -50, 0],
            y: [0, -60, -130, -40, 0],
          }}
          transition={{ duration: 60, ease: "linear", repeat: Infinity }}
        />
      </div>

      {/* Background hero image */}
      <div
        data-burst
        className="absolute inset-0 z-0"
        style={{ willChange: "transform, opacity" }}
      >
        <div
          data-cursor-figure
          className="absolute inset-0 bg-cover"
          style={{
            backgroundImage: `url('${HERO_IMAGE}')`,
            backgroundPosition: "center",
          }}
        />
      </div>

      {/* Figure container with mouse parallax + scroll parallax + rim-light */}
      <motion.div
        ref={figureRef}
        data-cursor-figure
        className="pointer-events-none absolute inset-0 z-[3]"
        style={{
          x: figureX,
          y: figureY,
          rotateY: figureRotateY,
          filter: "drop-shadow(-6px 0 24px rgba(122,76,255,0.55)) drop-shadow(6px 0 16px rgba(160,127,255,0.35))",
          willChange: "transform, filter",
        }}
        initial={reduced ? {} : { scale: 0.96, opacity: 0 }}
        animate={reduced ? {} : { scale: 1, opacity: 1 }}
        transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
      />

      {/* Left gradient */}
      <div
        className="pointer-events-none absolute inset-0 z-[4]"
        style={{
          background:
            "linear-gradient(90deg, #050308 0%, #050308 36%, rgba(5,3,8,0.88) 50%, rgba(5,3,8,0.45) 64%, rgba(5,3,8,0.10) 76%, transparent 90%)",
        }}
      />
      {/* Top/bottom grade */}
      <div
        className="pointer-events-none absolute inset-0 z-[4]"
        style={{
          background:
            "linear-gradient(180deg, rgba(5,3,8,0.55) 0%, transparent 20%, transparent 66%, rgba(5,3,8,0.88) 100%)",
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
        {/* Eyebrow */}
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

        {/* Headline — per-character split reveal */}
        <h1
          className="font-display"
          style={{
            fontSize: "clamp(52px,8.5vw,124px)",
            lineHeight: 0.88,
            letterSpacing: "-0.03em",
            color: "#f7f4fb",
          }}
          aria-label={`${line1} ${line2}`}
        >
          <span className="block">
            {reveal || reduced ? (
              <SplitChars text={line1} baseDelay={reduced ? 0 : line1Delay} />
            ) : null}
          </span>
          <span className="block">
            {reveal || reduced ? (
              <SplitChars text={line2} baseDelay={reduced ? 0 : line2Delay} />
            ) : null}
          </span>
        </h1>

        {/* CTA */}
        <div data-cta className="mt-11 flex items-center gap-6 md:mt-14" style={{ willChange: "transform, opacity" }}>
          <a
            ref={cta}
            data-cursor-cta
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

      {/* ── Scroll-out mask — top-anchored gradient grows to cover hero as user scrolls ── */}
      <motion.div
        className="pointer-events-none absolute inset-x-0 top-0 z-[30]"
        style={{
          height: maskHeight,
          background: "linear-gradient(to bottom, #000 0%, transparent 40%)",
        }}
      />
    </section>
  );
}
